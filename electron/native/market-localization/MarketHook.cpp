#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <intrin.h>
#include <atomic>
#include <array>
#include <memory>
#include <mutex>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <stdexcept>
#include <cstdio>
#include <cstring>
#include <algorithm>
#include <limits>
#include "MinHook.h"
#include "json.hpp"
#include "SupportedProfile.h"

namespace market {
using Json = nlohmann::ordered_json;
constexpr uint64_t PointerMask = 0x0000FFFFFFFFFFFFull;
constexpr uint32_t MaxPacket = 16 * 1024 * 1024;
using Lookup = void* (__fastcall*)(void*, const char*);
using SearchBuilder = void* (__fastcall*)(void*, void*);
using StringCtor = void* (__fastcall*)(void*, const char*, size_t);
using StringDtor = void (__fastcall*)(void*);
Lookup originalLookup = nullptr;
SearchBuilder originalBuilder = nullptr;
uintptr_t imageBase = 0;
std::atomic<bool> enabled{false};
std::atomic<uint64_t> displayHits{0}, searchHits{0};
std::atomic<uint64_t> fieldReads{0};
std::atomic<uint64_t> lookupCalls{0}, builderCalls{0};
bool hooksCreated = false;

// These reads are only used with the independently verified, versioned game ABI.
bool SafeRead(const void* from, void* to, size_t size) noexcept {
    if (!from || !to) return false;
    __try { memcpy(to, from, size); return true; }
    __except(EXCEPTION_EXECUTE_HANDLER) { return false; }
}
[[noreturn]] void StructureError(const char* reason) { throw std::runtime_error(std::string("市集结构无法确认兼容，已停止翻译：")+reason); }
void RequireStructure(bool valid,const char* reason) { if(!valid) StructureError(reason); }
struct MemorySection { std::string name; uint32_t rva,size,flags; };
struct CodeRange { uintptr_t begin,end; };
struct MemoryImage {
    const unsigned char* base;
    uint32_t size=0,timestamp=0; uint64_t preferredBase=0;
    std::vector<MemorySection> sections;
    MemorySection text{};
    std::vector<unsigned char> code;
    std::unordered_map<uint32_t,uint32_t> functions;
    IMAGE_DATA_DIRECTORY relocations{};
    bool Contains(uintptr_t rva,size_t length,bool executable=false,bool constant=false) const {
        if(rva>size || length>size-rva) return false;
        const MemorySection* found=nullptr;
        for(const auto& section:sections) if(rva>=section.rva && rva-section.rva<=section.size && length<=section.size-(rva-section.rva)) {
            if(found) return false; found=&section;
        }
        return found && (found->flags&IMAGE_SCN_MEM_READ) && (!executable || (found->name==".text" && (found->flags&IMAGE_SCN_MEM_EXECUTE) && !(found->flags&IMAGE_SCN_MEM_WRITE)))
            && (!constant || !(found->flags&(IMAGE_SCN_MEM_WRITE|IMAGE_SCN_MEM_EXECUTE)));
    }
    std::vector<unsigned char> Read(uintptr_t rva,size_t length,bool executable=false,bool constant=false) const {
        RequireStructure(Contains(rva,length,executable,constant),"资源地址或节权限已改变");
        std::vector<unsigned char> bytes(length);
        RequireStructure(!length || SafeRead(base+rva,bytes.data(),length),"无法可靠读取游戏映像"); return bytes;
    }
    MemoryImage(const unsigned char* start,size_t available) : base(start) {
        IMAGE_DOS_HEADER dos{}; IMAGE_NT_HEADERS64 nt{};
        RequireStructure(available>=sizeof(dos) && SafeRead(base,&dos,sizeof(dos)) && dos.e_magic==IMAGE_DOS_SIGNATURE,"DOS文件头无效");
        RequireStructure(available>=sizeof(nt) && dos.e_lfanew>0 && dos.e_lfanew<=1024*1024 && static_cast<size_t>(dos.e_lfanew)<=available-sizeof(nt)
            && SafeRead(base+dos.e_lfanew,&nt,sizeof(nt)),"PE文件头地址无效");
        RequireStructure(nt.Signature==IMAGE_NT_SIGNATURE && nt.FileHeader.Machine==IMAGE_FILE_MACHINE_AMD64 && nt.OptionalHeader.Magic==IMAGE_NT_OPTIONAL_HDR64_MAGIC
            && nt.FileHeader.NumberOfSections>=1 && nt.FileHeader.NumberOfSections<=96 && nt.FileHeader.SizeOfOptionalHeader>=sizeof(IMAGE_OPTIONAL_HEADER64)
            && nt.OptionalHeader.NumberOfRvaAndSizes>=6,"不是完整Windows x64映像");
        size=nt.OptionalHeader.SizeOfImage; timestamp=nt.FileHeader.TimeDateStamp; preferredBase=nt.OptionalHeader.ImageBase;
        RequireStructure(size>0 && size<=512*1024*1024 && size<=available && preferredBase>0,"PE映像范围无效");
        uintptr_t table=static_cast<uintptr_t>(dos.e_lfanew)+24+nt.FileHeader.SizeOfOptionalHeader;
        RequireStructure(table<=size && nt.FileHeader.NumberOfSections<=(size-table)/sizeof(IMAGE_SECTION_HEADER),"PE节目录越界");
        unsigned textCount=0;
        for(unsigned i=0;i<nt.FileHeader.NumberOfSections;i++) {
            IMAGE_SECTION_HEADER section{};
            RequireStructure(SafeRead(base+table+i*sizeof(section),&section,sizeof(section)),"PE节读取失败");
            char name[9]{}; memcpy(name,section.Name,8);
            MemorySection next{name,section.VirtualAddress,section.SizeOfRawData,section.Characteristics};
            RequireStructure(next.rva<=size && next.size<=size-next.rva,"PE节范围无效");
            for(const auto& prior:sections) RequireStructure(!next.size || !prior.size || uint64_t(next.rva)+next.size<=prior.rva || uint64_t(prior.rva)+prior.size<=next.rva,"PE节重叠");
            sections.push_back(next); if(next.name==".text") {text=next;textCount++;}
        }
        RequireStructure(textCount==1 && text.size>0 && text.size<=256*1024*1024,"缺少唯一代码节");
        code=Read(text.rva,text.size,true);
        const auto& exceptions=nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXCEPTION];
        RequireStructure(exceptions.VirtualAddress && exceptions.Size>0 && exceptions.Size<=12000000 && exceptions.Size%sizeof(RUNTIME_FUNCTION)==0,"函数边界目录无效");
        auto entries=Read(exceptions.VirtualAddress,exceptions.Size,false,true);
        for(size_t at=0;at<entries.size();at+=sizeof(RUNTIME_FUNCTION)) {
            RUNTIME_FUNCTION function{}; memcpy(&function,entries.data()+at,sizeof(function));
            RequireStructure(function.BeginAddress<function.EndAddress && function.EndAddress<=size
                && functions.emplace(function.BeginAddress,function.EndAddress).second,"函数边界目录重复或越界");
        }
        relocations=nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC];
        RequireStructure(relocations.Size<=16*1024*1024 && (!relocations.Size || relocations.VirtualAddress),"重定位目录无效");
    }
    uintptr_t Unique(const unsigned char* pattern,size_t length) const {
        RequireStructure(pattern && length && length<=code.size(),"指令指纹长度无效");
        size_t found=0,count=0,offset=0;
        while(offset<=code.size()-length) {
            const auto* candidate=static_cast<const unsigned char*>(memchr(code.data()+offset,pattern[0],code.size()-length-offset+1));
            if(!candidate) break; offset=static_cast<size_t>(candidate-code.data());
            if(!memcmp(candidate,pattern,length)) { found=offset; RequireStructure(++count==1,"关键指令存在多个候选"); }
            offset++;
        }
        RequireStructure(count==1,"关键指令不存在"); return text.rva+found;
    }
    void CheckRelocations(const std::vector<CodeRange>& ranges) const {
        if(!relocations.Size) return;
        auto bytes=Read(relocations.VirtualAddress,relocations.Size,false,true);
        for(size_t at=0;at<bytes.size();) {
            RequireStructure(bytes.size()-at>=8,"重定位块被截断");
            IMAGE_BASE_RELOCATION block{}; memcpy(&block,bytes.data()+at,8);
            RequireStructure(block.SizeOfBlock>=8 && !(block.SizeOfBlock%2) && block.SizeOfBlock<=bytes.size()-at,"重定位块大小无效");
            for(size_t item=at+8;item<at+block.SizeOfBlock;item+=2) {
                uint16_t value=0; memcpy(&value,bytes.data()+item,2); unsigned kind=value>>12;
                if(!kind) continue;
                RequireStructure(kind==IMAGE_REL_BASED_DIR64 || kind==IMAGE_REL_BASED_HIGHLOW,"重定位类型不受支持");
                uint64_t target=uint64_t(block.VirtualAddress)+(value&0xfff),width=kind==IMAGE_REL_BASED_DIR64 ? 8:4;
                RequireStructure(target+width<=size,"重定位地址越界");
                for(const auto& range:ranges) RequireStructure(!(target<range.end && target+width>range.begin),"关键函数或字段包含ASLR重定位");
            }
            at+=block.SizeOfBlock;
        }
    }
};
struct ResolvedStructure {
    std::array<uintptr_t,7> methods{};
    std::vector<Site> sites;
    uint32_t size=0,timestamp=0; uint64_t preferredBase=0;
};
ResolvedStructure activeStructure;
std::vector<Site> runtimeSites(std::begin(Sites),std::end(Sites));
uintptr_t runtimeFilterTitleReturn=FilterTitleReturn,runtimeFilterTextReturn=FilterTextReturn,runtimeFilterOptionTextReturn=FilterOptionTextReturn;

ResolvedStructure ResolveStructure(const unsigned char* base,size_t available,const MethodProfile* methods,size_t methodCount,
    const Site* sites,size_t siteCount,const ResolvedStructure* pinned=nullptr) {
    RequireStructure(methodCount==7 && siteCount==12,"结构基准不完整");
    MemoryImage image(base,available); ResolvedStructure result; result.size=image.size;result.timestamp=image.timestamp;result.preferredBase=image.preferredBase;
    std::vector<CodeRange> ranges;
    for(size_t i=0;i<methodCount;i++) {
        const auto& method=methods[i];
        RequireStructure(method.prologueSize>=64 && method.prologueSize<=128 && method.bodySize>=method.prologueSize && method.bodySize<=262144
            && !memcmp(method.body,method.prologue,method.prologueSize),"完整函数基准无效");
        uintptr_t rva=pinned ? pinned->methods[i] : image.Unique(method.prologue,method.prologueSize);
        auto found=image.functions.find(static_cast<uint32_t>(rva));
        RequireStructure(found!=image.functions.end() && found->second-rva==method.bodySize,"关键函数边界已改变");
        auto body=image.Read(rva,method.bodySize,true);
        RequireStructure(!memcmp(body.data(),method.body,method.bodySize),"关键函数完整内容已改变");
        for(const auto& prior:ranges) RequireStructure(!(rva<prior.end && rva+method.bodySize>prior.begin),"关键函数范围重叠");
        result.methods[i]=rva; ranges.push_back({rva,rva+method.bodySize});
    }
    std::unordered_set<uintptr_t> seen; std::array<unsigned,3> counts{};
    for(size_t i=0;i<siteCount;i++) {
        const auto& site=sites[i]; size_t reader=0,section=0;
        if(!strcmp(site.section,"items")) {reader=4;section=0;}
        else if(!strcmp(site.section,"stats")) {reader=5;section=1;}
        else if(!strcmp(site.section,"filters")) {reader=6;section=2;}
        else StructureError("调用点分组无效");
        RequireStructure(site.contextBytes && site.contextSize>=20 && site.contextSize<=128 && site.contextRva>=methods[reader].rva
            && site.returnRva>=site.contextRva+5 && site.returnRva<site.contextRva+site.contextSize
            && site.contextRva-methods[reader].rva+site.contextSize<=methods[reader].bodySize,"调用点相对函数边界无效");
        uintptr_t context=result.methods[reader]+site.contextRva-methods[reader].rva,ret=context+site.returnRva-site.contextRva;
        RequireStructure(seen.insert(ret).second && (!pinned || (pinned->sites.size()==siteCount && pinned->sites[i].contextRva==context && pinned->sites[i].returnRva==ret)),"已解析调用点发生变化");
        if(!pinned) RequireStructure(image.Unique(site.contextBytes,site.contextSize)==context,"调用点位置或唯一性已改变");
        auto bytes=image.Read(context,site.contextSize,true);
        RequireStructure(!memcmp(bytes.data(),site.contextBytes,site.contextSize),"调用点完整指令已改变");
        auto call=image.Read(ret-5,5,true); int32_t displacement=0;memcpy(&displacement,call.data()+1,4);
        RequireStructure(call[0]==0xe8 && int64_t(ret)+displacement==result.methods[0],"调用点目标已改变");
        RequireStructure(bytes[0]==0x48 && bytes[1]==0x8d && bytes[2]==0x15,"字段键寻址方式已改变");
        memcpy(&displacement,bytes.data()+3,4); int64_t key=int64_t(context)+7+displacement;
        RequireStructure(key>=0 && key<=UINT32_MAX,"字段键地址越界");
        size_t fieldLength=strlen(site.field)+1; RequireStructure(fieldLength<=32,"字段键无效");
        auto field=image.Read(static_cast<uintptr_t>(key),fieldLength,false,true);
        RequireStructure(!memcmp(field.data(),site.field,fieldLength),"目录字段键已改变");
        ranges.push_back({static_cast<uintptr_t>(key),static_cast<uintptr_t>(key)+fieldLength});
        result.sites.push_back({ret,site.section,site.field,context,site.contextBytes,site.contextSize});counts[section]++;
    }
    RequireStructure(counts[0]==4 && counts[1]==4 && counts[2]==4,"目录调用分组不完整");
    image.CheckRelocations(ranges); return result;
}
uintptr_t JsonAddress(const Json& object,const char* name) {
    RequireStructure(object.is_object() && object.contains(name) && object[name].is_string(),"控制组件缺少结构地址");
    auto value=object[name].get<std::string>();
    RequireStructure(value.size()>2 && value.size()<=10 && value[0]=='0' && value[1]=='x'
        && value.find_first_not_of("0123456789abcdefABCDEF",2)==std::string::npos,"控制组件结构地址无效");
    return static_cast<uintptr_t>(std::stoul(value,nullptr,16));
}
void RequireHostStructure(const Json& input,const ResolvedStructure& resolved) {
    RequireStructure(input.is_object() && input.contains("compatibility") && input["compatibility"].is_object(),"控制组件缺少结构校验证明");
    const auto& proof=input["compatibility"];
    RequireStructure(proof.value("structureVersion",0)==1 && proof.value("abi",std::string{})==StructureAbi && proof.contains("image"),"控制组件结构协议不兼容");
    RequireStructure(JsonAddress(proof["image"],"sizeOfImage")==resolved.size && JsonAddress(proof["image"],"timeDateStamp")==resolved.timestamp,"磁盘与内存PE身份不同");
    const char* names[]={"lookup","searchBuilder","stringCtor","stringDtor","itemsReader","statsReader","filtersReader"};
    for(size_t i=0;i<7;i++) RequireStructure(proof.contains(names[i]) && JsonAddress(proof[names[i]],"rva")==resolved.methods[i],"控制组件与内存函数地址不同");
    RequireStructure(proof.contains("sites") && proof["sites"].is_array() && proof["sites"].size()==resolved.sites.size(),"控制组件调用点不完整");
    for(size_t i=0;i<resolved.sites.size();i++) {
        const auto& site=resolved.sites[i];const auto& actual=proof["sites"][i];
        RequireStructure(actual.value("section",std::string{})==site.section && actual.value("field",std::string{})==site.field
            && JsonAddress(actual,"contextRva")==site.contextRva && JsonAddress(actual,"callRva")==site.returnRva-5
            && JsonAddress(actual,"returnRva")==site.returnRva,"控制组件与内存调用点不同");
    }
}
bool JsonString(const void* node, std::string& value) {
    std::array<unsigned char,16> data{};
    if (!SafeRead(node, data.data(), data.size())) return false;
    uint16_t flags; memcpy(&flags, data.data()+14, 2);
    if (!(flags & 0x400) || (flags & 7) != 5) return false;
    uint32_t length = 0;
    const void* text = nullptr;
    if (flags & 0x1000) {
        if (data[13] > 13) return false;
        length = 13-data[13]; text = data.data();
    } else {
        uint64_t pointer; memcpy(&pointer, data.data()+8, 8);
        text = reinterpret_cast<void*>(pointer & PointerMask);
        memcpy(&length, data.data(), 4);
    }
    if (length > 65536 || (!text && length)) return false;
    value.resize(length);
    return !length || SafeRead(text, value.data(), length);
}
bool ExplicitNullMember(const void* object,const void* value) noexcept {
    std::array<unsigned char,16> data{};
    if(!SafeRead(object,data.data(),data.size())) return false;
    uint16_t flags; memcpy(&flags,data.data()+14,2);
    if(flags!=3) return false;
    uint32_t count; memcpy(&count,data.data(),4);
    uint64_t members; memcpy(&members,data.data()+8,8); members&=PointerMask;
    auto address=reinterpret_cast<uintptr_t>(value);
    // A missing key returns a shared null outside the object's 32-byte member array.
    if(!members || !count || count>100000 || address<members+16) return false;
    auto offset=address-members-16;
    if(offset%32 || offset/32>=count) return false;
    return SafeRead(static_cast<const unsigned char*>(value)+14,&flags,2) && flags==0;
}
bool MsvcString(const void* string, std::string& value) {
    std::array<unsigned char,32> data{};
    if (!SafeRead(string, data.data(), data.size())) return false;
    size_t size, capacity; memcpy(&size,data.data()+16,8); memcpy(&capacity,data.data()+24,8);
    if (size > MaxPacket || size > capacity) return false;
    const void* text=data.data();
    if (capacity>15) memcpy(&text,data.data(),8);
    value.resize(size);
    return !size || SafeRead(text,value.data(),size);
}
struct TextNode {
    std::string text;
    alignas(8) std::array<unsigned char,16> node{};
    explicit TextNode(std::string input) : text(std::move(input)) {
        if (text.size()>65536 || (reinterpret_cast<uintptr_t>(text.c_str()) & ~PointerMask))
            throw std::runtime_error("unsupported translation buffer");
        uint32_t length=static_cast<uint32_t>(text.size());
        uint64_t pointer=reinterpret_cast<uintptr_t>(text.c_str()) | (uint64_t(0x405)<<48);
        memcpy(node.data(),&length,4); memcpy(node.data()+8,&pointer,8);
    }
};
struct Rule {
    std::string section, field, id, source;
    std::shared_ptr<TextNode> replacement;
    std::string scope;
    bool defaultOption=false;
    std::vector<std::string> reverseKeys;
};
struct Dictionary {
    std::string mode;
    std::vector<Rule> rules;
    std::unordered_multimap<std::string,size_t> byId, bySource;
    std::unordered_multimap<std::string,size_t> byScoped;
    std::unordered_map<std::string,std::string> reverse;
    mutable std::mutex observedMutex;
    mutable std::unordered_set<std::string> observedReverseKeys;
};
std::shared_ptr<Dictionary> current;
// Game views can retain a returned node after a callback; keep every generation
// alive until game exit rather than letting stop/reconfigure invalidate it.
std::vector<std::shared_ptr<Dictionary>> generations;
std::string configurationIdentity;
// Scope call sites are generated from the same hash-bound profile as the hooks.
thread_local std::string currentFilterId;

bool IsFilterOption(const Site& site) {
    return site.returnRva==runtimeFilterOptionTextReturn && !strcmp(site.section,"filters") && !strcmp(site.field,"text");
}
void CaptureFilterScope(const Site& site,const std::string& id) {
    if(strcmp(site.section,"filters")) return;
    if(site.returnRva==runtimeFilterTitleReturn) currentFilterId.clear();
    else if(site.returnRva==runtimeFilterTextReturn) {
        currentFilterId.clear();
        if(id.size()<=512 && id.find_first_of("\r\n")==std::string::npos) currentFilterId=id;
    }
}
std::string ScopedKey(const std::string& scope,const std::string& id,bool defaultOption) {
    return scope+"\n"+(defaultOption ? "D" : "I"+id);
}

std::string Text(const Json& entry,const char* key,size_t limit=65536) {
    if (!entry.contains(key)) return {};
    if (!entry[key].is_string()) throw std::runtime_error("invalid dictionary string");
    auto text=entry[key].get<std::string>();
    if (text.size()>limit || text.find('\0')!=std::string::npos) throw std::runtime_error("invalid dictionary string");
    return text;
}
bool FixedLabel(const Rule& rule) {
    if(rule.field!="label") return false;
    const char* stats[]={"pseudo","explicit","implicit","fractured","crafted","enchant","veiled","monster","crucible","necropolis","scourge"};
    const char* items[]={"weapon","armour","accessory","gem","jewel","flask","map","currency","card"};
    if(rule.section=="stats") return std::any_of(std::begin(stats),std::end(stats),[&](const char* id){return rule.id==id;});
    if(rule.section=="items") return std::any_of(std::begin(items),std::end(items),[&](const char* id){return rule.id==id;});
    return false;
}
std::shared_ptr<Dictionary> ReadDictionary(const Json& request) {
    auto result=std::make_shared<Dictionary>(); result->mode=Text(request,"mode",32);
    if(result->mode!="simplified" && result->mode!="traditional") throw std::runtime_error("invalid mode");
    if(!request.contains("rules") || !request["rules"].is_array() || request["rules"].empty() || request["rules"].size()>100000)
        throw std::runtime_error("invalid dictionary size");
    std::unordered_map<std::string,std::unordered_set<std::string>> reverseSources;
    for(const auto& input:request["rules"]) {
        if(!input.is_object() || !input.contains("reverse") || !input["reverse"].is_array()) continue;
        auto translated=result->mode=="simplified" ? Text(input,"cn") : Text(input,"tw");
        if(translated.empty() && result->mode=="simplified") translated=Text(input,"tw");
        for(const auto& field:input["reverse"]) if(field.is_string())
            reverseSources[field.get<std::string>()+"\n"+translated].insert(Text(input,"source"));
    }
    std::unordered_map<std::string,bool> ambiguous;
    for(const auto& input:request["rules"]) {
        if(!input.is_object()) throw std::runtime_error("invalid dictionary entry");
        Rule rule{Text(input,"section",32),Text(input,"field",32),Text(input,"id",512),Text(input,"source"),nullptr};
        if(rule.section!="items" && rule.section!="stats" && rule.section!="filters") throw std::runtime_error("invalid dictionary section");
        if(rule.field!="title" && rule.field!="text" && rule.field!="label" && rule.field!="type" && rule.field!="name" && rule.field!="placeholder")
            throw std::runtime_error("invalid display field");
        if(rule.field=="type" && rule.section!="items") throw std::runtime_error("non-item type is a query identity");
        if((rule.section=="items" || rule.section=="stats") && rule.source.empty() && !FixedLabel(rule))
            throw std::runtime_error("市集动态词库缺少精确原文证据，请更新完整目录");
        if(rule.section=="stats" && rule.id.empty()) throw std::runtime_error("市集词缀缺少稳定标识");
        if(input.contains("scope") || input.contains("defaultOption")) {
            rule.scope=Text(input,"scope",512);
            if(rule.scope.empty() || rule.scope.find_first_of("\r\n")!=std::string::npos || rule.section!="filters" || rule.field!="text"
                || input.contains("source") || input.contains("reverse")) throw std::runtime_error("invalid scoped option rule");
            if(input.contains("defaultOption")) {
                if(!input["defaultOption"].is_boolean() || !input["defaultOption"].get<bool>() || input.contains("id"))
                    throw std::runtime_error("invalid scoped default option");
                rule.defaultOption=true;
            } else if(rule.id.empty()) throw std::runtime_error("scoped option ID missing");
        }
        if(rule.id.empty() && rule.source.empty() && !rule.defaultOption) throw std::runtime_error("dictionary identity missing");
        auto translated=result->mode=="simplified" ? Text(input,"cn") : Text(input,"tw");
        if(translated.empty() && result->mode=="simplified") translated=Text(input,"tw");
        if(translated.empty()) continue;
        if(input.contains("reverse")) {
            if(rule.section!="items" || rule.source.empty() || !input["reverse"].is_array()) throw std::runtime_error("invalid reverse entry");
            bool disambiguate=false;
            for(const auto& field:input["reverse"]) if(field.is_string() && reverseSources[field.get<std::string>()+"\n"+translated].size()>1) disambiguate=true;
            if(disambiguate) translated+=" ("+rule.source+")";
            for(const auto& field:input["reverse"]) {
                if(!field.is_string() || (field!="type" && field!="name" && field!="term")) throw std::runtime_error("invalid reverse field");
                std::string key=field.get<std::string>()+"\n"+translated;
                rule.reverseKeys.push_back(key);
                auto found=result->reverse.find(key);
                if(found!=result->reverse.end() && found->second!=rule.source) ambiguous[key]=true;
                else result->reverse[key]=rule.source;
            }
        }
        rule.replacement=std::make_shared<TextNode>(translated);
        auto prefix=rule.section+"\n"+rule.field+"\n";
        if(!rule.scope.empty()) result->byScoped.emplace(ScopedKey(rule.scope,rule.id,rule.defaultOption),result->rules.size());
        else if(!rule.id.empty()) result->byId.emplace(prefix+rule.id,result->rules.size());
        else result->bySource.emplace(prefix+rule.source,result->rules.size());
        result->rules.push_back(std::move(rule));
    }
    for(const auto& pair:ambiguous) result->reverse.erase(pair.first);
    return result;
}
void* Translate(const Dictionary& dictionary,const Site& site,const std::string& id,const std::string& source,void* original,
    const std::string& scope="",bool defaultIdIsNull=false) {
    TextNode* match=nullptr;
    std::vector<const Rule*> exactItemMatches;
    auto prefix=std::string(site.section)+"\n"+site.field+"\n";
    auto collect=[&](const auto& index,const std::string& key) {
        auto range=index.equal_range(key);
        for(auto it=range.first;it!=range.second;++it) {
            const auto& rule=dictionary.rules[it->second];
            if(!rule.source.empty() && rule.source!=source) continue;
            if(match && match->text!=rule.replacement->text) return false;
            match=rule.replacement.get();
            if(rule.section=="items" && !rule.source.empty() && rule.source==source && !rule.reverseKeys.empty()) exactItemMatches.push_back(&rule);
        }
        return true;
    };
    if(IsFilterOption(site) && !scope.empty() && (defaultIdIsNull || !id.empty())) {
        if(!collect(dictionary.byScoped,ScopedKey(scope,id,defaultIdIsNull))) return original;
        if(match) return match->node.data();
    }
    if(!collect(dictionary.byId,prefix+id) || !collect(dictionary.bySource,prefix+source)) return original;
    if(match && !exactItemMatches.empty()) {
        std::lock_guard<std::mutex> guard(dictionary.observedMutex);
        for(const auto* rule:exactItemMatches) dictionary.observedReverseKeys.insert(rule->reverseKeys.begin(),rule->reverseKeys.end());
    }
    return match ? match->node.data() : original;
}
bool ReverseQuery(const Dictionary& dictionary,const std::string& source,std::string& replacement) {
    auto value=Json::parse(source,nullptr,false);
    if(value.is_discarded() || !value.is_object() || !value.contains("query") || !value["query"].is_object()) return false;
    bool changed=false;
    for(const auto* key:{"name","type","term"}) {
        auto found=value["query"].find(key);
        if(found==value["query"].end()) continue;
        Json* option=&*found;
        if(option->is_object() && strcmp(key,"term") && option->contains("option")) option=&(*option)["option"];
        if(!option->is_string()) continue;
        const auto reverseKey=std::string(key)+"\n"+option->get<std::string>();
        auto reverse=dictionary.reverse.find(reverseKey);
        if(reverse!=dictionary.reverse.end() && reverse->second!=option->get<std::string>()) {
            std::lock_guard<std::mutex> guard(dictionary.observedMutex);
            if(dictionary.observedReverseKeys.find(reverseKey)==dictionary.observedReverseKeys.end()) continue;
            *option=reverse->second; changed=true;
        }
    }
    if(changed) replacement=value.dump(-1,' ',false,Json::error_handler_t::strict);
    return changed;
}
void* __fastcall LookupHook(void* object,const char* key) {
    auto caller=reinterpret_cast<uintptr_t>(_ReturnAddress())-imageBase;
    void* value=originalLookup(object,key);
    if(!enabled.load(std::memory_order_acquire)) return value;
    lookupCalls.fetch_add(1,std::memory_order_relaxed);
    const Site* site=nullptr;
    for(const auto& candidate:runtimeSites) if(candidate.returnRva==caller) { site=&candidate; break; }
    if(!site) return value;
    fieldReads.fetch_add(1,std::memory_order_relaxed);
    try {
        auto dictionary=std::atomic_load(&current);
        std::string source,id;
        void* idNode=originalLookup(object,"id");
        JsonString(idNode,id);
        CaptureFilterScope(*site,id);
        if(!dictionary || !JsonString(value,source)) return value;
        bool nullId=IsFilterOption(*site) && ExplicitNullMember(object,idNode);
        auto replacement=Translate(*dictionary,*site,id,source,value,currentFilterId,nullId);
        if(replacement!=value) displayHits.fetch_add(1,std::memory_order_relaxed);
        return replacement;
    } catch(...) { return value; }
}
void* __fastcall BuilderHook(void* output,void* criteria) {
    void* result=originalBuilder(output,criteria);
    if(!enabled.load(std::memory_order_acquire)) return result;
    builderCalls.fetch_add(1,std::memory_order_relaxed);
    try {
        auto dictionary=std::atomic_load(&current);
        std::string source,replacement;
        if(!dictionary || !MsvcString(output,source) || !ReverseQuery(*dictionary,source,replacement)) return result;
        alignas(8) std::array<unsigned char,32> temporary{};
        reinterpret_cast<StringCtor>(imageBase+activeStructure.methods[2])(temporary.data(),replacement.data(),replacement.size());
        reinterpret_cast<StringDtor>(imageBase+activeStructure.methods[3])(output);
        memcpy(output,temporary.data(),temporary.size());
        // Ownership moved to the game's output string; its own destructor frees it.
        searchHits.fetch_add(1,std::memory_order_relaxed);
    } catch(...) { /* Failed conversion leaves the original game query in place. */ }
    return result;
}
bool Disable() noexcept {
    enabled.store(false,std::memory_order_release);
    if(hooksCreated) {
        auto first=MH_DisableHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[0]));
        auto second=MH_DisableHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[1]));
        return (first==MH_OK || first==MH_ERROR_DISABLED) && (second==MH_OK || second==MH_ERROR_DISABLED);
    }
    return true;
}
void Configure(const Json& input) {
    // The game copies directory strings into a cache that survives logout.
    auto identity=nlohmann::json::parse(input.dump()).dump();
    if(!configurationIdentity.empty() && configurationIdentity!=identity)
        throw std::runtime_error("restart game before changing market language or dictionary");
    auto dictionary=std::atomic_load(&current);
    if(!dictionary) dictionary=ReadDictionary(input);
    if(!Disable()) throw std::runtime_error("hooks are in passthrough but could not restore original instructions");
    auto resolved=ResolveStructure(reinterpret_cast<const unsigned char*>(imageBase),512*1024*1024,Methods,std::size(Methods),Sites,std::size(Sites),hooksCreated ? &activeStructure:nullptr);
    RequireHostStructure(input,resolved);
    if(!hooksCreated) {
        activeStructure=resolved; runtimeSites=resolved.sites;
        unsigned scopeRoles=0;
        for(size_t i=0;i<std::size(Sites);i++) {
            if(Sites[i].returnRva==FilterTitleReturn) {runtimeFilterTitleReturn=runtimeSites[i].returnRva;scopeRoles++;}
            if(Sites[i].returnRva==FilterTextReturn) {runtimeFilterTextReturn=runtimeSites[i].returnRva;scopeRoles++;}
            if(Sites[i].returnRva==FilterOptionTextReturn) {runtimeFilterOptionTextReturn=runtimeSites[i].returnRva;scopeRoles++;}
        }
        RequireStructure(scopeRoles==3,"筛选作用域调用点不完整");
        if(MH_Initialize()!=MH_OK) throw std::runtime_error("hook initialization failed");
        if(MH_CreateHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[0]),reinterpret_cast<void*>(&LookupHook),reinterpret_cast<void**>(&originalLookup))!=MH_OK) {
            MH_Uninitialize();
            throw std::runtime_error("field hook creation failed");
        }
        if(MH_CreateHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[1]),reinterpret_cast<void*>(&BuilderHook),reinterpret_cast<void**>(&originalBuilder))!=MH_OK) {
            MH_RemoveHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[0]));
            MH_Uninitialize();
            throw std::runtime_error("search hook creation failed");
        }
        hooksCreated=true;
    }
    if(!Disable()) throw std::runtime_error("hooks are in passthrough but could not restore original instructions");
    auto checked=ResolveStructure(reinterpret_cast<const unsigned char*>(imageBase),512*1024*1024,Methods,std::size(Methods),Sites,std::size(Sites),&activeStructure);
    RequireHostStructure(input,checked);
    if(generations.empty()) generations.push_back(dictionary);
    configurationIdentity=identity;
    std::atomic_store(&current,dictionary);
    auto first=MH_EnableHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[0]));
    auto second=MH_EnableHook(reinterpret_cast<void*>(imageBase+activeStructure.methods[1]));
    if(first!=MH_OK || second!=MH_OK) { Disable(); throw std::runtime_error("hook enable failed"); }
    enabled.store(true,std::memory_order_release);
}
Json Status(bool success=true,const std::string& reason={}) {
    auto dictionary=std::atomic_load(&current);
    Json result={{"success",success},{"state",enabled.load() ? "active":"disabled"},{"mode",dictionary ? dictionary->mode:""},
        {"restartRequired",dictionary && !enabled.load()},
        {"reason",reason},{"structureVersion",1},{"abi",StructureAbi},{"hits",{{"lookups",lookupCalls.load()},{"builders",builderCalls.load()},{"reads",fieldReads.load()},{"display",displayHits.load()},{"search",searchHits.load()}}}};
    return result;
}
bool ReadExact(HANDLE pipe,void* destination,DWORD count) {
    auto* bytes=static_cast<unsigned char*>(destination);
    while(count) { DWORD got=0; if(!ReadFile(pipe,bytes,count,&got,nullptr) || !got) return false; bytes+=got; count-=got; }
    return true;
}
bool WriteExact(HANDLE pipe,const void* source,DWORD count) {
    const auto* bytes=static_cast<const unsigned char*>(source);
    while(count) { DWORD sent=0; if(!WriteFile(pipe,bytes,count,&sent,nullptr) || !sent) return false; bytes+=sent; count-=sent; }
    return true;
}
DWORD WINAPI Worker(void*) {
    imageBase=reinterpret_cast<uintptr_t>(GetModuleHandleW(nullptr));
    wchar_t name[120]; swprintf_s(name,L"\\\\.\\pipe\\PoEHelper.Market.%lu",GetCurrentProcessId());
    for(;;) {
        HANDLE pipe=CreateFileW(name,GENERIC_READ|GENERIC_WRITE,0,nullptr,OPEN_EXISTING,0,nullptr);
        if(pipe==INVALID_HANDLE_VALUE) { Sleep(500); continue; }
        for(;;) {
            uint32_t size=0;
            if(!ReadExact(pipe,&size,4) || !size || size>MaxPacket) break;
            std::string payload(size,'\0'); if(!ReadExact(pipe,payload.data(),size)) break;
            Json response;
            try {
                auto request=Json::parse(payload);
                if(!request.is_object()) throw std::runtime_error("invalid command");
                auto operation=Text(request,"operation",32);
                if(operation=="configure") Configure(request);
                else if(operation=="disable") {
                    if(!Disable()) throw std::runtime_error("hooks are in passthrough but could not restore original instructions");
                }
                else if(operation!="status") throw std::runtime_error("unknown command");
                response=Status();
            } catch(const std::exception& error) { Disable(); response=Status(false,error.what()); }
              catch(...) { Disable(); response=Status(false,"native command failed"); }
            auto encoded=response.dump(); size=static_cast<uint32_t>(encoded.size());
            if(!WriteExact(pipe,&size,4) || !WriteExact(pipe,encoded.data(),size)) break;
        }
        Disable(); CloseHandle(pipe);
    }
}

int StructureSelfTest() {
    int cases=0;
    auto check=[&](bool condition) { if(!condition) throw std::runtime_error("market structure self-test failed"); cases++; };
    auto reject=[&](const auto& action) { bool failed=false;try {action();}catch(const std::exception&) {failed=true;}check(failed); };
    struct Fixture {
        std::vector<unsigned char> bytes=std::vector<unsigned char>(0x9000);
        std::array<std::array<unsigned char,384>,7> bodies{};
        std::array<std::array<unsigned char,25>,12> contexts{};
        std::array<MethodProfile,7> methods{};
        std::array<Site,12> sites{};
        Fixture() {
            IMAGE_DOS_HEADER dos{};dos.e_magic=IMAGE_DOS_SIGNATURE;dos.e_lfanew=0x80;memcpy(bytes.data(),&dos,sizeof(dos));
            IMAGE_NT_HEADERS64 nt{};nt.Signature=IMAGE_NT_SIGNATURE;nt.FileHeader.Machine=IMAGE_FILE_MACHINE_AMD64;nt.FileHeader.NumberOfSections=4;
            nt.FileHeader.SizeOfOptionalHeader=sizeof(IMAGE_OPTIONAL_HEADER64);nt.FileHeader.TimeDateStamp=0x12345678;
            nt.OptionalHeader.Magic=IMAGE_NT_OPTIONAL_HDR64_MAGIC;nt.OptionalHeader.ImageBase=0x140000000;nt.OptionalHeader.SizeOfImage=static_cast<DWORD>(bytes.size());
            nt.OptionalHeader.NumberOfRvaAndSizes=16;nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXCEPTION]={0x5000,7*sizeof(RUNTIME_FUNCTION)};
            nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC]={0x6000,12};memcpy(bytes.data()+0x80,&nt,sizeof(nt));
            const char* sections[]={".text",".rdata",".pdata",".reloc"};const uint32_t rvas[]={0x1000,0x4000,0x5000,0x6000};
            for(unsigned i=0;i<4;i++) {
                IMAGE_SECTION_HEADER section{};memcpy(section.Name,sections[i],strlen(sections[i]));section.VirtualAddress=rvas[i];
                section.SizeOfRawData=i ? 0x1000:0x2000;section.Misc.VirtualSize=section.SizeOfRawData;section.PointerToRawData=section.VirtualAddress;
                section.Characteristics=IMAGE_SCN_MEM_READ|(i ? 0:IMAGE_SCN_MEM_EXECUTE);memcpy(bytes.data()+0x80+sizeof(nt)+i*sizeof(section),&section,sizeof(section));
            }
            std::fill(bytes.begin()+0x1000,bytes.begin()+0x3000,0xcc);
            for(unsigned i=0;i<7;i++) {
                bodies[i].fill(static_cast<unsigned char>(0xb1+i));std::fill_n(bodies[i].begin(),64,static_cast<unsigned char>(0xa1+i));
                methods[i]={0x1000+i*0x200,bodies[i].data(),64,bodies[i].data(),bodies[i].size()};
                RUNTIME_FUNCTION function{};function.BeginAddress=static_cast<DWORD>(methods[i].rva);function.EndAddress=function.BeginAddress+static_cast<DWORD>(bodies[i].size());
                function.UnwindData=0x5800;memcpy(bytes.data()+0x5000+i*sizeof(function),&function,sizeof(function));
            }
            const char* fields[]={"label","type","text","name","label","text","type","text","title","text","text","placeholder"};
            const char* groups[]={"items","stats","filters"};
            const unsigned char context[]={0x48,0x8d,0x15,0,0,0,0,0x48,0x8b,0xcb,0xe8,0,0,0,0,0x48,0x8b,0xd0,0x0f,0xb7,0x48,0x0e,0x0f,0xb7,0xc1};
            for(unsigned i=0;i<12;i++) {
                unsigned reader=4+i/4,offset=80+(i%4)*64;uintptr_t rva=methods[reader].rva+offset,key=0x4000+i*32;
                memcpy(contexts[i].data(),context,sizeof(context));int32_t relative=static_cast<int32_t>(key-rva-7);memcpy(contexts[i].data()+3,&relative,4);
                relative=static_cast<int32_t>(methods[0].rva-rva-15);memcpy(contexts[i].data()+11,&relative,4);
                memcpy(bodies[reader].data()+offset,contexts[i].data(),contexts[i].size());memcpy(bytes.data()+key,fields[i],strlen(fields[i])+1);
                sites[i]={rva+15,groups[i/4],fields[i],rva,contexts[i].data(),contexts[i].size()};
            }
            for(unsigned i=0;i<7;i++)memcpy(bytes.data()+methods[i].rva,bodies[i].data(),bodies[i].size());
            IMAGE_BASE_RELOCATION block{0x7000,12};memcpy(bytes.data()+0x6000,&block,8);uint16_t relocation=0xa010;memcpy(bytes.data()+0x6008,&relocation,2);
        }
    } fixture;
    auto resolve=[&](const std::vector<unsigned char>& bytes,const ResolvedStructure* pinned=nullptr) {
        return ResolveStructure(bytes.data(),bytes.size(),fixture.methods.data(),fixture.methods.size(),fixture.sites.data(),fixture.sites.size(),pinned);
    };
    auto baseline=resolve(fixture.bytes);check(baseline.methods[0]==0x1000 && baseline.sites.size()==12);
    auto metadata=fixture.bytes;metadata[0x88]^=1;metadata[0x8000]^=1;check(resolve(metadata).methods==baseline.methods);
    auto changed=fixture.bytes;changed[0x1050]^=1;reject([&]{resolve(changed);});
    auto duplicate=fixture.bytes;memcpy(duplicate.data()+0x2a00,fixture.bodies[0].data(),64);reject([&]{resolve(duplicate);});
    auto bound=fixture.bytes;bound[0x5004]^=1;reject([&]{resolve(bound);});
    auto key=fixture.bytes;key[0x4000]^=1;reject([&]{resolve(key);});
    auto writable=fixture.bytes;uint32_t flags=IMAGE_SCN_MEM_READ|IMAGE_SCN_MEM_WRITE|IMAGE_SCN_MEM_EXECUTE;
    memcpy(writable.data()+0x80+sizeof(IMAGE_NT_HEADERS64)+offsetof(IMAGE_SECTION_HEADER,Characteristics),&flags,4);reject([&]{resolve(writable);});
    auto writableKey=fixture.bytes;flags=IMAGE_SCN_MEM_READ|IMAGE_SCN_MEM_WRITE;
    memcpy(writableKey.data()+0x80+sizeof(IMAGE_NT_HEADERS64)+sizeof(IMAGE_SECTION_HEADER)+offsetof(IMAGE_SECTION_HEADER,Characteristics),&flags,4);reject([&]{resolve(writableKey);});
    auto reloc=fixture.bytes;uint32_t page=0x1000;memcpy(reloc.data()+0x6000,&page,4);reject([&]{resolve(reloc);});
    auto truncated=fixture.bytes;truncated.resize(128);reject([&]{resolve(truncated);});
    // Move all relevant sections together: byte-identical complete routines may resolve at new addresses.
    const uint32_t delta=0x10000;std::vector<unsigned char> moved(fixture.bytes.size()+delta);memcpy(moved.data(),fixture.bytes.data(),0x400);
    IMAGE_NT_HEADERS64 nt{};memcpy(&nt,moved.data()+0x80,sizeof(nt));nt.OptionalHeader.SizeOfImage+=delta;
    nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXCEPTION].VirtualAddress+=delta;nt.OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].VirtualAddress+=delta;
    memcpy(moved.data()+0x80,&nt,sizeof(nt));
    for(unsigned i=0;i<4;i++) {
        auto at=0x80+sizeof(nt)+i*sizeof(IMAGE_SECTION_HEADER);IMAGE_SECTION_HEADER section{};memcpy(&section,moved.data()+at,sizeof(section));
        memcpy(moved.data()+section.VirtualAddress+delta,fixture.bytes.data()+section.VirtualAddress,section.SizeOfRawData);
        section.VirtualAddress+=delta;memcpy(moved.data()+at,&section,sizeof(section));
    }
    for(unsigned i=0;i<7;i++) {
        RUNTIME_FUNCTION function{};auto at=0x5000+delta+i*sizeof(function);memcpy(&function,moved.data()+at,sizeof(function));
        function.BeginAddress+=delta;function.EndAddress+=delta;function.UnwindData+=delta;memcpy(moved.data()+at,&function,sizeof(function));
    }
    page=0x7000+delta;memcpy(moved.data()+0x6000+delta,&page,4);
    auto relocated=resolve(moved);check(relocated.methods[0]==0x11000 && relocated.sites[0].contextRva==baseline.sites[0].contextRva+delta);
    reject([&]{resolve(moved,&baseline);});check(resolve(moved,&relocated).methods==relocated.methods);
    // Even a caller-supplied matching body cannot redirect the whitelisted call to another function.
    fixture.contexts[0][11]++;fixture.bodies[4][80+11]++;fixture.bytes[0x1800+80+11]++;reject([&]{resolve(fixture.bytes);});
    fixture.contexts[0][11]--;fixture.bodies[4][80+11]--;fixture.bytes[0x1800+80+11]--;
    auto address=[](uintptr_t value) {char text[24];sprintf_s(text,"0x%llx",static_cast<unsigned long long>(value));return std::string(text);};
    Json proof={{"structureVersion",1},{"abi",StructureAbi},{"image",{{"sizeOfImage",address(baseline.size)},{"timeDateStamp",address(baseline.timestamp)}}},{"sites",Json::array()}};
    const char* names[]={"lookup","searchBuilder","stringCtor","stringDtor","itemsReader","statsReader","filtersReader"};
    for(size_t i=0;i<7;i++)proof[names[i]]={{"rva",address(baseline.methods[i])}};
    for(const auto& site:baseline.sites)proof["sites"].push_back({{"section",site.section},{"field",site.field},{"contextRva",address(site.contextRva)},{"callRva",address(site.returnRva-5)},{"returnRva",address(site.returnRva)}});
    Json command={{"compatibility",proof}};RequireHostStructure(command,baseline);check(true);
    reject([&]{RequireHostStructure(Json::object(),baseline);});
    auto wrong=command;wrong["compatibility"]["lookup"]["rva"]="0x1001";reject([&]{RequireHostStructure(wrong,baseline);});
    wrong=command;wrong["compatibility"]["abi"]="unknown";reject([&]{RequireHostStructure(wrong,baseline);});
    wrong=command;wrong["compatibility"]["sites"][0]["field"]="other";reject([&]{RequireHostStructure(wrong,baseline);});
    return cases;
}

int SelfTest() {
    int cases=0;
    auto require=[&](bool condition){if(!condition) throw std::runtime_error("market self-test failed"); ++cases;};
    TextNode text("测试UTF8🙂"); std::string decoded;
    require(JsonString(text.node.data(),decoded) && decoded==text.text);
    std::array<unsigned char,16> shortNode{}; memcpy(shortNode.data(),"sample",6); shortNode[13]=7; uint16_t flags=0x1c05; memcpy(shortNode.data()+14,&flags,2);
    require(JsonString(shortNode.data(),decoded) && decoded=="sample");
    flags=3; memcpy(shortNode.data()+14,&flags,2); require(!JsonString(shortNode.data(),decoded));
    require(!JsonString(reinterpret_cast<void*>(1),decoded));
    auto input=Json::parse(R"({"mode":"simplified","rules":[{"section":"items","field":"type","source":"Anneau en fer","cn":"锻铁戒指","tw":"鍛鐵戒指","reverse":["type","term"]},{"section":"stats","field":"text","id":"pseudo.pseudo_total_cold_resistance","source":"+#% original","cn":"+#% 总冰霜抗性","tw":"+#% 總冰冷抗性"}]})");
    auto dictionary=ReadDictionary(input); int untouched=1;
    Site item{0,"items","type"},stat{0,"stats","text"};
    std::string output;
    require(!ReverseQuery(*dictionary,R"({"query":{"type":"锻铁戒指"}})",output));
    auto renamedSource=ReadDictionary(input);
    require(Translate(*renamedSource,item,"","Nouveau nom officiel",&untouched)==&untouched);
    require(!ReverseQuery(*renamedSource,R"({"query":{"type":"锻铁戒指"}})",output));
    auto sharedSource=ReadDictionary(Json::parse(R"({"mode":"simplified","rules":[
        {"section":"items","field":"name","source":"Le Pacte","cn":"血誓","reverse":["name","term"]},
        {"section":"items","field":"type","source":"Le Pacte","cn":"协约","reverse":["type","term"]},
        {"section":"items","field":"text","source":"Le Pacte","cn":"协约","reverse":["term"]}
    ]})"));
    auto sharedText=Translate(*sharedSource,item,"","Le Pacte",&untouched);
    require(JsonString(sharedText,decoded) && decoded=="协约");
    require(!ReverseQuery(*sharedSource,R"({"query":{"name":"血誓"}})",output));
    require(!ReverseQuery(*sharedSource,R"({"query":{"term":"血誓"}})",output));
    require(ReverseQuery(*sharedSource,R"({"query":{"term":"协约"}})",output) && Json::parse(output)["query"]["term"]=="Le Pacte");
    Site itemName{0,"items","name"};
    sharedText=Translate(*sharedSource,itemName,"","Le Pacte",&untouched);
    require(JsonString(sharedText,decoded) && decoded=="血誓");
    require(ReverseQuery(*sharedSource,R"({"query":{"name":{"option":"血誓","discriminator":"keep"},"term":"血誓","filters":{"trade_filters":{"filters":{"price":{"min":2.5,"max":9}}}}}})",output)
        && Json::parse(output)["query"]["name"]["option"]=="Le Pacte" && Json::parse(output)["query"]["name"]["discriminator"]=="keep"
        && Json::parse(output)["query"]["term"]=="Le Pacte" && Json::parse(output)["query"]["filters"]["trade_filters"]["filters"]["price"]["min"]==2.5);
    auto translated=Translate(*dictionary,item,"","Anneau en fer",&untouched);
    require(translated!=&untouched && JsonString(translated,decoded) && decoded=="锻铁戒指");
    require(Translate(*dictionary,item,"","Unknown",&untouched)==&untouched);
    require(Translate(*dictionary,stat,"other","+#% original",&untouched)==&untouched);
    translated=Translate(*dictionary,stat,"pseudo.pseudo_total_cold_resistance","+#% original",&untouched);
    require(JsonString(translated,decoded) && decoded=="+#% 总冰霜抗性");
    const std::string query=R"({"query":{"type":"锻铁戒指","name":"Untouched","filters":{"trade_filters":{"filters":{"price":{"min":1.25,"max":99},"collapse":{"option":"true"}}}}},"sort":{"price":"asc"}})";
    require(ReverseQuery(*dictionary,query,output)); auto expected=Json::parse(query); expected["query"]["type"]="Anneau en fer";
    require(Json::parse(output)==expected);
    auto gems=ReadDictionary(Json::parse(R"json({"mode":"simplified","rules":[
        {"section":"items","field":"type","source":"Animation d'Arme","cn":"幻化武器","reverse":["type","term"]},
        {"section":"items","field":"text","source":"Animation d'arme à distance","cn":"远程之幻化武器","reverse":["term"]},
        {"section":"items","field":"text","source":"Animation d'arme de l'Introspection","cn":"自省之幻化武器","reverse":["term"]},
        {"section":"items","field":"type","source":"Animation d'arme vaal","cn":"瓦尔：幻化武器","reverse":["type","term"]},
        {"section":"items","field":"text","source":"Animation d'Arme vaal (Animation d'arme à distance)","cn":"瓦尔：幻化武器 (远程之幻化武器)","reverse":["term"]}
    ]})json"));
    Site itemText{0,"items","text"};
    require(!ReverseQuery(*gems,R"({"query":{"type":{"option":"幻化武器","discriminator":"alt_y"},"term":"远程之幻化武器"}})",output));
    require(Translate(*gems,itemText,"","Animation d'arme renommée",&untouched)==&untouched);
    require(!ReverseQuery(*gems,R"({"query":{"term":"远程之幻化武器"}})",output));
    translated=Translate(*gems,item,"","Animation d'Arme",&untouched);
    require(JsonString(translated,decoded) && decoded=="幻化武器");
    require(!ReverseQuery(*gems,R"({"query":{"term":"远程之幻化武器"}})",output));
    translated=Translate(*gems,itemText,"","Animation d'arme à distance",&untouched);
    require(JsonString(translated,decoded) && decoded=="远程之幻化武器");
    const auto gemQuery=Json::parse(R"({"query":{"type":{"option":"幻化武器","discriminator":"alt_y","other":7},"term":"远程之幻化武器","stats":[{"type":"and","filters":[{"id":"explicit.stat_123","value":{"min":2,"max":4}}]}],"filters":{"trade_filters":{"filters":{"price":{"min":1.5,"max":3}}}}},"sort":{"price":"asc"}})");
    auto expectedGem=gemQuery; expectedGem["query"]["type"]["option"]="Animation d'Arme";
    expectedGem["query"]["term"]="Animation d'arme à distance";
    require(ReverseQuery(*gems,gemQuery.dump(),output) && Json::parse(output)==expectedGem);
    require(!ReverseQuery(*gems,R"({"query":{"type":{"option":"远程之幻化武器","discriminator":"alt_y"}}})",output));
    require(!ReverseQuery(*gems,R"({"query":{"term":"自省之幻化武器"}})",output));
    auto reflectionQuery=gemQuery; reflectionQuery["query"]["type"]["discriminator"]="alt_x";
    reflectionQuery["query"]["term"]="自省之幻化武器";
    expectedGem=reflectionQuery; expectedGem["query"]["type"]["option"]="Animation d'Arme";
    require(ReverseQuery(*gems,reflectionQuery.dump(),output) && Json::parse(output)==expectedGem);
    translated=Translate(*gems,itemText,"","Animation d'arme de l'Introspection",&untouched);
    require(JsonString(translated,decoded) && decoded=="自省之幻化武器");
    expectedGem["query"]["term"]="Animation d'arme de l'Introspection";
    require(ReverseQuery(*gems,reflectionQuery.dump(),output) && Json::parse(output)==expectedGem);
    require(!ReverseQuery(*gems,R"json({"query":{"term":"瓦尔：幻化武器 (远程之幻化武器)"}})json",output));
    translated=Translate(*gems,item,"","Animation d'arme vaal",&untouched);
    require(JsonString(translated,decoded) && decoded=="瓦尔：幻化武器");
    require(!ReverseQuery(*gems,R"json({"query":{"term":"瓦尔：幻化武器 (远程之幻化武器)"}})json",output));
    translated=Translate(*gems,itemText,"","Animation d'arme vaal (Animation d'arme à distance)",&untouched);
    require(translated==&untouched);
    translated=Translate(*gems,itemText,"","Animation d'Arme vaal (Animation d'arme à distance)",&untouched);
    require(JsonString(translated,decoded) && decoded=="瓦尔：幻化武器 (远程之幻化武器)");
    auto vaalQuery=gemQuery; vaalQuery["query"]["type"]["option"]="瓦尔：幻化武器";
    vaalQuery["query"]["term"]="瓦尔：幻化武器 (远程之幻化武器)";
    expectedGem=vaalQuery; expectedGem["query"]["type"]["option"]="Animation d'arme vaal";
    expectedGem["query"]["term"]="Animation d'Arme vaal (Animation d'arme à distance)";
    require(ReverseQuery(*gems,vaalQuery.dump(),output) && Json::parse(output)==expectedGem);
    require(!ReverseQuery(*gems,R"json({"query":{"type":{"option":"瓦尔：幻化武器 (远程之幻化武器)","discriminator":"alt_y"}}})json",output));
    require(!ReverseQuery(*dictionary,R"({"query":{"type":"Unknown"}})",output));
    require(!ReverseQuery(*dictionary,"invalid",output));
    input["mode"]="traditional"; auto traditional=ReadDictionary(input);
    translated=Translate(*traditional,item,"","Anneau en fer",&untouched); require(JsonString(translated,decoded) && decoded=="鍛鐵戒指");
    input["rules"][0]["cn"]=""; input["mode"]="simplified";
    auto fallback=ReadDictionary(input); translated=Translate(*fallback,item,"","Anneau en fer",&untouched); require(JsonString(translated,decoded) && decoded=="鍛鐵戒指");
    auto duplicate=input["rules"][0]; duplicate["source"]="Other ring"; input["rules"].push_back(duplicate);
    auto ambiguous=ReadDictionary(input); require(!ReverseQuery(*ambiguous,R"({"query":{"type":"鍛鐵戒指"}})",output));
    translated=Translate(*ambiguous,item,"","Anneau en fer",&untouched);
    require(JsonString(translated,decoded) && decoded=="鍛鐵戒指 (Anneau en fer)");
    require(!ReverseQuery(*ambiguous,R"json({"query":{"type":"鍛鐵戒指 (Other ring)"}})json",output));
    require(ReverseQuery(*ambiguous,R"json({"query":{"type":"鍛鐵戒指 (Anneau en fer)"}})json",output)
        && Json::parse(output)["query"]["type"]=="Anneau en fer");
    const std::string variant=R"({"query":{"type":{"option":"锻铁戒指","discriminator":"atlas2","other":7},"stats":[{"type":"and","filters":[{"id":"pseudo.pseudo_total_cold_resistance","value":{"min":25,"max":40}}]}],"filters":{"trade_filters":{"filters":{"collapse":{"option":"true"},"price":{"min":1.5,"max":3}}}}},"sort":{"price":"asc"}})";
    require(ReverseQuery(*dictionary,variant,output)); expected=Json::parse(variant); expected["query"]["type"]["option"]="Anneau en fer";
    require(Json::parse(output)==expected);
    auto retained=dictionary; dictionary=ReadDictionary(input);
    require(JsonString(Translate(*retained,item,"","Anneau en fer",&untouched),decoded) && decoded=="锻铁戒指");
    auto conflict=input["rules"][0]; conflict["tw"]="另一个名字"; input["rules"].push_back(conflict); input["mode"]="traditional";
    auto conflicting=ReadDictionary(input);
    require(Translate(*conflicting,item,"","Anneau en fer",&untouched)==&untouched);
    require(!ReverseQuery(*conflicting,R"json({"query":{"type":"鍛鐵戒指 (Anneau en fer)"}})json",output));
    input["rules"]=Json::array({{{"section","items"},{"field","type"},{"source","Unknown"},{"cn",""},{"tw",""}}});
    require(Translate(*ReadDictionary(input),item,"","Unknown",&untouched)==&untouched);
    input["rules"]=Json::array();
    for(int i=0;i<20000;++i) input["rules"].push_back({{"section","stats"},{"field","text"},{"id","explicit."+std::to_string(i)},{"source","source"},{"cn","测试 #"},{"tw","測試 #"}});
    auto large=ReadDictionary(input);
    require(large->byId.size()==20000 && JsonString(Translate(*large,stat,"explicit.19999","source",&untouched),decoded) && decoded=="測試 #");
    auto scopedInput=Json::parse(R"({"mode":"simplified","rules":[
        {"section":"filters","field":"text","scope":"indexed","defaultOption":true,"cn":"任何时间","tw":"任何時間"},
        {"section":"filters","field":"text","scope":"sale_type","defaultOption":true,"cn":"议价或定价","tw":"議價或定價"},
        {"section":"filters","field":"text","scope":"collapse","defaultOption":true,"cn":"否","tw":"否"},
        {"section":"filters","field":"text","scope":"foil_variation","id":"0","cn":"非闪耀","tw":"非閃耀"}
    ]})");
    auto scoped=ReadDictionary(scopedInput);
    Site filterTitle{FilterTitleReturn,"filters","title"},filterText{FilterTextReturn,"filters","text"},filterOption{FilterOptionTextReturn,"filters","text"};
    require(scoped->byScoped.size()==4 && scoped->byId.empty() && scoped->bySource.empty());
    translated=Translate(*scoped,filterOption,"","Any",&untouched,"indexed",true);
    require(JsonString(translated,decoded) && decoded=="任何时间");
    translated=Translate(*scoped,filterOption,"","Any",&untouched,"sale_type",true);
    require(JsonString(translated,decoded) && decoded=="议价或定价");
    translated=Translate(*scoped,filterOption,"","Any",&untouched,"collapse",true);
    require(JsonString(translated,decoded) && decoded=="否");
    require(Translate(*scoped,filterText,"","Any",&untouched,"indexed",true)==&untouched);
    require(Translate(*scoped,filterOption,"true","Oui",&untouched,"collapse",false)==&untouched);
    require(Translate(*scoped,filterOption,"","Any",&untouched,"unknown",true)==&untouched);
    require(Translate(*scoped,filterOption,"","Any",&untouched,"indexed",false)==&untouched);
    translated=Translate(*scoped,filterOption,"0","Original",&untouched,"foil_variation",false);
    require(JsonString(translated,decoded) && decoded=="非闪耀");
    require(Translate(*scoped,filterOption,"0","Original",&untouched,"indexed",false)==&untouched);
    require(Translate(*scoped,filterOption,"1","Original",&untouched,"foil_variation",false)==&untouched);
    require(Translate(*scoped,filterText,"0","Original",&untouched,"foil_variation",false)==&untouched);
    std::array<unsigned char,32> members{};
    std::array<unsigned char,16> object{},sharedNull{};
    uint32_t one=1; memcpy(object.data(),&one,4); memcpy(object.data()+4,&one,4);
    uint64_t memberPointer=reinterpret_cast<uintptr_t>(members.data()) | (uint64_t(3)<<48);
    memcpy(object.data()+8,&memberPointer,8);
    require(ExplicitNullMember(object.data(),members.data()+16));
    require(!ExplicitNullMember(object.data(),sharedNull.data()));
    TextNode trueId("true"); memcpy(members.data()+16,trueId.node.data(),16);
    require(!ExplicitNullMember(object.data(),members.data()+16));
    CaptureFilterScope(filterText,"indexed"); require(currentFilterId=="indexed");
    require(!JsonString(sharedNull.data(),decoded) && currentFilterId=="indexed");
    CaptureFilterScope(filterTitle,"trade_filters"); require(currentFilterId.empty());
    CaptureFilterScope(filterText,""); require(currentFilterId.empty());
    auto rejectRule=[&](const Json& rule) {
        bool rejected=false;
        try { ReadDictionary(Json{{"mode","simplified"},{"rules",Json::array({rule})}}); }
        catch(const std::exception&) { rejected=true; }
        require(rejected);
    };
    auto bad=scopedInput["rules"][0]; bad.erase("scope"); rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["section"]="stats"; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["field"]="title"; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["id"]="true"; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["source"]="Any"; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["defaultOption"]=false; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad.erase("defaultOption"); rejectRule(bad);
    bad=scopedInput["rules"][3]; bad["id"]=0; rejectRule(bad);
    bad=scopedInput["rules"][0]; bad["cn"]="另一个默认项"; scopedInput["rules"].push_back(bad);
    require(Translate(*ReadDictionary(scopedInput),filterOption,"","Any",&untouched,"indexed",true)==&untouched);
    rejectRule({{"section","stats"},{"field","text"},{"id","explicit.fixture"},{"cn","旧词缀"}});
    rejectRule({{"section","items"},{"field","type"},{"id","weapon"},{"cn","旧名称"}});
    auto labels=ReadDictionary({{"mode","simplified"},{"rules",Json::array({{{"section","stats"},{"field","label"},{"id","pseudo"},{"cn","综合"}},{{"section","items"},{"field","label"},{"id","weapon"},{"cn","武器"}}})}});
    require(labels->rules.size()==2);
    require(Status()["structureVersion"]==1 && Status()["abi"]==StructureAbi);
    cases+=StructureSelfTest();
    printf("market self-test: %d cases passed\n",cases); return 0;
}
}
#ifdef MARKET_SELF_TEST
int main() { try { return market::SelfTest(); } catch(const std::exception& error) { fprintf(stderr,"%s\n",error.what()); return 1; } }
#else
BOOL WINAPI DllMain(HINSTANCE module,DWORD reason,LPVOID) {
    if(reason==DLL_PROCESS_ATTACH) {
        DisableThreadLibraryCalls(module);
        HANDLE thread=CreateThread(nullptr,0,&market::Worker,nullptr,0,nullptr);
        if(thread) CloseHandle(thread); else return FALSE;
    }
    return TRUE;
}
#endif

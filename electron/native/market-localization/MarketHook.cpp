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
};
struct Dictionary {
    std::string mode;
    std::vector<Rule> rules;
    std::unordered_multimap<std::string,size_t> byId, bySource;
    std::unordered_multimap<std::string,size_t> byScoped;
    std::unordered_map<std::string,std::string> reverse;
};
std::shared_ptr<Dictionary> current;
// Game views can retain a returned node after a callback; keep every generation
// alive until game exit rather than letting stop/reconfigure invalidate it.
std::vector<std::shared_ptr<Dictionary>> generations;
std::string configurationIdentity;
// These three sites and their order are verified for the hash-bound 3.30.0b profile.
constexpr uintptr_t FilterTitleReturn=0x862bb1, FilterTextReturn=0x862e42, FilterOptionTextReturn=0x86314b;
thread_local std::string currentFilterId;

bool IsFilterOption(const Site& site) {
    return site.returnRva==FilterOptionTextReturn && !strcmp(site.section,"filters") && !strcmp(site.field,"text");
}
void CaptureFilterScope(const Site& site,const std::string& id) {
    if(strcmp(site.section,"filters")) return;
    if(site.returnRva==FilterTitleReturn) currentFilterId.clear();
    else if(site.returnRva==FilterTextReturn) {
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
    auto prefix=std::string(site.section)+"\n"+site.field+"\n";
    auto collect=[&](const auto& index,const std::string& key) {
        auto range=index.equal_range(key);
        for(auto it=range.first;it!=range.second;++it) {
            const auto& rule=dictionary.rules[it->second];
            if(!rule.source.empty() && rule.source!=source) continue;
            if(match && match->text!=rule.replacement->text) return false;
            match=rule.replacement.get();
        }
        return true;
    };
    if(IsFilterOption(site) && !scope.empty() && (defaultIdIsNull || !id.empty())) {
        if(!collect(dictionary.byScoped,ScopedKey(scope,id,defaultIdIsNull))) return original;
        if(match) return match->node.data();
    }
    if(!collect(dictionary.byId,prefix+id) || !collect(dictionary.bySource,prefix+source)) return original;
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
        auto reverse=dictionary.reverse.find(std::string(key)+"\n"+option->get<std::string>());
        if(reverse!=dictionary.reverse.end() && reverse->second!=option->get<std::string>()) { *option=reverse->second; changed=true; }
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
    for(const auto& candidate:Sites) if(candidate.returnRva==caller) { site=&candidate; break; }
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
        reinterpret_cast<StringCtor>(imageBase+StringCtorRva)(temporary.data(),replacement.data(),replacement.size());
        reinterpret_cast<StringDtor>(imageBase+StringDtorRva)(output);
        memcpy(output,temporary.data(),temporary.size());
        // Ownership moved to the game's output string; its own destructor frees it.
        searchHits.fetch_add(1,std::memory_order_relaxed);
    } catch(...) { /* Failed conversion leaves the original game query in place. */ }
    return result;
}
bool ProfileMatches() {
    const auto* base=reinterpret_cast<const unsigned char*>(imageBase);
    IMAGE_DOS_HEADER dos{}; IMAGE_NT_HEADERS64 nt{};
    if(!SafeRead(base,&dos,sizeof(dos)) || dos.e_magic!=IMAGE_DOS_SIGNATURE || !SafeRead(base+dos.e_lfanew,&nt,sizeof(nt))) return false;
    if(nt.Signature!=IMAGE_NT_SIGNATURE || nt.FileHeader.Machine!=IMAGE_FILE_MACHINE_AMD64 || nt.FileHeader.TimeDateStamp!=ImageTimestamp || nt.OptionalHeader.SizeOfImage!=ImageSize) return false;
    if(memcmp(base+LookupRva,LookupPrologue,sizeof(LookupPrologue)) || memcmp(base+BuilderRva,BuilderPrologue,sizeof(BuilderPrologue))) return false;
    if(memcmp(base+StringCtorRva,StringCtorPrologue,sizeof(StringCtorPrologue)) || memcmp(base+StringDtorRva,StringDtorPrologue,sizeof(StringDtorPrologue))) return false;
    for(const auto& site:Sites) {
        if(site.contextRva+site.contextSize>ImageSize || memcmp(base+site.contextRva,site.contextBytes,site.contextSize)) return false;
        const auto* call=base+site.returnRva-5;
        if(*call!=0xe8) return false;
        int32_t relative; memcpy(&relative,call+1,4);
        if(site.returnRva+relative!=LookupRva) return false;
    }
    return true;
}
bool Disable() noexcept {
    enabled.store(false,std::memory_order_release);
    if(hooksCreated) {
        auto first=MH_DisableHook(reinterpret_cast<void*>(imageBase+LookupRva));
        auto second=MH_DisableHook(reinterpret_cast<void*>(imageBase+BuilderRva));
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
    if(!hooksCreated) {
        if(!ProfileMatches()) throw std::runtime_error("unsupported game executable or existing hook");
        if(MH_Initialize()!=MH_OK) throw std::runtime_error("hook initialization failed");
        if(MH_CreateHook(reinterpret_cast<void*>(imageBase+LookupRva),reinterpret_cast<void*>(&LookupHook),reinterpret_cast<void**>(&originalLookup))!=MH_OK) {
            MH_Uninitialize();
            throw std::runtime_error("field hook creation failed");
        }
        if(MH_CreateHook(reinterpret_cast<void*>(imageBase+BuilderRva),reinterpret_cast<void*>(&BuilderHook),reinterpret_cast<void**>(&originalBuilder))!=MH_OK) {
            MH_RemoveHook(reinterpret_cast<void*>(imageBase+LookupRva));
            MH_Uninitialize();
            throw std::runtime_error("search hook creation failed");
        }
        hooksCreated=true;
    }
    if(!Disable()) throw std::runtime_error("hooks are in passthrough but could not restore original instructions");
    if(!ProfileMatches()) throw std::runtime_error("game instructions changed while market translation was disabled");
    if(generations.empty()) generations.push_back(dictionary);
    configurationIdentity=identity;
    std::atomic_store(&current,dictionary);
    auto first=MH_EnableHook(reinterpret_cast<void*>(imageBase+LookupRva));
    auto second=MH_EnableHook(reinterpret_cast<void*>(imageBase+BuilderRva));
    if(first!=MH_OK || second!=MH_OK) { Disable(); throw std::runtime_error("hook enable failed"); }
    enabled.store(true,std::memory_order_release);
}
Json Status(bool success=true,const std::string& reason={}) {
    auto dictionary=std::atomic_load(&current);
    Json result={{"success",success},{"state",enabled.load() ? "active":"disabled"},{"mode",dictionary ? dictionary->mode:""},
        {"restartRequired",dictionary && !enabled.load()},
        {"reason",reason},{"hits",{{"lookups",lookupCalls.load()},{"builders",builderCalls.load()},{"reads",fieldReads.load()},{"display",displayHits.load()},{"search",searchHits.load()}}}};
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

int SelfTest() {
    int cases=0;
    auto require=[&](bool condition){if(!condition) throw std::runtime_error("market self-test failed"); ++cases;};
    TextNode text("测试UTF8🙂"); std::string decoded;
    require(JsonString(text.node.data(),decoded) && decoded==text.text);
    std::array<unsigned char,16> shortNode{}; memcpy(shortNode.data(),"sample",6); shortNode[13]=7; uint16_t flags=0x1c05; memcpy(shortNode.data()+14,&flags,2);
    require(JsonString(shortNode.data(),decoded) && decoded=="sample");
    flags=3; memcpy(shortNode.data()+14,&flags,2); require(!JsonString(shortNode.data(),decoded));
    require(!JsonString(reinterpret_cast<void*>(1),decoded));
    auto input=Json::parse(R"({"mode":"simplified","rules":[{"section":"items","field":"type","source":"Anneau en fer","cn":"锻铁戒指","tw":"鍛鐵戒指","reverse":["type","term"]},{"section":"stats","field":"text","id":"pseudo.pseudo_total_cold_resistance","cn":"+#% 总冰霜抗性","tw":"+#% 總冰冷抗性"}]})");
    auto dictionary=ReadDictionary(input); int untouched=1;
    Site item{0,"items","type"},stat{0,"stats","text"};
    auto translated=Translate(*dictionary,item,"","Anneau en fer",&untouched);
    require(translated!=&untouched && JsonString(translated,decoded) && decoded=="锻铁戒指");
    require(Translate(*dictionary,item,"","Unknown",&untouched)==&untouched);
    require(Translate(*dictionary,stat,"other","+#% original",&untouched)==&untouched);
    translated=Translate(*dictionary,stat,"pseudo.pseudo_total_cold_resistance","+#% original",&untouched);
    require(JsonString(translated,decoded) && decoded=="+#% 总冰霜抗性");
    std::string output;
    const std::string query=R"({"query":{"type":"锻铁戒指","name":"Untouched","filters":{"trade_filters":{"filters":{"price":{"min":1.25,"max":99},"collapse":{"option":"true"}}}}},"sort":{"price":"asc"}})";
    require(ReverseQuery(*dictionary,query,output)); auto expected=Json::parse(query); expected["query"]["type"]="Anneau en fer";
    require(Json::parse(output)==expected);
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
    require(ReverseQuery(*ambiguous,R"json({"query":{"type":"鍛鐵戒指 (Anneau en fer)"}})json",output)
        && Json::parse(output)["query"]["type"]=="Anneau en fer");
    const std::string variant=R"({"query":{"type":{"option":"锻铁戒指","discriminator":"atlas2","other":7},"stats":[{"type":"and","filters":[{"id":"pseudo.pseudo_total_cold_resistance","value":{"min":25,"max":40}}]}],"filters":{"trade_filters":{"filters":{"collapse":{"option":"true"},"price":{"min":1.5,"max":3}}}}},"sort":{"price":"asc"}})";
    require(ReverseQuery(*dictionary,variant,output)); expected=Json::parse(variant); expected["query"]["type"]["option"]="Anneau en fer";
    require(Json::parse(output)==expected);
    auto retained=dictionary; dictionary=ReadDictionary(input);
    require(JsonString(Translate(*retained,item,"","Anneau en fer",&untouched),decoded) && decoded=="锻铁戒指");
    auto conflict=input["rules"][0]; conflict["tw"]="另一个名字"; input["rules"].push_back(conflict); input["mode"]="traditional";
    require(Translate(*ReadDictionary(input),item,"","Anneau en fer",&untouched)==&untouched);
    input["rules"]=Json::array({{{"section","items"},{"field","type"},{"source","Unknown"},{"cn",""},{"tw",""}}});
    require(Translate(*ReadDictionary(input),item,"","Unknown",&untouched)==&untouched);
    input["rules"]=Json::array();
    for(int i=0;i<20000;++i) input["rules"].push_back({{"section","stats"},{"field","text"},{"id","explicit."+std::to_string(i)},{"cn","测试 #"},{"tw","測試 #"}});
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

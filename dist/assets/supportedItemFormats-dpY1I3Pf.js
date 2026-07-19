import{_ as B,u as w,f as b,E as d,b as g,c as o,o as r,e as x,t as I,g as A,h as u,F as M,k as C,i as p,j as v,p as V,l as $,A as F,B as h,d as s,v as m}from"./index-BltIrlg_.js";const D={class:"preset-selector"},R={__name:"PresetSelector",props:{type:{type:String,default:"item",validator:i=>["item","map"].includes(i)}},setup(i){const l=i,e=w(),f=b(()=>l.type==="map"?e.mapPresets:e.itemPresets),t=b({get:()=>l.type==="map"?e.currentMapPresetId:e.currentItemPresetId,set:a=>{if(l.type==="map"?e.switchMapPreset(a):e.switchItemPreset(a)){const P=l.type==="map"?e.currentMapPreset:e.currentItemPreset;d.success(`已切换到：${P.name}`)}}}),_=b(()=>l.type==="map"?e.currentMapPreset:e.currentItemPreset);function k(){}function E(){h.prompt("请输入预设名称","新建预设",{confirmButtonText:"确定",cancelButtonText:"取消",inputPattern:/.+/,inputErrorMessage:"预设名称不能为空"}).then(({value:a})=>{const n=l.type==="map"?e.addMapPreset(a):e.addItemPreset(a);d.success(`预设"${n.name}"创建成功`)}).catch(()=>{})}function T(){h.prompt("请输入新的预设名称","重命名预设",{confirmButtonText:"确定",cancelButtonText:"取消",inputValue:_.value.name,inputPattern:/.+/,inputErrorMessage:"预设名称不能为空"}).then(({value:a})=>{a!==_.value.name&&(l.type==="map"?e.updateCurrentMapPreset({name:a}):e.updateCurrentItemPreset({name:a}),d.success(`预设已重命名为"${a}"`))}).catch(()=>{})}function N(){if(t.value==="default"){d.warning("不能删除默认预设");return}h.confirm(`确定要删除预设"${_.value.name}"吗？`,"删除预设",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"}).then(()=>{const a=_.value.name;(l.type==="map"?e.deleteMapPreset(t.value):e.deleteItemPreset(t.value))&&d.success(`预设"${a}"已删除`)}).catch(()=>{})}return(a,n)=>{const P=g("el-option"),S=g("el-select"),y=g("el-button");return r(),o("div",D,[x(S,{modelValue:t.value,"onUpdate:modelValue":n[0]||(n[0]=c=>t.value=c),placeholder:"选择预设",style:{width:"200px"},onChange:k},{default:u(()=>[(r(!0),o(M,null,C(f.value,c=>(r(),I(P,{key:c.id,label:c.name,value:c.id},null,8,["label","value"]))),128))]),_:1},8,["modelValue"]),x(y,{type:"primary",icon:v(V),onClick:E,style:{"margin-left":"10px"}},{default:u(()=>[...n[1]||(n[1]=[p(" 新建预设 ",-1)])]),_:1},8,["icon"]),t.value!=="default"?(r(),I(y,{key:0,type:"danger",icon:v($),onClick:N},{default:u(()=>[...n[2]||(n[2]=[p(" 删除 ",-1)])]),_:1},8,["icon"])):A("",!0),x(y,{type:"info",icon:v(F),onClick:T,style:{"margin-left":"10px"}},{default:u(()=>[...n[3]||(n[3]=[p(" 重命名 ",-1)])]),_:1},8,["icon"])])}}},K=B(R,[["__scopeId","data-v-6cbade86"]]),G={class:"format-panel"},O={class:"format-panel__heading"},U={class:"format-panel__fields"},j={class:"format-panel__details"},q={class:"format-panel__examples"},L={__name:"SupportedFormatPanel",props:{guidance:{type:Object,required:!0}},setup(i){return(l,e)=>{const f=g("el-tag");return r(),o("section",G,[s("div",O,[s("div",null,[s("h3",null,m(i.guidance.title),1),s("p",null,m(i.guidance.summary),1)]),x(f,{type:"warning",effect:"plain"},{default:u(()=>[...e[0]||(e[0]=[p("中文客户端",-1)])]),_:1})]),s("div",U,[(r(!0),o(M,null,C(i.guidance.fields,t=>(r(),I(f,{key:t,effect:"plain"},{default:u(()=>[p(m(t),1)]),_:2},1024))),128))]),s("details",j,[e[1]||(e[1]=s("summary",null,"查看完整剪贴板示例",-1)),s("div",q,[(r(!0),o(M,null,C(i.guidance.examples,t=>(r(),o("article",{key:t.id,class:"format-panel__example"},[s("h4",null,m(t.label),1),s("pre",null,m(t.text),1)]))),128))])])])}}},Q=B(L,[["__scopeId","data-v-9beba162"]]),z={title:"当前支持的物品匹配格式",summary:"支持中文客户端普通/详细复制；装备槽位共用同一结构，并识别普通、魔法、稀有、传奇、未鉴定与势力物品。",fields:["物品类别","稀有度","物品等级","插槽","基底/前缀/后缀/传奇属性","多行复合词缀","势力与特殊状态"],examples:[{id:"item-basic",label:"普通复制格式",text:`物品类别: 胸甲
稀 有 度: 稀有
胜利之幕
星芒战铠
--------
品质: +20%
护甲: 1200
--------
插槽: R-R-G B
--------
物品等级: 86
--------
+96 最大生命
+35% 火焰抗性`},{id:"item-detailed",label:"详细复制格式（Ctrl+Alt+C）",text:`物品类别: 护身符
稀有度: 稀有
风暴之符
青玉护身符
--------
物品等级: 84
--------
+16 全能力 (implicit)
{ 前缀属性 "健壮的" (等阶：1) — 生命 }
+89(80-89) 最大生命
{ 后缀属性 "焰抗的" (等阶：2) — 元素, 火焰, 抗性 }
+42% 火焰抗性
+20% 全域暴击伤害加成 (crafted)`},{id:"item-magic-implicit",label:"魔法物品与基底属性",text:`物品类别: 戒指
稀 有 度: 魔法
火山之红玉戒指
--------
物品等级: 72
--------
{ 基底属性 — 元素, 火焰, 抗性 }
+25(20-30)% 火焰抗性
--------
{ 后缀属性 "火山之" (等阶：3) — 元素, 火焰, 抗性 }
+41(36-41)% 火焰抗性
--------
出售获得通货:非绑定`},{id:"item-multiline-influence",label:"多行复合词缀与势力物品",text:`物品类别: 头部
稀 有 度: 稀有
毁灭 皇家之冠
梦魇战盔
--------
物品等级: 83
--------
{ 前缀属性 "塑界者的" (等阶：3) — 宝石 }
此物品上的技能石受到 16 级的 增大范围 辅助 — 数值不可调整
效果区域扩大 9(7-9)%
{ 后缀属性 "塑界之" (等阶：2) — 元素, 冰霜, 异常状态, 宝石 }
此物品上的技能石受到 18 级的 急冻 辅助 — 数值不可调整
冰霜异常状态效果提高 15(13-16)%
（冰霜元素异常状态指冰缓、冻结、脆弱）
--------
塑界之器`},{id:"item-unique",label:"传奇物品固定属性",text:`物品类别: 鞋子
稀 有 度: 传奇
宿命
逃亡之靴
--------
物品等级: 85
--------
{ 基底属性 — 混沌, 抗性 }
+17(13-17)% 混沌抗性
--------
{ 传奇属性 — 生命 }
+86(80-100) 最大生命
{ 传奇属性 — 速度 }
移动速度加快 30%
--------
出售获得通货:非绑定`},{id:"item-unidentified",label:"未鉴定势力物品",text:`物品类别: 单手斧
稀 有 度: 稀有
破城斧
--------
物品等级: 85
--------
未鉴定
--------
塑界之器`}]},H={title:"当前支持的地图匹配格式",summary:"所有地图统一按六项基底配置匹配；未出现的字段按 0 处理，不再区分普通地图和高级地图。",fields:["地图阶级 / 地图（N阶）","物品数量","物品稀有度","怪物群大小","更多地图","更多圣甲虫","更多通货"],examples:[{id:"map-normal",label:"常规三字段地图",text:`物品类别: 异界地图
稀 有 度: 稀有
危城广场
广场地图
--------
地图阶级: 16
物品数量: +82%
物品稀有度: +41%
怪物群大小: +25%
--------
物品等级: 83
--------
玩家的元素抗性上限降低 12%
怪物造成的伤害提高 30%`},{id:"map-t17",label:"完整六字段地图",text:`物品类别: 地图
稀有度: 稀有
堡垒
堡垒地图
--------
地图（17阶）
物品数量: +125%
物品稀有度: +68%
怪物群大小: +42%
更多地图: +35%
更多圣甲虫: +70%
更多通货: +45%
--------
物品等级: 84
--------
怪物拥有 40% 更多生命`},{id:"map-corrupted",label:"已腐化地图",text:`物品类别: 地图
稀 有 度: 稀有
昏暗坚定
瓦尔密殿地图
--------
物品数量: +55% (augmented)
物品稀有度: +32% (augmented)
怪物群大小: +21% (augmented)
--------
物品等级: 85
--------
怪物等级: 83
--------
{ 前缀属性 "导电的" (等阶：1) — 伤害, 物理, 元素, 闪电 }
怪物造成的 109(90-110)% 额外物理伤害视为闪电伤害
--------
已腐化`},{id:"map-unmodifiable",label:"不可改变地图",text:`物品类别: 地图
稀 有 度: 稀有
巨岩 绝境
瓦尔多地图
--------
地图区域: 恶灵学院
奖励: 烫金 普藤博的山谷
物品数量: +108% (augmented)
物品稀有度: +30% (augmented)
怪物群大小: +9% (augmented)
--------
物品等级: 100
--------
怪物等级: 84
--------
{ 传奇属性 }
区域内有裂界屠杀者
{ 传奇属性 }
区域额外有 4 个随机词缀
--------
在私人地图装置中使用可以前往该地图。只能被使用一次。
--------
不可改变`}]};[...z.examples,...H.examples];export{z as I,H as M,K as P,Q as S};

import{_ as B,u as S,f as v,E as p,b as P,c,o as r,e as y,t as I,g as w,h as u,F as M,k as b,i as m,j as C,p as V,l as $,z as F,A as h,d as n,v as d}from"./index-rwu51sRL.js";const D={class:"preset-selector"},R={__name:"PresetSelector",props:{type:{type:String,default:"item",validator:o=>["item","map"].includes(o)}},setup(o){const l=o,e=S(),f=v(()=>l.type==="map"?e.mapPresets:e.itemPresets),t=v({get:()=>l.type==="map"?e.currentMapPresetId:e.currentItemPresetId,set:a=>{if(l.type==="map"?e.switchMapPreset(a):e.switchItemPreset(a)){const x=l.type==="map"?e.currentMapPreset:e.currentItemPreset;p.success(`已切换到：${x.name}`)}}}),_=v(()=>l.type==="map"?e.currentMapPreset:e.currentItemPreset);function k(){}function E(){h.prompt("请输入预设名称","新建预设",{confirmButtonText:"确定",cancelButtonText:"取消",inputPattern:/.+/,inputErrorMessage:"预设名称不能为空"}).then(({value:a})=>{const s=l.type==="map"?e.addMapPreset(a):e.addItemPreset(a);p.success(`预设"${s.name}"创建成功`)}).catch(()=>{})}function T(){h.prompt("请输入新的预设名称","重命名预设",{confirmButtonText:"确定",cancelButtonText:"取消",inputValue:_.value.name,inputPattern:/.+/,inputErrorMessage:"预设名称不能为空"}).then(({value:a})=>{a!==_.value.name&&(l.type==="map"?e.updateCurrentMapPreset({name:a}):e.updateCurrentItemPreset({name:a}),p.success(`预设已重命名为"${a}"`))}).catch(()=>{})}function A(){if(t.value==="default"){p.warning("不能删除默认预设");return}h.confirm(`确定要删除预设"${_.value.name}"吗？`,"删除预设",{confirmButtonText:"确定",cancelButtonText:"取消",type:"warning"}).then(()=>{const a=_.value.name;(l.type==="map"?e.deleteMapPreset(t.value):e.deleteItemPreset(t.value))&&p.success(`预设"${a}"已删除`)}).catch(()=>{})}return(a,s)=>{const x=P("el-option"),N=P("el-select"),g=P("el-button");return r(),c("div",D,[y(N,{modelValue:t.value,"onUpdate:modelValue":s[0]||(s[0]=i=>t.value=i),placeholder:"选择预设",style:{width:"200px"},onChange:k},{default:u(()=>[(r(!0),c(M,null,b(f.value,i=>(r(),I(x,{key:i.id,label:i.name,value:i.id},null,8,["label","value"]))),128))]),_:1},8,["modelValue"]),y(g,{type:"primary",icon:C(V),onClick:E,style:{"margin-left":"10px"}},{default:u(()=>[...s[1]||(s[1]=[m(" 新建预设 ",-1)])]),_:1},8,["icon"]),t.value!=="default"?(r(),I(g,{key:0,type:"danger",icon:C($),onClick:A},{default:u(()=>[...s[2]||(s[2]=[m(" 删除 ",-1)])]),_:1},8,["icon"])):w("",!0),y(g,{type:"info",icon:C(F),onClick:T,style:{"margin-left":"10px"}},{default:u(()=>[...s[3]||(s[3]=[m(" 重命名 ",-1)])]),_:1},8,["icon"])])}}},K=B(R,[["__scopeId","data-v-6cbade86"]]),G={class:"format-panel"},O={class:"format-panel__heading"},U={class:"format-panel__fields"},j={class:"format-panel__details"},q={class:"format-panel__examples"},z={__name:"SupportedFormatPanel",props:{guidance:{type:Object,required:!0}},setup(o){return(l,e)=>{const f=P("el-tag");return r(),c("section",G,[n("div",O,[n("div",null,[n("h3",null,d(o.guidance.title),1),n("p",null,d(o.guidance.summary),1)]),y(f,{type:"warning",effect:"plain"},{default:u(()=>[...e[0]||(e[0]=[m("中文客户端",-1)])]),_:1})]),n("div",U,[(r(!0),c(M,null,b(o.guidance.fields,t=>(r(),I(f,{key:t,effect:"plain"},{default:u(()=>[m(d(t),1)]),_:2},1024))),128))]),n("details",j,[e[1]||(e[1]=n("summary",null,"查看完整剪贴板示例",-1)),n("div",q,[(r(!0),c(M,null,b(o.guidance.examples,t=>(r(),c("article",{key:t.id,class:"format-panel__example"},[n("h4",null,d(t.label),1),n("pre",null,d(t.text),1)]))),128))])])])}}},Q=B(z,[["__scopeId","data-v-9beba162"]]),L={title:"当前支持的物品匹配格式",summary:"支持中文客户端 Ctrl+C / Ctrl+Alt+C 复制文本；游戏更新后可用下方原文核对关键字段。",fields:["物品类别","稀有度","物品等级","插槽","详细词缀头","(implicit)","(crafted)","显式词缀"],examples:[{id:"item-basic",label:"普通复制格式",text:`物品类别: 胸甲
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
+20% 全域暴击伤害加成 (crafted)`}]},H={title:"当前支持的地图匹配格式",summary:"支持“异界地图/地图”类别及两种阶级写法；基础属性和外延词缀按下方中文字段解析。",fields:["地图阶级 / 地图（N阶）","物品数量","物品稀有度","怪物群大小","更多地图","更多圣甲虫","更多通货"],examples:[{id:"map-normal",label:"普通地图格式",text:`物品类别: 异界地图
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
怪物造成的伤害提高 30%`},{id:"map-t17",label:"高级地图格式",text:`物品类别: 地图
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
怪物拥有 40% 更多生命`}]};[...L.examples,...H.examples];export{L as I,H as M,K as P,Q as S};

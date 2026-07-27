const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./DashboardView-BCXfl_RW.js","./el-tag-WLdGvtB8.js","./el-button-lrnYRnHK.js","./el-button-BYxgutQ6.css","./el-tag-DljBBxJR.css","./el-card-D1NjCzso.js","./el-card-CSdhzOsS.css","./craftingStore-BXVRbLMX.js","./vendorRegex-C2AAg4XE.js","./DashboardView-cKcKCBFC.css","./ItemsView-C3BCcW_J.js","./PresetSelector-ClRsCIdm.js","./el-select-DoS-lM6P.js","./el-scrollbar-BwBcxI_f.js","./el-scrollbar-BWxh-h6K.css","./el-input-number-CfrVzrhn.js","./el-input-number-DnM3OdGp.css","./el-select-D_oyzAZN.css","./el-message-box-DX_MEQEf.js","./el-overlay-Cyw_JWGf.js","./el-overlay-CUAhHdWP.css","./el-message-box-B9YsRpU9.css","./PresetSelector-CDOic8gT.css","./KeyCaptureInput-DbNAiT3h.js","./KeyCaptureInput-CMoxrSOy.css","./el-checkbox-DU3RdvpG.js","./omit-CEIQOoa4.js","./el-checkbox-DIj50LEB.css","./supportedItemFormats-Bi2_Y8D9.js","./supportedItemFormats-DOzOaE8B.css","./ItemsView-DTb0ux6N.css","./BagView-k32kIZEO.js","./el-slider-UZHroL9D.js","./debounce-DKzk5FW2.js","./el-slider-DXOXW-KM.css","./el-table-column-Bym1DYUj.js","./el-table-column-C1e4Op8a.css","./el-empty-CgSJG0HY.js","./el-empty-D4ZqTl4F.css","./el-alert-B0EU9x0S.js","./el-alert-G57rL0jl.css","./el-form-item-BOZrmsoc.js","./el-switch-B4tn8HYi.js","./el-switch-B5lTGWdM.css","./BagView-BK5K-EJS.css","./el-form-BWkJzdQ_.css","./MapView-R3pU-tjf.js","./MapView-CeD0fqic.css","./CombatView-C9_30uCZ.js","./el-radio-button-ZpJqiVY1.js","./el-radio-button-BzrEi8MV.css","./CombatView-CEjSJfZw.css","./StoryView-DSkc-AFf.js","./StoryView-DafEJ6qH.css","./ShopView-Dc8FS4O3.js","./ShopView-CGk9OaDs.css","./CraftPlannerView-DOg7pyWl.js","./CraftPlannerView-DJ2lctOK.css","./SettingsView-nvdkm4FY.js","./OverlayContent-BupnKxfK.js","./OverlayContent-wo8yga6z.css","./SettingsView-cLtWnQoG.css","./Help-md8tQ1Ti.js","./Help-DPul02UM.css","./OverlayView-BZ9yHIPt.js","./OverlayView-Colmh0aD.css","./DebugOverlay-BSvXRNuO.js","./DebugOverlay-Br_OlXeD.css","./StoryOverlayView-DaXfAXUm.js","./StoryOverlayView-D3OG4v_r.css","./BagStashOverlayView-DGcBCDAw.js","./BagStashOverlayView-Ct3480tI.css","./CoordinatePickerView-bEa7NZUc.js","./CoordinatePickerView-CYbqH7nz.css"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();/**
* @vue/shared v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function da(e){const t=Object.create(null);for(const n of e.split(","))t[n]=1;return n=>n in t}const Ne={},Pr=[],pt=()=>{},nf=()=>!1,Ns=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),ma=e=>e.startsWith("onUpdate:"),Ke=Object.assign,ha=(e,t)=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)},Pm=Object.prototype.hasOwnProperty,Pe=(e,t)=>Pm.call(e,t),ie=Array.isArray,Cr=e=>No(e)==="[object Map]",ks=e=>No(e)==="[object Set]",yl=e=>No(e)==="[object Date]",ue=e=>typeof e=="function",we=e=>typeof e=="string",Nt=e=>typeof e=="symbol",Ee=e=>e!==null&&typeof e=="object",rf=e=>(Ee(e)||ue(e))&&ue(e.then)&&ue(e.catch),of=Object.prototype.toString,No=e=>of.call(e),Cm=e=>No(e).slice(8,-1),sf=e=>No(e)==="[object Object]",ga=e=>we(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,oo=da(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),Fs=e=>{const t=Object.create(null);return n=>t[n]||(t[n]=e(n))},Tm=/-\w/g,xt=Fs(e=>e.replace(Tm,t=>t.slice(1).toUpperCase())),Am=/\B([A-Z])/g,Dn=Fs(e=>e.replace(Am,"-$1").toLowerCase()),Ls=Fs(e=>e.charAt(0).toUpperCase()+e.slice(1)),ns=Fs(e=>e?`on${Ls(e)}`:""),Nn=(e,t)=>!Object.is(e,t),rs=(e,...t)=>{for(let n=0;n<e.length;n++)e[n](...t)},af=(e,t,n,r=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:r,value:n})},_a=e=>{const t=parseFloat(e);return isNaN(t)?e:t},Im=e=>{const t=we(e)?Number(e):NaN;return isNaN(t)?e:t};let bl;const Ds=()=>bl||(bl=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function Qt(e){if(ie(e)){const t={};for(let n=0;n<e.length;n++){const r=e[n],o=we(r)?Nm(r):Qt(r);if(o)for(const s in o)t[s]=o[s]}return t}else if(we(e)||Ee(e))return e}const Om=/;(?![^(]*\))/g,Mm=/:([^]+)/,Rm=/\/\*[^]*?\*\//g;function Nm(e){const t={};return e.replace(Rm,"").split(Om).forEach(n=>{if(n){const r=n.split(Mm);r.length>1&&(t[r[0].trim()]=r[1].trim())}}),t}function De(e){let t="";if(we(e))t=e;else if(ie(e))for(let n=0;n<e.length;n++){const r=De(e[n]);r&&(t+=r+" ")}else if(Ee(e))for(const n in e)e[n]&&(t+=n+" ");return t.trim()}function tE(e){if(!e)return null;let{class:t,style:n}=e;return t&&!we(t)&&(e.class=De(t)),n&&(e.style=Qt(n)),e}const km="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",Fm=da(km);function lf(e){return!!e||e===""}function Lm(e,t){if(e.length!==t.length)return!1;let n=!0;for(let r=0;n&&r<e.length;r++)n=Ir(e[r],t[r]);return n}function Ir(e,t){if(e===t)return!0;let n=yl(e),r=yl(t);if(n||r)return n&&r?e.getTime()===t.getTime():!1;if(n=Nt(e),r=Nt(t),n||r)return e===t;if(n=ie(e),r=ie(t),n||r)return n&&r?Lm(e,t):!1;if(n=Ee(e),r=Ee(t),n||r){if(!n||!r)return!1;const o=Object.keys(e).length,s=Object.keys(t).length;if(o!==s)return!1;for(const i in e){const a=e.hasOwnProperty(i),l=t.hasOwnProperty(i);if(a&&!l||!a&&l||!Ir(e[i],t[i]))return!1}}return String(e)===String(t)}function cf(e,t){return e.findIndex(n=>Ir(n,t))}const uf=e=>!!(e&&e.__v_isRef===!0),ko=e=>we(e)?e:e==null?"":ie(e)||Ee(e)&&(e.toString===of||!ue(e.toString))?uf(e)?ko(e.value):JSON.stringify(e,ff,2):String(e),ff=(e,t)=>uf(t)?ff(e,t.value):Cr(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((n,[r,o],s)=>(n[ni(r,s)+" =>"]=o,n),{})}:ks(t)?{[`Set(${t.size})`]:[...t.values()].map(n=>ni(n))}:Nt(t)?ni(t):Ee(t)&&!ie(t)&&!sf(t)?String(t):t,ni=(e,t="")=>{var n;return Nt(e)?`Symbol(${(n=e.description)!=null?n:t})`:e};/**
* @vue/reactivity v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let nt;class pf{constructor(t=!1){this.detached=t,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.parent=nt,!t&&nt&&(this.index=(nt.scopes||(nt.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,n;if(this.scopes)for(t=0,n=this.scopes.length;t<n;t++)this.scopes[t].pause();for(t=0,n=this.effects.length;t<n;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,n;if(this.scopes)for(t=0,n=this.scopes.length;t<n;t++)this.scopes[t].resume();for(t=0,n=this.effects.length;t<n;t++)this.effects[t].resume()}}run(t){if(this._active){const n=nt;try{return nt=this,t()}finally{nt=n}}}on(){++this._on===1&&(this.prevScope=nt,nt=this)}off(){this._on>0&&--this._on===0&&(nt=this.prevScope,this.prevScope=void 0)}stop(t){if(this._active){this._active=!1;let n,r;for(n=0,r=this.effects.length;n<r;n++)this.effects[n].stop();for(this.effects.length=0,n=0,r=this.cleanups.length;n<r;n++)this.cleanups[n]();if(this.cleanups.length=0,this.scopes){for(n=0,r=this.scopes.length;n<r;n++)this.scopes[n].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const o=this.parent.scopes.pop();o&&o!==this&&(this.parent.scopes[this.index]=o,o.index=this.index)}this.parent=void 0}}}function df(e){return new pf(e)}function va(){return nt}function mf(e,t=!1){nt&&nt.cleanups.push(e)}let Fe;const ri=new WeakSet;class hf{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,nt&&nt.active&&nt.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,ri.has(this)&&(ri.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||_f(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,wl(this),vf(this);const t=Fe,n=Mt;Fe=this,Mt=!0;try{return this.fn()}finally{yf(this),Fe=t,Mt=n,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)wa(t);this.deps=this.depsTail=void 0,wl(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?ri.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){Mi(this)&&this.run()}get dirty(){return Mi(this)}}let gf=0,so,io;function _f(e,t=!1){if(e.flags|=8,t){e.next=io,io=e;return}e.next=so,so=e}function ya(){gf++}function ba(){if(--gf>0)return;if(io){let t=io;for(io=void 0;t;){const n=t.next;t.next=void 0,t.flags&=-9,t=n}}let e;for(;so;){let t=so;for(so=void 0;t;){const n=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(r){e||(e=r)}t=n}}if(e)throw e}function vf(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function yf(e){let t,n=e.depsTail,r=n;for(;r;){const o=r.prevDep;r.version===-1?(r===n&&(n=o),wa(r),Dm(r)):t=r,r.dep.activeLink=r.prevActiveLink,r.prevActiveLink=void 0,r=o}e.deps=t,e.depsTail=n}function Mi(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(bf(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function bf(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===yo)||(e.globalVersion=yo,!e.isSSR&&e.flags&128&&(!e.deps&&!e._dirty||!Mi(e))))return;e.flags|=2;const t=e.dep,n=Fe,r=Mt;Fe=e,Mt=!0;try{vf(e);const o=e.fn(e._value);(t.version===0||Nn(o,e._value))&&(e.flags|=128,e._value=o,t.version++)}catch(o){throw t.version++,o}finally{Fe=n,Mt=r,yf(e),e.flags&=-3}}function wa(e,t=!1){const{dep:n,prevSub:r,nextSub:o}=e;if(r&&(r.nextSub=o,e.prevSub=void 0),o&&(o.prevSub=r,e.nextSub=void 0),n.subs===e&&(n.subs=r,!r&&n.computed)){n.computed.flags&=-5;for(let s=n.computed.deps;s;s=s.nextDep)wa(s,!0)}!t&&!--n.sc&&n.map&&n.map.delete(n.key)}function Dm(e){const{prevDep:t,nextDep:n}=e;t&&(t.nextDep=n,e.prevDep=void 0),n&&(n.prevDep=t,e.nextDep=void 0)}let Mt=!0;const wf=[];function cn(){wf.push(Mt),Mt=!1}function un(){const e=wf.pop();Mt=e===void 0?!0:e}function wl(e){const{cleanup:t}=e;if(e.cleanup=void 0,t){const n=Fe;Fe=void 0;try{t()}finally{Fe=n}}}let yo=0;class Bm{constructor(t,n){this.sub=t,this.dep=n,this.version=n.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class xa{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(t){if(!Fe||!Mt||Fe===this.computed)return;let n=this.activeLink;if(n===void 0||n.sub!==Fe)n=this.activeLink=new Bm(Fe,this),Fe.deps?(n.prevDep=Fe.depsTail,Fe.depsTail.nextDep=n,Fe.depsTail=n):Fe.deps=Fe.depsTail=n,xf(n);else if(n.version===-1&&(n.version=this.version,n.nextDep)){const r=n.nextDep;r.prevDep=n.prevDep,n.prevDep&&(n.prevDep.nextDep=r),n.prevDep=Fe.depsTail,n.nextDep=void 0,Fe.depsTail.nextDep=n,Fe.depsTail=n,Fe.deps===n&&(Fe.deps=r)}return n}trigger(t){this.version++,yo++,this.notify(t)}notify(t){ya();try{for(let n=this.subs;n;n=n.prevSub)n.sub.notify()&&n.sub.dep.notify()}finally{ba()}}}function xf(e){if(e.dep.sc++,e.sub.flags&4){const t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let r=t.deps;r;r=r.nextDep)xf(r)}const n=e.dep.subs;n!==e&&(e.prevSub=n,n&&(n.nextSub=e)),e.dep.subs=e}}const fs=new WeakMap,Xn=Symbol(""),Ri=Symbol(""),bo=Symbol("");function rt(e,t,n){if(Mt&&Fe){let r=fs.get(e);r||fs.set(e,r=new Map);let o=r.get(n);o||(r.set(n,o=new xa),o.map=r,o.key=n),o.track()}}function on(e,t,n,r,o,s){const i=fs.get(e);if(!i){yo++;return}const a=l=>{l&&l.trigger()};if(ya(),t==="clear")i.forEach(a);else{const l=ie(e),c=l&&ga(n);if(l&&n==="length"){const u=Number(r);i.forEach((f,p)=>{(p==="length"||p===bo||!Nt(p)&&p>=u)&&a(f)})}else switch((n!==void 0||i.has(void 0))&&a(i.get(n)),c&&a(i.get(bo)),t){case"add":l?c&&a(i.get("length")):(a(i.get(Xn)),Cr(e)&&a(i.get(Ri)));break;case"delete":l||(a(i.get(Xn)),Cr(e)&&a(i.get(Ri)));break;case"set":Cr(e)&&a(i.get(Xn));break}}ba()}function $m(e,t){const n=fs.get(e);return n&&n.get(t)}function dr(e){const t=Se(e);return t===e?t:(rt(t,"iterate",bo),Et(e)?t:t.map(Xe))}function Bs(e){return rt(e=Se(e),"iterate",bo),e}const jm={__proto__:null,[Symbol.iterator](){return oi(this,Symbol.iterator,Xe)},concat(...e){return dr(this).concat(...e.map(t=>ie(t)?dr(t):t))},entries(){return oi(this,"entries",e=>(e[1]=Xe(e[1]),e))},every(e,t){return Xt(this,"every",e,t,void 0,arguments)},filter(e,t){return Xt(this,"filter",e,t,n=>n.map(Xe),arguments)},find(e,t){return Xt(this,"find",e,t,Xe,arguments)},findIndex(e,t){return Xt(this,"findIndex",e,t,void 0,arguments)},findLast(e,t){return Xt(this,"findLast",e,t,Xe,arguments)},findLastIndex(e,t){return Xt(this,"findLastIndex",e,t,void 0,arguments)},forEach(e,t){return Xt(this,"forEach",e,t,void 0,arguments)},includes(...e){return si(this,"includes",e)},indexOf(...e){return si(this,"indexOf",e)},join(e){return dr(this).join(e)},lastIndexOf(...e){return si(this,"lastIndexOf",e)},map(e,t){return Xt(this,"map",e,t,void 0,arguments)},pop(){return Jr(this,"pop")},push(...e){return Jr(this,"push",e)},reduce(e,...t){return xl(this,"reduce",e,t)},reduceRight(e,...t){return xl(this,"reduceRight",e,t)},shift(){return Jr(this,"shift")},some(e,t){return Xt(this,"some",e,t,void 0,arguments)},splice(...e){return Jr(this,"splice",e)},toReversed(){return dr(this).toReversed()},toSorted(e){return dr(this).toSorted(e)},toSpliced(...e){return dr(this).toSpliced(...e)},unshift(...e){return Jr(this,"unshift",e)},values(){return oi(this,"values",Xe)}};function oi(e,t,n){const r=Bs(e),o=r[t]();return r!==e&&!Et(e)&&(o._next=o.next,o.next=()=>{const s=o._next();return s.done||(s.value=n(s.value)),s}),o}const Hm=Array.prototype;function Xt(e,t,n,r,o,s){const i=Bs(e),a=i!==e&&!Et(e),l=i[t];if(l!==Hm[t]){const f=l.apply(e,s);return a?Xe(f):f}let c=n;i!==e&&(a?c=function(f,p){return n.call(this,Xe(f),p,e)}:n.length>2&&(c=function(f,p){return n.call(this,f,p,e)}));const u=l.call(i,c,r);return a&&o?o(u):u}function xl(e,t,n,r){const o=Bs(e);let s=n;return o!==e&&(Et(e)?n.length>3&&(s=function(i,a,l){return n.call(this,i,a,l,e)}):s=function(i,a,l){return n.call(this,i,Xe(a),l,e)}),o[t](s,...r)}function si(e,t,n){const r=Se(e);rt(r,"iterate",bo);const o=r[t](...n);return(o===-1||o===!1)&&Pa(n[0])?(n[0]=Se(n[0]),r[t](...n)):o}function Jr(e,t,n=[]){cn(),ya();const r=Se(e)[t].apply(e,n);return ba(),un(),r}const Vm=da("__proto__,__v_isRef,__isVue"),Sf=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(Nt));function zm(e){Nt(e)||(e=String(e));const t=Se(this);return rt(t,"has",e),t.hasOwnProperty(e)}class Ef{constructor(t=!1,n=!1){this._isReadonly=t,this._isShallow=n}get(t,n,r){if(n==="__v_skip")return t.__v_skip;const o=this._isReadonly,s=this._isShallow;if(n==="__v_isReactive")return!o;if(n==="__v_isReadonly")return o;if(n==="__v_isShallow")return s;if(n==="__v_raw")return r===(o?s?Zm:Af:s?Tf:Cf).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(r)?t:void 0;const i=ie(t);if(!o){let l;if(i&&(l=jm[n]))return l;if(n==="hasOwnProperty")return zm}const a=Reflect.get(t,n,$e(t)?t:r);if((Nt(n)?Sf.has(n):Vm(n))||(o||rt(t,"get",n),s))return a;if($e(a)){const l=i&&ga(n)?a:a.value;return o&&Ee(l)?Or(l):l}return Ee(a)?o?Or(a):Bn(a):a}}class Pf extends Ef{constructor(t=!1){super(!1,t)}set(t,n,r,o){let s=t[n];if(!this._isShallow){const l=Ln(s);if(!Et(r)&&!Ln(r)&&(s=Se(s),r=Se(r)),!ie(t)&&$e(s)&&!$e(r))return l||(s.value=r),!0}const i=ie(t)&&ga(n)?Number(n)<t.length:Pe(t,n),a=Reflect.set(t,n,r,$e(t)?t:o);return t===Se(o)&&(i?Nn(r,s)&&on(t,"set",n,r):on(t,"add",n,r)),a}deleteProperty(t,n){const r=Pe(t,n);t[n];const o=Reflect.deleteProperty(t,n);return o&&r&&on(t,"delete",n,void 0),o}has(t,n){const r=Reflect.has(t,n);return(!Nt(n)||!Sf.has(n))&&rt(t,"has",n),r}ownKeys(t){return rt(t,"iterate",ie(t)?"length":Xn),Reflect.ownKeys(t)}}class Wm extends Ef{constructor(t=!1){super(!0,t)}set(t,n){return!0}deleteProperty(t,n){return!0}}const Um=new Pf,Gm=new Wm,Km=new Pf(!0);const Ni=e=>e,zo=e=>Reflect.getPrototypeOf(e);function qm(e,t,n){return function(...r){const o=this.__v_raw,s=Se(o),i=Cr(s),a=e==="entries"||e===Symbol.iterator&&i,l=e==="keys"&&i,c=o[e](...r),u=n?Ni:t?ps:Xe;return!t&&rt(s,"iterate",l?Ri:Xn),{next(){const{value:f,done:p}=c.next();return p?{value:f,done:p}:{value:a?[u(f[0]),u(f[1])]:u(f),done:p}},[Symbol.iterator](){return this}}}}function Wo(e){return function(...t){return e==="delete"?!1:e==="clear"?void 0:this}}function Jm(e,t){const n={get(o){const s=this.__v_raw,i=Se(s),a=Se(o);e||(Nn(o,a)&&rt(i,"get",o),rt(i,"get",a));const{has:l}=zo(i),c=t?Ni:e?ps:Xe;if(l.call(i,o))return c(s.get(o));if(l.call(i,a))return c(s.get(a));s!==i&&s.get(o)},get size(){const o=this.__v_raw;return!e&&rt(Se(o),"iterate",Xn),o.size},has(o){const s=this.__v_raw,i=Se(s),a=Se(o);return e||(Nn(o,a)&&rt(i,"has",o),rt(i,"has",a)),o===a?s.has(o):s.has(o)||s.has(a)},forEach(o,s){const i=this,a=i.__v_raw,l=Se(a),c=t?Ni:e?ps:Xe;return!e&&rt(l,"iterate",Xn),a.forEach((u,f)=>o.call(s,c(u),c(f),i))}};return Ke(n,e?{add:Wo("add"),set:Wo("set"),delete:Wo("delete"),clear:Wo("clear")}:{add(o){!t&&!Et(o)&&!Ln(o)&&(o=Se(o));const s=Se(this);return zo(s).has.call(s,o)||(s.add(o),on(s,"add",o,o)),this},set(o,s){!t&&!Et(s)&&!Ln(s)&&(s=Se(s));const i=Se(this),{has:a,get:l}=zo(i);let c=a.call(i,o);c||(o=Se(o),c=a.call(i,o));const u=l.call(i,o);return i.set(o,s),c?Nn(s,u)&&on(i,"set",o,s):on(i,"add",o,s),this},delete(o){const s=Se(this),{has:i,get:a}=zo(s);let l=i.call(s,o);l||(o=Se(o),l=i.call(s,o)),a&&a.call(s,o);const c=s.delete(o);return l&&on(s,"delete",o,void 0),c},clear(){const o=Se(this),s=o.size!==0,i=o.clear();return s&&on(o,"clear",void 0,void 0),i}}),["keys","values","entries",Symbol.iterator].forEach(o=>{n[o]=qm(o,e,t)}),n}function Sa(e,t){const n=Jm(e,t);return(r,o,s)=>o==="__v_isReactive"?!e:o==="__v_isReadonly"?e:o==="__v_raw"?r:Reflect.get(Pe(n,o)&&o in r?n:r,o,s)}const Ym={get:Sa(!1,!1)},Qm={get:Sa(!1,!0)},Xm={get:Sa(!0,!1)};const Cf=new WeakMap,Tf=new WeakMap,Af=new WeakMap,Zm=new WeakMap;function eh(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function th(e){return e.__v_skip||!Object.isExtensible(e)?0:eh(Cm(e))}function Bn(e){return Ln(e)?e:Ea(e,!1,Um,Ym,Cf)}function $s(e){return Ea(e,!1,Km,Qm,Tf)}function Or(e){return Ea(e,!0,Gm,Xm,Af)}function Ea(e,t,n,r,o){if(!Ee(e)||e.__v_raw&&!(t&&e.__v_isReactive))return e;const s=th(e);if(s===0)return e;const i=o.get(e);if(i)return i;const a=new Proxy(e,s===2?r:n);return o.set(e,a),a}function kn(e){return Ln(e)?kn(e.__v_raw):!!(e&&e.__v_isReactive)}function Ln(e){return!!(e&&e.__v_isReadonly)}function Et(e){return!!(e&&e.__v_isShallow)}function Pa(e){return e?!!e.__v_raw:!1}function Se(e){const t=e&&e.__v_raw;return t?Se(t):e}function Ca(e){return!Pe(e,"__v_skip")&&Object.isExtensible(e)&&af(e,"__v_skip",!0),e}const Xe=e=>Ee(e)?Bn(e):e,ps=e=>Ee(e)?Or(e):e;function $e(e){return e?e.__v_isRef===!0:!1}function L(e){return If(e,!1)}function Ta(e){return If(e,!0)}function If(e,t){return $e(e)?e:new nh(e,t)}class nh{constructor(t,n){this.dep=new xa,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=n?t:Se(t),this._value=n?t:Xe(t),this.__v_isShallow=n}get value(){return this.dep.track(),this._value}set value(t){const n=this._rawValue,r=this.__v_isShallow||Et(t)||Ln(t);t=r?t:Se(t),Nn(t,n)&&(this._rawValue=t,this._value=r?t:Xe(t),this.dep.trigger())}}function nE(e){e.dep&&e.dep.trigger()}function w(e){return $e(e)?e.value:e}const rh={get:(e,t,n)=>t==="__v_raw"?e:w(Reflect.get(e,t,n)),set:(e,t,n,r)=>{const o=e[t];return $e(o)&&!$e(n)?(o.value=n,!0):Reflect.set(e,t,n,r)}};function Of(e){return kn(e)?e:new Proxy(e,rh)}function oh(e){const t=ie(e)?new Array(e.length):{};for(const n in e)t[n]=Mf(e,n);return t}class sh{constructor(t,n,r){this._object=t,this._key=n,this._defaultValue=r,this.__v_isRef=!0,this._value=void 0}get value(){const t=this._object[this._key];return this._value=t===void 0?this._defaultValue:t}set value(t){this._object[this._key]=t}get dep(){return $m(Se(this._object),this._key)}}class ih{constructor(t){this._getter=t,this.__v_isRef=!0,this.__v_isReadonly=!0,this._value=void 0}get value(){return this._value=this._getter()}}function br(e,t,n){return $e(e)?e:ue(e)?new ih(e):Ee(e)&&arguments.length>1?Mf(e,t,n):L(e)}function Mf(e,t,n){const r=e[t];return $e(r)?r:new sh(e,t,n)}class ah{constructor(t,n,r){this.fn=t,this.setter=n,this._value=void 0,this.dep=new xa(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=yo-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!n,this.isSSR=r}notify(){if(this.flags|=16,!(this.flags&8)&&Fe!==this)return _f(this,!0),!0}get value(){const t=this.dep.track();return bf(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function lh(e,t,n=!1){let r,o;return ue(e)?r=e:(r=e.get,o=e.set),new ah(r,o,n)}const Uo={},ds=new WeakMap;let Kn;function ch(e,t=!1,n=Kn){if(n){let r=ds.get(n);r||ds.set(n,r=[]),r.push(e)}}function uh(e,t,n=Ne){const{immediate:r,deep:o,once:s,scheduler:i,augmentJob:a,call:l}=n,c=P=>o?P:Et(P)||o===!1||o===0?sn(P,1):sn(P);let u,f,p,d,m=!1,g=!1;if($e(e)?(f=()=>e.value,m=Et(e)):kn(e)?(f=()=>c(e),m=!0):ie(e)?(g=!0,m=e.some(P=>kn(P)||Et(P)),f=()=>e.map(P=>{if($e(P))return P.value;if(kn(P))return c(P);if(ue(P))return l?l(P,2):P()})):ue(e)?t?f=l?()=>l(e,2):e:f=()=>{if(p){cn();try{p()}finally{un()}}const P=Kn;Kn=u;try{return l?l(e,3,[d]):e(d)}finally{Kn=P}}:f=pt,t&&o){const P=f,R=o===!0?1/0:o;f=()=>sn(P(),R)}const x=va(),b=()=>{u.stop(),x&&x.active&&ha(x.effects,u)};if(s&&t){const P=t;t=(...R)=>{P(...R),b()}}let C=g?new Array(e.length).fill(Uo):Uo;const v=P=>{if(!(!(u.flags&1)||!u.dirty&&!P))if(t){const R=u.run();if(o||m||(g?R.some(($,B)=>Nn($,C[B])):Nn(R,C))){p&&p();const $=Kn;Kn=u;try{const B=[R,C===Uo?void 0:g&&C[0]===Uo?[]:C,d];C=R,l?l(t,3,B):t(...B)}finally{Kn=$}}}else u.run()};return a&&a(v),u=new hf(f),u.scheduler=i?()=>i(v,!1):v,d=P=>ch(P,!1,u),p=u.onStop=()=>{const P=ds.get(u);if(P){if(l)l(P,4);else for(const R of P)R();ds.delete(u)}},t?r?v(!0):C=u.run():i?i(v.bind(null,!0),!0):u.run(),b.pause=u.pause.bind(u),b.resume=u.resume.bind(u),b.stop=b,b}function sn(e,t=1/0,n){if(t<=0||!Ee(e)||e.__v_skip||(n=n||new Map,(n.get(e)||0)>=t))return e;if(n.set(e,t),t--,$e(e))sn(e.value,t,n);else if(ie(e))for(let r=0;r<e.length;r++)sn(e[r],t,n);else if(ks(e)||Cr(e))e.forEach(r=>{sn(r,t,n)});else if(sf(e)){for(const r in e)sn(e[r],t,n);for(const r of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,r)&&sn(e[r],t,n)}return e}/**
* @vue/runtime-core v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function Fo(e,t,n,r){try{return r?e(...r):e()}catch(o){js(o,t,n)}}function kt(e,t,n,r){if(ue(e)){const o=Fo(e,t,n,r);return o&&rf(o)&&o.catch(s=>{js(s,t,n)}),o}if(ie(e)){const o=[];for(let s=0;s<e.length;s++)o.push(kt(e[s],t,n,r));return o}}function js(e,t,n,r=!0){const o=t?t.vnode:null,{errorHandler:s,throwUnhandledErrorInProduction:i}=t&&t.appContext.config||Ne;if(t){let a=t.parent;const l=t.proxy,c=`https://vuejs.org/error-reference/#runtime-${n}`;for(;a;){const u=a.ec;if(u){for(let f=0;f<u.length;f++)if(u[f](e,l,c)===!1)return}a=a.parent}if(s){cn(),Fo(s,null,10,[e,l,c]),un();return}}fh(e,n,o,r,i)}function fh(e,t,n,r=!0,o=!1){if(o)throw e;console.error(e)}const ft=[];let Vt=-1;const Tr=[];let Pn=null,_r=0;const Rf=Promise.resolve();let ms=null;function Kt(e){const t=ms||Rf;return e?t.then(this?e.bind(this):e):t}function ph(e){let t=Vt+1,n=ft.length;for(;t<n;){const r=t+n>>>1,o=ft[r],s=wo(o);s<e||s===e&&o.flags&2?t=r+1:n=r}return t}function Aa(e){if(!(e.flags&1)){const t=wo(e),n=ft[ft.length-1];!n||!(e.flags&2)&&t>=wo(n)?ft.push(e):ft.splice(ph(t),0,e),e.flags|=1,Nf()}}function Nf(){ms||(ms=Rf.then(Ff))}function dh(e){ie(e)?Tr.push(...e):Pn&&e.id===-1?Pn.splice(_r+1,0,e):e.flags&1||(Tr.push(e),e.flags|=1),Nf()}function Sl(e,t,n=Vt+1){for(;n<ft.length;n++){const r=ft[n];if(r&&r.flags&2){if(e&&r.id!==e.uid)continue;ft.splice(n,1),n--,r.flags&4&&(r.flags&=-2),r(),r.flags&4||(r.flags&=-2)}}}function kf(e){if(Tr.length){const t=[...new Set(Tr)].sort((n,r)=>wo(n)-wo(r));if(Tr.length=0,Pn){Pn.push(...t);return}for(Pn=t,_r=0;_r<Pn.length;_r++){const n=Pn[_r];n.flags&4&&(n.flags&=-2),n.flags&8||n(),n.flags&=-2}Pn=null,_r=0}}const wo=e=>e.id==null?e.flags&2?-1:1/0:e.id;function Ff(e){try{for(Vt=0;Vt<ft.length;Vt++){const t=ft[Vt];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),Fo(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Vt<ft.length;Vt++){const t=ft[Vt];t&&(t.flags&=-2)}Vt=-1,ft.length=0,kf(),ms=null,(ft.length||Tr.length)&&Ff()}}let Ze=null,Lf=null;function hs(e){const t=Ze;return Ze=e,Lf=e&&e.type.__scopeId||null,t}function de(e,t=Ze,n){if(!t||e._n)return e;const r=(...o)=>{r._d&&vs(-1);const s=hs(t);let i;try{i=e(...o)}finally{hs(s),r._d&&vs(1)}return i};return r._n=!0,r._c=!0,r._d=!0,r}function zr(e,t){if(Ze===null)return e;const n=Ws(Ze),r=e.dirs||(e.dirs=[]);for(let o=0;o<t.length;o++){let[s,i,a,l=Ne]=t[o];s&&(ue(s)&&(s={mounted:s,updated:s}),s.deep&&sn(i),r.push({dir:s,instance:n,value:i,oldValue:void 0,arg:a,modifiers:l}))}return e}function Hn(e,t,n,r){const o=e.dirs,s=t&&t.dirs;for(let i=0;i<o.length;i++){const a=o[i];s&&(a.oldValue=s[i].value);let l=a.dir[r];l&&(cn(),kt(l,n,8,[e.el,a,e,t]),un())}}const Df=Symbol("_vte"),Bf=e=>e.__isTeleport,ao=e=>e&&(e.disabled||e.disabled===""),El=e=>e&&(e.defer||e.defer===""),Pl=e=>typeof SVGElement<"u"&&e instanceof SVGElement,Cl=e=>typeof MathMLElement=="function"&&e instanceof MathMLElement,ki=(e,t)=>{const n=e&&e.to;return we(n)?t?t(n):null:n},$f={name:"Teleport",__isTeleport:!0,process(e,t,n,r,o,s,i,a,l,c){const{mc:u,pc:f,pbc:p,o:{insert:d,querySelector:m,createText:g,createComment:x}}=c,b=ao(t.props);let{shapeFlag:C,children:v,dynamicChildren:P}=t;if(e==null){const R=t.el=g(""),$=t.anchor=g("");d(R,n,r),d($,n,r);const B=(y,M)=>{C&16&&u(v,y,M,o,s,i,a,l)},T=()=>{const y=t.target=ki(t.props,m),M=jf(y,t,g,d);y&&(i!=="svg"&&Pl(y)?i="svg":i!=="mathml"&&Cl(y)&&(i="mathml"),o&&o.isCE&&(o.ce._teleportTargets||(o.ce._teleportTargets=new Set)).add(y),b||(B(y,M),os(t,!1)))};b&&(B(n,$),os(t,!0)),El(t.props)?(t.el.__isMounted=!1,lt(()=>{T(),delete t.el.__isMounted},s)):T()}else{if(El(t.props)&&e.el.__isMounted===!1){lt(()=>{$f.process(e,t,n,r,o,s,i,a,l,c)},s);return}t.el=e.el,t.targetStart=e.targetStart;const R=t.anchor=e.anchor,$=t.target=e.target,B=t.targetAnchor=e.targetAnchor,T=ao(e.props),y=T?n:$,M=T?R:B;if(i==="svg"||Pl($)?i="svg":(i==="mathml"||Cl($))&&(i="mathml"),P?(p(e.dynamicChildren,P,y,o,s,i,a),Fa(e,t,!0)):l||f(e,t,y,M,o,s,i,a,!1),b)T?t.props&&e.props&&t.props.to!==e.props.to&&(t.props.to=e.props.to):Go(t,n,R,c,1);else if((t.props&&t.props.to)!==(e.props&&e.props.to)){const U=t.target=ki(t.props,m);U&&Go(t,U,null,c,0)}else T&&Go(t,$,B,c,1);os(t,b)}},remove(e,t,n,{um:r,o:{remove:o}},s){const{shapeFlag:i,children:a,anchor:l,targetStart:c,targetAnchor:u,target:f,props:p}=e;if(f&&(o(c),o(u)),s&&o(l),i&16){const d=s||!ao(p);for(let m=0;m<a.length;m++){const g=a[m];r(g,t,n,d,!!g.dynamicChildren)}}},move:Go,hydrate:mh};function Go(e,t,n,{o:{insert:r},m:o},s=2){s===0&&r(e.targetAnchor,t,n);const{el:i,anchor:a,shapeFlag:l,children:c,props:u}=e,f=s===2;if(f&&r(i,t,n),(!f||ao(u))&&l&16)for(let p=0;p<c.length;p++)o(c[p],t,n,2);f&&r(a,t,n)}function mh(e,t,n,r,o,s,{o:{nextSibling:i,parentNode:a,querySelector:l,insert:c,createText:u}},f){function p(g,x,b,C){x.anchor=f(i(g),x,a(g),n,r,o,s),x.targetStart=b,x.targetAnchor=C}const d=t.target=ki(t.props,l),m=ao(t.props);if(d){const g=d._lpa||d.firstChild;if(t.shapeFlag&16)if(m)p(e,t,g,g&&i(g));else{t.anchor=i(e);let x=g;for(;x;){if(x&&x.nodeType===8){if(x.data==="teleport start anchor")t.targetStart=x;else if(x.data==="teleport anchor"){t.targetAnchor=x,d._lpa=t.targetAnchor&&i(t.targetAnchor);break}}x=i(x)}t.targetAnchor||jf(d,t,u,c),f(g&&i(g),t,d,n,r,o,s)}os(t,m)}else m&&t.shapeFlag&16&&p(e,t,e,i(e));return t.anchor&&i(t.anchor)}const hh=$f;function os(e,t){const n=e.ctx;if(n&&n.ut){let r,o;for(t?(r=e.el,o=e.anchor):(r=e.targetStart,o=e.targetAnchor);r&&r!==o;)r.nodeType===1&&r.setAttribute("data-v-owner",n.uid),r=r.nextSibling;n.ut()}}function jf(e,t,n,r){const o=t.targetStart=n(""),s=t.targetAnchor=n("");return o[Df]=s,e&&(r(o,e),r(s,e)),s}const rn=Symbol("_leaveCb"),Ko=Symbol("_enterCb");function Hf(){const e={isMounted:!1,isLeaving:!1,isUnmounting:!1,leavingVNodes:new Map};return st(()=>{e.isMounted=!0}),At(()=>{e.isUnmounting=!0}),e}const St=[Function,Array],Vf={mode:String,appear:Boolean,persisted:Boolean,onBeforeEnter:St,onEnter:St,onAfterEnter:St,onEnterCancelled:St,onBeforeLeave:St,onLeave:St,onAfterLeave:St,onLeaveCancelled:St,onBeforeAppear:St,onAppear:St,onAfterAppear:St,onAppearCancelled:St},zf=e=>{const t=e.subTree;return t.component?zf(t.component):t},gh={name:"BaseTransition",props:Vf,setup(e,{slots:t}){const n=Qe(),r=Hf();return()=>{const o=t.default&&Ia(t.default(),!0);if(!o||!o.length)return;const s=Wf(o),i=Se(e),{mode:a}=i;if(r.isLeaving)return ii(s);const l=Tl(s);if(!l)return ii(s);let c=xo(l,i,r,n,f=>c=f);l.type!==Je&&or(l,c);let u=n.subTree&&Tl(n.subTree);if(u&&u.type!==Je&&!qn(u,l)&&zf(n).type!==Je){let f=xo(u,i,r,n);if(or(u,f),a==="out-in"&&l.type!==Je)return r.isLeaving=!0,f.afterLeave=()=>{r.isLeaving=!1,n.job.flags&8||n.update(),delete f.afterLeave,u=void 0},ii(s);a==="in-out"&&l.type!==Je?f.delayLeave=(p,d,m)=>{const g=Uf(r,u);g[String(u.key)]=u,p[rn]=()=>{d(),p[rn]=void 0,delete c.delayedLeave,u=void 0},c.delayedLeave=()=>{m(),delete c.delayedLeave,u=void 0}}:u=void 0}else u&&(u=void 0);return s}}};function Wf(e){let t=e[0];if(e.length>1){for(const n of e)if(n.type!==Je){t=n;break}}return t}const _h=gh;function Uf(e,t){const{leavingVNodes:n}=e;let r=n.get(t.type);return r||(r=Object.create(null),n.set(t.type,r)),r}function xo(e,t,n,r,o){const{appear:s,mode:i,persisted:a=!1,onBeforeEnter:l,onEnter:c,onAfterEnter:u,onEnterCancelled:f,onBeforeLeave:p,onLeave:d,onAfterLeave:m,onLeaveCancelled:g,onBeforeAppear:x,onAppear:b,onAfterAppear:C,onAppearCancelled:v}=t,P=String(e.key),R=Uf(n,e),$=(y,M)=>{y&&kt(y,r,9,M)},B=(y,M)=>{const U=M[1];$(y,M),ie(y)?y.every(A=>A.length<=1)&&U():y.length<=1&&U()},T={mode:i,persisted:a,beforeEnter(y){let M=l;if(!n.isMounted)if(s)M=x||l;else return;y[rn]&&y[rn](!0);const U=R[P];U&&qn(e,U)&&U.el[rn]&&U.el[rn](),$(M,[y])},enter(y){let M=c,U=u,A=f;if(!n.isMounted)if(s)M=b||c,U=C||u,A=v||f;else return;let I=!1;const z=y[Ko]=X=>{I||(I=!0,X?$(A,[y]):$(U,[y]),T.delayedLeave&&T.delayedLeave(),y[Ko]=void 0)};M?B(M,[y,z]):z()},leave(y,M){const U=String(e.key);if(y[Ko]&&y[Ko](!0),n.isUnmounting)return M();$(p,[y]);let A=!1;const I=y[rn]=z=>{A||(A=!0,M(),z?$(g,[y]):$(m,[y]),y[rn]=void 0,R[U]===e&&delete R[U])};R[U]=e,d?B(d,[y,I]):I()},clone(y){const M=xo(y,t,n,r,o);return o&&o(M),M}};return T}function ii(e){if(Hs(e))return e=fn(e),e.children=null,e}function Tl(e){if(!Hs(e))return Bf(e.type)&&e.children?Wf(e.children):e;if(e.component)return e.component.subTree;const{shapeFlag:t,children:n}=e;if(n){if(t&16)return n[0];if(t&32&&ue(n.default))return n.default()}}function or(e,t){e.shapeFlag&6&&e.component?(e.transition=t,or(e.component.subTree,t)):e.shapeFlag&128?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}function Ia(e,t=!1,n){let r=[],o=0;for(let s=0;s<e.length;s++){let i=e[s];const a=n==null?i.key:String(n)+String(i.key!=null?i.key:s);i.type===We?(i.patchFlag&128&&o++,r=r.concat(Ia(i.children,t,a))):(t||i.type!==Je)&&r.push(a!=null?fn(i,{key:a}):i)}if(o>1)for(let s=0;s<r.length;s++)r[s].patchFlag=-2;return r}function q(e,t){return ue(e)?Ke({name:e.name},t,{setup:e}):e}function Gf(e){e.ids=[e.ids[0]+e.ids[2]+++"-",0,0]}const gs=new WeakMap;function lo(e,t,n,r,o=!1){if(ie(e)){e.forEach((m,g)=>lo(m,t&&(ie(t)?t[g]:t),n,r,o));return}if(Ar(r)&&!o){r.shapeFlag&512&&r.type.__asyncResolved&&r.component.subTree.component&&lo(e,t,n,r.component.subTree);return}const s=r.shapeFlag&4?Ws(r.component):r.el,i=o?null:s,{i:a,r:l}=e,c=t&&t.r,u=a.refs===Ne?a.refs={}:a.refs,f=a.setupState,p=Se(f),d=f===Ne?nf:m=>Pe(p,m);if(c!=null&&c!==l){if(Al(t),we(c))u[c]=null,d(c)&&(f[c]=null);else if($e(c)){c.value=null;const m=t;m.k&&(u[m.k]=null)}}if(ue(l))Fo(l,a,12,[i,u]);else{const m=we(l),g=$e(l);if(m||g){const x=()=>{if(e.f){const b=m?d(l)?f[l]:u[l]:l.value;if(o)ie(b)&&ha(b,s);else if(ie(b))b.includes(s)||b.push(s);else if(m)u[l]=[s],d(l)&&(f[l]=u[l]);else{const C=[s];l.value=C,e.k&&(u[e.k]=C)}}else m?(u[l]=i,d(l)&&(f[l]=i)):g&&(l.value=i,e.k&&(u[e.k]=i))};if(i){const b=()=>{x(),gs.delete(e)};b.id=-1,gs.set(e,b),lt(b,n)}else Al(e),x()}}}function Al(e){const t=gs.get(e);t&&(t.flags|=8,gs.delete(e))}Ds().requestIdleCallback;Ds().cancelIdleCallback;const Ar=e=>!!e.type.__asyncLoader,Hs=e=>e.type.__isKeepAlive;function vh(e,t){qf(e,"a",t)}function Kf(e,t){qf(e,"da",t)}function qf(e,t,n=ot){const r=e.__wdc||(e.__wdc=()=>{let o=n;for(;o;){if(o.isDeactivated)return;o=o.parent}return e()});if(Vs(t,r,n),n){let o=n.parent;for(;o&&o.parent;)Hs(o.parent.vnode)&&yh(r,t,n,o),o=o.parent}}function yh(e,t,n,r){const o=Vs(t,e,r,!0);Oa(()=>{ha(r[t],o)},n)}function Vs(e,t,n=ot,r=!1){if(n){const o=n[e]||(n[e]=[]),s=t.__weh||(t.__weh=(...i)=>{cn();const a=Do(n),l=kt(t,n,e,i);return a(),un(),l});return r?o.unshift(s):o.push(s),s}}const mn=e=>(t,n=ot)=>{(!Eo||e==="sp")&&Vs(e,(...r)=>t(...r),n)},Jf=mn("bm"),st=mn("m"),bh=mn("bu"),Yf=mn("u"),At=mn("bum"),Oa=mn("um"),wh=mn("sp"),xh=mn("rtg"),Sh=mn("rtc");function Eh(e,t=ot){Vs("ec",e,t)}const Ma="components",Ph="directives";function Ch(e,t){return Ra(Ma,e,!0,t)||e}const Qf=Symbol.for("v-ndc");function Th(e){return we(e)?Ra(Ma,e,!1)||e:e||Qf}function rE(e){return Ra(Ph,e)}function Ra(e,t,n=!0,r=!1){const o=Ze||ot;if(o){const s=o.type;if(e===Ma){const a=hg(s,!1);if(a&&(a===t||a===xt(t)||a===Ls(xt(t))))return s}const i=Il(o[e]||s[e],t)||Il(o.appContext[e],t);return!i&&r?s:i}}function Il(e,t){return e&&(e[t]||e[xt(t)]||e[Ls(xt(t))])}function oE(e,t,n,r){let o;const s=n,i=ie(e);if(i||we(e)){const a=i&&kn(e);let l=!1,c=!1;a&&(l=!Et(e),c=Ln(e),e=Bs(e)),o=new Array(e.length);for(let u=0,f=e.length;u<f;u++)o[u]=t(l?c?ps(Xe(e[u])):Xe(e[u]):e[u],u,void 0,s)}else if(typeof e=="number"){o=new Array(e);for(let a=0;a<e;a++)o[a]=t(a+1,a,void 0,s)}else if(Ee(e))if(e[Symbol.iterator])o=Array.from(e,(a,l)=>t(a,l,void 0,s));else{const a=Object.keys(e);o=new Array(a.length);for(let l=0,c=a.length;l<c;l++){const u=a[l];o[l]=t(e[u],u,l,s)}}else o=[];return o}function sE(e,t){for(let n=0;n<t.length;n++){const r=t[n];if(ie(r))for(let o=0;o<r.length;o++)e[r[o].name]=r[o].fn;else r&&(e[r.name]=r.key?(...o)=>{const s=r.fn(...o);return s&&(s.key=r.key),s}:r.fn)}return e}function Re(e,t,n={},r,o){if(Ze.ce||Ze.parent&&Ar(Ze.parent)&&Ze.parent.ce){const c=Object.keys(n).length>0;return t!=="default"&&(n.name=t),J(),He(We,null,[oe("slot",n,r&&r())],c?-2:64)}let s=e[t];s&&s._c&&(s._d=!1),J();const i=s&&Xf(s(n)),a=n.key||i&&i.key,l=He(We,{key:(a&&!Nt(a)?a:`_${t}`)+(!i&&r?"_fb":"")},i||(r?r():[]),i&&e._===1?64:-2);return!o&&l.scopeId&&(l.slotScopeIds=[l.scopeId+"-s"]),s&&s._c&&(s._d=!0),l}function Xf(e){return e.some(t=>Ut(t)?!(t.type===Je||t.type===We&&!Xf(t.children)):!0)?e:null}function Ah(e,t){const n={};for(const r in e)n[ns(r)]=e[r];return n}const Fi=e=>e?vp(e)?Ws(e):Fi(e.parent):null,co=Ke(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>Fi(e.parent),$root:e=>Fi(e.root),$host:e=>e.ce,$emit:e=>e.emit,$options:e=>tp(e),$forceUpdate:e=>e.f||(e.f=()=>{Aa(e.update)}),$nextTick:e=>e.n||(e.n=Kt.bind(e.proxy)),$watch:e=>Qh.bind(e)}),ai=(e,t)=>e!==Ne&&!e.__isScriptSetup&&Pe(e,t),Ih={get({_:e},t){if(t==="__v_skip")return!0;const{ctx:n,setupState:r,data:o,props:s,accessCache:i,type:a,appContext:l}=e;let c;if(t[0]!=="$"){const d=i[t];if(d!==void 0)switch(d){case 1:return r[t];case 2:return o[t];case 4:return n[t];case 3:return s[t]}else{if(ai(r,t))return i[t]=1,r[t];if(o!==Ne&&Pe(o,t))return i[t]=2,o[t];if((c=e.propsOptions[0])&&Pe(c,t))return i[t]=3,s[t];if(n!==Ne&&Pe(n,t))return i[t]=4,n[t];Li&&(i[t]=0)}}const u=co[t];let f,p;if(u)return t==="$attrs"&&rt(e.attrs,"get",""),u(e);if((f=a.__cssModules)&&(f=f[t]))return f;if(n!==Ne&&Pe(n,t))return i[t]=4,n[t];if(p=l.config.globalProperties,Pe(p,t))return p[t]},set({_:e},t,n){const{data:r,setupState:o,ctx:s}=e;return ai(o,t)?(o[t]=n,!0):r!==Ne&&Pe(r,t)?(r[t]=n,!0):Pe(e.props,t)||t[0]==="$"&&t.slice(1)in e?!1:(s[t]=n,!0)},has({_:{data:e,setupState:t,accessCache:n,ctx:r,appContext:o,propsOptions:s,type:i}},a){let l,c;return!!(n[a]||e!==Ne&&a[0]!=="$"&&Pe(e,a)||ai(t,a)||(l=s[0])&&Pe(l,a)||Pe(r,a)||Pe(co,a)||Pe(o.config.globalProperties,a)||(c=i.__cssModules)&&c[a])},defineProperty(e,t,n){return n.get!=null?e._.accessCache[t]=0:Pe(n,"value")&&this.set(e,t,n.value,null),Reflect.defineProperty(e,t,n)}};function Oh(){return Zf().slots}function iE(){return Zf().attrs}function Zf(e){const t=Qe();return t.setupContext||(t.setupContext=bp(t))}function Ol(e){return ie(e)?e.reduce((t,n)=>(t[n]=null,t),{}):e}let Li=!0;function Mh(e){const t=tp(e),n=e.proxy,r=e.ctx;Li=!1,t.beforeCreate&&Ml(t.beforeCreate,e,"bc");const{data:o,computed:s,methods:i,watch:a,provide:l,inject:c,created:u,beforeMount:f,mounted:p,beforeUpdate:d,updated:m,activated:g,deactivated:x,beforeDestroy:b,beforeUnmount:C,destroyed:v,unmounted:P,render:R,renderTracked:$,renderTriggered:B,errorCaptured:T,serverPrefetch:y,expose:M,inheritAttrs:U,components:A,directives:I,filters:z}=t;if(c&&Rh(c,r,null),i)for(const O in i){const S=i[O];ue(S)&&(r[O]=S.bind(n))}if(o){const O=o.call(n,n);Ee(O)&&(e.data=Bn(O))}if(Li=!0,s)for(const O in s){const S=s[O],V=ue(S)?S.bind(n,n):ue(S.get)?S.get.bind(n,n):pt,se=!ue(S)&&ue(S.set)?S.set.bind(n):pt,he=k({get:V,set:se});Object.defineProperty(r,O,{enumerable:!0,configurable:!0,get:()=>he.value,set:re=>he.value=re})}if(a)for(const O in a)ep(a[O],r,n,O);if(l){const O=ue(l)?l.call(n):l;Reflect.ownKeys(O).forEach(S=>{gt(S,O[S])})}u&&Ml(u,e,"c");function G(O,S){ie(S)?S.forEach(V=>O(V.bind(n))):S&&O(S.bind(n))}if(G(Jf,f),G(st,p),G(bh,d),G(Yf,m),G(vh,g),G(Kf,x),G(Eh,T),G(Sh,$),G(xh,B),G(At,C),G(Oa,P),G(wh,y),ie(M))if(M.length){const O=e.exposed||(e.exposed={});M.forEach(S=>{Object.defineProperty(O,S,{get:()=>n[S],set:V=>n[S]=V,enumerable:!0})})}else e.exposed||(e.exposed={});R&&e.render===pt&&(e.render=R),U!=null&&(e.inheritAttrs=U),A&&(e.components=A),I&&(e.directives=I),y&&Gf(e)}function Rh(e,t,n=pt){ie(e)&&(e=Di(e));for(const r in e){const o=e[r];let s;Ee(o)?"default"in o?s=Te(o.from||r,o.default,!0):s=Te(o.from||r):s=Te(o),$e(s)?Object.defineProperty(t,r,{enumerable:!0,configurable:!0,get:()=>s.value,set:i=>s.value=i}):t[r]=s}}function Ml(e,t,n){kt(ie(e)?e.map(r=>r.bind(t.proxy)):e.bind(t.proxy),t,n)}function ep(e,t,n,r){let o=r.includes(".")?dp(n,r):()=>n[r];if(we(e)){const s=t[e];ue(s)&&ye(o,s)}else if(ue(e))ye(o,e.bind(n));else if(Ee(e))if(ie(e))e.forEach(s=>ep(s,t,n,r));else{const s=ue(e.handler)?e.handler.bind(n):t[e.handler];ue(s)&&ye(o,s,e)}}function tp(e){const t=e.type,{mixins:n,extends:r}=t,{mixins:o,optionsCache:s,config:{optionMergeStrategies:i}}=e.appContext,a=s.get(t);let l;return a?l=a:!o.length&&!n&&!r?l=t:(l={},o.length&&o.forEach(c=>_s(l,c,i,!0)),_s(l,t,i)),Ee(t)&&s.set(t,l),l}function _s(e,t,n,r=!1){const{mixins:o,extends:s}=t;s&&_s(e,s,n,!0),o&&o.forEach(i=>_s(e,i,n,!0));for(const i in t)if(!(r&&i==="expose")){const a=Nh[i]||n&&n[i];e[i]=a?a(e[i],t[i]):t[i]}return e}const Nh={data:Rl,props:Nl,emits:Nl,methods:to,computed:to,beforeCreate:at,created:at,beforeMount:at,mounted:at,beforeUpdate:at,updated:at,beforeDestroy:at,beforeUnmount:at,destroyed:at,unmounted:at,activated:at,deactivated:at,errorCaptured:at,serverPrefetch:at,components:to,directives:to,watch:Fh,provide:Rl,inject:kh};function Rl(e,t){return t?e?function(){return Ke(ue(e)?e.call(this,this):e,ue(t)?t.call(this,this):t)}:t:e}function kh(e,t){return to(Di(e),Di(t))}function Di(e){if(ie(e)){const t={};for(let n=0;n<e.length;n++)t[e[n]]=e[n];return t}return e}function at(e,t){return e?[...new Set([].concat(e,t))]:t}function to(e,t){return e?Ke(Object.create(null),e,t):t}function Nl(e,t){return e?ie(e)&&ie(t)?[...new Set([...e,...t])]:Ke(Object.create(null),Ol(e),Ol(t??{})):t}function Fh(e,t){if(!e)return t;if(!t)return e;const n=Ke(Object.create(null),e);for(const r in t)n[r]=at(e[r],t[r]);return n}function np(){return{app:null,config:{isNativeTag:nf,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Lh=0;function Dh(e,t){return function(r,o=null){ue(r)||(r=Ke({},r)),o!=null&&!Ee(o)&&(o=null);const s=np(),i=new WeakSet,a=[];let l=!1;const c=s.app={_uid:Lh++,_component:r,_props:o,_container:null,_context:s,_instance:null,version:_g,get config(){return s.config},set config(u){},use(u,...f){return i.has(u)||(u&&ue(u.install)?(i.add(u),u.install(c,...f)):ue(u)&&(i.add(u),u(c,...f))),c},mixin(u){return s.mixins.includes(u)||s.mixins.push(u),c},component(u,f){return f?(s.components[u]=f,c):s.components[u]},directive(u,f){return f?(s.directives[u]=f,c):s.directives[u]},mount(u,f,p){if(!l){const d=c._ceVNode||oe(r,o);return d.appContext=s,p===!0?p="svg":p===!1&&(p=void 0),e(d,u,p),l=!0,c._container=u,u.__vue_app__=c,Ws(d.component)}},onUnmount(u){a.push(u)},unmount(){l&&(kt(a,c._instance,16),e(null,c._container),delete c._container.__vue_app__)},provide(u,f){return s.provides[u]=f,c},runWithContext(u){const f=Zn;Zn=c;try{return u()}finally{Zn=f}}};return c}}let Zn=null;function gt(e,t){if(ot){let n=ot.provides;const r=ot.parent&&ot.parent.provides;r===n&&(n=ot.provides=Object.create(r)),n[e]=t}}function Te(e,t,n=!1){const r=Qe();if(r||Zn){let o=Zn?Zn._context.provides:r?r.parent==null||r.ce?r.vnode.appContext&&r.vnode.appContext.provides:r.parent.provides:void 0;if(o&&e in o)return o[e];if(arguments.length>1)return n&&ue(t)?t.call(r&&r.proxy):t}}function Bh(){return!!(Qe()||Zn)}const rp={},op=()=>Object.create(rp),sp=e=>Object.getPrototypeOf(e)===rp;function $h(e,t,n,r=!1){const o={},s=op();e.propsDefaults=Object.create(null),ip(e,t,o,s);for(const i in e.propsOptions[0])i in o||(o[i]=void 0);n?e.props=r?o:$s(o):e.type.props?e.props=o:e.props=s,e.attrs=s}function jh(e,t,n,r){const{props:o,attrs:s,vnode:{patchFlag:i}}=e,a=Se(o),[l]=e.propsOptions;let c=!1;if((r||i>0)&&!(i&16)){if(i&8){const u=e.vnode.dynamicProps;for(let f=0;f<u.length;f++){let p=u[f];if(zs(e.emitsOptions,p))continue;const d=t[p];if(l)if(Pe(s,p))d!==s[p]&&(s[p]=d,c=!0);else{const m=xt(p);o[m]=Bi(l,a,m,d,e,!1)}else d!==s[p]&&(s[p]=d,c=!0)}}}else{ip(e,t,o,s)&&(c=!0);let u;for(const f in a)(!t||!Pe(t,f)&&((u=Dn(f))===f||!Pe(t,u)))&&(l?n&&(n[f]!==void 0||n[u]!==void 0)&&(o[f]=Bi(l,a,f,void 0,e,!0)):delete o[f]);if(s!==a)for(const f in s)(!t||!Pe(t,f))&&(delete s[f],c=!0)}c&&on(e.attrs,"set","")}function ip(e,t,n,r){const[o,s]=e.propsOptions;let i=!1,a;if(t)for(let l in t){if(oo(l))continue;const c=t[l];let u;o&&Pe(o,u=xt(l))?!s||!s.includes(u)?n[u]=c:(a||(a={}))[u]=c:zs(e.emitsOptions,l)||(!(l in r)||c!==r[l])&&(r[l]=c,i=!0)}if(s){const l=Se(n),c=a||Ne;for(let u=0;u<s.length;u++){const f=s[u];n[f]=Bi(o,l,f,c[f],e,!Pe(c,f))}}return i}function Bi(e,t,n,r,o,s){const i=e[n];if(i!=null){const a=Pe(i,"default");if(a&&r===void 0){const l=i.default;if(i.type!==Function&&!i.skipFactory&&ue(l)){const{propsDefaults:c}=o;if(n in c)r=c[n];else{const u=Do(o);r=c[n]=l.call(null,t),u()}}else r=l;o.ce&&o.ce._setProp(n,r)}i[0]&&(s&&!a?r=!1:i[1]&&(r===""||r===Dn(n))&&(r=!0))}return r}const Hh=new WeakMap;function ap(e,t,n=!1){const r=n?Hh:t.propsCache,o=r.get(e);if(o)return o;const s=e.props,i={},a=[];let l=!1;if(!ue(e)){const u=f=>{l=!0;const[p,d]=ap(f,t,!0);Ke(i,p),d&&a.push(...d)};!n&&t.mixins.length&&t.mixins.forEach(u),e.extends&&u(e.extends),e.mixins&&e.mixins.forEach(u)}if(!s&&!l)return Ee(e)&&r.set(e,Pr),Pr;if(ie(s))for(let u=0;u<s.length;u++){const f=xt(s[u]);kl(f)&&(i[f]=Ne)}else if(s)for(const u in s){const f=xt(u);if(kl(f)){const p=s[u],d=i[f]=ie(p)||ue(p)?{type:p}:Ke({},p),m=d.type;let g=!1,x=!0;if(ie(m))for(let b=0;b<m.length;++b){const C=m[b],v=ue(C)&&C.name;if(v==="Boolean"){g=!0;break}else v==="String"&&(x=!1)}else g=ue(m)&&m.name==="Boolean";d[0]=g,d[1]=x,(g||Pe(d,"default"))&&a.push(f)}}const c=[i,a];return Ee(e)&&r.set(e,c),c}function kl(e){return e[0]!=="$"&&!oo(e)}const Na=e=>e==="_"||e==="_ctx"||e==="$stable",ka=e=>ie(e)?e.map(zt):[zt(e)],Vh=(e,t,n)=>{if(t._n)return t;const r=de((...o)=>ka(t(...o)),n);return r._c=!1,r},lp=(e,t,n)=>{const r=e._ctx;for(const o in e){if(Na(o))continue;const s=e[o];if(ue(s))t[o]=Vh(o,s,r);else if(s!=null){const i=ka(s);t[o]=()=>i}}},cp=(e,t)=>{const n=ka(t);e.slots.default=()=>n},up=(e,t,n)=>{for(const r in t)(n||!Na(r))&&(e[r]=t[r])},zh=(e,t,n)=>{const r=e.slots=op();if(e.vnode.shapeFlag&32){const o=t._;o?(up(r,t,n),n&&af(r,"_",o,!0)):lp(t,r)}else t&&cp(e,t)},Wh=(e,t,n)=>{const{vnode:r,slots:o}=e;let s=!0,i=Ne;if(r.shapeFlag&32){const a=t._;a?n&&a===1?s=!1:up(o,t,n):(s=!t.$stable,lp(t,o)),i=t}else t&&(cp(e,t),i={default:1});if(s)for(const a in o)!Na(a)&&i[a]==null&&delete o[a]},lt=sg;function Uh(e){return Gh(e)}function Gh(e,t){const n=Ds();n.__VUE__=!0;const{insert:r,remove:o,patchProp:s,createElement:i,createText:a,createComment:l,setText:c,setElementText:u,parentNode:f,nextSibling:p,setScopeId:d=pt,insertStaticContent:m}=e,g=(h,_,E,D=null,j=null,F=null,ee=void 0,Y=null,K=!!_.dynamicChildren)=>{if(h===_)return;h&&!qn(h,_)&&(D=N(h),re(h,j,F,!0),h=null),_.patchFlag===-2&&(K=!1,_.dynamicChildren=null);const{type:H,ref:fe,shapeFlag:ne}=_;switch(H){case Lo:x(h,_,E,D);break;case Je:b(h,_,E,D);break;case ss:h==null&&C(_,E,D,ee);break;case We:A(h,_,E,D,j,F,ee,Y,K);break;default:ne&1?R(h,_,E,D,j,F,ee,Y,K):ne&6?I(h,_,E,D,j,F,ee,Y,K):(ne&64||ne&128)&&H.process(h,_,E,D,j,F,ee,Y,K,le)}fe!=null&&j?lo(fe,h&&h.ref,F,_||h,!_):fe==null&&h&&h.ref!=null&&lo(h.ref,null,F,h,!0)},x=(h,_,E,D)=>{if(h==null)r(_.el=a(_.children),E,D);else{const j=_.el=h.el;_.children!==h.children&&c(j,_.children)}},b=(h,_,E,D)=>{h==null?r(_.el=l(_.children||""),E,D):_.el=h.el},C=(h,_,E,D)=>{[h.el,h.anchor]=m(h.children,_,E,D,h.el,h.anchor)},v=({el:h,anchor:_},E,D)=>{let j;for(;h&&h!==_;)j=p(h),r(h,E,D),h=j;r(_,E,D)},P=({el:h,anchor:_})=>{let E;for(;h&&h!==_;)E=p(h),o(h),h=E;o(_)},R=(h,_,E,D,j,F,ee,Y,K)=>{if(_.type==="svg"?ee="svg":_.type==="math"&&(ee="mathml"),h==null)$(_,E,D,j,F,ee,Y,K);else{const H=h.el&&h.el._isVueCE?h.el:null;try{H&&H._beginPatch(),y(h,_,j,F,ee,Y,K)}finally{H&&H._endPatch()}}},$=(h,_,E,D,j,F,ee,Y)=>{let K,H;const{props:fe,shapeFlag:ne,transition:ce,dirs:me}=h;if(K=h.el=i(h.type,F,fe&&fe.is,fe),ne&8?u(K,h.children):ne&16&&T(h.children,K,null,D,j,li(h,F),ee,Y),me&&Hn(h,null,D,"created"),B(K,h,h.scopeId,ee,D),fe){for(const Me in fe)Me!=="value"&&!oo(Me)&&s(K,Me,null,fe[Me],F,D);"value"in fe&&s(K,"value",null,fe.value,F),(H=fe.onVnodeBeforeMount)&&jt(H,D,h)}me&&Hn(h,null,D,"beforeMount");const ve=Kh(j,ce);ve&&ce.beforeEnter(K),r(K,_,E),((H=fe&&fe.onVnodeMounted)||ve||me)&&lt(()=>{H&&jt(H,D,h),ve&&ce.enter(K),me&&Hn(h,null,D,"mounted")},j)},B=(h,_,E,D,j)=>{if(E&&d(h,E),D)for(let F=0;F<D.length;F++)d(h,D[F]);if(j){let F=j.subTree;if(_===F||hp(F.type)&&(F.ssContent===_||F.ssFallback===_)){const ee=j.vnode;B(h,ee,ee.scopeId,ee.slotScopeIds,j.parent)}}},T=(h,_,E,D,j,F,ee,Y,K=0)=>{for(let H=K;H<h.length;H++){const fe=h[H]=Y?Cn(h[H]):zt(h[H]);g(null,fe,_,E,D,j,F,ee,Y)}},y=(h,_,E,D,j,F,ee)=>{const Y=_.el=h.el;let{patchFlag:K,dynamicChildren:H,dirs:fe}=_;K|=h.patchFlag&16;const ne=h.props||Ne,ce=_.props||Ne;let me;if(E&&Vn(E,!1),(me=ce.onVnodeBeforeUpdate)&&jt(me,E,_,h),fe&&Hn(_,h,E,"beforeUpdate"),E&&Vn(E,!0),(ne.innerHTML&&ce.innerHTML==null||ne.textContent&&ce.textContent==null)&&u(Y,""),H?M(h.dynamicChildren,H,Y,E,D,li(_,j),F):ee||S(h,_,Y,null,E,D,li(_,j),F,!1),K>0){if(K&16)U(Y,ne,ce,E,j);else if(K&2&&ne.class!==ce.class&&s(Y,"class",null,ce.class,j),K&4&&s(Y,"style",ne.style,ce.style,j),K&8){const ve=_.dynamicProps;for(let Me=0;Me<ve.length;Me++){const Ce=ve[Me],dt=ne[Ce],mt=ce[Ce];(mt!==dt||Ce==="value")&&s(Y,Ce,dt,mt,j,E)}}K&1&&h.children!==_.children&&u(Y,_.children)}else!ee&&H==null&&U(Y,ne,ce,E,j);((me=ce.onVnodeUpdated)||fe)&&lt(()=>{me&&jt(me,E,_,h),fe&&Hn(_,h,E,"updated")},D)},M=(h,_,E,D,j,F,ee)=>{for(let Y=0;Y<_.length;Y++){const K=h[Y],H=_[Y],fe=K.el&&(K.type===We||!qn(K,H)||K.shapeFlag&198)?f(K.el):E;g(K,H,fe,null,D,j,F,ee,!0)}},U=(h,_,E,D,j)=>{if(_!==E){if(_!==Ne)for(const F in _)!oo(F)&&!(F in E)&&s(h,F,_[F],null,j,D);for(const F in E){if(oo(F))continue;const ee=E[F],Y=_[F];ee!==Y&&F!=="value"&&s(h,F,Y,ee,j,D)}"value"in E&&s(h,"value",_.value,E.value,j)}},A=(h,_,E,D,j,F,ee,Y,K)=>{const H=_.el=h?h.el:a(""),fe=_.anchor=h?h.anchor:a("");let{patchFlag:ne,dynamicChildren:ce,slotScopeIds:me}=_;me&&(Y=Y?Y.concat(me):me),h==null?(r(H,E,D),r(fe,E,D),T(_.children||[],E,fe,j,F,ee,Y,K)):ne>0&&ne&64&&ce&&h.dynamicChildren?(M(h.dynamicChildren,ce,E,j,F,ee,Y),(_.key!=null||j&&_===j.subTree)&&Fa(h,_,!0)):S(h,_,E,fe,j,F,ee,Y,K)},I=(h,_,E,D,j,F,ee,Y,K)=>{_.slotScopeIds=Y,h==null?_.shapeFlag&512?j.ctx.activate(_,E,D,ee,K):z(_,E,D,j,F,ee,K):X(h,_,K)},z=(h,_,E,D,j,F,ee)=>{const Y=h.component=fg(h,D,j);if(Hs(h)&&(Y.ctx.renderer=le),pg(Y,!1,ee),Y.asyncDep){if(j&&j.registerDep(Y,G,ee),!h.el){const K=Y.subTree=oe(Je);b(null,K,_,E),h.placeholder=K.el}}else G(Y,h,_,E,j,F,ee)},X=(h,_,E)=>{const D=_.component=h.component;if(rg(h,_,E))if(D.asyncDep&&!D.asyncResolved){O(D,_,E);return}else D.next=_,D.update();else _.el=h.el,D.vnode=_},G=(h,_,E,D,j,F,ee)=>{const Y=()=>{if(h.isMounted){let{next:ne,bu:ce,u:me,parent:ve,vnode:Me}=h;{const Bt=fp(h);if(Bt){ne&&(ne.el=Me.el,O(h,ne,ee)),Bt.asyncDep.then(()=>{h.isUnmounted||Y()});return}}let Ce=ne,dt;Vn(h,!1),ne?(ne.el=Me.el,O(h,ne,ee)):ne=Me,ce&&rs(ce),(dt=ne.props&&ne.props.onVnodeBeforeUpdate)&&jt(dt,ve,ne,Me),Vn(h,!0);const mt=Ll(h),Dt=h.subTree;h.subTree=mt,g(Dt,mt,f(Dt.el),N(Dt),h,j,F),ne.el=mt.el,Ce===null&&og(h,mt.el),me&&lt(me,j),(dt=ne.props&&ne.props.onVnodeUpdated)&&lt(()=>jt(dt,ve,ne,Me),j)}else{let ne;const{el:ce,props:me}=_,{bm:ve,m:Me,parent:Ce,root:dt,type:mt}=h,Dt=Ar(_);Vn(h,!1),ve&&rs(ve),!Dt&&(ne=me&&me.onVnodeBeforeMount)&&jt(ne,Ce,_),Vn(h,!0);{dt.ce&&dt.ce._def.shadowRoot!==!1&&dt.ce._injectChildStyle(mt);const Bt=h.subTree=Ll(h);g(null,Bt,E,D,h,j,F),_.el=Bt.el}if(Me&&lt(Me,j),!Dt&&(ne=me&&me.onVnodeMounted)){const Bt=_;lt(()=>jt(ne,Ce,Bt),j)}(_.shapeFlag&256||Ce&&Ar(Ce.vnode)&&Ce.vnode.shapeFlag&256)&&h.a&&lt(h.a,j),h.isMounted=!0,_=E=D=null}};h.scope.on();const K=h.effect=new hf(Y);h.scope.off();const H=h.update=K.run.bind(K),fe=h.job=K.runIfDirty.bind(K);fe.i=h,fe.id=h.uid,K.scheduler=()=>Aa(fe),Vn(h,!0),H()},O=(h,_,E)=>{_.component=h;const D=h.vnode.props;h.vnode=_,h.next=null,jh(h,_.props,D,E),Wh(h,_.children,E),cn(),Sl(h),un()},S=(h,_,E,D,j,F,ee,Y,K=!1)=>{const H=h&&h.children,fe=h?h.shapeFlag:0,ne=_.children,{patchFlag:ce,shapeFlag:me}=_;if(ce>0){if(ce&128){se(H,ne,E,D,j,F,ee,Y,K);return}else if(ce&256){V(H,ne,E,D,j,F,ee,Y,K);return}}me&8?(fe&16&&ke(H,j,F),ne!==H&&u(E,ne)):fe&16?me&16?se(H,ne,E,D,j,F,ee,Y,K):ke(H,j,F,!0):(fe&8&&u(E,""),me&16&&T(ne,E,D,j,F,ee,Y,K))},V=(h,_,E,D,j,F,ee,Y,K)=>{h=h||Pr,_=_||Pr;const H=h.length,fe=_.length,ne=Math.min(H,fe);let ce;for(ce=0;ce<ne;ce++){const me=_[ce]=K?Cn(_[ce]):zt(_[ce]);g(h[ce],me,E,null,j,F,ee,Y,K)}H>fe?ke(h,j,F,!0,!1,ne):T(_,E,D,j,F,ee,Y,K,ne)},se=(h,_,E,D,j,F,ee,Y,K)=>{let H=0;const fe=_.length;let ne=h.length-1,ce=fe-1;for(;H<=ne&&H<=ce;){const me=h[H],ve=_[H]=K?Cn(_[H]):zt(_[H]);if(qn(me,ve))g(me,ve,E,null,j,F,ee,Y,K);else break;H++}for(;H<=ne&&H<=ce;){const me=h[ne],ve=_[ce]=K?Cn(_[ce]):zt(_[ce]);if(qn(me,ve))g(me,ve,E,null,j,F,ee,Y,K);else break;ne--,ce--}if(H>ne){if(H<=ce){const me=ce+1,ve=me<fe?_[me].el:D;for(;H<=ce;)g(null,_[H]=K?Cn(_[H]):zt(_[H]),E,ve,j,F,ee,Y,K),H++}}else if(H>ce)for(;H<=ne;)re(h[H],j,F,!0),H++;else{const me=H,ve=H,Me=new Map;for(H=ve;H<=ce;H++){const yt=_[H]=K?Cn(_[H]):zt(_[H]);yt.key!=null&&Me.set(yt.key,H)}let Ce,dt=0;const mt=ce-ve+1;let Dt=!1,Bt=0;const qr=new Array(mt);for(H=0;H<mt;H++)qr[H]=0;for(H=me;H<=ne;H++){const yt=h[H];if(dt>=mt){re(yt,j,F,!0);continue}let $t;if(yt.key!=null)$t=Me.get(yt.key);else for(Ce=ve;Ce<=ce;Ce++)if(qr[Ce-ve]===0&&qn(yt,_[Ce])){$t=Ce;break}$t===void 0?re(yt,j,F,!0):(qr[$t-ve]=H+1,$t>=Bt?Bt=$t:Dt=!0,g(yt,_[$t],E,null,j,F,ee,Y,K),dt++)}const gl=Dt?qh(qr):Pr;for(Ce=gl.length-1,H=mt-1;H>=0;H--){const yt=ve+H,$t=_[yt],_l=_[yt+1],vl=yt+1<fe?_l.el||_l.placeholder:D;qr[H]===0?g(null,$t,E,vl,j,F,ee,Y,K):Dt&&(Ce<0||H!==gl[Ce]?he($t,E,vl,2):Ce--)}}},he=(h,_,E,D,j=null)=>{const{el:F,type:ee,transition:Y,children:K,shapeFlag:H}=h;if(H&6){he(h.component.subTree,_,E,D);return}if(H&128){h.suspense.move(_,E,D);return}if(H&64){ee.move(h,_,E,le);return}if(ee===We){r(F,_,E);for(let ne=0;ne<K.length;ne++)he(K[ne],_,E,D);r(h.anchor,_,E);return}if(ee===ss){v(h,_,E);return}if(D!==2&&H&1&&Y)if(D===0)Y.beforeEnter(F),r(F,_,E),lt(()=>Y.enter(F),j);else{const{leave:ne,delayLeave:ce,afterLeave:me}=Y,ve=()=>{h.ctx.isUnmounted?o(F):r(F,_,E)},Me=()=>{F._isLeaving&&F[rn](!0),ne(F,()=>{ve(),me&&me()})};ce?ce(F,ve,Me):Me()}else r(F,_,E)},re=(h,_,E,D=!1,j=!1)=>{const{type:F,props:ee,ref:Y,children:K,dynamicChildren:H,shapeFlag:fe,patchFlag:ne,dirs:ce,cacheIndex:me}=h;if(ne===-2&&(j=!1),Y!=null&&(cn(),lo(Y,null,E,h,!0),un()),me!=null&&(_.renderCache[me]=void 0),fe&256){_.ctx.deactivate(h);return}const ve=fe&1&&ce,Me=!Ar(h);let Ce;if(Me&&(Ce=ee&&ee.onVnodeBeforeUnmount)&&jt(Ce,_,h),fe&6)Ae(h.component,E,D);else{if(fe&128){h.suspense.unmount(E,D);return}ve&&Hn(h,null,_,"beforeUnmount"),fe&64?h.type.remove(h,_,E,le,D):H&&!H.hasOnce&&(F!==We||ne>0&&ne&64)?ke(H,_,E,!1,!0):(F===We&&ne&384||!j&&fe&16)&&ke(K,_,E),D&&ge(h)}(Me&&(Ce=ee&&ee.onVnodeUnmounted)||ve)&&lt(()=>{Ce&&jt(Ce,_,h),ve&&Hn(h,null,_,"unmounted")},E)},ge=h=>{const{type:_,el:E,anchor:D,transition:j}=h;if(_===We){_e(E,D);return}if(_===ss){P(h);return}const F=()=>{o(E),j&&!j.persisted&&j.afterLeave&&j.afterLeave()};if(h.shapeFlag&1&&j&&!j.persisted){const{leave:ee,delayLeave:Y}=j,K=()=>ee(E,F);Y?Y(h.el,F,K):K()}else F()},_e=(h,_)=>{let E;for(;h!==_;)E=p(h),o(h),h=E;o(_)},Ae=(h,_,E)=>{const{bum:D,scope:j,job:F,subTree:ee,um:Y,m:K,a:H}=h;Fl(K),Fl(H),D&&rs(D),j.stop(),F&&(F.flags|=8,re(ee,h,_,E)),Y&&lt(Y,_),lt(()=>{h.isUnmounted=!0},_)},ke=(h,_,E,D=!1,j=!1,F=0)=>{for(let ee=F;ee<h.length;ee++)re(h[ee],_,E,D,j)},N=h=>{if(h.shapeFlag&6)return N(h.component.subTree);if(h.shapeFlag&128)return h.suspense.next();const _=p(h.anchor||h.el),E=_&&_[Df];return E?p(E):_};let te=!1;const Z=(h,_,E)=>{h==null?_._vnode&&re(_._vnode,null,null,!0):g(_._vnode||null,h,_,null,null,null,E),_._vnode=h,te||(te=!0,Sl(),kf(),te=!1)},le={p:g,um:re,m:he,r:ge,mt:z,mc:T,pc:S,pbc:M,n:N,o:e};return{render:Z,hydrate:void 0,createApp:Dh(Z)}}function li({type:e,props:t},n){return n==="svg"&&e==="foreignObject"||n==="mathml"&&e==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:n}function Vn({effect:e,job:t},n){n?(e.flags|=32,t.flags|=4):(e.flags&=-33,t.flags&=-5)}function Kh(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function Fa(e,t,n=!1){const r=e.children,o=t.children;if(ie(r)&&ie(o))for(let s=0;s<r.length;s++){const i=r[s];let a=o[s];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=o[s]=Cn(o[s]),a.el=i.el),!n&&a.patchFlag!==-2&&Fa(i,a)),a.type===Lo&&a.patchFlag!==-1&&(a.el=i.el),a.type===Je&&!a.el&&(a.el=i.el)}}function qh(e){const t=e.slice(),n=[0];let r,o,s,i,a;const l=e.length;for(r=0;r<l;r++){const c=e[r];if(c!==0){if(o=n[n.length-1],e[o]<c){t[r]=o,n.push(r);continue}for(s=0,i=n.length-1;s<i;)a=s+i>>1,e[n[a]]<c?s=a+1:i=a;c<e[n[s]]&&(s>0&&(t[r]=n[s-1]),n[s]=r)}}for(s=n.length,i=n[s-1];s-- >0;)n[s]=i,i=t[i];return n}function fp(e){const t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:fp(t)}function Fl(e){if(e)for(let t=0;t<e.length;t++)e[t].flags|=8}const Jh=Symbol.for("v-scx"),Yh=()=>Te(Jh);function pp(e,t){return La(e,null,t)}function ye(e,t,n){return La(e,t,n)}function La(e,t,n=Ne){const{immediate:r,deep:o,flush:s,once:i}=n,a=Ke({},n),l=t&&r||!t&&s!=="post";let c;if(Eo){if(s==="sync"){const d=Yh();c=d.__watcherHandles||(d.__watcherHandles=[])}else if(!l){const d=()=>{};return d.stop=pt,d.resume=pt,d.pause=pt,d}}const u=ot;a.call=(d,m,g)=>kt(d,u,m,g);let f=!1;s==="post"?a.scheduler=d=>{lt(d,u&&u.suspense)}:s!=="sync"&&(f=!0,a.scheduler=(d,m)=>{m?d():Aa(d)}),a.augmentJob=d=>{t&&(d.flags|=4),f&&(d.flags|=2,u&&(d.id=u.uid,d.i=u))};const p=uh(e,t,a);return Eo&&(c?c.push(p):l&&p()),p}function Qh(e,t,n){const r=this.proxy,o=we(e)?e.includes(".")?dp(r,e):()=>r[e]:e.bind(r,r);let s;ue(t)?s=t:(s=t.handler,n=t);const i=Do(this),a=La(o,s.bind(r),n);return i(),a}function dp(e,t){const n=t.split(".");return()=>{let r=e;for(let o=0;o<n.length&&r;o++)r=r[n[o]];return r}}const Xh=(e,t)=>t==="modelValue"||t==="model-value"?e.modelModifiers:e[`${t}Modifiers`]||e[`${xt(t)}Modifiers`]||e[`${Dn(t)}Modifiers`];function Zh(e,t,...n){if(e.isUnmounted)return;const r=e.vnode.props||Ne;let o=n;const s=t.startsWith("update:"),i=s&&Xh(r,t.slice(7));i&&(i.trim&&(o=n.map(u=>we(u)?u.trim():u)),i.number&&(o=n.map(_a)));let a,l=r[a=ns(t)]||r[a=ns(xt(t))];!l&&s&&(l=r[a=ns(Dn(t))]),l&&kt(l,e,6,o);const c=r[a+"Once"];if(c){if(!e.emitted)e.emitted={};else if(e.emitted[a])return;e.emitted[a]=!0,kt(c,e,6,o)}}const eg=new WeakMap;function mp(e,t,n=!1){const r=n?eg:t.emitsCache,o=r.get(e);if(o!==void 0)return o;const s=e.emits;let i={},a=!1;if(!ue(e)){const l=c=>{const u=mp(c,t,!0);u&&(a=!0,Ke(i,u))};!n&&t.mixins.length&&t.mixins.forEach(l),e.extends&&l(e.extends),e.mixins&&e.mixins.forEach(l)}return!s&&!a?(Ee(e)&&r.set(e,null),null):(ie(s)?s.forEach(l=>i[l]=null):Ke(i,s),Ee(e)&&r.set(e,i),i)}function zs(e,t){return!e||!Ns(t)?!1:(t=t.slice(2).replace(/Once$/,""),Pe(e,t[0].toLowerCase()+t.slice(1))||Pe(e,Dn(t))||Pe(e,t))}function Ll(e){const{type:t,vnode:n,proxy:r,withProxy:o,propsOptions:[s],slots:i,attrs:a,emit:l,render:c,renderCache:u,props:f,data:p,setupState:d,ctx:m,inheritAttrs:g}=e,x=hs(e);let b,C;try{if(n.shapeFlag&4){const P=o||r,R=P;b=zt(c.call(R,P,u,f,d,p,m)),C=a}else{const P=t;b=zt(P.length>1?P(f,{attrs:a,slots:i,emit:l}):P(f,null)),C=t.props?a:tg(a)}}catch(P){uo.length=0,js(P,e,1),b=oe(Je)}let v=b;if(C&&g!==!1){const P=Object.keys(C),{shapeFlag:R}=v;P.length&&R&7&&(s&&P.some(ma)&&(C=ng(C,s)),v=fn(v,C,!1,!0))}return n.dirs&&(v=fn(v,null,!1,!0),v.dirs=v.dirs?v.dirs.concat(n.dirs):n.dirs),n.transition&&or(v,n.transition),b=v,hs(x),b}const tg=e=>{let t;for(const n in e)(n==="class"||n==="style"||Ns(n))&&((t||(t={}))[n]=e[n]);return t},ng=(e,t)=>{const n={};for(const r in e)(!ma(r)||!(r.slice(9)in t))&&(n[r]=e[r]);return n};function rg(e,t,n){const{props:r,children:o,component:s}=e,{props:i,children:a,patchFlag:l}=t,c=s.emitsOptions;if(t.dirs||t.transition)return!0;if(n&&l>=0){if(l&1024)return!0;if(l&16)return r?Dl(r,i,c):!!i;if(l&8){const u=t.dynamicProps;for(let f=0;f<u.length;f++){const p=u[f];if(i[p]!==r[p]&&!zs(c,p))return!0}}}else return(o||a)&&(!a||!a.$stable)?!0:r===i?!1:r?i?Dl(r,i,c):!0:!!i;return!1}function Dl(e,t,n){const r=Object.keys(t);if(r.length!==Object.keys(e).length)return!0;for(let o=0;o<r.length;o++){const s=r[o];if(t[s]!==e[s]&&!zs(n,s))return!0}return!1}function og({vnode:e,parent:t},n){for(;t;){const r=t.subTree;if(r.suspense&&r.suspense.activeBranch===e&&(r.el=e.el),r===e)(e=t.vnode).el=n,t=t.parent;else break}}const hp=e=>e.__isSuspense;function sg(e,t){t&&t.pendingBranch?ie(e)?t.effects.push(...e):t.effects.push(e):dh(e)}const We=Symbol.for("v-fgt"),Lo=Symbol.for("v-txt"),Je=Symbol.for("v-cmt"),ss=Symbol.for("v-stc"),uo=[];let wt=null;function J(e=!1){uo.push(wt=e?null:[])}function ig(){uo.pop(),wt=uo[uo.length-1]||null}let So=1;function vs(e,t=!1){So+=e,e<0&&wt&&t&&(wt.hasOnce=!0)}function gp(e){return e.dynamicChildren=So>0?wt||Pr:null,ig(),So>0&&wt&&wt.push(e),e}function ae(e,t,n,r,o,s){return gp(Q(e,t,n,r,o,s,!0))}function He(e,t,n,r,o){return gp(oe(e,t,n,r,o,!0))}function Ut(e){return e?e.__v_isVNode===!0:!1}function qn(e,t){return e.type===t.type&&e.key===t.key}const _p=({key:e})=>e??null,is=({ref:e,ref_key:t,ref_for:n})=>(typeof e=="number"&&(e=""+e),e!=null?we(e)||$e(e)||ue(e)?{i:Ze,r:e,k:t,f:!!n}:e:null);function Q(e,t=null,n=null,r=0,o=null,s=e===We?0:1,i=!1,a=!1){const l={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&_p(t),ref:t&&is(t),scopeId:Lf,slotScopeIds:null,children:n,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:r,dynamicProps:o,dynamicChildren:null,appContext:null,ctx:Ze};return a?(Ba(l,n),s&128&&e.normalize(l)):n&&(l.shapeFlag|=we(n)?8:16),So>0&&!i&&wt&&(l.patchFlag>0||s&6)&&l.patchFlag!==32&&wt.push(l),l}const oe=ag;function ag(e,t=null,n=null,r=0,o=null,s=!1){if((!e||e===Qf)&&(e=Je),Ut(e)){const a=fn(e,t,!0);return n&&Ba(a,n),So>0&&!s&&wt&&(a.shapeFlag&6?wt[wt.indexOf(e)]=a:wt.push(a)),a.patchFlag=-2,a}if(gg(e)&&(e=e.__vccOpts),t){t=lg(t);let{class:a,style:l}=t;a&&!we(a)&&(t.class=De(a)),Ee(l)&&(Pa(l)&&!ie(l)&&(l=Ke({},l)),t.style=Qt(l))}const i=we(e)?1:hp(e)?128:Bf(e)?64:Ee(e)?4:ue(e)?2:0;return Q(e,t,n,r,o,i,s,!0)}function lg(e){return e?Pa(e)||sp(e)?Ke({},e):e:null}function fn(e,t,n=!1,r=!1){const{props:o,ref:s,patchFlag:i,children:a,transition:l}=e,c=t?lr(o||{},t):o,u={__v_isVNode:!0,__v_skip:!0,type:e.type,props:c,key:c&&_p(c),ref:t&&t.ref?n&&s?ie(s)?s.concat(is(t)):[s,is(t)]:is(t):s,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:a,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==We?i===-1?16:i|16:i,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:l,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&fn(e.ssContent),ssFallback:e.ssFallback&&fn(e.ssFallback),placeholder:e.placeholder,el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce};return l&&r&&or(u,l.clone(u)),u}function Da(e=" ",t=0){return oe(Lo,null,e,t)}function aE(e,t){const n=oe(ss,null,e);return n.staticCount=t,n}function On(e="",t=!1){return t?(J(),He(Je,null,e)):oe(Je,null,e)}function zt(e){return e==null||typeof e=="boolean"?oe(Je):ie(e)?oe(We,null,e.slice()):Ut(e)?Cn(e):oe(Lo,null,String(e))}function Cn(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:fn(e)}function Ba(e,t){let n=0;const{shapeFlag:r}=e;if(t==null)t=null;else if(ie(t))n=16;else if(typeof t=="object")if(r&65){const o=t.default;o&&(o._c&&(o._d=!1),Ba(e,o()),o._c&&(o._d=!0));return}else{n=32;const o=t._;!o&&!sp(t)?t._ctx=Ze:o===3&&Ze&&(Ze.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}else ue(t)?(t={default:t,_ctx:Ze},n=32):(t=String(t),r&64?(n=16,t=[Da(t)]):n=8);e.children=t,e.shapeFlag|=n}function lr(...e){const t={};for(let n=0;n<e.length;n++){const r=e[n];for(const o in r)if(o==="class")t.class!==r.class&&(t.class=De([t.class,r.class]));else if(o==="style")t.style=Qt([t.style,r.style]);else if(Ns(o)){const s=t[o],i=r[o];i&&s!==i&&!(ie(s)&&s.includes(i))&&(t[o]=s?[].concat(s,i):i)}else o!==""&&(t[o]=r[o])}return t}function jt(e,t,n,r=null){kt(e,t,7,[n,r])}const cg=np();let ug=0;function fg(e,t,n){const r=e.type,o=(t?t.appContext:e.appContext)||cg,s={uid:ug++,vnode:e,type:r,parent:t,appContext:o,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new pf(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(o.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:ap(r,o),emitsOptions:mp(r,o),emit:null,emitted:null,propsDefaults:Ne,inheritAttrs:r.inheritAttrs,ctx:Ne,data:Ne,props:Ne,attrs:Ne,slots:Ne,refs:Ne,setupState:Ne,setupContext:null,suspense:n,suspenseId:n?n.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return s.ctx={_:s},s.root=t?t.root:s,s.emit=Zh.bind(null,s),e.ce&&e.ce(s),s}let ot=null;const Qe=()=>ot||Ze;let ys,$i;{const e=Ds(),t=(n,r)=>{let o;return(o=e[n])||(o=e[n]=[]),o.push(r),s=>{o.length>1?o.forEach(i=>i(s)):o[0](s)}};ys=t("__VUE_INSTANCE_SETTERS__",n=>ot=n),$i=t("__VUE_SSR_SETTERS__",n=>Eo=n)}const Do=e=>{const t=ot;return ys(e),e.scope.on(),()=>{e.scope.off(),ys(t)}},Bl=()=>{ot&&ot.scope.off(),ys(null)};function vp(e){return e.vnode.shapeFlag&4}let Eo=!1;function pg(e,t=!1,n=!1){t&&$i(t);const{props:r,children:o}=e.vnode,s=vp(e);$h(e,r,s,t),zh(e,o,n||t);const i=s?dg(e,t):void 0;return t&&$i(!1),i}function dg(e,t){const n=e.type;e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,Ih);const{setup:r}=n;if(r){cn();const o=e.setupContext=r.length>1?bp(e):null,s=Do(e),i=Fo(r,e,0,[e.props,o]),a=rf(i);if(un(),s(),(a||e.sp)&&!Ar(e)&&Gf(e),a){if(i.then(Bl,Bl),t)return i.then(l=>{$l(e,l)}).catch(l=>{js(l,e,0)});e.asyncDep=i}else $l(e,i)}else yp(e)}function $l(e,t,n){ue(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:Ee(t)&&(e.setupState=Of(t)),yp(e)}function yp(e,t,n){const r=e.type;e.render||(e.render=r.render||pt);{const o=Do(e);cn();try{Mh(e)}finally{un(),o()}}}const mg={get(e,t){return rt(e,"get",""),e[t]}};function bp(e){const t=n=>{e.exposed=n||{}};return{attrs:new Proxy(e.attrs,mg),slots:e.slots,emit:e.emit,expose:t}}function Ws(e){return e.exposed?e.exposeProxy||(e.exposeProxy=new Proxy(Of(Ca(e.exposed)),{get(t,n){if(n in t)return t[n];if(n in co)return co[n](e)},has(t,n){return n in t||n in co}})):e.proxy}function hg(e,t=!0){return ue(e)?e.displayName||e.name:e.name||t&&e.__name}function gg(e){return ue(e)&&"__vccOpts"in e}const k=(e,t)=>lh(e,t,Eo);function ze(e,t,n){try{vs(-1);const r=arguments.length;return r===2?Ee(t)&&!ie(t)?Ut(t)?oe(e,null,[t]):oe(e,t):oe(e,null,t):(r>3?n=Array.prototype.slice.call(arguments,2):r===3&&Ut(n)&&(n=[n]),oe(e,t,n))}finally{vs(1)}}const _g="3.5.24",vg=pt;/**
* @vue/runtime-dom v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let ji;const jl=typeof window<"u"&&window.trustedTypes;if(jl)try{ji=jl.createPolicy("vue",{createHTML:e=>e})}catch{}const wp=ji?e=>ji.createHTML(e):e=>e,yg="http://www.w3.org/2000/svg",bg="http://www.w3.org/1998/Math/MathML",tn=typeof document<"u"?document:null,Hl=tn&&tn.createElement("template"),wg={insert:(e,t,n)=>{t.insertBefore(e,n||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,n,r)=>{const o=t==="svg"?tn.createElementNS(yg,e):t==="mathml"?tn.createElementNS(bg,e):n?tn.createElement(e,{is:n}):tn.createElement(e);return e==="select"&&r&&r.multiple!=null&&o.setAttribute("multiple",r.multiple),o},createText:e=>tn.createTextNode(e),createComment:e=>tn.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>tn.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,n,r,o,s){const i=n?n.previousSibling:t.lastChild;if(o&&(o===s||o.nextSibling))for(;t.insertBefore(o.cloneNode(!0),n),!(o===s||!(o=o.nextSibling)););else{Hl.innerHTML=wp(r==="svg"?`<svg>${e}</svg>`:r==="mathml"?`<math>${e}</math>`:e);const a=Hl.content;if(r==="svg"||r==="mathml"){const l=a.firstChild;for(;l.firstChild;)a.appendChild(l.firstChild);a.removeChild(l)}t.insertBefore(a,n)}return[i?i.nextSibling:t.firstChild,n?n.previousSibling:t.lastChild]}},yn="transition",Yr="animation",Mr=Symbol("_vtc"),xp={name:String,type:String,css:{type:Boolean,default:!0},duration:[String,Number,Object],enterFromClass:String,enterActiveClass:String,enterToClass:String,appearFromClass:String,appearActiveClass:String,appearToClass:String,leaveFromClass:String,leaveActiveClass:String,leaveToClass:String},Sp=Ke({},Vf,xp),xg=e=>(e.displayName="Transition",e.props=Sp,e),Bo=xg((e,{slots:t})=>ze(_h,Ep(e),t)),zn=(e,t=[])=>{ie(e)?e.forEach(n=>n(...t)):e&&e(...t)},Vl=e=>e?ie(e)?e.some(t=>t.length>1):e.length>1:!1;function Ep(e){const t={};for(const A in e)A in xp||(t[A]=e[A]);if(e.css===!1)return t;const{name:n="v",type:r,duration:o,enterFromClass:s=`${n}-enter-from`,enterActiveClass:i=`${n}-enter-active`,enterToClass:a=`${n}-enter-to`,appearFromClass:l=s,appearActiveClass:c=i,appearToClass:u=a,leaveFromClass:f=`${n}-leave-from`,leaveActiveClass:p=`${n}-leave-active`,leaveToClass:d=`${n}-leave-to`}=e,m=Sg(o),g=m&&m[0],x=m&&m[1],{onBeforeEnter:b,onEnter:C,onEnterCancelled:v,onLeave:P,onLeaveCancelled:R,onBeforeAppear:$=b,onAppear:B=C,onAppearCancelled:T=v}=t,y=(A,I,z,X)=>{A._enterCancelled=X,wn(A,I?u:a),wn(A,I?c:i),z&&z()},M=(A,I)=>{A._isLeaving=!1,wn(A,f),wn(A,d),wn(A,p),I&&I()},U=A=>(I,z)=>{const X=A?B:C,G=()=>y(I,A,z);zn(X,[I,G]),zl(()=>{wn(I,A?l:s),Ht(I,A?u:a),Vl(X)||Wl(I,r,g,G)})};return Ke(t,{onBeforeEnter(A){zn(b,[A]),Ht(A,s),Ht(A,i)},onBeforeAppear(A){zn($,[A]),Ht(A,l),Ht(A,c)},onEnter:U(!1),onAppear:U(!0),onLeave(A,I){A._isLeaving=!0;const z=()=>M(A,I);Ht(A,f),A._enterCancelled?(Ht(A,p),Hi(A)):(Hi(A),Ht(A,p)),zl(()=>{A._isLeaving&&(wn(A,f),Ht(A,d),Vl(P)||Wl(A,r,x,z))}),zn(P,[A,z])},onEnterCancelled(A){y(A,!1,void 0,!0),zn(v,[A])},onAppearCancelled(A){y(A,!0,void 0,!0),zn(T,[A])},onLeaveCancelled(A){M(A),zn(R,[A])}})}function Sg(e){if(e==null)return null;if(Ee(e))return[ci(e.enter),ci(e.leave)];{const t=ci(e);return[t,t]}}function ci(e){return Im(e)}function Ht(e,t){t.split(/\s+/).forEach(n=>n&&e.classList.add(n)),(e[Mr]||(e[Mr]=new Set)).add(t)}function wn(e,t){t.split(/\s+/).forEach(r=>r&&e.classList.remove(r));const n=e[Mr];n&&(n.delete(t),n.size||(e[Mr]=void 0))}function zl(e){requestAnimationFrame(()=>{requestAnimationFrame(e)})}let Eg=0;function Wl(e,t,n,r){const o=e._endId=++Eg,s=()=>{o===e._endId&&r()};if(n!=null)return setTimeout(s,n);const{type:i,timeout:a,propCount:l}=Pp(e,t);if(!i)return r();const c=i+"end";let u=0;const f=()=>{e.removeEventListener(c,p),s()},p=d=>{d.target===e&&++u>=l&&f()};setTimeout(()=>{u<l&&f()},a+1),e.addEventListener(c,p)}function Pp(e,t){const n=window.getComputedStyle(e),r=m=>(n[m]||"").split(", "),o=r(`${yn}Delay`),s=r(`${yn}Duration`),i=Ul(o,s),a=r(`${Yr}Delay`),l=r(`${Yr}Duration`),c=Ul(a,l);let u=null,f=0,p=0;t===yn?i>0&&(u=yn,f=i,p=s.length):t===Yr?c>0&&(u=Yr,f=c,p=l.length):(f=Math.max(i,c),u=f>0?i>c?yn:Yr:null,p=u?u===yn?s.length:l.length:0);const d=u===yn&&/\b(?:transform|all)(?:,|$)/.test(r(`${yn}Property`).toString());return{type:u,timeout:f,propCount:p,hasTransform:d}}function Ul(e,t){for(;e.length<t.length;)e=e.concat(e);return Math.max(...t.map((n,r)=>Gl(n)+Gl(e[r])))}function Gl(e){return e==="auto"?0:Number(e.slice(0,-1).replace(",","."))*1e3}function Hi(e){return(e?e.ownerDocument:document).body.offsetHeight}function Pg(e,t,n){const r=e[Mr];r&&(t=(t?[t,...r]:[...r]).join(" ")),t==null?e.removeAttribute("class"):n?e.setAttribute("class",t):e.className=t}const bs=Symbol("_vod"),Cp=Symbol("_vsh"),Us={name:"show",beforeMount(e,{value:t},{transition:n}){e[bs]=e.style.display==="none"?"":e.style.display,n&&t?n.beforeEnter(e):Qr(e,t)},mounted(e,{value:t},{transition:n}){n&&t&&n.enter(e)},updated(e,{value:t,oldValue:n},{transition:r}){!t!=!n&&(r?t?(r.beforeEnter(e),Qr(e,!0),r.enter(e)):r.leave(e,()=>{Qr(e,!1)}):Qr(e,t))},beforeUnmount(e,{value:t}){Qr(e,t)}};function Qr(e,t){e.style.display=t?e[bs]:"none",e[Cp]=!t}const Cg=Symbol(""),Tg=/(?:^|;)\s*display\s*:/;function Ag(e,t,n){const r=e.style,o=we(n);let s=!1;if(n&&!o){if(t)if(we(t))for(const i of t.split(";")){const a=i.slice(0,i.indexOf(":")).trim();n[a]==null&&as(r,a,"")}else for(const i in t)n[i]==null&&as(r,i,"");for(const i in n)i==="display"&&(s=!0),as(r,i,n[i])}else if(o){if(t!==n){const i=r[Cg];i&&(n+=";"+i),r.cssText=n,s=Tg.test(n)}}else t&&e.removeAttribute("style");bs in e&&(e[bs]=s?r.display:"",e[Cp]&&(r.display="none"))}const Kl=/\s*!important$/;function as(e,t,n){if(ie(n))n.forEach(r=>as(e,t,r));else if(n==null&&(n=""),t.startsWith("--"))e.setProperty(t,n);else{const r=Ig(e,t);Kl.test(n)?e.setProperty(Dn(r),n.replace(Kl,""),"important"):e[r]=n}}const ql=["Webkit","Moz","ms"],ui={};function Ig(e,t){const n=ui[t];if(n)return n;let r=xt(t);if(r!=="filter"&&r in e)return ui[t]=r;r=Ls(r);for(let o=0;o<ql.length;o++){const s=ql[o]+r;if(s in e)return ui[t]=s}return t}const Jl="http://www.w3.org/1999/xlink";function Yl(e,t,n,r,o,s=Fm(t)){r&&t.startsWith("xlink:")?n==null?e.removeAttributeNS(Jl,t.slice(6,t.length)):e.setAttributeNS(Jl,t,n):n==null||s&&!lf(n)?e.removeAttribute(t):e.setAttribute(t,s?"":Nt(n)?String(n):n)}function Ql(e,t,n,r,o){if(t==="innerHTML"||t==="textContent"){n!=null&&(e[t]=t==="innerHTML"?wp(n):n);return}const s=e.tagName;if(t==="value"&&s!=="PROGRESS"&&!s.includes("-")){const a=s==="OPTION"?e.getAttribute("value")||"":e.value,l=n==null?e.type==="checkbox"?"on":"":String(n);(a!==l||!("_value"in e))&&(e.value=l),n==null&&e.removeAttribute(t),e._value=n;return}let i=!1;if(n===""||n==null){const a=typeof e[t];a==="boolean"?n=lf(n):n==null&&a==="string"?(n="",i=!0):a==="number"&&(n=0,i=!0)}try{e[t]=n}catch{}i&&e.removeAttribute(o||t)}function In(e,t,n,r){e.addEventListener(t,n,r)}function Og(e,t,n,r){e.removeEventListener(t,n,r)}const Xl=Symbol("_vei");function Mg(e,t,n,r,o=null){const s=e[Xl]||(e[Xl]={}),i=s[t];if(r&&i)i.value=r;else{const[a,l]=Rg(t);if(r){const c=s[t]=Fg(r,o);In(e,a,c,l)}else i&&(Og(e,a,i,l),s[t]=void 0)}}const Zl=/(?:Once|Passive|Capture)$/;function Rg(e){let t;if(Zl.test(e)){t={};let r;for(;r=e.match(Zl);)e=e.slice(0,e.length-r[0].length),t[r[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Dn(e.slice(2)),t]}let fi=0;const Ng=Promise.resolve(),kg=()=>fi||(Ng.then(()=>fi=0),fi=Date.now());function Fg(e,t){const n=r=>{if(!r._vts)r._vts=Date.now();else if(r._vts<=n.attached)return;kt(Lg(r,n.value),t,5,[r])};return n.value=e,n.attached=kg(),n}function Lg(e,t){if(ie(t)){const n=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{n.call(e),e._stopped=!0},t.map(r=>o=>!o._stopped&&r&&r(o))}else return t}const ec=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,Dg=(e,t,n,r,o,s)=>{const i=o==="svg";t==="class"?Pg(e,r,i):t==="style"?Ag(e,n,r):Ns(t)?ma(t)||Mg(e,t,n,r,s):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):Bg(e,t,r,i))?(Ql(e,t,r),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Yl(e,t,r,i,s,t!=="value")):e._isVueCE&&(/[A-Z]/.test(t)||!we(r))?Ql(e,xt(t),r,s,t):(t==="true-value"?e._trueValue=r:t==="false-value"&&(e._falseValue=r),Yl(e,t,r,i))};function Bg(e,t,n,r){if(r)return!!(t==="innerHTML"||t==="textContent"||t in e&&ec(t)&&ue(n));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="autocorrect"||t==="sandbox"&&e.tagName==="IFRAME"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const o=e.tagName;if(o==="IMG"||o==="VIDEO"||o==="CANVAS"||o==="SOURCE")return!1}return ec(t)&&we(n)?!1:t in e}const Tp=new WeakMap,Ap=new WeakMap,ws=Symbol("_moveCb"),tc=Symbol("_enterCb"),$g=e=>(delete e.props.mode,e),jg=$g({name:"TransitionGroup",props:Ke({},Sp,{tag:String,moveClass:String}),setup(e,{slots:t}){const n=Qe(),r=Hf();let o,s;return Yf(()=>{if(!o.length)return;const i=e.moveClass||`${e.name||"v"}-move`;if(!Wg(o[0].el,n.vnode.el,i)){o=[];return}o.forEach(Hg),o.forEach(Vg);const a=o.filter(zg);Hi(n.vnode.el),a.forEach(l=>{const c=l.el,u=c.style;Ht(c,i),u.transform=u.webkitTransform=u.transitionDuration="";const f=c[ws]=p=>{p&&p.target!==c||(!p||p.propertyName.endsWith("transform"))&&(c.removeEventListener("transitionend",f),c[ws]=null,wn(c,i))};c.addEventListener("transitionend",f)}),o=[]}),()=>{const i=Se(e),a=Ep(i);let l=i.tag||We;if(o=[],s)for(let c=0;c<s.length;c++){const u=s[c];u.el&&u.el instanceof Element&&(o.push(u),or(u,xo(u,a,r,n)),Tp.set(u,{left:u.el.offsetLeft,top:u.el.offsetTop}))}s=t.default?Ia(t.default()):[];for(let c=0;c<s.length;c++){const u=s[c];u.key!=null&&or(u,xo(u,a,r,n))}return oe(l,null,s)}}}),lE=jg;function Hg(e){const t=e.el;t[ws]&&t[ws](),t[tc]&&t[tc]()}function Vg(e){Ap.set(e,{left:e.el.offsetLeft,top:e.el.offsetTop})}function zg(e){const t=Tp.get(e),n=Ap.get(e),r=t.left-n.left,o=t.top-n.top;if(r||o){const s=e.el.style;return s.transform=s.webkitTransform=`translate(${r}px,${o}px)`,s.transitionDuration="0s",e}}function Wg(e,t,n){const r=e.cloneNode(),o=e[Mr];o&&o.forEach(a=>{a.split(/\s+/).forEach(l=>l&&r.classList.remove(l))}),n.split(/\s+/).forEach(a=>a&&r.classList.add(a)),r.style.display="none";const s=t.nodeType===1?t:t.parentNode;s.appendChild(r);const{hasTransform:i}=Pp(r);return s.removeChild(r),i}const Rr=e=>{const t=e.props["onUpdate:modelValue"]||!1;return ie(t)?n=>rs(t,n):t};function Ug(e){e.target.composing=!0}function nc(e){const t=e.target;t.composing&&(t.composing=!1,t.dispatchEvent(new Event("input")))}const ln=Symbol("_assign");function rc(e,t,n){return t&&(e=e.trim()),n&&(e=_a(e)),e}const cE={created(e,{modifiers:{lazy:t,trim:n,number:r}},o){e[ln]=Rr(o);const s=r||o.props&&o.props.type==="number";In(e,t?"change":"input",i=>{i.target.composing||e[ln](rc(e.value,n,s))}),(n||s)&&In(e,"change",()=>{e.value=rc(e.value,n,s)}),t||(In(e,"compositionstart",Ug),In(e,"compositionend",nc),In(e,"change",nc))},mounted(e,{value:t}){e.value=t??""},beforeUpdate(e,{value:t,oldValue:n,modifiers:{lazy:r,trim:o,number:s}},i){if(e[ln]=Rr(i),e.composing)return;const a=(s||e.type==="number")&&!/^0\d/.test(e.value)?_a(e.value):e.value,l=t??"";a!==l&&(document.activeElement===e&&e.type!=="range"&&(r&&t===n||o&&e.value.trim()===l)||(e.value=l))}},uE={deep:!0,created(e,t,n){e[ln]=Rr(n),In(e,"change",()=>{const r=e._modelValue,o=Ip(e),s=e.checked,i=e[ln];if(ie(r)){const a=cf(r,o),l=a!==-1;if(s&&!l)i(r.concat(o));else if(!s&&l){const c=[...r];c.splice(a,1),i(c)}}else if(ks(r)){const a=new Set(r);s?a.add(o):a.delete(o),i(a)}else i(Op(e,s))})},mounted:oc,beforeUpdate(e,t,n){e[ln]=Rr(n),oc(e,t,n)}};function oc(e,{value:t,oldValue:n},r){e._modelValue=t;let o;if(ie(t))o=cf(t,r.props.value)>-1;else if(ks(t))o=t.has(r.props.value);else{if(t===n)return;o=Ir(t,Op(e,!0))}e.checked!==o&&(e.checked=o)}const fE={created(e,{value:t},n){e.checked=Ir(t,n.props.value),e[ln]=Rr(n),In(e,"change",()=>{e[ln](Ip(e))})},beforeUpdate(e,{value:t,oldValue:n},r){e[ln]=Rr(r),t!==n&&(e.checked=Ir(t,r.props.value))}};function Ip(e){return"_value"in e?e._value:e.value}function Op(e,t){const n=t?"_trueValue":"_falseValue";return n in e?e[n]:t}const Gg=["ctrl","shift","alt","meta"],Kg={stop:e=>e.stopPropagation(),prevent:e=>e.preventDefault(),self:e=>e.target!==e.currentTarget,ctrl:e=>!e.ctrlKey,shift:e=>!e.shiftKey,alt:e=>!e.altKey,meta:e=>!e.metaKey,left:e=>"button"in e&&e.button!==0,middle:e=>"button"in e&&e.button!==1,right:e=>"button"in e&&e.button!==2,exact:(e,t)=>Gg.some(n=>e[`${n}Key`]&&!t.includes(n))},qg=(e,t)=>{const n=e._withMods||(e._withMods={}),r=t.join(".");return n[r]||(n[r]=(o,...s)=>{for(let i=0;i<t.length;i++){const a=Kg[t[i]];if(a&&a(o,t))return}return e(o,...s)})},Jg={esc:"escape",space:" ",up:"arrow-up",left:"arrow-left",right:"arrow-right",down:"arrow-down",delete:"backspace"},pE=(e,t)=>{const n=e._withKeys||(e._withKeys={}),r=t.join(".");return n[r]||(n[r]=o=>{if(!("key"in o))return;const s=Dn(o.key);if(t.some(i=>i===s||Jg[i]===s))return e(o)})},Yg=Ke({patchProp:Dg},wg);let sc;function Mp(){return sc||(sc=Uh(Yg))}const ic=(...e)=>{Mp().render(...e)},Qg=(...e)=>{const t=Mp().createApp(...e),{mount:n}=t;return t.mount=r=>{const o=Zg(r);if(!o)return;const s=t._component;!ue(s)&&!s.render&&!s.template&&(s.template=o.innerHTML),o.nodeType===1&&(o.textContent="");const i=n(o,!1,Xg(o));return o instanceof Element&&(o.removeAttribute("v-cloak"),o.setAttribute("data-v-app","")),i},t};function Xg(e){if(e instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&e instanceof MathMLElement)return"mathml"}function Zg(e){return we(e)?document.querySelector(e):e}/*!
 * pinia v2.3.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */let Rp;const Gs=e=>Rp=e,Np=Symbol();function Vi(e){return e&&typeof e=="object"&&Object.prototype.toString.call(e)==="[object Object]"&&typeof e.toJSON!="function"}var fo;(function(e){e.direct="direct",e.patchObject="patch object",e.patchFunction="patch function"})(fo||(fo={}));function e0(){const e=df(!0),t=e.run(()=>L({}));let n=[],r=[];const o=Ca({install(s){Gs(o),o._a=s,s.provide(Np,o),s.config.globalProperties.$pinia=o,r.forEach(i=>n.push(i)),r=[]},use(s){return this._a?n.push(s):r.push(s),this},_p:n,_a:null,_e:e,_s:new Map,state:t});return o}const kp=()=>{};function ac(e,t,n,r=kp){e.push(t);const o=()=>{const s=e.indexOf(t);s>-1&&(e.splice(s,1),r())};return!n&&va()&&mf(o),o}function mr(e,...t){e.slice().forEach(n=>{n(...t)})}const t0=e=>e(),lc=Symbol(),pi=Symbol();function zi(e,t){e instanceof Map&&t instanceof Map?t.forEach((n,r)=>e.set(r,n)):e instanceof Set&&t instanceof Set&&t.forEach(e.add,e);for(const n in t){if(!t.hasOwnProperty(n))continue;const r=t[n],o=e[n];Vi(o)&&Vi(r)&&e.hasOwnProperty(n)&&!$e(r)&&!kn(r)?e[n]=zi(o,r):e[n]=r}return e}const n0=Symbol();function r0(e){return!Vi(e)||!e.hasOwnProperty(n0)}const{assign:xn}=Object;function o0(e){return!!($e(e)&&e.effect)}function s0(e,t,n,r){const{state:o,actions:s,getters:i}=t,a=n.state.value[e];let l;function c(){a||(n.state.value[e]=o?o():{});const u=oh(n.state.value[e]);return xn(u,s,Object.keys(i||{}).reduce((f,p)=>(f[p]=Ca(k(()=>{Gs(n);const d=n._s.get(e);return i[p].call(d,d)})),f),{}))}return l=Fp(e,c,t,n,r,!0),l}function Fp(e,t,n={},r,o,s){let i;const a=xn({actions:{}},n),l={deep:!0};let c,u,f=[],p=[],d;const m=r.state.value[e];!s&&!m&&(r.state.value[e]={}),L({});let g;function x(T){let y;c=u=!1,typeof T=="function"?(T(r.state.value[e]),y={type:fo.patchFunction,storeId:e,events:d}):(zi(r.state.value[e],T),y={type:fo.patchObject,payload:T,storeId:e,events:d});const M=g=Symbol();Kt().then(()=>{g===M&&(c=!0)}),u=!0,mr(f,y,r.state.value[e])}const b=s?function(){const{state:y}=n,M=y?y():{};this.$patch(U=>{xn(U,M)})}:kp;function C(){i.stop(),f=[],p=[],r._s.delete(e)}const v=(T,y="")=>{if(lc in T)return T[pi]=y,T;const M=function(){Gs(r);const U=Array.from(arguments),A=[],I=[];function z(O){A.push(O)}function X(O){I.push(O)}mr(p,{args:U,name:M[pi],store:R,after:z,onError:X});let G;try{G=T.apply(this&&this.$id===e?this:R,U)}catch(O){throw mr(I,O),O}return G instanceof Promise?G.then(O=>(mr(A,O),O)).catch(O=>(mr(I,O),Promise.reject(O))):(mr(A,G),G)};return M[lc]=!0,M[pi]=y,M},P={_p:r,$id:e,$onAction:ac.bind(null,p),$patch:x,$reset:b,$subscribe(T,y={}){const M=ac(f,T,y.detached,()=>U()),U=i.run(()=>ye(()=>r.state.value[e],A=>{(y.flush==="sync"?u:c)&&T({storeId:e,type:fo.direct,events:d},A)},xn({},l,y)));return M},$dispose:C},R=Bn(P);r._s.set(e,R);const B=(r._a&&r._a.runWithContext||t0)(()=>r._e.run(()=>(i=df()).run(()=>t({action:v}))));for(const T in B){const y=B[T];if($e(y)&&!o0(y)||kn(y))s||(m&&r0(y)&&($e(y)?y.value=m[T]:zi(y,m[T])),r.state.value[e][T]=y);else if(typeof y=="function"){const M=v(y,T);B[T]=M,a.actions[T]=y}}return xn(R,B),xn(Se(R),B),Object.defineProperty(R,"$state",{get:()=>r.state.value[e],set:T=>{x(y=>{xn(y,T)})}}),r._p.forEach(T=>{xn(R,i.run(()=>T({store:R,app:r._a,pinia:r,options:a})))}),m&&s&&n.hydrate&&n.hydrate(R.$state,m),c=!0,u=!0,R}/*! #__NO_SIDE_EFFECTS__ */function Wr(e,t,n){let r,o;const s=typeof t=="function";typeof e=="string"?(r=e,o=s?n:t):(o=e,r=e.id);function i(a,l){const c=Bh();return a=a||(c?Te(Np,null):null),a&&Gs(a),a=Rp,a._s.has(r)||(s?Fp(r,t,o,a):s0(r,o,a)),a._s.get(r)}return i.$id=r,i}const i0="modulepreload",a0=function(e,t){return new URL(e,t).href},cc={},it=function(t,n,r){let o=Promise.resolve();if(n&&n.length>0){const i=document.getElementsByTagName("link"),a=document.querySelector("meta[property=csp-nonce]"),l=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));o=Promise.allSettled(n.map(c=>{if(c=a0(c,r),c in cc)return;cc[c]=!0;const u=c.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(!!r)for(let m=i.length-1;m>=0;m--){const g=i[m];if(g.href===c&&(!u||g.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${f}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":i0,u||(d.as="script"),d.crossOrigin="",d.href=c,l&&d.setAttribute("nonce",l),document.head.appendChild(d),u)return new Promise((m,g)=>{d.addEventListener("load",m),d.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(i){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=i,window.dispatchEvent(a),!a.defaultPrevented)throw i}return o.then(i=>{for(const a of i||[])a.status==="rejected"&&s(a.reason);return t().catch(s)})};/*!
 * vue-router v4.6.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */const vr=typeof document<"u";function Lp(e){return typeof e=="object"||"displayName"in e||"props"in e||"__vccOpts"in e}function l0(e){return e.__esModule||e[Symbol.toStringTag]==="Module"||e.default&&Lp(e.default)}const Ie=Object.assign;function di(e,t){const n={};for(const r in t){const o=t[r];n[r]=Ft(o)?o.map(e):e(o)}return n}const po=()=>{},Ft=Array.isArray;function uc(e,t){const n={};for(const r in e)n[r]=r in t?t[r]:e[r];return n}const Dp=/#/g,c0=/&/g,u0=/\//g,f0=/=/g,p0=/\?/g,Bp=/\+/g,d0=/%5B/g,m0=/%5D/g,$p=/%5E/g,h0=/%60/g,jp=/%7B/g,g0=/%7C/g,Hp=/%7D/g,_0=/%20/g;function $a(e){return e==null?"":encodeURI(""+e).replace(g0,"|").replace(d0,"[").replace(m0,"]")}function v0(e){return $a(e).replace(jp,"{").replace(Hp,"}").replace($p,"^")}function Wi(e){return $a(e).replace(Bp,"%2B").replace(_0,"+").replace(Dp,"%23").replace(c0,"%26").replace(h0,"`").replace(jp,"{").replace(Hp,"}").replace($p,"^")}function y0(e){return Wi(e).replace(f0,"%3D")}function b0(e){return $a(e).replace(Dp,"%23").replace(p0,"%3F")}function w0(e){return b0(e).replace(u0,"%2F")}function Po(e){if(e==null)return null;try{return decodeURIComponent(""+e)}catch{}return""+e}const x0=/\/$/,S0=e=>e.replace(x0,"");function mi(e,t,n="/"){let r,o={},s="",i="";const a=t.indexOf("#");let l=t.indexOf("?");return l=a>=0&&l>a?-1:l,l>=0&&(r=t.slice(0,l),s=t.slice(l,a>0?a:t.length),o=e(s.slice(1))),a>=0&&(r=r||t.slice(0,a),i=t.slice(a,t.length)),r=T0(r??t,n),{fullPath:r+s+i,path:r,query:o,hash:Po(i)}}function E0(e,t){const n=t.query?e(t.query):"";return t.path+(n&&"?")+n+(t.hash||"")}function fc(e,t){return!t||!e.toLowerCase().startsWith(t.toLowerCase())?e:e.slice(t.length)||"/"}function P0(e,t,n){const r=t.matched.length-1,o=n.matched.length-1;return r>-1&&r===o&&Nr(t.matched[r],n.matched[o])&&Vp(t.params,n.params)&&e(t.query)===e(n.query)&&t.hash===n.hash}function Nr(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function Vp(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const n in e)if(!C0(e[n],t[n]))return!1;return!0}function C0(e,t){return Ft(e)?pc(e,t):Ft(t)?pc(t,e):e===t}function pc(e,t){return Ft(t)?e.length===t.length&&e.every((n,r)=>n===t[r]):e.length===1&&e[0]===t}function T0(e,t){if(e.startsWith("/"))return e;if(!e)return t;const n=t.split("/"),r=e.split("/"),o=r[r.length-1];(o===".."||o===".")&&r.push("");let s=n.length-1,i,a;for(i=0;i<r.length;i++)if(a=r[i],a!==".")if(a==="..")s>1&&s--;else break;return n.slice(0,s).join("/")+"/"+r.slice(i).join("/")}const bn={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0};let Ui=function(e){return e.pop="pop",e.push="push",e}({}),hi=function(e){return e.back="back",e.forward="forward",e.unknown="",e}({});function A0(e){if(!e)if(vr){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return e[0]!=="/"&&e[0]!=="#"&&(e="/"+e),S0(e)}const I0=/^[^#]+#/;function O0(e,t){return e.replace(I0,"#")+t}function M0(e,t){const n=document.documentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return{behavior:t.behavior,left:r.left-n.left-(t.left||0),top:r.top-n.top-(t.top||0)}}const Ks=()=>({left:window.scrollX,top:window.scrollY});function R0(e){let t;if("el"in e){const n=e.el,r=typeof n=="string"&&n.startsWith("#"),o=typeof n=="string"?r?document.getElementById(n.slice(1)):document.querySelector(n):n;if(!o)return;t=M0(o,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(t.left!=null?t.left:window.scrollX,t.top!=null?t.top:window.scrollY)}function dc(e,t){return(history.state?history.state.position-t:-1)+e}const Gi=new Map;function N0(e,t){Gi.set(e,t)}function k0(e){const t=Gi.get(e);return Gi.delete(e),t}function F0(e){return typeof e=="string"||e&&typeof e=="object"}function zp(e){return typeof e=="string"||typeof e=="symbol"}let je=function(e){return e[e.MATCHER_NOT_FOUND=1]="MATCHER_NOT_FOUND",e[e.NAVIGATION_GUARD_REDIRECT=2]="NAVIGATION_GUARD_REDIRECT",e[e.NAVIGATION_ABORTED=4]="NAVIGATION_ABORTED",e[e.NAVIGATION_CANCELLED=8]="NAVIGATION_CANCELLED",e[e.NAVIGATION_DUPLICATED=16]="NAVIGATION_DUPLICATED",e}({});const Wp=Symbol("");je.MATCHER_NOT_FOUND+"",je.NAVIGATION_GUARD_REDIRECT+"",je.NAVIGATION_ABORTED+"",je.NAVIGATION_CANCELLED+"",je.NAVIGATION_DUPLICATED+"";function kr(e,t){return Ie(new Error,{type:e,[Wp]:!0},t)}function Zt(e,t){return e instanceof Error&&Wp in e&&(t==null||!!(e.type&t))}const L0=["params","query","hash"];function D0(e){if(typeof e=="string")return e;if(e.path!=null)return e.path;const t={};for(const n of L0)n in e&&(t[n]=e[n]);return JSON.stringify(t,null,2)}function B0(e){const t={};if(e===""||e==="?")return t;const n=(e[0]==="?"?e.slice(1):e).split("&");for(let r=0;r<n.length;++r){const o=n[r].replace(Bp," "),s=o.indexOf("="),i=Po(s<0?o:o.slice(0,s)),a=s<0?null:Po(o.slice(s+1));if(i in t){let l=t[i];Ft(l)||(l=t[i]=[l]),l.push(a)}else t[i]=a}return t}function mc(e){let t="";for(let n in e){const r=e[n];if(n=y0(n),r==null){r!==void 0&&(t+=(t.length?"&":"")+n);continue}(Ft(r)?r.map(o=>o&&Wi(o)):[r&&Wi(r)]).forEach(o=>{o!==void 0&&(t+=(t.length?"&":"")+n,o!=null&&(t+="="+o))})}return t}function $0(e){const t={};for(const n in e){const r=e[n];r!==void 0&&(t[n]=Ft(r)?r.map(o=>o==null?null:""+o):r==null?r:""+r)}return t}const j0=Symbol(""),hc=Symbol(""),qs=Symbol(""),ja=Symbol(""),Ki=Symbol("");function Xr(){let e=[];function t(r){return e.push(r),()=>{const o=e.indexOf(r);o>-1&&e.splice(o,1)}}function n(){e=[]}return{add:t,list:()=>e.slice(),reset:n}}function Tn(e,t,n,r,o,s=i=>i()){const i=r&&(r.enterCallbacks[o]=r.enterCallbacks[o]||[]);return()=>new Promise((a,l)=>{const c=p=>{p===!1?l(kr(je.NAVIGATION_ABORTED,{from:n,to:t})):p instanceof Error?l(p):F0(p)?l(kr(je.NAVIGATION_GUARD_REDIRECT,{from:t,to:p})):(i&&r.enterCallbacks[o]===i&&typeof p=="function"&&i.push(p),a())},u=s(()=>e.call(r&&r.instances[o],t,n,c));let f=Promise.resolve(u);e.length<3&&(f=f.then(c)),f.catch(p=>l(p))})}function gi(e,t,n,r,o=s=>s()){const s=[];for(const i of e)for(const a in i.components){let l=i.components[a];if(!(t!=="beforeRouteEnter"&&!i.instances[a]))if(Lp(l)){const c=(l.__vccOpts||l)[t];c&&s.push(Tn(c,n,r,i,a,o))}else{let c=l();s.push(()=>c.then(u=>{if(!u)throw new Error(`Couldn't resolve component "${a}" at "${i.path}"`);const f=l0(u)?u.default:u;i.mods[a]=u,i.components[a]=f;const p=(f.__vccOpts||f)[t];return p&&Tn(p,n,r,i,a,o)()}))}}return s}function H0(e,t){const n=[],r=[],o=[],s=Math.max(t.matched.length,e.matched.length);for(let i=0;i<s;i++){const a=t.matched[i];a&&(e.matched.find(c=>Nr(c,a))?r.push(a):n.push(a));const l=e.matched[i];l&&(t.matched.find(c=>Nr(c,l))||o.push(l))}return[n,r,o]}/*!
 * vue-router v4.6.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */let V0=()=>location.protocol+"//"+location.host;function Up(e,t){const{pathname:n,search:r,hash:o}=t,s=e.indexOf("#");if(s>-1){let i=o.includes(e.slice(s))?e.slice(s).length:1,a=o.slice(i);return a[0]!=="/"&&(a="/"+a),fc(a,"")}return fc(n,e)+r+o}function z0(e,t,n,r){let o=[],s=[],i=null;const a=({state:p})=>{const d=Up(e,location),m=n.value,g=t.value;let x=0;if(p){if(n.value=d,t.value=p,i&&i===m){i=null;return}x=g?p.position-g.position:0}else r(d);o.forEach(b=>{b(n.value,m,{delta:x,type:Ui.pop,direction:x?x>0?hi.forward:hi.back:hi.unknown})})};function l(){i=n.value}function c(p){o.push(p);const d=()=>{const m=o.indexOf(p);m>-1&&o.splice(m,1)};return s.push(d),d}function u(){if(document.visibilityState==="hidden"){const{history:p}=window;if(!p.state)return;p.replaceState(Ie({},p.state,{scroll:Ks()}),"")}}function f(){for(const p of s)p();s=[],window.removeEventListener("popstate",a),window.removeEventListener("pagehide",u),document.removeEventListener("visibilitychange",u)}return window.addEventListener("popstate",a),window.addEventListener("pagehide",u),document.addEventListener("visibilitychange",u),{pauseListeners:l,listen:c,destroy:f}}function gc(e,t,n,r=!1,o=!1){return{back:e,current:t,forward:n,replaced:r,position:window.history.length,scroll:o?Ks():null}}function W0(e){const{history:t,location:n}=window,r={value:Up(e,n)},o={value:t.state};o.value||s(r.value,{back:null,current:r.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0);function s(l,c,u){const f=e.indexOf("#"),p=f>-1?(n.host&&document.querySelector("base")?e:e.slice(f))+l:V0()+e+l;try{t[u?"replaceState":"pushState"](c,"",p),o.value=c}catch(d){console.error(d),n[u?"replace":"assign"](p)}}function i(l,c){s(l,Ie({},t.state,gc(o.value.back,l,o.value.forward,!0),c,{position:o.value.position}),!0),r.value=l}function a(l,c){const u=Ie({},o.value,t.state,{forward:l,scroll:Ks()});s(u.current,u,!0),s(l,Ie({},gc(r.value,l,null),{position:u.position+1},c),!1),r.value=l}return{location:r,state:o,push:a,replace:i}}function U0(e){e=A0(e);const t=W0(e),n=z0(e,t.state,t.location,t.replace);function r(s,i=!0){i||n.pauseListeners(),history.go(s)}const o=Ie({location:"",base:e,go:r,createHref:O0.bind(null,e)},t,n);return Object.defineProperty(o,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(o,"state",{enumerable:!0,get:()=>t.state.value}),o}function G0(e){return e=location.host?e||location.pathname+location.search:"",e.includes("#")||(e+="#"),U0(e)}let Jn=function(e){return e[e.Static=0]="Static",e[e.Param=1]="Param",e[e.Group=2]="Group",e}({});var Ge=function(e){return e[e.Static=0]="Static",e[e.Param=1]="Param",e[e.ParamRegExp=2]="ParamRegExp",e[e.ParamRegExpEnd=3]="ParamRegExpEnd",e[e.EscapeNext=4]="EscapeNext",e}(Ge||{});const K0={type:Jn.Static,value:""},q0=/[a-zA-Z0-9_]/;function J0(e){if(!e)return[[]];if(e==="/")return[[K0]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(d){throw new Error(`ERR (${n})/"${c}": ${d}`)}let n=Ge.Static,r=n;const o=[];let s;function i(){s&&o.push(s),s=[]}let a=0,l,c="",u="";function f(){c&&(n===Ge.Static?s.push({type:Jn.Static,value:c}):n===Ge.Param||n===Ge.ParamRegExp||n===Ge.ParamRegExpEnd?(s.length>1&&(l==="*"||l==="+")&&t(`A repeatable param (${c}) must be alone in its segment. eg: '/:ids+.`),s.push({type:Jn.Param,value:c,regexp:u,repeatable:l==="*"||l==="+",optional:l==="*"||l==="?"})):t("Invalid state to consume buffer"),c="")}function p(){c+=l}for(;a<e.length;){if(l=e[a++],l==="\\"&&n!==Ge.ParamRegExp){r=n,n=Ge.EscapeNext;continue}switch(n){case Ge.Static:l==="/"?(c&&f(),i()):l===":"?(f(),n=Ge.Param):p();break;case Ge.EscapeNext:p(),n=r;break;case Ge.Param:l==="("?n=Ge.ParamRegExp:q0.test(l)?p():(f(),n=Ge.Static,l!=="*"&&l!=="?"&&l!=="+"&&a--);break;case Ge.ParamRegExp:l===")"?u[u.length-1]=="\\"?u=u.slice(0,-1)+l:n=Ge.ParamRegExpEnd:u+=l;break;case Ge.ParamRegExpEnd:f(),n=Ge.Static,l!=="*"&&l!=="?"&&l!=="+"&&a--,u="";break;default:t("Unknown state");break}}return n===Ge.ParamRegExp&&t(`Unfinished custom RegExp for param "${c}"`),f(),i(),o}const _c="[^/]+?",Y0={sensitive:!1,strict:!1,start:!0,end:!0};var ct=function(e){return e[e._multiplier=10]="_multiplier",e[e.Root=90]="Root",e[e.Segment=40]="Segment",e[e.SubSegment=30]="SubSegment",e[e.Static=40]="Static",e[e.Dynamic=20]="Dynamic",e[e.BonusCustomRegExp=10]="BonusCustomRegExp",e[e.BonusWildcard=-50]="BonusWildcard",e[e.BonusRepeatable=-20]="BonusRepeatable",e[e.BonusOptional=-8]="BonusOptional",e[e.BonusStrict=.7000000000000001]="BonusStrict",e[e.BonusCaseSensitive=.25]="BonusCaseSensitive",e}(ct||{});const Q0=/[.+*?^${}()[\]/\\]/g;function X0(e,t){const n=Ie({},Y0,t),r=[];let o=n.start?"^":"";const s=[];for(const c of e){const u=c.length?[]:[ct.Root];n.strict&&!c.length&&(o+="/");for(let f=0;f<c.length;f++){const p=c[f];let d=ct.Segment+(n.sensitive?ct.BonusCaseSensitive:0);if(p.type===Jn.Static)f||(o+="/"),o+=p.value.replace(Q0,"\\$&"),d+=ct.Static;else if(p.type===Jn.Param){const{value:m,repeatable:g,optional:x,regexp:b}=p;s.push({name:m,repeatable:g,optional:x});const C=b||_c;if(C!==_c){d+=ct.BonusCustomRegExp;try{`${C}`}catch(P){throw new Error(`Invalid custom RegExp for param "${m}" (${C}): `+P.message)}}let v=g?`((?:${C})(?:/(?:${C}))*)`:`(${C})`;f||(v=x&&c.length<2?`(?:/${v})`:"/"+v),x&&(v+="?"),o+=v,d+=ct.Dynamic,x&&(d+=ct.BonusOptional),g&&(d+=ct.BonusRepeatable),C===".*"&&(d+=ct.BonusWildcard)}u.push(d)}r.push(u)}if(n.strict&&n.end){const c=r.length-1;r[c][r[c].length-1]+=ct.BonusStrict}n.strict||(o+="/?"),n.end?o+="$":n.strict&&!o.endsWith("/")&&(o+="(?:/|$)");const i=new RegExp(o,n.sensitive?"":"i");function a(c){const u=c.match(i),f={};if(!u)return null;for(let p=1;p<u.length;p++){const d=u[p]||"",m=s[p-1];f[m.name]=d&&m.repeatable?d.split("/"):d}return f}function l(c){let u="",f=!1;for(const p of e){(!f||!u.endsWith("/"))&&(u+="/"),f=!1;for(const d of p)if(d.type===Jn.Static)u+=d.value;else if(d.type===Jn.Param){const{value:m,repeatable:g,optional:x}=d,b=m in c?c[m]:"";if(Ft(b)&&!g)throw new Error(`Provided param "${m}" is an array but it is not repeatable (* or + modifiers)`);const C=Ft(b)?b.join("/"):b;if(!C)if(x)p.length<2&&(u.endsWith("/")?u=u.slice(0,-1):f=!0);else throw new Error(`Missing required param "${m}"`);u+=C}}return u||"/"}return{re:i,score:r,keys:s,parse:a,stringify:l}}function Z0(e,t){let n=0;for(;n<e.length&&n<t.length;){const r=t[n]-e[n];if(r)return r;n++}return e.length<t.length?e.length===1&&e[0]===ct.Static+ct.Segment?-1:1:e.length>t.length?t.length===1&&t[0]===ct.Static+ct.Segment?1:-1:0}function Gp(e,t){let n=0;const r=e.score,o=t.score;for(;n<r.length&&n<o.length;){const s=Z0(r[n],o[n]);if(s)return s;n++}if(Math.abs(o.length-r.length)===1){if(vc(r))return 1;if(vc(o))return-1}return o.length-r.length}function vc(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const e_={strict:!1,end:!0,sensitive:!1};function t_(e,t,n){const r=X0(J0(e.path),n),o=Ie(r,{record:e,parent:t,children:[],alias:[]});return t&&!o.record.aliasOf==!t.record.aliasOf&&t.children.push(o),o}function n_(e,t){const n=[],r=new Map;t=uc(e_,t);function o(f){return r.get(f)}function s(f,p,d){const m=!d,g=bc(f);g.aliasOf=d&&d.record;const x=uc(t,f),b=[g];if("alias"in f){const P=typeof f.alias=="string"?[f.alias]:f.alias;for(const R of P)b.push(bc(Ie({},g,{components:d?d.record.components:g.components,path:R,aliasOf:d?d.record:g})))}let C,v;for(const P of b){const{path:R}=P;if(p&&R[0]!=="/"){const $=p.record.path,B=$[$.length-1]==="/"?"":"/";P.path=p.record.path+(R&&B+R)}if(C=t_(P,p,x),d?d.alias.push(C):(v=v||C,v!==C&&v.alias.push(C),m&&f.name&&!wc(C)&&i(f.name)),Kp(C)&&l(C),g.children){const $=g.children;for(let B=0;B<$.length;B++)s($[B],C,d&&d.children[B])}d=d||C}return v?()=>{i(v)}:po}function i(f){if(zp(f)){const p=r.get(f);p&&(r.delete(f),n.splice(n.indexOf(p),1),p.children.forEach(i),p.alias.forEach(i))}else{const p=n.indexOf(f);p>-1&&(n.splice(p,1),f.record.name&&r.delete(f.record.name),f.children.forEach(i),f.alias.forEach(i))}}function a(){return n}function l(f){const p=s_(f,n);n.splice(p,0,f),f.record.name&&!wc(f)&&r.set(f.record.name,f)}function c(f,p){let d,m={},g,x;if("name"in f&&f.name){if(d=r.get(f.name),!d)throw kr(je.MATCHER_NOT_FOUND,{location:f});x=d.record.name,m=Ie(yc(p.params,d.keys.filter(v=>!v.optional).concat(d.parent?d.parent.keys.filter(v=>v.optional):[]).map(v=>v.name)),f.params&&yc(f.params,d.keys.map(v=>v.name))),g=d.stringify(m)}else if(f.path!=null)g=f.path,d=n.find(v=>v.re.test(g)),d&&(m=d.parse(g),x=d.record.name);else{if(d=p.name?r.get(p.name):n.find(v=>v.re.test(p.path)),!d)throw kr(je.MATCHER_NOT_FOUND,{location:f,currentLocation:p});x=d.record.name,m=Ie({},p.params,f.params),g=d.stringify(m)}const b=[];let C=d;for(;C;)b.unshift(C.record),C=C.parent;return{name:x,path:g,params:m,matched:b,meta:o_(b)}}e.forEach(f=>s(f));function u(){n.length=0,r.clear()}return{addRoute:s,resolve:c,removeRoute:i,clearRoutes:u,getRoutes:a,getRecordMatcher:o}}function yc(e,t){const n={};for(const r of t)r in e&&(n[r]=e[r]);return n}function bc(e){const t={path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:e.aliasOf,beforeEnter:e.beforeEnter,props:r_(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}};return Object.defineProperty(t,"mods",{value:{}}),t}function r_(e){const t={},n=e.props||!1;if("component"in e)t.default=n;else for(const r in e.components)t[r]=typeof n=="object"?n[r]:n;return t}function wc(e){for(;e;){if(e.record.aliasOf)return!0;e=e.parent}return!1}function o_(e){return e.reduce((t,n)=>Ie(t,n.meta),{})}function s_(e,t){let n=0,r=t.length;for(;n!==r;){const s=n+r>>1;Gp(e,t[s])<0?r=s:n=s+1}const o=i_(e);return o&&(r=t.lastIndexOf(o,r-1)),r}function i_(e){let t=e;for(;t=t.parent;)if(Kp(t)&&Gp(e,t)===0)return t}function Kp({record:e}){return!!(e.name||e.components&&Object.keys(e.components).length||e.redirect)}function xc(e){const t=Te(qs),n=Te(ja),r=k(()=>{const l=w(e.to);return t.resolve(l)}),o=k(()=>{const{matched:l}=r.value,{length:c}=l,u=l[c-1],f=n.matched;if(!u||!f.length)return-1;const p=f.findIndex(Nr.bind(null,u));if(p>-1)return p;const d=Sc(l[c-2]);return c>1&&Sc(u)===d&&f[f.length-1].path!==d?f.findIndex(Nr.bind(null,l[c-2])):p}),s=k(()=>o.value>-1&&f_(n.params,r.value.params)),i=k(()=>o.value>-1&&o.value===n.matched.length-1&&Vp(n.params,r.value.params));function a(l={}){if(u_(l)){const c=t[w(e.replace)?"replace":"push"](w(e.to)).catch(po);return e.viewTransition&&typeof document<"u"&&"startViewTransition"in document&&document.startViewTransition(()=>c),c}return Promise.resolve()}return{route:r,href:k(()=>r.value.href),isActive:s,isExactActive:i,navigate:a}}function a_(e){return e.length===1?e[0]:e}const l_=q({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"},viewTransition:Boolean},useLink:xc,setup(e,{slots:t}){const n=Bn(xc(e)),{options:r}=Te(qs),o=k(()=>({[Ec(e.activeClass,r.linkActiveClass,"router-link-active")]:n.isActive,[Ec(e.exactActiveClass,r.linkExactActiveClass,"router-link-exact-active")]:n.isExactActive}));return()=>{const s=t.default&&a_(t.default(n));return e.custom?s:ze("a",{"aria-current":n.isExactActive?e.ariaCurrentValue:null,href:n.href,onClick:n.navigate,class:o.value},s)}}}),c_=l_;function u_(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&!(e.button!==void 0&&e.button!==0)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function f_(e,t){for(const n in t){const r=t[n],o=e[n];if(typeof r=="string"){if(r!==o)return!1}else if(!Ft(o)||o.length!==r.length||r.some((s,i)=>s!==o[i]))return!1}return!0}function Sc(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const Ec=(e,t,n)=>e??t??n,p_=q({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:n}){const r=Te(Ki),o=k(()=>e.route||r.value),s=Te(hc,0),i=k(()=>{let c=w(s);const{matched:u}=o.value;let f;for(;(f=u[c])&&!f.components;)c++;return c}),a=k(()=>o.value.matched[i.value]);gt(hc,k(()=>i.value+1)),gt(j0,a),gt(Ki,o);const l=L();return ye(()=>[l.value,a.value,e.name],([c,u,f],[p,d,m])=>{u&&(u.instances[f]=c,d&&d!==u&&c&&c===p&&(u.leaveGuards.size||(u.leaveGuards=d.leaveGuards),u.updateGuards.size||(u.updateGuards=d.updateGuards))),c&&u&&(!d||!Nr(u,d)||!p)&&(u.enterCallbacks[f]||[]).forEach(g=>g(c))},{flush:"post"}),()=>{const c=o.value,u=e.name,f=a.value,p=f&&f.components[u];if(!p)return Pc(n.default,{Component:p,route:c});const d=f.props[u],m=d?d===!0?c.params:typeof d=="function"?d(c):d:null,x=ze(p,Ie({},m,t,{onVnodeUnmounted:b=>{b.component.isUnmounted&&(f.instances[u]=null)},ref:l}));return Pc(n.default,{Component:x,route:c})||x}}});function Pc(e,t){if(!e)return null;const n=e(t);return n.length===1?n[0]:n}const d_=p_;function m_(e){const t=n_(e.routes,e),n=e.parseQuery||B0,r=e.stringifyQuery||mc,o=e.history,s=Xr(),i=Xr(),a=Xr(),l=Ta(bn);let c=bn;vr&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const u=di.bind(null,N=>""+N),f=di.bind(null,w0),p=di.bind(null,Po);function d(N,te){let Z,le;return zp(N)?(Z=t.getRecordMatcher(N),le=te):le=N,t.addRoute(le,Z)}function m(N){const te=t.getRecordMatcher(N);te&&t.removeRoute(te)}function g(){return t.getRoutes().map(N=>N.record)}function x(N){return!!t.getRecordMatcher(N)}function b(N,te){if(te=Ie({},te||l.value),typeof N=="string"){const E=mi(n,N,te.path),D=t.resolve({path:E.path},te),j=o.createHref(E.fullPath);return Ie(E,D,{params:p(D.params),hash:Po(E.hash),redirectedFrom:void 0,href:j})}let Z;if(N.path!=null)Z=Ie({},N,{path:mi(n,N.path,te.path).path});else{const E=Ie({},N.params);for(const D in E)E[D]==null&&delete E[D];Z=Ie({},N,{params:f(E)}),te.params=f(te.params)}const le=t.resolve(Z,te),W=N.hash||"";le.params=u(p(le.params));const h=E0(r,Ie({},N,{hash:v0(W),path:le.path})),_=o.createHref(h);return Ie({fullPath:h,hash:W,query:r===mc?$0(N.query):N.query||{}},le,{redirectedFrom:void 0,href:_})}function C(N){return typeof N=="string"?mi(n,N,l.value.path):Ie({},N)}function v(N,te){if(c!==N)return kr(je.NAVIGATION_CANCELLED,{from:te,to:N})}function P(N){return B(N)}function R(N){return P(Ie(C(N),{replace:!0}))}function $(N,te){const Z=N.matched[N.matched.length-1];if(Z&&Z.redirect){const{redirect:le}=Z;let W=typeof le=="function"?le(N,te):le;return typeof W=="string"&&(W=W.includes("?")||W.includes("#")?W=C(W):{path:W},W.params={}),Ie({query:N.query,hash:N.hash,params:W.path!=null?{}:N.params},W)}}function B(N,te){const Z=c=b(N),le=l.value,W=N.state,h=N.force,_=N.replace===!0,E=$(Z,le);if(E)return B(Ie(C(E),{state:typeof E=="object"?Ie({},W,E.state):W,force:h,replace:_}),te||Z);const D=Z;D.redirectedFrom=te;let j;return!h&&P0(r,le,Z)&&(j=kr(je.NAVIGATION_DUPLICATED,{to:D,from:le}),he(le,le,!0,!1)),(j?Promise.resolve(j):M(D,le)).catch(F=>Zt(F)?Zt(F,je.NAVIGATION_GUARD_REDIRECT)?F:se(F):S(F,D,le)).then(F=>{if(F){if(Zt(F,je.NAVIGATION_GUARD_REDIRECT))return B(Ie({replace:_},C(F.to),{state:typeof F.to=="object"?Ie({},W,F.to.state):W,force:h}),te||D)}else F=A(D,le,!0,_,W);return U(D,le,F),F})}function T(N,te){const Z=v(N,te);return Z?Promise.reject(Z):Promise.resolve()}function y(N){const te=_e.values().next().value;return te&&typeof te.runWithContext=="function"?te.runWithContext(N):N()}function M(N,te){let Z;const[le,W,h]=H0(N,te);Z=gi(le.reverse(),"beforeRouteLeave",N,te);for(const E of le)E.leaveGuards.forEach(D=>{Z.push(Tn(D,N,te))});const _=T.bind(null,N,te);return Z.push(_),ke(Z).then(()=>{Z=[];for(const E of s.list())Z.push(Tn(E,N,te));return Z.push(_),ke(Z)}).then(()=>{Z=gi(W,"beforeRouteUpdate",N,te);for(const E of W)E.updateGuards.forEach(D=>{Z.push(Tn(D,N,te))});return Z.push(_),ke(Z)}).then(()=>{Z=[];for(const E of h)if(E.beforeEnter)if(Ft(E.beforeEnter))for(const D of E.beforeEnter)Z.push(Tn(D,N,te));else Z.push(Tn(E.beforeEnter,N,te));return Z.push(_),ke(Z)}).then(()=>(N.matched.forEach(E=>E.enterCallbacks={}),Z=gi(h,"beforeRouteEnter",N,te,y),Z.push(_),ke(Z))).then(()=>{Z=[];for(const E of i.list())Z.push(Tn(E,N,te));return Z.push(_),ke(Z)}).catch(E=>Zt(E,je.NAVIGATION_CANCELLED)?E:Promise.reject(E))}function U(N,te,Z){a.list().forEach(le=>y(()=>le(N,te,Z)))}function A(N,te,Z,le,W){const h=v(N,te);if(h)return h;const _=te===bn,E=vr?history.state:{};Z&&(le||_?o.replace(N.fullPath,Ie({scroll:_&&E&&E.scroll},W)):o.push(N.fullPath,W)),l.value=N,he(N,te,Z,_),se()}let I;function z(){I||(I=o.listen((N,te,Z)=>{if(!Ae.listening)return;const le=b(N),W=$(le,Ae.currentRoute.value);if(W){B(Ie(W,{replace:!0,force:!0}),le).catch(po);return}c=le;const h=l.value;vr&&N0(dc(h.fullPath,Z.delta),Ks()),M(le,h).catch(_=>Zt(_,je.NAVIGATION_ABORTED|je.NAVIGATION_CANCELLED)?_:Zt(_,je.NAVIGATION_GUARD_REDIRECT)?(B(Ie(C(_.to),{force:!0}),le).then(E=>{Zt(E,je.NAVIGATION_ABORTED|je.NAVIGATION_DUPLICATED)&&!Z.delta&&Z.type===Ui.pop&&o.go(-1,!1)}).catch(po),Promise.reject()):(Z.delta&&o.go(-Z.delta,!1),S(_,le,h))).then(_=>{_=_||A(le,h,!1),_&&(Z.delta&&!Zt(_,je.NAVIGATION_CANCELLED)?o.go(-Z.delta,!1):Z.type===Ui.pop&&Zt(_,je.NAVIGATION_ABORTED|je.NAVIGATION_DUPLICATED)&&o.go(-1,!1)),U(le,h,_)}).catch(po)}))}let X=Xr(),G=Xr(),O;function S(N,te,Z){se(N);const le=G.list();return le.length?le.forEach(W=>W(N,te,Z)):console.error(N),Promise.reject(N)}function V(){return O&&l.value!==bn?Promise.resolve():new Promise((N,te)=>{X.add([N,te])})}function se(N){return O||(O=!N,z(),X.list().forEach(([te,Z])=>N?Z(N):te()),X.reset()),N}function he(N,te,Z,le){const{scrollBehavior:W}=e;if(!vr||!W)return Promise.resolve();const h=!Z&&k0(dc(N.fullPath,0))||(le||!Z)&&history.state&&history.state.scroll||null;return Kt().then(()=>W(N,te,h)).then(_=>_&&R0(_)).catch(_=>S(_,N,te))}const re=N=>o.go(N);let ge;const _e=new Set,Ae={currentRoute:l,listening:!0,addRoute:d,removeRoute:m,clearRoutes:t.clearRoutes,hasRoute:x,getRoutes:g,resolve:b,options:e,push:P,replace:R,go:re,back:()=>re(-1),forward:()=>re(1),beforeEach:s.add,beforeResolve:i.add,afterEach:a.add,onError:G.add,isReady:V,install(N){N.component("RouterLink",c_),N.component("RouterView",d_),N.config.globalProperties.$router=Ae,Object.defineProperty(N.config.globalProperties,"$route",{enumerable:!0,get:()=>w(l)}),vr&&!ge&&l.value===bn&&(ge=!0,P(o.location).catch(le=>{}));const te={};for(const le in bn)Object.defineProperty(te,le,{get:()=>l.value[le],enumerable:!0});N.provide(qs,Ae),N.provide(ja,$s(te)),N.provide(Ki,l);const Z=N.unmount;_e.add(N),N.unmount=function(){_e.delete(N),_e.size<1&&(c=bn,I&&I(),I=null,l.value=bn,ge=!1,O=!1),Z()}}};function ke(N){return N.reduce((te,Z)=>te.then(()=>y(Z)),Promise.resolve())}return Ae}function dE(){return Te(qs)}function qp(e){return Te(ja)}const h_=[{path:"/",name:"Dashboard",component:()=>it(()=>import("./DashboardView-BCXfl_RW.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]),import.meta.url)},{path:"/items",name:"Items",component:()=>it(()=>import("./ItemsView-C3BCcW_J.js"),__vite__mapDeps([10,11,2,3,1,4,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30]),import.meta.url)},{path:"/bag",name:"Bag",component:()=>it(()=>import("./BagView-k32kIZEO.js"),__vite__mapDeps([31,13,14,32,15,2,3,16,33,34,35,26,12,1,4,17,25,27,36,37,38,5,6,39,40,41,42,43,44,45]),import.meta.url)},{path:"/map",name:"Map",component:()=>it(()=>import("./MapView-R3pU-tjf.js"),__vite__mapDeps([46,2,3,15,16,5,6,25,26,27,1,4,12,13,14,17,11,18,19,20,21,22,28,29,23,24,47]),import.meta.url)},{path:"/combat",name:"Combat",component:()=>it(()=>import("./CombatView-C9_30uCZ.js"),__vite__mapDeps([48,49,15,2,3,16,26,50,41,42,43,5,6,39,40,1,4,23,24,51,45]),import.meta.url)},{path:"/story",name:"Story",component:()=>it(()=>import("./StoryView-DSkc-AFf.js"),__vite__mapDeps([52,1,2,3,4,12,13,14,15,16,17,5,6,37,38,42,43,23,24,18,19,20,21,53]),import.meta.url)},{path:"/shop",name:"Shop",component:()=>it(()=>import("./ShopView-Dc8FS4O3.js"),__vite__mapDeps([54,39,40,15,2,3,16,1,4,5,6,25,26,27,11,12,13,14,17,18,19,20,21,22,8,55]),import.meta.url)},{path:"/craft-planner",name:"CraftPlanner",component:()=>it(()=>import("./CraftPlannerView-DOg7pyWl.js"),__vite__mapDeps([56,19,13,14,20,35,26,15,2,3,16,12,1,4,17,33,25,27,36,49,50,42,43,37,38,5,6,41,39,40,7,57]),import.meta.url)},{path:"/settings",name:"Settings",component:()=>it(()=>import("./SettingsView-nvdkm4FY.js"),__vite__mapDeps([58,13,14,32,15,2,3,16,33,34,42,43,1,4,49,26,50,5,6,41,59,60,23,24,18,19,20,21,61,45]),import.meta.url)},{path:"/help",name:"Help",component:()=>it(()=>import("./Help-md8tQ1Ti.js"),__vite__mapDeps([62,63]),import.meta.url)},{path:"/overlay",name:"Overlay",component:()=>it(()=>import("./OverlayView-BZ9yHIPt.js"),__vite__mapDeps([64,59,2,3,60,65]),import.meta.url),meta:{noLayout:!0}},{path:"/debug-overlay",name:"DebugOverlay",component:()=>it(()=>import("./DebugOverlay-BSvXRNuO.js"),__vite__mapDeps([66,67]),import.meta.url),meta:{noLayout:!0}},{path:"/story-overlay",name:"StoryOverlay",component:()=>it(()=>import("./StoryOverlayView-DaXfAXUm.js"),__vite__mapDeps([68,69]),import.meta.url),meta:{noLayout:!0}},{path:"/bag-stash-overlay",name:"BagStashOverlay",component:()=>it(()=>import("./BagStashOverlayView-DGcBCDAw.js"),__vite__mapDeps([70,71]),import.meta.url),meta:{noLayout:!0}},{path:"/coordinate-picker",name:"CoordinatePicker",component:()=>it(()=>import("./CoordinatePickerView-bEa7NZUc.js"),__vite__mapDeps([72,73]),import.meta.url),meta:{noLayout:!0}}],g_=m_({history:G0(),routes:h_}),Jp=Symbol(),ls="el",__="is-",Wn=(e,t,n,r,o)=>{let s=`${e}-${t}`;return n&&(s+=`-${n}`),r&&(s+=`__${r}`),o&&(s+=`--${o}`),s},Yp=Symbol("namespaceContextKey"),Ha=e=>{const t=e||(Qe()?Te(Yp,L(ls)):L(ls));return k(()=>w(t)||ls)},Be=(e,t)=>{const n=Ha(t);return{namespace:n,b:(g="")=>Wn(n.value,e,g,"",""),e:g=>g?Wn(n.value,e,"",g,""):"",m:g=>g?Wn(n.value,e,"","",g):"",be:(g,x)=>g&&x?Wn(n.value,e,g,x,""):"",em:(g,x)=>g&&x?Wn(n.value,e,"",g,x):"",bm:(g,x)=>g&&x?Wn(n.value,e,g,"",x):"",bem:(g,x,b)=>g&&x&&b?Wn(n.value,e,g,x,b):"",is:(g,...x)=>{const b=x.length>=1?x[0]:!0;return g&&b?`${__}${g}`:""},cssVar:g=>{const x={};for(const b in g)g[b]&&(x[`--${n.value}-${b}`]=g[b]);return x},cssVarName:g=>`--${n.value}-${g}`,cssVarBlock:g=>{const x={};for(const b in g)g[b]&&(x[`--${n.value}-${e}-${b}`]=g[b]);return x},cssVarBlockName:g=>`--${n.value}-${e}-${g}`}};var Qp=typeof global=="object"&&global&&global.Object===Object&&global,v_=typeof self=="object"&&self&&self.Object===Object&&self,hn=Qp||v_||Function("return this")(),qt=hn.Symbol,Xp=Object.prototype,y_=Xp.hasOwnProperty,b_=Xp.toString,Zr=qt?qt.toStringTag:void 0;function w_(e){var t=y_.call(e,Zr),n=e[Zr];try{e[Zr]=void 0;var r=!0}catch{}var o=b_.call(e);return r&&(t?e[Zr]=n:delete e[Zr]),o}var x_=Object.prototype,S_=x_.toString;function E_(e){return S_.call(e)}var P_="[object Null]",C_="[object Undefined]",Cc=qt?qt.toStringTag:void 0;function Ur(e){return e==null?e===void 0?C_:P_:Cc&&Cc in Object(e)?w_(e):E_(e)}function Fr(e){return e!=null&&typeof e=="object"}var T_="[object Symbol]";function Va(e){return typeof e=="symbol"||Fr(e)&&Ur(e)==T_}function A_(e,t){for(var n=-1,r=e==null?0:e.length,o=Array(r);++n<r;)o[n]=t(e[n],n,e);return o}var pn=Array.isArray,Tc=qt?qt.prototype:void 0,Ac=Tc?Tc.toString:void 0;function Zp(e){if(typeof e=="string")return e;if(pn(e))return A_(e,Zp)+"";if(Va(e))return Ac?Ac.call(e):"";var t=e+"";return t=="0"&&1/e==-1/0?"-0":t}function xs(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}function I_(e){return e}var O_="[object AsyncFunction]",M_="[object Function]",R_="[object GeneratorFunction]",N_="[object Proxy]";function ed(e){if(!xs(e))return!1;var t=Ur(e);return t==M_||t==R_||t==O_||t==N_}var _i=hn["__core-js_shared__"],Ic=function(){var e=/[^.]+$/.exec(_i&&_i.keys&&_i.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();function k_(e){return!!Ic&&Ic in e}var F_=Function.prototype,L_=F_.toString;function cr(e){if(e!=null){try{return L_.call(e)}catch{}try{return e+""}catch{}}return""}var D_=/[\\^$.*+?()[\]{}|]/g,B_=/^\[object .+?Constructor\]$/,$_=Function.prototype,j_=Object.prototype,H_=$_.toString,V_=j_.hasOwnProperty,z_=RegExp("^"+H_.call(V_).replace(D_,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function W_(e){if(!xs(e)||k_(e))return!1;var t=ed(e)?z_:B_;return t.test(cr(e))}function U_(e,t){return e==null?void 0:e[t]}function ur(e,t){var n=U_(e,t);return W_(n)?n:void 0}var qi=ur(hn,"WeakMap");function G_(e,t,n){switch(n.length){case 0:return e.call(t);case 1:return e.call(t,n[0]);case 2:return e.call(t,n[0],n[1]);case 3:return e.call(t,n[0],n[1],n[2])}return e.apply(t,n)}var K_=800,q_=16,J_=Date.now;function Y_(e){var t=0,n=0;return function(){var r=J_(),o=q_-(r-n);if(n=r,o>0){if(++t>=K_)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}function Q_(e){return function(){return e}}var Ss=function(){try{var e=ur(Object,"defineProperty");return e({},"",{}),e}catch{}}(),X_=Ss?function(e,t){return Ss(e,"toString",{configurable:!0,enumerable:!1,value:Q_(t),writable:!0})}:I_,Z_=Y_(X_),ev=9007199254740991,tv=/^(?:0|[1-9]\d*)$/;function za(e,t){var n=typeof e;return t=t??ev,!!t&&(n=="number"||n!="symbol"&&tv.test(e))&&e>-1&&e%1==0&&e<t}function nv(e,t,n){t=="__proto__"&&Ss?Ss(e,t,{configurable:!0,enumerable:!0,value:n,writable:!0}):e[t]=n}function Wa(e,t){return e===t||e!==e&&t!==t}var rv=Object.prototype,ov=rv.hasOwnProperty;function sv(e,t,n){var r=e[t];(!(ov.call(e,t)&&Wa(r,n))||n===void 0&&!(t in e))&&nv(e,t,n)}var Oc=Math.max;function iv(e,t,n){return t=Oc(t===void 0?e.length-1:t,0),function(){for(var r=arguments,o=-1,s=Oc(r.length-t,0),i=Array(s);++o<s;)i[o]=r[t+o];o=-1;for(var a=Array(t+1);++o<t;)a[o]=r[o];return a[t]=n(i),G_(e,this,a)}}var av=9007199254740991;function Ua(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=av}function lv(e){return e!=null&&Ua(e.length)&&!ed(e)}var cv=Object.prototype;function uv(e){var t=e&&e.constructor,n=typeof t=="function"&&t.prototype||cv;return e===n}function fv(e,t){for(var n=-1,r=Array(e);++n<e;)r[n]=t(n);return r}var pv="[object Arguments]";function Mc(e){return Fr(e)&&Ur(e)==pv}var td=Object.prototype,dv=td.hasOwnProperty,mv=td.propertyIsEnumerable,Ga=Mc(function(){return arguments}())?Mc:function(e){return Fr(e)&&dv.call(e,"callee")&&!mv.call(e,"callee")};function hv(){return!1}var nd=typeof exports=="object"&&exports&&!exports.nodeType&&exports,Rc=nd&&typeof module=="object"&&module&&!module.nodeType&&module,gv=Rc&&Rc.exports===nd,Nc=gv?hn.Buffer:void 0,_v=Nc?Nc.isBuffer:void 0,Ji=_v||hv,vv="[object Arguments]",yv="[object Array]",bv="[object Boolean]",wv="[object Date]",xv="[object Error]",Sv="[object Function]",Ev="[object Map]",Pv="[object Number]",Cv="[object Object]",Tv="[object RegExp]",Av="[object Set]",Iv="[object String]",Ov="[object WeakMap]",Mv="[object ArrayBuffer]",Rv="[object DataView]",Nv="[object Float32Array]",kv="[object Float64Array]",Fv="[object Int8Array]",Lv="[object Int16Array]",Dv="[object Int32Array]",Bv="[object Uint8Array]",$v="[object Uint8ClampedArray]",jv="[object Uint16Array]",Hv="[object Uint32Array]",Le={};Le[Nv]=Le[kv]=Le[Fv]=Le[Lv]=Le[Dv]=Le[Bv]=Le[$v]=Le[jv]=Le[Hv]=!0;Le[vv]=Le[yv]=Le[Mv]=Le[bv]=Le[Rv]=Le[wv]=Le[xv]=Le[Sv]=Le[Ev]=Le[Pv]=Le[Cv]=Le[Tv]=Le[Av]=Le[Iv]=Le[Ov]=!1;function Vv(e){return Fr(e)&&Ua(e.length)&&!!Le[Ur(e)]}function zv(e){return function(t){return e(t)}}var rd=typeof exports=="object"&&exports&&!exports.nodeType&&exports,mo=rd&&typeof module=="object"&&module&&!module.nodeType&&module,Wv=mo&&mo.exports===rd,vi=Wv&&Qp.process,kc=function(){try{var e=mo&&mo.require&&mo.require("util").types;return e||vi&&vi.binding&&vi.binding("util")}catch{}}(),Fc=kc&&kc.isTypedArray,od=Fc?zv(Fc):Vv,Uv=Object.prototype,Gv=Uv.hasOwnProperty;function Kv(e,t){var n=pn(e),r=!n&&Ga(e),o=!n&&!r&&Ji(e),s=!n&&!r&&!o&&od(e),i=n||r||o||s,a=i?fv(e.length,String):[],l=a.length;for(var c in e)(t||Gv.call(e,c))&&!(i&&(c=="length"||o&&(c=="offset"||c=="parent")||s&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||za(c,l)))&&a.push(c);return a}function qv(e,t){return function(n){return e(t(n))}}var Jv=qv(Object.keys,Object),Yv=Object.prototype,Qv=Yv.hasOwnProperty;function Xv(e){if(!uv(e))return Jv(e);var t=[];for(var n in Object(e))Qv.call(e,n)&&n!="constructor"&&t.push(n);return t}function Zv(e){return lv(e)?Kv(e):Xv(e)}var ey=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,ty=/^\w*$/;function ny(e,t){if(pn(e))return!1;var n=typeof e;return n=="number"||n=="symbol"||n=="boolean"||e==null||Va(e)?!0:ty.test(e)||!ey.test(e)||t!=null&&e in Object(t)}var Co=ur(Object,"create");function ry(){this.__data__=Co?Co(null):{},this.size=0}function oy(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}var sy="__lodash_hash_undefined__",iy=Object.prototype,ay=iy.hasOwnProperty;function ly(e){var t=this.__data__;if(Co){var n=t[e];return n===sy?void 0:n}return ay.call(t,e)?t[e]:void 0}var cy=Object.prototype,uy=cy.hasOwnProperty;function fy(e){var t=this.__data__;return Co?t[e]!==void 0:uy.call(t,e)}var py="__lodash_hash_undefined__";function dy(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=Co&&t===void 0?py:t,this}function sr(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}sr.prototype.clear=ry;sr.prototype.delete=oy;sr.prototype.get=ly;sr.prototype.has=fy;sr.prototype.set=dy;function my(){this.__data__=[],this.size=0}function Js(e,t){for(var n=e.length;n--;)if(Wa(e[n][0],t))return n;return-1}var hy=Array.prototype,gy=hy.splice;function _y(e){var t=this.__data__,n=Js(t,e);if(n<0)return!1;var r=t.length-1;return n==r?t.pop():gy.call(t,n,1),--this.size,!0}function vy(e){var t=this.__data__,n=Js(t,e);return n<0?void 0:t[n][1]}function yy(e){return Js(this.__data__,e)>-1}function by(e,t){var n=this.__data__,r=Js(n,e);return r<0?(++this.size,n.push([e,t])):n[r][1]=t,this}function gn(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}gn.prototype.clear=my;gn.prototype.delete=_y;gn.prototype.get=vy;gn.prototype.has=yy;gn.prototype.set=by;var To=ur(hn,"Map");function wy(){this.size=0,this.__data__={hash:new sr,map:new(To||gn),string:new sr}}function xy(e){var t=typeof e;return t=="string"||t=="number"||t=="symbol"||t=="boolean"?e!=="__proto__":e===null}function Ys(e,t){var n=e.__data__;return xy(t)?n[typeof t=="string"?"string":"hash"]:n.map}function Sy(e){var t=Ys(this,e).delete(e);return this.size-=t?1:0,t}function Ey(e){return Ys(this,e).get(e)}function Py(e){return Ys(this,e).has(e)}function Cy(e,t){var n=Ys(this,e),r=n.size;return n.set(e,t),this.size+=n.size==r?0:1,this}function _n(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}_n.prototype.clear=wy;_n.prototype.delete=Sy;_n.prototype.get=Ey;_n.prototype.has=Py;_n.prototype.set=Cy;var Ty="Expected a function";function Ka(e,t){if(typeof e!="function"||t!=null&&typeof t!="function")throw new TypeError(Ty);var n=function(){var r=arguments,o=t?t.apply(this,r):r[0],s=n.cache;if(s.has(o))return s.get(o);var i=e.apply(this,r);return n.cache=s.set(o,i)||s,i};return n.cache=new(Ka.Cache||_n),n}Ka.Cache=_n;var Ay=500;function Iy(e){var t=Ka(e,function(r){return n.size===Ay&&n.clear(),r}),n=t.cache;return t}var Oy=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,My=/\\(\\)?/g,Ry=Iy(function(e){var t=[];return e.charCodeAt(0)===46&&t.push(""),e.replace(Oy,function(n,r,o,s){t.push(o?s.replace(My,"$1"):r||n)}),t});function Ny(e){return e==null?"":Zp(e)}function Qs(e,t){return pn(e)?e:ny(e,t)?[e]:Ry(Ny(e))}function qa(e){if(typeof e=="string"||Va(e))return e;var t=e+"";return t=="0"&&1/e==-1/0?"-0":t}function sd(e,t){t=Qs(t,e);for(var n=0,r=t.length;e!=null&&n<r;)e=e[qa(t[n++])];return n&&n==r?e:void 0}function id(e,t,n){var r=e==null?void 0:sd(e,t);return r===void 0?n:r}function ad(e,t){for(var n=-1,r=t.length,o=e.length;++n<r;)e[o+n]=t[n];return e}var Lc=qt?qt.isConcatSpreadable:void 0;function ky(e){return pn(e)||Ga(e)||!!(Lc&&e&&e[Lc])}function ld(e,t,n,r,o){var s=-1,i=e.length;for(n||(n=ky),o||(o=[]);++s<i;){var a=e[s];t>0&&n(a)?t>1?ld(a,t-1,n,r,o):ad(o,a):o[o.length]=a}return o}function Fy(e){var t=e==null?0:e.length;return t?ld(e,1):[]}function Ly(e){return Z_(iv(e,void 0,Fy),e+"")}function Dy(){this.__data__=new gn,this.size=0}function By(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n}function $y(e){return this.__data__.get(e)}function jy(e){return this.__data__.has(e)}var Hy=200;function Vy(e,t){var n=this.__data__;if(n instanceof gn){var r=n.__data__;if(!To||r.length<Hy-1)return r.push([e,t]),this.size=++n.size,this;n=this.__data__=new _n(r)}return n.set(e,t),this.size=n.size,this}function Fn(e){var t=this.__data__=new gn(e);this.size=t.size}Fn.prototype.clear=Dy;Fn.prototype.delete=By;Fn.prototype.get=$y;Fn.prototype.has=jy;Fn.prototype.set=Vy;function zy(e,t){for(var n=-1,r=e==null?0:e.length,o=0,s=[];++n<r;){var i=e[n];t(i,n,e)&&(s[o++]=i)}return s}function Wy(){return[]}var Uy=Object.prototype,Gy=Uy.propertyIsEnumerable,Dc=Object.getOwnPropertySymbols,Ky=Dc?function(e){return e==null?[]:(e=Object(e),zy(Dc(e),function(t){return Gy.call(e,t)}))}:Wy;function qy(e,t,n){var r=t(e);return pn(e)?r:ad(r,n(e))}function Bc(e){return qy(e,Zv,Ky)}var Yi=ur(hn,"DataView"),Qi=ur(hn,"Promise"),Xi=ur(hn,"Set"),$c="[object Map]",Jy="[object Object]",jc="[object Promise]",Hc="[object Set]",Vc="[object WeakMap]",zc="[object DataView]",Yy=cr(Yi),Qy=cr(To),Xy=cr(Qi),Zy=cr(Xi),eb=cr(qi),An=Ur;(Yi&&An(new Yi(new ArrayBuffer(1)))!=zc||To&&An(new To)!=$c||Qi&&An(Qi.resolve())!=jc||Xi&&An(new Xi)!=Hc||qi&&An(new qi)!=Vc)&&(An=function(e){var t=Ur(e),n=t==Jy?e.constructor:void 0,r=n?cr(n):"";if(r)switch(r){case Yy:return zc;case Qy:return $c;case Xy:return jc;case Zy:return Hc;case eb:return Vc}return t});var Wc=hn.Uint8Array,tb="__lodash_hash_undefined__";function nb(e){return this.__data__.set(e,tb),this}function rb(e){return this.__data__.has(e)}function Es(e){var t=-1,n=e==null?0:e.length;for(this.__data__=new _n;++t<n;)this.add(e[t])}Es.prototype.add=Es.prototype.push=nb;Es.prototype.has=rb;function ob(e,t){for(var n=-1,r=e==null?0:e.length;++n<r;)if(t(e[n],n,e))return!0;return!1}function sb(e,t){return e.has(t)}var ib=1,ab=2;function cd(e,t,n,r,o,s){var i=n&ib,a=e.length,l=t.length;if(a!=l&&!(i&&l>a))return!1;var c=s.get(e),u=s.get(t);if(c&&u)return c==t&&u==e;var f=-1,p=!0,d=n&ab?new Es:void 0;for(s.set(e,t),s.set(t,e);++f<a;){var m=e[f],g=t[f];if(r)var x=i?r(g,m,f,t,e,s):r(m,g,f,e,t,s);if(x!==void 0){if(x)continue;p=!1;break}if(d){if(!ob(t,function(b,C){if(!sb(d,C)&&(m===b||o(m,b,n,r,s)))return d.push(C)})){p=!1;break}}else if(!(m===g||o(m,g,n,r,s))){p=!1;break}}return s.delete(e),s.delete(t),p}function lb(e){var t=-1,n=Array(e.size);return e.forEach(function(r,o){n[++t]=[o,r]}),n}function cb(e){var t=-1,n=Array(e.size);return e.forEach(function(r){n[++t]=r}),n}var ub=1,fb=2,pb="[object Boolean]",db="[object Date]",mb="[object Error]",hb="[object Map]",gb="[object Number]",_b="[object RegExp]",vb="[object Set]",yb="[object String]",bb="[object Symbol]",wb="[object ArrayBuffer]",xb="[object DataView]",Uc=qt?qt.prototype:void 0,yi=Uc?Uc.valueOf:void 0;function Sb(e,t,n,r,o,s,i){switch(n){case xb:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case wb:return!(e.byteLength!=t.byteLength||!s(new Wc(e),new Wc(t)));case pb:case db:case gb:return Wa(+e,+t);case mb:return e.name==t.name&&e.message==t.message;case _b:case yb:return e==t+"";case hb:var a=lb;case vb:var l=r&ub;if(a||(a=cb),e.size!=t.size&&!l)return!1;var c=i.get(e);if(c)return c==t;r|=fb,i.set(e,t);var u=cd(a(e),a(t),r,o,s,i);return i.delete(e),u;case bb:if(yi)return yi.call(e)==yi.call(t)}return!1}var Eb=1,Pb=Object.prototype,Cb=Pb.hasOwnProperty;function Tb(e,t,n,r,o,s){var i=n&Eb,a=Bc(e),l=a.length,c=Bc(t),u=c.length;if(l!=u&&!i)return!1;for(var f=l;f--;){var p=a[f];if(!(i?p in t:Cb.call(t,p)))return!1}var d=s.get(e),m=s.get(t);if(d&&m)return d==t&&m==e;var g=!0;s.set(e,t),s.set(t,e);for(var x=i;++f<l;){p=a[f];var b=e[p],C=t[p];if(r)var v=i?r(C,b,p,t,e,s):r(b,C,p,e,t,s);if(!(v===void 0?b===C||o(b,C,n,r,s):v)){g=!1;break}x||(x=p=="constructor")}if(g&&!x){var P=e.constructor,R=t.constructor;P!=R&&"constructor"in e&&"constructor"in t&&!(typeof P=="function"&&P instanceof P&&typeof R=="function"&&R instanceof R)&&(g=!1)}return s.delete(e),s.delete(t),g}var Ab=1,Gc="[object Arguments]",Kc="[object Array]",qo="[object Object]",Ib=Object.prototype,qc=Ib.hasOwnProperty;function Ob(e,t,n,r,o,s){var i=pn(e),a=pn(t),l=i?Kc:An(e),c=a?Kc:An(t);l=l==Gc?qo:l,c=c==Gc?qo:c;var u=l==qo,f=c==qo,p=l==c;if(p&&Ji(e)){if(!Ji(t))return!1;i=!0,u=!1}if(p&&!u)return s||(s=new Fn),i||od(e)?cd(e,t,n,r,o,s):Sb(e,t,l,n,r,o,s);if(!(n&Ab)){var d=u&&qc.call(e,"__wrapped__"),m=f&&qc.call(t,"__wrapped__");if(d||m){var g=d?e.value():e,x=m?t.value():t;return s||(s=new Fn),o(g,x,n,r,s)}}return p?(s||(s=new Fn),Tb(e,t,n,r,o,s)):!1}function ud(e,t,n,r,o){return e===t?!0:e==null||t==null||!Fr(e)&&!Fr(t)?e!==e&&t!==t:Ob(e,t,n,r,ud,o)}function Mb(e,t){return e!=null&&t in Object(e)}function Rb(e,t,n){t=Qs(t,e);for(var r=-1,o=t.length,s=!1;++r<o;){var i=qa(t[r]);if(!(s=e!=null&&n(e,i)))break;e=e[i]}return s||++r!=o?s:(o=e==null?0:e.length,!!o&&Ua(o)&&za(i,o)&&(pn(e)||Ga(e)))}function Nb(e,t){return e!=null&&Rb(e,t,Mb)}function Zi(e){for(var t=-1,n=e==null?0:e.length,r={};++t<n;){var o=e[t];r[o[0]]=o[1]}return r}function kb(e,t){return ud(e,t)}function Lr(e){return e==null}function Fb(e){return e===void 0}function fd(e,t,n,r){if(!xs(e))return e;t=Qs(t,e);for(var o=-1,s=t.length,i=s-1,a=e;a!=null&&++o<s;){var l=qa(t[o]),c=n;if(l==="__proto__"||l==="constructor"||l==="prototype")return e;if(o!=i){var u=a[l];c=void 0,c===void 0&&(c=xs(u)?u:za(t[o+1])?[]:{})}sv(a,l,c),a=a[l]}return e}function Lb(e,t,n){for(var r=-1,o=t.length,s={};++r<o;){var i=t[r],a=sd(e,i);n(a,i)&&fd(s,Qs(i,e),a)}return s}function Db(e,t){return Lb(e,t,function(n,r){return Nb(e,r)})}var Bb=Ly(function(e,t){return e==null?{}:Db(e,t)});function $b(e,t,n){return e==null?e:fd(e,t,n)}const Ja=e=>e===void 0,ho=e=>typeof e=="boolean",Jt=e=>typeof e=="number",mE=e=>!e&&e!==0||ie(e)&&e.length===0||Ee(e)&&!Object.keys(e).length,Mn=e=>typeof Element>"u"?!1:e instanceof Element,jb=e=>Lr(e),Hb=e=>we(e)?!Number.isNaN(Number(e)):!1;var Vb=Object.defineProperty,zb=Object.defineProperties,Wb=Object.getOwnPropertyDescriptors,Jc=Object.getOwnPropertySymbols,Ub=Object.prototype.hasOwnProperty,Gb=Object.prototype.propertyIsEnumerable,Yc=(e,t,n)=>t in e?Vb(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Kb=(e,t)=>{for(var n in t||(t={}))Ub.call(t,n)&&Yc(e,n,t[n]);if(Jc)for(var n of Jc(t))Gb.call(t,n)&&Yc(e,n,t[n]);return e},qb=(e,t)=>zb(e,Wb(t));function pd(e,t){var n;const r=Ta();return pp(()=>{r.value=e()},qb(Kb({},t),{flush:(n=void 0)!=null?n:"sync"})),Or(r)}var Qc;const Ye=typeof window<"u",Jb=e=>typeof e<"u",Yb=e=>typeof e=="function",Qb=e=>typeof e=="string",Ps=()=>{},Xb=Ye&&((Qc=window==null?void 0:window.navigator)==null?void 0:Qc.userAgent)&&/iP(ad|hone|od)/.test(window.navigator.userAgent);function ir(e){return typeof e=="function"?e():w(e)}function Zb(e,t){function n(...r){return new Promise((o,s)=>{Promise.resolve(e(()=>t.apply(this,r),{fn:t,thisArg:this,args:r})).then(o).catch(s)})}return n}function e1(e,t={}){let n,r,o=Ps;const s=a=>{clearTimeout(a),o(),o=Ps};return a=>{const l=ir(e),c=ir(t.maxWait);return n&&s(n),l<=0||c!==void 0&&c<=0?(r&&(s(r),r=null),Promise.resolve(a())):new Promise((u,f)=>{o=t.rejectOnCancel?f:u,c&&!r&&(r=setTimeout(()=>{n&&s(n),r=null,u(a())},c)),n=setTimeout(()=>{r&&s(r),r=null,u(a())},l)})}}function t1(e){return e}function $o(e){return va()?(mf(e),!0):!1}function n1(e,t=200,n={}){return Zb(e1(t,n),e)}function hE(e,t=200,n={}){const r=L(e.value),o=n1(()=>{r.value=e.value},t,n);return ye(e,()=>o()),r}function r1(e,t=!0){Qe()?st(e):t?e():Kt(e)}function ea(e,t,n={}){const{immediate:r=!0}=n,o=L(!1);let s=null;function i(){s&&(clearTimeout(s),s=null)}function a(){o.value=!1,i()}function l(...c){i(),o.value=!0,s=setTimeout(()=>{o.value=!1,s=null,e(...c)},ir(t))}return r&&(o.value=!0,Ye&&l()),$o(a),{isPending:Or(o),start:l,stop:a}}function ht(e){var t;const n=ir(e);return(t=n==null?void 0:n.$el)!=null?t:n}const fr=Ye?window:void 0,o1=Ye?window.document:void 0;function er(...e){let t,n,r,o;if(Qb(e[0])||Array.isArray(e[0])?([n,r,o]=e,t=fr):[t,n,r,o]=e,!t)return Ps;Array.isArray(n)||(n=[n]),Array.isArray(r)||(r=[r]);const s=[],i=()=>{s.forEach(u=>u()),s.length=0},a=(u,f,p,d)=>(u.addEventListener(f,p,d),()=>u.removeEventListener(f,p,d)),l=ye(()=>[ht(t),ir(o)],([u,f])=>{i(),u&&s.push(...n.flatMap(p=>r.map(d=>a(u,p,d,f))))},{immediate:!0,flush:"post"}),c=()=>{l(),i()};return $o(c),c}let Xc=!1;function s1(e,t,n={}){const{window:r=fr,ignore:o=[],capture:s=!0,detectIframe:i=!1}=n;if(!r)return;Xb&&!Xc&&(Xc=!0,Array.from(r.document.body.children).forEach(p=>p.addEventListener("click",Ps)));let a=!0;const l=p=>o.some(d=>{if(typeof d=="string")return Array.from(r.document.querySelectorAll(d)).some(m=>m===p.target||p.composedPath().includes(m));{const m=ht(d);return m&&(p.target===m||p.composedPath().includes(m))}}),u=[er(r,"click",p=>{const d=ht(e);if(!(!d||d===p.target||p.composedPath().includes(d))){if(p.detail===0&&(a=!l(p)),!a){a=!0;return}t(p)}},{passive:!0,capture:s}),er(r,"pointerdown",p=>{const d=ht(e);d&&(a=!p.composedPath().includes(d)&&!l(p))},{passive:!0}),i&&er(r,"blur",p=>{var d;const m=ht(e);((d=r.document.activeElement)==null?void 0:d.tagName)==="IFRAME"&&!(m!=null&&m.contains(r.document.activeElement))&&t(p)})].filter(Boolean);return()=>u.forEach(p=>p())}function dd(e,t=!1){const n=L(),r=()=>n.value=!!e();return r(),r1(r,t),n}function i1(e){return JSON.parse(JSON.stringify(e))}const Zc=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},eu="__vueuse_ssr_handlers__";Zc[eu]=Zc[eu]||{};function gE(e,t,{window:n=fr,initialValue:r=""}={}){const o=L(r),s=k(()=>{var i;return ht(t)||((i=n==null?void 0:n.document)==null?void 0:i.documentElement)});return ye([s,()=>ir(e)],([i,a])=>{var l;if(i&&n){const c=(l=n.getComputedStyle(i).getPropertyValue(a))==null?void 0:l.trim();o.value=c||r}},{immediate:!0}),ye(o,i=>{var a;(a=s.value)!=null&&a.style&&s.value.style.setProperty(ir(e),i)}),o}function _E({document:e=o1}={}){if(!e)return L("visible");const t=L(e.visibilityState);return er(e,"visibilitychange",()=>{t.value=e.visibilityState}),t}var tu=Object.getOwnPropertySymbols,a1=Object.prototype.hasOwnProperty,l1=Object.prototype.propertyIsEnumerable,c1=(e,t)=>{var n={};for(var r in e)a1.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&tu)for(var r of tu(e))t.indexOf(r)<0&&l1.call(e,r)&&(n[r]=e[r]);return n};function Ya(e,t,n={}){const r=n,{window:o=fr}=r,s=c1(r,["window"]);let i;const a=dd(()=>o&&"ResizeObserver"in o),l=()=>{i&&(i.disconnect(),i=void 0)},c=ye(()=>ht(e),f=>{l(),a.value&&o&&f&&(i=new ResizeObserver(t),i.observe(f,s))},{immediate:!0,flush:"post"}),u=()=>{l(),c()};return $o(u),{isSupported:a,stop:u}}function vE(e,t={width:0,height:0},n={}){const{window:r=fr,box:o="content-box"}=n,s=k(()=>{var l,c;return(c=(l=ht(e))==null?void 0:l.namespaceURI)==null?void 0:c.includes("svg")}),i=L(t.width),a=L(t.height);return Ya(e,([l])=>{const c=o==="border-box"?l.borderBoxSize:o==="content-box"?l.contentBoxSize:l.devicePixelContentBoxSize;if(r&&s.value){const u=ht(e);if(u){const f=r.getComputedStyle(u);i.value=parseFloat(f.width),a.value=parseFloat(f.height)}}else if(c){const u=Array.isArray(c)?c:[c];i.value=u.reduce((f,{inlineSize:p})=>f+p,0),a.value=u.reduce((f,{blockSize:p})=>f+p,0)}else i.value=l.contentRect.width,a.value=l.contentRect.height},n),ye(()=>ht(e),l=>{i.value=l?t.width:0,a.value=l?t.height:0}),{width:i,height:a}}var nu=Object.getOwnPropertySymbols,u1=Object.prototype.hasOwnProperty,f1=Object.prototype.propertyIsEnumerable,p1=(e,t)=>{var n={};for(var r in e)u1.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&nu)for(var r of nu(e))t.indexOf(r)<0&&f1.call(e,r)&&(n[r]=e[r]);return n};function yE(e,t,n={}){const r=n,{window:o=fr}=r,s=p1(r,["window"]);let i;const a=dd(()=>o&&"MutationObserver"in o),l=()=>{i&&(i.disconnect(),i=void 0)},c=ye(()=>ht(e),f=>{l(),a.value&&o&&f&&(i=new MutationObserver(t),i.observe(f,s))},{immediate:!0}),u=()=>{l(),c()};return $o(u),{isSupported:a,stop:u}}var ru;(function(e){e.UP="UP",e.RIGHT="RIGHT",e.DOWN="DOWN",e.LEFT="LEFT",e.NONE="NONE"})(ru||(ru={}));var d1=Object.defineProperty,ou=Object.getOwnPropertySymbols,m1=Object.prototype.hasOwnProperty,h1=Object.prototype.propertyIsEnumerable,su=(e,t,n)=>t in e?d1(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,g1=(e,t)=>{for(var n in t||(t={}))m1.call(t,n)&&su(e,n,t[n]);if(ou)for(var n of ou(t))h1.call(t,n)&&su(e,n,t[n]);return e};const _1={easeInSine:[.12,0,.39,0],easeOutSine:[.61,1,.88,1],easeInOutSine:[.37,0,.63,1],easeInQuad:[.11,0,.5,0],easeOutQuad:[.5,1,.89,1],easeInOutQuad:[.45,0,.55,1],easeInCubic:[.32,0,.67,0],easeOutCubic:[.33,1,.68,1],easeInOutCubic:[.65,0,.35,1],easeInQuart:[.5,0,.75,0],easeOutQuart:[.25,1,.5,1],easeInOutQuart:[.76,0,.24,1],easeInQuint:[.64,0,.78,0],easeOutQuint:[.22,1,.36,1],easeInOutQuint:[.83,0,.17,1],easeInExpo:[.7,0,.84,0],easeOutExpo:[.16,1,.3,1],easeInOutExpo:[.87,0,.13,1],easeInCirc:[.55,0,1,.45],easeOutCirc:[0,.55,.45,1],easeInOutCirc:[.85,0,.15,1],easeInBack:[.36,0,.66,-.56],easeOutBack:[.34,1.56,.64,1],easeInOutBack:[.68,-.6,.32,1.6]};g1({linear:t1},_1);function bE(e,t,n,r={}){var o,s,i;const{clone:a=!1,passive:l=!1,eventName:c,deep:u=!1,defaultValue:f}=r,p=Qe(),d=(p==null?void 0:p.emit)||((o=p==null?void 0:p.$emit)==null?void 0:o.bind(p))||((i=(s=p==null?void 0:p.proxy)==null?void 0:s.$emit)==null?void 0:i.bind(p==null?void 0:p.proxy));let m=c;m=c||m||`update:${t.toString()}`;const g=b=>a?Yb(a)?a(b):i1(b):b,x=()=>Jb(e[t])?g(e[t]):f;if(l){const b=x(),C=L(b);return ye(()=>e[t],v=>C.value=g(v)),ye(C,v=>{(v!==e[t]||u)&&d(m,v)},{deep:u}),C}else return k({get(){return x()},set(b){d(m,b)}})}function wE({window:e=fr}={}){if(!e)return L(!1);const t=L(e.document.hasFocus());return er(e,"blur",()=>{t.value=!1}),er(e,"focus",()=>{t.value=!0}),t}class v1 extends Error{constructor(t){super(t),this.name="ElementPlusError"}}function Cs(e,t){throw new v1(`[${e}] ${t}`)}function xE(e,t){}const iu={current:0},au=L(0),md=2e3,lu=Symbol("elZIndexContextKey"),hd=Symbol("zIndexContextKey"),gd=e=>{const t=Qe()?Te(lu,iu):iu,n=e||(Qe()?Te(hd,void 0):void 0),r=k(()=>{const i=w(n);return Jt(i)?i:md}),o=k(()=>r.value+au.value),s=()=>(t.current++,au.value=t.current,o.value);return!Ye&&Te(lu),{initialZIndex:r,currentZIndex:o,nextZIndex:s}};var y1={name:"en",el:{breadcrumb:{label:"Breadcrumb"},colorpicker:{confirm:"OK",clear:"Clear",defaultLabel:"color picker",description:"current color is {color}. press enter to select a new color.",alphaLabel:"pick alpha value",alphaDescription:"alpha {alpha}, current color is {color}",hueLabel:"pick hue value",hueDescription:"hue {hue}, current color is {color}",svLabel:"pick saturation and brightness value",svDescription:"saturation {saturation}, brightness {brightness}, current color is {color}",predefineDescription:"select {value} as the color"},datepicker:{now:"Now",today:"Today",cancel:"Cancel",clear:"Clear",confirm:"OK",dateTablePrompt:"Use the arrow keys and enter to select the day of the month",monthTablePrompt:"Use the arrow keys and enter to select the month",yearTablePrompt:"Use the arrow keys and enter to select the year",selectedDate:"Selected date",selectDate:"Select date",selectTime:"Select time",startDate:"Start Date",startTime:"Start Time",endDate:"End Date",endTime:"End Time",prevYear:"Previous Year",nextYear:"Next Year",prevMonth:"Previous Month",nextMonth:"Next Month",year:"",month1:"January",month2:"February",month3:"March",month4:"April",month5:"May",month6:"June",month7:"July",month8:"August",month9:"September",month10:"October",month11:"November",month12:"December",weeks:{sun:"Sun",mon:"Mon",tue:"Tue",wed:"Wed",thu:"Thu",fri:"Fri",sat:"Sat"},weeksFull:{sun:"Sunday",mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday"},months:{jan:"Jan",feb:"Feb",mar:"Mar",apr:"Apr",may:"May",jun:"Jun",jul:"Jul",aug:"Aug",sep:"Sep",oct:"Oct",nov:"Nov",dec:"Dec"}},inputNumber:{decrease:"decrease number",increase:"increase number"},select:{loading:"Loading",noMatch:"No matching data",noData:"No data",placeholder:"Select"},mention:{loading:"Loading"},dropdown:{toggleDropdown:"Toggle Dropdown"},cascader:{noMatch:"No matching data",loading:"Loading",placeholder:"Select",noData:"No data"},pagination:{goto:"Go to",pagesize:"/page",total:"Total {total}",pageClassifier:"",page:"Page",prev:"Go to previous page",next:"Go to next page",currentPage:"page {pager}",prevPages:"Previous {pager} pages",nextPages:"Next {pager} pages",deprecationWarning:"Deprecated usages detected, please refer to the el-pagination documentation for more details"},dialog:{close:"Close this dialog"},drawer:{close:"Close this dialog"},messagebox:{title:"Message",confirm:"OK",cancel:"Cancel",error:"Illegal input",close:"Close this dialog"},upload:{deleteTip:"press delete to remove",delete:"Delete",preview:"Preview",continue:"Continue"},slider:{defaultLabel:"slider between {min} and {max}",defaultRangeStartLabel:"pick start value",defaultRangeEndLabel:"pick end value"},table:{emptyText:"No Data",confirmFilter:"Confirm",resetFilter:"Reset",clearFilter:"All",sumText:"Sum"},tour:{next:"Next",previous:"Previous",finish:"Finish",close:"Close this dialog"},tree:{emptyText:"No Data"},transfer:{noMatch:"No matching data",noData:"No data",titles:["List 1","List 2"],filterPlaceholder:"Enter keyword",noCheckedFormat:"{total} items",hasCheckedFormat:"{checked}/{total} checked"},image:{error:"FAILED"},pageHeader:{title:"Back"},popconfirm:{confirmButtonText:"Yes",cancelButtonText:"No"},carousel:{leftArrow:"Carousel arrow left",rightArrow:"Carousel arrow right",indicator:"Carousel switch to index {index}"}}};const b1=e=>(t,n)=>w1(t,n,w(e)),w1=(e,t,n)=>id(n,e,e).replace(/\{(\w+)\}/g,(r,o)=>{var s;return`${(s=t==null?void 0:t[o])!=null?s:`{${o}}`}`}),x1=e=>{const t=k(()=>w(e).name),n=$e(e)?e:L(e);return{lang:t,locale:n,t:b1(e)}},_d=Symbol("localeContextKey"),S1=e=>{const t=e||Te(_d,L());return x1(k(()=>t.value||y1))},vd="__epPropKey",be=e=>e,E1=e=>Ee(e)&&!!e[vd],Xs=(e,t)=>{if(!Ee(e)||E1(e))return e;const{values:n,required:r,default:o,type:s,validator:i}=e,l={type:s,required:!!r,validator:n||i?c=>{let u=!1,f=[];if(n&&(f=Array.from(n),Pe(e,"default")&&f.push(o),u||(u=f.includes(c))),i&&(u||(u=i(c))),!u&&f.length>0){const p=[...new Set(f)].map(d=>JSON.stringify(d)).join(", ");vg(`Invalid prop: validation failed${t?` for prop "${t}"`:""}. Expected one of [${p}], got value ${JSON.stringify(c)}.`)}return u}:void 0,[vd]:!0};return Pe(e,"default")&&(l.default=o),l},qe=e=>Zi(Object.entries(e).map(([t,n])=>[t,Xs(n,t)])),P1=["","default","small","large"],SE=Xs({type:String,values:P1,required:!1}),yd=Symbol("size"),EE=()=>{const e=Te(yd,{});return k(()=>w(e.size)||"")},bd=Symbol("emptyValuesContextKey"),C1=["",void 0,null],T1=void 0,PE=qe({emptyValues:Array,valueOnClear:{type:be([String,Number,Boolean,Function]),default:void 0,validator:e=>(e=ue(e)?e():e,ie(e)?e.every(t=>!t):!e)}}),CE=(e,t)=>{const n=Qe()?Te(bd,L({})):L({}),r=k(()=>e.emptyValues||n.value.emptyValues||C1),o=k(()=>ue(e.valueOnClear)?e.valueOnClear():e.valueOnClear!==void 0?e.valueOnClear:ue(n.value.valueOnClear)?n.value.valueOnClear():n.value.valueOnClear!==void 0?n.value.valueOnClear:T1),s=i=>{let a=!0;return ie(i)?a=r.value.some(l=>kb(i,l)):a=r.value.includes(i),a};return s(o.value),{emptyValues:r,valueOnClear:o,isEmptyValue:s}},cu=e=>Object.keys(e),TE=e=>Object.entries(e),AE=(e,t,n)=>({get value(){return id(e,t,n)},set value(r){$b(e,t,r)}}),Ts=L();function wd(e,t=void 0){const n=Qe()?Te(Jp,Ts):Ts;return e?k(()=>{var r,o;return(o=(r=n.value)==null?void 0:r[e])!=null?o:t}):n}function A1(e,t){const n=wd(),r=Be(e,k(()=>{var a;return((a=n.value)==null?void 0:a.namespace)||ls})),o=S1(k(()=>{var a;return(a=n.value)==null?void 0:a.locale})),s=gd(k(()=>{var a;return((a=n.value)==null?void 0:a.zIndex)||md})),i=k(()=>{var a;return w(t)||((a=n.value)==null?void 0:a.size)||""});return I1(k(()=>w(n)||{})),{ns:r,locale:o,zIndex:s,size:i}}const I1=(e,t,n=!1)=>{var r;const o=!!Qe(),s=o?wd():void 0,i=(r=void 0)!=null?r:o?gt:void 0;if(!i)return;const a=k(()=>{const l=w(e);return s!=null&&s.value?O1(s.value,l):l});return i(Jp,a),i(_d,k(()=>a.value.locale)),i(Yp,k(()=>a.value.namespace)),i(hd,k(()=>a.value.zIndex)),i(yd,{size:k(()=>a.value.size||"")}),i(bd,k(()=>({emptyValues:a.value.emptyValues,valueOnClear:a.value.valueOnClear}))),(n||!Ts.value)&&(Ts.value=a.value),a},O1=(e,t)=>{const n=[...new Set([...cu(e),...cu(t)])],r={};for(const o of n)r[o]=t[o]!==void 0?t[o]:e[o];return r};var Ve=(e,t)=>{const n=e.__vccOpts||e;for(const[r,o]of t)n[r]=o;return n};const xd=(e="")=>e.split(" ").filter(t=>!!t.trim()),M1=(e,t)=>{if(!e||!t)return!1;if(t.includes(" "))throw new Error("className should not contain space.");return e.classList.contains(t)},Jo=(e,t)=>{!e||!t.trim()||e.classList.add(...xd(t))},bi=(e,t)=>{!e||!t.trim()||e.classList.remove(...xd(t))},IE=(e,t)=>{var n;if(!Ye||!e||!t)return"";let r=xt(t);r==="float"&&(r="cssFloat");try{const o=e.style[r];if(o)return o;const s=(n=document.defaultView)==null?void 0:n.getComputedStyle(e,"");return s?s[r]:""}catch{return e.style[r]}};function ta(e,t="px"){if(!e)return"";if(Jt(e)||Hb(e))return`${e}${t}`;if(we(e))return e}const $n=(e,t)=>{if(e.install=n=>{for(const r of[e,...Object.values(t??{})])n.component(r.name,r)},t)for(const[n,r]of Object.entries(t))e[n]=r;return e},R1=(e,t)=>(e.install=n=>{e._context=n._context,n.config.globalProperties[t]=e},e),pr=e=>(e.install=pt,e),N1=qe({size:{type:be([Number,String])},color:{type:String}}),k1=q({name:"ElIcon",inheritAttrs:!1}),F1=q({...k1,props:N1,setup(e){const t=e,n=Be("icon"),r=k(()=>{const{size:o,color:s}=t;return!o&&!s?{}:{fontSize:Ja(o)?void 0:ta(o),"--color":s}});return(o,s)=>(J(),ae("i",lr({class:w(n).b(),style:w(r)},o.$attrs),[Re(o.$slots,"default")],16))}});var L1=Ve(F1,[["__file","icon.vue"]]);const Dr=$n(L1);function uu(){let e;const t=(r,o)=>{n(),e=window.setTimeout(r,o)},n=()=>window.clearTimeout(e);return $o(()=>n()),{registerTimeout:t,cancelTimeout:n}}const D1=qe({showAfter:{type:Number,default:0},hideAfter:{type:Number,default:200},autoClose:{type:Number,default:0}}),B1=({showAfter:e,hideAfter:t,autoClose:n,open:r,close:o})=>{const{registerTimeout:s}=uu(),{registerTimeout:i,cancelTimeout:a}=uu();return{onOpen:(u,f=w(e))=>{s(()=>{r(u);const p=w(n);Jt(p)&&p>0&&i(()=>{o(u)},p)},f)},onClose:(u,f=w(t))=>{a(),s(()=>{o(u)},f)}}};/*! Element Plus Icons Vue v2.3.2 */var $1=q({name:"Aim",__name:"aim",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"}),Q("path",{fill:"currentColor",d:"M512 96a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V128a32 32 0 0 1 32-32m0 576a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V704a32 32 0 0 1 32-32M96 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H128a32 32 0 0 1-32-32m576 0a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H704a32 32 0 0 1-32-32"})]))}}),OE=$1,j1=q({name:"ArrowDown",__name:"arrow-down",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M831.872 340.864 512 652.672 192.128 340.864a30.59 30.59 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.59 30.59 0 0 0-42.752 0z"})]))}}),H1=j1,V1=q({name:"ArrowLeft",__name:"arrow-left",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.59 30.59 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.59 30.59 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0"})]))}}),ME=V1,z1=q({name:"ArrowRight",__name:"arrow-right",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"})]))}}),W1=z1,U1=q({name:"ArrowUp",__name:"arrow-up",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m488.832 344.32-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872 319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0"})]))}}),RE=U1,G1=q({name:"Box",__name:"box",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M317.056 128 128 344.064V896h768V344.064L706.944 128zm-14.528-64h418.944a32 32 0 0 1 24.064 10.88l206.528 236.096A32 32 0 0 1 960 332.032V928a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V332.032a32 32 0 0 1 7.936-21.12L278.4 75.008A32 32 0 0 1 302.528 64"}),Q("path",{fill:"currentColor",d:"M64 320h896v64H64z"}),Q("path",{fill:"currentColor",d:"M448 327.872V640h128V327.872L526.08 128h-28.16zM448 64h128l64 256v352a32 32 0 0 1-32 32H416a32 32 0 0 1-32-32V320z"})]))}}),K1=G1,q1=q({name:"Briefcase",__name:"briefcase",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M320 320V128h384v192h192v192H128V320zM128 576h768v320H128zm256-256h256.064V192H384z"})]))}}),J1=q1,Y1=q({name:"Check",__name:"check",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"})]))}}),NE=Y1,Q1=q({name:"CircleCheck",__name:"circle-check",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"}),Q("path",{fill:"currentColor",d:"M745.344 361.344a32 32 0 0 1 45.312 45.312l-288 288a32 32 0 0 1-45.312 0l-160-160a32 32 0 1 1 45.312-45.312L480 626.752z"})]))}}),X1=Q1,Z1=q({name:"CircleCloseFilled",__name:"circle-close-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336z"})]))}}),Sd=Z1,e2=q({name:"CircleClose",__name:"circle-close",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m466.752 512-90.496-90.496a32 32 0 0 1 45.248-45.248L512 466.752l90.496-90.496a32 32 0 1 1 45.248 45.248L557.248 512l90.496 90.496a32 32 0 1 1-45.248 45.248L512 557.248l-90.496 90.496a32 32 0 0 1-45.248-45.248z"}),Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"})]))}}),t2=e2,n2=q({name:"Close",__name:"close",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"})]))}}),Qa=n2,r2=q({name:"Connection",__name:"connection",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M640 384v64H448a128 128 0 0 0-128 128v128a128 128 0 0 0 128 128h320a128 128 0 0 0 128-128V576a128 128 0 0 0-64-110.848V394.88c74.56 26.368 128 97.472 128 181.056v128a192 192 0 0 1-192 192H448a192 192 0 0 1-192-192V576a192 192 0 0 1 192-192z"}),Q("path",{fill:"currentColor",d:"M384 640v-64h192a128 128 0 0 0 128-128V320a128 128 0 0 0-128-128H256a128 128 0 0 0-128 128v128a128 128 0 0 0 64 110.848v70.272A192.06 192.06 0 0 1 64 448V320a192 192 0 0 1 192-192h320a192 192 0 0 1 192 192v128a192 192 0 0 1-192 192z"})]))}}),o2=r2,s2=q({name:"CopyDocument",__name:"copy-document",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"}),Q("path",{fill:"currentColor",d:"M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"})]))}}),kE=s2,i2=q({name:"Delete",__name:"delete",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"})]))}}),FE=i2,a2=q({name:"Document",__name:"document",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"})]))}}),LE=a2,l2=q({name:"Edit",__name:"edit",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"}),Q("path",{fill:"currentColor",d:"m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"})]))}}),DE=l2,c2=q({name:"FirstAidKit",__name:"first-aid-kit",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M192 256a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V320a64 64 0 0 0-64-64zm0-64h640a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H192A128 128 0 0 1 64 768V320a128 128 0 0 1 128-128"}),Q("path",{fill:"currentColor",d:"M544 512h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64h96v-96a32 32 0 0 1 64 0zM352 128v64h320v-64zm-32-64h384a32 32 0 0 1 32 32v128a32 32 0 0 1-32 32H320a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32"})]))}}),u2=c2,f2=q({name:"FullScreen",__name:"full-screen",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m160 96.064 192 .192a32 32 0 0 1 0 64l-192-.192V352a32 32 0 0 1-64 0V96h64zm0 831.872V928H96V672a32 32 0 1 1 64 0v191.936l192-.192a32 32 0 1 1 0 64zM864 96.064V96h64v256a32 32 0 1 1-64 0V160.064l-192 .192a32 32 0 1 1 0-64zm0 831.872-192-.192a32 32 0 0 1 0-64l192 .192V672a32 32 0 1 1 64 0v256h-64z"})]))}}),p2=f2,d2=q({name:"Hide",__name:"hide",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176"}),Q("path",{fill:"currentColor",d:"M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112s-67.2 48-112 48"})]))}}),BE=d2,m2=q({name:"HomeFilled",__name:"home-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 128 128 447.936V896h255.936V640H640v256h255.936V447.936z"})]))}}),h2=m2,g2=q({name:"InfoFilled",__name:"info-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64m67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344M590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.99 12.99 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z"})]))}}),na=g2,_2=q({name:"Loading",__name:"loading",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32m0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32m448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32m-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32M195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248m452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248M828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0m-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0"})]))}}),v2=_2,y2=q({name:"MapLocation",__name:"map-location",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M800 416a288 288 0 1 0-576 0c0 118.144 94.528 272.128 288 456.576C705.472 688.128 800 534.144 800 416M512 960C277.312 746.688 160 565.312 160 416a352 352 0 0 1 704 0c0 149.312-117.312 330.688-352 544"}),Q("path",{fill:"currentColor",d:"M512 448a64 64 0 1 0 0-128 64 64 0 0 0 0 128m0 64a128 128 0 1 1 0-256 128 128 0 0 1 0 256m345.6 192L960 960H672v-64H352v64H64l102.4-256zm-68.928 0H235.328l-76.8 192h706.944z"})]))}}),b2=y2,w2=q({name:"Minus",__name:"minus",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M128 544h768a32 32 0 1 0 0-64H128a32 32 0 0 0 0 64"})]))}}),x2=w2,S2=q({name:"Monitor",__name:"monitor",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M544 768v128h192a32 32 0 1 1 0 64H288a32 32 0 1 1 0-64h192V768H192A128 128 0 0 1 64 640V256a128 128 0 0 1 128-128h640a128 128 0 0 1 128 128v384a128 128 0 0 1-128 128zM192 192a64 64 0 0 0-64 64v384a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V256a64 64 0 0 0-64-64z"})]))}}),E2=S2,P2=q({name:"More",__name:"more",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M176 416a112 112 0 1 0 0 224 112 112 0 0 0 0-224m0 64a48 48 0 1 1 0 96 48 48 0 0 1 0-96m336-64a112 112 0 1 1 0 224 112 112 0 0 1 0-224m0 64a48 48 0 1 0 0 96 48 48 0 0 0 0-96m336-64a112 112 0 1 1 0 224 112 112 0 0 1 0-224m0 64a48 48 0 1 0 0 96 48 48 0 0 0 0-96"})]))}}),C2=P2,T2=q({name:"Notebook",__name:"notebook",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M192 128v768h640V128zm-32-64h704a32 32 0 0 1 32 32v832a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32"}),Q("path",{fill:"currentColor",d:"M672 128h64v768h-64zM96 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32"})]))}}),A2=T2,I2=q({name:"Plus",__name:"plus",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64z"})]))}}),$E=I2,O2=q({name:"QuestionFilled",__name:"question-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592q0-64.416-42.24-101.376c-28.16-25.344-65.472-37.312-111.232-37.312m-12.672 406.208a54.27 54.27 0 0 0-38.72 14.784 49.4 49.4 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.85 54.85 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.97 51.97 0 0 0-15.488-38.016 55.94 55.94 0 0 0-39.424-14.784"})]))}}),M2=O2,R2=q({name:"RefreshLeft",__name:"refresh-left",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M289.088 296.704h92.992a32 32 0 0 1 0 64H232.96a32 32 0 0 1-32-32V179.712a32 32 0 0 1 64 0v50.56a384 384 0 0 1 643.84 282.88 384 384 0 0 1-383.936 384 384 384 0 0 1-384-384h64a320 320 0 1 0 640 0 320 320 0 0 0-555.712-216.448z"})]))}}),jE=R2,N2=q({name:"Refresh",__name:"refresh",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M771.776 794.88A384 384 0 0 1 128 512h64a320 320 0 0 0 555.712 216.448H654.72a32 32 0 1 1 0-64h149.056a32 32 0 0 1 32 32v148.928a32 32 0 1 1-64 0v-50.56zM276.288 295.616h92.992a32 32 0 0 1 0 64H220.16a32 32 0 0 1-32-32V178.56a32 32 0 0 1 64 0v50.56A384 384 0 0 1 896.128 512h-64a320 320 0 0 0-555.776-216.384z"})]))}}),HE=N2,k2=q({name:"Setting",__name:"setting",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357 357 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a352 352 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357 357 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294 294 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293 293 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294 294 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288 288 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293 293 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a288 288 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384m0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256"})]))}}),F2=k2,L2=q({name:"ShoppingBag",__name:"shopping-bag",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M704 320v96a32 32 0 0 1-32 32h-32V320H384v128h-32a32 32 0 0 1-32-32v-96H192v576h640V320zm-384-64a192 192 0 1 1 384 0h160a32 32 0 0 1 32 32v640a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V288a32 32 0 0 1 32-32zm64 0h256a128 128 0 1 0-256 0"}),Q("path",{fill:"currentColor",d:"M192 704h640v64H192z"})]))}}),D2=L2,B2=q({name:"SuccessFilled",__name:"success-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.27 38.27 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336z"})]))}}),Ed=B2,$2=q({name:"Tools",__name:"tools",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M764.416 254.72a351.7 351.7 0 0 1 86.336 149.184H960v192.064H850.752a351.7 351.7 0 0 1-86.336 149.312l54.72 94.72-166.272 96-54.592-94.72a352.64 352.64 0 0 1-172.48 0L371.136 936l-166.272-96 54.72-94.72a351.7 351.7 0 0 1-86.336-149.312H64v-192h109.248a351.7 351.7 0 0 1 86.336-149.312L204.8 160l166.208-96h.192l54.656 94.592a352.64 352.64 0 0 1 172.48 0L652.8 64h.128L819.2 160l-54.72 94.72zM704 499.968a192 192 0 1 0-384 0 192 192 0 0 0 384 0"})]))}}),j2=$2,H2=q({name:"VideoPause",__name:"video-pause",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 832a384 384 0 0 0 0-768 384 384 0 0 0 0 768m-96-544q32 0 32 32v256q0 32-32 32t-32-32V384q0-32 32-32m192 0q32 0 32 32v256q0 32-32 32t-32-32V384q0-32 32-32"})]))}}),VE=H2,V2=q({name:"VideoPlay",__name:"video-play",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 832a384 384 0 0 0 0-768 384 384 0 0 0 0 768m-48-247.616L668.608 512 464 375.616zm10.624-342.656 249.472 166.336a48 48 0 0 1 0 79.872L474.624 718.272A48 48 0 0 1 400 678.336V345.6a48 48 0 0 1 74.624-39.936z"})]))}}),zE=V2,z2=q({name:"View",__name:"view",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 160c320 0 512 352 512 352S832 864 512 864 0 512 0 512s192-352 512-352m0 64c-225.28 0-384.128 208.064-436.8 288 52.608 79.872 211.456 288 436.8 288 225.28 0 384.128-208.064 436.8-288-52.608-79.872-211.456-288-436.8-288m0 64a224 224 0 1 1 0 448 224 224 0 0 1 0-448m0 64a160.19 160.19 0 0 0-160 160c0 88.192 71.744 160 160 160s160-71.808 160-160-71.744-160-160-160"})]))}}),WE=z2,W2=q({name:"WarningFilled",__name:"warning-filled",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 192a58.43 58.43 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.43 58.43 0 0 0 512 256m0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4"})]))}}),Pd=W2,U2=q({name:"ZoomIn",__name:"zoom-in",setup(e){return(t,n)=>(J(),ae("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"})]))}}),UE=U2;const wr=be([String,Object,Function]),GE={Close:Qa},G2={Close:Qa,SuccessFilled:Ed,InfoFilled:na,WarningFilled:Pd,CircleCloseFilled:Sd},fu={primary:na,success:Ed,warning:Pd,error:Sd,info:na},KE={validating:v2,success:X1,error:t2},qE=()=>Ye&&/firefox/i.test(window.navigator.userAgent),K2=()=>Ye&&/android/i.test(window.navigator.userAgent),Cd=e=>e,q2=qe({ariaLabel:String,ariaOrientation:{type:String,values:["horizontal","vertical","undefined"]},ariaControls:String}),Td=e=>Bb(q2,e),pu={prefix:Math.floor(Math.random()*1e4),current:0},J2=Symbol("elIdInjection"),Ad=()=>Qe()?Te(J2,pu):pu,Y2=e=>{const t=Ad(),n=Ha();return pd(()=>w(e)||`${n.value}-id-${t.prefix}-${t.current++}`)},JE=Symbol("formContextKey"),du=Symbol("formItemContextKey"),Q2='a[href],button:not([disabled]),button:not([hidden]),:not([tabindex="-1"]),input:not([disabled]),input:not([type="hidden"]),select:not([disabled]),textarea:not([disabled])',mu=e=>typeof Element>"u"?!1:e instanceof Element,X2=e=>getComputedStyle(e).position==="fixed"?!1:e.offsetParent!==null,YE=e=>Array.from(e.querySelectorAll(Q2)).filter(t=>As(t)&&X2(t)),As=e=>{if(e.tabIndex>0||e.tabIndex===0&&e.getAttribute("tabIndex")!==null)return!0;if(e.tabIndex<0||e.hasAttribute("disabled")||e.getAttribute("aria-disabled")==="true")return!1;switch(e.nodeName){case"A":return!!e.href&&e.rel!=="ignore";case"INPUT":return!(e.type==="hidden"||e.type==="file");case"BUTTON":case"SELECT":case"TEXTAREA":return!0;default:return!1}},cs=function(e,t,...n){let r;t.includes("mouse")||t.includes("click")?r="MouseEvents":t.includes("key")?r="KeyboardEvent":r="HTMLEvents";const o=document.createEvent(r);return o.initEvent(t,...n),e.dispatchEvent(o),e},Z2=e=>!e.getAttribute("aria-owns"),QE=(e,t,n)=>{const{parentNode:r}=e;if(!r)return null;const o=r.querySelectorAll(n),s=Array.prototype.indexOf.call(o,e);return o[s+t]||null},jo=(e,t)=>{if(!e||!e.focus)return;let n=!1;mu(e)&&!As(e)&&!e.getAttribute("tabindex")&&(e.setAttribute("tabindex","-1"),n=!0),e.focus(t),mu(e)&&n&&e.removeAttribute("tabindex")},XE=e=>{e&&(jo(e),!Z2(e)&&e.click())},Xa=Symbol("popper"),Id=Symbol("popperContent"),ew=["dialog","grid","group","listbox","menu","navigation","tooltip","tree"],Od=qe({role:{type:String,values:ew,default:"tooltip"}}),tw=q({name:"ElPopper",inheritAttrs:!1}),nw=q({...tw,props:Od,setup(e,{expose:t}){const n=e,r=L(),o=L(),s=L(),i=L(),a=k(()=>n.role),l={triggerRef:r,popperInstanceRef:o,contentRef:s,referenceRef:i,role:a};return t(l),gt(Xa,l),(c,u)=>Re(c.$slots,"default")}});var rw=Ve(nw,[["__file","popper.vue"]]);const ow=q({name:"ElPopperArrow",inheritAttrs:!1}),sw=q({...ow,setup(e,{expose:t}){const n=Be("popper"),{arrowRef:r,arrowStyle:o}=Te(Id,void 0);return At(()=>{r.value=void 0}),t({arrowRef:r}),(s,i)=>(J(),ae("span",{ref_key:"arrowRef",ref:r,class:De(w(n).e("arrow")),style:Qt(w(o)),"data-popper-arrow":""},null,6))}});var iw=Ve(sw,[["__file","arrow.vue"]]);const Md=qe({virtualRef:{type:be(Object)},virtualTriggering:Boolean,onMouseenter:{type:be(Function)},onMouseleave:{type:be(Function)},onClick:{type:be(Function)},onKeydown:{type:be(Function)},onFocus:{type:be(Function)},onBlur:{type:be(Function)},onContextmenu:{type:be(Function)},id:String,open:Boolean}),Rd=Symbol("elForwardRef"),aw=e=>{gt(Rd,{setForwardRef:n=>{e.value=n}})},lw=e=>({mounted(t){e(t)},updated(t){e(t)},unmounted(){e(null)}}),cw="ElOnlyChild",uw=q({name:cw,setup(e,{slots:t,attrs:n}){var r;const o=Te(Rd),s=lw((r=o==null?void 0:o.setForwardRef)!=null?r:pt);return()=>{var i;const a=(i=t.default)==null?void 0:i.call(t,n);if(!a)return null;const[l,c]=Nd(a);return l?zr(fn(l,n),[[s]]):null}}});function Nd(e){if(!e)return[null,0];const t=e,n=t.filter(r=>r.type!==Je).length;for(const r of t){if(Ee(r))switch(r.type){case Je:continue;case Lo:case"svg":return[hu(r),n];case We:return Nd(r.children);default:return[r,n]}return[hu(r),n]}return[null,0]}function hu(e){const t=Be("only-child");return oe("span",{class:t.e("content")},[e])}const fw=q({name:"ElPopperTrigger",inheritAttrs:!1}),pw=q({...fw,props:Md,setup(e,{expose:t}){const n=e,{role:r,triggerRef:o}=Te(Xa,void 0);aw(o);const s=k(()=>a.value?n.id:void 0),i=k(()=>{if(r&&r.value==="tooltip")return n.open&&n.id?n.id:void 0}),a=k(()=>{if(r&&r.value!=="tooltip")return r.value}),l=k(()=>a.value?`${n.open}`:void 0);let c;const u=["onMouseenter","onMouseleave","onClick","onKeydown","onFocus","onBlur","onContextmenu"];return st(()=>{ye(()=>n.virtualRef,f=>{f&&(o.value=ht(f))},{immediate:!0}),ye(o,(f,p)=>{c==null||c(),c=void 0,Mn(p)&&u.forEach(d=>{const m=n[d];m&&p.removeEventListener(d.slice(2).toLowerCase(),m,["onFocus","onBlur"].includes(d))}),Mn(f)&&(u.forEach(d=>{const m=n[d];m&&f.addEventListener(d.slice(2).toLowerCase(),m,["onFocus","onBlur"].includes(d))}),As(f)&&(c=ye([s,i,a,l],d=>{["aria-controls","aria-describedby","aria-haspopup","aria-expanded"].forEach((m,g)=>{Lr(d[g])?f.removeAttribute(m):f.setAttribute(m,d[g])})},{immediate:!0}))),Mn(p)&&As(p)&&["aria-controls","aria-describedby","aria-haspopup","aria-expanded"].forEach(d=>p.removeAttribute(d))},{immediate:!0})}),At(()=>{if(c==null||c(),c=void 0,o.value&&Mn(o.value)){const f=o.value;u.forEach(p=>{const d=n[p];d&&f.removeEventListener(p.slice(2).toLowerCase(),d,["onFocus","onBlur"].includes(p))}),o.value=void 0}}),t({triggerRef:o}),(f,p)=>f.virtualTriggering?On("v-if",!0):(J(),He(w(uw),lr({key:0},f.$attrs,{"aria-controls":w(s),"aria-describedby":w(i),"aria-expanded":w(l),"aria-haspopup":w(a)}),{default:de(()=>[Re(f.$slots,"default")]),_:3},16,["aria-controls","aria-describedby","aria-expanded","aria-haspopup"]))}});var dw=Ve(pw,[["__file","trigger.vue"]]);const wi="focus-trap.focus-after-trapped",xi="focus-trap.focus-after-released",mw="focus-trap.focusout-prevented",gu={cancelable:!0,bubbles:!1},hw={cancelable:!0,bubbles:!1},_u="focusAfterTrapped",vu="focusAfterReleased",gw=Symbol("elFocusTrap"),Za=L(),Zs=L(0),el=L(0);let Yo=0;const kd=e=>{const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0||r===document.activeElement?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t},yu=(e,t)=>{for(const n of e)if(!_w(n,t))return n},_w=(e,t)=>{if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1},vw=e=>{const t=kd(e),n=yu(t,e),r=yu(t.reverse(),e);return[n,r]},yw=e=>e instanceof HTMLInputElement&&"select"in e,Sn=(e,t)=>{if(e){const n=document.activeElement;jo(e,{preventScroll:!0}),el.value=window.performance.now(),e!==n&&yw(e)&&t&&e.select()}};function bu(e,t){const n=[...e],r=e.indexOf(t);return r!==-1&&n.splice(r,1),n}const bw=()=>{let e=[];return{push:r=>{const o=e[0];o&&r!==o&&o.pause(),e=bu(e,r),e.unshift(r)},remove:r=>{var o,s;e=bu(e,r),(s=(o=e[0])==null?void 0:o.resume)==null||s.call(o)}}},ww=(e,t=!1)=>{const n=document.activeElement;for(const r of e)if(Sn(r,t),document.activeElement!==n)return},wu=bw(),xw=()=>Zs.value>el.value,Qo=()=>{Za.value="pointer",Zs.value=window.performance.now()},xu=()=>{Za.value="keyboard",Zs.value=window.performance.now()},Sw=()=>(st(()=>{Yo===0&&(document.addEventListener("mousedown",Qo),document.addEventListener("touchstart",Qo),document.addEventListener("keydown",xu)),Yo++}),At(()=>{Yo--,Yo<=0&&(document.removeEventListener("mousedown",Qo),document.removeEventListener("touchstart",Qo),document.removeEventListener("keydown",xu))}),{focusReason:Za,lastUserFocusTimestamp:Zs,lastAutomatedFocusTimestamp:el}),Xo=e=>new CustomEvent(mw,{...hw,detail:e}),Ue={tab:"Tab",enter:"Enter",space:"Space",left:"ArrowLeft",up:"ArrowUp",right:"ArrowRight",down:"ArrowDown",esc:"Escape",delete:"Delete",backspace:"Backspace",numpadEnter:"NumpadEnter",pageUp:"PageUp",pageDown:"PageDown",home:"Home",end:"End"},nn=(e,t,{checkForDefaultPrevented:n=!0}={})=>o=>{const s=e==null?void 0:e(o);if(n===!1||!s)return t==null?void 0:t(o)},Gr=e=>{if(e.code&&e.code!=="Unidentified")return e.code;const t=Ew(e);if(t){if(Object.values(Ue).includes(t))return t;switch(t){case" ":return Ue.space;default:return""}}return""},Ew=e=>{let t=e.key&&e.key!=="Unidentified"?e.key:"";if(!t&&e.type==="keyup"&&K2()){const n=e.target;t=n.value.charAt(n.selectionStart-1)}return t};let yr=[];const Su=e=>{Gr(e)===Ue.esc&&yr.forEach(n=>n(e))},Pw=e=>{st(()=>{yr.length===0&&document.addEventListener("keydown",Su),Ye&&yr.push(e)}),At(()=>{yr=yr.filter(t=>t!==e),yr.length===0&&Ye&&document.removeEventListener("keydown",Su)})},Cw=q({name:"ElFocusTrap",inheritAttrs:!1,props:{loop:Boolean,trapped:Boolean,focusTrapEl:Object,focusStartEl:{type:[Object,String],default:"first"}},emits:[_u,vu,"focusin","focusout","focusout-prevented","release-requested"],setup(e,{emit:t}){const n=L();let r,o;const{focusReason:s}=Sw();Pw(m=>{e.trapped&&!i.paused&&t("release-requested",m)});const i={paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}},a=m=>{if(!e.loop&&!e.trapped||i.paused)return;const{altKey:g,ctrlKey:x,metaKey:b,currentTarget:C,shiftKey:v}=m,{loop:P}=e,$=Gr(m)===Ue.tab&&!g&&!x&&!b,B=document.activeElement;if($&&B){const T=C,[y,M]=vw(T);if(y&&M){if(!v&&B===M){const A=Xo({focusReason:s.value});t("focusout-prevented",A),A.defaultPrevented||(m.preventDefault(),P&&Sn(y,!0))}else if(v&&[y,T].includes(B)){const A=Xo({focusReason:s.value});t("focusout-prevented",A),A.defaultPrevented||(m.preventDefault(),P&&Sn(M,!0))}}else if(B===T){const A=Xo({focusReason:s.value});t("focusout-prevented",A),A.defaultPrevented||m.preventDefault()}}};gt(gw,{focusTrapRef:n,onKeydown:a}),ye(()=>e.focusTrapEl,m=>{m&&(n.value=m)},{immediate:!0}),ye([n],([m],[g])=>{m&&(m.addEventListener("keydown",a),m.addEventListener("focusin",u),m.addEventListener("focusout",f)),g&&(g.removeEventListener("keydown",a),g.removeEventListener("focusin",u),g.removeEventListener("focusout",f))});const l=m=>{t(_u,m)},c=m=>t(vu,m),u=m=>{const g=w(n);if(!g)return;const x=m.target,b=m.relatedTarget,C=x&&g.contains(x);e.trapped||b&&g.contains(b)||(r=b),C&&t("focusin",m),!i.paused&&e.trapped&&(C?o=x:Sn(o,!0))},f=m=>{const g=w(n);if(!(i.paused||!g))if(e.trapped){const x=m.relatedTarget;!Lr(x)&&!g.contains(x)&&setTimeout(()=>{if(!i.paused&&e.trapped){const b=Xo({focusReason:s.value});t("focusout-prevented",b),b.defaultPrevented||Sn(o,!0)}},0)}else{const x=m.target;x&&g.contains(x)||t("focusout",m)}};async function p(){await Kt();const m=w(n);if(m){wu.push(i);const g=m.contains(document.activeElement)?r:document.activeElement;if(r=g,!m.contains(g)){const b=new Event(wi,gu);m.addEventListener(wi,l),m.dispatchEvent(b),b.defaultPrevented||Kt(()=>{let C=e.focusStartEl;we(C)||(Sn(C),document.activeElement!==C&&(C="first")),C==="first"&&ww(kd(m),!0),(document.activeElement===g||C==="container")&&Sn(m)})}}}function d(){const m=w(n);if(m){m.removeEventListener(wi,l);const g=new CustomEvent(xi,{...gu,detail:{focusReason:s.value}});m.addEventListener(xi,c),m.dispatchEvent(g),!g.defaultPrevented&&(s.value=="keyboard"||!xw()||m.contains(document.activeElement))&&Sn(r??document.body),m.removeEventListener(xi,c),wu.remove(i),r=null,o=null}}return st(()=>{e.trapped&&p(),ye(()=>e.trapped,m=>{m?p():d()})}),At(()=>{e.trapped&&d(),n.value&&(n.value.removeEventListener("keydown",a),n.value.removeEventListener("focusin",u),n.value.removeEventListener("focusout",f),n.value=void 0)}),{onKeydown:a}}});function Tw(e,t,n,r,o,s){return Re(e.$slots,"default",{handleKeydown:e.onKeydown})}var Aw=Ve(Cw,[["render",Tw],["__file","focus-trap.vue"]]),_t="top",Ct="bottom",Tt="right",vt="left",tl="auto",Ho=[_t,Ct,Tt,vt],Br="start",Ao="end",Iw="clippingParents",Fd="viewport",eo="popper",Ow="reference",Eu=Ho.reduce(function(e,t){return e.concat([t+"-"+Br,t+"-"+Ao])},[]),nl=[].concat(Ho,[tl]).reduce(function(e,t){return e.concat([t,t+"-"+Br,t+"-"+Ao])},[]),Mw="beforeRead",Rw="read",Nw="afterRead",kw="beforeMain",Fw="main",Lw="afterMain",Dw="beforeWrite",Bw="write",$w="afterWrite",jw=[Mw,Rw,Nw,kw,Fw,Lw,Dw,Bw,$w];function Yt(e){return e?(e.nodeName||"").toLowerCase():null}function Lt(e){if(e==null)return window;if(e.toString()!=="[object Window]"){var t=e.ownerDocument;return t&&t.defaultView||window}return e}function $r(e){var t=Lt(e).Element;return e instanceof t||e instanceof Element}function Pt(e){var t=Lt(e).HTMLElement;return e instanceof t||e instanceof HTMLElement}function rl(e){if(typeof ShadowRoot>"u")return!1;var t=Lt(e).ShadowRoot;return e instanceof t||e instanceof ShadowRoot}function Hw(e){var t=e.state;Object.keys(t.elements).forEach(function(n){var r=t.styles[n]||{},o=t.attributes[n]||{},s=t.elements[n];!Pt(s)||!Yt(s)||(Object.assign(s.style,r),Object.keys(o).forEach(function(i){var a=o[i];a===!1?s.removeAttribute(i):s.setAttribute(i,a===!0?"":a)}))})}function Vw(e){var t=e.state,n={popper:{position:t.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(t.elements.popper.style,n.popper),t.styles=n,t.elements.arrow&&Object.assign(t.elements.arrow.style,n.arrow),function(){Object.keys(t.elements).forEach(function(r){var o=t.elements[r],s=t.attributes[r]||{},i=Object.keys(t.styles.hasOwnProperty(r)?t.styles[r]:n[r]),a=i.reduce(function(l,c){return l[c]="",l},{});!Pt(o)||!Yt(o)||(Object.assign(o.style,a),Object.keys(s).forEach(function(l){o.removeAttribute(l)}))})}}var Ld={name:"applyStyles",enabled:!0,phase:"write",fn:Hw,effect:Vw,requires:["computeStyles"]};function Gt(e){return e.split("-")[0]}var tr=Math.max,Is=Math.min,jr=Math.round;function Hr(e,t){t===void 0&&(t=!1);var n=e.getBoundingClientRect(),r=1,o=1;if(Pt(e)&&t){var s=e.offsetHeight,i=e.offsetWidth;i>0&&(r=jr(n.width)/i||1),s>0&&(o=jr(n.height)/s||1)}return{width:n.width/r,height:n.height/o,top:n.top/o,right:n.right/r,bottom:n.bottom/o,left:n.left/r,x:n.left/r,y:n.top/o}}function ol(e){var t=Hr(e),n=e.offsetWidth,r=e.offsetHeight;return Math.abs(t.width-n)<=1&&(n=t.width),Math.abs(t.height-r)<=1&&(r=t.height),{x:e.offsetLeft,y:e.offsetTop,width:n,height:r}}function Dd(e,t){var n=t.getRootNode&&t.getRootNode();if(e.contains(t))return!0;if(n&&rl(n)){var r=t;do{if(r&&e.isSameNode(r))return!0;r=r.parentNode||r.host}while(r)}return!1}function dn(e){return Lt(e).getComputedStyle(e)}function zw(e){return["table","td","th"].indexOf(Yt(e))>=0}function jn(e){return(($r(e)?e.ownerDocument:e.document)||window.document).documentElement}function ei(e){return Yt(e)==="html"?e:e.assignedSlot||e.parentNode||(rl(e)?e.host:null)||jn(e)}function Pu(e){return!Pt(e)||dn(e).position==="fixed"?null:e.offsetParent}function Ww(e){var t=navigator.userAgent.toLowerCase().indexOf("firefox")!==-1,n=navigator.userAgent.indexOf("Trident")!==-1;if(n&&Pt(e)){var r=dn(e);if(r.position==="fixed")return null}var o=ei(e);for(rl(o)&&(o=o.host);Pt(o)&&["html","body"].indexOf(Yt(o))<0;){var s=dn(o);if(s.transform!=="none"||s.perspective!=="none"||s.contain==="paint"||["transform","perspective"].indexOf(s.willChange)!==-1||t&&s.willChange==="filter"||t&&s.filter&&s.filter!=="none")return o;o=o.parentNode}return null}function Vo(e){for(var t=Lt(e),n=Pu(e);n&&zw(n)&&dn(n).position==="static";)n=Pu(n);return n&&(Yt(n)==="html"||Yt(n)==="body"&&dn(n).position==="static")?t:n||Ww(e)||t}function sl(e){return["top","bottom"].indexOf(e)>=0?"x":"y"}function go(e,t,n){return tr(e,Is(t,n))}function Uw(e,t,n){var r=go(e,t,n);return r>n?n:r}function Bd(){return{top:0,right:0,bottom:0,left:0}}function $d(e){return Object.assign({},Bd(),e)}function jd(e,t){return t.reduce(function(n,r){return n[r]=e,n},{})}var Gw=function(e,t){return e=typeof e=="function"?e(Object.assign({},t.rects,{placement:t.placement})):e,$d(typeof e!="number"?e:jd(e,Ho))};function Kw(e){var t,n=e.state,r=e.name,o=e.options,s=n.elements.arrow,i=n.modifiersData.popperOffsets,a=Gt(n.placement),l=sl(a),c=[vt,Tt].indexOf(a)>=0,u=c?"height":"width";if(!(!s||!i)){var f=Gw(o.padding,n),p=ol(s),d=l==="y"?_t:vt,m=l==="y"?Ct:Tt,g=n.rects.reference[u]+n.rects.reference[l]-i[l]-n.rects.popper[u],x=i[l]-n.rects.reference[l],b=Vo(s),C=b?l==="y"?b.clientHeight||0:b.clientWidth||0:0,v=g/2-x/2,P=f[d],R=C-p[u]-f[m],$=C/2-p[u]/2+v,B=go(P,$,R),T=l;n.modifiersData[r]=(t={},t[T]=B,t.centerOffset=B-$,t)}}function qw(e){var t=e.state,n=e.options,r=n.element,o=r===void 0?"[data-popper-arrow]":r;o!=null&&(typeof o=="string"&&(o=t.elements.popper.querySelector(o),!o)||!Dd(t.elements.popper,o)||(t.elements.arrow=o))}var Jw={name:"arrow",enabled:!0,phase:"main",fn:Kw,effect:qw,requires:["popperOffsets"],requiresIfExists:["preventOverflow"]};function Vr(e){return e.split("-")[1]}var Yw={top:"auto",right:"auto",bottom:"auto",left:"auto"};function Qw(e){var t=e.x,n=e.y,r=window,o=r.devicePixelRatio||1;return{x:jr(t*o)/o||0,y:jr(n*o)/o||0}}function Cu(e){var t,n=e.popper,r=e.popperRect,o=e.placement,s=e.variation,i=e.offsets,a=e.position,l=e.gpuAcceleration,c=e.adaptive,u=e.roundOffsets,f=e.isFixed,p=i.x,d=p===void 0?0:p,m=i.y,g=m===void 0?0:m,x=typeof u=="function"?u({x:d,y:g}):{x:d,y:g};d=x.x,g=x.y;var b=i.hasOwnProperty("x"),C=i.hasOwnProperty("y"),v=vt,P=_t,R=window;if(c){var $=Vo(n),B="clientHeight",T="clientWidth";if($===Lt(n)&&($=jn(n),dn($).position!=="static"&&a==="absolute"&&(B="scrollHeight",T="scrollWidth")),$=$,o===_t||(o===vt||o===Tt)&&s===Ao){P=Ct;var y=f&&$===R&&R.visualViewport?R.visualViewport.height:$[B];g-=y-r.height,g*=l?1:-1}if(o===vt||(o===_t||o===Ct)&&s===Ao){v=Tt;var M=f&&$===R&&R.visualViewport?R.visualViewport.width:$[T];d-=M-r.width,d*=l?1:-1}}var U=Object.assign({position:a},c&&Yw),A=u===!0?Qw({x:d,y:g}):{x:d,y:g};if(d=A.x,g=A.y,l){var I;return Object.assign({},U,(I={},I[P]=C?"0":"",I[v]=b?"0":"",I.transform=(R.devicePixelRatio||1)<=1?"translate("+d+"px, "+g+"px)":"translate3d("+d+"px, "+g+"px, 0)",I))}return Object.assign({},U,(t={},t[P]=C?g+"px":"",t[v]=b?d+"px":"",t.transform="",t))}function Xw(e){var t=e.state,n=e.options,r=n.gpuAcceleration,o=r===void 0?!0:r,s=n.adaptive,i=s===void 0?!0:s,a=n.roundOffsets,l=a===void 0?!0:a,c={placement:Gt(t.placement),variation:Vr(t.placement),popper:t.elements.popper,popperRect:t.rects.popper,gpuAcceleration:o,isFixed:t.options.strategy==="fixed"};t.modifiersData.popperOffsets!=null&&(t.styles.popper=Object.assign({},t.styles.popper,Cu(Object.assign({},c,{offsets:t.modifiersData.popperOffsets,position:t.options.strategy,adaptive:i,roundOffsets:l})))),t.modifiersData.arrow!=null&&(t.styles.arrow=Object.assign({},t.styles.arrow,Cu(Object.assign({},c,{offsets:t.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:l})))),t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-placement":t.placement})}var Hd={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:Xw,data:{}},Zo={passive:!0};function Zw(e){var t=e.state,n=e.instance,r=e.options,o=r.scroll,s=o===void 0?!0:o,i=r.resize,a=i===void 0?!0:i,l=Lt(t.elements.popper),c=[].concat(t.scrollParents.reference,t.scrollParents.popper);return s&&c.forEach(function(u){u.addEventListener("scroll",n.update,Zo)}),a&&l.addEventListener("resize",n.update,Zo),function(){s&&c.forEach(function(u){u.removeEventListener("scroll",n.update,Zo)}),a&&l.removeEventListener("resize",n.update,Zo)}}var Vd={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:Zw,data:{}},ex={left:"right",right:"left",bottom:"top",top:"bottom"};function us(e){return e.replace(/left|right|bottom|top/g,function(t){return ex[t]})}var tx={start:"end",end:"start"};function Tu(e){return e.replace(/start|end/g,function(t){return tx[t]})}function il(e){var t=Lt(e),n=t.pageXOffset,r=t.pageYOffset;return{scrollLeft:n,scrollTop:r}}function al(e){return Hr(jn(e)).left+il(e).scrollLeft}function nx(e){var t=Lt(e),n=jn(e),r=t.visualViewport,o=n.clientWidth,s=n.clientHeight,i=0,a=0;return r&&(o=r.width,s=r.height,/^((?!chrome|android).)*safari/i.test(navigator.userAgent)||(i=r.offsetLeft,a=r.offsetTop)),{width:o,height:s,x:i+al(e),y:a}}function rx(e){var t,n=jn(e),r=il(e),o=(t=e.ownerDocument)==null?void 0:t.body,s=tr(n.scrollWidth,n.clientWidth,o?o.scrollWidth:0,o?o.clientWidth:0),i=tr(n.scrollHeight,n.clientHeight,o?o.scrollHeight:0,o?o.clientHeight:0),a=-r.scrollLeft+al(e),l=-r.scrollTop;return dn(o||n).direction==="rtl"&&(a+=tr(n.clientWidth,o?o.clientWidth:0)-s),{width:s,height:i,x:a,y:l}}function ll(e){var t=dn(e),n=t.overflow,r=t.overflowX,o=t.overflowY;return/auto|scroll|overlay|hidden/.test(n+o+r)}function zd(e){return["html","body","#document"].indexOf(Yt(e))>=0?e.ownerDocument.body:Pt(e)&&ll(e)?e:zd(ei(e))}function _o(e,t){var n;t===void 0&&(t=[]);var r=zd(e),o=r===((n=e.ownerDocument)==null?void 0:n.body),s=Lt(r),i=o?[s].concat(s.visualViewport||[],ll(r)?r:[]):r,a=t.concat(i);return o?a:a.concat(_o(ei(i)))}function ra(e){return Object.assign({},e,{left:e.x,top:e.y,right:e.x+e.width,bottom:e.y+e.height})}function ox(e){var t=Hr(e);return t.top=t.top+e.clientTop,t.left=t.left+e.clientLeft,t.bottom=t.top+e.clientHeight,t.right=t.left+e.clientWidth,t.width=e.clientWidth,t.height=e.clientHeight,t.x=t.left,t.y=t.top,t}function Au(e,t){return t===Fd?ra(nx(e)):$r(t)?ox(t):ra(rx(jn(e)))}function sx(e){var t=_o(ei(e)),n=["absolute","fixed"].indexOf(dn(e).position)>=0,r=n&&Pt(e)?Vo(e):e;return $r(r)?t.filter(function(o){return $r(o)&&Dd(o,r)&&Yt(o)!=="body"}):[]}function ix(e,t,n){var r=t==="clippingParents"?sx(e):[].concat(t),o=[].concat(r,[n]),s=o[0],i=o.reduce(function(a,l){var c=Au(e,l);return a.top=tr(c.top,a.top),a.right=Is(c.right,a.right),a.bottom=Is(c.bottom,a.bottom),a.left=tr(c.left,a.left),a},Au(e,s));return i.width=i.right-i.left,i.height=i.bottom-i.top,i.x=i.left,i.y=i.top,i}function Wd(e){var t=e.reference,n=e.element,r=e.placement,o=r?Gt(r):null,s=r?Vr(r):null,i=t.x+t.width/2-n.width/2,a=t.y+t.height/2-n.height/2,l;switch(o){case _t:l={x:i,y:t.y-n.height};break;case Ct:l={x:i,y:t.y+t.height};break;case Tt:l={x:t.x+t.width,y:a};break;case vt:l={x:t.x-n.width,y:a};break;default:l={x:t.x,y:t.y}}var c=o?sl(o):null;if(c!=null){var u=c==="y"?"height":"width";switch(s){case Br:l[c]=l[c]-(t[u]/2-n[u]/2);break;case Ao:l[c]=l[c]+(t[u]/2-n[u]/2);break}}return l}function Io(e,t){t===void 0&&(t={});var n=t,r=n.placement,o=r===void 0?e.placement:r,s=n.boundary,i=s===void 0?Iw:s,a=n.rootBoundary,l=a===void 0?Fd:a,c=n.elementContext,u=c===void 0?eo:c,f=n.altBoundary,p=f===void 0?!1:f,d=n.padding,m=d===void 0?0:d,g=$d(typeof m!="number"?m:jd(m,Ho)),x=u===eo?Ow:eo,b=e.rects.popper,C=e.elements[p?x:u],v=ix($r(C)?C:C.contextElement||jn(e.elements.popper),i,l),P=Hr(e.elements.reference),R=Wd({reference:P,element:b,placement:o}),$=ra(Object.assign({},b,R)),B=u===eo?$:P,T={top:v.top-B.top+g.top,bottom:B.bottom-v.bottom+g.bottom,left:v.left-B.left+g.left,right:B.right-v.right+g.right},y=e.modifiersData.offset;if(u===eo&&y){var M=y[o];Object.keys(T).forEach(function(U){var A=[Tt,Ct].indexOf(U)>=0?1:-1,I=[_t,Ct].indexOf(U)>=0?"y":"x";T[U]+=M[I]*A})}return T}function ax(e,t){t===void 0&&(t={});var n=t,r=n.placement,o=n.boundary,s=n.rootBoundary,i=n.padding,a=n.flipVariations,l=n.allowedAutoPlacements,c=l===void 0?nl:l,u=Vr(r),f=u?a?Eu:Eu.filter(function(m){return Vr(m)===u}):Ho,p=f.filter(function(m){return c.indexOf(m)>=0});p.length===0&&(p=f);var d=p.reduce(function(m,g){return m[g]=Io(e,{placement:g,boundary:o,rootBoundary:s,padding:i})[Gt(g)],m},{});return Object.keys(d).sort(function(m,g){return d[m]-d[g]})}function lx(e){if(Gt(e)===tl)return[];var t=us(e);return[Tu(e),t,Tu(t)]}function cx(e){var t=e.state,n=e.options,r=e.name;if(!t.modifiersData[r]._skip){for(var o=n.mainAxis,s=o===void 0?!0:o,i=n.altAxis,a=i===void 0?!0:i,l=n.fallbackPlacements,c=n.padding,u=n.boundary,f=n.rootBoundary,p=n.altBoundary,d=n.flipVariations,m=d===void 0?!0:d,g=n.allowedAutoPlacements,x=t.options.placement,b=Gt(x),C=b===x,v=l||(C||!m?[us(x)]:lx(x)),P=[x].concat(v).reduce(function(_e,Ae){return _e.concat(Gt(Ae)===tl?ax(t,{placement:Ae,boundary:u,rootBoundary:f,padding:c,flipVariations:m,allowedAutoPlacements:g}):Ae)},[]),R=t.rects.reference,$=t.rects.popper,B=new Map,T=!0,y=P[0],M=0;M<P.length;M++){var U=P[M],A=Gt(U),I=Vr(U)===Br,z=[_t,Ct].indexOf(A)>=0,X=z?"width":"height",G=Io(t,{placement:U,boundary:u,rootBoundary:f,altBoundary:p,padding:c}),O=z?I?Tt:vt:I?Ct:_t;R[X]>$[X]&&(O=us(O));var S=us(O),V=[];if(s&&V.push(G[A]<=0),a&&V.push(G[O]<=0,G[S]<=0),V.every(function(_e){return _e})){y=U,T=!1;break}B.set(U,V)}if(T)for(var se=m?3:1,he=function(_e){var Ae=P.find(function(ke){var N=B.get(ke);if(N)return N.slice(0,_e).every(function(te){return te})});if(Ae)return y=Ae,"break"},re=se;re>0;re--){var ge=he(re);if(ge==="break")break}t.placement!==y&&(t.modifiersData[r]._skip=!0,t.placement=y,t.reset=!0)}}var ux={name:"flip",enabled:!0,phase:"main",fn:cx,requiresIfExists:["offset"],data:{_skip:!1}};function Iu(e,t,n){return n===void 0&&(n={x:0,y:0}),{top:e.top-t.height-n.y,right:e.right-t.width+n.x,bottom:e.bottom-t.height+n.y,left:e.left-t.width-n.x}}function Ou(e){return[_t,Tt,Ct,vt].some(function(t){return e[t]>=0})}function fx(e){var t=e.state,n=e.name,r=t.rects.reference,o=t.rects.popper,s=t.modifiersData.preventOverflow,i=Io(t,{elementContext:"reference"}),a=Io(t,{altBoundary:!0}),l=Iu(i,r),c=Iu(a,o,s),u=Ou(l),f=Ou(c);t.modifiersData[n]={referenceClippingOffsets:l,popperEscapeOffsets:c,isReferenceHidden:u,hasPopperEscaped:f},t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-reference-hidden":u,"data-popper-escaped":f})}var px={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:fx};function dx(e,t,n){var r=Gt(e),o=[vt,_t].indexOf(r)>=0?-1:1,s=typeof n=="function"?n(Object.assign({},t,{placement:e})):n,i=s[0],a=s[1];return i=i||0,a=(a||0)*o,[vt,Tt].indexOf(r)>=0?{x:a,y:i}:{x:i,y:a}}function mx(e){var t=e.state,n=e.options,r=e.name,o=n.offset,s=o===void 0?[0,0]:o,i=nl.reduce(function(u,f){return u[f]=dx(f,t.rects,s),u},{}),a=i[t.placement],l=a.x,c=a.y;t.modifiersData.popperOffsets!=null&&(t.modifiersData.popperOffsets.x+=l,t.modifiersData.popperOffsets.y+=c),t.modifiersData[r]=i}var hx={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:mx};function gx(e){var t=e.state,n=e.name;t.modifiersData[n]=Wd({reference:t.rects.reference,element:t.rects.popper,placement:t.placement})}var Ud={name:"popperOffsets",enabled:!0,phase:"read",fn:gx,data:{}};function _x(e){return e==="x"?"y":"x"}function vx(e){var t=e.state,n=e.options,r=e.name,o=n.mainAxis,s=o===void 0?!0:o,i=n.altAxis,a=i===void 0?!1:i,l=n.boundary,c=n.rootBoundary,u=n.altBoundary,f=n.padding,p=n.tether,d=p===void 0?!0:p,m=n.tetherOffset,g=m===void 0?0:m,x=Io(t,{boundary:l,rootBoundary:c,padding:f,altBoundary:u}),b=Gt(t.placement),C=Vr(t.placement),v=!C,P=sl(b),R=_x(P),$=t.modifiersData.popperOffsets,B=t.rects.reference,T=t.rects.popper,y=typeof g=="function"?g(Object.assign({},t.rects,{placement:t.placement})):g,M=typeof y=="number"?{mainAxis:y,altAxis:y}:Object.assign({mainAxis:0,altAxis:0},y),U=t.modifiersData.offset?t.modifiersData.offset[t.placement]:null,A={x:0,y:0};if($){if(s){var I,z=P==="y"?_t:vt,X=P==="y"?Ct:Tt,G=P==="y"?"height":"width",O=$[P],S=O+x[z],V=O-x[X],se=d?-T[G]/2:0,he=C===Br?B[G]:T[G],re=C===Br?-T[G]:-B[G],ge=t.elements.arrow,_e=d&&ge?ol(ge):{width:0,height:0},Ae=t.modifiersData["arrow#persistent"]?t.modifiersData["arrow#persistent"].padding:Bd(),ke=Ae[z],N=Ae[X],te=go(0,B[G],_e[G]),Z=v?B[G]/2-se-te-ke-M.mainAxis:he-te-ke-M.mainAxis,le=v?-B[G]/2+se+te+N+M.mainAxis:re+te+N+M.mainAxis,W=t.elements.arrow&&Vo(t.elements.arrow),h=W?P==="y"?W.clientTop||0:W.clientLeft||0:0,_=(I=U==null?void 0:U[P])!=null?I:0,E=O+Z-_-h,D=O+le-_,j=go(d?Is(S,E):S,O,d?tr(V,D):V);$[P]=j,A[P]=j-O}if(a){var F,ee=P==="x"?_t:vt,Y=P==="x"?Ct:Tt,K=$[R],H=R==="y"?"height":"width",fe=K+x[ee],ne=K-x[Y],ce=[_t,vt].indexOf(b)!==-1,me=(F=U==null?void 0:U[R])!=null?F:0,ve=ce?fe:K-B[H]-T[H]-me+M.altAxis,Me=ce?K+B[H]+T[H]-me-M.altAxis:ne,Ce=d&&ce?Uw(ve,K,Me):go(d?ve:fe,K,d?Me:ne);$[R]=Ce,A[R]=Ce-K}t.modifiersData[r]=A}}var yx={name:"preventOverflow",enabled:!0,phase:"main",fn:vx,requiresIfExists:["offset"]};function bx(e){return{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}}function wx(e){return e===Lt(e)||!Pt(e)?il(e):bx(e)}function xx(e){var t=e.getBoundingClientRect(),n=jr(t.width)/e.offsetWidth||1,r=jr(t.height)/e.offsetHeight||1;return n!==1||r!==1}function Sx(e,t,n){n===void 0&&(n=!1);var r=Pt(t),o=Pt(t)&&xx(t),s=jn(t),i=Hr(e,o),a={scrollLeft:0,scrollTop:0},l={x:0,y:0};return(r||!r&&!n)&&((Yt(t)!=="body"||ll(s))&&(a=wx(t)),Pt(t)?(l=Hr(t,!0),l.x+=t.clientLeft,l.y+=t.clientTop):s&&(l.x=al(s))),{x:i.left+a.scrollLeft-l.x,y:i.top+a.scrollTop-l.y,width:i.width,height:i.height}}function Ex(e){var t=new Map,n=new Set,r=[];e.forEach(function(s){t.set(s.name,s)});function o(s){n.add(s.name);var i=[].concat(s.requires||[],s.requiresIfExists||[]);i.forEach(function(a){if(!n.has(a)){var l=t.get(a);l&&o(l)}}),r.push(s)}return e.forEach(function(s){n.has(s.name)||o(s)}),r}function Px(e){var t=Ex(e);return jw.reduce(function(n,r){return n.concat(t.filter(function(o){return o.phase===r}))},[])}function Cx(e){var t;return function(){return t||(t=new Promise(function(n){Promise.resolve().then(function(){t=void 0,n(e())})})),t}}function Tx(e){var t=e.reduce(function(n,r){var o=n[r.name];return n[r.name]=o?Object.assign({},o,r,{options:Object.assign({},o.options,r.options),data:Object.assign({},o.data,r.data)}):r,n},{});return Object.keys(t).map(function(n){return t[n]})}var Mu={placement:"bottom",modifiers:[],strategy:"absolute"};function Ru(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return!t.some(function(r){return!(r&&typeof r.getBoundingClientRect=="function")})}function cl(e){e===void 0&&(e={});var t=e,n=t.defaultModifiers,r=n===void 0?[]:n,o=t.defaultOptions,s=o===void 0?Mu:o;return function(i,a,l){l===void 0&&(l=s);var c={placement:"bottom",orderedModifiers:[],options:Object.assign({},Mu,s),modifiersData:{},elements:{reference:i,popper:a},attributes:{},styles:{}},u=[],f=!1,p={state:c,setOptions:function(g){var x=typeof g=="function"?g(c.options):g;m(),c.options=Object.assign({},s,c.options,x),c.scrollParents={reference:$r(i)?_o(i):i.contextElement?_o(i.contextElement):[],popper:_o(a)};var b=Px(Tx([].concat(r,c.options.modifiers)));return c.orderedModifiers=b.filter(function(C){return C.enabled}),d(),p.update()},forceUpdate:function(){if(!f){var g=c.elements,x=g.reference,b=g.popper;if(Ru(x,b)){c.rects={reference:Sx(x,Vo(b),c.options.strategy==="fixed"),popper:ol(b)},c.reset=!1,c.placement=c.options.placement,c.orderedModifiers.forEach(function(T){return c.modifiersData[T.name]=Object.assign({},T.data)});for(var C=0;C<c.orderedModifiers.length;C++){if(c.reset===!0){c.reset=!1,C=-1;continue}var v=c.orderedModifiers[C],P=v.fn,R=v.options,$=R===void 0?{}:R,B=v.name;typeof P=="function"&&(c=P({state:c,options:$,name:B,instance:p})||c)}}}},update:Cx(function(){return new Promise(function(g){p.forceUpdate(),g(c)})}),destroy:function(){m(),f=!0}};if(!Ru(i,a))return p;p.setOptions(l).then(function(g){!f&&l.onFirstUpdate&&l.onFirstUpdate(g)});function d(){c.orderedModifiers.forEach(function(g){var x=g.name,b=g.options,C=b===void 0?{}:b,v=g.effect;if(typeof v=="function"){var P=v({state:c,name:x,instance:p,options:C}),R=function(){};u.push(P||R)}})}function m(){u.forEach(function(g){return g()}),u=[]}return p}}cl();var Ax=[Vd,Ud,Hd,Ld];cl({defaultModifiers:Ax});var Ix=[Vd,Ud,Hd,Ld,hx,ux,yx,Jw,px],Ox=cl({defaultModifiers:Ix});const Gd=qe({arrowOffset:{type:Number,default:5}}),Mx=["fixed","absolute"],Rx=qe({boundariesPadding:{type:Number,default:0},fallbackPlacements:{type:be(Array),default:void 0},gpuAcceleration:{type:Boolean,default:!0},offset:{type:Number,default:12},placement:{type:String,values:nl,default:"bottom"},popperOptions:{type:be(Object),default:()=>({})},strategy:{type:String,values:Mx,default:"absolute"}}),Kd=qe({...Rx,...Gd,id:String,style:{type:be([String,Array,Object])},className:{type:be([String,Array,Object])},effect:{type:be(String),default:"dark"},visible:Boolean,enterable:{type:Boolean,default:!0},pure:Boolean,focusOnShow:Boolean,trapping:Boolean,popperClass:{type:be([String,Array,Object])},popperStyle:{type:be([String,Array,Object])},referenceEl:{type:be(Object)},triggerTargetEl:{type:be(Object)},stopPopperMouseEvent:{type:Boolean,default:!0},virtualTriggering:Boolean,zIndex:Number,...Td(["ariaLabel"]),loop:Boolean}),Nx={mouseenter:e=>e instanceof MouseEvent,mouseleave:e=>e instanceof MouseEvent,focus:()=>!0,blur:()=>!0,close:()=>!0},kx=(e,t)=>{const n=L(!1),r=L();return{focusStartRef:r,trapped:n,onFocusAfterReleased:c=>{var u;((u=c.detail)==null?void 0:u.focusReason)!=="pointer"&&(r.value="first",t("blur"))},onFocusAfterTrapped:()=>{t("focus")},onFocusInTrap:c=>{e.visible&&!n.value&&(c.target&&(r.value=c.target),n.value=!0)},onFocusoutPrevented:c=>{e.trapping||(c.detail.focusReason==="pointer"&&c.preventDefault(),n.value=!1)},onReleaseRequested:()=>{n.value=!1,t("close")}}},Fx=(e,t=[])=>{const{placement:n,strategy:r,popperOptions:o}=e,s={placement:n,strategy:r,...o,modifiers:[...Dx(e),...t]};return Bx(s,o==null?void 0:o.modifiers),s},Lx=e=>{if(Ye)return ht(e)};function Dx(e){const{offset:t,gpuAcceleration:n,fallbackPlacements:r}=e;return[{name:"offset",options:{offset:[0,t??12]}},{name:"preventOverflow",options:{padding:{top:0,bottom:0,left:0,right:0}}},{name:"flip",options:{padding:5,fallbackPlacements:r}},{name:"computeStyles",options:{gpuAcceleration:n}}]}function Bx(e,t){t&&(e.modifiers=[...e.modifiers,...t??[]])}const $x=(e,t,n={})=>{const r={name:"updateState",enabled:!0,phase:"write",fn:({state:l})=>{const c=jx(l);Object.assign(i.value,c)},requires:["computeStyles"]},o=k(()=>{const{onFirstUpdate:l,placement:c,strategy:u,modifiers:f}=w(n);return{onFirstUpdate:l,placement:c||"bottom",strategy:u||"absolute",modifiers:[...f||[],r,{name:"applyStyles",enabled:!1}]}}),s=Ta(),i=L({styles:{popper:{position:w(o).strategy,left:"0",top:"0"},arrow:{position:"absolute"}},attributes:{}}),a=()=>{s.value&&(s.value.destroy(),s.value=void 0)};return ye(o,l=>{const c=w(s);c&&c.setOptions(l)},{deep:!0}),ye([e,t],([l,c])=>{a(),!(!l||!c)&&(s.value=Ox(l,c,w(o)))}),At(()=>{a()}),{state:k(()=>{var l;return{...((l=w(s))==null?void 0:l.state)||{}}}),styles:k(()=>w(i).styles),attributes:k(()=>w(i).attributes),update:()=>{var l;return(l=w(s))==null?void 0:l.update()},forceUpdate:()=>{var l;return(l=w(s))==null?void 0:l.forceUpdate()},instanceRef:k(()=>w(s))}};function jx(e){const t=Object.keys(e.elements),n=Zi(t.map(o=>[o,e.styles[o]||{}])),r=Zi(t.map(o=>[o,e.attributes[o]]));return{styles:n,attributes:r}}const Hx=0,Vx=e=>{const{popperInstanceRef:t,contentRef:n,triggerRef:r,role:o}=Te(Xa,void 0),s=L(),i=k(()=>e.arrowOffset),a=k(()=>({name:"eventListeners",enabled:!!e.visible})),l=k(()=>{var b;const C=w(s),v=(b=w(i))!=null?b:Hx;return{name:"arrow",enabled:!Fb(C),options:{element:C,padding:v}}}),c=k(()=>({onFirstUpdate:()=>{m()},...Fx(e,[w(l),w(a)])})),u=k(()=>Lx(e.referenceEl)||w(r)),{attributes:f,state:p,styles:d,update:m,forceUpdate:g,instanceRef:x}=$x(u,n,c);return ye(x,b=>t.value=b,{flush:"sync"}),st(()=>{ye(()=>{var b,C;return(C=(b=w(u))==null?void 0:b.getBoundingClientRect)==null?void 0:C.call(b)},()=>{m()})}),{attributes:f,arrowRef:s,contentRef:n,instanceRef:x,state:p,styles:d,role:o,forceUpdate:g,update:m}},zx=(e,{attributes:t,styles:n,role:r})=>{const{nextZIndex:o}=gd(),s=Be("popper"),i=k(()=>w(t).popper),a=L(Jt(e.zIndex)?e.zIndex:o()),l=k(()=>[s.b(),s.is("pure",e.pure),s.is(e.effect),e.popperClass]),c=k(()=>[{zIndex:w(a)},w(n).popper,e.popperStyle||{}]),u=k(()=>r.value==="dialog"?"false":void 0),f=k(()=>w(n).arrow||{});return{ariaModal:u,arrowStyle:f,contentAttrs:i,contentClass:l,contentStyle:c,contentZIndex:a,updateZIndex:()=>{a.value=Jt(e.zIndex)?e.zIndex:o()}}},Wx=q({name:"ElPopperContent"}),Ux=q({...Wx,props:Kd,emits:Nx,setup(e,{expose:t,emit:n}){const r=e,{focusStartRef:o,trapped:s,onFocusAfterReleased:i,onFocusAfterTrapped:a,onFocusInTrap:l,onFocusoutPrevented:c,onReleaseRequested:u}=kx(r,n),{attributes:f,arrowRef:p,contentRef:d,styles:m,instanceRef:g,role:x,update:b}=Vx(r),{ariaModal:C,arrowStyle:v,contentAttrs:P,contentClass:R,contentStyle:$,updateZIndex:B}=zx(r,{styles:m,attributes:f,role:x}),T=Te(du,void 0);gt(Id,{arrowStyle:v,arrowRef:p}),T&&gt(du,{...T,addInputId:pt,removeInputId:pt});let y;const M=(A=!0)=>{b(),A&&B()},U=()=>{M(!1),r.visible&&r.focusOnShow?s.value=!0:r.visible===!1&&(s.value=!1)};return st(()=>{ye(()=>r.triggerTargetEl,(A,I)=>{y==null||y(),y=void 0;const z=w(A||d.value),X=w(I||d.value);Mn(z)&&(y=ye([x,()=>r.ariaLabel,C,()=>r.id],G=>{["role","aria-label","aria-modal","id"].forEach((O,S)=>{Lr(G[S])?z.removeAttribute(O):z.setAttribute(O,G[S])})},{immediate:!0})),X!==z&&Mn(X)&&["role","aria-label","aria-modal","id"].forEach(G=>{X.removeAttribute(G)})},{immediate:!0}),ye(()=>r.visible,U,{immediate:!0})}),At(()=>{y==null||y(),y=void 0}),t({popperContentRef:d,popperInstanceRef:g,updatePopper:M,contentStyle:$}),(A,I)=>(J(),ae("div",lr({ref_key:"contentRef",ref:d},w(P),{style:w($),class:w(R),tabindex:"-1",onMouseenter:z=>A.$emit("mouseenter",z),onMouseleave:z=>A.$emit("mouseleave",z)}),[oe(w(Aw),{loop:A.loop,trapped:w(s),"trap-on-focus-in":!0,"focus-trap-el":w(d),"focus-start-el":w(o),onFocusAfterTrapped:w(a),onFocusAfterReleased:w(i),onFocusin:w(l),onFocusoutPrevented:w(c),onReleaseRequested:w(u)},{default:de(()=>[Re(A.$slots,"default")]),_:3},8,["loop","trapped","focus-trap-el","focus-start-el","onFocusAfterTrapped","onFocusAfterReleased","onFocusin","onFocusoutPrevented","onReleaseRequested"])],16,["onMouseenter","onMouseleave"]))}});var Gx=Ve(Ux,[["__file","content.vue"]]);const Kx=$n(rw),ul=Symbol("elTooltip"),qd=qe({to:{type:be([String,Object]),required:!0},disabled:Boolean}),Jd=qe({...D1,...Kd,appendTo:{type:qd.to.type},content:{type:String,default:""},rawContent:Boolean,persistent:Boolean,visible:{type:be(Boolean),default:null},transition:String,teleported:{type:Boolean,default:!0},disabled:Boolean,...Td(["ariaLabel"])}),Yd=qe({...Md,disabled:Boolean,trigger:{type:be([String,Array]),default:"hover"},triggerKeys:{type:be(Array),default:()=>[Ue.enter,Ue.numpadEnter,Ue.space]},focusOnTarget:Boolean}),qx=Xs({type:be(Boolean),default:null}),Jx=Xs({type:be(Function)}),Yx=e=>{const t=`update:${e}`,n=`onUpdate:${e}`,r=[t],o={[e]:qx,[n]:Jx};return{useModelToggle:({indicator:i,toggleReason:a,shouldHideWhenRouteChanges:l,shouldProceed:c,onShow:u,onHide:f})=>{const p=Qe(),{emit:d}=p,m=p.props,g=k(()=>ue(m[n])),x=k(()=>m[e]===null),b=B=>{i.value!==!0&&(i.value=!0,a&&(a.value=B),ue(u)&&u(B))},C=B=>{i.value!==!1&&(i.value=!1,a&&(a.value=B),ue(f)&&f(B))},v=B=>{if(m.disabled===!0||ue(c)&&!c())return;const T=g.value&&Ye;T&&d(t,!0),(x.value||!T)&&b(B)},P=B=>{if(m.disabled===!0||!Ye)return;const T=g.value&&Ye;T&&d(t,!1),(x.value||!T)&&C(B)},R=B=>{ho(B)&&(m.disabled&&B?g.value&&d(t,!1):i.value!==B&&(B?b():C()))},$=()=>{i.value?P():v()};return ye(()=>m[e],R),l&&p.appContext.config.globalProperties.$route!==void 0&&ye(()=>({...p.proxy.$route}),()=>{l.value&&i.value&&P()}),st(()=>{R(m[e])}),{hide:P,show:v,toggle:$,hasUpdateHandler:g}},useModelToggleProps:o,useModelToggleEmits:r}},{useModelToggleProps:Qx,useModelToggleEmits:Xx,useModelToggle:Zx}=Yx("visible"),eS=qe({...Od,...Qx,...Jd,...Yd,...Gd,showArrow:{type:Boolean,default:!0}}),tS=[...Xx,"before-show","before-hide","show","hide","open","close"],oa=(e,t)=>ie(e)?e.includes(t):e===t,hr=(e,t,n)=>r=>{oa(w(e),t)&&n(r)},nS=q({name:"ElTooltipTrigger"}),rS=q({...nS,props:Yd,setup(e,{expose:t}){const n=e,r=Be("tooltip"),{controlled:o,id:s,open:i,onOpen:a,onClose:l,onToggle:c}=Te(ul,void 0),u=L(null),f=()=>{if(w(o)||n.disabled)return!0},p=br(n,"trigger"),d=nn(f,hr(p,"hover",P=>{a(P),n.focusOnTarget&&P.target&&Kt(()=>{jo(P.target,{preventScroll:!0})})})),m=nn(f,hr(p,"hover",l)),g=nn(f,hr(p,"click",P=>{P.button===0&&c(P)})),x=nn(f,hr(p,"focus",a)),b=nn(f,hr(p,"focus",l)),C=nn(f,hr(p,"contextmenu",P=>{P.preventDefault(),c(P)})),v=nn(f,P=>{const R=Gr(P);n.triggerKeys.includes(R)&&(P.preventDefault(),c(P))});return t({triggerRef:u}),(P,R)=>(J(),He(w(dw),{id:w(s),"virtual-ref":P.virtualRef,open:w(i),"virtual-triggering":P.virtualTriggering,class:De(w(r).e("trigger")),onBlur:w(b),onClick:w(g),onContextmenu:w(C),onFocus:w(x),onMouseenter:w(d),onMouseleave:w(m),onKeydown:w(v)},{default:de(()=>[Re(P.$slots,"default")]),_:3},8,["id","virtual-ref","open","virtual-triggering","class","onBlur","onClick","onContextmenu","onFocus","onMouseenter","onMouseleave","onKeydown"]))}});var oS=Ve(rS,[["__file","trigger.vue"]]);const sS=q({__name:"teleport",props:qd,setup(e){return(t,n)=>t.disabled?Re(t.$slots,"default",{key:0}):(J(),He(hh,{key:1,to:t.to},[Re(t.$slots,"default")],8,["to"]))}});var iS=Ve(sS,[["__file","teleport.vue"]]);const aS=$n(iS),Qd=()=>{const e=Ha(),t=Ad(),n=k(()=>`${e.value}-popper-container-${t.prefix}`),r=k(()=>`#${n.value}`);return{id:n,selector:r}},lS=e=>{const t=document.createElement("div");return t.id=e,document.body.appendChild(t),t},cS=()=>{const{id:e,selector:t}=Qd();return Jf(()=>{Ye&&(document.body.querySelector(t.value)||lS(e.value))}),{id:e,selector:t}},ZE=e=>[...new Set(e)],uS=e=>!e&&e!==0?[]:ie(e)?e:[e],fS=q({name:"ElTooltipContent",inheritAttrs:!1}),pS=q({...fS,props:Jd,setup(e,{expose:t}){const n=e,{selector:r}=Qd(),o=Be("tooltip"),s=L(),i=pd(()=>{var S;return(S=s.value)==null?void 0:S.popperContentRef});let a;const{controlled:l,id:c,open:u,trigger:f,onClose:p,onOpen:d,onShow:m,onHide:g,onBeforeShow:x,onBeforeHide:b}=Te(ul,void 0),C=k(()=>n.transition||`${o.namespace.value}-fade-in-linear`),v=k(()=>n.persistent);At(()=>{a==null||a()});const P=k(()=>w(v)?!0:w(u)),R=k(()=>n.disabled?!1:w(u)),$=k(()=>n.appendTo||r.value),B=k(()=>{var S;return(S=n.style)!=null?S:{}}),T=L(!0),y=()=>{g(),O()&&jo(document.body,{preventScroll:!0}),T.value=!0},M=()=>{if(w(l))return!0},U=nn(M,()=>{n.enterable&&oa(w(f),"hover")&&d()}),A=nn(M,()=>{oa(w(f),"hover")&&p()}),I=()=>{var S,V;(V=(S=s.value)==null?void 0:S.updatePopper)==null||V.call(S),x==null||x()},z=()=>{b==null||b()},X=()=>{m()},G=()=>{n.virtualTriggering||p()},O=S=>{var V;const se=(V=s.value)==null?void 0:V.popperContentRef,he=(S==null?void 0:S.relatedTarget)||document.activeElement;return se==null?void 0:se.contains(he)};return ye(()=>w(u),S=>{S?(T.value=!1,a=s1(i,()=>{if(w(l))return;uS(w(f)).every(se=>se!=="hover"&&se!=="focus")&&p()},{detectIframe:!0})):a==null||a()},{flush:"post"}),ye(()=>n.content,()=>{var S,V;(V=(S=s.value)==null?void 0:S.updatePopper)==null||V.call(S)}),t({contentRef:s,isFocusInsideContent:O}),(S,V)=>(J(),He(w(aS),{disabled:!S.teleported,to:w($)},{default:de(()=>[w(P)||!T.value?(J(),He(Bo,{key:0,name:w(C),appear:!w(v),onAfterLeave:y,onBeforeEnter:I,onAfterEnter:X,onBeforeLeave:z,persisted:""},{default:de(()=>[zr(oe(w(Gx),lr({id:w(c),ref_key:"contentRef",ref:s},S.$attrs,{"aria-label":S.ariaLabel,"aria-hidden":T.value,"boundaries-padding":S.boundariesPadding,"fallback-placements":S.fallbackPlacements,"gpu-acceleration":S.gpuAcceleration,offset:S.offset,placement:S.placement,"popper-options":S.popperOptions,"arrow-offset":S.arrowOffset,strategy:S.strategy,effect:S.effect,enterable:S.enterable,pure:S.pure,"popper-class":S.popperClass,"popper-style":[S.popperStyle,w(B)],"reference-el":S.referenceEl,"trigger-target-el":S.triggerTargetEl,visible:w(R),"z-index":S.zIndex,loop:S.loop,onMouseenter:w(U),onMouseleave:w(A),onBlur:G,onClose:w(p)}),{default:de(()=>[Re(S.$slots,"default")]),_:3},16,["id","aria-label","aria-hidden","boundaries-padding","fallback-placements","gpu-acceleration","offset","placement","popper-options","arrow-offset","strategy","effect","enterable","pure","popper-class","popper-style","reference-el","trigger-target-el","visible","z-index","loop","onMouseenter","onMouseleave","onClose"]),[[Us,w(R)]])]),_:3},8,["name","appear"])):On("v-if",!0)]),_:3},8,["disabled","to"]))}});var dS=Ve(pS,[["__file","content.vue"]]);const mS=q({name:"ElTooltip"}),hS=q({...mS,props:eS,emits:tS,setup(e,{expose:t,emit:n}){const r=e;cS();const o=Be("tooltip"),s=Y2(),i=L(),a=L(),l=()=>{var v;const P=w(i);P&&((v=P.popperInstanceRef)==null||v.update())},c=L(!1),u=L(),{show:f,hide:p,hasUpdateHandler:d}=Zx({indicator:c,toggleReason:u}),{onOpen:m,onClose:g}=B1({showAfter:br(r,"showAfter"),hideAfter:br(r,"hideAfter"),autoClose:br(r,"autoClose"),open:f,close:p}),x=k(()=>ho(r.visible)&&!d.value),b=k(()=>[o.b(),r.popperClass]);gt(ul,{controlled:x,id:s,open:Or(c),trigger:br(r,"trigger"),onOpen:m,onClose:g,onToggle:v=>{w(c)?g(v):m(v)},onShow:()=>{n("show",u.value)},onHide:()=>{n("hide",u.value)},onBeforeShow:()=>{n("before-show",u.value)},onBeforeHide:()=>{n("before-hide",u.value)},updatePopper:l}),ye(()=>r.disabled,v=>{v&&c.value&&(c.value=!1)});const C=v=>{var P;return(P=a.value)==null?void 0:P.isFocusInsideContent(v)};return Kf(()=>c.value&&p()),t({popperRef:i,contentRef:a,isFocusInsideContent:C,updatePopper:l,onOpen:m,onClose:g,hide:p}),(v,P)=>(J(),He(w(Kx),{ref_key:"popperRef",ref:i,role:v.role},{default:de(()=>[oe(oS,{disabled:v.disabled,trigger:v.trigger,"trigger-keys":v.triggerKeys,"virtual-ref":v.virtualRef,"virtual-triggering":v.virtualTriggering,"focus-on-target":v.focusOnTarget},{default:de(()=>[v.$slots.default?Re(v.$slots,"default",{key:0}):On("v-if",!0)]),_:3},8,["disabled","trigger","trigger-keys","virtual-ref","virtual-triggering","focus-on-target"]),oe(dS,{ref_key:"contentRef",ref:a,"aria-label":v.ariaLabel,"boundaries-padding":v.boundariesPadding,content:v.content,disabled:v.disabled,effect:v.effect,enterable:v.enterable,"fallback-placements":v.fallbackPlacements,"hide-after":v.hideAfter,"gpu-acceleration":v.gpuAcceleration,offset:v.offset,persistent:v.persistent,"popper-class":w(b),"popper-style":v.popperStyle,placement:v.placement,"popper-options":v.popperOptions,"arrow-offset":v.arrowOffset,pure:v.pure,"raw-content":v.rawContent,"reference-el":v.referenceEl,"trigger-target-el":v.triggerTargetEl,"show-after":v.showAfter,strategy:v.strategy,teleported:v.teleported,transition:v.transition,"virtual-triggering":v.virtualTriggering,"z-index":v.zIndex,"append-to":v.appendTo,loop:v.loop},{default:de(()=>[Re(v.$slots,"content",{},()=>[v.rawContent?(J(),ae("span",{key:0,innerHTML:v.content},null,8,["innerHTML"])):(J(),ae("span",{key:1},ko(v.content),1))]),v.showArrow?(J(),He(w(iw),{key:0})):On("v-if",!0)]),_:3},8,["aria-label","boundaries-padding","content","disabled","effect","enterable","fallback-placements","hide-after","gpu-acceleration","offset","persistent","popper-class","popper-style","placement","popper-options","arrow-offset","pure","raw-content","reference-el","trigger-target-el","show-after","strategy","teleported","transition","virtual-triggering","z-index","append-to","loop"])]),_:3},8,["role"]))}});var gS=Ve(hS,[["__file","tooltip.vue"]]);const Xd=$n(gS),_S=qe({value:{type:[String,Number],default:""},max:{type:Number,default:99},isDot:Boolean,hidden:Boolean,type:{type:String,values:["primary","success","warning","info","danger"],default:"danger"},showZero:{type:Boolean,default:!0},color:String,badgeStyle:{type:be([String,Object,Array])},offset:{type:be(Array),default:[0,0]},badgeClass:{type:String}}),vS=q({name:"ElBadge"}),yS=q({...vS,props:_S,setup(e,{expose:t}){const n=e,r=Be("badge"),o=k(()=>n.isDot?"":Jt(n.value)&&Jt(n.max)?n.max<n.value?`${n.max}+`:`${n.value}`:`${n.value}`),s=k(()=>{var i,a,l,c,u;return[{backgroundColor:n.color,marginRight:ta(-((a=(i=n.offset)==null?void 0:i[0])!=null?a:0)),marginTop:ta((c=(l=n.offset)==null?void 0:l[1])!=null?c:0)},(u=n.badgeStyle)!=null?u:{}]});return t({content:o}),(i,a)=>(J(),ae("div",{class:De(w(r).b())},[Re(i.$slots,"default"),oe(Bo,{name:`${w(r).namespace.value}-zoom-in-center`,persisted:""},{default:de(()=>[zr(Q("sup",{class:De([w(r).e("content"),w(r).em("content",i.type),w(r).is("fixed",!!i.$slots.default),w(r).is("dot",i.isDot),w(r).is("hide-zero",!i.showZero&&i.value===0),i.badgeClass]),style:Qt(w(s))},[Re(i.$slots,"content",{value:w(o)},()=>[Da(ko(w(o)),1)])],6),[[Us,!i.hidden&&(w(o)||i.isDot||i.$slots.content)]])]),_:3},8,["name"])],2))}});var bS=Ve(yS,[["__file","badge.vue"]]);const wS=$n(bS);function et(e,t){xS(e)&&(e="100%");var n=SS(e);return e=t===360?e:Math.min(t,Math.max(0,parseFloat(e))),n&&(e=parseInt(String(e*t),10)/100),Math.abs(e-t)<1e-6?1:(t===360?e=(e<0?e%t+t:e%t)/parseFloat(String(t)):e=e%t/parseFloat(String(t)),e)}function es(e){return Math.min(1,Math.max(0,e))}function xS(e){return typeof e=="string"&&e.indexOf(".")!==-1&&parseFloat(e)===1}function SS(e){return typeof e=="string"&&e.indexOf("%")!==-1}function Zd(e){return e=parseFloat(e),(isNaN(e)||e<0||e>1)&&(e=1),e}function ts(e){return e<=1?"".concat(Number(e)*100,"%"):e}function Yn(e){return e.length===1?"0"+e:String(e)}function ES(e,t,n){return{r:et(e,255)*255,g:et(t,255)*255,b:et(n,255)*255}}function Nu(e,t,n){e=et(e,255),t=et(t,255),n=et(n,255);var r=Math.max(e,t,n),o=Math.min(e,t,n),s=0,i=0,a=(r+o)/2;if(r===o)i=0,s=0;else{var l=r-o;switch(i=a>.5?l/(2-r-o):l/(r+o),r){case e:s=(t-n)/l+(t<n?6:0);break;case t:s=(n-e)/l+2;break;case n:s=(e-t)/l+4;break}s/=6}return{h:s,s:i,l:a}}function Si(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*(6*n):n<1/2?t:n<2/3?e+(t-e)*(2/3-n)*6:e}function PS(e,t,n){var r,o,s;if(e=et(e,360),t=et(t,100),n=et(n,100),t===0)o=n,s=n,r=n;else{var i=n<.5?n*(1+t):n+t-n*t,a=2*n-i;r=Si(a,i,e+1/3),o=Si(a,i,e),s=Si(a,i,e-1/3)}return{r:r*255,g:o*255,b:s*255}}function ku(e,t,n){e=et(e,255),t=et(t,255),n=et(n,255);var r=Math.max(e,t,n),o=Math.min(e,t,n),s=0,i=r,a=r-o,l=r===0?0:a/r;if(r===o)s=0;else{switch(r){case e:s=(t-n)/a+(t<n?6:0);break;case t:s=(n-e)/a+2;break;case n:s=(e-t)/a+4;break}s/=6}return{h:s,s:l,v:i}}function CS(e,t,n){e=et(e,360)*6,t=et(t,100),n=et(n,100);var r=Math.floor(e),o=e-r,s=n*(1-t),i=n*(1-o*t),a=n*(1-(1-o)*t),l=r%6,c=[n,i,s,s,a,n][l],u=[a,n,n,i,s,s][l],f=[s,s,a,n,n,i][l];return{r:c*255,g:u*255,b:f*255}}function Fu(e,t,n,r){var o=[Yn(Math.round(e).toString(16)),Yn(Math.round(t).toString(16)),Yn(Math.round(n).toString(16))];return r&&o[0].startsWith(o[0].charAt(1))&&o[1].startsWith(o[1].charAt(1))&&o[2].startsWith(o[2].charAt(1))?o[0].charAt(0)+o[1].charAt(0)+o[2].charAt(0):o.join("")}function TS(e,t,n,r,o){var s=[Yn(Math.round(e).toString(16)),Yn(Math.round(t).toString(16)),Yn(Math.round(n).toString(16)),Yn(AS(r))];return o&&s[0].startsWith(s[0].charAt(1))&&s[1].startsWith(s[1].charAt(1))&&s[2].startsWith(s[2].charAt(1))&&s[3].startsWith(s[3].charAt(1))?s[0].charAt(0)+s[1].charAt(0)+s[2].charAt(0)+s[3].charAt(0):s.join("")}function AS(e){return Math.round(parseFloat(e)*255).toString(16)}function Lu(e){return bt(e)/255}function bt(e){return parseInt(e,16)}function IS(e){return{r:e>>16,g:(e&65280)>>8,b:e&255}}var sa={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkgrey:"#a9a9a9",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",goldenrod:"#daa520",gold:"#ffd700",gray:"#808080",green:"#008000",greenyellow:"#adff2f",grey:"#808080",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavenderblush:"#fff0f5",lavender:"#e6e6fa",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",rebeccapurple:"#663399",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"};function OS(e){var t={r:0,g:0,b:0},n=1,r=null,o=null,s=null,i=!1,a=!1;return typeof e=="string"&&(e=NS(e)),typeof e=="object"&&(en(e.r)&&en(e.g)&&en(e.b)?(t=ES(e.r,e.g,e.b),i=!0,a=String(e.r).substr(-1)==="%"?"prgb":"rgb"):en(e.h)&&en(e.s)&&en(e.v)?(r=ts(e.s),o=ts(e.v),t=CS(e.h,r,o),i=!0,a="hsv"):en(e.h)&&en(e.s)&&en(e.l)&&(r=ts(e.s),s=ts(e.l),t=PS(e.h,r,s),i=!0,a="hsl"),Object.prototype.hasOwnProperty.call(e,"a")&&(n=e.a)),n=Zd(n),{ok:i,format:e.format||a,r:Math.min(255,Math.max(t.r,0)),g:Math.min(255,Math.max(t.g,0)),b:Math.min(255,Math.max(t.b,0)),a:n}}var MS="[-\\+]?\\d+%?",RS="[-\\+]?\\d*\\.\\d+%?",Rn="(?:".concat(RS,")|(?:").concat(MS,")"),Ei="[\\s|\\(]+(".concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")\\s*\\)?"),Pi="[\\s|\\(]+(".concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")\\s*\\)?"),It={CSS_UNIT:new RegExp(Rn),rgb:new RegExp("rgb"+Ei),rgba:new RegExp("rgba"+Pi),hsl:new RegExp("hsl"+Ei),hsla:new RegExp("hsla"+Pi),hsv:new RegExp("hsv"+Ei),hsva:new RegExp("hsva"+Pi),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};function NS(e){if(e=e.trim().toLowerCase(),e.length===0)return!1;var t=!1;if(sa[e])e=sa[e],t=!0;else if(e==="transparent")return{r:0,g:0,b:0,a:0,format:"name"};var n=It.rgb.exec(e);return n?{r:n[1],g:n[2],b:n[3]}:(n=It.rgba.exec(e),n?{r:n[1],g:n[2],b:n[3],a:n[4]}:(n=It.hsl.exec(e),n?{h:n[1],s:n[2],l:n[3]}:(n=It.hsla.exec(e),n?{h:n[1],s:n[2],l:n[3],a:n[4]}:(n=It.hsv.exec(e),n?{h:n[1],s:n[2],v:n[3]}:(n=It.hsva.exec(e),n?{h:n[1],s:n[2],v:n[3],a:n[4]}:(n=It.hex8.exec(e),n?{r:bt(n[1]),g:bt(n[2]),b:bt(n[3]),a:Lu(n[4]),format:t?"name":"hex8"}:(n=It.hex6.exec(e),n?{r:bt(n[1]),g:bt(n[2]),b:bt(n[3]),format:t?"name":"hex"}:(n=It.hex4.exec(e),n?{r:bt(n[1]+n[1]),g:bt(n[2]+n[2]),b:bt(n[3]+n[3]),a:Lu(n[4]+n[4]),format:t?"name":"hex8"}:(n=It.hex3.exec(e),n?{r:bt(n[1]+n[1]),g:bt(n[2]+n[2]),b:bt(n[3]+n[3]),format:t?"name":"hex"}:!1)))))))))}function en(e){return!!It.CSS_UNIT.exec(String(e))}var kS=function(){function e(t,n){t===void 0&&(t=""),n===void 0&&(n={});var r;if(t instanceof e)return t;typeof t=="number"&&(t=IS(t)),this.originalInput=t;var o=OS(t);this.originalInput=t,this.r=o.r,this.g=o.g,this.b=o.b,this.a=o.a,this.roundA=Math.round(100*this.a)/100,this.format=(r=n.format)!==null&&r!==void 0?r:o.format,this.gradientType=n.gradientType,this.r<1&&(this.r=Math.round(this.r)),this.g<1&&(this.g=Math.round(this.g)),this.b<1&&(this.b=Math.round(this.b)),this.isValid=o.ok}return e.prototype.isDark=function(){return this.getBrightness()<128},e.prototype.isLight=function(){return!this.isDark()},e.prototype.getBrightness=function(){var t=this.toRgb();return(t.r*299+t.g*587+t.b*114)/1e3},e.prototype.getLuminance=function(){var t=this.toRgb(),n,r,o,s=t.r/255,i=t.g/255,a=t.b/255;return s<=.03928?n=s/12.92:n=Math.pow((s+.055)/1.055,2.4),i<=.03928?r=i/12.92:r=Math.pow((i+.055)/1.055,2.4),a<=.03928?o=a/12.92:o=Math.pow((a+.055)/1.055,2.4),.2126*n+.7152*r+.0722*o},e.prototype.getAlpha=function(){return this.a},e.prototype.setAlpha=function(t){return this.a=Zd(t),this.roundA=Math.round(100*this.a)/100,this},e.prototype.isMonochrome=function(){var t=this.toHsl().s;return t===0},e.prototype.toHsv=function(){var t=ku(this.r,this.g,this.b);return{h:t.h*360,s:t.s,v:t.v,a:this.a}},e.prototype.toHsvString=function(){var t=ku(this.r,this.g,this.b),n=Math.round(t.h*360),r=Math.round(t.s*100),o=Math.round(t.v*100);return this.a===1?"hsv(".concat(n,", ").concat(r,"%, ").concat(o,"%)"):"hsva(".concat(n,", ").concat(r,"%, ").concat(o,"%, ").concat(this.roundA,")")},e.prototype.toHsl=function(){var t=Nu(this.r,this.g,this.b);return{h:t.h*360,s:t.s,l:t.l,a:this.a}},e.prototype.toHslString=function(){var t=Nu(this.r,this.g,this.b),n=Math.round(t.h*360),r=Math.round(t.s*100),o=Math.round(t.l*100);return this.a===1?"hsl(".concat(n,", ").concat(r,"%, ").concat(o,"%)"):"hsla(".concat(n,", ").concat(r,"%, ").concat(o,"%, ").concat(this.roundA,")")},e.prototype.toHex=function(t){return t===void 0&&(t=!1),Fu(this.r,this.g,this.b,t)},e.prototype.toHexString=function(t){return t===void 0&&(t=!1),"#"+this.toHex(t)},e.prototype.toHex8=function(t){return t===void 0&&(t=!1),TS(this.r,this.g,this.b,this.a,t)},e.prototype.toHex8String=function(t){return t===void 0&&(t=!1),"#"+this.toHex8(t)},e.prototype.toHexShortString=function(t){return t===void 0&&(t=!1),this.a===1?this.toHexString(t):this.toHex8String(t)},e.prototype.toRgb=function(){return{r:Math.round(this.r),g:Math.round(this.g),b:Math.round(this.b),a:this.a}},e.prototype.toRgbString=function(){var t=Math.round(this.r),n=Math.round(this.g),r=Math.round(this.b);return this.a===1?"rgb(".concat(t,", ").concat(n,", ").concat(r,")"):"rgba(".concat(t,", ").concat(n,", ").concat(r,", ").concat(this.roundA,")")},e.prototype.toPercentageRgb=function(){var t=function(n){return"".concat(Math.round(et(n,255)*100),"%")};return{r:t(this.r),g:t(this.g),b:t(this.b),a:this.a}},e.prototype.toPercentageRgbString=function(){var t=function(n){return Math.round(et(n,255)*100)};return this.a===1?"rgb(".concat(t(this.r),"%, ").concat(t(this.g),"%, ").concat(t(this.b),"%)"):"rgba(".concat(t(this.r),"%, ").concat(t(this.g),"%, ").concat(t(this.b),"%, ").concat(this.roundA,")")},e.prototype.toName=function(){if(this.a===0)return"transparent";if(this.a<1)return!1;for(var t="#"+Fu(this.r,this.g,this.b,!1),n=0,r=Object.entries(sa);n<r.length;n++){var o=r[n],s=o[0],i=o[1];if(t===i)return s}return!1},e.prototype.toString=function(t){var n=!!t;t=t??this.format;var r=!1,o=this.a<1&&this.a>=0,s=!n&&o&&(t.startsWith("hex")||t==="name");return s?t==="name"&&this.a===0?this.toName():this.toRgbString():(t==="rgb"&&(r=this.toRgbString()),t==="prgb"&&(r=this.toPercentageRgbString()),(t==="hex"||t==="hex6")&&(r=this.toHexString()),t==="hex3"&&(r=this.toHexString(!0)),t==="hex4"&&(r=this.toHex8String(!0)),t==="hex8"&&(r=this.toHex8String()),t==="name"&&(r=this.toName()),t==="hsl"&&(r=this.toHslString()),t==="hsv"&&(r=this.toHsvString()),r||this.toHexString())},e.prototype.toNumber=function(){return(Math.round(this.r)<<16)+(Math.round(this.g)<<8)+Math.round(this.b)},e.prototype.clone=function(){return new e(this.toString())},e.prototype.lighten=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.l+=t/100,n.l=es(n.l),new e(n)},e.prototype.brighten=function(t){t===void 0&&(t=10);var n=this.toRgb();return n.r=Math.max(0,Math.min(255,n.r-Math.round(255*-(t/100)))),n.g=Math.max(0,Math.min(255,n.g-Math.round(255*-(t/100)))),n.b=Math.max(0,Math.min(255,n.b-Math.round(255*-(t/100)))),new e(n)},e.prototype.darken=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.l-=t/100,n.l=es(n.l),new e(n)},e.prototype.tint=function(t){return t===void 0&&(t=10),this.mix("white",t)},e.prototype.shade=function(t){return t===void 0&&(t=10),this.mix("black",t)},e.prototype.desaturate=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.s-=t/100,n.s=es(n.s),new e(n)},e.prototype.saturate=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.s+=t/100,n.s=es(n.s),new e(n)},e.prototype.greyscale=function(){return this.desaturate(100)},e.prototype.spin=function(t){var n=this.toHsl(),r=(n.h+t)%360;return n.h=r<0?360+r:r,new e(n)},e.prototype.mix=function(t,n){n===void 0&&(n=50);var r=this.toRgb(),o=new e(t).toRgb(),s=n/100,i={r:(o.r-r.r)*s+r.r,g:(o.g-r.g)*s+r.g,b:(o.b-r.b)*s+r.b,a:(o.a-r.a)*s+r.a};return new e(i)},e.prototype.analogous=function(t,n){t===void 0&&(t=6),n===void 0&&(n=30);var r=this.toHsl(),o=360/n,s=[this];for(r.h=(r.h-(o*t>>1)+720)%360;--t;)r.h=(r.h+o)%360,s.push(new e(r));return s},e.prototype.complement=function(){var t=this.toHsl();return t.h=(t.h+180)%360,new e(t)},e.prototype.monochromatic=function(t){t===void 0&&(t=6);for(var n=this.toHsv(),r=n.h,o=n.s,s=n.v,i=[],a=1/t;t--;)i.push(new e({h:r,s:o,v:s})),s=(s+a)%1;return i},e.prototype.splitcomplement=function(){var t=this.toHsl(),n=t.h;return[this,new e({h:(n+72)%360,s:t.s,l:t.l}),new e({h:(n+216)%360,s:t.s,l:t.l})]},e.prototype.onBackground=function(t){var n=this.toRgb(),r=new e(t).toRgb(),o=n.a+r.a*(1-n.a);return new e({r:(n.r*n.a+r.r*r.a*(1-n.a))/o,g:(n.g*n.a+r.g*r.a*(1-n.a))/o,b:(n.b*n.a+r.b*r.a*(1-n.a))/o,a:o})},e.prototype.triad=function(){return this.polyad(3)},e.prototype.tetrad=function(){return this.polyad(4)},e.prototype.polyad=function(t){for(var n=this.toHsl(),r=n.h,o=[this],s=360/t,i=1;i<t;i++)o.push(new e({h:(r+i*s)%360,s:n.s,l:n.l}));return o},e.prototype.equals=function(t){return this.toRgbString()===new e(t).toRgbString()},e}(),FS=(e=>(e[e.TEXT=1]="TEXT",e[e.CLASS=2]="CLASS",e[e.STYLE=4]="STYLE",e[e.PROPS=8]="PROPS",e[e.FULL_PROPS=16]="FULL_PROPS",e[e.HYDRATE_EVENTS=32]="HYDRATE_EVENTS",e[e.STABLE_FRAGMENT=64]="STABLE_FRAGMENT",e[e.KEYED_FRAGMENT=128]="KEYED_FRAGMENT",e[e.UNKEYED_FRAGMENT=256]="UNKEYED_FRAGMENT",e[e.NEED_PATCH=512]="NEED_PATCH",e[e.DYNAMIC_SLOTS=1024]="DYNAMIC_SLOTS",e[e.HOISTED=-1]="HOISTED",e[e.BAIL=-2]="BAIL",e))(FS||{});const no=e=>{const t=ie(e)?e:[e],n=[];return t.forEach(r=>{var o;ie(r)?n.push(...no(r)):Ut(r)&&((o=r.component)!=null&&o.subTree)?n.push(r,...no(r.component.subTree)):Ut(r)&&ie(r.children)?n.push(...no(r.children)):Ut(r)&&r.shapeFlag===2?n.push(...no(r.type())):n.push(r)}),n},En=new Map;if(Ye){let e;document.addEventListener("mousedown",t=>e=t),document.addEventListener("mouseup",t=>{if(e){for(const n of En.values())for(const{documentHandler:r}of n)r(t,e);e=void 0}})}function Du(e,t){let n=[];return ie(t.arg)?n=t.arg:Mn(t.arg)&&n.push(t.arg),function(r,o){const s=t.instance.popperRef,i=r.target,a=o==null?void 0:o.target,l=!t||!t.instance,c=!i||!a,u=e.contains(i)||e.contains(a),f=e===i,p=n.length&&n.some(m=>m==null?void 0:m.contains(i))||n.length&&n.includes(a),d=s&&(s.contains(i)||s.contains(a));l||c||u||f||p||d||t.value(r,o)}}const LS={beforeMount(e,t){En.has(e)||En.set(e,[]),En.get(e).push({documentHandler:Du(e,t),bindingFn:t.value})},updated(e,t){En.has(e)||En.set(e,[]);const n=En.get(e),r=n.findIndex(s=>s.bindingFn===t.oldValue),o={documentHandler:Du(e,t),bindingFn:t.value};r>=0?n.splice(r,1,o):n.push(o)},unmounted(e){En.delete(e)}},DS=q({name:"ElCollapseTransition"}),BS=q({...DS,setup(e){const t=Be("collapse-transition"),n=o=>{o.style.maxHeight="",o.style.overflow=o.dataset.oldOverflow,o.style.paddingTop=o.dataset.oldPaddingTop,o.style.paddingBottom=o.dataset.oldPaddingBottom},r={beforeEnter(o){o.dataset||(o.dataset={}),o.dataset.oldPaddingTop=o.style.paddingTop,o.dataset.oldPaddingBottom=o.style.paddingBottom,o.style.height&&(o.dataset.elExistsHeight=o.style.height),o.style.maxHeight=0,o.style.paddingTop=0,o.style.paddingBottom=0},enter(o){requestAnimationFrame(()=>{o.dataset.oldOverflow=o.style.overflow,o.dataset.elExistsHeight?o.style.maxHeight=o.dataset.elExistsHeight:o.scrollHeight!==0?o.style.maxHeight=`${o.scrollHeight}px`:o.style.maxHeight=0,o.style.paddingTop=o.dataset.oldPaddingTop,o.style.paddingBottom=o.dataset.oldPaddingBottom,o.style.overflow="hidden"})},afterEnter(o){o.style.maxHeight="",o.style.overflow=o.dataset.oldOverflow},enterCancelled(o){n(o)},beforeLeave(o){o.dataset||(o.dataset={}),o.dataset.oldPaddingTop=o.style.paddingTop,o.dataset.oldPaddingBottom=o.style.paddingBottom,o.dataset.oldOverflow=o.style.overflow,o.style.maxHeight=`${o.scrollHeight}px`,o.style.overflow="hidden"},leave(o){o.scrollHeight!==0&&(o.style.maxHeight=0,o.style.paddingTop=0,o.style.paddingBottom=0)},afterLeave(o){n(o)},leaveCancelled(o){n(o)}};return(o,s)=>(J(),He(Bo,lr({name:w(t).b()},Ah(r)),{default:de(()=>[Re(o.$slots,"default")]),_:3},16,["name"]))}});var $S=Ve(BS,[["__file","collapse-transition.vue"]]);const jS=$n($S),ut={placement:"top"},HS=q({name:"ElContainer"}),VS=q({...HS,props:qe({direction:{type:String,values:["horizontal","vertical"]}}),setup(e){const t=e,n=Oh(),r=Be("container"),o=k(()=>t.direction==="vertical"?!0:t.direction==="horizontal"?!1:n&&n.default?n.default().some(i=>{const a=i.type.name;return a==="ElHeader"||a==="ElFooter"}):!1);return(s,i)=>(J(),ae("section",{class:De([w(r).b(),w(r).is("vertical",w(o))])},[Re(s.$slots,"default")],2))}});var zS=Ve(VS,[["__file","container.vue"]]);const WS=q({name:"ElAside"}),US=q({...WS,props:{width:{type:String,default:null}},setup(e){const t=e,n=Be("aside"),r=k(()=>t.width?n.cssVarBlock({width:t.width}):{});return(o,s)=>(J(),ae("aside",{class:De(w(n).b()),style:Qt(w(r))},[Re(o.$slots,"default")],6))}});var em=Ve(US,[["__file","aside.vue"]]);const GS=q({name:"ElFooter"}),KS=q({...GS,props:{height:{type:String,default:null}},setup(e){const t=e,n=Be("footer"),r=k(()=>t.height?n.cssVarBlock({height:t.height}):{});return(o,s)=>(J(),ae("footer",{class:De(w(n).b()),style:Qt(w(r))},[Re(o.$slots,"default")],6))}});var tm=Ve(KS,[["__file","footer.vue"]]);const qS=q({name:"ElHeader"}),JS=q({...qS,props:{height:{type:String,default:null}},setup(e){const t=e,n=Be("header"),r=k(()=>t.height?n.cssVarBlock({height:t.height}):{});return(o,s)=>(J(),ae("header",{class:De(w(n).b()),style:Qt(w(r))},[Re(o.$slots,"default")],6))}});var nm=Ve(JS,[["__file","header.vue"]]);const YS=q({name:"ElMain"}),QS=q({...YS,setup(e){const t=Be("main");return(n,r)=>(J(),ae("main",{class:De(w(t).b())},[Re(n.$slots,"default")],2))}});var rm=Ve(QS,[["__file","main.vue"]]);const XS=$n(zS,{Aside:em,Footer:tm,Header:nm,Main:rm}),ZS=pr(em);pr(tm);pr(nm);const e4=pr(rm);let t4=class{constructor(t,n){this.parent=t,this.domNode=n,this.subIndex=0,this.subIndex=0,this.init()}init(){this.subMenuItems=this.domNode.querySelectorAll("li"),this.addListeners()}gotoSubIndex(t){t===this.subMenuItems.length?t=0:t<0&&(t=this.subMenuItems.length-1),this.subMenuItems[t].focus(),this.subIndex=t}addListeners(){const t=this.parent.domNode;Array.prototype.forEach.call(this.subMenuItems,n=>{n.addEventListener("keydown",r=>{const o=Gr(r);let s=!1;switch(o){case Ue.down:{this.gotoSubIndex(this.subIndex+1),s=!0;break}case Ue.up:{this.gotoSubIndex(this.subIndex-1),s=!0;break}case Ue.tab:{cs(t,"mouseleave");break}case Ue.enter:case Ue.numpadEnter:case Ue.space:{s=!0,r.currentTarget.click();break}}return s&&(r.preventDefault(),r.stopPropagation()),!1})})}},n4=class{constructor(t,n){this.domNode=t,this.submenu=null,this.submenu=null,this.init(n)}init(t){this.domNode.setAttribute("tabindex","0");const n=this.domNode.querySelector(`.${t}-menu`);n&&(this.submenu=new t4(this,n)),this.addListeners()}addListeners(){this.domNode.addEventListener("keydown",t=>{const n=Gr(t);let r=!1;switch(n){case Ue.down:{cs(t.currentTarget,"mouseenter"),this.submenu&&this.submenu.gotoSubIndex(0),r=!0;break}case Ue.up:{cs(t.currentTarget,"mouseenter"),this.submenu&&this.submenu.gotoSubIndex(this.submenu.subMenuItems.length-1),r=!0;break}case Ue.tab:{cs(t.currentTarget,"mouseleave");break}case Ue.enter:case Ue.numpadEnter:case Ue.space:{r=!0,t.currentTarget.click();break}}r&&t.preventDefault()})}},r4=class{constructor(t,n){this.domNode=t,this.init(n)}init(t){const n=this.domNode.childNodes;Array.from(n).forEach(r=>{r.nodeType===1&&new n4(r,t)})}};const o4=q({name:"ElMenuCollapseTransition"}),s4=q({...o4,setup(e){const t=Be("menu"),n={onBeforeEnter:r=>r.style.opacity="0.2",onEnter(r,o){Jo(r,`${t.namespace.value}-opacity-transition`),r.style.opacity="1",o()},onAfterEnter(r){bi(r,`${t.namespace.value}-opacity-transition`),r.style.opacity=""},onBeforeLeave(r){r.dataset||(r.dataset={}),M1(r,t.m("collapse"))?(bi(r,t.m("collapse")),r.dataset.oldOverflow=r.style.overflow,r.dataset.scrollWidth=r.clientWidth.toString(),Jo(r,t.m("collapse"))):(Jo(r,t.m("collapse")),r.dataset.oldOverflow=r.style.overflow,r.dataset.scrollWidth=r.clientWidth.toString(),bi(r,t.m("collapse"))),r.style.width=`${r.scrollWidth}px`,r.style.overflow="hidden"},onLeave(r){Jo(r,"horizontal-collapse-transition"),r.style.width=`${r.dataset.scrollWidth}px`}};return(r,o)=>(J(),He(Bo,lr({mode:"out-in"},w(n)),{default:de(()=>[Re(r.$slots,"default")]),_:3},16))}});var i4=Ve(s4,[["__file","menu-collapse-transition.vue"]]);function om(e,t){const n=k(()=>{let o=e.parent;const s=[t.value];for(;o.type.name!=="ElMenu";)o.props.index&&s.unshift(o.props.index),o=o.parent;return s});return{parentMenu:k(()=>{let o=e.parent;for(;o&&!["ElMenu","ElSubMenu"].includes(o.type.name);)o=o.parent;return o}),indexPath:n}}function a4(e){return k(()=>{const n=e.backgroundColor;return n?new kS(n).shade(20).toString():""})}const sm=(e,t)=>{const n=Be("menu");return k(()=>n.cssVarBlock({"text-color":e.textColor||"","hover-text-color":e.textColor||"","bg-color":e.backgroundColor||"","hover-bg-color":a4(e).value||"","active-color":e.activeTextColor||"",level:`${t}`}))},fl="rootMenu",Os="subMenu:",l4=qe({index:{type:String,required:!0},showTimeout:Number,hideTimeout:Number,popperClass:String,popperStyle:{type:be([String,Object])},disabled:Boolean,teleported:{type:Boolean,default:void 0},popperOffset:Number,expandCloseIcon:{type:wr},expandOpenIcon:{type:wr},collapseCloseIcon:{type:wr},collapseOpenIcon:{type:wr}}),Ci="ElSubMenu";var pl=q({name:Ci,props:l4,setup(e,{slots:t,expose:n}){const r=Qe(),{indexPath:o,parentMenu:s}=om(r,k(()=>e.index)),i=Be("menu"),a=Be("sub-menu"),l=Te(fl);l||Cs(Ci,"can not inject root menu");const c=Te(`${Os}${s.value.uid}`);c||Cs(Ci,"can not inject sub menu");const u=L({}),f=L({});let p;const d=L(!1),m=L(),g=L(),x=k(()=>c.level===0),b=k(()=>T.value==="horizontal"&&x.value?"bottom-start":"right-start"),C=k(()=>T.value==="horizontal"&&x.value||T.value==="vertical"&&!l.props.collapse?e.expandCloseIcon&&e.expandOpenIcon?$.value?e.expandOpenIcon:e.expandCloseIcon:H1:e.collapseCloseIcon&&e.collapseOpenIcon?$.value?e.collapseOpenIcon:e.collapseCloseIcon:W1),v=k(()=>{const re=e.teleported;return Ja(re)?x.value:re}),P=k(()=>l.props.collapse?`${i.namespace.value}-zoom-in-left`:`${i.namespace.value}-zoom-in-top`),R=k(()=>T.value==="horizontal"&&x.value?["bottom-start","bottom-end","top-start","top-end","right-start","left-start"]:["right-start","right","right-end","left-start","bottom-start","bottom-end","top-start","top-end"]),$=k(()=>l.openedMenus.includes(e.index)),B=k(()=>[...Object.values(u.value),...Object.values(f.value)].some(({active:re})=>re)),T=k(()=>l.props.mode),y=k(()=>l.props.persistent),M=Bn({index:e.index,indexPath:o,active:B}),U=sm(l.props,c.level+1),A=k(()=>{var re;return(re=e.popperOffset)!=null?re:l.props.popperOffset}),I=k(()=>{var re;return(re=e.popperClass)!=null?re:l.props.popperClass}),z=k(()=>{var re;return(re=e.popperStyle)!=null?re:l.props.popperStyle}),X=k(()=>{var re;return(re=e.showTimeout)!=null?re:l.props.showTimeout}),G=k(()=>{var re;return(re=e.hideTimeout)!=null?re:l.props.hideTimeout}),O=()=>{var re,ge,_e;return(_e=(ge=(re=g.value)==null?void 0:re.popperRef)==null?void 0:ge.popperInstanceRef)==null?void 0:_e.destroy()},S=re=>{re||O()},V=()=>{l.props.menuTrigger==="hover"&&l.props.mode==="horizontal"||l.props.collapse&&l.props.mode==="vertical"||e.disabled||l.handleSubMenuClick({index:e.index,indexPath:o.value,active:B.value})},se=(re,ge=X.value)=>{var _e;if(re.type!=="focus"){if(l.props.menuTrigger==="click"&&l.props.mode==="horizontal"||!l.props.collapse&&l.props.mode==="vertical"||e.disabled){c.mouseInChild.value=!0;return}c.mouseInChild.value=!0,p==null||p(),{stop:p}=ea(()=>{l.openMenu(e.index,o.value)},ge),v.value&&((_e=s.value.vnode.el)==null||_e.dispatchEvent(new MouseEvent("mouseenter"))),re.type==="mouseenter"&&re.target&&Kt(()=>{jo(re.target,{preventScroll:!0})})}},he=(re=!1)=>{var ge;if(l.props.menuTrigger==="click"&&l.props.mode==="horizontal"||!l.props.collapse&&l.props.mode==="vertical"){c.mouseInChild.value=!1;return}p==null||p(),c.mouseInChild.value=!1,{stop:p}=ea(()=>!d.value&&l.closeMenu(e.index,o.value),G.value),v.value&&re&&((ge=c.handleMouseleave)==null||ge.call(c,!0))};ye(()=>l.props.collapse,re=>S(!!re));{const re=_e=>{f.value[_e.index]=_e},ge=_e=>{delete f.value[_e.index]};gt(`${Os}${r.uid}`,{addSubMenu:re,removeSubMenu:ge,handleMouseleave:he,mouseInChild:d,level:c.level+1})}return n({opened:$}),st(()=>{l.addSubMenu(M),c.addSubMenu(M)}),At(()=>{c.removeSubMenu(M),l.removeSubMenu(M)}),()=>{var re;const ge=[(re=t.title)==null?void 0:re.call(t),ze(Dr,{class:a.e("icon-arrow"),style:{transform:$.value?e.expandCloseIcon&&e.expandOpenIcon||e.collapseCloseIcon&&e.collapseOpenIcon&&l.props.collapse?"none":"rotateZ(180deg)":"none"}},{default:()=>we(C.value)?ze(r.appContext.components[C.value]):ze(C.value)})],_e=l.isMenuPopup?ze(Xd,{ref:g,visible:$.value,effect:"light",pure:!0,offset:A.value,showArrow:!1,persistent:y.value,popperClass:I.value,popperStyle:z.value,placement:b.value,teleported:v.value,fallbackPlacements:R.value,transition:P.value,gpuAcceleration:!1},{content:()=>{var Ae;return ze("div",{class:[i.m(T.value),i.m("popup-container"),I.value],onMouseenter:ke=>se(ke,100),onMouseleave:()=>he(!0),onFocus:ke=>se(ke,100)},[ze("ul",{class:[i.b(),i.m("popup"),i.m(`popup-${b.value}`)],style:U.value},[(Ae=t.default)==null?void 0:Ae.call(t)])])},default:()=>ze("div",{class:a.e("title"),onClick:V},ge)}):ze(We,{},[ze("div",{class:a.e("title"),ref:m,onClick:V},ge),ze(jS,{},{default:()=>{var Ae;return zr(ze("ul",{role:"menu",class:[i.b(),i.m("inline")],style:U.value},[(Ae=t.default)==null?void 0:Ae.call(t)]),[[Us,$.value]])}})]);return ze("li",{class:[a.b(),a.is("active",B.value),a.is("opened",$.value),a.is("disabled",e.disabled)],role:"menuitem",ariaHaspopup:!0,ariaExpanded:$.value,onMouseenter:se,onMouseleave:()=>he(),onFocus:se},[_e])}}});const c4=qe({mode:{type:String,values:["horizontal","vertical"],default:"vertical"},defaultActive:{type:String,default:""},defaultOpeneds:{type:be(Array),default:()=>Cd([])},uniqueOpened:Boolean,router:Boolean,menuTrigger:{type:String,values:["hover","click"],default:"hover"},collapse:Boolean,backgroundColor:String,textColor:String,activeTextColor:String,closeOnClickOutside:Boolean,collapseTransition:{type:Boolean,default:!0},ellipsis:{type:Boolean,default:!0},popperOffset:{type:Number,default:6},ellipsisIcon:{type:wr,default:()=>C2},popperEffect:{type:be(String),default:"dark"},popperClass:String,popperStyle:{type:be([String,Object])},showTimeout:{type:Number,default:300},hideTimeout:{type:Number,default:300},persistent:{type:Boolean,default:!0}}),Ti=e=>ie(e)&&e.every(t=>we(t)),u4={close:(e,t)=>we(e)&&Ti(t),open:(e,t)=>we(e)&&Ti(t),select:(e,t,n,r)=>we(e)&&Ti(t)&&Ee(n)&&(Ja(r)||r instanceof Promise)},Bu=64;var f4=q({name:"ElMenu",props:c4,emits:u4,setup(e,{emit:t,slots:n,expose:r}){const o=Qe(),s=o.appContext.config.globalProperties.$router,i=L(),a=L(),l=Be("menu"),c=Be("sub-menu");let u=Bu;const f=L(-1),p=L(e.defaultOpeneds&&!e.collapse?e.defaultOpeneds.slice(0):[]),d=L(e.defaultActive),m=L({}),g=L({}),x=k(()=>e.mode==="horizontal"||e.mode==="vertical"&&e.collapse),b=()=>{const O=d.value&&m.value[d.value];if(!O||e.mode==="horizontal"||e.collapse)return;O.indexPath.forEach(V=>{const se=g.value[V];se&&C(V,se.indexPath)})},C=(O,S)=>{p.value.includes(O)||(e.uniqueOpened&&(p.value=p.value.filter(V=>S.includes(V))),p.value.push(O),t("open",O,S))},v=O=>{const S=p.value.indexOf(O);S!==-1&&p.value.splice(S,1)},P=(O,S)=>{v(O),t("close",O,S)},R=({index:O,indexPath:S})=>{p.value.includes(O)?P(O,S):C(O,S)},$=O=>{(e.mode==="horizontal"||e.collapse)&&(p.value=[]);const{index:S,indexPath:V}=O;if(!(Lr(S)||Lr(V)))if(e.router&&s){const se=O.route||S,he=s.push(se).then(re=>(re||(d.value=S),re));t("select",S,V,{index:S,indexPath:V,route:se},he)}else d.value=S,t("select",S,V,{index:S,indexPath:V})},B=O=>{var S;const V=m.value,se=V[O]||d.value&&V[d.value]||V[e.defaultActive];d.value=(S=se==null?void 0:se.index)!=null?S:O},T=O=>{const S=getComputedStyle(O),V=Number.parseInt(S.marginLeft,10),se=Number.parseInt(S.marginRight,10);return O.offsetWidth+V+se||0},y=()=>{if(!i.value)return-1;const O=Array.from(i.value.childNodes).filter(_e=>_e.nodeName!=="#comment"&&(_e.nodeName!=="#text"||_e.nodeValue)),S=getComputedStyle(i.value),V=Number.parseInt(S.paddingLeft,10),se=Number.parseInt(S.paddingRight,10),he=i.value.clientWidth-V-se;let re=0,ge=0;return O.forEach((_e,Ae)=>{re+=T(_e),re<=he-u&&(ge=Ae+1)}),ge===O.length?-1:ge},M=O=>g.value[O].indexPath,U=(O,S=33.34)=>{let V;return()=>{V&&clearTimeout(V),V=setTimeout(()=>{O()},S)}};let A=!0;const I=()=>{const O=ht(a);if(O&&(u=T(O)||Bu),f.value===y())return;const S=()=>{f.value=-1,Kt(()=>{f.value=y()})};A?S():U(S)(),A=!1};ye(()=>e.defaultActive,O=>{m.value[O]||(d.value=""),B(O)}),ye(()=>e.collapse,O=>{O&&(p.value=[])}),ye(m.value,b);let z;pp(()=>{e.mode==="horizontal"&&e.ellipsis?z=Ya(i,I).stop:z==null||z()});const X=L(!1);{const O=he=>{g.value[he.index]=he},S=he=>{delete g.value[he.index]};gt(fl,Bn({props:e,openedMenus:p,items:m,subMenus:g,activeIndex:d,isMenuPopup:x,addMenuItem:he=>{m.value[he.index]=he},removeMenuItem:he=>{delete m.value[he.index]},addSubMenu:O,removeSubMenu:S,openMenu:C,closeMenu:P,handleMenuItemClick:$,handleSubMenuClick:R})),gt(`${Os}${o.uid}`,{addSubMenu:O,removeSubMenu:S,mouseInChild:X,level:0})}st(()=>{e.mode==="horizontal"&&new r4(o.vnode.el,l.namespace.value)}),r({open:S=>{const{indexPath:V}=g.value[S];V.forEach(se=>C(se,V))},close:v,updateActiveIndex:B,handleResize:I});const G=sm(e,0);return()=>{var O,S;let V=(S=(O=n.default)==null?void 0:O.call(n))!=null?S:[];const se=[];if(e.mode==="horizontal"&&i.value){const ge=no(V).filter(ke=>(ke==null?void 0:ke.shapeFlag)!==8),_e=f.value===-1?ge:ge.slice(0,f.value),Ae=f.value===-1?[]:ge.slice(f.value);Ae!=null&&Ae.length&&e.ellipsis&&(V=_e,se.push(ze(pl,{ref:a,index:"sub-menu-more",class:c.e("hide-arrow"),popperOffset:e.popperOffset},{title:()=>ze(Dr,{class:c.e("icon-more")},{default:()=>ze(e.ellipsisIcon)}),default:()=>Ae})))}const he=e.closeOnClickOutside?[[LS,()=>{p.value.length&&(X.value||(p.value.forEach(ge=>t("close",ge,M(ge))),p.value=[]))}]]:[],re=zr(ze("ul",{key:String(e.collapse),role:"menubar",ref:i,style:G.value,class:{[l.b()]:!0,[l.m(e.mode)]:!0,[l.m("collapse")]:e.collapse}},[...V,...se]),he);return e.collapseTransition&&e.mode==="vertical"?ze(i4,()=>re):re}}});const p4=qe({index:{type:be([String,null]),default:null},route:{type:be([String,Object])},disabled:Boolean}),d4={click:e=>we(e.index)&&ie(e.indexPath)},ia="ElMenuItem",m4=q({name:ia}),h4=q({...m4,props:p4,emits:d4,setup(e,{expose:t,emit:n}){const r=e;jb(r.index)&&void 0;const o=Qe(),s=Te(fl),i=Be("menu"),a=Be("menu-item");s||Cs(ia,"can not inject root menu");const{parentMenu:l,indexPath:c}=om(o,br(r,"index")),u=Te(`${Os}${l.value.uid}`);u||Cs(ia,"can not inject sub menu");const f=k(()=>r.index===s.activeIndex),p=Bn({index:r.index,indexPath:c,active:f}),d=()=>{r.disabled||(s.handleMenuItemClick({index:r.index,indexPath:c.value,route:r.route}),n("click",p))};return st(()=>{u.addSubMenu(p),s.addMenuItem(p)}),At(()=>{u.removeSubMenu(p),s.removeMenuItem(p)}),t({parentMenu:l,rootMenu:s,active:f,nsMenu:i,nsMenuItem:a,handleClick:d}),(m,g)=>(J(),ae("li",{class:De([w(a).b(),w(a).is("active",w(f)),w(a).is("disabled",m.disabled)]),role:"menuitem",tabindex:"-1",onClick:d},[w(l).type.name==="ElMenu"&&w(s).props.collapse&&m.$slots.title?(J(),He(w(Xd),{key:0,effect:w(s).props.popperEffect,placement:"right","fallback-placements":["left"],persistent:w(s).props.persistent,"focus-on-target":""},{content:de(()=>[Re(m.$slots,"title")]),default:de(()=>[Q("div",{class:De(w(i).be("tooltip","trigger"))},[Re(m.$slots,"default")],2)]),_:3},8,["effect","persistent"])):(J(),ae(We,{key:1},[Re(m.$slots,"default"),Re(m.$slots,"title")],64))],2))}});var im=Ve(h4,[["__file","menu-item.vue"]]);const g4={title:String},_4=q({name:"ElMenuItemGroup"}),v4=q({..._4,props:g4,setup(e){const t=Be("menu-item-group");return(n,r)=>(J(),ae("li",{class:De(w(t).b())},[Q("div",{class:De(w(t).e("title"))},[n.$slots.title?Re(n.$slots,"title",{key:1}):(J(),ae(We,{key:0},[Da(ko(n.title),1)],64))],2),Q("ul",null,[Re(n.$slots,"default")])],2))}});var am=Ve(v4,[["__file","menu-item-group.vue"]]);const y4=$n(f4,{MenuItem:im,MenuItemGroup:am,SubMenu:pl}),b4=pr(im);pr(am);pr(pl);const lm=["primary","success","info","warning","error"],cm=["top","top-left","top-right","bottom","bottom-left","bottom-right"],Oo="top",tt=Cd({customClass:"",dangerouslyUseHTMLString:!1,duration:3e3,icon:void 0,id:"",message:"",onClose:void 0,showClose:!1,type:"info",plain:!1,offset:16,placement:void 0,zIndex:0,grouping:!1,repeatNum:1,appendTo:Ye?document.body:void 0}),w4=qe({customClass:{type:String,default:tt.customClass},dangerouslyUseHTMLString:{type:Boolean,default:tt.dangerouslyUseHTMLString},duration:{type:Number,default:tt.duration},icon:{type:wr,default:tt.icon},id:{type:String,default:tt.id},message:{type:be([String,Object,Function]),default:tt.message},onClose:{type:be(Function),default:tt.onClose},showClose:{type:Boolean,default:tt.showClose},type:{type:String,values:lm,default:tt.type},plain:{type:Boolean,default:tt.plain},offset:{type:Number,default:tt.offset},placement:{type:String,values:cm,default:tt.placement},zIndex:{type:Number,default:tt.zIndex},grouping:{type:Boolean,default:tt.grouping},repeatNum:{type:Number,default:tt.repeatNum}}),x4={destroy:()=>!0},Rt=$s({}),S4=e=>(Rt[e]||(Rt[e]=$s([])),Rt[e]),E4=(e,t)=>{const n=Rt[t]||[],r=n.findIndex(i=>i.id===e),o=n[r];let s;return r>0&&(s=n[r-1]),{current:o,prev:s}},P4=(e,t)=>{const{prev:n}=E4(e,t);return n?n.vm.exposed.bottom.value:0},C4=(e,t,n)=>(Rt[n]||[]).findIndex(s=>s.id===e)>0?16:t,T4=q({name:"ElMessage"}),A4=q({...T4,props:w4,emits:x4,setup(e,{expose:t,emit:n}){const r=e,{Close:o}=G2,s=L(!1),{ns:i,zIndex:a}=A1("message"),{currentZIndex:l,nextZIndex:c}=a,u=L(),f=L(!1),p=L(0);let d;const m=k(()=>r.type?r.type==="error"?"danger":r.type:"info"),g=k(()=>{const A=r.type;return{[i.bm("icon",A)]:A&&fu[A]}}),x=k(()=>r.icon||fu[r.type]||""),b=k(()=>r.placement||Oo),C=k(()=>P4(r.id,b.value)),v=k(()=>C4(r.id,r.offset,b.value)+C.value),P=k(()=>p.value+v.value),R=k(()=>b.value.includes("left")?i.is("left"):b.value.includes("right")?i.is("right"):i.is("center")),$=k(()=>b.value.startsWith("top")?"top":"bottom"),B=k(()=>({[$.value]:`${v.value}px`,zIndex:l.value}));function T(){r.duration!==0&&({stop:d}=ea(()=>{M()},r.duration))}function y(){d==null||d()}function M(){f.value=!1,Kt(()=>{var A;s.value||((A=r.onClose)==null||A.call(r),n("destroy"))})}function U(A){Gr(A)===Ue.esc&&M()}return st(()=>{T(),c(),f.value=!0}),ye(()=>r.repeatNum,()=>{y(),T()}),er(document,"keydown",U),Ya(u,()=>{p.value=u.value.getBoundingClientRect().height}),t({visible:f,bottom:P,close:M}),(A,I)=>(J(),He(Bo,{name:w(i).b("fade"),onBeforeEnter:z=>s.value=!0,onBeforeLeave:A.onClose,onAfterLeave:z=>A.$emit("destroy"),persisted:""},{default:de(()=>[zr(Q("div",{id:A.id,ref_key:"messageRef",ref:u,class:De([w(i).b(),{[w(i).m(A.type)]:A.type},w(i).is("closable",A.showClose),w(i).is("plain",A.plain),w(i).is("bottom",w($)==="bottom"),w(R),A.customClass]),style:Qt(w(B)),role:"alert",onMouseenter:y,onMouseleave:T},[A.repeatNum>1?(J(),He(w(wS),{key:0,value:A.repeatNum,type:w(m),class:De(w(i).e("badge"))},null,8,["value","type","class"])):On("v-if",!0),w(x)?(J(),He(w(Dr),{key:1,class:De([w(i).e("icon"),w(g)])},{default:de(()=>[(J(),He(Th(w(x))))]),_:1},8,["class"])):On("v-if",!0),Re(A.$slots,"default",{},()=>[A.dangerouslyUseHTMLString?(J(),ae(We,{key:1},[On(" Caution here, message could've been compromised, never use user's input as message "),Q("p",{class:De(w(i).e("content")),innerHTML:A.message},null,10,["innerHTML"])],2112)):(J(),ae("p",{key:0,class:De(w(i).e("content"))},ko(A.message),3))]),A.showClose?(J(),He(w(Dr),{key:2,class:De(w(i).e("closeBtn")),onClick:qg(M,["stop"])},{default:de(()=>[oe(w(o))]),_:1},8,["class","onClick"])):On("v-if",!0)],46,["id"]),[[Us,f.value]])]),_:3},8,["name","onBeforeEnter","onBeforeLeave","onAfterLeave"]))}});var I4=Ve(A4,[["__file","message.vue"]]);let O4=1;const M4=e=>{if(!e.appendTo)e.appendTo=document.body;else if(we(e.appendTo)){let n=document.querySelector(e.appendTo);Mn(n)||(n=document.body),e.appendTo=n}},R4=e=>{!e.placement&&we(ut.placement)&&ut.placement&&(e.placement=ut.placement),e.placement||(e.placement=Oo),cm.includes(e.placement)||(e.placement=Oo)},um=e=>{const t=!e||we(e)||Ut(e)||ue(e)?{message:e}:e,n={...tt,...t};return M4(n),R4(n),ho(ut.grouping)&&!n.grouping&&(n.grouping=ut.grouping),Jt(ut.duration)&&n.duration===3e3&&(n.duration=ut.duration),Jt(ut.offset)&&n.offset===16&&(n.offset=ut.offset),ho(ut.showClose)&&!n.showClose&&(n.showClose=ut.showClose),ho(ut.plain)&&!n.plain&&(n.plain=ut.plain),n},N4=e=>{const t=e.props.placement||Oo,n=Rt[t],r=n.indexOf(e);if(r===-1)return;n.splice(r,1);const{handler:o}=e;o.close()},k4=({appendTo:e,...t},n)=>{const r=`message_${O4++}`,o=t.onClose,s=document.createElement("div"),i={...t,id:r,onClose:()=>{o==null||o(),N4(u)},onDestroy:()=>{ic(null,s)}},a=oe(I4,i,ue(i.message)||Ut(i.message)?{default:ue(i.message)?i.message:()=>i.message}:null);a.appContext=n||ar._context,ic(a,s),e.appendChild(s.firstElementChild);const l=a.component,u={id:r,vnode:a,vm:l,handler:{close:()=>{l.exposed.close()}},props:a.component.props};return u},ar=(e={},t)=>{if(!Ye)return{close:()=>{}};const n=um(e),r=S4(n.placement||Oo);if(n.grouping&&r.length){const s=r.find(({vnode:i})=>{var a;return((a=i.props)==null?void 0:a.message)===n.message});if(s)return s.props.repeatNum+=1,s.props.type=n.type,s.handler}if(Jt(ut.max)&&r.length>=ut.max)return{close:()=>{}};const o=k4(n,t);return r.push(o),o.handler};lm.forEach(e=>{ar[e]=(t={},n)=>{const r=um(t);return ar({...r,type:e},n)}});function F4(e){for(const t in Rt)if(Pe(Rt,t)){const n=[...Rt[t]];for(const r of n)(!e||e===r.props.type)&&r.handler.close()}}function L4(e){if(!Rt[e])return;[...Rt[e]].forEach(n=>n.handler.close())}ar.closeAll=F4;ar.closeAllByPlacement=L4;ar._context=null;const Oe=R1(ar,"$message"),ti=(e,t)=>{const n=e.__vccOpts||e;for(const[r,o]of t)n[r]=o;return n},D4={__name:"Sidebar",setup(e){const t=qp(),n=k(()=>t.path);return(r,o)=>{const s=Dr,i=b4,a=y4;return J(),He(a,{"default-active":n.value,class:"sidebar-menu",router:"",collapse:!1,mode:"vertical"},{default:de(()=>[oe(i,{index:"/"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(h2))]),_:1}),o[0]||(o[0]=Q("span",null,"首页",-1))]),_:1}),oe(i,{index:"/items"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(K1))]),_:1}),o[1]||(o[1]=Q("span",null,"物品",-1))]),_:1}),oe(i,{index:"/bag"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(J1))]),_:1}),o[2]||(o[2]=Q("span",null,"背包",-1))]),_:1}),oe(i,{index:"/map"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(b2))]),_:1}),o[3]||(o[3]=Q("span",null,"地图",-1))]),_:1}),oe(i,{index:"/combat"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(u2))]),_:1}),o[4]||(o[4]=Q("span",null,"战斗",-1))]),_:1}),oe(i,{index:"/story"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(A2))]),_:1}),o[5]||(o[5]=Q("span",null,"剧情",-1))]),_:1}),oe(i,{index:"/shop"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(D2))]),_:1}),o[6]||(o[6]=Q("span",null,"商城",-1))]),_:1}),oe(i,{index:"/craft-planner"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(j2))]),_:1}),o[7]||(o[7]=Q("span",null,"做装",-1))]),_:1}),oe(i,{index:"/settings"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(F2))]),_:1}),o[8]||(o[8]=Q("span",null,"设置",-1))]),_:1}),oe(i,{index:"/help"},{default:de(()=>[oe(s,null,{default:de(()=>[oe(w(M2))]),_:1}),o[9]||(o[9]=Q("span",null,"帮助",-1))]),_:1})]),_:1},8,["default-active"])}}},B4=ti(D4,[["__scopeId","data-v-d1dfc2f3"]]),$4={__name:"MainLayout",setup(e){const t=k(()=>"68px");return(n,r)=>{const o=ZS,s=e4,i=XS;return J(),He(i,{class:"main-layout"},{default:de(()=>[oe(o,{width:t.value,class:"sidebar-container"},{default:de(()=>[oe(B4)]),_:1},8,["width"]),oe(i,null,{default:de(()=>[oe(s,{class:"main-content"},{default:de(()=>[Re(n.$slots,"default",{},void 0,!0)]),_:3})]),_:3})]),_:3})}}},j4=ti($4,[["__scopeId","data-v-640a1ce7"]]);async function fm(e,t={}){var r;if(typeof e!="string"||e.length===0)throw new TypeError("没有可复制的正则内容");if(typeof t.electronWrite=="function")return t.electronWrite(e);const n=t.browserClipboard??((r=globalThis.navigator)==null?void 0:r.clipboard);if(!n||typeof n.writeText!="function")throw new Error("当前环境不支持剪贴板写入");return await n.writeText(e),{success:!0}}const H4=typeof window<"u"&&!!window.electronAPI,xe=e=>e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e)),V4={system:{detectGameDpi:()=>Promise.resolve({found:!1,primaryScaleFactor:1,error:"非 Electron 环境"})},script:{executePython:()=>Promise.reject(new Error("非 Electron 环境")),generateAndExecute:()=>Promise.reject(new Error("非 Electron 环境")),stop:()=>Promise.resolve({success:!0}),getStatus:()=>Promise.resolve({isRunning:!1}),onStatusChanged:()=>()=>{},detectPythonPath:()=>Promise.resolve(null)},file:{save:()=>Promise.resolve(!0),read:()=>Promise.resolve(""),getPaths:()=>Promise.resolve({}),watcher:{start:()=>Promise.resolve(!0),stop:()=>Promise.resolve(!0)}},clipboard:{writeText:e=>fm(e)},shortcut:{initFromSettings:()=>Promise.resolve({success:!0,failed:[]}),register:()=>Promise.resolve({success:!0}),unregister:()=>Promise.resolve({success:!0}),beginCapture:()=>Promise.resolve({success:!0}),endCapture:()=>Promise.resolve({success:!0,failed:[]}),onTriggered:()=>{},onInit:()=>{}},window:{minimize:()=>{},maximize:()=>{},close:()=>{},toggleAlwaysOnTop:()=>Promise.resolve(!1),isAlwaysOnTop:()=>Promise.resolve(!1),onMaximized:()=>{},openDebugOverlay:()=>Promise.resolve({success:!0}),closeDebugOverlay:()=>Promise.resolve({success:!0}),updateDebugOverlay:()=>Promise.resolve({success:!0}),setDevToolsVisible:e=>Promise.resolve({visible:!!e}),getDevToolsVisible:()=>Promise.resolve({visible:!1}),onDevToolsVisibilityChanged:()=>()=>{},pickScreenCoordinate:()=>Promise.resolve({canceled:!0}),getScreenPickerContext:()=>Promise.resolve({mode:"point"}),submitScreenCoordinate:()=>{},submitScreenRegion:()=>{},cancelScreenCoordinatePicker:()=>{}},events:{onPythonOutput:()=>{},onUpdateOverlay:()=>{},onUpdateOverlaySettings:()=>{},onScriptStopped:()=>{},onBagDetectionMatch:()=>()=>{},onBagStashProgress:()=>()=>{},onBagStashCompleted:()=>()=>{},onBagStashStopped:()=>()=>{},onBagDetectionStopped:()=>()=>{},onUpdateDebugOverlay:()=>{}},selectFile:()=>Promise.resolve({canceled:!0,filePaths:[]}),copyFileToProject:()=>Promise.resolve({success:!1}),overlay:{updateSettings:()=>Promise.resolve({success:!0})},bag:{startDetection:()=>Promise.reject(new Error("非 Electron 环境")),stopDetection:()=>Promise.resolve({success:!0}),startStash:()=>Promise.reject(new Error("非 Electron 环境")),stopStash:()=>Promise.resolve({success:!0}),updateOperationDelay:()=>Promise.resolve({success:!0}),updatePreferences:()=>Promise.resolve({success:!0}),uploadTemplate:()=>Promise.reject(new Error("非 Electron 环境")),captureTemplate:()=>Promise.reject(new Error("非 Electron 环境")),getOverlayState:()=>Promise.resolve(null),onOverlayState:()=>()=>{}},combat:{startPotion:()=>Promise.reject(new Error("非 Electron 环境")),stopPotion:()=>Promise.resolve({success:!0}),getPotionStatus:()=>Promise.resolve({running:!1,processId:null}),samplePixel:()=>Promise.reject(new Error("非 Electron 环境")),executePortal:()=>Promise.reject(new Error("非 Electron 环境")),onStatus:()=>()=>{}},storyOverlay:{open:()=>Promise.resolve({success:!0}),close:()=>Promise.resolve({success:!0}),update:()=>Promise.resolve({success:!0}),getState:()=>Promise.resolve(null),resize:()=>Promise.resolve({success:!0}),onState:()=>()=>{}},crafting:{getStatus:()=>Promise.resolve({source:"builtin",manifest:null}),listCategories:()=>Promise.resolve([]),searchBases:()=>Promise.resolve({items:[],total:0}),searchModifiers:()=>Promise.resolve({items:[],total:0}),searchModifierCatalog:()=>Promise.resolve({groups:[],sourceCoverage:{},totalFamilies:0}),createManualSession:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),applyManualCurrency:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualEssences:()=>Promise.resolve({items:[],unresolvedCount:0}),applyManualEssence:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualBenchCrafts:()=>Promise.resolve({items:[],unresolvedCount:0}),applyManualBenchCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualFossils:()=>Promise.resolve({items:[],resonators:[],supportedCount:0}),applyManualFossils:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualHarvestCrafts:()=>Promise.resolve({items:[],categories:[],total:0,executableCount:0}),applyManualHarvestCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualEldritchCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,dominance:{source:null,affixType:null,label:"无支配"}}),applyManualEldritchCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualInfluenceCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,donor:null,influenceLabels:{}}),listAwakenerDonorCandidates:()=>Promise.resolve({bases:[],influences:[],candidates:[]}),configureAwakenerDonor:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),clearAwakenerDonor:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),applyManualInfluenceCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualVeiledCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,pending:null,options:[],canUnveil:!1,unveilUnavailableReason:""}),applyManualVeiledCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),selectManualVeiledOption:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualBeastcrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,beastLevel:83,pendingSplitResults:[],imprint:null,foreseeing:!1}),applyManualBeastcraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),selectManualSplitResult:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),previewManualCurrency:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),undoManualAction:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),redoManualAction:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),resetManualSession:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),updateData:()=>Promise.reject(new Error("仅 Electron 客户端支持数据更新")),cancelUpdate:()=>Promise.resolve({success:!0}),getPrices:()=>Promise.resolve({records:[],overrides:{},health:"unavailable"}),refreshPrices:()=>Promise.reject(new Error("仅 Electron 客户端支持价格更新")),setPriceOverride:()=>Promise.resolve({success:!0}),removePriceOverride:()=>Promise.resolve({success:!0}),startPlan:()=>Promise.reject(new Error("仅 Electron 客户端支持做装计算")),cancelPlan:()=>Promise.resolve({success:!0}),onUpdateProgress:()=>()=>{},onPlanEvent:()=>()=>{}}},pe=H4?{system:{detectGameDpi:()=>{var e,t;return(t=(e=window.electronAPI).detectGameDpi)==null?void 0:t.call(e)}},script:{executePython:(e,t)=>window.electronAPI.executePython(e,t),generateAndExecute:e=>window.electronAPI.generateAndExecuteScript(e),stop:()=>window.electronAPI.stopScript(),getStatus:()=>window.electronAPI.getScriptStatus(),onStatusChanged:e=>{var t,n;return((n=(t=window.electronAPI).onScriptStatusChanged)==null?void 0:n.call(t,e))||(()=>{})},detectPythonPath:()=>window.electronAPI.detectPythonPath()},file:{save:(e,t)=>window.electronAPI.saveFile(e,t),read:e=>window.electronAPI.readFile(e),getPaths:()=>window.electronAPI.getFilePaths(),watcher:{start:e=>window.electronAPI.startFileWatcher(e),stop:()=>window.electronAPI.stopFileWatcher()}},clipboard:{writeText:e=>fm(e,{electronWrite:window.electronAPI.writeClipboardText})},shortcut:{initFromSettings:e=>window.electronAPI.initShortcutsFromSettings(e),register:(e,t)=>window.electronAPI.registerGlobalShortcut(e,t),unregister:e=>window.electronAPI.unregisterGlobalShortcut(e),beginCapture:()=>{var e,t;return(t=(e=window.electronAPI).beginShortcutCapture)==null?void 0:t.call(e)},endCapture:()=>{var e,t;return(t=(e=window.electronAPI).endShortcutCapture)==null?void 0:t.call(e)},onTriggered:e=>window.electronAPI.onShortcutTriggered(e),onInit:e=>window.electronAPI.onInitShortcuts(e)},window:{minimize:()=>window.electronAPI.minimizeWindow(),maximize:()=>window.electronAPI.maximizeWindow(),close:()=>window.electronAPI.closeWindow(),closeOverlay:()=>window.electronAPI.closeOverlayWindow(),toggleAlwaysOnTop:()=>window.electronAPI.toggleAlwaysOnTop(),isAlwaysOnTop:()=>window.electronAPI.isAlwaysOnTop(),onMaximized:e=>window.electronAPI.onWindowMaximized(e),move:(e,t)=>window.electronAPI.moveWindow(e,t),openDebugOverlay:()=>{var e,t;return(t=(e=window.electronAPI).openDebugOverlay)==null?void 0:t.call(e)},closeDebugOverlay:()=>{var e,t;return(t=(e=window.electronAPI).closeDebugOverlay)==null?void 0:t.call(e)},updateDebugOverlay:e=>{var t,n;return(n=(t=window.electronAPI).updateDebugOverlay)==null?void 0:n.call(t,e)},setDevToolsVisible:e=>{var t,n;return(n=(t=window.electronAPI).setDevToolsVisible)==null?void 0:n.call(t,e)},getDevToolsVisible:()=>{var e,t;return(t=(e=window.electronAPI).getDevToolsVisible)==null?void 0:t.call(e)},onDevToolsVisibilityChanged:e=>{var t,n;return(n=(t=window.electronAPI).onDevToolsVisibilityChanged)==null?void 0:n.call(t,e)},pickScreenCoordinate:()=>{var e,t;return(t=(e=window.electronAPI).pickScreenCoordinate)==null?void 0:t.call(e)},getScreenPickerContext:()=>{var e,t;return(t=(e=window.electronAPI).getScreenPickerContext)==null?void 0:t.call(e)},submitScreenCoordinate:e=>{var t,n;return(n=(t=window.electronAPI).submitScreenCoordinate)==null?void 0:n.call(t,e)},submitScreenRegion:e=>{var t,n;return(n=(t=window.electronAPI).submitScreenRegion)==null?void 0:n.call(t,e)},cancelScreenCoordinatePicker:()=>{var e,t;return(t=(e=window.electronAPI).cancelScreenCoordinatePicker)==null?void 0:t.call(e)}},setIgnoreMouseEvents:(e,t)=>window.electronAPI.setIgnoreMouseEvents(e,t),events:{onPythonOutput:e=>window.electronAPI.onPythonScriptOutput(e),onUpdateOverlay:e=>window.electronAPI.onUpdateOverlay(e),onUpdateOverlaySettings:e=>window.electronAPI.onUpdateOverlaySettings(e),onScriptStopped:e=>window.electronAPI.onScriptStopped(e),onBagDetectionMatch:e=>{var t,n;return(n=(t=window.electronAPI).onBagDetectionMatch)==null?void 0:n.call(t,e)},onBagStashProgress:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashProgress)==null?void 0:n.call(t,e)},onBagStashCompleted:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashCompleted)==null?void 0:n.call(t,e)},onBagStashStopped:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashStopped)==null?void 0:n.call(t,e)},onBagDetectionStopped:e=>{var t,n;return(n=(t=window.electronAPI).onBagDetectionStopped)==null?void 0:n.call(t,e)},onUpdateDebugOverlay:e=>{var t,n;return(n=(t=window.electronAPI).onUpdateDebugOverlay)==null?void 0:n.call(t,e)}},selectFile:()=>window.electronAPI.selectFile(),copyFileToProject:e=>window.electronAPI.copyFileToProject(e),overlay:{updateSettings:e=>window.electronAPI.updateOverlaySettings(e)},bag:{startDetection:e=>{var t,n;return(n=(t=window.electronAPI).startBagDetection)==null?void 0:n.call(t,e)},stopDetection:()=>{var e,t;return(t=(e=window.electronAPI).stopBagDetection)==null?void 0:t.call(e)},startStash:()=>{var e,t;return(t=(e=window.electronAPI).startBagStash)==null?void 0:t.call(e)},stopStash:()=>{var e,t;return(t=(e=window.electronAPI).stopBagStash)==null?void 0:t.call(e)},updateOperationDelay:e=>{var t,n;return(n=(t=window.electronAPI).updateBagOperationDelay)==null?void 0:n.call(t,e)},updatePreferences:e=>{var t,n;return(n=(t=window.electronAPI).updateBagPreferences)==null?void 0:n.call(t,e)},uploadTemplate:(e,t)=>{var n,r;return(r=(n=window.electronAPI).uploadBagTemplate)==null?void 0:r.call(n,e,t)},captureTemplate:e=>{var t,n;return(n=(t=window.electronAPI).captureBagTemplate)==null?void 0:n.call(t,e)},getOverlayState:()=>{var e,t;return(t=(e=window.electronAPI).getBagStashOverlayState)==null?void 0:t.call(e)},onOverlayState:e=>{var t,n;return((n=(t=window.electronAPI).onBagStashOverlayState)==null?void 0:n.call(t,e))||(()=>{})}},combat:{startPotion:e=>{var t,n;return(n=(t=window.electronAPI).startPotionAssist)==null?void 0:n.call(t,e)},stopPotion:()=>{var e,t;return(t=(e=window.electronAPI).stopPotionAssist)==null?void 0:t.call(e)},getPotionStatus:()=>{var e,t;return(t=(e=window.electronAPI).getPotionAssistStatus)==null?void 0:t.call(e)},samplePixel:e=>{var t,n;return(n=(t=window.electronAPI).sampleCombatPixel)==null?void 0:n.call(t,e)},executePortal:e=>{var t,n;return(n=(t=window.electronAPI).executePortalAssist)==null?void 0:n.call(t,e)},onStatus:e=>{var t,n;return((n=(t=window.electronAPI).onCombatStatus)==null?void 0:n.call(t,e))||(()=>{})}},storyOverlay:{open:(e,t)=>{var n,r;return(r=(n=window.electronAPI).openStoryOverlay)==null?void 0:r.call(n,e,t)},close:()=>{var e,t;return(t=(e=window.electronAPI).closeStoryOverlay)==null?void 0:t.call(e)},update:e=>{var t,n;return(n=(t=window.electronAPI).updateStoryOverlay)==null?void 0:n.call(t,e)},getState:()=>{var e,t;return(t=(e=window.electronAPI).getStoryOverlayState)==null?void 0:t.call(e)},resize:e=>{var t,n;return(n=(t=window.electronAPI).resizeStoryOverlay)==null?void 0:n.call(t,e)},onState:e=>{var t,n;return((n=(t=window.electronAPI).onStoryOverlayState)==null?void 0:n.call(t,e))||(()=>{})}},crafting:{getStatus:()=>{var e,t;return(t=(e=window.electronAPI).getCraftingStatus)==null?void 0:t.call(e)},listCategories:()=>{var e,t;return(t=(e=window.electronAPI).listCraftingCategories)==null?void 0:t.call(e)},searchBases:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingBases)==null?void 0:n.call(t,xe(e))},searchModifiers:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingModifiers)==null?void 0:n.call(t,xe(e))},searchModifierCatalog:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingModifierCatalog)==null?void 0:n.call(t,xe(e))},createManualSession:e=>{var t,n;return(n=(t=window.electronAPI).createManualCraftingSession)==null?void 0:n.call(t,xe(e))},applyManualCurrency:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingCurrency)==null?void 0:r.call(n,xe(e),t)},listManualEssences:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingEssences)==null?void 0:n.call(t,xe(e))},applyManualEssence:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingEssence)==null?void 0:r.call(n,xe(e),t)},listManualBenchCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingBenchCrafts)==null?void 0:n.call(t,xe(e))},applyManualBenchCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingBenchCraft)==null?void 0:r.call(n,xe(e),t)},listManualFossils:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingFossils)==null?void 0:n.call(t,xe(e))},applyManualFossils:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingFossils)==null?void 0:r.call(n,xe(e),xe(t))},listManualHarvestCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingHarvestCrafts)==null?void 0:n.call(t,xe(e))},applyManualHarvestCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingHarvestCraft)==null?void 0:r.call(n,xe(e),t)},listManualEldritchCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingEldritchCrafts)==null?void 0:n.call(t,xe(e))},applyManualEldritchCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingEldritchCraft)==null?void 0:r.call(n,xe(e),t)},listManualInfluenceCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingInfluenceCrafts)==null?void 0:n.call(t,xe(e))},listAwakenerDonorCandidates:(e,t)=>{var n,r;return(r=(n=window.electronAPI).listAwakenerDonorCandidates)==null?void 0:r.call(n,xe(e),xe(t))},configureAwakenerDonor:(e,t)=>{var n,r;return(r=(n=window.electronAPI).configureAwakenerDonor)==null?void 0:r.call(n,xe(e),xe(t))},clearAwakenerDonor:e=>{var t,n;return(n=(t=window.electronAPI).clearAwakenerDonor)==null?void 0:n.call(t,xe(e))},applyManualInfluenceCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingInfluenceCraft)==null?void 0:r.call(n,xe(e),t)},listManualVeiledCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingVeiledCrafts)==null?void 0:n.call(t,xe(e))},applyManualVeiledCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingVeiledCraft)==null?void 0:r.call(n,xe(e),t)},selectManualVeiledOption:(e,t,n)=>{var r,o;return(o=(r=window.electronAPI).selectManualCraftingVeiledOption)==null?void 0:o.call(r,xe(e),t,n)},listManualBeastcrafts:(e,t)=>{var n,r;return(r=(n=window.electronAPI).listManualCraftingBeastcrafts)==null?void 0:r.call(n,xe(e),xe(t))},applyManualBeastcraft:(e,t,n)=>{var r,o;return(o=(r=window.electronAPI).applyManualCraftingBeastcraft)==null?void 0:o.call(r,xe(e),t,xe(n))},selectManualSplitResult:(e,t)=>{var n,r;return(r=(n=window.electronAPI).selectManualCraftingSplitResult)==null?void 0:r.call(n,xe(e),t)},previewManualCurrency:(e,t)=>{var n,r;return(r=(n=window.electronAPI).previewManualCraftingCurrency)==null?void 0:r.call(n,xe(e),t)},undoManualAction:e=>{var t,n;return(n=(t=window.electronAPI).undoManualCraftingAction)==null?void 0:n.call(t,xe(e))},redoManualAction:e=>{var t,n;return(n=(t=window.electronAPI).redoManualCraftingAction)==null?void 0:n.call(t,xe(e))},resetManualSession:e=>{var t,n;return(n=(t=window.electronAPI).resetManualCraftingSession)==null?void 0:n.call(t,xe(e))},updateData:()=>{var e,t;return(t=(e=window.electronAPI).updateCraftingData)==null?void 0:t.call(e)},cancelUpdate:()=>{var e,t;return(t=(e=window.electronAPI).cancelCraftingUpdate)==null?void 0:t.call(e)},getPrices:()=>{var e,t;return(t=(e=window.electronAPI).getCraftingPrices)==null?void 0:t.call(e)},refreshPrices:(e=!1)=>{var t,n;return(n=(t=window.electronAPI).refreshCraftingPrices)==null?void 0:n.call(t,e)},setPriceOverride:(e,t)=>{var n,r;return(r=(n=window.electronAPI).setCraftingPriceOverride)==null?void 0:r.call(n,e,t)},removePriceOverride:e=>{var t,n;return(n=(t=window.electronAPI).removeCraftingPriceOverride)==null?void 0:n.call(t,e)},startPlan:(e,t)=>{var n,r;return(r=(n=window.electronAPI).startCraftingPlan)==null?void 0:r.call(n,e,t)},cancelPlan:e=>{var t,n;return(n=(t=window.electronAPI).cancelCraftingPlan)==null?void 0:n.call(t,e)},onUpdateProgress:e=>{var t,n;return((n=(t=window.electronAPI).onCraftingUpdateProgress)==null?void 0:n.call(t,e))||(()=>{})},onPlanEvent:e=>{var t,n;return((n=(t=window.electronAPI).onCraftingPlanEvent)==null?void 0:n.call(t,e))||(()=>{})}}}:V4,z4={class:"title-bar"},W4={class:"title-content"},U4={class:"window-controls"},G4=["title"],K4={__name:"TitleBar",setup(e){const t=L(!1);async function n(){t.value=await pe.window.toggleAlwaysOnTop()}function r(){pe.window.minimize()}function o(){pe.window.maximize()}function s(){pe.window.close()}return st(async()=>{t.value=await pe.window.isAlwaysOnTop()}),(i,a)=>{const l=Dr;return J(),ae("div",z4,[Q("div",W4,[oe(l,{class:"app-logo-icon"},{default:de(()=>[oe(w(E2))]),_:1}),a[0]||(a[0]=Q("span",{class:"app-title"},"流放助手",-1))]),Q("div",U4,[Q("div",{class:De(["control-btn",{active:t.value}]),onClick:n,title:t.value?"取消置顶":"置顶"},[oe(l,{class:"rotate-icon"},{default:de(()=>[oe(w(o2))]),_:1})],10,G4),Q("div",{class:"control-btn",onClick:r,title:"最小化"},[oe(l,null,{default:de(()=>[oe(w(x2))]),_:1})]),Q("div",{class:"control-btn",onClick:o,title:"最大化"},[oe(l,null,{default:de(()=>[oe(w(p2))]),_:1})]),Q("div",{class:"control-btn close-btn",onClick:s,title:"关闭"},[oe(l,null,{default:de(()=>[oe(w(Qa))]),_:1})])])])}}},q4=ti(K4,[["__scopeId","data-v-75b33088"]]),J4=`#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Purpose: 自动合成/制作流程脚本，驱动鼠标键盘按配置执行，输出中间日志。
# Inputs: 前端模板填充的坐标/延迟/策略配置，游戏窗口坐标；pynput、winsound 等依赖。
# Outputs: 控制鼠标键盘完成制作步骤，写入结果文件（如有），打印日志；可播放提示音。
# Preconditions: 前端已生成配置并传入模板；游戏窗口在预期位置；依赖已安装且具备权限。
# Edge cases: Windows API 不可用时回退到 pynput；依赖缺失会提前退出；部分 I/O/操作失败当前策略仅告警。
# 生成时间: {{GEN_DATE}}

# 立即输出启动信息（在任何导入之前）
print("=" * 60)
print("[启动] Python脚本开始执行")
print("=" * 60)

import sys
import io


{{DPI_AWARENESS}}

# 设置标准输出为UTF-8编码，避免Windows GBK编码问题
# 强制所有平台使用UTF-8，确保一致性
try:
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    elif sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception as e:
    # 如果设置失败，打印警告但不中断执行
    print(f"[警告] 设置UTF-8编码失败: {e}")

# 立即刷新输出
sys.stdout.flush()
sys.stderr.flush()

print("[启动] 正在导入依赖包...")

# 尝试导入必要的包
try:
    import time
    import json
    import os
    import signal
    print("[启动] 基础模块导入成功")
except ImportError as e:
    print(f"[错误] 基础模块导入失败: {e}")
    sys.exit(1)

try:
    from pynput import mouse, keyboard
    from pynput.mouse import Button
    from pynput.keyboard import Key
    print("[启动] pynput模块导入成功")
except ImportError as e:
    print(f"[错误] pynput模块导入失败: {e}")
    print("[提示] 请运行: pip install pynput")
    sys.exit(1)

try:
    import pyperclip
    print("[启动] pyperclip模块导入成功")
except ImportError as e:
    print(f"[错误] pyperclip模块导入失败: {e}")
    print("[提示] 请运行: pip install pyperclip")
    sys.exit(1)

# 导入winsound模块用于播放提示音（仅限Windows）
try:
    if sys.platform == 'win32':
        import winsound
        print("[启动] winsound模块导入成功")
except ImportError:
    print("[警告] 无法导入winsound模块，提示音功能将不可用")

print("[启动] 所有依赖包导入成功")
sys.stdout.flush()

# 全局变量
is_running = False

# 播放提示音函数
def play_success_sound():
    """播放制作完成提示音"""
    try:
        if sys.platform == 'win32' and 'winsound' in sys.modules:
            # 播放系统默认提示音
            winsound.MessageBeep(winsound.MB_OK)
            # 或者播放指定频率的声音（如果系统声音不可用）
            # winsound.Beep(1000, 200) # 1000Hz, 200ms
            print("[提示] 播放完成提示音")
    except Exception as e:
        print(f"[警告] 播放提示音失败: {e}")

# Windows API鼠标控制（用于解决DPI缩放问题）
use_windows_api = False
dpi_scale_factor = {{DPI_SCALE_FACTOR}}
try:
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes
        
        # Windows API函数
        user32 = ctypes.windll.user32
        SetCursorPos = user32.SetCursorPos
        SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
        SetCursorPos.restype = wintypes.BOOL
        
        GetCursorPos = user32.GetCursorPos
        # 使用wintypes.POINT避免与pynput内部的POINT类冲突
        # 如果wintypes没有POINT，则创建自定义结构
        try:
            WinCursorPoint = wintypes.POINT
        except AttributeError:
            class WinCursorPoint(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
        GetCursorPos.argtypes = [ctypes.POINTER(WinCursorPoint)]
        GetCursorPos.restype = wintypes.BOOL
        
        # Windows API 主路径使用物理像素；该倍率仅供 pynput 回退路径换算。
        try:
            print(f"[DPI] 当前有效缩放: {dpi_scale_factor * 100:.0f}%")
            
            use_windows_api = True
            print("[Windows API] 已启用Windows API鼠标控制")
        except Exception as e:
            print(f"[警告] 无法初始化Windows API: {e}")
            print("[Windows API] 将使用pynput进行鼠标控制")
            use_windows_api = False
    else:
        print("[Windows API] 非Windows系统，使用pynput进行鼠标控制")
except Exception as e:
    print(f"[警告] Windows API初始化失败: {e}")
    print("[Windows API] 将使用pynput进行鼠标控制")
    use_windows_api = False

# 信号处理函数，用于优雅退出
def signal_handler(signum, frame):
    global is_running
    print("\\n[停止] 收到终止信号，正在停止脚本...")
    is_running = False
    sys.exit(0)

# 注册信号处理器（Windows 上可能不支持，但尝试注册）
try:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except:
    # Windows 上可能不支持某些信号
    pass

item_info_file = r"{{ITEM_INFO_FILE}}"
item_info_result_file = r"{{ITEM_INFO_RESULT_FILE}}"

# 自动操作等待（生成脚本时已将毫秒转换为秒）
mouse_move_delay = {{DELAY_MOUSE_MOVE}}
mouse_click_delay = {{DELAY_MOUSE_CLICK}}
clipboard_read_delay = {{DELAY_CLIPBOARD}}

# 通货坐标（确保坐标值为整数）
currency_positions = {{CURRENCY_POSITIONS}}

# 物品位置坐标（确保坐标值为整数）
item_position = {{ITEM_POSITION}}

# 创建鼠标和键盘控制器
mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()

# 主函数
def start_crafting():
    # 开始制作
    global is_running
    is_running = True
    
    # 注册停止快捷键监听
    try:
        # 停止快捷键回调
        def on_stop_hotkey():
            global is_running
            print("\\n[快捷键] 监测到停止快捷键 ({{STOP_SHORTCUT}})")
            is_running = False
            # 强制释放所有键
            release_all_keys()
            
        # 启动监听 (后台线程)
        hotkey_listener = keyboard.GlobalHotKeys({
            '{{PYNPUT_STOP_SHORTCUT}}': on_stop_hotkey
        })
        hotkey_listener.start()
        print(f"[启动] 停止快捷键监听已启动: {{STOP_SHORTCUT}}")
    except Exception as e:
        print(f"[警告] 无法注册停止快捷键监听: {e}")

    # 立即输出启动信息，验证输出管道
    print("=" * 50)
    print("[启动] Python脚本已启动")
    # 简化启动信息
    # print(f"[启动] Python版本: {sys.version}")
    print(f"[启动] 当前时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    print("[开始] 制作流程")
    
    # 检查物品位置是否配置
    if item_position['x'] == 0 and item_position['y'] == 0:
        print("[错误] 物品位置未配置，请先在设置中配置物品位置坐标")
        is_running = False
        return
    
    # 验证坐标是否合理（应该在屏幕范围内）
    try:
        # 尝试获取当前鼠标位置来估算屏幕大小
        if use_windows_api:
            try:
                current_pos = get_cursor_pos_windows_api()
                if current_pos:
                    screen_width = current_pos[0] * 2  # 粗略估算
                    screen_height = current_pos[1] * 2
                else:
                    # 如果Windows API失败，尝试使用pynput
                    current_pos = mouse_controller.position
                    screen_width = current_pos[0] * 2
                    screen_height = current_pos[1] * 2
            except Exception:
                # 如果都失败，跳过屏幕大小检查
                current_pos = None
        else:
            current_pos = mouse_controller.position
            screen_width = current_pos[0] * 2  # 粗略估算
            screen_height = current_pos[1] * 2
    except Exception as e:
        print(f"[警告] 无法获取屏幕信息: {e}")
        current_pos = None
    
    if item_position['x'] > 5000 or item_position['y'] > 5000:
        print(f"[警告] 物品位置坐标异常: ({item_position['x']}, {item_position['y']})")
        print("[提示] 请检查坐标配置是否正确")
    
    # 检查是否有启用的模块
    affix_enabled = {{ENABLE_AFFIX}}
    socket_enabled = {{ENABLE_SOCKET}}
    
    print(f"[配置] 词缀匹配模块: {'启用' if affix_enabled else '禁用'}")
    print(f"[配置] 插槽制作模块: {'启用' if socket_enabled else '禁用'}")
    
    if not affix_enabled and not socket_enabled:
        print("[错误] 请至少启用一个制作模块")
        time.sleep(3)
        is_running = False
        return
    
    success = True
    
    # 词缀匹配
    if affix_enabled:
        success = craft_affixes()
        if not success:
            is_running = False
            return
    
    # 插槽制作（顺序执行）
    if socket_enabled:
        success = craft_sockets()
        if not success:
            is_running = False
            return
    
    print("[完成] 所有制作流程完成！")
    play_success_sound()
    time.sleep(2)
    is_running = False

{{AFFIX_CRAFTING_FUNC}}

{{SOCKET_CRAFTING_FUNC}}

# 辅助函数
def get_cursor_pos_windows_api():
    # 使用Windows API获取鼠标位置
    global use_windows_api
    try:
        if not use_windows_api:
            return None
        # 检查必要变量是否定义
        if 'WinCursorPoint' not in globals() or 'GetCursorPos' not in globals():
            return None
        
        point = WinCursorPoint()
        result = GetCursorPos(ctypes.byref(point))
        
        if result:
            return (point.x, point.y)
        
        return None
    except Exception as e:
        # 如果Windows API失败，禁用Windows API并回退到pynput
        print(f"[警告] Windows API获取鼠标位置失败: {e}")
        print("[Windows API] 将禁用Windows API，回退到pynput")
        use_windows_api = False
        return None

def set_cursor_pos_windows_api(x, y):
    # 使用Windows API设置鼠标位置
    global use_windows_api
    try:
        if not use_windows_api:
            return False
        # 检查必要变量是否定义
        if 'SetCursorPos' not in globals():
            return False
            
        result = SetCursorPos(int(x), int(y))
        return bool(result)
    except Exception as e:
        # 如果Windows API失败，禁用Windows API并回退到pynput
        print(f"[警告] Windows API设置鼠标位置失败: {e}")
        print("[Windows API] 将禁用Windows API，回退到pynput")
        use_windows_api = False
        return False

# 当前持有的通货类型
current_currency_type = None
# Shift键状态
is_shift_held = False

def release_all_keys():
    # 释放所有可能的修饰键
    try:
        keyboard_controller.release(Key.shift)
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.shift_l)
        keyboard_controller.release(Key.shift_r)
        keyboard_controller.release(Key.ctrl_l)
        keyboard_controller.release(Key.ctrl_r)
        keyboard_controller.release(Key.alt_l)
        keyboard_controller.release(Key.alt_r)
    except:
        pass

def release_shift_if_held():
    # 如果Shift被按下，则释放
    global is_shift_held
    release_all_keys()
    is_shift_held = False
    time.sleep(0.05)

def apply_currency(currency_type):
    # 应用通货到物品上（每次重新获取通货，不使用Shift）
    
    try:
        # 验证物品位置
        if item_position['x'] == 0 and item_position['y'] == 0:
            print("[错误] 物品位置未配置")
            return False
            
        # 0. 确保Shift松开 (防止之前残留)
        release_shift_if_held()
        
        # 1. 移动到通货位置并右键点击 (Pick)
        # print(f"[操作] 获取通货: {currency_type}")
        if not right_click_currency(currency_type):
            return False
            
        # 2. 移动到物品位置
        target_x = int(item_position['x'])
        target_y = int(item_position['y'])
        
        # 移动鼠标
        if not move_mouse(target_x, target_y):
            return False
        
        # 3. 左键点击应用 (Apply)
        # 不需要按下Shift
        click_mouse("left")
        return True
        
    except Exception as e:
        print(f"[错误] 应用通货失败: {e}")
        import traceback
        traceback.print_exc()
        release_shift_if_held() # 发生错误时释放
        return False

def move_mouse(x, y):
    # 移动鼠标
    try:
        # 验证坐标类型和有效性
        # print(f"[调试] move_mouse 接收到的参数: x={x} (类型: {type(x)}), y={y} (类型: {type(y)})")
        
        # 确保坐标是整数
        x = int(x)
        y = int(y)
        # print(f"[调试] 转换后的坐标: x={x}, y={y}")
        
        if abs(x) > 10000 or abs(y) > 10000:
            print(f"[警告] 坐标值异常大: ({x}, {y})，可能配置错误")
        
        # 获取当前鼠标位置（使用Windows API或pynput）
        try:
            if use_windows_api:
                current_pos_win = get_cursor_pos_windows_api()
                current_pos_pynput = mouse_controller.position
                # print(f"[移动] 当前鼠标位置 (Windows API): {current_pos_win}")
                # print(f"[移动] 当前鼠标位置 (pynput): ({current_pos_pynput[0]}, {current_pos_pynput[1]})")
                current_pos = current_pos_win if current_pos_win else current_pos_pynput
            else:
                current_pos = mouse_controller.position
                # print(f"[移动] 当前鼠标位置: ({current_pos[0]}, {current_pos[1]})")
        except Exception as e:
            # print(f"[警告] 获取当前鼠标位置失败: {e}")
            # 如果获取位置失败，使用pynput
            try:
                current_pos = mouse_controller.position
                # print(f"[移动] 当前鼠标位置 (pynput): ({current_pos[0]}, {current_pos[1]})")
            except Exception:
                current_pos = (0, 0)
                # print(f"[警告] 无法获取鼠标位置，假设为(0,0)")
        
        # print(f"[移动] 目标坐标: ({x}, {y})")
        # if isinstance(current_pos, tuple) and len(current_pos) >= 2:
        #     print(f"[移动] 坐标差值: dx={x - current_pos[0]}, dy={y - current_pos[1]}")
        
        # 执行移动（优先使用Windows API）
        if use_windows_api:
            # print(f"[移动] 使用Windows API设置鼠标位置")
            success = set_cursor_pos_windows_api(x, y)
            if not success:
                # print(f"[警告] Windows API设置失败，尝试使用pynput (应用DPI修正: {dpi_scale_factor})")
                mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        else:
            # print(f"[移动] 使用pynput设置鼠标位置 (应用DPI修正: {dpi_scale_factor})")
            mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        
        time.sleep(mouse_move_delay)
        
        # 验证鼠标位置（使用Windows API和pynput对比）
        if use_windows_api:
            actual_pos_win = get_cursor_pos_windows_api()
            # actual_pos_pynput = mouse_controller.position
            # print(f"[移动] 移动后实际位置 (Windows API): {actual_pos_win}")
            # print(f"[移动] 移动后实际位置 (pynput): ({actual_pos_pynput[0]}, {actual_pos_pynput[1]})")
            
            # 使用Windows API的位置作为真实位置
            if actual_pos_win:
                actual_pos = actual_pos_win
                dx = abs(actual_pos[0] - x)
                dy = abs(actual_pos[1] - y)
                # print(f"[移动] 位置偏差 (Windows API): dx={dx}, dy={dy}")
                
                if dx > 5 or dy > 5:
                    # print(f"[警告] 鼠标位置不匹配！目标: ({x}, {y}), 实际: ({actual_pos[0]}, {actual_pos[1]})")
                    # 如果使用Windows API设置失败，偏差可能是DPI问题
                    # print(f"[调试] DPI缩放系数: {dpi_scale_factor}")
                    return False
            else:
                pass
                # 如果Windows API获取失败，忽略验证
        else:
            # pynput模式下，验证也需要考虑DPI
            actual_pos_raw = mouse_controller.position
            actual_pos = (int(actual_pos_raw[0] * dpi_scale_factor), int(actual_pos_raw[1] * dpi_scale_factor))
            dx = abs(actual_pos[0] - x)
            dy = abs(actual_pos[1] - y)
            # print(f"[移动] 移动后实际位置: ({actual_pos[0]}, {actual_pos[1]}) (原始: {actual_pos_raw})")
            # print(f"[移动] 位置偏差: dx={dx}, dy={dy}")
            
            if dx > 10 or dy > 10:
                # print(f"[警告] 鼠标位置不匹配！目标: ({x}, {y}), 实际: ({actual_pos[0]}, {actual_pos[1]})")
                # print(f"[警告] 偏差超过10像素，可能存在问题")
                return False
        
        # print(f"[移动] 鼠标移动成功，位置匹配")
        return True
    except Exception as e:
        print(f"[警告] 移动鼠标出错: {e}")
        return False

def click_mouse(button="left"):
    # 点击鼠标
    if button == "left":
        mouse_controller.click(Button.left)
    elif button == "right":
        mouse_controller.click(Button.right)
    time.sleep(mouse_click_delay)

def right_click_currency(currency):
    # 右键点击通货
    currency_names = {
        "alteration": "改造石",
        "augmentation": "增幅石",
        "regal": "富豪石",
        "chaos": "混沌石",
        "exalted": "崇高石",
        "alchemy": "点金石",
        "scouring": "重铸石",
        "transmutation": "蜕变石",
        "jewellers": "工匠石",
        "fusing": "链结石",
        "chromic": "幻色石"
    }
    
    currency_name = currency_names.get(currency, currency)
    
    if currency not in currency_positions:
        print(f"[错误] 未配置通货坐标: {currency}")
        return False
        
    pos = currency_positions[currency]
    
    # 详细输出坐标读取信息
    # print(f"[调试] 读取通货 {currency_name} ({currency}) 的坐标配置")
    # print(f"[调试] 坐标字典内容: {pos}")
    # print(f"[调试] 坐标类型检查 - x类型: {type(pos.get('x'))}, y类型: {type(pos.get('y'))}")
    # print(f"[调试] 坐标值 - x: {pos.get('x')}, y: {pos.get('y')}")
    
    # 验证坐标
    if pos['x'] == 0 and pos['y'] == 0:
        print(f"[错误] 通货 {currency_name} 的坐标未配置: ({pos['x']}, {pos['y']})")
        return False
    
    # 确保坐标是整数
    target_x = int(pos['x'])
    target_y = int(pos['y'])
    # print(f"[操作] 右键点击 {currency_name} 位置: ({target_x}, {target_y})")
    # print(f"[调试] 准备移动鼠标到坐标: x={target_x}, y={target_y}")
    
    if not move_mouse(target_x, target_y):
        print(f"[错误] 移动到 {currency_name} 失败")
        return False
        
    click_mouse("right")
    return True

def left_click_item():
    # 左键点击物品
    # 详细输出坐标读取信息
    # print(f"[调试] 读取物品位置坐标")
    # print(f"[调试] 坐标字典内容: {item_position}")
    # print(f"[调试] 坐标类型检查 - x类型: {type(item_position.get('x'))}, y类型: {type(item_position.get('y'))}")
    # print(f"[调试] 坐标值 - x: {item_position.get('x')}, y: {item_position.get('y')}")
    
    if item_position['x'] == 0 and item_position['y'] == 0:
        print("[错误] 物品位置未配置！")
        return False
    
    # 确保坐标是整数
    target_x = int(item_position['x'])
    target_y = int(item_position['y'])
    # print(f"[操作] 左键点击物品位置: ({target_x}, {target_y})")
    # print(f"[调试] 准备移动鼠标到坐标: x={target_x}, y={target_y}")
    
    if not move_mouse(target_x, target_y):
        print("[错误] 移动到物品位置失败")
        return False
    click_mouse("left")
    return True

def send_copy_command():
    # 发送 Alt+Ctrl+C 复制详细命令
    try:
        keyboard_controller.press(Key.ctrl)
        keyboard_controller.press(Key.alt)
        time.sleep(0.02)  # 短暂延迟确保修饰键按下
        keyboard_controller.press('c')
        time.sleep(0.02)  # 短暂延迟确保按键按下
        keyboard_controller.release('c')
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.ctrl)
        time.sleep(clipboard_read_delay / 1000.0)
        
        # 额外确保修饰键释放
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        
        return True
    except Exception as e:
        print(f"[错误] 发送复制命令失败: {e}")
        # 发生错误时也要确保释放
        try:
            keyboard_controller.release(Key.ctrl)
            keyboard_controller.release(Key.alt)
        except:
            pass
        return False

def read_clipboard_to_file():
    # 读取剪切板并写入文件
    try:
        # 发送复制命令
        if not send_copy_command():
            return False
        
        # 读取剪切板文本
        clipboard_text = pyperclip.paste()
        
        if not clipboard_text or len(clipboard_text.strip()) == 0:
            print("[警告] 剪切板内容为空")
            return False
        
        # 转义JSON特殊字符
        clipboard_text = clipboard_text.replace('\\\\', '\\\\\\\\')
        clipboard_text = clipboard_text.replace('"', '\\\\"')
        clipboard_text = clipboard_text.replace('\\n', '\\\\n')
        clipboard_text = clipboard_text.replace('\\r', '\\\\r')
        clipboard_text = clipboard_text.replace('\\t', '\\\\t')
        
        json_data = '{"clipboard": "' + clipboard_text + '"}'
        
        # 写入文件
        with open(item_info_file, 'w', encoding='utf-8') as f:
            f.write(json_data)
        return True
    except Exception as e:
        print(f"[错误] 读取剪切板失败: {e}")
        return False

def wait_for_parse_result():
    # 等待解析结果文件出现
    max_wait = 100  # 增加到10秒
    wait_count = 0
    
    # 先删除旧的结果文件（如果存在）
    if os.path.exists(item_info_result_file):
        try:
            os.remove(item_info_result_file)
        except:
            pass
    
    # 检查输入文件是否存在
    if not os.path.exists(item_info_file):
        print(f"[错误] 输入文件不存在: {item_info_file}")
        return {"error": "输入文件不存在"}
    
    while is_running:
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                
                if not content:
                    time.sleep(0.02)
                    wait_count += 1
                    if wait_count > max_wait:
                        return {"error": "结果文件为空"}
                    continue
                
                result = json.loads(content)
                
                # 检查是否有错误
                if result.get("error"):
                    print(f"[错误] 解析错误: {result.get('error')}")
                    return result
                
                return result
            except json.JSONDecodeError as e:
                print(f"[错误] JSON解析错误: {e}")
                time.sleep(0.02)
                wait_count += 1
                if wait_count > max_wait:
                    return {"error": f"JSON解析失败: {e}"}
                continue
            except Exception as e:
                print(f"[错误] 读取结果文件错误: {e}")
                time.sleep(0.02)
                wait_count += 1
                if wait_count > max_wait:
                    return {"error": f"读取结果失败: {e}"}
                continue
        
        # 每2秒输出一次等待信息
        if wait_count > 0 and wait_count % 20 == 0:
            print(f"[等待] 等待解析结果... ({wait_count * 0.1:.1f}秒)")
        
        time.sleep(0.02)
        wait_count += 1
        if wait_count > max_wait:
            print(f"[错误] 等待超时 ({max_wait * 0.1:.1f}秒)，未收到解析结果")
            print(f"[调试] 检查文件: {item_info_file} 和 {item_info_result_file}")
            return {"error": "等待超时，未收到解析结果"}
            
    return {"error": "循环已停止"}

# 自动启动制作
if __name__ == "__main__":
    try:
        # 立即刷新输出，确保启动信息显示
        sys.stdout.flush()
        sys.stderr.flush()
        
        print("[启动] 准备调用start_crafting()函数...")
        start_crafting()
        
        # 脚本结束时，确保释放所有按键
        release_shift_if_held()
        
        print("[完成] start_crafting()函数执行完成")
    except KeyboardInterrupt:
        print("\\n[停止] 收到中断信号，正在退出...")
        is_running = False
        release_shift_if_held()
        sys.exit(0)
    except ImportError as e:
        print(f"\\n[错误] 模块导入错误: {e}")
        print("[错误] 请检查是否安装了所有必要的依赖包")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\\n[错误] 脚本执行出错: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
`,Y4=`#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Purpose: 自动化批量洗图流程，驱动鼠标键盘、读取解析结果、按配置匹配并存仓。
# Inputs: 前端模板填充的配置项（延迟、坐标、match 条件、通货策略、快捷键）；外部解析结果文件 \`item_info_result_file\`。
# Outputs: 统计信息写入 \`item_info_result_file\`；控制鼠标键盘完成洗图、存仓；打印日志给调用方。
# Preconditions: 渲染端已生成配置并传入模板；前端监听 \`item_info_result_file\` 变化；游戏窗口与坐标配置正确。
# Edge cases: 剪贴板/Windows API 不可用时回退；快捷键注册失败仅告警；部分 I/O 失败当前策略为继续尝试或提前退出。
# 生成时间: {{GEN_DATE}}

print("=" * 60)
print("[启动] Python洗图脚本开始执行")
print("=" * 60)

import sys
import io


{{DPI_AWARENESS}}

try:
    if sys.version_info >= (3, 7):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    elif sys.platform == 'win32':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
except Exception as e:
    print(f"[警告] 设置UTF-8编码失败: {e}")

sys.stdout.flush()
sys.stderr.flush()

print("[启动] 正在导入依赖包...")

try:
    import time
    import json
    import os
    import signal
    import re
    print("[启动] 基础模块导入成功")
except ImportError as e:
    print(f"[错误] 基础模块导入失败: {e}")
    sys.exit(1)

try:
    from pynput import mouse, keyboard
    from pynput.mouse import Button
    from pynput.keyboard import Key
    print("[启动] pynput模块导入成功")
except ImportError as e:
    print(f"[错误] pynput模块导入失败: {e}")
    sys.exit(1)

try:
    import pyperclip
    print("[启动] pyperclip模块导入成功")
except ImportError as e:
    print(f"[错误] pyperclip模块导入失败: {e}")
    sys.exit(1)

try:
    if sys.platform == 'win32':
        import winsound
        print("[启动] winsound模块导入成功")
except ImportError:
    pass

print("[启动] 所有依赖包导入成功")
sys.stdout.flush()

# 全局变量
is_running = False

# 播放提示音函数
def play_success_sound():
    try:
        if sys.platform == 'win32' and 'winsound' in sys.modules:
            winsound.MessageBeep(winsound.MB_OK)
    except Exception:
        pass

# Windows API鼠标控制
use_windows_api = False
dpi_scale_factor = {{DPI_SCALE_FACTOR}}
GetClipboardSequenceNumber = None
try:
    if sys.platform == 'win32':
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        SetCursorPos = user32.SetCursorPos
        SetCursorPos.argtypes = [ctypes.c_int, ctypes.c_int]
        SetCursorPos.restype = wintypes.BOOL
        GetCursorPos = user32.GetCursorPos
        try:
            WinCursorPoint = wintypes.POINT
        except AttributeError:
            class WinCursorPoint(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
        GetCursorPos.argtypes = [ctypes.POINTER(WinCursorPoint)]
        GetCursorPos.restype = wintypes.BOOL
        
        # 获取剪切板序列号函数
        try:
            GetClipboardSequenceNumber = user32.GetClipboardSequenceNumber
            GetClipboardSequenceNumber.restype = ctypes.c_uint
            GetClipboardSequenceNumber.argtypes = []
            print("[Windows API] 已启用GetClipboardSequenceNumber")
        except Exception as e:
            print(f"[警告] 无法初始化GetClipboardSequenceNumber: {e}")
            GetClipboardSequenceNumber = None
        
        try:
            # Windows API 主路径使用物理像素；该倍率仅供 pynput 回退路径换算。
            use_windows_api = True
            print("[Windows API] 已启用Windows API鼠标控制")
        except Exception:
            use_windows_api = False
    else:
        print("[Windows API] 非Windows系统，使用pynput进行鼠标控制")
except Exception:
    use_windows_api = False

def signal_handler(signum, frame):
    global is_running
    print("\\n[停止] 收到终止信号，正在停止脚本...")
    is_running = False
    sys.exit(0)

try:
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
except:
    pass

item_info_file = r"{{ITEM_INFO_FILE}}"
item_info_result_file = r"{{ITEM_INFO_RESULT_FILE}}"

# 延迟配置
mouse_move_delay = float({{DELAY_MOUSE_MOVE}})  # type: ignore
mouse_click_delay = float({{DELAY_MOUSE_CLICK}})  # type: ignore
clipboard_read_delay = float({{DELAY_CLIPBOARD}})  # type: ignore

# 坐标配置
currency_positions = {{CURRENCY_POSITIONS}}  # type: ignore
grid_config = {{GRID_CONFIG}} # {startX, startY, offsetX, offsetY, rows, cols}  # type: ignore
map_config = {{MAP_CONFIG}}   # {method, vaal, match}  # type: ignore

# 创建控制器
mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()
current_currency_type = None
is_shift_held = False

def get_cursor_pos_windows_api():
    global use_windows_api
    try:
        if not use_windows_api: return None
        point = WinCursorPoint()
        if GetCursorPos(ctypes.byref(point)):
            return (point.x, point.y)
        return None
    except Exception:
        use_windows_api = False
        return None

def set_cursor_pos_windows_api(x, y):
    global use_windows_api
    try:
        if not use_windows_api: return False
        return bool(SetCursorPos(int(x), int(y)))
    except Exception:
        use_windows_api = False
        return False

def move_mouse(x, y):
    try:
        x, y = int(x), int(y)
        if use_windows_api:
            success = set_cursor_pos_windows_api(x, y)
            if not success:
                mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        else:
            mouse_controller.position = (int(x / dpi_scale_factor), int(y / dpi_scale_factor))
        time.sleep(mouse_move_delay)
        return True
    except Exception:
        return False

def click_mouse(button="left"):
    if button == "left": mouse_controller.click(Button.left)
    elif button == "right": mouse_controller.click(Button.right)
    time.sleep(mouse_click_delay)

def release_all_keys():
    try:
        keyboard_controller.release(Key.shift)
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
    except:
        pass

def release_shift_if_held():
    global is_shift_held
    release_all_keys()
    is_shift_held = False
    time.sleep(0.05)

def right_click_currency(currency):
    currency_names = {
        "alteration": "改造石",
        "augmentation": "增幅石",
        "regal": "富豪石",
        "chaos": "混沌石",
        "exalted": "崇高石",
        "alchemy": "点金石",
        "scouring": "重铸石",
        "transmutation": "蜕变石",
        "jewellers": "工匠石",
        "fusing": "链结石",
        "chromic": "幻色石",
        "vaal": "瓦尔宝珠",
        "wisdom": "知识卷轴"
    }
    
    if currency not in currency_positions:
        print(f"[错误] 未配置通货坐标: {currency}")
        return False
        
    pos = currency_positions[currency]
    if not move_mouse(int(pos['x']), int(pos['y'])):
        return False
        
    click_mouse("right")
    return True

def apply_currency(currency_type, target_x, target_y):
    try:
        release_shift_if_held()
        if not right_click_currency(currency_type): return False
        if not move_mouse(target_x, target_y): return False
        click_mouse("left")
        return True
    except Exception as e:
        print(f"[错误] 应用通货失败: {e}")
        release_shift_if_held()
        return False

def send_copy_command():
    try:
        # 使用 Ctrl+Alt+C 读取高级属性
        keyboard_controller.press(Key.ctrl)
        keyboard_controller.press(Key.alt)
        time.sleep(0.05) # 稍微增加按键间隔
        keyboard_controller.press('c')
        time.sleep(0.05)
        keyboard_controller.release('c')
        keyboard_controller.release(Key.alt)
        keyboard_controller.release(Key.ctrl)
        time.sleep(clipboard_read_delay / 1000.0)
        # 释放所有修饰键以防万一
        keyboard_controller.release(Key.ctrl)
        keyboard_controller.release(Key.alt)
        return True
    except:
        return False

def read_clipboard_to_file():
    try:
        if not send_copy_command(): return False
        clipboard_text = pyperclip.paste()
        if not clipboard_text or len(clipboard_text.strip()) == 0: return False
        
        # JSON escape
        clipboard_text = clipboard_text.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"').replace('\\n', '\\\\n').replace('\\r', '\\\\r').replace('\\t', '\\\\t')
        json_data = '{"clipboard": "' + clipboard_text + '"}'
        
        with open(item_info_file, 'w', encoding='utf-8') as f:
            f.write(json_data)
        return True
    except Exception:
        return False

def wait_for_parse_result():
    max_wait = 100
    wait_count = 0
    
    if os.path.exists(item_info_result_file):
        try: os.remove(item_info_result_file)
        except: pass
        
    while is_running:
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                if not content:
                    time.sleep(0.02)
                    wait_count += 1
                    continue
                return json.loads(content)
            except Exception:
                time.sleep(0.02)
        
        time.sleep(0.02)
        wait_count += 1
        if wait_count > max_wait:
            return {"error": "等待超时"}
    return {"error": "循环已停止"}

def get_slot_position(col, row):
    # 列优先遍历
    # col: 0-11, row: 0-4
    # 计算实际像素坐标
    x = grid_config['startX'] + col * grid_config['offsetX']
    y = grid_config['startY'] + row * grid_config['offsetY']
    return int(x), int(y)

def stash_item(x, y):
    # Ctrl+Click 存仓
    try:
        if not move_mouse(x, y): return False
        keyboard_controller.press(Key.ctrl)
        time.sleep(0.05)
        click_mouse("left")
        time.sleep(0.05)
        keyboard_controller.release(Key.ctrl)
        time.sleep(0.2) # 等待存仓动作完成
        return True
    except:
        keyboard_controller.release(Key.ctrl)
        return False

def update_map_stats(processed_count, qualified_count, blacklist_stats, whitelist_stats):
    # 更新地图统计信息到结果文件，供前端实时显示
    try:
        current_result = {}
        if os.path.exists(item_info_result_file):
            try:
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            except:
                pass  # 如果读取失败，使用空字典
        
        # 更新统计信息
        current_result['processed_count'] = processed_count
        current_result['qualified_count'] = qualified_count
        current_result['blacklist_stats'] = blacklist_stats.copy()  # 复制字典
        current_result['whitelist_stats'] = whitelist_stats.copy()  # 复制字典
        
        # 写入文件并立即刷新，确保文件监听器能够捕获到变化
        json_str = json.dumps(current_result)
        with open(item_info_result_file, 'w', encoding='utf-8') as f:
            f.write(json_str)
            f.flush()  # 立即刷新到磁盘
            os.fsync(f.fileno())  # 确保数据写入磁盘
        # 额外的小延迟，确保文件系统完全同步
        time.sleep(0.01)
    except Exception as e:
        # 静默失败，不影响主流程
        pass

def start_map_rolling():
    """Purpose: 主控循环，按网格遍历地图、读取解析结果、套用策略并更新统计。
    Inputs: grid_config 坐标与行列，map_config 洗图策略，GetClipboardSequenceNumber 等外部依赖。
    Outputs: 写入 item_info_file/item_info_result_file；日志输出；可选存仓动作。
    Preconditions: 游戏窗口前置且坐标正确；前端文件监听正常；pynput 可用。
    Edge cases: 剪贴板序列号不可用时回退到内容检查；快捷键注册失败仅告警；读取/解析超时会跳过当前格子。
    """
    global is_running
    is_running = True
    
    print(f"[启动] 开始执行地图洗练脚本")
    print(f"[配置] 网格配置: {grid_config}")
    print(f"[配置] 地图配置: {map_config}")
    
    # 注册快捷键
    try:
        def on_stop():
            global is_running
            print("\\n[快捷键] 停止脚本")
            is_running = False
            release_all_keys()
            
        listener = keyboard.GlobalHotKeys({'{{PYNPUT_STOP_SHORTCUT}}': on_stop})
        listener.start()
        print(f"[快捷键] 停止快捷键已注册: {{PYNPUT_STOP_SHORTCUT}}")
    except Exception as e:
        print(f"[警告] 快捷键注册失败: {e}")

    print(f"[开始] 地图洗练流程")
    
    processed_count = 0
    qualified_count = 0
    blacklist_stats = {}  # 统计黑名单词缀拦截次数
    whitelist_stats = {}  # 统计白名单词缀通过次数
    current_col = 0
    current_row = 0
    
    # 从第一个格子开始，按列优先顺序处理
    while is_running and current_col < grid_config['cols']:
        # 计算当前格子坐标
        slot_x, slot_y = get_slot_position(current_col, current_row)
        print(f"[进度] 正在处理第 {current_col+1} 列, 第 {current_row+1} 行 (坐标: {slot_x}, {slot_y})")
        
        # 1. 移动鼠标到当前格子
        if not move_mouse(slot_x, slot_y):
            print("[错误] 鼠标移动失败，跳过")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        time.sleep(0.1)
        
        # 2. 记录复制前的剪切板序列号
        clipboard_seq_before = None
        if GetClipboardSequenceNumber:
            try:
                clipboard_seq_before = GetClipboardSequenceNumber()
            except Exception as e:
                print(f"[警告] 获取剪切板序列号失败: {e}")
        
        # 3. 复制物品信息
        print(f"[操作] 复制物品信息 (Ctrl+Alt+C)")
        if not read_clipboard_to_file():
            print("[提示] 复制失败")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 4. 检查剪切板序列号是否变化（判断是否复制到新内容）
        clipboard_seq_after = None
        if GetClipboardSequenceNumber:
            try:
                clipboard_seq_after = GetClipboardSequenceNumber()
            except Exception as e:
                print(f"[警告] 获取剪切板序列号失败: {e}")
        
        # 检查是否成功复制到新内容
        if GetClipboardSequenceNumber:
            # 如果GetClipboardSequenceNumber可用，必须成功获取到两个序列号
            if clipboard_seq_before is None or clipboard_seq_after is None:
                print(f"[停止] 无法获取剪切板序列号 (before: {clipboard_seq_before}, after: {clipboard_seq_after})，停止流程")
                is_running = False
                break
            # 如果序列号没有变化，说明没有复制到新内容，停止流程
            if clipboard_seq_after == clipboard_seq_before:
                print(f"[停止] 剪切板序列号未变化 ({clipboard_seq_before} -> {clipboard_seq_after})，说明没有复制到新内容，流程结束")
                is_running = False
                break
            else:
                print(f"[检测] 剪切板序列号已变化 ({clipboard_seq_before} -> {clipboard_seq_after})，检测到新内容")
        else:
            # 如果GetClipboardSequenceNumber不可用，回退到检查剪切板内容
            # 检查剪切板内容是否有效（不为空且可能包含地图信息）
            try:
                clipboard_text = pyperclip.paste()
                if not clipboard_text or len(clipboard_text.strip()) == 0:
                    print("[停止] 剪切板内容为空，说明没有复制到新内容，流程结束")
                    is_running = False
                    break
                # 如果剪切板有内容，继续执行（无法判断是否是地图，交给后续解析判断）
                print("[检测] 剪切板有内容，继续处理")
            except Exception as e:
                print(f"[停止] 无法读取剪切板内容: {e}，流程结束")
                is_running = False
                break
        
        # 5. 等待解析结果
        result = wait_for_parse_result()
        if result.get("error"):
            if result.get("isLegendary"):
                print("[提示] 检测到传奇地图，跳过")
            else:
                print(f"[提示] 解析失败: {result.get('error')}")
            
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 6. 检查是否是地图
        category = result.get("category", "") or result.get("itemClass", "")
        if category not in ["异界地图", "地图"]:
            print(f"[提示] 不是地图 (类别: {category})，跳过")
            # 移动到下一个格子
            current_row += 1
            if current_row >= grid_config['rows']:
                current_row = 0
                current_col += 1
            continue
        
        # 7. 处理该地图
        print(f"[处理] 开始处理地图: {result.get('name', '未知')} T{result.get('mapTier', 0)}")
        # 统计当前地图的黑白名单词缀
        map_blacklist_stats, map_whitelist_stats = count_affix_stats(result)
        # 合并到总统计中
        for affix, count in map_blacklist_stats.items():
            blacklist_stats[affix] = blacklist_stats.get(affix, 0) + count
        for affix, count in map_whitelist_stats.items():
            whitelist_stats[affix] = whitelist_stats.get(affix, 0) + count
        
        map_result = process_single_map(result, slot_x, slot_y)
        if map_result:
            processed_count += 1
            # 如果返回的是元组，第二个值表示是否满足条件
            if isinstance(map_result, tuple) and len(map_result) > 1 and map_result[1]:
                qualified_count += 1
            # 将处理数量、符合条件数量和词缀统计写入结果文件供前端显示
            # 立即更新统计信息，确保前端能够实时看到更新
            update_map_stats(processed_count, qualified_count, blacklist_stats, whitelist_stats)
            print(f"[完成] 地图处理完成，移动到下一个格子")
        
        # 8. 移动到下一个格子（列优先：先向下，到底部后移到下一列顶部）
        current_row += 1
        if current_row >= grid_config['rows']:
            current_row = 0
            current_col += 1
                
    print(f"[完成] 地图洗练结束，共处理 {processed_count} 张地图")
    play_success_sound()
    time.sleep(2)
    is_running = False

def process_single_map(initial_result, slot_x, slot_y):
    """Purpose: 针对单个格子的地图进行状态机式洗图/鉴定/腐化/存仓。
    Inputs: initial_result(解析结果 dict)、slot_x/slot_y(像素坐标)；使用全局 map_config、apply_currency、read_and_parse。
    Outputs: 返回 bool 或 (bool, bool) -> (是否完成, 是否满足条件)；可能触发鼠标键盘操作与文件写入。
    Preconditions: 鼠标可定位到 slot 坐标；通货坐标正确；map_config 配置完备。
    Edge cases: 传奇地图直接跳过；T17 点金模式禁止；最大迭代 max_iterations 防止死循环。
    """
    
    current_result = initial_result
    iteration = 0
    max_iterations = 200 # 防止死循环
    
    while is_running and iteration < max_iterations:
        iteration += 1
        
        # 基本信息提取
        is_corrupted = current_result.get("isCorrupted", False)
        is_unmodifiable = current_result.get("isUnmodifiable", False)
        rarity = current_result.get("rarity", "普通").replace(" ", "")
        tier = int(current_result.get("mapTier", 0))
        quality = int(current_result.get("quality", 0))
        is_legendary = current_result.get("isLegendary", False)
        
        print(f"  > [状态] T{tier} {rarity} 品质:{quality}% 腐化:{is_corrupted} 传奇:{is_legendary}")

        # 0. 传奇地图跳过
        if is_legendary:
            print("  > [跳过] 传奇地图")
            return True

        if is_unmodifiable:
            print("  > [跳过] 地图不可改变，无法使用通货")
            return True

        # 0.1 T17 + 点金模式 检查
        if tier == 17 and map_config['method'] == 'alchemy':
             print("  > [错误] T17地图不能使用点金模式")
             return True # 跳过

        # 0.2 检查是否已腐化且不满足要求 (无法修改)
        # 如果是瓦尔后检查阶段，这个逻辑会在后面处理
        if is_corrupted:
            # 检查基底和词缀是否满足（先检查基底，再检查词缀）
            auto_stash = map_config.get('autoStash', True)  # 默认启用
            if check_map_base(current_result) and check_map_mods(current_result):
                if auto_stash:
                    print("  > [成功] 已腐化但满足条件，存仓")
                    stash_item(slot_x, slot_y)
                else:
                    print("  > [成功] 已腐化且满足条件，但未启用自动存仓，跳过")
                return (True, True)  # 返回 (处理完成, 满足条件)
            else:
                print("  > [跳过] 已腐化且不满足条件")
                return (True, False)  # 返回 (处理完成, 不满足条件)

        method = map_config['method'] # alchemy or chaos
        
        # 打印当前地图状态（用于调试）
        print(f"  > [地图状态] Tier: {tier}, 稀有度: {rarity}, 品质: {quality}%, 腐化: {is_corrupted}, 方法: {method}")

        # 0.5 检查是否未鉴定，如果未鉴定则先鉴定
        is_unidentified = current_result.get("isUnidentified", False)
        if is_unidentified:
            print("  > [未鉴定] 检测到未鉴定地图，使用知识卷轴鉴定")
            if not apply_currency("wisdom", slot_x, slot_y): 
                print("  > [错误] 使用知识卷轴失败")
                return False
            # 重新读取和解析物品信息
            if not read_and_parse(slot_x, slot_y): 
                print("  > [错误] 鉴定后读取物品信息失败")
                return False
            current_result = wait_for_parse_result()
            if current_result.get("error"):
                print("  > [错误] 鉴定后解析物品信息失败")
                return False
            # 更新状态
            rarity = current_result.get("rarity", "普通").replace(" ", "")
            tier = int(current_result.get("mapTier", 0))
            quality = int(current_result.get("quality", 0))
            is_corrupted = current_result.get("isCorrupted", False)
            print(f"  > [鉴定完成] 鉴定后状态: T{tier} {rarity} 品质:{quality}% 腐化:{is_corrupted}")

        # 1. 预处理 (Scouring)
        # 点金模式：魔法或稀有 -> 重铸
        if method == 'alchemy':
            if rarity in ['魔法', '稀有']:
                 # 如果是稀有且满足条件，则无需重铸 (但在点金模式下，通常假设还没洗好，或者用户希望重新洗)
                 # 但为了防止误洗已经好的图，先检查一下？
                 # 用户指示："点金模式先对地图进行预处理... 混沌模式预处理要把地图预处理成稀有品质"
                 # 如果在点金模式下，遇到一个稀有图，可能是之前洗坏的，也可能是本来就有的。
                 # 如果满足条件，直接存仓？
                 # 逻辑：
                 #   如果当前状态满足条件 -> 瓦尔 -> 存仓
                 #   如果不满足 -> 重铸
                 # 注意：预处理阶段只检查是否满足，如果满足会跳过预处理，进入后续流程
                 if check_map_base(current_result) and check_map_mods(current_result):
                     pass # 这种情况会在后面 Step 6 处理
                 else:
                     print(f"  > [预处理] 状态{rarity}且不满足条件，使用重铸石")
                     if not apply_currency("scouring", slot_x, slot_y): return False
                     if not read_and_parse(slot_x, slot_y): return False
                     current_result = wait_for_parse_result()
                     if current_result.get("error"):
                         print("  > [错误] 读取物品信息失败")
                         return False
                     continue

        # 混沌模式：魔法 -> 重铸 (因为要变成稀有，魔法不能直接变稀有，除了用富豪，但这里逻辑是重铸再点金)
        if method == 'chaos':
             if rarity == '魔法':
                 print(f"  > [预处理] 魔法物品，使用重铸石")
                 if not apply_currency("scouring", slot_x, slot_y): return False
                 if not read_and_parse(slot_x, slot_y): return False
                 current_result = wait_for_parse_result()
                 continue
        
        # 更新状态
        rarity = current_result.get("rarity", "普通").replace(" ", "")
        quality = int(current_result.get("quality", 0))

        # 2. 制作/洗练 (Rolling)
        
        if method == 'alchemy':
            # 此时应该是普通品质 (或已满足条件的稀有，但已在上面check过，如果到这里说明不满足)
            # 如果是普通 -> 点金
            if rarity == '普通':
                print("  > [操作] 使用点金石")
                if not apply_currency("alchemy", slot_x, slot_y): return False
                if not read_and_parse(slot_x, slot_y): return False
                current_result = wait_for_parse_result()
                if current_result.get("error"):
                    print("  > [错误] 读取物品信息失败")
                    return False
                # 更新状态
                rarity = current_result.get("rarity", "普通").replace(" ", "")
                continue
            # 如果是稀有且不满足(理论上在Step 1会被重铸，除非是刚点金变成稀有的)
            # 如果刚点金变成稀有，下一次循环会检查基底和词缀。
            # 如果检查不满足，Step 1 会重铸。
        
        elif method == 'chaos':
            # 普通 -> 点金
            if rarity == '普通':
                print("  > [操作] 使用点金石")
                if not apply_currency("alchemy", slot_x, slot_y): return False
                if not read_and_parse(slot_x, slot_y): return False
                current_result = wait_for_parse_result()
                if current_result.get("error"):
                    print("  > [错误] 读取物品信息失败")
                    return False
                # 更新状态
                rarity = current_result.get("rarity", "普通").replace(" ", "")
                continue
            
            # 稀有 -> 混沌
            if rarity == '稀有':
                # 先检查基底，如果基底不满足，继续洗
                if not check_map_base(current_result):
                    print("  > [操作] 基底不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                # 如果基底满足，继续检查词缀（在下面Step 4处理）

        # 4. 检查基底是否满足（必须先检查基底）
        if not check_map_base(current_result):
            print("  > [检查] 地图基底不满足要求，继续洗练")
            # 根据模式继续洗
            if method == 'alchemy':
                # 点金模式：如果是稀有，重铸后继续；如果是普通，先点金
                if rarity == '稀有':
                    print("  > [操作] 基底不满足，使用重铸石")
                    if not apply_currency("scouring", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                elif rarity == '普通':
                    # 普通品质，先点金变成稀有，然后下一次循环会检查基底
                    print("  > [操作] 基底不满足，使用点金石")
                    if not apply_currency("alchemy", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            elif method == 'chaos':
                # 混沌模式：使用混沌石继续洗
                if rarity == '稀有':
                    print("  > [操作] 基底不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            continue

        # 5. 检查外延词缀是否满足（基底满足后才检查词缀）
        if not check_map_mods(current_result):
            print("  > [检查] 地图词缀不满足要求，继续洗练")
            # 根据模式继续洗
            if method == 'alchemy':
                # 点金模式：如果是稀有，重铸后继续；如果是普通，先点金
                if rarity == '稀有':
                    print("  > [操作] 词缀不满足，使用重铸石")
                    if not apply_currency("scouring", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
                elif rarity == '普通':
                    # 普通品质，先点金变成稀有，然后下一次循环会检查词缀
                    print("  > [操作] 词缀不满足，使用点金石")
                    if not apply_currency("alchemy", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            elif method == 'chaos':
                # 混沌模式：使用混沌石继续洗
                if rarity == '稀有':
                    print("  > [操作] 词缀不满足，使用混沌石")
                    if not apply_currency("chaos", slot_x, slot_y): return False
                    if not read_and_parse(slot_x, slot_y): return False
                    current_result = wait_for_parse_result()
                    if current_result.get("error"):
                        print("  > [错误] 读取物品信息失败")
                        return False
                    continue
            continue

        # 6. 基底和词缀都满足，进行后续处理
        print("  > [满足] 地图基底和词缀都符合要求")
        
        # 检查是否启用自动存仓
        auto_stash = map_config.get('autoStash', True)  # 默认启用
        
        # 7. 瓦尔宝珠逻辑
        if map_config['vaal']['enabled']:
            print("  > [操作] 使用瓦尔宝珠")
            if not apply_currency("vaal", slot_x, slot_y): return False
            
            # 瓦尔后需要重新读取
            if not read_and_parse(slot_x, slot_y): return False
            current_result = wait_for_parse_result()
            if current_result.get("error"):
                print("  > [错误] 读取物品信息失败")
                return False
            
            # 瓦尔后检查是否符合条件（先检查基底，再检查词缀）
            vaal_base_ok = check_map_base(current_result)
            vaal_mods_ok = check_map_mods(current_result)
            
            if vaal_base_ok and vaal_mods_ok:
                print("  > [检查] 瓦尔后仍满足条件")
                if auto_stash:
                    print("  > [成功] 存仓")
                    stash_item(slot_x, slot_y)
                else:
                    print("  > [完成] 未启用自动存仓，不存仓")
                return (True, True)  # 返回 (处理完成, 满足条件)
            else:
                if not vaal_base_ok:
                    print("  > [检查] 瓦尔后基底不满足条件，跳过")
                else:
                    print("  > [检查] 瓦尔后词缀不满足条件，跳过")
                return (True, False)  # 返回 (处理完成, 不满足条件)
        else:
            # 不瓦尔，直接存仓（如果启用自动存仓）
            if auto_stash:
                print("  > [成功] 制作完成，存仓")
                stash_item(slot_x, slot_y)
            else:
                print("  > [成功] 制作完成，但未启用自动存仓，跳过")
            return (True, True)  # 返回 (处理完成, 满足条件)
            
    return (True, False)  # 返回 (处理完成, 不满足条件)

def read_and_parse(x, y):
    # 辅助函数：移动鼠标，复制，等待解析
    if not move_mouse(x, y): return False
    # time.sleep(0.05)
    return read_clipboard_to_file()

def check_map_base(item_data):
    """Purpose: 使用统一六项配置校验地图基底。
    Inputs: item_data(解析结果); 依赖 map_config.match 的 mandatoryStats/optionalStats。
    Outputs: bool -> 是否通过；同时打印调试信息。
    Edge cases: 缺失属性按零处理；必选与挑选冲突时取较大值且不重复计数。
    """
    match_config = map_config['match']
    valid_keys = ('quantity', 'rarity', 'packSize', 'moreMaps', 'moreScarabs', 'moreCurrency')
    mandatory = {
        key: dict(value) for key, value in match_config.get('mandatoryStats', {}).items()
        if key in valid_keys
    }
    optional = {
        key: dict(value) for key, value in match_config.get('optionalStats', {}).items()
        if key in valid_keys
    }
    
    # 解决冲突：如果必选和挑选有相同key，取最大值作为必选，并从挑选移除
    conflict_keys = set(mandatory.keys()) & set(optional.keys())
    for key in conflict_keys:
        if mandatory[key].get('enabled') and optional[key].get('enabled'):
            val_m = mandatory[key].get('value', 0)
            val_o = optional[key].get('value', 0)
            final_val = max(val_m, val_o)
            mandatory[key]['value'] = final_val
            # 禁用optional中的该项，避免重复计算
            optional[key]['enabled'] = False
            
    for key, config in mandatory.items():
        if not config.get('enabled'):
            continue
        target_val = config.get('value', 0)
        current_val = get_stat_value(item_data, key)
        print(f"  > [基底检查] {key}: 当前值={current_val}, 要求值={target_val}, enabled={config.get('enabled')}")
        if current_val < target_val:
            print(f"  > [基底检查] {key} 不满足要求")
            return False
                
    # 检查挑选基底
    selected_count = match_config.get('selectedCount', 1)
    match_count = 0
    
    active_options = [k for k, v in optional.items() if v.get('enabled')]
    
    if active_options:
        for key in active_options:
            config = optional[key]
            # 再次确认enabled状态（虽然active_options已经过滤了，但为了安全）
            if not config.get('enabled'):
                continue
            target_val = config.get('value', 0)
            current_val = get_stat_value(item_data, key)
            print(f"  > [基底检查] {key}: 当前值={current_val}, 要求值={target_val}, enabled={config.get('enabled')}")
            if current_val >= target_val:
                match_count += 1
                print(f"  > [基底检查] {key} 满足要求 (已匹配: {match_count}/{selected_count})")
        
        if match_count < selected_count:
            print(f"  > [基底检查] 挑选基底不满足要求 (已匹配: {match_count}/{selected_count})")
            return False
            
    return True

def check_map_mods(item_data):
    """Purpose: 基于黑白名单校验地图词缀。
    Inputs: item_data.explicitMods；map_config.match.blacklist / whitelist。
    Outputs: bool -> 是否通过；命中白名单时提前通过。
    Edge cases: 黑名单命中立即失败；白名单为空则默认通过；日志仅保留必要输出。
    """
    match_config = map_config['match']
    explicit_mods = item_data.get('explicitMods', [])
    
    # 1. 检查黑名单 (Blacklist)
    blacklist = match_config.get('blacklist', [])
    for mod in explicit_mods:
        for black_term in blacklist:
            if black_term and black_term in mod:
                # print(f"  > [匹配] 发现黑名单词缀: {mod}")
                return False
                
    # 2. 检查白名单 (Whitelist) - 优先级最高
    whitelist = match_config.get('whitelist', [])
    if whitelist:
        for mod in explicit_mods:
            for white_term in whitelist:
                if white_term and white_term in mod:
                    print(f"  > [匹配] 命中白名单词缀: {mod}")
                    return True
                    
    return True

def count_affix_stats(item_data):
    # 统计黑白名单词缀出现次数
    match_config = map_config['match']
    explicit_mods = item_data.get('explicitMods', [])
    
    blacklist_stats = {}
    whitelist_stats = {}
    
    # 统计黑名单词缀拦截次数
    blacklist = match_config.get('blacklist', [])
    for mod in explicit_mods:
        for black_term in blacklist:
            if black_term and black_term in mod:
                blacklist_stats[black_term] = blacklist_stats.get(black_term, 0) + 1
                break  # 每个词缀只统计一次
    
    # 统计白名单词缀通过次数
    whitelist = match_config.get('whitelist', [])
    if whitelist:
        for mod in explicit_mods:
            for white_term in whitelist:
                if white_term and white_term in mod:
                    whitelist_stats[white_term] = whitelist_stats.get(white_term, 0) + 1
                    break  # 每个词缀只统计一次
    
    return blacklist_stats, whitelist_stats

def check_map_requirements(item_data):
    # 检查地图是否满足配置要求
    # 先检查基底，再检查词缀
    if not check_map_base(item_data):
        return False
    if not check_map_mods(item_data):
        return False
    return True

def get_stat_value(item_data, key):
    # 从item_data中提取属性值
    # key映射: quantity -> itemQuantity, rarity -> itemRarity, packSize -> monsterPackSize
    val = 0
    # 尝试直接从顶层属性获取 (解析器可能已经解析好)
    if key in item_data and isinstance(item_data[key], (int, float)):
        return int(item_data[key])
        
    if key == 'quantity':
        val = int(item_data.get('itemQuantity', 0))
        # 兼容旧的解析字段名
        if val == 0: val = int(item_data.get('quantity', 0))
    elif key == 'rarity':
        val = int(item_data.get('itemRarity', 0))
        if val == 0: val = int(item_data.get('rarity_val', 0)) # rarity通常是字符串，但也可能解析了数值
    elif key == 'packSize':
        val = int(item_data.get('monsterPackSize', 0))
        if val == 0: val = int(item_data.get('packSize', 0))
    elif key == 'moreMaps':
        # 优先从顶层属性获取（解析器已解析）
        val = int(item_data.get('moreMaps', 0))
        print(f"  > [属性提取] moreMaps: 从item_data获取={val}")
        # 如果顶层没有，尝试从词缀中提取（备用方案）
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            print(f"  > [属性提取] moreMaps: 尝试从词缀提取，词缀数量={len(mods)}")
            for mod in mods:
                if '地图' in mod and '掉落' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    print(f"  > [属性提取] moreMaps: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreMaps: 最终值={val}")
    elif key == 'moreScarabs':
        val = int(item_data.get('moreScarabs', 0))
        print(f"  > [属性提取] moreScarabs: 从item_data获取={val}")
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            for mod in mods:
                if '圣甲虫' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    if extracted > 0:
                        print(f"  > [属性提取] moreScarabs: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreScarabs: 最终值={val}")
    elif key == 'moreCurrency':
        val = int(item_data.get('moreCurrency', 0))
        print(f"  > [属性提取] moreCurrency: 从item_data获取={val}")
        if val == 0:
            mods = item_data.get('implicitMods', []) + item_data.get('explicitMods', [])
            for mod in mods:
                if '通货' in mod:
                    extracted = extract_number(mod)
                    val = max(val, extracted)
                    if extracted > 0:
                        print(f"  > [属性提取] moreCurrency: 从词缀'{mod}'提取={extracted}")
        print(f"  > [属性提取] moreCurrency: 最终值={val}")
                
    return val

def extract_number(text):
    import re
    nums = re.findall(r'\\d+', text)
    if nums:
        return int(nums[0])
    return 0

if __name__ == "__main__":
    try:
        sys.stdout.flush()
        sys.stderr.flush()
        print("[启动] 准备调用start_map_rolling()...")
        start_map_rolling()
        release_shift_if_held()
        print("[完成] 脚本执行结束")
    except KeyboardInterrupt:
        print("\\n[停止] 用户中断")
        is_running = False
        release_shift_if_held()
        sys.exit(0)
    except Exception as e:
        print(f"\\n[错误] 执行出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
`,nr=Object.freeze({default:80,min:20,max:500}),ro=e=>{if(e==null||typeof e=="boolean"||typeof e=="string"&&e.trim()==="")return null;const t=Number(e);return Number.isFinite(t)?t:null};function rr(e){const t=ro(e)??nr.default;return Math.max(nr.min,Math.min(nr.max,t))}function Q4(e={},t={}){if(e.operationDelayMs!=null)return rr(e.operationDelayMs);const n=ro(t.transferDelayMs);if(n!=null)return rr(n);const r=e.delays;if(r&&typeof r=="object"){const o=[(ro(r.mouseMove)??100)*.05,(ro(r.action)??50)*.2,(ro(r.clipboardRead)??100)*.2];return rr(Math.max(nr.default,...o))}return nr.default}const pm=`def enable_per_monitor_dpi_awareness():
    """让 Windows API 坐标始终按虚拟桌面的物理像素解释。"""
    if sys.platform != 'win32':
        return False
    import ctypes
    user32 = ctypes.windll.user32
    try:
        user32.SetProcessDpiAwarenessContext.argtypes = [ctypes.c_void_p]
        user32.SetProcessDpiAwarenessContext.restype = ctypes.c_bool
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(user32.SetProcessDPIAware())
        except Exception:
            return False


enable_per_monitor_dpi_awareness()
`;function X4(e){var B,T;const{globalShortcuts:t,currencyPositions:n,operationDelayMs:r,itemPosition:o,preset:s,filePaths:i,dpiScale:a=1}=e,l=(i==null?void 0:i.itemInfoFile)||"temp/item_info.txt",c=(i==null?void 0:i.itemInfoResultFile)||"temp/item_info_result.json",u=rr(r),f=(u/1e3).toFixed(3),p=y=>y.replace(/\\/g,"\\\\"),d=y=>y.split("+").map(A=>A.trim()).map(A=>{const I=A.toLowerCase();switch(I){case"commandorcontrol":case"cmdorctrl":case"control":case"ctrl":return"<ctrl>";case"alt":return"<alt>";case"shift":return"<shift>";case"meta":case"super":return"<cmd>";case"space":return"<space>";case"enter":case"return":return"<enter>";case"esc":case"escape":return"<esc>";case"tab":return"<tab>";case"up":return"<up>";case"down":return"<down>";case"left":return"<left>";case"right":return"<right>";default:return/^f\d+$/.test(I)?"<"+I+">":I}}).join("+"),m=()=>{if(!s.moduleTwo||!s.moduleTwo.enabled)return`def craft_affixes():
    return True`;const y=s.moduleTwo.mode||"alteration",M=s.moduleTwo.enableAugmentation||!1,U=s.moduleTwo.enableRegal||!1,A=s.moduleTwo.enableExalted||!1;let I=`def craft_affixes():
    # 词缀匹配逻辑
    try:
        print(f"[开始] 词缀匹配流程")
        
        # 移动到物品位置
        # print(f"[操作] 移动鼠标到物品位置以读取信息: ({item_position['x']}, {item_position['y']})")
        if not move_mouse(item_position['x'], item_position['y']):
            print("[错误] 初始移动到物品位置失败")
            return False
        time.sleep(0.02)
        
        # 读取当前物品信息
        if not read_clipboard_to_file():
            print("[错误] 初始读取物品信息失败")
            return False
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 初始解析错误: {result.get('error')}")
            return False
        
        if result.get("isLegendary", False):
            print("[停止] 检测到传奇物品，无法制作")
            time.sleep(3)
            return False
        
        # 预处理：确保物品进入正确的起始状态
        # print("[预处理] 开始状态检查...")
        preprocess_limit = 10
        preprocess_count = 0
        
        while preprocess_count < preprocess_limit:
            rarity = result.get("rarity", "").replace(" ", "")
            
            # 根据模式判断是否满足条件
            is_ready = False
            action_needed = None
`;return y==="alteration"?I+=`
            if rarity == "魔法":
                is_ready = True
            elif rarity == "普通":
                action_needed = "transmutation"
            else:
                # 其他情况（如稀有）都需要重铸
                action_needed = "scouring"
`:y==="chaos"?I+=`
            if rarity == "稀有":
                is_ready = True
            elif rarity == "普通":
                action_needed = "alchemy"
            else:
                # 魔法物品需要重铸
                action_needed = "scouring"
`:y==="alchemy"&&(I+=`
            # 点金模式：从普通开始点金
            if rarity == "普通":
                is_ready = True
            else:
                action_needed = "scouring"
`),I+=`
            if is_ready:
                # print(f"[预处理] 物品状态符合要求 ({rarity})，准备开始")
                break
            
            print(f"[预处理] 当前状态: {rarity}，执行操作: {action_needed}")
            
            if action_needed == "transmutation":
                print("[预处理] 普通物品 -> 使用蜕变石")
                if not apply_currency("transmutation"): 
                    print("[错误] 使用蜕变石失败")
                    return False
            elif action_needed == "alchemy":
                print("[预处理] 普通物品 -> 使用点金石")
                if not apply_currency("alchemy"):
                    print("[错误] 使用点金石失败")
                    return False
            elif action_needed == "scouring":
                print(f"[预处理] {rarity}物品 -> 使用重铸石")
                if not apply_currency("scouring"):
                    print("[错误] 使用重铸石失败")
                    return False
            
            time.sleep(0.05)
            
            # 重新读取物品信息
            if not read_clipboard_to_file():
                print("[错误] 读取物品信息失败")
                return False
            
            result = wait_for_parse_result()
            if result.get("error"):
                print(f"[错误] 解析错误: {result.get('error')}")
                return False
                
            preprocess_count += 1
        
        if preprocess_count >= preprocess_limit:
            print("[警告] 预处理超时，尝试直接开始...")
`,I+=`
        # 开始制作循环
        max_iterations = 1000
        iteration = 0
        
        print(f"[开始] 制作循环 (最大 {max_iterations} 次)")
        # print("[调试] 进入循环，is_running =", is_running)
        
        while is_running:
            iteration += 1
            if iteration % 10 == 0 or iteration == 1:
                print(f"[进度] 第 {iteration} 次")

            # 将当前循环次数写入结果文件供前端显示
            try:
                # 读取现有结果
                current_result = {}
                if os.path.exists(item_info_result_file):
                    with open(item_info_result_file, 'r', encoding='utf-8') as f:
                        content = f.read().strip()
                        if content:
                            current_result = json.loads(content)
                
                # 更新循环次数
                current_result['iteration'] = iteration
                
                # 写入文件
                with open(item_info_result_file, 'w', encoding='utf-8') as f:
                    f.write(json.dumps(current_result))
            except Exception as e:
                # 写入循环次数失败不影响主流程
                pass
            
            # 检查是否应该停止
            if not is_running:
                print("[停止] 收到停止信号")
                return False
            
            if iteration > max_iterations:
                print(f"[停止] 达到最大循环次数 ({max_iterations})，停止制作")
                time.sleep(3)
                return False
            
            # print(f"[调试] 第 {iteration} 次循环开始，准备使用通货...")
            
`,y==="alteration"?I+=`
            # 使用改造石
            print(f"[操作] 第 {iteration} 次 - 使用改造石")
            if not apply_currency("alteration"):
                print("[错误] 使用改造石失败，重试...")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`:y==="chaos"?I+=`
            # 使用混沌石
            print(f"[操作] 第 {iteration} 次 - 使用混沌石")
            if not apply_currency("chaos"):
                print("[错误] 使用混沌石失败，跳过本次循环")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`:y==="alchemy"&&(I+=`
            # 点金石模式循环：检查是否需要重铸
            # 如果物品不是普通品质（例如已经是稀有），先重铸
            current_rarity = result.get("rarity", "").replace(" ", "")
            if current_rarity != "普通":
                print(f"[操作] 第 {iteration} 次 - 物品非普通 ({current_rarity})，使用重铸石")
                if not apply_currency("scouring"):
                    print("[错误] 使用重铸石失败，跳过")
                    time.sleep(0.05)
                    continue
                time.sleep(0.05)
            
            # 使用点金石
            print(f"[操作] 第 {iteration} 次 - 使用点金石")
            if not apply_currency("alchemy"):
                print("[错误] 使用点金石失败，跳过本次循环")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`),I+=`
            # 复制物品并读取
            # print(f"[调试] 第 {iteration} 次 - 开始读取物品信息...")
            if not read_clipboard_to_file():
                print("[错误] 读取物品信息失败，重试...")
                time.sleep(0.05)
                continue
            
            # print(f"[调试] 第 {iteration} 次 - 等待解析结果...")
            result = wait_for_parse_result()
            
            # 检查解析结果是否有错误
            if result.get("error"):
                error_msg = result.get('error', '未知错误')
                print(f"[错误] 解析错误: {error_msg}，重试...")
                # 如果是超时错误，增加等待时间
                if "超时" in error_msg or "等待" in error_msg:
                    print("[提示] 可能是文件监听器未启动，请检查主进程")
                time.sleep(1)
                continue
            
            # print(f"[调试] 第 {iteration} 次 - 解析成功，检查是否需要增幅...")
            
            if result.get("isLegendary", False):
                print("[停止] 检测到传奇物品，停止制作")
                time.sleep(3)
                return False
            
            # 增幅石判定逻辑 (先于匹配检查)
            # 只有在改造石模式且启用了增幅石，且只有1条词缀时使用
            # 注意：不检查是否已经匹配，因为只有1条词缀必然不满足"可能有2条词缀"的完美情况(除非只要1条)，
            # 但既然开了增幅石，通常是希望补满词缀再判断
            should_augment = False
            if ${y==="alteration"&&M?"True":"False"} and result.get("rarity") == "魔法":
                explicit_mods = result.get("explicitMods", [])
                
                # 只有1条词缀就直接使用增幅
                if len(explicit_mods) == 1:
                    print(f"[提示] 检测到单词缀，先使用增幅石...")
                    should_augment = True

            if should_augment:
                # 使用增幅石
                print("[操作] 使用增幅石 (单词缀)")
                if not apply_currency("augmentation"):
                    print("[错误] 使用增幅石失败")
                    continue
                time.sleep(0.05)
                
                # 读取新状态
                # print("[调试] 读取增幅后物品信息...")
                if not read_clipboard_to_file():
                    continue
                
                result = wait_for_parse_result()
                if result.get("error"):
                    continue

            # 检查词缀匹配
            affix_match = result.get("affixMatch", False)
            required_all_matched = result.get("requiredAllMatched", False)
            matched_selected_count = result.get("matchedSelectedCount", 0)
            explicit_mods = result.get("explicitMods", [])
            detailed_mods = result.get("detailedMods", [])
            print(f"[调试] 第 {iteration} 次 - 词缀匹配检查:")
            print(f"  - affixMatch: {affix_match}")
            print(f"  - requiredAllMatched: {required_all_matched}")
            print(f"  - matchedSelectedCount: {matched_selected_count}")
            print(f"  - explicitMods数量: {len(explicit_mods) if explicit_mods else 0}")
            if explicit_mods:
                print(f"  - explicitMods: {explicit_mods[:3]}...")  # 只显示前3个
            if detailed_mods:
                print(f"  - detailedMods数量: {len(detailed_mods)}")
            if affix_match:
                print(f"[成功] 词缀匹配成功！(第 {iteration} 次)")
`,y==="alteration"?(M&&(I+=`
                # 使用增幅石
                print("[操作] 使用增幅石")
                if not apply_currency("augmentation"):
                    print("[错误] 使用增幅石失败")
                    return False
                time.sleep(0.05)
`),U&&(I+=`
                # 使用富豪石
                print("[操作] 使用富豪石")
                if not apply_currency("regal"):
                    print("[错误] 使用富豪石失败")
                    return False
                time.sleep(0.05)
`)):y==="chaos"&&A&&(I+=`
                # 使用崇高石
                print("[操作] 使用崇高石")
                if not apply_currency("exalted"):
                    print("[错误] 使用崇高石失败")
                    return False
                time.sleep(0.05)
`),I+=`
                print("[完成] 词缀制作完成！")
                time.sleep(2)
                return True
            
            elif should_augment:
                # 这一段逻辑已经上移，这里需要移除多余的代码
                pass

            # 未匹配，继续循环
            if iteration % 10 == 0:
                print(f"[检查] 第 {iteration} 次 - 未匹配，继续...")
            continue
    except Exception as e:
        print(f"词缀制作过程出错: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False
`,I},g=()=>{if(!s.moduleThree||!s.moduleThree.enabled)return`def craft_sockets():
    return True`;const y=s.moduleThree.socket||{},M=s.moduleThree.link||{},U=s.moduleThree.color||{};let A=`def craft_sockets():
    # 插槽制作逻辑
`;return y.enabled&&y.count>0?A+=`
    # 开孔流程
    if craft_socket_count(${y.count}):
`:A+=`
    # 跳过开孔流程
    if True:
`,M.enabled&&M.count>0?A+=`
        # 链接流程
        if craft_links(${M.count}):
`:A+=`
        # 跳过链接流程
        if True:
`,U.enabled&&(U.red>0||U.green>0||U.blue>0)?A+=`
            # 颜色流程
            if craft_colors(${U.red}, ${U.green}, ${U.blue}):
                print("[完成] 插槽制作完成！")
                time.sleep(2)
                return True
`:A+=`
            # 跳过颜色流程
            print("[完成] 插槽制作完成！")
            time.sleep(2)
            return True
`,A+=`
    return False

def craft_socket_count(target_count):
    # 开孔流程
    print(f"[开始] 开孔流程 (目标: {target_count} 孔)")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
        
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 开孔达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用工匠石
        print(f"[操作] 第 {iteration} 次 - 使用工匠石")
        if not right_click_currency("jewellers"):
            print("[错误] 右键点击工匠石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        current_count = result.get("socketsCount", 0)
        if current_count >= target_count:
            print(f"[成功] 插槽数量达到目标 ({current_count}/{target_count})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 {current_count}/{target_count} 孔")

def craft_links(target_links):
    # 链接流程
    print(f"[开始] 链接流程 (目标: {target_links} 连)")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
            
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 链接达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用链结石
        print(f"[操作] 第 {iteration} 次 - 使用链结石")
        if not right_click_currency("fusing"):
            print("[错误] 右键点击链结石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        current_links = result.get("links", 0)
        if current_links >= target_links:
            print(f"[成功] 链接数量达到目标 ({current_links}/{target_links})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 {current_links}/{target_links} 连")

def craft_colors(target_red, target_green, target_blue):
    # 颜色流程
    print(f"[开始] 颜色流程 (目标: 红{target_red} 绿{target_green} 蓝{target_blue})")
    max_iterations = 1000
    iteration = 0
    
    while is_running:
        iteration += 1
        if not is_running:
            print("[停止] 收到停止信号")
            return False
            
        # 将当前循环次数写入结果文件供前端显示
        try:
            # 读取现有结果
            current_result = {}
            if os.path.exists(item_info_result_file):
                with open(item_info_result_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        current_result = json.loads(content)
            
            # 更新循环次数
            current_result['iteration'] = iteration
            
            # 写入文件
            with open(item_info_result_file, 'w', encoding='utf-8') as f:
                f.write(json.dumps(current_result))
        except Exception as e:
            pass

        if iteration > max_iterations:
            print(f"[停止] 颜色达到最大循环次数 ({max_iterations})")
            time.sleep(3)
            return False
        
        # 使用幻色石
        print(f"[操作] 第 {iteration} 次 - 使用幻色石")
        if not right_click_currency("chromic"):
            print("[错误] 右键点击幻色石失败，重试...")
            time.sleep(0.05)
            continue
        if not left_click_item():
            print("[错误] 左键点击物品失败，重试...")
            time.sleep(0.05)
            continue
        time.sleep(0.05)
        
        # 复制物品并读取
        if not read_clipboard_to_file():
            print("[错误] 读取物品信息失败，重试...")
            time.sleep(0.05)
            continue
        
        result = wait_for_parse_result()
        
        # 检查解析结果是否有错误
        if result.get("error"):
            print(f"[错误] 解析错误: {result.get('error')}，重试...")
            time.sleep(1)
            continue
        
        colors = result.get("socketsColors", {})
        current_red = colors.get("red", 0)
        current_green = colors.get("green", 0)
        current_blue = colors.get("blue", 0)
        
        if (current_red >= target_red and 
            current_green >= target_green and 
            current_blue >= target_blue):
            print(f"[成功] 颜色达到目标 (红{current_red} 绿{current_green} 蓝{current_blue})")
            return True
        elif iteration % 20 == 0:
            print(f"[进度] 第 {iteration} 次 - 当前 红{current_red}/{target_red} 绿{current_green}/{target_green} 蓝{current_blue}/{target_blue}")
`,A},x=(t==null?void 0:t.end)||"Alt+3",b=d(x)||"<alt>+3",C={};if(n)for(const[y,M]of Object.entries(n))M&&(C[y]={x:Math.floor(M.x||0),y:Math.floor(M.y||0)});const v={x:Math.floor((o==null?void 0:o.x)||0),y:Math.floor((o==null?void 0:o.y)||0)};let P=J4;const R=y=>y.replace(/\btrue\b/g,"True").replace(/\bfalse\b/g,"False"),$={"{{GEN_DATE}}":new Date().toLocaleString(),"{{ITEM_INFO_FILE}}":p(l),"{{ITEM_INFO_RESULT_FILE}}":p(c),"{{DELAY_MOUSE_MOVE}}":f,"{{DELAY_MOUSE_CLICK}}":f,"{{DELAY_CLIPBOARD}}":u.toFixed(0),"{{CURRENCY_POSITIONS}}":R(JSON.stringify(C)),"{{ITEM_POSITION}}":R(JSON.stringify(v)),"{{DPI_SCALE_FACTOR}}":String(Math.min(3,Math.max(1,Number(a)||1))),"{{STOP_SHORTCUT}}":x,"{{PYNPUT_STOP_SHORTCUT}}":b,"{{ENABLE_AFFIX}}":(B=s.moduleTwo)!=null&&B.enabled?"True":"False","{{ENABLE_SOCKET}}":(T=s.moduleThree)!=null&&T.enabled?"True":"False","{{AFFIX_CRAFTING_FUNC}}":m(),"{{SOCKET_CRAFTING_FUNC}}":g(),"{{DPI_AWARENESS}}":pm};for(const[y,M]of Object.entries($))P=P.split(y).join(M);return P}function Z4(e){var $,B,T,y;const{globalShortcuts:t,currencyPositions:n,inventory:r,operationDelayMs:o,mapConfig:s,filePaths:i,dpiScale:a=1}=e,l=(i==null?void 0:i.itemInfoFile)||"temp/item_info.txt",c=(i==null?void 0:i.itemInfoResultFile)||"temp/item_info_result.json",u=rr(o),f=(u/1e3).toFixed(3),p=M=>M.replace(/\\/g,"\\\\"),d=M=>M.split("+").map(A=>A.trim()).map(A=>{const I=A.toLowerCase(),z={ctrl:"<ctrl>",control:"<ctrl>",alt:"<alt>",shift:"<shift>",cmd:"<cmd>",meta:"<cmd>",enter:"<enter>",return:"<enter>",esc:"<esc>",escape:"<esc>",tab:"<tab>",up:"<up>",down:"<down>",left:"<left>",right:"<right>"};return z[I]?z[I]:/^f\d+$/.test(I)?"<"+I+">":I}).join("+"),m=(t==null?void 0:t.end)||"Alt+3",g=d(m)||"<alt>+3",x={};if(n)for(const[M,U]of Object.entries(n))U&&(x[M]={x:Math.floor(U.x||0),y:Math.floor(U.y||0)});const b=s.grid||{},C={rows:b.rows||5,cols:b.cols||12,startX:(($=r==null?void 0:r.startPos)==null?void 0:$.x)||0,startY:((B=r==null?void 0:r.startPos)==null?void 0:B.y)||0,offsetX:((T=r==null?void 0:r.slotSize)==null?void 0:T.w)||0,offsetY:((y=r==null?void 0:r.slotSize)==null?void 0:y.h)||0};let v=Y4;const P=M=>M.replace(/\btrue\b/g,"True").replace(/\bfalse\b/g,"False"),R={"{{GEN_DATE}}":new Date().toLocaleString(),"{{ITEM_INFO_FILE}}":p(l),"{{ITEM_INFO_RESULT_FILE}}":p(c),"{{DELAY_MOUSE_MOVE}}":f,"{{DELAY_MOUSE_CLICK}}":f,"{{DELAY_CLIPBOARD}}":u.toFixed(0),"{{CURRENCY_POSITIONS}}":P(JSON.stringify(x)),"{{GRID_CONFIG}}":P(JSON.stringify(C)),"{{MAP_CONFIG}}":P(JSON.stringify(s)),"{{DPI_SCALE_FACTOR}}":String(Math.min(3,Math.max(1,Number(a)||1))),"{{STOP_SHORTCUT}}":m,"{{PYNPUT_STOP_SHORTCUT}}":g,"{{DPI_AWARENESS}}":pm};for(const[M,U]of Object.entries(R))v=v.split(M).join(U);return v}const e3=e=>{var o,s;const t=[],{itemPosition:n}=e;(!n||n.x===0&&n.y===0)&&t.push("物品位置未配置，请先在设置中抓取物品坐标");const{preset:r}=e;if(!r)t.push("未选择预设配置");else{const i=(o=r.moduleTwo)==null?void 0:o.enabled,a=(s=r.moduleThree)==null?void 0:s.enabled;if(!i&&!a&&t.push("请至少启用一个制作模块 (词缀或插槽)"),i){const l=r.moduleTwo.mode||"alteration",{currencyPositions:c}=e,u=(f,p)=>{(!(c!=null&&c[f])||c[f].x===0&&c[f].y===0)&&t.push(`未配置 ${p} (${f}) 的坐标`)};l==="alteration"?(u("alteration","改造石"),r.moduleTwo.enableAugmentation&&u("augmentation","增幅石"),r.moduleTwo.enableRegal&&u("regal","富豪石")):l==="chaos"?(u("chaos","混沌石"),r.moduleTwo.enableExalted&&u("exalted","崇高石")):l==="alchemy"&&(u("alchemy","点金石"),u("scouring","重铸石"))}if(a){const{currencyPositions:l}=e,c=r.moduleThree.socket,u=r.moduleThree.link,f=r.moduleThree.color,p=(d,m)=>{(!(l!=null&&l[d])||l[d].x===0&&l[d].y===0)&&t.push(`未配置 ${m} (${d}) 的坐标`)};c!=null&&c.enabled&&p("jewellers","工匠石"),u!=null&&u.enabled&&p("fusing","链结石"),f!=null&&f.enabled&&p("chromic","幻色石")}}return{isValid:t.length===0,errors:t}},t3=e=>{var a;const t=[],{inventory:n,currencyPositions:r,mapConfig:o}=e;if(!o)return t.push("未找到地图配置"),{isValid:!1,errors:t};(!(n!=null&&n.startPos)||n.startPos.x===0&&n.startPos.y===0)&&t.push("背包首格坐标未配置，请先在设置中填写"),(!(n!=null&&n.slotSize)||n.slotSize.w<=0||n.slotSize.h<=0)&&t.push("背包单格宽高未配置，请先在设置中填写");const s=(l,c)=>{(!(r!=null&&r[l])||r[l].x===0&&r[l].y===0)&&t.push(`未配置 ${c} (${l}) 的坐标`)},i=o.method||"alchemy";return i==="alchemy"?(s("alchemy","点金石"),s("scouring","重铸石")):i==="chaos"?(s("alchemy","点金石"),s("scouring","重铸石"),s("chaos","混沌石")):t.push(`未知的地图制作方式: ${i}`),(a=o.vaal)!=null&&a.enabled&&s("vaal","瓦尔宝珠"),{isValid:t.length===0,errors:t}},r6={物品数量:"quantity",物品稀有度:"rarity",怪物群大小:"packSize",更多地图:"moreMaps",更多圣甲虫:"moreScarabs",更多通货:"moreCurrency"},n3={quantity:["quantity","quantityNormal","quantityT17"],rarity:["rarity","rarityNormal","rarityT17"],packSize:["packSize","packSizeNormal","packSizeT17"]},r3=["moreMaps","moreScarabs","moreCurrency"];function $u(e){return{enabled:!!(e!=null&&e.enabled),value:Number.isFinite(Number(e==null?void 0:e.value))?Number(e.value):0}}function Ms(e={}){var n;const t={};for(const[r,o]of Object.entries(n3)){const s=o.filter(a=>e[a]).map(a=>$u(e[a])),i=s.filter(a=>a.enabled);t[r]={enabled:i.length>0,value:i.length>0?Math.max(...i.map(a=>a.value)):((n=s[0])==null?void 0:n.value)??0}}for(const r of r3)t[r]=$u(e[r]);return t}function aa(){return{method:"alchemy",vaal:{enabled:!0,checkAfter:!1},autoStash:!0,grid:{startX:0,startY:0,offsetX:0,offsetY:0,rows:5,cols:12},match:{blacklist:[],whitelist:[],selectedCount:1,mandatoryStats:Ms(),optionalStats:Ms()}}}function o3(e={}){const t=aa(),n=e.match||{};return{...t,...e,vaal:{...t.vaal,...e.vaal||{}},grid:{...t.grid,...e.grid||{}},match:{...t.match,...n,blacklist:Array.isArray(n.blacklist)?n.blacklist:[],whitelist:Array.isArray(n.whitelist)?n.whitelist:[],selectedCount:Math.max(1,Number(n.selectedCount)||1),mandatoryStats:Ms(n.mandatoryStats),optionalStats:Ms(n.optionalStats)},strategy:void 0,tiers:void 0}}function s3(e={}){const t=o3(e);return delete t.strategy,delete t.tiers,t}const o6=Object.freeze({locale:"zh-CN",gameVersion:"国服正式服-2026-07",updatedAt:"2026-07-21",source:"国服客户端商店文本离线快照"}),i3=Object.freeze([{id:"rr_any",label:"红红任意",preview:"RR*",expression:"r-r-|r-.-r|-r-r"},{id:"gg_any",label:"绿绿任意",preview:"GG*",expression:"g-g-|g-.-g|-g-g"},{id:"bb_any",label:"蓝蓝任意",preview:"BB*",expression:"b-b-|b-.-b|-b-b"},{id:"rrr",label:"三红",preview:"RRR",expression:"r-r-r"},{id:"rrg",label:"两红一绿",preview:"RRG",expression:"r-r-g|r-g-r|g-r-r"},{id:"rrb",label:"两红一蓝",preview:"RRB",expression:"r-r-b|r-b-r|b-r-r"},{id:"ggg",label:"三绿",preview:"GGG",expression:"g-g-g"},{id:"ggr",label:"两绿一红",preview:"GGR",expression:"g-g-r|g-r-g|r-g-g"},{id:"ggb",label:"两绿一蓝",preview:"GGB",expression:"g-g-b|g-b-g|b-g-g"},{id:"bbb",label:"三蓝",preview:"BBB",expression:"b-b-b"},{id:"bbr",label:"两蓝一红",preview:"BBR",expression:"b-b-r|b-r-b|r-b-b"},{id:"bbg",label:"两蓝一绿",preview:"BBG",expression:"b-b-g|b-g-b|g-b-b"},{id:"rgb",label:"红绿蓝",preview:"RGB",expression:"r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r"},{id:"r_any_any",label:"至少一红",preview:"R**",expression:"r-.-.|.-r-.|.-.-r"},{id:"g_any_any",label:"至少一绿",preview:"G**",expression:"g-.-.|.-g-.|.-.-g"},{id:"b_any_any",label:"至少一蓝",preview:"B**",expression:"b-.-.|.-b-.|.-.-b"}]),a3=Object.freeze([{id:"rr",label:"红红",preview:"RR",expression:"r-r"},{id:"gg",label:"绿绿",preview:"GG",expression:"g-g"},{id:"bb",label:"蓝蓝",preview:"BB",expression:"b-b"},{id:"rb",label:"红蓝",preview:"RB",expression:"r-b|b-r"},{id:"gr",label:"绿红",preview:"GR",expression:"g-r|r-g"},{id:"bg",label:"蓝绿",preview:"BG",expression:"b-g|g-b"}]),l3=Object.freeze([{id:"any_colored_two",label:"任意双色相连",expression:"r-g|g-r|r-b|b-r|g-b|b-g"},{id:"any_colored_three",label:"任意三色相连",expression:"r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r"},{id:"any_three",label:"任意三连",expression:"-[rgbw]-"},{id:"any_four",label:"任意四连",expression:"(-[rgbw]){3}"},{id:"any_five",label:"任意五连",expression:"(-[rgbw]){4}"},{id:"any_six",label:"任意六连",expression:"(-[rgbw]){5}"},{id:"any_six_socket",label:"任意六孔",expression:"([rgbw][ -]){5}[rgbw]"}]),c3=Object.freeze([{id:"movement_10",label:"移动速度提高 10%",expression:"移动速度.*10%"},{id:"movement_15",label:"移动速度提高 15%",expression:"移动速度.*15%"}]),u3=Object.freeze([{id:"plus_any",label:"+1 任意法术技能石",expression:"所有法术.*技能石等级.*1"},{id:"plus_lightning",label:"+1 闪电法术技能石",expression:"闪电法术.*技能石等级.*1"},{id:"plus_fire",label:"+1 火焰法术技能石",expression:"火焰法术.*技能石等级.*1"},{id:"plus_cold",label:"+1 冰霜法术技能石",expression:"冰霜法术.*技能石等级.*1"},{id:"plus_physical",label:"+1 物理法术技能石",expression:"物理.*法术.*技能石等级.*1"},{id:"plus_chaos",label:"+1 混沌法术技能石",expression:"混沌法术.*技能石等级.*1"}]),f3=Object.freeze([{id:"physical_damage",label:"物理伤害提高",expression:"物理伤害提高"},{id:"fire_dot",label:"火焰持续伤害加成",expression:"火焰持续伤害加成"},{id:"cold_dot",label:"冰霜持续伤害加成",expression:"冰霜持续伤害加成"},{id:"chaos_dot",label:"混沌持续伤害加成",expression:"混沌持续伤害加成"}]),p3=Object.freeze([{id:"axe",label:"斧",expression:"物品类别:.+斧"},{id:"mace",label:"锤",expression:"物品类别:.+锤"},{id:"sword",label:"剑",expression:"物品类别:.+剑"},{id:"staff",label:"长杖",expression:"物品类别:.+长杖"},{id:"sceptre",label:"权杖",expression:"物品类别:.+权杖"},{id:"claw",label:"爪",expression:"物品类别:.+爪"},{id:"bow",label:"弓",expression:"物品类别:.+弓"},{id:"wand",label:"法杖",expression:"物品类别:.+法杖"},{id:"dagger",label:"匕首",expression:"物品类别:.+匕首"},{id:"shield",label:"盾牌",expression:"物品类别:.+盾牌"}]),d3=Object.freeze({threeLinks:i3,twoLinks:a3,anyLinks:l3,movement:c3,plusGems:u3,damage:f3,weaponTypes:p3}),Un=Object.fromEntries(Object.entries(d3).map(([e,t])=>[e,new Set(t.map(n=>n.id))]));function m3(){return{threeLinks:[],twoLinks:[],anyLinks:[],exactColors:{enabled:!1,red:0,green:0,blue:0},movement:[],plusGems:[],damage:[],weaponTypes:[]}}const Gn=(e,t)=>Array.isArray(e)?[...new Set(e.filter(n=>typeof n=="string"&&t.has(n)))]:[],Ai=e=>{const t=Number(e);return Number.isFinite(t)?Math.max(0,Math.min(6,Math.trunc(t))):0};function h3(e){const t=e&&typeof e=="object"?e:{},n=t.exactColors&&typeof t.exactColors=="object"?t.exactColors:{};return{threeLinks:Gn(t.threeLinks,Un.threeLinks),twoLinks:Gn(t.twoLinks,Un.twoLinks),anyLinks:Gn(t.anyLinks,Un.anyLinks),exactColors:{enabled:!!n.enabled,red:Ai(n.red),green:Ai(n.green),blue:Ai(n.blue)},movement:Gn(t.movement,Un.movement),plusGems:Gn(t.plusGems,Un.plusGems),damage:Gn(t.damage,Un.damage),weaponTypes:Gn(t.weaponTypes,Un.weaponTypes)}}function Qn(e="default",t="默认预设"){return{id:e,name:t,vendor:m3()}}function g3(e,t="default",n="默认预设"){const r=e&&typeof e=="object"?e:{};return{id:typeof r.id=="string"&&r.id?r.id:t,name:typeof r.name=="string"&&r.name.trim()?r.name.trim():n,vendor:h3(r.vendor)}}function _3(e){if(!Array.isArray(e))return[Qn()];const t=[],n=new Set;return e.forEach((o,s)=>{const i=g3(o,`shop_preset_${s+1}`,`预设${s+1}`);n.has(i.id)||(n.add(i.id),t.push(i))}),t.findIndex(o=>o.id==="default")===-1&&t.unshift(Qn()),t.length?t:[Qn()]}const dm=Wr("preset",()=>{const e=L([{id:"default",name:"默认预设",moduleTwo:{enabled:!0,mode:"alteration",requiredAffixes:[],selectedAffixes:[],selectedCount:1,enableAugmentation:!1,enableRegal:!1,enableExalted:!1},moduleThree:{enabled:!1,socket:{enabled:!1,count:0},link:{enabled:!1,count:0},color:{enabled:!1,red:0,green:0,blue:0}}}]),t=L([{id:"default",name:"默认预设",map:aa()}]),n=L([Qn()]),r=L("default"),o=L("default"),s=L("default"),i=k(()=>e.value.find(T=>T.id===r.value)||e.value[0]),a=k(()=>t.value.find(T=>T.id===o.value)||t.value[0]),l=k(()=>n.value.find(T=>T.id===s.value)||n.value[0]);function c(T){const y={id:`preset_${Date.now()}`,name:T||`预设${e.value.length}`,moduleTwo:{enabled:!0,mode:"alteration",requiredAffixes:[],selectedAffixes:[],selectedCount:1,enableAugmentation:!1,enableRegal:!1,enableExalted:!1},moduleThree:{enabled:!1,socket:{enabled:!1,count:0},link:{enabled:!1,count:0},color:{enabled:!1,red:0,green:0,blue:0}}};return e.value.push(y),r.value=y.id,R(),y}function u(T){const y={id:`map_preset_${Date.now()}`,name:T||`预设${t.value.length}`,map:aa()};return t.value.push(y),o.value=y.id,R(),y}function f(T){const y=Qn(`shop_preset_${Date.now()}`,T||`预设${n.value.length}`);return n.value.push(y),s.value=y.id,R(),y}function p(T){if(T==="default")return!1;const y=e.value.findIndex(M=>M.id===T);return y>-1?(e.value.splice(y,1),r.value===T&&(r.value="default"),R(),!0):!1}function d(T){if(T==="default")return!1;const y=t.value.findIndex(M=>M.id===T);return y>-1?(t.value.splice(y,1),o.value===T&&(o.value="default"),R(),!0):!1}function m(T){if(T==="default")return!1;const y=n.value.findIndex(M=>M.id===T);return y>-1?(n.value.splice(y,1),s.value===T&&(s.value="default"),R(),!0):!1}function g(T){return e.value.find(M=>M.id===T)?(r.value=T,R(),!0):!1}function x(T){return t.value.find(M=>M.id===T)?(o.value=T,R(),!0):!1}function b(T){return n.value.find(M=>M.id===T)?(s.value=T,R(),!0):!1}function C(T){const y=i.value;y&&(Object.assign(y,T),R())}function v(T){const y=a.value;y&&(Object.assign(y,T),R())}function P(T){const y=l.value;y&&(Object.assign(y,T),R())}function R(){try{localStorage.setItem("itemPresets",JSON.stringify(e.value)),localStorage.setItem("currentItemPresetId",r.value),localStorage.setItem("mapPresets",JSON.stringify(t.value)),localStorage.setItem("currentMapPresetId",o.value),localStorage.setItem("shopPresets",JSON.stringify(n.value)),localStorage.setItem("currentShopPresetId",s.value)}catch{}}function $(){try{const T=localStorage.getItem("itemPresets"),y=localStorage.getItem("currentItemPresetId"),M=localStorage.getItem("mapPresets"),U=localStorage.getItem("currentMapPresetId"),A=localStorage.getItem("presets"),I=localStorage.getItem("currentPresetId");if(T)e.value=JSON.parse(T);else if(A){const z=JSON.parse(A);z.forEach(X=>{X.map&&delete X.map,X.moduleOne&&delete X.moduleOne,X.shortcuts&&delete X.shortcuts}),e.value=z}if(y?r.value=y:I&&e.value.find(z=>z.id===I)&&(r.value=I),M){const z=JSON.parse(M);z.forEach(X=>{const G=X.map||{};G.chisel&&delete G.chisel,X.map=s3(G)}),t.value=z}U&&(o.value=U)}catch{}}function B(){try{const T=localStorage.getItem("shopPresets"),y=localStorage.getItem("currentShopPresetId");n.value=T?_3(JSON.parse(T)):[Qn()],s.value=n.value.some(M=>M.id===y)?y:"default"}catch{n.value=[Qn()],s.value="default"}}return $(),B(),{itemPresets:e,mapPresets:t,shopPresets:n,currentItemPresetId:r,currentMapPresetId:o,currentShopPresetId:s,currentItemPreset:i,currentMapPreset:a,currentShopPreset:l,presets:e,currentPresetId:r,currentPreset:i,addPreset:c,deletePreset:p,switchPreset:g,updateCurrentPreset:C,addItemPreset:c,addMapPreset:u,addShopPreset:f,deleteItemPreset:p,deleteMapPreset:d,deleteShopPreset:m,switchItemPreset:g,switchMapPreset:x,switchShopPreset:b,updateCurrentItemPreset:C,updateCurrentMapPreset:v,updateCurrentShopPreset:P,savePresets:R,loadPresets:$,loadShopPresets:B}}),ju={enabled:!0,point:{x:0,y:0},threshold:60,keys:[],recoveryMode:"duration",recoveryCooldownMs:500,instantIntervalMs:100};function la(){return{potion:{scanIntervalMs:100,maxTriggersPerSecond:5,protectionCooldownMs:1e3,health:{...ju,point:{x:200,y:1850},threshold:60,keys:["1","2","3","4","5","w"]},mana:{...ju,point:{x:3622,y:1944},threshold:80,keys:["5"],recoveryCooldownMs:2e3}},portal:{openKey:"Numpad1",clickPoint:{x:1908,y:890},waitMs:500}}}function xr(e,t,n=1){const r=Number(e);return Number.isFinite(r)&&r>=n?r:t}function Hu(e,t){var n,r;return{...t,...e||{},enabled:(e==null?void 0:e.enabled)===void 0?t.enabled:!!e.enabled,point:{x:Number.isFinite(Number((n=e==null?void 0:e.point)==null?void 0:n.x))?Number(e.point.x):t.point.x,y:Number.isFinite(Number((r=e==null?void 0:e.point)==null?void 0:r.y))?Number(e.point.y):t.point.y},threshold:Math.min(255,Math.max(0,Number((e==null?void 0:e.threshold)??t.threshold))),keys:Array.isArray(e==null?void 0:e.keys)?e.keys.map(o=>String(o).trim()).filter(Boolean):t.keys,recoveryMode:(e==null?void 0:e.recoveryMode)==="instant"?"instant":"duration",recoveryCooldownMs:xr(e==null?void 0:e.recoveryCooldownMs,t.recoveryCooldownMs),instantIntervalMs:xr(e==null?void 0:e.instantIntervalMs,t.instantIntervalMs)}}function Vu(e={}){var n,r,o,s,i,a,l,c,u,f,p;const t=la();return{potion:{scanIntervalMs:xr((n=e.potion)==null?void 0:n.scanIntervalMs,t.potion.scanIntervalMs,10),maxTriggersPerSecond:xr((r=e.potion)==null?void 0:r.maxTriggersPerSecond,t.potion.maxTriggersPerSecond),protectionCooldownMs:xr((o=e.potion)==null?void 0:o.protectionCooldownMs,t.potion.protectionCooldownMs),health:Hu((s=e.potion)==null?void 0:s.health,t.potion.health),mana:Hu((i=e.potion)==null?void 0:i.mana,t.potion.mana)},portal:{openKey:String(((a=e.portal)==null?void 0:a.openKey)||t.portal.openKey).trim(),clickPoint:{x:Number.isFinite(Number((c=(l=e.portal)==null?void 0:l.clickPoint)==null?void 0:c.x))?Number(e.portal.clickPoint.x):t.portal.clickPoint.x,y:Number.isFinite(Number((f=(u=e.portal)==null?void 0:u.clickPoint)==null?void 0:f.y))?Number(e.portal.clickPoint.y):t.portal.clickPoint.y},waitMs:xr((p=e.portal)==null?void 0:p.waitMs,t.portal.waitMs,0)}}}function v3(e={}){const t=[],r=[["health","生命药剂"],["mana","魔力药剂"]].filter(([o])=>{var s,i;return(i=(s=e.potion)==null?void 0:s[o])==null?void 0:i.enabled});r.length||t.push("请至少启用一项生命或魔力检测");for(const[o,s]of r){const i=e.potion[o];(!i.point||Number(i.point.x)===0&&Number(i.point.y)===0)&&t.push(`${s}检测坐标未配置`),(!Array.isArray(i.keys)||i.keys.length===0)&&t.push(`${s}按键序列未配置`)}return{isValid:t.length===0,errors:t}}const Rs=Object.freeze({itemStart:"Alt+1",mapStart:"Alt+2",end:"Alt+3",potionStart:"Numpad7",potionStop:"Numpad8",portal:"Numpad2",storyPrevious:"PageUp",storyNext:"PageDown"}),zu=(e={})=>{const t={};for(const n of Object.keys(Rs))typeof(e==null?void 0:e[n])=="string"&&(t[n]=e[n]);return{...Rs,...t}},y3=(e,t)=>{const n=t==null?void 0:t[e];return typeof n!="function"?!1:(n(),!0)},ca=!0;function b3(e){return typeof e=="boolean"?e:ca}const Sr="auto",vo="manual";function Wt(e,t=null){const n=Number(e);return!Number.isFinite(n)||n<1||n>3?t:Number(n.toFixed(4))}function w3(e={}){const t=Wt(e.dpiScale,null),n=e.dpiMode===Sr||e.dpiMode===vo;return{mode:n?e.dpiMode:Sr,manualScale:Wt(e.manualDpiScale,t??1),lastDetectedScale:Wt(e.lastDetectedDpiScale,n?null:t)}}function x3({mode:e,manualScale:t,detectedScale:n,lastDetectedScale:r,primaryScale:o}={}){if(e===vo)return{scaleFactor:Wt(t,1),source:"manual"};const s=Wt(n,null);if(s!=null)return{scaleFactor:s,source:"game"};const i=Wt(r,null);return i!=null?{scaleFactor:i,source:"history"}:{scaleFactor:Wt(o,1),source:"primary"}}function Ii(e={}){const{chisel:t,...n}=e;return n}const vn=Wr("settings",()=>{const e=L({...Rs}),t=L({status:"pending",error:"",failed:[]}),n=L(la()),r=L({alteration:{x:210,y:561},augmentation:{x:425,y:663},regal:{x:830,y:555},chaos:{x:1040,y:567},exalted:{x:570,y:567},alchemy:{x:933,y:567},scouring:{x:822,y:1e3},transmutation:{x:110,y:567},jewellers:{x:209,y:797},fusing:{x:323,y:797},chromic:{x:428,y:798},vaal:{x:1158,y:1017},wisdom:{x:210,y:430}}),o=L({startPos:{x:2658,y:1199},slotSize:{w:100,h:100}}),s=L(nr.default),i=L({x:636,y:930}),a=L(Sr),l=L(1),c=L(null),u=L(null),f=L(1),p=L("idle"),d=L(""),m=L(""),g=k(()=>x3({mode:a.value,manualScale:l.value,detectedScale:u.value,lastDetectedScale:c.value,primaryScale:f.value})),x=k(()=>g.value.scaleFactor),b=k(()=>g.value.source),C=L(!1),v=L({backgroundPath:"",blur:4,maskOpacity:.5}),P=L(560),R=L(ca),$=L([]);function B(W){e.value={...e.value,...W},se()}function T(W,h){r.value[W]={...h},se()}function y(W){o.value={...o.value,...W},se()}function M(W={}){t.value={status:W.success===!0?"ready":"error",error:String(W.error||""),failed:Array.isArray(W.failed)?W.failed:[]}}function U(W){var h;return s.value=rr(W),se(),(h=pe.bag.updateOperationDelay(s.value))==null||h.catch(()=>{}),s.value}function A(W){n.value=Vu(W),se()}function I(W){i.value={...W},se()}function z(W){l.value=Wt(W,l.value),se()}function X(W){a.value=W===vo?vo:Sr,a.value===vo&&(u.value=null,p.value="idle",m.value=""),se()}async function G(){if(a.value!==Sr)return{success:!0,skipped:!0,scaleFactor:x.value,source:b.value};p.value="detecting",m.value="";try{const W=await pe.system.detectGameDpi();f.value=Wt(W==null?void 0:W.primaryScaleFactor,f.value);const h=W!=null&&W.found?Wt(W.scaleFactor,null):null;if(h!=null)return u.value=h,c.value=h,d.value=String(W.windowTitle||""),p.value="success",se(),{success:!0,scaleFactor:x.value,source:b.value,windowTitle:d.value};u.value=null,d.value="",p.value="error",m.value=(W==null?void 0:W.error)||"未找到游戏窗口"}catch(W){u.value=null,d.value="",p.value="error",m.value=(W==null?void 0:W.message)||"识别游戏 DPI 失败"}return se(),{success:!1,scaleFactor:x.value,source:b.value,error:m.value}}function O(W){v.value={...v.value,...W},W.backgroundPath&&S({path:W.backgroundPath}),se(),pe&&pe.overlay&&pe.overlay.updateSettings&&pe.overlay.updateSettings(JSON.parse(JSON.stringify(v.value)))}function S(W){const h=$.value.findIndex(_=>_.path===W.path);h!==-1&&$.value.splice(h,1),$.value.unshift(W),$.value.length>6&&($.value=$.value.slice(0,6))}function V(W){$.value.splice(W,1),se()}function se(){try{localStorage.setItem("settings",JSON.stringify({globalShortcuts:e.value,currencyPositions:Ii(r.value),inventory:o.value,operationDelayMs:s.value,itemPosition:i.value,dpiScale:x.value,dpiMode:a.value,manualDpiScale:l.value,lastDetectedDpiScale:c.value,debugMode:C.value,overlaySettings:v.value,storyOverlayWidth:P.value,storyShowSkillRequiredLevel:R.value,backgroundHistory:$.value,combatAssist:n.value}))}catch{}}function he(){try{const W=localStorage.getItem("settings"),h=W?JSON.parse(W):{};let _={};try{_=JSON.parse(localStorage.getItem("bagSettings")||"{}")}catch{}if(s.value=Q4(h,_),W){h.globalShortcuts?e.value=zu(h.globalShortcuts):e.value=zu(),h.currencyPositions?r.value={...r.value,...Ii(h.currencyPositions)}:r.value=Ii(r.value),h.inventory&&(o.value={...o.value,...h.inventory}),h.itemPosition&&(i.value={...h.itemPosition});const E=w3(h);a.value=E.mode,l.value=E.manualScale,c.value=E.lastDetectedScale,typeof h.debugMode=="boolean"&&(C.value=h.debugMode),h.overlaySettings&&(v.value={...v.value,...h.overlaySettings}),h.backgroundHistory&&($.value=h.backgroundHistory),h.storyOverlayWidth!=null&&(P.value=Math.max(360,Math.min(1200,Math.round(Number(h.storyOverlayWidth)||560)))),R.value=b3(h.storyShowSkillRequiredLevel),n.value=Vu(h.combatAssist)}}catch{}}const re=Rs,ge={alteration:{x:210,y:561},augmentation:{x:425,y:663},regal:{x:830,y:555},chaos:{x:1040,y:567},exalted:{x:570,y:567},alchemy:{x:933,y:567},scouring:{x:822,y:1e3},transmutation:{x:110,y:567},jewellers:{x:209,y:797},fusing:{x:323,y:797},chromic:{x:428,y:798},vaal:{x:1158,y:1017},wisdom:{x:210,y:430}},_e=W=>{P.value=Math.max(360,Math.min(1200,Math.round(Number(W)||560))),se(),pe.storyOverlay.resize({width:P.value})},Ae=W=>{R.value=!!W,se()},ke={startPos:{x:2658,y:1199},slotSize:{w:100,h:100}},N={x:636,y:930},te={backgroundPath:"",blur:4,maskOpacity:.5};function Z(){var W;e.value={...re},r.value={...ge},o.value={...ke},s.value=nr.default,i.value={...N},a.value=Sr,l.value=1,c.value=null,u.value=null,f.value=1,p.value="idle",d.value="",m.value="",C.value=!1,v.value={...te},P.value=560,R.value=ca,$.value=[],n.value=la(),se(),(W=pe.bag.updateOperationDelay(s.value))==null||W.catch(()=>{}),pe&&pe.overlay&&pe.overlay.updateSettings&&pe.overlay.updateSettings(JSON.parse(JSON.stringify(v.value))),pe.window.setDevToolsVisible(!1)}function le(W){C.value=!!W,se()}return he(),{globalShortcuts:e,shortcutHealth:t,combatAssist:n,currencyPositions:r,inventory:o,operationDelayMs:s,itemPosition:i,dpiScale:x,dpiMode:a,manualDpiScale:l,lastDetectedDpiScale:c,detectedDpiScale:u,primaryDpiScale:f,dpiSource:b,dpiDetectionStatus:p,dpiWindowTitle:d,dpiDetectionError:m,debugMode:C,overlaySettings:v,storyOverlayWidth:P,storyShowSkillRequiredLevel:R,backgroundHistory:$,updateGlobalShortcuts:B,updateShortcutHealth:M,updateCombatAssist:A,updateCurrencyPosition:T,updateInventorySettings:y,updateOperationDelay:U,updateItemPosition:I,updateManualDpiScale:z,updateDpiMode:X,refreshDpiScale:G,updateDebugMode:le,updateOverlaySettings:O,updateStoryOverlayWidth:_e,updateStoryShowSkillRequiredLevel:Ae,removeHistoryItem:V,saveSettings:se,loadSettings:he,resetSettings:Z}}),Mo=Wr("script",()=>{const e=L(!1),t=L(null),n=L(null),r=L(""),o=L(null);function s(a={}){const l=a.isRunning===!0||a.status==="running";e.value=l,t.value=l&&(a.mode==="items"||a.mode==="map")?a.mode:null,(a.mode==="items"||a.mode==="map")&&(o.value=a.mode),n.value=l?a.processId??null:null,a.status==="error"?r.value=a.error||"制作脚本异常退出":(l||a.status==="stopped")&&(r.value="")}function i(){e.value=!1,t.value=null,n.value=null,r.value="",o.value=null}return{isRunning:e,mode:t,processId:n,lastError:r,lastMode:o,applyStatus:s,reset:i}}),dl=`"""流放助手战斗辅助：自动喝药、像素采样和一键回城。"""

import argparse
import ctypes
import json
import signal
import sys
import time


def enable_per_monitor_dpi_awareness():
    """让 Windows API 坐标始终按虚拟桌面的物理像素解释。"""
    if sys.platform != "win32":
        return False
    user32 = ctypes.windll.user32
    try:
        user32.SetProcessDpiAwarenessContext.argtypes = [ctypes.c_void_p]
        user32.SetProcessDpiAwarenessContext.restype = ctypes.c_bool
        if user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4)):
            return True
    except Exception:
        pass
    try:
        return ctypes.windll.shcore.SetProcessDpiAwareness(2) == 0
    except Exception:
        try:
            return bool(user32.SetProcessDPIAware())
        except Exception:
            return False


enable_per_monitor_dpi_awareness()


GAME_WINDOW_TITLES = ("流放之路", "Path of Exile")
running = True


def emit(event, **payload):
    print("EVENT " + json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def should_trigger(value, threshold, now_ms, last_trigger_ms, mode, recovery_ms, instant_ms):
    if value >= threshold:
        return False
    interval = instant_ms if mode == "instant" else recovery_ms
    return last_trigger_ms <= 0 or now_ms - last_trigger_ms >= max(1, interval)


class RateLimiter:
    def __init__(self, maximum, cooldown_ms):
        self.maximum = max(1, int(maximum))
        self.cooldown_ms = max(1, int(cooldown_ms))
        self.recent = []
        self.protected_until = 0

    def allow(self, now_ms):
        if now_ms < self.protected_until:
            return False, "protected"
        self.recent = [stamp for stamp in self.recent if now_ms - stamp < 1000]
        if len(self.recent) >= self.maximum:
            self.protected_until = now_ms + self.cooldown_ms
            self.recent = []
            return False, "limit"
        self.recent.append(now_ms)
        return True, "ok"


def is_game_foreground():
    if sys.platform != "win32":
        return False
    hwnd = ctypes.windll.user32.GetForegroundWindow()
    length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
    buffer = ctypes.create_unicode_buffer(length + 1)
    ctypes.windll.user32.GetWindowTextW(hwnd, buffer, length + 1)
    title = buffer.value
    return any(expected.lower() in title.lower() for expected in GAME_WINDOW_TITLES)


def read_pixel(point):
    if sys.platform != "win32":
        raise RuntimeError("像素采样仅支持 Windows")
    x, y = int(point.get("x", 0)), int(point.get("y", 0))
    user32 = ctypes.windll.user32
    gdi32 = ctypes.windll.gdi32
    gdi32.GetPixel.restype = ctypes.c_uint32
    device_context = user32.GetDC(0)
    if not device_context:
        raise RuntimeError("无法获取屏幕设备上下文")
    try:
        color = gdi32.GetPixel(device_context, x, y)
        if color == 0xFFFFFFFF:
            raise RuntimeError(f"无法读取屏幕坐标 ({x}, {y})")
        return {
            "r": color & 0xFF,
            "g": (color >> 8) & 0xFF,
            "b": (color >> 16) & 0xFF
        }
    finally:
        user32.ReleaseDC(0, device_context)


def key_to_virtual_code(name):
    value = str(name).strip()
    lower = value.lower()
    aliases = {
        "ctrl": 0x11, "control": 0x11, "alt": 0x12, "shift": 0x10,
        "enter": 0x0D, "return": 0x0D, "esc": 0x1B, "escape": 0x1B,
        "space": 0x20, "tab": 0x09, "up": 0x26, "down": 0x28,
        "left": 0x25, "right": 0x27
    }
    if lower in aliases:
        return aliases[lower]
    if lower.startswith("f") and lower[1:].isdigit():
        number = int(lower[1:])
        if 1 <= number <= 24:
            return 0x70 + number - 1
    if lower.startswith("numpad") and lower[6:].isdigit():
        number = int(lower[6:])
        if 0 <= number <= 9:
            return 0x60 + number
    if len(value) == 1:
        virtual_code = ctypes.windll.user32.VkKeyScanW(ord(value))
        if virtual_code != -1:
            return virtual_code & 0xFF
    raise ValueError(f"不支持的按键: {name}")


def send_sequence(keys):
    user32 = ctypes.windll.user32
    for name in keys:
        virtual_code = key_to_virtual_code(name)
        user32.keybd_event(virtual_code, 0, 0, 0)
        user32.keybd_event(virtual_code, 0, 0x0002, 0)


def stop_running(_signum=None, _frame=None):
    global running
    running = False


def run_potion(config):
    global running
    running = True
    signal.signal(signal.SIGTERM, stop_running)
    signal.signal(signal.SIGINT, stop_running)

    potion = config.get("potion", {})
    scan_interval = max(10, int(potion.get("scanIntervalMs", 100)))
    limiter = RateLimiter(
        potion.get("maxTriggersPerSecond", 5),
        potion.get("protectionCooldownMs", 1000)
    )
    last_trigger = {"health": 0, "mana": 0}
    last_focus = None
    emit("started")

    while running:
        focused = is_game_foreground()
        if focused != last_focus:
            emit("focus", active=focused)
            last_focus = focused
        if not focused:
            time.sleep(scan_interval / 1000)
            continue

        now_ms = int(time.monotonic() * 1000)
        for name, component in (("health", "r"), ("mana", "b")):
            resource = potion.get(name, {})
            if not resource.get("enabled", False):
                continue
            color = read_pixel(resource.get("point", {}))
            value = color[component]
            if not should_trigger(
                value,
                int(resource.get("threshold", 0)),
                now_ms,
                last_trigger[name],
                resource.get("recoveryMode", "duration"),
                int(resource.get("recoveryCooldownMs", 500)),
                int(resource.get("instantIntervalMs", 100))
            ):
                continue

            allowed, reason = limiter.allow(now_ms)
            if not allowed:
                if reason == "limit":
                    emit("protected", until=limiter.protected_until)
                continue

            send_sequence(resource.get("keys", []))
            last_trigger[name] = now_ms
            emit("triggered", resource=name, value=value, color=color)

        time.sleep(scan_interval / 1000)

    emit("stopped")


def run_sample(config):
    point = config.get("point", {})
    print(json.dumps({"success": True, "color": read_pixel(point)}, ensure_ascii=False), flush=True)


def run_portal(config):
    if not is_game_foreground():
        print(json.dumps({"success": False, "error": "游戏窗口当前不在前台"}, ensure_ascii=False), flush=True)
        return 2

    portal = config.get("portal", config)
    send_sequence([portal.get("openKey", "Numpad1")])
    time.sleep(max(0, int(portal.get("waitMs", 500))) / 1000)
    point = portal.get("clickPoint", {})
    user32 = ctypes.windll.user32
    user32.SetCursorPos(int(point.get("x", 0)), int(point.get("y", 0)))
    user32.mouse_event(0x0002, 0, 0, 0, 0)
    user32.mouse_event(0x0004, 0, 0, 0, 0)
    print(json.dumps({"success": True}, ensure_ascii=False), flush=True)
    return 0


def load_config(path):
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("potion", "sample", "portal"), required=True)
    parser.add_argument("--config", required=True)
    args = parser.parse_args()
    config = load_config(args.config)
    if args.mode == "potion":
        run_potion(config)
        return 0
    if args.mode == "sample":
        run_sample(config)
        return 0
    return run_portal(config)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(json.dumps({"success": False, "error": str(error)}, ensure_ascii=False), flush=True)
        raise
`,ml=Wr("combat",()=>{const e=L(!1),t=L(!1),n=L(!1),r=L(null),o=L(0),s=L(0),i=L("");function a(l={}){(l.event==="starting"||l.event==="started")&&(i.value=""),typeof l.running=="boolean"&&(e.value=l.running),l.processId!==void 0&&(r.value=l.processId),l.event==="focus"&&(t.value=!!l.active),l.event==="protected"&&(n.value=!0),l.event==="triggered"&&(n.value=!1,l.resource==="health"&&(o.value+=1),l.resource==="mana"&&(s.value+=1)),l.event==="error"&&(i.value=l.error||"战斗辅助发生错误"),e.value||(t.value=!1,n.value=!1,r.value=null)}return{running:e,focused:t,protectedMode:n,processId:r,healthTriggers:o,manaTriggers:s,lastError:i,applyStatus:a}});let Wu=!1;async function S3(){const e=ml();Wu||(pe.combat.onStatus(n=>e.applyStatus(n)),Wu=!0);const t=await pe.combat.getPotionStatus();e.applyStatus({...t,event:t.running?"running":"stopped"})}async function E3(){const e=vn(),t=ml(),n=v3(e.combatAssist);if(!n.isValid)return Oe.warning(n.errors[0]),!1;const r=await pe.combat.startPotion({scriptContent:dl,config:JSON.parse(JSON.stringify(e.combatAssist))});return r!=null&&r.success?(t.applyStatus({running:!0,processId:r.processId,event:"starting"}),r.alreadyRunning||Oe.success("自动喝药已启动"),!0):(Oe.error((r==null?void 0:r.error)||"启动自动喝药失败"),!1)}async function P3(){const e=ml(),t=await pe.combat.stopPotion();return t!=null&&t.success?(e.applyStatus({running:!1,event:"stopped"}),t.alreadyStopped||Oe.success("自动喝药已停止"),!0):(Oe.error((t==null?void 0:t.error)||"停止自动喝药失败"),!1)}async function s6(e){return pe.combat.samplePixel({scriptContent:dl,point:{x:Number(e==null?void 0:e.x)||0,y:Number(e==null?void 0:e.y)||0}})}async function C3(){const e=vn(),t=await pe.combat.executePortal({scriptContent:dl,config:{portal:JSON.parse(JSON.stringify(e.combatAssist.portal))}});return t!=null&&t.success?(Oe.success("回城流程已执行"),!0):(Oe.error((t==null?void 0:t.error)||"一键回城执行失败"),!1)}const mm="storyGuide:v1",hm=1,T3=["red","green","blue"];function Uu(e,t,n){const r=e.findIndex(i=>i.id===t),o=e.findIndex(i=>i.id===n);if(r<0||o<0||r===o)return!1;const[s]=e.splice(r,1);return e.splice(o,0,s),!0}let Gu=0;function an(e="story"){var n,r;const t=(r=(n=globalThis.crypto)==null?void 0:n.randomUUID)==null?void 0:r.call(n);return t?`${e}-${t}`:(Gu+=1,`${e}-${Date.now().toString(36)}-${Gu.toString(36)}`)}function Oi(){return{version:hm,chapters:[],currentChapterId:null,currentStepId:null}}function A3(e){return typeof e=="string"?{id:an("step"),text:e}:{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("step"),text:typeof(e==null?void 0:e.text)=="string"?e.text:""}}function I3(e){const t={id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("skill"),name:typeof(e==null?void 0:e.name)=="string"?e.name:"",color:T3.includes(e==null?void 0:e.color)?e.color:"red"},n=Number(e==null?void 0:e.requiredLevel);return typeof(e==null?void 0:e.gemId)=="string"&&e.gemId&&Number.isInteger(n)&&n>=1&&n<=100&&["active","support"].includes(e==null?void 0:e.kind)&&(t.gemId=e.gemId,t.requiredLevel=n,t.kind=e.kind),t}function O3(e){return{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("group"),name:typeof(e==null?void 0:e.name)=="string"?e.name:"",skills:Array.isArray(e==null?void 0:e.skills)?e.skills.map(I3):[]}}function M3(e,t){return{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("chapter"),name:typeof(e==null?void 0:e.name)=="string"?e.name:`章节 ${t+1}`,steps:Array.isArray(e==null?void 0:e.steps)?e.steps.map(A3):[],skillGroups:Array.isArray(e==null?void 0:e.skillGroups)?e.skillGroups.map(O3):[]}}function Ro(e=[]){return e.flatMap((t,n)=>t.steps.map((r,o)=>({chapter:t,step:r,chapterIndex:n,stepIndex:o})))}function gm(e){const t={version:hm,chapters:Array.isArray(e==null?void 0:e.chapters)?e.chapters.map(M3):[],currentChapterId:typeof(e==null?void 0:e.currentChapterId)=="string"?e.currentChapterId:null,currentStepId:typeof(e==null?void 0:e.currentStepId)=="string"?e.currentStepId:null},n=Ro(t.chapters),r=n.find(i=>i.step.id===t.currentStepId);if(r)return t.currentChapterId=r.chapter.id,t;const o=t.chapters.find(i=>i.id===t.currentChapterId),s=o!=null&&o.steps.length?n.find(i=>i.chapter.id===o.id):n[0];return t.currentChapterId=(s==null?void 0:s.chapter.id)||null,t.currentStepId=(s==null?void 0:s.step.id)||null,t}function R3(e=globalThis.localStorage){if(!(e!=null&&e.getItem))return Oi();try{const t=e.getItem(mm);return t?gm(JSON.parse(t)):Oi()}catch{return Oi()}}function N3(e,t=globalThis.localStorage){if(!(t!=null&&t.setItem))return!1;try{return t.setItem(mm,JSON.stringify(gm(e))),!0}catch{return!1}}function _m(e,t){const n=Ro(e),r=n.findIndex(o=>o.step.id===t);return r<0?{previous:null,current:null,next:null,index:-1,flow:n}:{previous:n[r-1]||null,current:n[r],next:n[r+1]||null,index:r,flow:n}}function k3(e,t,n){const r=_m(e,t);if(!r.flow.length)return null;if(r.index<0)return r.flow[0];const o=Math.max(0,Math.min(r.flow.length-1,r.index+n));return r.flow[o]}function Ku(e,t){const n=Ro(e);return n.length?n[Math.min(Math.max(t,0),n.length-1)]:null}function F3(e,t){var s;const n=_m(e,t),r=((s=n.current)==null?void 0:s.chapter)||null,o=i=>i?{chapterId:i.chapter.id,chapterName:i.chapter.name,stepId:i.step.id,text:i.step.text}:null;return{previous:o(n.previous),current:o(n.current),next:o(n.next),chapter:r?{id:r.id,name:r.name,skillGroups:r.skillGroups.map(i=>({id:i.id,name:i.name,skills:i.skills.filter(a=>a.name.trim()).map(a=>({id:a.id,name:a.name,color:a.color}))})).filter(i=>i.skills.length)}:null}}const qu=Wr("story",()=>{const e=R3(),t=L(e.chapters),n=L(e.currentChapterId),r=L(e.currentStepId),o=L(!1),s=k(()=>t.value.find(I=>I.id===n.value)||null),i=k(()=>{var I;return((I=s.value)==null?void 0:I.steps.find(z=>z.id===r.value))||null}),a=k(()=>F3(t.value,r.value));function l(){return{version:1,chapters:t.value,currentChapterId:n.value,currentStepId:r.value}}function c(){o.value&&pe.storyOverlay.update(JSON.parse(JSON.stringify(a.value)))}function u({sync:I=!0}={}){N3(l()),I&&c()}function f(I){n.value=(I==null?void 0:I.chapter.id)||null,r.value=(I==null?void 0:I.step.id)||null,u()}function p(I){var X;const z=t.value.find(G=>G.id===I);n.value=(z==null?void 0:z.id)||null,r.value=((X=z==null?void 0:z.steps[0])==null?void 0:X.id)||null,u()}function d(I,z){const X=t.value.find(O=>O.id===I),G=X==null?void 0:X.steps.find(O=>O.id===z);!X||!G||(n.value=X.id,r.value=G.id,u())}function m(){const I={id:an("chapter"),name:`章节 ${t.value.length+1}`,steps:[],skillGroups:[]};return t.value.push(I),n.value=I.id,r.value=null,u(),I}function g(I){const X=Ro(t.value).findIndex(S=>S.step.id===r.value),G=t.value.findIndex(S=>S.id===I);if(G<0)return;const O=n.value===I;t.value.splice(G,1),O?f(Ku(t.value,X)):u()}function x(I){const z=t.value.find(G=>G.id===I);if(!z)return null;const X={id:an("step"),text:""};return z.steps.push(X),d(z.id,X.id),X}function b(I,z){const G=Ro(t.value).findIndex(se=>se.step.id===z),O=t.value.find(se=>se.id===I),S=(O==null?void 0:O.steps.findIndex(se=>se.id===z))??-1;if(!O||S<0)return;const V=r.value===z;O.steps.splice(S,1),V?f(Ku(t.value,G)):u()}function C(I,z){return Uu(t.value,I,z)?(u(),!0):!1}function v(I,z,X){const G=t.value.find(O=>O.id===I);return!G||!Uu(G.steps,z,X)?!1:(u(),!0)}function P(I){const z=t.value.find(G=>G.id===I);if(!z)return null;const X={id:an("group"),name:`技能组 ${z.skillGroups.length+1}`,skills:[]};return z.skillGroups.push(X),u(),X}function R(I,z){const X=t.value.find(O=>O.id===I),G=(X==null?void 0:X.skillGroups.findIndex(O=>O.id===z))??-1;!X||G<0||(X.skillGroups.splice(G,1),u())}function $(I,z){var O;const X=(O=t.value.find(S=>S.id===I))==null?void 0:O.skillGroups.find(S=>S.id===z);if(!X)return null;const G={id:an("skill"),name:"",color:"red"};return X.skills.push(G),u(),G}function B(I,z,X){var S;const G=(S=t.value.find(V=>V.id===I))==null?void 0:S.skillGroups.find(V=>V.id===z),O=(G==null?void 0:G.skills.findIndex(V=>V.id===X))??-1;!G||O<0||(G.skills.splice(O,1),u())}function T(I){f(k3(t.value,r.value,I))}const y=()=>T(-1),M=()=>T(1);async function U(I){const z=await pe.storyOverlay.open(JSON.parse(JSON.stringify(a.value)),I);return o.value=(z==null?void 0:z.success)!==!1,z}async function A(){await pe.storyOverlay.close(),o.value=!1}return{chapters:t,currentChapterId:n,currentStepId:r,overlayVisible:o,currentChapter:s,currentStep:i,snapshot:a,save:u,syncOverlay:c,selectChapter:p,selectStep:d,addChapter:m,deleteChapter:g,addStep:x,deleteStep:b,reorderChapter:C,reorderStep:v,addSkillGroup:P,deleteSkillGroup:R,addSkill:$,deleteSkill:B,previous:y,next:M,showOverlay:U,hideOverlay:A}});function L3(e){return typeof e!="string"?e:e.trim().split("+").map(t=>{const n=t.trim().match(/^numpad([0-9])$/i);return n?`num${n[1]}`:t.trim()}).join("+")}function D3(e){const t=Object.values(e).filter(a=>typeof a=="string"&&a.trim()),n=t.map(a=>L3(a).toLowerCase()),r=/^(?:(?:ctrl|control|alt|shift|commandorcontrol|cmdorctrl|meta)\+)*(?:[a-z0-9]|f(?:[1-9]|1[0-9]|2[0-4])|num(?:pad)?[0-9]|space|enter|return|esc|escape|tab|up|down|left|right|pageup|pagedown|home|end|insert)$/i,o=t.find(a=>!r.test(a.trim()));if(o)return{isValid:!1,error:`快捷键格式无效：${o}`};const s=n.findIndex(a=>a==="f12"||a==="ctrl+shift+i"||a==="control+shift+i"||a==="commandorcontrol+shift+i");if(s!==-1)return{isValid:!1,error:`快捷键 ${t[s]} 为应用保留快捷键`};const i=new Set(n);return n.length!==i.size?{isValid:!1,error:"不同功能的快捷键不能重复，请修改"}:{isValid:!0}}function vm(e){return(e==null?void 0:e.success)===!0&&Number.isInteger(e.processId)&&e.processId>0}let Ju=!1,Yu=!1,Qu=!1;function ym(e){var t;return((t=e==null?void 0:e.failed)==null?void 0:t.map(n=>n.accelerator).join("、"))||"未知快捷键"}async function bm(e){const t=await e.refreshDpiScale();if(t.success||t.skipped)return;const n=t.source==="history"?"上次识别值":"主屏倍率";Oe.warning(`未能识别游戏窗口 DPI，正在使用${n} ${t.scaleFactor}`)}async function B3(){const e=vn(),t=e.globalShortcuts;try{const r=await pe.shortcut.initFromSettings({...t});if(r!=null&&r.success)e.updateShortcutHealth(r);else{const o=ym(r);e.updateShortcutHealth({...r,error:`注册失败：${o}`}),Oe.error(`全局快捷键注册失败：${o}`)}}catch(r){e.updateShortcutHealth({success:!1,error:r.message}),Oe.error(`全局快捷键初始化失败：${r.message}`)}Ju||(pe.shortcut.onTriggered(r=>{y3(r,{itemStart:$3,mapStart:j3,end:H3,potionStart:E3,potionStop:P3,portal:C3,storyPrevious:()=>qu().previous(),storyNext:()=>qu().next()})}),Ju=!0),Yu||(pe.events.onPythonOutput(r=>{r.data.trim()}),Yu=!0),Qu||(pe.script.onStatusChanged(r=>Mo().applyStatus(r)),Qu=!0);const n=await pe.script.getStatus();Mo().applyStatus(n)}async function $3(){const e=Mo(),t=dm(),n=vn(),r=await pe.script.getStatus();if(e.applyStatus(r),r.isRunning){Oe.warning("脚本已在运行中");return}const o=t.currentItemPreset,s=e3({itemPosition:n.itemPosition,currencyPositions:n.currencyPositions,preset:o});if(!s.isValid){Oe.error(s.errors[0]);return}try{await bm(n);const i=await pe.file.getPaths(),a=X4({globalShortcuts:n.globalShortcuts,currencyPositions:n.currencyPositions,operationDelayMs:n.operationDelayMs,itemPosition:n.itemPosition,dpiScale:n.dpiScale,preset:o,filePaths:i}),l=JSON.parse(JSON.stringify(o)),c=await pe.script.generateAndExecute({scriptContent:a,preset:l,mode:"items"});vm(c)?(e.applyStatus({status:"running",...c}),Oe.success("脚本执行成功")):Oe.error("脚本执行失败: "+((c==null?void 0:c.error)||"后台进程未返回有效进程标识"))}catch(i){Oe.error("启动制作失败: "+i.message)}}async function j3(){const e=Mo(),t=dm(),n=vn(),r=await pe.script.getStatus();if(e.applyStatus(r),r.isRunning){Oe.warning("脚本已在运行中");return}const o=t.currentMapPreset,s=o.map;if(!s){Oe.error("当前预设未包含地图配置");return}const i=t3({inventory:n.inventory,currencyPositions:n.currencyPositions,mapConfig:s});if(!i.isValid){Oe.error(i.errors[0]);return}try{await bm(n);const a=await pe.file.getPaths(),l=Z4({globalShortcuts:n.globalShortcuts,currencyPositions:n.currencyPositions,inventory:n.inventory,operationDelayMs:n.operationDelayMs,mapConfig:s,dpiScale:n.dpiScale,filePaths:a}),c=JSON.parse(JSON.stringify(o)),u=await pe.script.generateAndExecute({scriptContent:l,preset:c,mode:"map"});vm(u)?(e.applyStatus({status:"running",...u}),Oe.success("地图洗练脚本执行成功")):Oe.error("脚本执行失败: "+((u==null?void 0:u.error)||"后台进程未返回有效进程标识"))}catch(a){Oe.error("启动制作失败: "+a.message)}}async function H3(){const e=Mo();try{(await pe.script.stop()).success&&(e.reset(),await pe.file.watcher.stop(),Oe.success("脚本已停止"))}catch(t){Oe.error("停止脚本失败: "+t.message)}}async function V3(e=null){const t=vn(),n=e||t.globalShortcuts,r=D3(n);if(!r.isValid)throw new Error(r.error);const o=await pe.shortcut.initFromSettings({...n});if(!(o!=null&&o.success)){const s=ym(o);throw t.updateShortcutHealth({...o,error:`注册失败：${s}`}),new Error(`全局快捷键注册失败：${s}`)}return t.updateShortcutHealth(o),o}async function i6(e,t){const n=vn(),r={...n.globalShortcuts,[e]:t};return await V3(r),n.updateGlobalShortcuts({[e]:t}),t}const z3=Object.freeze(["name","baseName","category"]),a6=Object.freeze({name:"物品名称",baseName:"基底名称",category:"物品类别"}),Er=Object.freeze({left:0,top:0,right:1920,bottom:1080}),gr=Object.freeze({nativeColumns:12,rows:5,minExtraColumns:1,maxExtraColumns:6});function Ot(e,t){const n=Number(e);return Number.isFinite(n)?n:t}function wm(e=[]){return Array.isArray(e)?e.map(t=>({field:String((t==null?void 0:t.field)||""),keyword:String((t==null?void 0:t.keyword)||"").trim()})).filter(t=>z3.includes(t.field)&&t.keyword.length>0):[]}function hl(e={}){const t=Number(e.extraColumns),n=Number.isFinite(t)?Math.min(gr.maxExtraColumns,Math.max(gr.minExtraColumns,Math.trunc(t))):gr.minExtraColumns,r=[],o=new Set;if(Array.isArray(e.excludedSlots))for(const s of e.excludedSlots){const i=Number(s==null?void 0:s.column),a=Number(s==null?void 0:s.row);if(!Number.isInteger(i)||!Number.isInteger(a)||!(i>=0&&i<gr.nativeColumns||i<=-1&&i>=-gr.maxExtraColumns)||a<0||a>=gr.rows)continue;const c=`${i}:${a}`;o.has(c)||(o.add(c),r.push({column:i,row:a}))}return{extraEnabled:!!e.extraEnabled,extraColumns:n,excludedSlots:r}}function xm(){return{moduleEnabled:!1,immediateStash:!0,showStashButtonOnlyWhenReady:!0,templates:{stashTitle:"",inventoryTitle:"",stashRegion:{...Er},inventoryRegion:{...Er},stashCapture:null,inventoryCapture:null},matchThreshold:.8,blacklist:[],inventoryLayout:hl()}}function ua(e={}){return{left:Ot(e.left,Er.left),top:Ot(e.top,Er.top),right:Ot(e.right,Er.right),bottom:Ot(e.bottom,Er.bottom)}}function Xu(e){if(!e||typeof e!="object")return null;const t=Ot(e.width,0),n=Ot(e.height,0);return t>0&&n>0?{width:t,height:n}:null}function Zu(e){if(!e||typeof e!="object")return null;const t=Xu(e.displayPhysicalSize),n=Xu(e.templateSize),r=e.selectedRegion?ua(e.selectedRegion):null,o=Ot(e.scaleFactor,0);return!String(e.displayId??"")||!t||!n||!r||o<=0?null:{displayId:String(e.displayId),scaleFactor:o,displayPhysicalSize:t,templateSize:n,selectedRegion:r,capturedAt:String(e.capturedAt||"")}}function Sm(e={}){var r,o,s,i,a,l;const t=xm(),n=Number(e.matchThreshold);return{moduleEnabled:!!e.moduleEnabled,immediateStash:e.immediateStash!==!1,showStashButtonOnlyWhenReady:e.showStashButtonOnlyWhenReady!==!1,templates:{stashTitle:String(((r=e.templates)==null?void 0:r.stashTitle)||""),inventoryTitle:String(((o=e.templates)==null?void 0:o.inventoryTitle)||""),stashRegion:ua((s=e.templates)==null?void 0:s.stashRegion),inventoryRegion:ua((i=e.templates)==null?void 0:i.inventoryRegion),stashCapture:Zu((a=e.templates)==null?void 0:a.stashCapture),inventoryCapture:Zu((l=e.templates)==null?void 0:l.inventoryCapture)},matchThreshold:Number.isFinite(n)?Math.min(1,Math.max(.1,n)):t.matchThreshold,blacklist:wm(e.blacklist),inventoryLayout:hl(e.inventoryLayout)}}function W3(e,t){var r,o,s,i,a,l,c,u;const n=Sm(e);return{immediateStash:n.immediateStash,showStashButtonOnlyWhenReady:n.showStashButtonOnlyWhenReady,templates:n.templates,matchThreshold:n.matchThreshold,blacklist:n.blacklist,operationDelayMs:rr(t==null?void 0:t.operationDelayMs),inventory:{startPos:{x:Ot((o=(r=t==null?void 0:t.inventory)==null?void 0:r.startPos)==null?void 0:o.x,2658),y:Ot((i=(s=t==null?void 0:t.inventory)==null?void 0:s.startPos)==null?void 0:i.y,1199)},slotSize:{w:Ot((l=(a=t==null?void 0:t.inventory)==null?void 0:a.slotSize)==null?void 0:l.w,100),h:Ot((u=(c=t==null?void 0:t.inventory)==null?void 0:c.slotSize)==null?void 0:u.h,100)},layout:n.inventoryLayout}}}function U3(e){return!e.templates.stashTitle||!e.templates.inventoryTitle?"请先配置仓库和背包标题模板":[e.templates.stashRegion,e.templates.inventoryRegion].some(r=>r.right<=r.left||r.bottom<=r.top)?"模板匹配区域无效":[e.inventory.startPos.x,e.inventory.startPos.y,e.inventory.slotSize.w,e.inventory.slotSize.h].some(r=>!Number.isFinite(r))?"背包网格配置无效":e.inventory.slotSize.w<=0||e.inventory.slotSize.h<=0?"背包单格宽高无效":""}function ef(e){if(e==="stashTitle")return"stashCapture";if(e==="inventoryTitle")return"inventoryCapture";throw new Error("不支持的模板目标")}const tf=()=>({scannedSlots:0,stashedSlots:0,blacklistedSlots:0,emptySlots:0,unreadableSlots:0,progress:0}),Kr=Wr("bag",()=>{const e=xm(),t=L(e.moduleEnabled),n=L(e.immediateStash),r=L(e.showStashButtonOnlyWhenReady),o=L(e.templates),s=L(e.matchThreshold),i=L(e.blacklist),a=L(e.inventoryLayout),l=L(!1),c=L(!1),u=L(!1),f=L(0),p=L(tf()),d=L("");function m(){try{localStorage.setItem("bagSettings",JSON.stringify({moduleEnabled:t.value,immediateStash:n.value,showStashButtonOnlyWhenReady:r.value,templates:o.value,matchThreshold:s.value,blacklist:i.value,inventoryLayout:a.value}))}catch(S){console.error("保存背包设置失败:",S)}}function g(S){const V=Sm(S);t.value=V.moduleEnabled,n.value=V.immediateStash,r.value=V.showStashButtonOnlyWhenReady,o.value=V.templates,s.value=V.matchThreshold,i.value=V.blacklist,a.value=V.inventoryLayout}function x(){try{g(JSON.parse(localStorage.getItem("bagSettings")||"{}"))}catch(S){g({}),console.error("加载背包设置失败:",S)}}function b(S){t.value=!!S,m()}function C(S){n.value=!!S,m()}function v(S){r.value=!!S,m()}function P(S){o.value[ef(S)]=null}function R(S,V){o.value[S]=String(V||""),P(S),m()}function $(S,V){o.value[`${S.replace("Title","")}Region`]={...V},P(S),m()}function B(S,V){const se=`${S.replace("Title","")}Region`;o.value={...o.value,[S]:String(V.path||""),[se]:{...V.region},[ef(S)]:V.metadata?{...V.metadata}:null},m()}function T(S){s.value=Number(S),m()}function y(S){i.value=wm(S),m()}function M(S){a.value=hl({...a.value,...S}),m()}function U(S){l.value=!!S}function A(S){c.value=!!S}function I(S,V={}){u.value=!!S,typeof V=="number"?f.value=V:(p.value={scannedSlots:Number(V.scannedSlots??p.value.scannedSlots),stashedSlots:Number(V.stashedSlots??p.value.stashedSlots),blacklistedSlots:Number(V.blacklistedSlots??p.value.blacklistedSlots),emptySlots:Number(V.emptySlots??p.value.emptySlots),unreadableSlots:Number(V.unreadableSlots??p.value.unreadableSlots),progress:Number(V.progress??p.value.progress)},f.value=Number(V.progress??f.value))}function z(S=""){d.value=String(S)}function X(){f.value=0,p.value=tf(),d.value=""}function G(){l.value=!1,c.value=!1,u.value=!1,X()}function O(){g(e),G(),m()}return x(),{moduleEnabled:t,immediateStash:n,showStashButtonOnlyWhenReady:r,templates:o,matchThreshold:s,blacklist:i,inventoryLayout:a,isDetecting:l,isMatched:c,isStashing:u,stashProgress:f,stashStats:p,lastStopReason:d,setModuleEnabled:b,setImmediateStash:C,setShowStashButtonOnlyWhenReady:v,setTemplate:R,setTemplateRegion:$,applyTemplateCapture:B,clearCaptureMetadata:P,setMatchThreshold:T,setBlacklist:y,setInventoryLayout:M,setDetectionStatus:U,setMatchedStatus:A,setStashingStatus:I,setStopReason:z,resetRunStats:X,resetStates:G,saveSettings:m,loadSettings:x,resetSettings:O}});let fa=!1,pa=[];function G3(){const e=Kr(),t=vn();return W3({moduleEnabled:e.moduleEnabled,immediateStash:e.immediateStash,showStashButtonOnlyWhenReady:e.showStashButtonOnlyWhenReady,templates:e.templates,matchThreshold:e.matchThreshold,blacklist:e.blacklist,inventoryLayout:e.inventoryLayout},t)}async function l6(e={}){const t=Kr();return"immediateStash"in e&&t.setImmediateStash(e.immediateStash),"showStashButtonOnlyWhenReady"in e&&t.setShowStashButtonOnlyWhenReady(e.showStashButtonOnlyWhenReady),t.moduleEnabled?pe.bag.updatePreferences({immediateStash:t.immediateStash,showStashButtonOnlyWhenReady:t.showStashButtonOnlyWhenReady}):{success:!0}}async function Em({silent:e=!1}={}){var s;const t=Kr(),n=G3(),r=U3(n);if(r)return e||Oe.warning(r),{success:!1,error:r};const o=await pe.bag.startDetection(n);return o!=null&&o.success?(t.setDetectionStatus(!0),t.setStopReason("")):e||Oe.error(`启动背包检测失败：${(o==null?void 0:o.error)||"未知错误"}`),o!=null&&o.success&&((s=o.warnings)!=null&&s.length)&&!e&&Oe.warning(o.warnings.join("；")),o}async function c6(e){const t=Kr();if(e){const n=await Em();return n!=null&&n.success?(t.setModuleEnabled(!0),Oe.success("背包安全自动入库已启用"),!0):!1}return await pe.bag.stopDetection(),t.setModuleEnabled(!1),t.resetStates(),Oe.success("背包安全自动入库已关闭"),!0}async function u6(){const e=await pe.bag.stopStash();return e!=null&&e.success&&Kr().setStashingStatus(!1),e}async function K3(){if(fa)return;fa=!0;const e=Kr();if(pa=[pe.events.onBagDetectionMatch(t=>{e.setMatchedStatus(!!t.matched)}),pe.events.onBagDetectionStopped(t=>{e.setDetectionStatus(!1),e.setMatchedStatus(!1),t!=null&&t.reason&&t.reason!=="process-ended"&&e.setStopReason(t.reason)}),pe.events.onBagStashProgress(t=>{t.progress===0&&e.resetRunStats(),e.setStashingStatus(!0,t)}),pe.events.onBagStashCompleted(t=>{e.setStashingStatus(!1,t),e.setStopReason(""),Oe.success(`自动入库完成：入库 ${t.stashedSlots||0} 格，黑名单保留 ${t.blacklistedSlots||0} 格`)}),pe.events.onBagStashStopped(t=>{e.setStashingStatus(!1,t),e.setStopReason((t==null?void 0:t.reason)||"未知原因"),t!=null&&t.reason&&t.reason!=="user-stopped"&&t.reason!=="process-ended"&&Oe.warning(`入库已停止：${J3(t.reason)}`)})].filter(Boolean),e.moduleEnabled)try{await Em({silent:!0})}catch(t){e.setDetectionStatus(!1),e.setStopReason(t.message)}}function q3(){pa.forEach(e=>e==null?void 0:e()),pa=[],fa=!1}function J3(e){return{"game-not-foreground":"游戏窗口不在前台","interface-lost":"仓库或背包界面已关闭","user-stopped":"用户停止","process-exited":"进程异常退出","process-ended":"进程已结束"}[e]||String(e||"未知原因")}const Y3={class:"app-root"},Q3={class:"main-content-wrapper"},X3={__name:"App",setup(e){const t=qp(),n=vn();let r=null;return st(()=>{var o,s;t.meta.noLayout||(window.electronAPI&&(n.refreshDpiScale(),B3(),S3(),K3()),r=(s=(o=pe.window).onDevToolsVisibilityChanged)==null?void 0:s.call(o,i=>{n.updateDebugMode(i)}),pe.window.setDevToolsVisible(n.debugMode))}),Oa(()=>{r==null||r(),q3(),window.electronAPI&&window.electronAPI.removeAllListeners&&window.electronAPI.removeAllListeners("init-shortcuts")}),(o,s)=>{const i=Ch("router-view");return J(),ae("div",Y3,[w(t).meta.noLayout?(J(),He(i,{key:1})):(J(),ae(We,{key:0},[oe(q4),Q("div",Q3,[oe(j4,null,{default:de(()=>[oe(i)]),_:1})])],64))])}}},Z3=ti(X3,[["__scopeId","data-v-9cc81237"]]),eE=()=>{const e=Qg(Z3),t=e0();e.use(t),e.use(g_),e.mount("#app")};eE();export{b2 as $,e3 as A,t3 as B,U3 as C,W3 as D,Dr as E,We as F,v3 as G,H3 as H,$3 as I,j3 as J,u6 as K,c6 as L,P3 as M,E3 as N,pe as O,Oe as P,st as Q,HE as R,E2 as S,zE as T,X1 as U,j2 as V,Pd as W,D2 as X,A2 as Y,u2 as Z,ti as _,He as a,v2 as a$,J1 as a0,K1 as a1,ye as a2,i6 as a3,M2 as a4,Xd as a5,FE as a6,$E as a7,Cs as a8,ie as a9,Kt as aA,At as aB,gt as aC,br as aD,sE as aE,lr as aF,$n as aG,gr as aH,Oa as aI,J3 as aJ,VE as aK,z3 as aL,a6 as aM,l6 as aN,aa as aO,r6 as aP,OE as aQ,C3 as aR,s6 as aS,Ee as aT,we as aU,Jt as aV,Jd as aW,Bb as aX,iE as aY,Y2 as aZ,s1 as a_,Lr as aa,qe as ab,be as ac,pt as ad,Cd as ae,Ve as af,q as ag,S1 as ah,Be as ai,Re as aj,pE as ak,qg as al,LE as am,Qt as an,NE as ao,Qa as ap,UE as aq,lE as ar,Te as as,Ta as at,sf as au,kb as av,TE as aw,ue as ax,bE as ay,xE as az,Q as b,Z_ as b$,n1 as b0,Gr as b1,Ue as b2,jE as b3,d3 as b4,kE as b5,o6 as b6,ze as b7,m3 as b8,h3 as b9,zr as bA,$e as bB,Us as bC,cE as bD,LS as bE,gE as bF,rf as bG,GE as bH,gw as bI,qd as bJ,gd as bK,wd as bL,ls as bM,ta as bN,ea as bO,Bo as bP,Aw as bQ,aS as bR,qE as bS,_E as bT,wE as bU,vE as bV,Yf as bW,ME as bX,pd as bY,pr as bZ,Wr as b_,DE as ba,ld as bb,nE as bc,no as bd,Ut as be,Je as bf,Qe as bg,mE as bh,Ja as bi,jb as bj,Z2 as bk,Oh as bl,bh as bm,ZE as bn,uS as bo,Ye as bp,XE as bq,QE as br,ho as bs,PE as bt,nl as bu,t2 as bv,wr as bw,SE as bx,CE as by,Ya as bz,k as c,Kv as c$,iv as c0,I_ as c1,xs as c2,lv as c3,za as c4,Wa as c5,Zv as c6,nv as c7,Fr as c8,Ji as c9,cu as cA,fu as cB,B1 as cC,G2 as cD,ud as cE,ny as cF,qa as cG,Nb as cH,sd as cI,Ls as cJ,KE as cK,Xb as cL,yE as cM,tE as cN,ns as cO,nr as cP,YE as cQ,A1 as cR,Ca as cS,hn as cT,fE as cU,P1 as cV,JE as cW,du as cX,hE as cY,sv as cZ,uv as c_,od as ca,pn as cb,Ga as cc,ed as cd,Fn as ce,A_ as cf,Ad as cg,Pe as ch,ic as ci,AE as cj,id as ck,oh as cl,Ch as cm,rE as cn,RE as co,Jf as cp,M1 as cq,bi as cr,Mn as cs,Jo as ct,pp as cu,er as cv,Td as cw,Se as cx,uE as cy,D1 as cz,ae as d,qv as d0,Ur as d1,Ky as d2,Wy as d3,ad as d4,qy as d5,Wc as d6,qt as d7,An as d8,zv as d9,kc as da,Bc as db,Qs as dc,Ly as dd,FS as de,mf as df,IE as dg,Va as dh,vh as di,Zi as dj,As as dk,WE as dl,BE as dm,x2 as dn,Ew as dp,aE as dq,EE as dr,Lo as ds,kS as dt,On as e,oe as f,Da as g,H1 as h,jS as i,oE as j,W1 as k,Th as l,dE as m,De as n,J as o,dm as p,Mo as q,L as r,vn as s,ko as t,w as u,Kr as v,de as w,ml as x,qu as y,Bn as z};

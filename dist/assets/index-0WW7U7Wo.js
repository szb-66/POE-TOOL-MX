const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./ItemsView-BFdpRrHJ.js","./PresetSelector-FzRq4xeU.js","./el-button-DeB102cc.js","./el-button-BYxgutQ6.css","./el-input-number-thEiIyO2.js","./el-input-number-BvzLPfEK.css","./el-select-CKFGl-n8.js","./el-scrollbar-DGZtfdO8.js","./el-scrollbar-BWxh-h6K.css","./el-select-D_oyzAZN.css","./el-message-box-DV5Ct83R.js","./el-overlay-DSOBNXoN.js","./el-overlay-CUAhHdWP.css","./el-message-box-B9YsRpU9.css","./PresetSelector-CDOic8gT.css","./KeyCaptureInput-CKQOI-eJ.js","./KeyCaptureInput-CMoxrSOy.css","./el-checkbox-CPyVRF7f.js","./omit-DVvciBG4.js","./el-checkbox-DIj50LEB.css","./supportedItemFormats-Be3KOmLk.js","./supportedItemFormats-DOzOaE8B.css","./ItemsView-DTb0ux6N.css","./BagView-j1qjKSz1.js","./el-slider-DCVQXQvA.js","./debounce-D0o-xFgV.js","./el-slider-DXOXW-KM.css","./el-table-column-CPZFwH-m.js","./el-table-column-C1e4Op8a.css","./el-empty-CXSVGXRc.js","./el-empty-D4ZqTl4F.css","./el-card-6A5hG1V8.js","./el-card-CSdhzOsS.css","./el-alert-B5met0xC.js","./el-alert-G57rL0jl.css","./el-form-item-7VC76umh.js","./el-switch-I5juzfx0.js","./el-switch-B5lTGWdM.css","./BagView-BK5K-EJS.css","./el-form-BWkJzdQ_.css","./MapView-COIT1ZlS.js","./MapView-CeD0fqic.css","./CombatView-DQCP3TF-.js","./el-radio-button-Bl3RmfY6.js","./el-radio-button-BzrEi8MV.css","./CombatView-CEjSJfZw.css","./StoryView-d5T8PxJh.js","./StoryView-DS9-mV2O.css","./ShopView-BWjVWAN2.js","./ShopView-CGk9OaDs.css","./CraftPlannerView-jcTJqLgN.js","./CraftPlannerView-DJ2lctOK.css","./SettingsView-DnMxcq1a.js","./OverlayContent-Cf9noGTF.js","./OverlayContent-wo8yga6z.css","./SettingsView-cLtWnQoG.css","./Help-BeI6Elk0.js","./Help-DPul02UM.css","./OverlayView-DMJ23NCl.js","./OverlayView-Colmh0aD.css","./DebugOverlay-rFIlobty.js","./DebugOverlay-Br_OlXeD.css","./StoryOverlayView-CfhIl2lk.js","./StoryOverlayView-D3OG4v_r.css","./BagStashOverlayView-BtEjR5xi.js","./BagStashOverlayView-Ct3480tI.css","./CoordinatePickerView-BDBlhsZH.js","./CoordinatePickerView-CYbqH7nz.css"])))=>i.map(i=>d[i]);
(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();/**
* @vue/shared v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function ua(e){const t=Object.create(null);for(const n of e.split(","))t[n]=1;return n=>n in t}const Ne={},Pr=[],ft=()=>{},ef=()=>!1,Rs=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),fa=e=>e.startsWith("onUpdate:"),Ke=Object.assign,pa=(e,t)=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)},Sm=Object.prototype.hasOwnProperty,Pe=(e,t)=>Sm.call(e,t),oe=Array.isArray,Cr=e=>Ro(e)==="[object Map]",Ns=e=>Ro(e)==="[object Set]",vl=e=>Ro(e)==="[object Date]",le=e=>typeof e=="function",we=e=>typeof e=="string",Nt=e=>typeof e=="symbol",Ee=e=>e!==null&&typeof e=="object",tf=e=>(Ee(e)||le(e))&&le(e.then)&&le(e.catch),nf=Object.prototype.toString,Ro=e=>nf.call(e),Em=e=>Ro(e).slice(8,-1),rf=e=>Ro(e)==="[object Object]",da=e=>we(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,oo=ua(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),ks=e=>{const t=Object.create(null);return n=>t[n]||(t[n]=e(n))},Pm=/-\w/g,xt=ks(e=>e.replace(Pm,t=>t.slice(1).toUpperCase())),Cm=/\B([A-Z])/g,Dn=ks(e=>e.replace(Cm,"-$1").toLowerCase()),Fs=ks(e=>e.charAt(0).toUpperCase()+e.slice(1)),ts=ks(e=>e?`on${Fs(e)}`:""),Nn=(e,t)=>!Object.is(e,t),ns=(e,...t)=>{for(let n=0;n<e.length;n++)e[n](...t)},of=(e,t,n,r=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:r,value:n})},ma=e=>{const t=parseFloat(e);return isNaN(t)?e:t},Tm=e=>{const t=we(e)?Number(e):NaN;return isNaN(t)?e:t};let yl;const Ls=()=>yl||(yl=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function Xt(e){if(oe(e)){const t={};for(let n=0;n<e.length;n++){const r=e[n],o=we(r)?Mm(r):Xt(r);if(o)for(const s in o)t[s]=o[s]}return t}else if(we(e)||Ee(e))return e}const Am=/;(?![^(]*\))/g,Im=/:([^]+)/,Om=/\/\*[^]*?\*\//g;function Mm(e){const t={};return e.replace(Om,"").split(Am).forEach(n=>{if(n){const r=n.split(Im);r.length>1&&(t[r[0].trim()]=r[1].trim())}}),t}function De(e){let t="";if(we(e))t=e;else if(oe(e))for(let n=0;n<e.length;n++){const r=De(e[n]);r&&(t+=r+" ")}else if(Ee(e))for(const n in e)e[n]&&(t+=n+" ");return t.trim()}function q3(e){if(!e)return null;let{class:t,style:n}=e;return t&&!we(t)&&(e.class=De(t)),n&&(e.style=Xt(n)),e}const Rm="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",Nm=ua(Rm);function sf(e){return!!e||e===""}function km(e,t){if(e.length!==t.length)return!1;let n=!0;for(let r=0;n&&r<e.length;r++)n=Ir(e[r],t[r]);return n}function Ir(e,t){if(e===t)return!0;let n=vl(e),r=vl(t);if(n||r)return n&&r?e.getTime()===t.getTime():!1;if(n=Nt(e),r=Nt(t),n||r)return e===t;if(n=oe(e),r=oe(t),n||r)return n&&r?km(e,t):!1;if(n=Ee(e),r=Ee(t),n||r){if(!n||!r)return!1;const o=Object.keys(e).length,s=Object.keys(t).length;if(o!==s)return!1;for(const i in e){const a=e.hasOwnProperty(i),l=t.hasOwnProperty(i);if(a&&!l||!a&&l||!Ir(e[i],t[i]))return!1}}return String(e)===String(t)}function af(e,t){return e.findIndex(n=>Ir(n,t))}const lf=e=>!!(e&&e.__v_isRef===!0),No=e=>we(e)?e:e==null?"":oe(e)||Ee(e)&&(e.toString===nf||!le(e.toString))?lf(e)?No(e.value):JSON.stringify(e,cf,2):String(e),cf=(e,t)=>lf(t)?cf(e,t.value):Cr(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((n,[r,o],s)=>(n[ei(r,s)+" =>"]=o,n),{})}:Ns(t)?{[`Set(${t.size})`]:[...t.values()].map(n=>ei(n))}:Nt(t)?ei(t):Ee(t)&&!oe(t)&&!rf(t)?String(t):t,ei=(e,t="")=>{var n;return Nt(e)?`Symbol(${(n=e.description)!=null?n:t})`:e};/**
* @vue/reactivity v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let nt;class uf{constructor(t=!1){this.detached=t,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.parent=nt,!t&&nt&&(this.index=(nt.scopes||(nt.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,n;if(this.scopes)for(t=0,n=this.scopes.length;t<n;t++)this.scopes[t].pause();for(t=0,n=this.effects.length;t<n;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,n;if(this.scopes)for(t=0,n=this.scopes.length;t<n;t++)this.scopes[t].resume();for(t=0,n=this.effects.length;t<n;t++)this.effects[t].resume()}}run(t){if(this._active){const n=nt;try{return nt=this,t()}finally{nt=n}}}on(){++this._on===1&&(this.prevScope=nt,nt=this)}off(){this._on>0&&--this._on===0&&(nt=this.prevScope,this.prevScope=void 0)}stop(t){if(this._active){this._active=!1;let n,r;for(n=0,r=this.effects.length;n<r;n++)this.effects[n].stop();for(this.effects.length=0,n=0,r=this.cleanups.length;n<r;n++)this.cleanups[n]();if(this.cleanups.length=0,this.scopes){for(n=0,r=this.scopes.length;n<r;n++)this.scopes[n].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const o=this.parent.scopes.pop();o&&o!==this&&(this.parent.scopes[this.index]=o,o.index=this.index)}this.parent=void 0}}}function ff(e){return new uf(e)}function ha(){return nt}function pf(e,t=!1){nt&&nt.cleanups.push(e)}let Fe;const ti=new WeakSet;class df{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,nt&&nt.active&&nt.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,ti.has(this)&&(ti.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||hf(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,bl(this),gf(this);const t=Fe,n=Mt;Fe=this,Mt=!0;try{return this.fn()}finally{_f(this),Fe=t,Mt=n,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)va(t);this.deps=this.depsTail=void 0,bl(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?ti.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){Ii(this)&&this.run()}get dirty(){return Ii(this)}}let mf=0,so,io;function hf(e,t=!1){if(e.flags|=8,t){e.next=io,io=e;return}e.next=so,so=e}function ga(){mf++}function _a(){if(--mf>0)return;if(io){let t=io;for(io=void 0;t;){const n=t.next;t.next=void 0,t.flags&=-9,t=n}}let e;for(;so;){let t=so;for(so=void 0;t;){const n=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(r){e||(e=r)}t=n}}if(e)throw e}function gf(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function _f(e){let t,n=e.depsTail,r=n;for(;r;){const o=r.prevDep;r.version===-1?(r===n&&(n=o),va(r),Fm(r)):t=r,r.dep.activeLink=r.prevActiveLink,r.prevActiveLink=void 0,r=o}e.deps=t,e.depsTail=n}function Ii(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(vf(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function vf(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===yo)||(e.globalVersion=yo,!e.isSSR&&e.flags&128&&(!e.deps&&!e._dirty||!Ii(e))))return;e.flags|=2;const t=e.dep,n=Fe,r=Mt;Fe=e,Mt=!0;try{gf(e);const o=e.fn(e._value);(t.version===0||Nn(o,e._value))&&(e.flags|=128,e._value=o,t.version++)}catch(o){throw t.version++,o}finally{Fe=n,Mt=r,_f(e),e.flags&=-3}}function va(e,t=!1){const{dep:n,prevSub:r,nextSub:o}=e;if(r&&(r.nextSub=o,e.prevSub=void 0),o&&(o.prevSub=r,e.nextSub=void 0),n.subs===e&&(n.subs=r,!r&&n.computed)){n.computed.flags&=-5;for(let s=n.computed.deps;s;s=s.nextDep)va(s,!0)}!t&&!--n.sc&&n.map&&n.map.delete(n.key)}function Fm(e){const{prevDep:t,nextDep:n}=e;t&&(t.nextDep=n,e.prevDep=void 0),n&&(n.prevDep=t,e.nextDep=void 0)}let Mt=!0;const yf=[];function cn(){yf.push(Mt),Mt=!1}function un(){const e=yf.pop();Mt=e===void 0?!0:e}function bl(e){const{cleanup:t}=e;if(e.cleanup=void 0,t){const n=Fe;Fe=void 0;try{t()}finally{Fe=n}}}let yo=0;class Lm{constructor(t,n){this.sub=t,this.dep=n,this.version=n.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class ya{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(t){if(!Fe||!Mt||Fe===this.computed)return;let n=this.activeLink;if(n===void 0||n.sub!==Fe)n=this.activeLink=new Lm(Fe,this),Fe.deps?(n.prevDep=Fe.depsTail,Fe.depsTail.nextDep=n,Fe.depsTail=n):Fe.deps=Fe.depsTail=n,bf(n);else if(n.version===-1&&(n.version=this.version,n.nextDep)){const r=n.nextDep;r.prevDep=n.prevDep,n.prevDep&&(n.prevDep.nextDep=r),n.prevDep=Fe.depsTail,n.nextDep=void 0,Fe.depsTail.nextDep=n,Fe.depsTail=n,Fe.deps===n&&(Fe.deps=r)}return n}trigger(t){this.version++,yo++,this.notify(t)}notify(t){ga();try{for(let n=this.subs;n;n=n.prevSub)n.sub.notify()&&n.sub.dep.notify()}finally{_a()}}}function bf(e){if(e.dep.sc++,e.sub.flags&4){const t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let r=t.deps;r;r=r.nextDep)bf(r)}const n=e.dep.subs;n!==e&&(e.prevSub=n,n&&(n.nextSub=e)),e.dep.subs=e}}const us=new WeakMap,Zn=Symbol(""),Oi=Symbol(""),bo=Symbol("");function rt(e,t,n){if(Mt&&Fe){let r=us.get(e);r||us.set(e,r=new Map);let o=r.get(n);o||(r.set(n,o=new ya),o.map=r,o.key=n),o.track()}}function on(e,t,n,r,o,s){const i=us.get(e);if(!i){yo++;return}const a=l=>{l&&l.trigger()};if(ga(),t==="clear")i.forEach(a);else{const l=oe(e),c=l&&da(n);if(l&&n==="length"){const u=Number(r);i.forEach((f,p)=>{(p==="length"||p===bo||!Nt(p)&&p>=u)&&a(f)})}else switch((n!==void 0||i.has(void 0))&&a(i.get(n)),c&&a(i.get(bo)),t){case"add":l?c&&a(i.get("length")):(a(i.get(Zn)),Cr(e)&&a(i.get(Oi)));break;case"delete":l||(a(i.get(Zn)),Cr(e)&&a(i.get(Oi)));break;case"set":Cr(e)&&a(i.get(Zn));break}}_a()}function Dm(e,t){const n=us.get(e);return n&&n.get(t)}function dr(e){const t=Se(e);return t===e?t:(rt(t,"iterate",bo),Et(e)?t:t.map(Ze))}function Ds(e){return rt(e=Se(e),"iterate",bo),e}const Bm={__proto__:null,[Symbol.iterator](){return ni(this,Symbol.iterator,Ze)},concat(...e){return dr(this).concat(...e.map(t=>oe(t)?dr(t):t))},entries(){return ni(this,"entries",e=>(e[1]=Ze(e[1]),e))},every(e,t){return Zt(this,"every",e,t,void 0,arguments)},filter(e,t){return Zt(this,"filter",e,t,n=>n.map(Ze),arguments)},find(e,t){return Zt(this,"find",e,t,Ze,arguments)},findIndex(e,t){return Zt(this,"findIndex",e,t,void 0,arguments)},findLast(e,t){return Zt(this,"findLast",e,t,Ze,arguments)},findLastIndex(e,t){return Zt(this,"findLastIndex",e,t,void 0,arguments)},forEach(e,t){return Zt(this,"forEach",e,t,void 0,arguments)},includes(...e){return ri(this,"includes",e)},indexOf(...e){return ri(this,"indexOf",e)},join(e){return dr(this).join(e)},lastIndexOf(...e){return ri(this,"lastIndexOf",e)},map(e,t){return Zt(this,"map",e,t,void 0,arguments)},pop(){return Jr(this,"pop")},push(...e){return Jr(this,"push",e)},reduce(e,...t){return wl(this,"reduce",e,t)},reduceRight(e,...t){return wl(this,"reduceRight",e,t)},shift(){return Jr(this,"shift")},some(e,t){return Zt(this,"some",e,t,void 0,arguments)},splice(...e){return Jr(this,"splice",e)},toReversed(){return dr(this).toReversed()},toSorted(e){return dr(this).toSorted(e)},toSpliced(...e){return dr(this).toSpliced(...e)},unshift(...e){return Jr(this,"unshift",e)},values(){return ni(this,"values",Ze)}};function ni(e,t,n){const r=Ds(e),o=r[t]();return r!==e&&!Et(e)&&(o._next=o.next,o.next=()=>{const s=o._next();return s.done||(s.value=n(s.value)),s}),o}const $m=Array.prototype;function Zt(e,t,n,r,o,s){const i=Ds(e),a=i!==e&&!Et(e),l=i[t];if(l!==$m[t]){const f=l.apply(e,s);return a?Ze(f):f}let c=n;i!==e&&(a?c=function(f,p){return n.call(this,Ze(f),p,e)}:n.length>2&&(c=function(f,p){return n.call(this,f,p,e)}));const u=l.call(i,c,r);return a&&o?o(u):u}function wl(e,t,n,r){const o=Ds(e);let s=n;return o!==e&&(Et(e)?n.length>3&&(s=function(i,a,l){return n.call(this,i,a,l,e)}):s=function(i,a,l){return n.call(this,i,Ze(a),l,e)}),o[t](s,...r)}function ri(e,t,n){const r=Se(e);rt(r,"iterate",bo);const o=r[t](...n);return(o===-1||o===!1)&&xa(n[0])?(n[0]=Se(n[0]),r[t](...n)):o}function Jr(e,t,n=[]){cn(),ga();const r=Se(e)[t].apply(e,n);return _a(),un(),r}const jm=ua("__proto__,__v_isRef,__isVue"),wf=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(Nt));function Hm(e){Nt(e)||(e=String(e));const t=Se(this);return rt(t,"has",e),t.hasOwnProperty(e)}class xf{constructor(t=!1,n=!1){this._isReadonly=t,this._isShallow=n}get(t,n,r){if(n==="__v_skip")return t.__v_skip;const o=this._isReadonly,s=this._isShallow;if(n==="__v_isReactive")return!o;if(n==="__v_isReadonly")return o;if(n==="__v_isShallow")return s;if(n==="__v_raw")return r===(o?s?Xm:Cf:s?Pf:Ef).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(r)?t:void 0;const i=oe(t);if(!o){let l;if(i&&(l=Bm[n]))return l;if(n==="hasOwnProperty")return Hm}const a=Reflect.get(t,n,$e(t)?t:r);if((Nt(n)?wf.has(n):jm(n))||(o||rt(t,"get",n),s))return a;if($e(a)){const l=i&&da(n)?a:a.value;return o&&Ee(l)?Or(l):l}return Ee(a)?o?Or(a):Bn(a):a}}class Sf extends xf{constructor(t=!1){super(!1,t)}set(t,n,r,o){let s=t[n];if(!this._isShallow){const l=Ln(s);if(!Et(r)&&!Ln(r)&&(s=Se(s),r=Se(r)),!oe(t)&&$e(s)&&!$e(r))return l||(s.value=r),!0}const i=oe(t)&&da(n)?Number(n)<t.length:Pe(t,n),a=Reflect.set(t,n,r,$e(t)?t:o);return t===Se(o)&&(i?Nn(r,s)&&on(t,"set",n,r):on(t,"add",n,r)),a}deleteProperty(t,n){const r=Pe(t,n);t[n];const o=Reflect.deleteProperty(t,n);return o&&r&&on(t,"delete",n,void 0),o}has(t,n){const r=Reflect.has(t,n);return(!Nt(n)||!wf.has(n))&&rt(t,"has",n),r}ownKeys(t){return rt(t,"iterate",oe(t)?"length":Zn),Reflect.ownKeys(t)}}class Vm extends xf{constructor(t=!1){super(!0,t)}set(t,n){return!0}deleteProperty(t,n){return!0}}const Wm=new Sf,zm=new Vm,Um=new Sf(!0);const Mi=e=>e,Vo=e=>Reflect.getPrototypeOf(e);function Gm(e,t,n){return function(...r){const o=this.__v_raw,s=Se(o),i=Cr(s),a=e==="entries"||e===Symbol.iterator&&i,l=e==="keys"&&i,c=o[e](...r),u=n?Mi:t?fs:Ze;return!t&&rt(s,"iterate",l?Oi:Zn),{next(){const{value:f,done:p}=c.next();return p?{value:f,done:p}:{value:a?[u(f[0]),u(f[1])]:u(f),done:p}},[Symbol.iterator](){return this}}}}function Wo(e){return function(...t){return e==="delete"?!1:e==="clear"?void 0:this}}function Km(e,t){const n={get(o){const s=this.__v_raw,i=Se(s),a=Se(o);e||(Nn(o,a)&&rt(i,"get",o),rt(i,"get",a));const{has:l}=Vo(i),c=t?Mi:e?fs:Ze;if(l.call(i,o))return c(s.get(o));if(l.call(i,a))return c(s.get(a));s!==i&&s.get(o)},get size(){const o=this.__v_raw;return!e&&rt(Se(o),"iterate",Zn),o.size},has(o){const s=this.__v_raw,i=Se(s),a=Se(o);return e||(Nn(o,a)&&rt(i,"has",o),rt(i,"has",a)),o===a?s.has(o):s.has(o)||s.has(a)},forEach(o,s){const i=this,a=i.__v_raw,l=Se(a),c=t?Mi:e?fs:Ze;return!e&&rt(l,"iterate",Zn),a.forEach((u,f)=>o.call(s,c(u),c(f),i))}};return Ke(n,e?{add:Wo("add"),set:Wo("set"),delete:Wo("delete"),clear:Wo("clear")}:{add(o){!t&&!Et(o)&&!Ln(o)&&(o=Se(o));const s=Se(this);return Vo(s).has.call(s,o)||(s.add(o),on(s,"add",o,o)),this},set(o,s){!t&&!Et(s)&&!Ln(s)&&(s=Se(s));const i=Se(this),{has:a,get:l}=Vo(i);let c=a.call(i,o);c||(o=Se(o),c=a.call(i,o));const u=l.call(i,o);return i.set(o,s),c?Nn(s,u)&&on(i,"set",o,s):on(i,"add",o,s),this},delete(o){const s=Se(this),{has:i,get:a}=Vo(s);let l=i.call(s,o);l||(o=Se(o),l=i.call(s,o)),a&&a.call(s,o);const c=s.delete(o);return l&&on(s,"delete",o,void 0),c},clear(){const o=Se(this),s=o.size!==0,i=o.clear();return s&&on(o,"clear",void 0,void 0),i}}),["keys","values","entries",Symbol.iterator].forEach(o=>{n[o]=Gm(o,e,t)}),n}function ba(e,t){const n=Km(e,t);return(r,o,s)=>o==="__v_isReactive"?!e:o==="__v_isReadonly"?e:o==="__v_raw"?r:Reflect.get(Pe(n,o)&&o in r?n:r,o,s)}const qm={get:ba(!1,!1)},Jm={get:ba(!1,!0)},Ym={get:ba(!0,!1)};const Ef=new WeakMap,Pf=new WeakMap,Cf=new WeakMap,Xm=new WeakMap;function Zm(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function Qm(e){return e.__v_skip||!Object.isExtensible(e)?0:Zm(Em(e))}function Bn(e){return Ln(e)?e:wa(e,!1,Wm,qm,Ef)}function Bs(e){return wa(e,!1,Um,Jm,Pf)}function Or(e){return wa(e,!0,zm,Ym,Cf)}function wa(e,t,n,r,o){if(!Ee(e)||e.__v_raw&&!(t&&e.__v_isReactive))return e;const s=Qm(e);if(s===0)return e;const i=o.get(e);if(i)return i;const a=new Proxy(e,s===2?r:n);return o.set(e,a),a}function kn(e){return Ln(e)?kn(e.__v_raw):!!(e&&e.__v_isReactive)}function Ln(e){return!!(e&&e.__v_isReadonly)}function Et(e){return!!(e&&e.__v_isShallow)}function xa(e){return e?!!e.__v_raw:!1}function Se(e){const t=e&&e.__v_raw;return t?Se(t):e}function Sa(e){return!Pe(e,"__v_skip")&&Object.isExtensible(e)&&of(e,"__v_skip",!0),e}const Ze=e=>Ee(e)?Bn(e):e,fs=e=>Ee(e)?Or(e):e;function $e(e){return e?e.__v_isRef===!0:!1}function B(e){return Tf(e,!1)}function Ea(e){return Tf(e,!0)}function Tf(e,t){return $e(e)?e:new eh(e,t)}class eh{constructor(t,n){this.dep=new ya,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=n?t:Se(t),this._value=n?t:Ze(t),this.__v_isShallow=n}get value(){return this.dep.track(),this._value}set value(t){const n=this._rawValue,r=this.__v_isShallow||Et(t)||Ln(t);t=r?t:Se(t),Nn(t,n)&&(this._rawValue=t,this._value=r?t:Ze(t),this.dep.trigger())}}function J3(e){e.dep&&e.dep.trigger()}function x(e){return $e(e)?e.value:e}const th={get:(e,t,n)=>t==="__v_raw"?e:x(Reflect.get(e,t,n)),set:(e,t,n,r)=>{const o=e[t];return $e(o)&&!$e(n)?(o.value=n,!0):Reflect.set(e,t,n,r)}};function Af(e){return kn(e)?e:new Proxy(e,th)}function nh(e){const t=oe(e)?new Array(e.length):{};for(const n in e)t[n]=If(e,n);return t}class rh{constructor(t,n,r){this._object=t,this._key=n,this._defaultValue=r,this.__v_isRef=!0,this._value=void 0}get value(){const t=this._object[this._key];return this._value=t===void 0?this._defaultValue:t}set value(t){this._object[this._key]=t}get dep(){return Dm(Se(this._object),this._key)}}class oh{constructor(t){this._getter=t,this.__v_isRef=!0,this.__v_isReadonly=!0,this._value=void 0}get value(){return this._value=this._getter()}}function br(e,t,n){return $e(e)?e:le(e)?new oh(e):Ee(e)&&arguments.length>1?If(e,t,n):B(e)}function If(e,t,n){const r=e[t];return $e(r)?r:new rh(e,t,n)}class sh{constructor(t,n,r){this.fn=t,this.setter=n,this._value=void 0,this.dep=new ya(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=yo-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!n,this.isSSR=r}notify(){if(this.flags|=16,!(this.flags&8)&&Fe!==this)return hf(this,!0),!0}get value(){const t=this.dep.track();return vf(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function ih(e,t,n=!1){let r,o;return le(e)?r=e:(r=e.get,o=e.set),new sh(r,o,n)}const zo={},ps=new WeakMap;let Kn;function ah(e,t=!1,n=Kn){if(n){let r=ps.get(n);r||ps.set(n,r=[]),r.push(e)}}function lh(e,t,n=Ne){const{immediate:r,deep:o,once:s,scheduler:i,augmentJob:a,call:l}=n,c=E=>o?E:Et(E)||o===!1||o===0?sn(E,1):sn(E);let u,f,p,d,m=!1,h=!1;if($e(e)?(f=()=>e.value,m=Et(e)):kn(e)?(f=()=>c(e),m=!0):oe(e)?(h=!0,m=e.some(E=>kn(E)||Et(E)),f=()=>e.map(E=>{if($e(E))return E.value;if(kn(E))return c(E);if(le(E))return l?l(E,2):E()})):le(e)?t?f=l?()=>l(e,2):e:f=()=>{if(p){cn();try{p()}finally{un()}}const E=Kn;Kn=u;try{return l?l(e,3,[d]):e(d)}finally{Kn=E}}:f=ft,t&&o){const E=f,N=o===!0?1/0:o;f=()=>sn(E(),N)}const S=ha(),b=()=>{u.stop(),S&&S.active&&pa(S.effects,u)};if(s&&t){const E=t;t=(...N)=>{E(...N),b()}}let C=h?new Array(e.length).fill(zo):zo;const y=E=>{if(!(!(u.flags&1)||!u.dirty&&!E))if(t){const N=u.run();if(o||m||(h?N.some((z,D)=>Nn(z,C[D])):Nn(N,C))){p&&p();const z=Kn;Kn=u;try{const D=[N,C===zo?void 0:h&&C[0]===zo?[]:C,d];C=N,l?l(t,3,D):t(...D)}finally{Kn=z}}}else u.run()};return a&&a(y),u=new df(f),u.scheduler=i?()=>i(y,!1):y,d=E=>ah(E,!1,u),p=u.onStop=()=>{const E=ps.get(u);if(E){if(l)l(E,4);else for(const N of E)N();ps.delete(u)}},t?r?y(!0):C=u.run():i?i(y.bind(null,!0),!0):u.run(),b.pause=u.pause.bind(u),b.resume=u.resume.bind(u),b.stop=b,b}function sn(e,t=1/0,n){if(t<=0||!Ee(e)||e.__v_skip||(n=n||new Map,(n.get(e)||0)>=t))return e;if(n.set(e,t),t--,$e(e))sn(e.value,t,n);else if(oe(e))for(let r=0;r<e.length;r++)sn(e[r],t,n);else if(Ns(e)||Cr(e))e.forEach(r=>{sn(r,t,n)});else if(rf(e)){for(const r in e)sn(e[r],t,n);for(const r of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,r)&&sn(e[r],t,n)}return e}/**
* @vue/runtime-core v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function ko(e,t,n,r){try{return r?e(...r):e()}catch(o){$s(o,t,n)}}function kt(e,t,n,r){if(le(e)){const o=ko(e,t,n,r);return o&&tf(o)&&o.catch(s=>{$s(s,t,n)}),o}if(oe(e)){const o=[];for(let s=0;s<e.length;s++)o.push(kt(e[s],t,n,r));return o}}function $s(e,t,n,r=!0){const o=t?t.vnode:null,{errorHandler:s,throwUnhandledErrorInProduction:i}=t&&t.appContext.config||Ne;if(t){let a=t.parent;const l=t.proxy,c=`https://vuejs.org/error-reference/#runtime-${n}`;for(;a;){const u=a.ec;if(u){for(let f=0;f<u.length;f++)if(u[f](e,l,c)===!1)return}a=a.parent}if(s){cn(),ko(s,null,10,[e,l,c]),un();return}}ch(e,n,o,r,i)}function ch(e,t,n,r=!0,o=!1){if(o)throw e;console.error(e)}const ut=[];let Vt=-1;const Tr=[];let Pn=null,_r=0;const Of=Promise.resolve();let ds=null;function Kt(e){const t=ds||Of;return e?t.then(this?e.bind(this):e):t}function uh(e){let t=Vt+1,n=ut.length;for(;t<n;){const r=t+n>>>1,o=ut[r],s=wo(o);s<e||s===e&&o.flags&2?t=r+1:n=r}return t}function Pa(e){if(!(e.flags&1)){const t=wo(e),n=ut[ut.length-1];!n||!(e.flags&2)&&t>=wo(n)?ut.push(e):ut.splice(uh(t),0,e),e.flags|=1,Mf()}}function Mf(){ds||(ds=Of.then(Nf))}function fh(e){oe(e)?Tr.push(...e):Pn&&e.id===-1?Pn.splice(_r+1,0,e):e.flags&1||(Tr.push(e),e.flags|=1),Mf()}function xl(e,t,n=Vt+1){for(;n<ut.length;n++){const r=ut[n];if(r&&r.flags&2){if(e&&r.id!==e.uid)continue;ut.splice(n,1),n--,r.flags&4&&(r.flags&=-2),r(),r.flags&4||(r.flags&=-2)}}}function Rf(e){if(Tr.length){const t=[...new Set(Tr)].sort((n,r)=>wo(n)-wo(r));if(Tr.length=0,Pn){Pn.push(...t);return}for(Pn=t,_r=0;_r<Pn.length;_r++){const n=Pn[_r];n.flags&4&&(n.flags&=-2),n.flags&8||n(),n.flags&=-2}Pn=null,_r=0}}const wo=e=>e.id==null?e.flags&2?-1:1/0:e.id;function Nf(e){try{for(Vt=0;Vt<ut.length;Vt++){const t=ut[Vt];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),ko(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Vt<ut.length;Vt++){const t=ut[Vt];t&&(t.flags&=-2)}Vt=-1,ut.length=0,Rf(),ds=null,(ut.length||Tr.length)&&Nf()}}let Qe=null,kf=null;function ms(e){const t=Qe;return Qe=e,kf=e&&e.type.__scopeId||null,t}function de(e,t=Qe,n){if(!t||e._n)return e;const r=(...o)=>{r._d&&_s(-1);const s=ms(t);let i;try{i=e(...o)}finally{ms(s),r._d&&_s(1)}return i};return r._n=!0,r._c=!0,r._d=!0,r}function Wr(e,t){if(Qe===null)return e;const n=Ws(Qe),r=e.dirs||(e.dirs=[]);for(let o=0;o<t.length;o++){let[s,i,a,l=Ne]=t[o];s&&(le(s)&&(s={mounted:s,updated:s}),s.deep&&sn(i),r.push({dir:s,instance:n,value:i,oldValue:void 0,arg:a,modifiers:l}))}return e}function Hn(e,t,n,r){const o=e.dirs,s=t&&t.dirs;for(let i=0;i<o.length;i++){const a=o[i];s&&(a.oldValue=s[i].value);let l=a.dir[r];l&&(cn(),kt(l,n,8,[e.el,a,e,t]),un())}}const Ff=Symbol("_vte"),Lf=e=>e.__isTeleport,ao=e=>e&&(e.disabled||e.disabled===""),Sl=e=>e&&(e.defer||e.defer===""),El=e=>typeof SVGElement<"u"&&e instanceof SVGElement,Pl=e=>typeof MathMLElement=="function"&&e instanceof MathMLElement,Ri=(e,t)=>{const n=e&&e.to;return we(n)?t?t(n):null:n},Df={name:"Teleport",__isTeleport:!0,process(e,t,n,r,o,s,i,a,l,c){const{mc:u,pc:f,pbc:p,o:{insert:d,querySelector:m,createText:h,createComment:S}}=c,b=ao(t.props);let{shapeFlag:C,children:y,dynamicChildren:E}=t;if(e==null){const N=t.el=h(""),z=t.anchor=h("");d(N,n,r),d(z,n,r);const D=(v,R)=>{C&16&&u(y,v,R,o,s,i,a,l)},A=()=>{const v=t.target=Ri(t.props,m),R=Bf(v,t,h,d);v&&(i!=="svg"&&El(v)?i="svg":i!=="mathml"&&Pl(v)&&(i="mathml"),o&&o.isCE&&(o.ce._teleportTargets||(o.ce._teleportTargets=new Set)).add(v),b||(D(v,R),rs(t,!1)))};b&&(D(n,z),rs(t,!0)),Sl(t.props)?(t.el.__isMounted=!1,at(()=>{A(),delete t.el.__isMounted},s)):A()}else{if(Sl(t.props)&&e.el.__isMounted===!1){at(()=>{Df.process(e,t,n,r,o,s,i,a,l,c)},s);return}t.el=e.el,t.targetStart=e.targetStart;const N=t.anchor=e.anchor,z=t.target=e.target,D=t.targetAnchor=e.targetAnchor,A=ao(e.props),v=A?n:z,R=A?N:D;if(i==="svg"||El(z)?i="svg":(i==="mathml"||Pl(z))&&(i="mathml"),E?(p(e.dynamicChildren,E,v,o,s,i,a),Ra(e,t,!0)):l||f(e,t,v,R,o,s,i,a,!1),b)A?t.props&&e.props&&t.props.to!==e.props.to&&(t.props.to=e.props.to):Uo(t,n,N,c,1);else if((t.props&&t.props.to)!==(e.props&&e.props.to)){const U=t.target=Ri(t.props,m);U&&Uo(t,U,null,c,0)}else A&&Uo(t,z,D,c,1);rs(t,b)}},remove(e,t,n,{um:r,o:{remove:o}},s){const{shapeFlag:i,children:a,anchor:l,targetStart:c,targetAnchor:u,target:f,props:p}=e;if(f&&(o(c),o(u)),s&&o(l),i&16){const d=s||!ao(p);for(let m=0;m<a.length;m++){const h=a[m];r(h,t,n,d,!!h.dynamicChildren)}}},move:Uo,hydrate:ph};function Uo(e,t,n,{o:{insert:r},m:o},s=2){s===0&&r(e.targetAnchor,t,n);const{el:i,anchor:a,shapeFlag:l,children:c,props:u}=e,f=s===2;if(f&&r(i,t,n),(!f||ao(u))&&l&16)for(let p=0;p<c.length;p++)o(c[p],t,n,2);f&&r(a,t,n)}function ph(e,t,n,r,o,s,{o:{nextSibling:i,parentNode:a,querySelector:l,insert:c,createText:u}},f){function p(h,S,b,C){S.anchor=f(i(h),S,a(h),n,r,o,s),S.targetStart=b,S.targetAnchor=C}const d=t.target=Ri(t.props,l),m=ao(t.props);if(d){const h=d._lpa||d.firstChild;if(t.shapeFlag&16)if(m)p(e,t,h,h&&i(h));else{t.anchor=i(e);let S=h;for(;S;){if(S&&S.nodeType===8){if(S.data==="teleport start anchor")t.targetStart=S;else if(S.data==="teleport anchor"){t.targetAnchor=S,d._lpa=t.targetAnchor&&i(t.targetAnchor);break}}S=i(S)}t.targetAnchor||Bf(d,t,u,c),f(h&&i(h),t,d,n,r,o,s)}rs(t,m)}else m&&t.shapeFlag&16&&p(e,t,e,i(e));return t.anchor&&i(t.anchor)}const dh=Df;function rs(e,t){const n=e.ctx;if(n&&n.ut){let r,o;for(t?(r=e.el,o=e.anchor):(r=e.targetStart,o=e.targetAnchor);r&&r!==o;)r.nodeType===1&&r.setAttribute("data-v-owner",n.uid),r=r.nextSibling;n.ut()}}function Bf(e,t,n,r){const o=t.targetStart=n(""),s=t.targetAnchor=n("");return o[Ff]=s,e&&(r(o,e),r(s,e)),s}const rn=Symbol("_leaveCb"),Go=Symbol("_enterCb");function $f(){const e={isMounted:!1,isLeaving:!1,isUnmounting:!1,leavingVNodes:new Map};return st(()=>{e.isMounted=!0}),At(()=>{e.isUnmounting=!0}),e}const St=[Function,Array],jf={mode:String,appear:Boolean,persisted:Boolean,onBeforeEnter:St,onEnter:St,onAfterEnter:St,onEnterCancelled:St,onBeforeLeave:St,onLeave:St,onAfterLeave:St,onLeaveCancelled:St,onBeforeAppear:St,onAppear:St,onAfterAppear:St,onAppearCancelled:St},Hf=e=>{const t=e.subTree;return t.component?Hf(t.component):t},mh={name:"BaseTransition",props:jf,setup(e,{slots:t}){const n=Xe(),r=$f();return()=>{const o=t.default&&Ca(t.default(),!0);if(!o||!o.length)return;const s=Vf(o),i=Se(e),{mode:a}=i;if(r.isLeaving)return oi(s);const l=Cl(s);if(!l)return oi(s);let c=xo(l,i,r,n,f=>c=f);l.type!==Je&&or(l,c);let u=n.subTree&&Cl(n.subTree);if(u&&u.type!==Je&&!qn(u,l)&&Hf(n).type!==Je){let f=xo(u,i,r,n);if(or(u,f),a==="out-in"&&l.type!==Je)return r.isLeaving=!0,f.afterLeave=()=>{r.isLeaving=!1,n.job.flags&8||n.update(),delete f.afterLeave,u=void 0},oi(s);a==="in-out"&&l.type!==Je?f.delayLeave=(p,d,m)=>{const h=Wf(r,u);h[String(u.key)]=u,p[rn]=()=>{d(),p[rn]=void 0,delete c.delayedLeave,u=void 0},c.delayedLeave=()=>{m(),delete c.delayedLeave,u=void 0}}:u=void 0}else u&&(u=void 0);return s}}};function Vf(e){let t=e[0];if(e.length>1){for(const n of e)if(n.type!==Je){t=n;break}}return t}const hh=mh;function Wf(e,t){const{leavingVNodes:n}=e;let r=n.get(t.type);return r||(r=Object.create(null),n.set(t.type,r)),r}function xo(e,t,n,r,o){const{appear:s,mode:i,persisted:a=!1,onBeforeEnter:l,onEnter:c,onAfterEnter:u,onEnterCancelled:f,onBeforeLeave:p,onLeave:d,onAfterLeave:m,onLeaveCancelled:h,onBeforeAppear:S,onAppear:b,onAfterAppear:C,onAppearCancelled:y}=t,E=String(e.key),N=Wf(n,e),z=(v,R)=>{v&&kt(v,r,9,R)},D=(v,R)=>{const U=R[1];z(v,R),oe(v)?v.every(I=>I.length<=1)&&U():v.length<=1&&U()},A={mode:i,persisted:a,beforeEnter(v){let R=l;if(!n.isMounted)if(s)R=S||l;else return;v[rn]&&v[rn](!0);const U=N[E];U&&qn(e,U)&&U.el[rn]&&U.el[rn](),z(R,[v])},enter(v){let R=c,U=u,I=f;if(!n.isMounted)if(s)R=b||c,U=C||u,I=y||f;else return;let M=!1;const W=v[Go]=X=>{M||(M=!0,X?z(I,[v]):z(U,[v]),A.delayedLeave&&A.delayedLeave(),v[Go]=void 0)};R?D(R,[v,W]):W()},leave(v,R){const U=String(e.key);if(v[Go]&&v[Go](!0),n.isUnmounting)return R();z(p,[v]);let I=!1;const M=v[rn]=W=>{I||(I=!0,R(),W?z(h,[v]):z(m,[v]),v[rn]=void 0,N[U]===e&&delete N[U])};N[U]=e,d?D(d,[v,M]):M()},clone(v){const R=xo(v,t,n,r,o);return o&&o(R),R}};return A}function oi(e){if(js(e))return e=fn(e),e.children=null,e}function Cl(e){if(!js(e))return Lf(e.type)&&e.children?Vf(e.children):e;if(e.component)return e.component.subTree;const{shapeFlag:t,children:n}=e;if(n){if(t&16)return n[0];if(t&32&&le(n.default))return n.default()}}function or(e,t){e.shapeFlag&6&&e.component?(e.transition=t,or(e.component.subTree,t)):e.shapeFlag&128?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}function Ca(e,t=!1,n){let r=[],o=0;for(let s=0;s<e.length;s++){let i=e[s];const a=n==null?i.key:String(n)+String(i.key!=null?i.key:s);i.type===ze?(i.patchFlag&128&&o++,r=r.concat(Ca(i.children,t,a))):(t||i.type!==Je)&&r.push(a!=null?fn(i,{key:a}):i)}if(o>1)for(let s=0;s<r.length;s++)r[s].patchFlag=-2;return r}function q(e,t){return le(e)?Ke({name:e.name},t,{setup:e}):e}function zf(e){e.ids=[e.ids[0]+e.ids[2]+++"-",0,0]}const hs=new WeakMap;function lo(e,t,n,r,o=!1){if(oe(e)){e.forEach((m,h)=>lo(m,t&&(oe(t)?t[h]:t),n,r,o));return}if(Ar(r)&&!o){r.shapeFlag&512&&r.type.__asyncResolved&&r.component.subTree.component&&lo(e,t,n,r.component.subTree);return}const s=r.shapeFlag&4?Ws(r.component):r.el,i=o?null:s,{i:a,r:l}=e,c=t&&t.r,u=a.refs===Ne?a.refs={}:a.refs,f=a.setupState,p=Se(f),d=f===Ne?ef:m=>Pe(p,m);if(c!=null&&c!==l){if(Tl(t),we(c))u[c]=null,d(c)&&(f[c]=null);else if($e(c)){c.value=null;const m=t;m.k&&(u[m.k]=null)}}if(le(l))ko(l,a,12,[i,u]);else{const m=we(l),h=$e(l);if(m||h){const S=()=>{if(e.f){const b=m?d(l)?f[l]:u[l]:l.value;if(o)oe(b)&&pa(b,s);else if(oe(b))b.includes(s)||b.push(s);else if(m)u[l]=[s],d(l)&&(f[l]=u[l]);else{const C=[s];l.value=C,e.k&&(u[e.k]=C)}}else m?(u[l]=i,d(l)&&(f[l]=i)):h&&(l.value=i,e.k&&(u[e.k]=i))};if(i){const b=()=>{S(),hs.delete(e)};b.id=-1,hs.set(e,b),at(b,n)}else Tl(e),S()}}}function Tl(e){const t=hs.get(e);t&&(t.flags|=8,hs.delete(e))}Ls().requestIdleCallback;Ls().cancelIdleCallback;const Ar=e=>!!e.type.__asyncLoader,js=e=>e.type.__isKeepAlive;function gh(e,t){Gf(e,"a",t)}function Uf(e,t){Gf(e,"da",t)}function Gf(e,t,n=ot){const r=e.__wdc||(e.__wdc=()=>{let o=n;for(;o;){if(o.isDeactivated)return;o=o.parent}return e()});if(Hs(t,r,n),n){let o=n.parent;for(;o&&o.parent;)js(o.parent.vnode)&&_h(r,t,n,o),o=o.parent}}function _h(e,t,n,r){const o=Hs(t,e,r,!0);Ta(()=>{pa(r[t],o)},n)}function Hs(e,t,n=ot,r=!1){if(n){const o=n[e]||(n[e]=[]),s=t.__weh||(t.__weh=(...i)=>{cn();const a=Lo(n),l=kt(t,n,e,i);return a(),un(),l});return r?o.unshift(s):o.push(s),s}}const mn=e=>(t,n=ot)=>{(!Eo||e==="sp")&&Hs(e,(...r)=>t(...r),n)},Kf=mn("bm"),st=mn("m"),vh=mn("bu"),qf=mn("u"),At=mn("bum"),Ta=mn("um"),yh=mn("sp"),bh=mn("rtg"),wh=mn("rtc");function xh(e,t=ot){Hs("ec",e,t)}const Aa="components",Sh="directives";function Eh(e,t){return Ia(Aa,e,!0,t)||e}const Jf=Symbol.for("v-ndc");function Ph(e){return we(e)?Ia(Aa,e,!1)||e:e||Jf}function Y3(e){return Ia(Sh,e)}function Ia(e,t,n=!0,r=!1){const o=Qe||ot;if(o){const s=o.type;if(e===Aa){const a=dg(s,!1);if(a&&(a===t||a===xt(t)||a===Fs(xt(t))))return s}const i=Al(o[e]||s[e],t)||Al(o.appContext[e],t);return!i&&r?s:i}}function Al(e,t){return e&&(e[t]||e[xt(t)]||e[Fs(xt(t))])}function X3(e,t,n,r){let o;const s=n,i=oe(e);if(i||we(e)){const a=i&&kn(e);let l=!1,c=!1;a&&(l=!Et(e),c=Ln(e),e=Ds(e)),o=new Array(e.length);for(let u=0,f=e.length;u<f;u++)o[u]=t(l?c?fs(Ze(e[u])):Ze(e[u]):e[u],u,void 0,s)}else if(typeof e=="number"){o=new Array(e);for(let a=0;a<e;a++)o[a]=t(a+1,a,void 0,s)}else if(Ee(e))if(e[Symbol.iterator])o=Array.from(e,(a,l)=>t(a,l,void 0,s));else{const a=Object.keys(e);o=new Array(a.length);for(let l=0,c=a.length;l<c;l++){const u=a[l];o[l]=t(e[u],u,l,s)}}else o=[];return o}function Z3(e,t){for(let n=0;n<t.length;n++){const r=t[n];if(oe(r))for(let o=0;o<r.length;o++)e[r[o].name]=r[o].fn;else r&&(e[r.name]=r.key?(...o)=>{const s=r.fn(...o);return s&&(s.key=r.key),s}:r.fn)}return e}function Re(e,t,n={},r,o){if(Qe.ce||Qe.parent&&Ar(Qe.parent)&&Qe.parent.ce){const c=Object.keys(n).length>0;return t!=="default"&&(n.name=t),Y(),He(ze,null,[re("slot",n,r&&r())],c?-2:64)}let s=e[t];s&&s._c&&(s._d=!1),Y();const i=s&&Yf(s(n)),a=n.key||i&&i.key,l=He(ze,{key:(a&&!Nt(a)?a:`_${t}`)+(!i&&r?"_fb":"")},i||(r?r():[]),i&&e._===1?64:-2);return!o&&l.scopeId&&(l.slotScopeIds=[l.scopeId+"-s"]),s&&s._c&&(s._d=!0),l}function Yf(e){return e.some(t=>Ut(t)?!(t.type===Je||t.type===ze&&!Yf(t.children)):!0)?e:null}function Ch(e,t){const n={};for(const r in e)n[ts(r)]=e[r];return n}const Ni=e=>e?gp(e)?Ws(e):Ni(e.parent):null,co=Ke(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>Ni(e.parent),$root:e=>Ni(e.root),$host:e=>e.ce,$emit:e=>e.emit,$options:e=>Qf(e),$forceUpdate:e=>e.f||(e.f=()=>{Pa(e.update)}),$nextTick:e=>e.n||(e.n=Kt.bind(e.proxy)),$watch:e=>Jh.bind(e)}),si=(e,t)=>e!==Ne&&!e.__isScriptSetup&&Pe(e,t),Th={get({_:e},t){if(t==="__v_skip")return!0;const{ctx:n,setupState:r,data:o,props:s,accessCache:i,type:a,appContext:l}=e;let c;if(t[0]!=="$"){const d=i[t];if(d!==void 0)switch(d){case 1:return r[t];case 2:return o[t];case 4:return n[t];case 3:return s[t]}else{if(si(r,t))return i[t]=1,r[t];if(o!==Ne&&Pe(o,t))return i[t]=2,o[t];if((c=e.propsOptions[0])&&Pe(c,t))return i[t]=3,s[t];if(n!==Ne&&Pe(n,t))return i[t]=4,n[t];ki&&(i[t]=0)}}const u=co[t];let f,p;if(u)return t==="$attrs"&&rt(e.attrs,"get",""),u(e);if((f=a.__cssModules)&&(f=f[t]))return f;if(n!==Ne&&Pe(n,t))return i[t]=4,n[t];if(p=l.config.globalProperties,Pe(p,t))return p[t]},set({_:e},t,n){const{data:r,setupState:o,ctx:s}=e;return si(o,t)?(o[t]=n,!0):r!==Ne&&Pe(r,t)?(r[t]=n,!0):Pe(e.props,t)||t[0]==="$"&&t.slice(1)in e?!1:(s[t]=n,!0)},has({_:{data:e,setupState:t,accessCache:n,ctx:r,appContext:o,propsOptions:s,type:i}},a){let l,c;return!!(n[a]||e!==Ne&&a[0]!=="$"&&Pe(e,a)||si(t,a)||(l=s[0])&&Pe(l,a)||Pe(r,a)||Pe(co,a)||Pe(o.config.globalProperties,a)||(c=i.__cssModules)&&c[a])},defineProperty(e,t,n){return n.get!=null?e._.accessCache[t]=0:Pe(n,"value")&&this.set(e,t,n.value,null),Reflect.defineProperty(e,t,n)}};function Ah(){return Xf().slots}function Q3(){return Xf().attrs}function Xf(e){const t=Xe();return t.setupContext||(t.setupContext=vp(t))}function Il(e){return oe(e)?e.reduce((t,n)=>(t[n]=null,t),{}):e}let ki=!0;function Ih(e){const t=Qf(e),n=e.proxy,r=e.ctx;ki=!1,t.beforeCreate&&Ol(t.beforeCreate,e,"bc");const{data:o,computed:s,methods:i,watch:a,provide:l,inject:c,created:u,beforeMount:f,mounted:p,beforeUpdate:d,updated:m,activated:h,deactivated:S,beforeDestroy:b,beforeUnmount:C,destroyed:y,unmounted:E,render:N,renderTracked:z,renderTriggered:D,errorCaptured:A,serverPrefetch:v,expose:R,inheritAttrs:U,components:I,directives:M,filters:W}=t;if(c&&Oh(c,r,null),i)for(const O in i){const w=i[O];le(w)&&(r[O]=w.bind(n))}if(o){const O=o.call(n,n);Ee(O)&&(e.data=Bn(O))}if(ki=!0,s)for(const O in s){const w=s[O],V=le(w)?w.bind(n,n):le(w.get)?w.get.bind(n,n):ft,ce=!le(w)&&le(w.set)?w.set.bind(n):ft,me=k({get:V,set:ce});Object.defineProperty(r,O,{enumerable:!0,configurable:!0,get:()=>me.value,set:ne=>me.value=ne})}if(a)for(const O in a)Zf(a[O],r,n,O);if(l){const O=le(l)?l.call(n):l;Reflect.ownKeys(O).forEach(w=>{gt(w,O[w])})}u&&Ol(u,e,"c");function G(O,w){oe(w)?w.forEach(V=>O(V.bind(n))):w&&O(w.bind(n))}if(G(Kf,f),G(st,p),G(vh,d),G(qf,m),G(gh,h),G(Uf,S),G(xh,A),G(wh,z),G(bh,D),G(At,C),G(Ta,E),G(yh,v),oe(R))if(R.length){const O=e.exposed||(e.exposed={});R.forEach(w=>{Object.defineProperty(O,w,{get:()=>n[w],set:V=>n[w]=V,enumerable:!0})})}else e.exposed||(e.exposed={});N&&e.render===ft&&(e.render=N),U!=null&&(e.inheritAttrs=U),I&&(e.components=I),M&&(e.directives=M),v&&zf(e)}function Oh(e,t,n=ft){oe(e)&&(e=Fi(e));for(const r in e){const o=e[r];let s;Ee(o)?"default"in o?s=Ae(o.from||r,o.default,!0):s=Ae(o.from||r):s=Ae(o),$e(s)?Object.defineProperty(t,r,{enumerable:!0,configurable:!0,get:()=>s.value,set:i=>s.value=i}):t[r]=s}}function Ol(e,t,n){kt(oe(e)?e.map(r=>r.bind(t.proxy)):e.bind(t.proxy),t,n)}function Zf(e,t,n,r){let o=r.includes(".")?fp(n,r):()=>n[r];if(we(e)){const s=t[e];le(s)&&ye(o,s)}else if(le(e))ye(o,e.bind(n));else if(Ee(e))if(oe(e))e.forEach(s=>Zf(s,t,n,r));else{const s=le(e.handler)?e.handler.bind(n):t[e.handler];le(s)&&ye(o,s,e)}}function Qf(e){const t=e.type,{mixins:n,extends:r}=t,{mixins:o,optionsCache:s,config:{optionMergeStrategies:i}}=e.appContext,a=s.get(t);let l;return a?l=a:!o.length&&!n&&!r?l=t:(l={},o.length&&o.forEach(c=>gs(l,c,i,!0)),gs(l,t,i)),Ee(t)&&s.set(t,l),l}function gs(e,t,n,r=!1){const{mixins:o,extends:s}=t;s&&gs(e,s,n,!0),o&&o.forEach(i=>gs(e,i,n,!0));for(const i in t)if(!(r&&i==="expose")){const a=Mh[i]||n&&n[i];e[i]=a?a(e[i],t[i]):t[i]}return e}const Mh={data:Ml,props:Rl,emits:Rl,methods:to,computed:to,beforeCreate:it,created:it,beforeMount:it,mounted:it,beforeUpdate:it,updated:it,beforeDestroy:it,beforeUnmount:it,destroyed:it,unmounted:it,activated:it,deactivated:it,errorCaptured:it,serverPrefetch:it,components:to,directives:to,watch:Nh,provide:Ml,inject:Rh};function Ml(e,t){return t?e?function(){return Ke(le(e)?e.call(this,this):e,le(t)?t.call(this,this):t)}:t:e}function Rh(e,t){return to(Fi(e),Fi(t))}function Fi(e){if(oe(e)){const t={};for(let n=0;n<e.length;n++)t[e[n]]=e[n];return t}return e}function it(e,t){return e?[...new Set([].concat(e,t))]:t}function to(e,t){return e?Ke(Object.create(null),e,t):t}function Rl(e,t){return e?oe(e)&&oe(t)?[...new Set([...e,...t])]:Ke(Object.create(null),Il(e),Il(t??{})):t}function Nh(e,t){if(!e)return t;if(!t)return e;const n=Ke(Object.create(null),e);for(const r in t)n[r]=it(e[r],t[r]);return n}function ep(){return{app:null,config:{isNativeTag:ef,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let kh=0;function Fh(e,t){return function(r,o=null){le(r)||(r=Ke({},r)),o!=null&&!Ee(o)&&(o=null);const s=ep(),i=new WeakSet,a=[];let l=!1;const c=s.app={_uid:kh++,_component:r,_props:o,_container:null,_context:s,_instance:null,version:hg,get config(){return s.config},set config(u){},use(u,...f){return i.has(u)||(u&&le(u.install)?(i.add(u),u.install(c,...f)):le(u)&&(i.add(u),u(c,...f))),c},mixin(u){return s.mixins.includes(u)||s.mixins.push(u),c},component(u,f){return f?(s.components[u]=f,c):s.components[u]},directive(u,f){return f?(s.directives[u]=f,c):s.directives[u]},mount(u,f,p){if(!l){const d=c._ceVNode||re(r,o);return d.appContext=s,p===!0?p="svg":p===!1&&(p=void 0),e(d,u,p),l=!0,c._container=u,u.__vue_app__=c,Ws(d.component)}},onUnmount(u){a.push(u)},unmount(){l&&(kt(a,c._instance,16),e(null,c._container),delete c._container.__vue_app__)},provide(u,f){return s.provides[u]=f,c},runWithContext(u){const f=Qn;Qn=c;try{return u()}finally{Qn=f}}};return c}}let Qn=null;function gt(e,t){if(ot){let n=ot.provides;const r=ot.parent&&ot.parent.provides;r===n&&(n=ot.provides=Object.create(r)),n[e]=t}}function Ae(e,t,n=!1){const r=Xe();if(r||Qn){let o=Qn?Qn._context.provides:r?r.parent==null||r.ce?r.vnode.appContext&&r.vnode.appContext.provides:r.parent.provides:void 0;if(o&&e in o)return o[e];if(arguments.length>1)return n&&le(t)?t.call(r&&r.proxy):t}}function Lh(){return!!(Xe()||Qn)}const tp={},np=()=>Object.create(tp),rp=e=>Object.getPrototypeOf(e)===tp;function Dh(e,t,n,r=!1){const o={},s=np();e.propsDefaults=Object.create(null),op(e,t,o,s);for(const i in e.propsOptions[0])i in o||(o[i]=void 0);n?e.props=r?o:Bs(o):e.type.props?e.props=o:e.props=s,e.attrs=s}function Bh(e,t,n,r){const{props:o,attrs:s,vnode:{patchFlag:i}}=e,a=Se(o),[l]=e.propsOptions;let c=!1;if((r||i>0)&&!(i&16)){if(i&8){const u=e.vnode.dynamicProps;for(let f=0;f<u.length;f++){let p=u[f];if(Vs(e.emitsOptions,p))continue;const d=t[p];if(l)if(Pe(s,p))d!==s[p]&&(s[p]=d,c=!0);else{const m=xt(p);o[m]=Li(l,a,m,d,e,!1)}else d!==s[p]&&(s[p]=d,c=!0)}}}else{op(e,t,o,s)&&(c=!0);let u;for(const f in a)(!t||!Pe(t,f)&&((u=Dn(f))===f||!Pe(t,u)))&&(l?n&&(n[f]!==void 0||n[u]!==void 0)&&(o[f]=Li(l,a,f,void 0,e,!0)):delete o[f]);if(s!==a)for(const f in s)(!t||!Pe(t,f))&&(delete s[f],c=!0)}c&&on(e.attrs,"set","")}function op(e,t,n,r){const[o,s]=e.propsOptions;let i=!1,a;if(t)for(let l in t){if(oo(l))continue;const c=t[l];let u;o&&Pe(o,u=xt(l))?!s||!s.includes(u)?n[u]=c:(a||(a={}))[u]=c:Vs(e.emitsOptions,l)||(!(l in r)||c!==r[l])&&(r[l]=c,i=!0)}if(s){const l=Se(n),c=a||Ne;for(let u=0;u<s.length;u++){const f=s[u];n[f]=Li(o,l,f,c[f],e,!Pe(c,f))}}return i}function Li(e,t,n,r,o,s){const i=e[n];if(i!=null){const a=Pe(i,"default");if(a&&r===void 0){const l=i.default;if(i.type!==Function&&!i.skipFactory&&le(l)){const{propsDefaults:c}=o;if(n in c)r=c[n];else{const u=Lo(o);r=c[n]=l.call(null,t),u()}}else r=l;o.ce&&o.ce._setProp(n,r)}i[0]&&(s&&!a?r=!1:i[1]&&(r===""||r===Dn(n))&&(r=!0))}return r}const $h=new WeakMap;function sp(e,t,n=!1){const r=n?$h:t.propsCache,o=r.get(e);if(o)return o;const s=e.props,i={},a=[];let l=!1;if(!le(e)){const u=f=>{l=!0;const[p,d]=sp(f,t,!0);Ke(i,p),d&&a.push(...d)};!n&&t.mixins.length&&t.mixins.forEach(u),e.extends&&u(e.extends),e.mixins&&e.mixins.forEach(u)}if(!s&&!l)return Ee(e)&&r.set(e,Pr),Pr;if(oe(s))for(let u=0;u<s.length;u++){const f=xt(s[u]);Nl(f)&&(i[f]=Ne)}else if(s)for(const u in s){const f=xt(u);if(Nl(f)){const p=s[u],d=i[f]=oe(p)||le(p)?{type:p}:Ke({},p),m=d.type;let h=!1,S=!0;if(oe(m))for(let b=0;b<m.length;++b){const C=m[b],y=le(C)&&C.name;if(y==="Boolean"){h=!0;break}else y==="String"&&(S=!1)}else h=le(m)&&m.name==="Boolean";d[0]=h,d[1]=S,(h||Pe(d,"default"))&&a.push(f)}}const c=[i,a];return Ee(e)&&r.set(e,c),c}function Nl(e){return e[0]!=="$"&&!oo(e)}const Oa=e=>e==="_"||e==="_ctx"||e==="$stable",Ma=e=>oe(e)?e.map(Wt):[Wt(e)],jh=(e,t,n)=>{if(t._n)return t;const r=de((...o)=>Ma(t(...o)),n);return r._c=!1,r},ip=(e,t,n)=>{const r=e._ctx;for(const o in e){if(Oa(o))continue;const s=e[o];if(le(s))t[o]=jh(o,s,r);else if(s!=null){const i=Ma(s);t[o]=()=>i}}},ap=(e,t)=>{const n=Ma(t);e.slots.default=()=>n},lp=(e,t,n)=>{for(const r in t)(n||!Oa(r))&&(e[r]=t[r])},Hh=(e,t,n)=>{const r=e.slots=np();if(e.vnode.shapeFlag&32){const o=t._;o?(lp(r,t,n),n&&of(r,"_",o,!0)):ip(t,r)}else t&&ap(e,t)},Vh=(e,t,n)=>{const{vnode:r,slots:o}=e;let s=!0,i=Ne;if(r.shapeFlag&32){const a=t._;a?n&&a===1?s=!1:lp(o,t,n):(s=!t.$stable,ip(t,o)),i=t}else t&&(ap(e,t),i={default:1});if(s)for(const a in o)!Oa(a)&&i[a]==null&&delete o[a]},at=rg;function Wh(e){return zh(e)}function zh(e,t){const n=Ls();n.__VUE__=!0;const{insert:r,remove:o,patchProp:s,createElement:i,createText:a,createComment:l,setText:c,setElementText:u,parentNode:f,nextSibling:p,setScopeId:d=ft,insertStaticContent:m}=e,h=(g,_,T,L=null,$=null,F=null,ee=void 0,J=null,K=!!_.dynamicChildren)=>{if(g===_)return;g&&!qn(g,_)&&(L=P(g),ne(g,$,F,!0),g=null),_.patchFlag===-2&&(K=!1,_.dynamicChildren=null);const{type:H,ref:ue,shapeFlag:te}=_;switch(H){case Fo:S(g,_,T,L);break;case Je:b(g,_,T,L);break;case os:g==null&&C(_,T,L,ee);break;case ze:I(g,_,T,L,$,F,ee,J,K);break;default:te&1?N(g,_,T,L,$,F,ee,J,K):te&6?M(g,_,T,L,$,F,ee,J,K):(te&64||te&128)&&H.process(g,_,T,L,$,F,ee,J,K,se)}ue!=null&&$?lo(ue,g&&g.ref,F,_||g,!_):ue==null&&g&&g.ref!=null&&lo(g.ref,null,F,g,!0)},S=(g,_,T,L)=>{if(g==null)r(_.el=a(_.children),T,L);else{const $=_.el=g.el;_.children!==g.children&&c($,_.children)}},b=(g,_,T,L)=>{g==null?r(_.el=l(_.children||""),T,L):_.el=g.el},C=(g,_,T,L)=>{[g.el,g.anchor]=m(g.children,_,T,L,g.el,g.anchor)},y=({el:g,anchor:_},T,L)=>{let $;for(;g&&g!==_;)$=p(g),r(g,T,L),g=$;r(_,T,L)},E=({el:g,anchor:_})=>{let T;for(;g&&g!==_;)T=p(g),o(g),g=T;o(_)},N=(g,_,T,L,$,F,ee,J,K)=>{if(_.type==="svg"?ee="svg":_.type==="math"&&(ee="mathml"),g==null)z(_,T,L,$,F,ee,J,K);else{const H=g.el&&g.el._isVueCE?g.el:null;try{H&&H._beginPatch(),v(g,_,$,F,ee,J,K)}finally{H&&H._endPatch()}}},z=(g,_,T,L,$,F,ee,J)=>{let K,H;const{props:ue,shapeFlag:te,transition:ae,dirs:pe}=g;if(K=g.el=i(g.type,F,ue&&ue.is,ue),te&8?u(K,g.children):te&16&&A(g.children,K,null,L,$,ii(g,F),ee,J),pe&&Hn(g,null,L,"created"),D(K,g,g.scopeId,ee,L),ue){for(const Oe in ue)Oe!=="value"&&!oo(Oe)&&s(K,Oe,null,ue[Oe],F,L);"value"in ue&&s(K,"value",null,ue.value,F),(H=ue.onVnodeBeforeMount)&&jt(H,L,g)}pe&&Hn(g,null,L,"beforeMount");const ve=Uh($,ae);ve&&ae.beforeEnter(K),r(K,_,T),((H=ue&&ue.onVnodeMounted)||ve||pe)&&at(()=>{H&&jt(H,L,g),ve&&ae.enter(K),pe&&Hn(g,null,L,"mounted")},$)},D=(g,_,T,L,$)=>{if(T&&d(g,T),L)for(let F=0;F<L.length;F++)d(g,L[F]);if($){let F=$.subTree;if(_===F||dp(F.type)&&(F.ssContent===_||F.ssFallback===_)){const ee=$.vnode;D(g,ee,ee.scopeId,ee.slotScopeIds,$.parent)}}},A=(g,_,T,L,$,F,ee,J,K=0)=>{for(let H=K;H<g.length;H++){const ue=g[H]=J?Cn(g[H]):Wt(g[H]);h(null,ue,_,T,L,$,F,ee,J)}},v=(g,_,T,L,$,F,ee)=>{const J=_.el=g.el;let{patchFlag:K,dynamicChildren:H,dirs:ue}=_;K|=g.patchFlag&16;const te=g.props||Ne,ae=_.props||Ne;let pe;if(T&&Vn(T,!1),(pe=ae.onVnodeBeforeUpdate)&&jt(pe,T,_,g),ue&&Hn(_,g,T,"beforeUpdate"),T&&Vn(T,!0),(te.innerHTML&&ae.innerHTML==null||te.textContent&&ae.textContent==null)&&u(J,""),H?R(g.dynamicChildren,H,J,T,L,ii(_,$),F):ee||w(g,_,J,null,T,L,ii(_,$),F,!1),K>0){if(K&16)U(J,te,ae,T,$);else if(K&2&&te.class!==ae.class&&s(J,"class",null,ae.class,$),K&4&&s(J,"style",te.style,ae.style,$),K&8){const ve=_.dynamicProps;for(let Oe=0;Oe<ve.length;Oe++){const Ce=ve[Oe],pt=te[Ce],dt=ae[Ce];(dt!==pt||Ce==="value")&&s(J,Ce,pt,dt,$,T)}}K&1&&g.children!==_.children&&u(J,_.children)}else!ee&&H==null&&U(J,te,ae,T,$);((pe=ae.onVnodeUpdated)||ue)&&at(()=>{pe&&jt(pe,T,_,g),ue&&Hn(_,g,T,"updated")},L)},R=(g,_,T,L,$,F,ee)=>{for(let J=0;J<_.length;J++){const K=g[J],H=_[J],ue=K.el&&(K.type===ze||!qn(K,H)||K.shapeFlag&198)?f(K.el):T;h(K,H,ue,null,L,$,F,ee,!0)}},U=(g,_,T,L,$)=>{if(_!==T){if(_!==Ne)for(const F in _)!oo(F)&&!(F in T)&&s(g,F,_[F],null,$,L);for(const F in T){if(oo(F))continue;const ee=T[F],J=_[F];ee!==J&&F!=="value"&&s(g,F,J,ee,$,L)}"value"in T&&s(g,"value",_.value,T.value,$)}},I=(g,_,T,L,$,F,ee,J,K)=>{const H=_.el=g?g.el:a(""),ue=_.anchor=g?g.anchor:a("");let{patchFlag:te,dynamicChildren:ae,slotScopeIds:pe}=_;pe&&(J=J?J.concat(pe):pe),g==null?(r(H,T,L),r(ue,T,L),A(_.children||[],T,ue,$,F,ee,J,K)):te>0&&te&64&&ae&&g.dynamicChildren?(R(g.dynamicChildren,ae,T,$,F,ee,J),(_.key!=null||$&&_===$.subTree)&&Ra(g,_,!0)):w(g,_,T,ue,$,F,ee,J,K)},M=(g,_,T,L,$,F,ee,J,K)=>{_.slotScopeIds=J,g==null?_.shapeFlag&512?$.ctx.activate(_,T,L,ee,K):W(_,T,L,$,F,ee,K):X(g,_,K)},W=(g,_,T,L,$,F,ee)=>{const J=g.component=cg(g,L,$);if(js(g)&&(J.ctx.renderer=se),ug(J,!1,ee),J.asyncDep){if($&&$.registerDep(J,G,ee),!g.el){const K=J.subTree=re(Je);b(null,K,_,T),g.placeholder=K.el}}else G(J,g,_,T,$,F,ee)},X=(g,_,T)=>{const L=_.component=g.component;if(tg(g,_,T))if(L.asyncDep&&!L.asyncResolved){O(L,_,T);return}else L.next=_,L.update();else _.el=g.el,L.vnode=_},G=(g,_,T,L,$,F,ee)=>{const J=()=>{if(g.isMounted){let{next:te,bu:ae,u:pe,parent:ve,vnode:Oe}=g;{const Bt=cp(g);if(Bt){te&&(te.el=Oe.el,O(g,te,ee)),Bt.asyncDep.then(()=>{g.isUnmounted||J()});return}}let Ce=te,pt;Vn(g,!1),te?(te.el=Oe.el,O(g,te,ee)):te=Oe,ae&&ns(ae),(pt=te.props&&te.props.onVnodeBeforeUpdate)&&jt(pt,ve,te,Oe),Vn(g,!0);const dt=Fl(g),Dt=g.subTree;g.subTree=dt,h(Dt,dt,f(Dt.el),P(Dt),g,$,F),te.el=dt.el,Ce===null&&ng(g,dt.el),pe&&at(pe,$),(pt=te.props&&te.props.onVnodeUpdated)&&at(()=>jt(pt,ve,te,Oe),$)}else{let te;const{el:ae,props:pe}=_,{bm:ve,m:Oe,parent:Ce,root:pt,type:dt}=g,Dt=Ar(_);Vn(g,!1),ve&&ns(ve),!Dt&&(te=pe&&pe.onVnodeBeforeMount)&&jt(te,Ce,_),Vn(g,!0);{pt.ce&&pt.ce._def.shadowRoot!==!1&&pt.ce._injectChildStyle(dt);const Bt=g.subTree=Fl(g);h(null,Bt,T,L,g,$,F),_.el=Bt.el}if(Oe&&at(Oe,$),!Dt&&(te=pe&&pe.onVnodeMounted)){const Bt=_;at(()=>jt(te,Ce,Bt),$)}(_.shapeFlag&256||Ce&&Ar(Ce.vnode)&&Ce.vnode.shapeFlag&256)&&g.a&&at(g.a,$),g.isMounted=!0,_=T=L=null}};g.scope.on();const K=g.effect=new df(J);g.scope.off();const H=g.update=K.run.bind(K),ue=g.job=K.runIfDirty.bind(K);ue.i=g,ue.id=g.uid,K.scheduler=()=>Pa(ue),Vn(g,!0),H()},O=(g,_,T)=>{_.component=g;const L=g.vnode.props;g.vnode=_,g.next=null,Bh(g,_.props,L,T),Vh(g,_.children,T),cn(),xl(g),un()},w=(g,_,T,L,$,F,ee,J,K=!1)=>{const H=g&&g.children,ue=g?g.shapeFlag:0,te=_.children,{patchFlag:ae,shapeFlag:pe}=_;if(ae>0){if(ae&128){ce(H,te,T,L,$,F,ee,J,K);return}else if(ae&256){V(H,te,T,L,$,F,ee,J,K);return}}pe&8?(ue&16&&ke(H,$,F),te!==H&&u(T,te)):ue&16?pe&16?ce(H,te,T,L,$,F,ee,J,K):ke(H,$,F,!0):(ue&8&&u(T,""),pe&16&&A(te,T,L,$,F,ee,J,K))},V=(g,_,T,L,$,F,ee,J,K)=>{g=g||Pr,_=_||Pr;const H=g.length,ue=_.length,te=Math.min(H,ue);let ae;for(ae=0;ae<te;ae++){const pe=_[ae]=K?Cn(_[ae]):Wt(_[ae]);h(g[ae],pe,T,null,$,F,ee,J,K)}H>ue?ke(g,$,F,!0,!1,te):A(_,T,L,$,F,ee,J,K,te)},ce=(g,_,T,L,$,F,ee,J,K)=>{let H=0;const ue=_.length;let te=g.length-1,ae=ue-1;for(;H<=te&&H<=ae;){const pe=g[H],ve=_[H]=K?Cn(_[H]):Wt(_[H]);if(qn(pe,ve))h(pe,ve,T,null,$,F,ee,J,K);else break;H++}for(;H<=te&&H<=ae;){const pe=g[te],ve=_[ae]=K?Cn(_[ae]):Wt(_[ae]);if(qn(pe,ve))h(pe,ve,T,null,$,F,ee,J,K);else break;te--,ae--}if(H>te){if(H<=ae){const pe=ae+1,ve=pe<ue?_[pe].el:L;for(;H<=ae;)h(null,_[H]=K?Cn(_[H]):Wt(_[H]),T,ve,$,F,ee,J,K),H++}}else if(H>ae)for(;H<=te;)ne(g[H],$,F,!0),H++;else{const pe=H,ve=H,Oe=new Map;for(H=ve;H<=ae;H++){const yt=_[H]=K?Cn(_[H]):Wt(_[H]);yt.key!=null&&Oe.set(yt.key,H)}let Ce,pt=0;const dt=ae-ve+1;let Dt=!1,Bt=0;const qr=new Array(dt);for(H=0;H<dt;H++)qr[H]=0;for(H=pe;H<=te;H++){const yt=g[H];if(pt>=dt){ne(yt,$,F,!0);continue}let $t;if(yt.key!=null)$t=Oe.get(yt.key);else for(Ce=ve;Ce<=ae;Ce++)if(qr[Ce-ve]===0&&qn(yt,_[Ce])){$t=Ce;break}$t===void 0?ne(yt,$,F,!0):(qr[$t-ve]=H+1,$t>=Bt?Bt=$t:Dt=!0,h(yt,_[$t],T,null,$,F,ee,J,K),pt++)}const hl=Dt?Gh(qr):Pr;for(Ce=hl.length-1,H=dt-1;H>=0;H--){const yt=ve+H,$t=_[yt],gl=_[yt+1],_l=yt+1<ue?gl.el||gl.placeholder:L;qr[H]===0?h(null,$t,T,_l,$,F,ee,J,K):Dt&&(Ce<0||H!==hl[Ce]?me($t,T,_l,2):Ce--)}}},me=(g,_,T,L,$=null)=>{const{el:F,type:ee,transition:J,children:K,shapeFlag:H}=g;if(H&6){me(g.component.subTree,_,T,L);return}if(H&128){g.suspense.move(_,T,L);return}if(H&64){ee.move(g,_,T,se);return}if(ee===ze){r(F,_,T);for(let te=0;te<K.length;te++)me(K[te],_,T,L);r(g.anchor,_,T);return}if(ee===os){y(g,_,T);return}if(L!==2&&H&1&&J)if(L===0)J.beforeEnter(F),r(F,_,T),at(()=>J.enter(F),$);else{const{leave:te,delayLeave:ae,afterLeave:pe}=J,ve=()=>{g.ctx.isUnmounted?o(F):r(F,_,T)},Oe=()=>{F._isLeaving&&F[rn](!0),te(F,()=>{ve(),pe&&pe()})};ae?ae(F,ve,Oe):Oe()}else r(F,_,T)},ne=(g,_,T,L=!1,$=!1)=>{const{type:F,props:ee,ref:J,children:K,dynamicChildren:H,shapeFlag:ue,patchFlag:te,dirs:ae,cacheIndex:pe}=g;if(te===-2&&($=!1),J!=null&&(cn(),lo(J,null,T,g,!0),un()),pe!=null&&(_.renderCache[pe]=void 0),ue&256){_.ctx.deactivate(g);return}const ve=ue&1&&ae,Oe=!Ar(g);let Ce;if(Oe&&(Ce=ee&&ee.onVnodeBeforeUnmount)&&jt(Ce,_,g),ue&6)Te(g.component,T,L);else{if(ue&128){g.suspense.unmount(T,L);return}ve&&Hn(g,null,_,"beforeUnmount"),ue&64?g.type.remove(g,_,T,se,L):H&&!H.hasOnce&&(F!==ze||te>0&&te&64)?ke(H,_,T,!1,!0):(F===ze&&te&384||!$&&ue&16)&&ke(K,_,T),L&&ge(g)}(Oe&&(Ce=ee&&ee.onVnodeUnmounted)||ve)&&at(()=>{Ce&&jt(Ce,_,g),ve&&Hn(g,null,_,"unmounted")},T)},ge=g=>{const{type:_,el:T,anchor:L,transition:$}=g;if(_===ze){_e(T,L);return}if(_===os){E(g);return}const F=()=>{o(T),$&&!$.persisted&&$.afterLeave&&$.afterLeave()};if(g.shapeFlag&1&&$&&!$.persisted){const{leave:ee,delayLeave:J}=$,K=()=>ee(T,F);J?J(g.el,F,K):K()}else F()},_e=(g,_)=>{let T;for(;g!==_;)T=p(g),o(g),g=T;o(_)},Te=(g,_,T)=>{const{bum:L,scope:$,job:F,subTree:ee,um:J,m:K,a:H}=g;kl(K),kl(H),L&&ns(L),$.stop(),F&&(F.flags|=8,ne(ee,g,_,T)),J&&at(J,_),at(()=>{g.isUnmounted=!0},_)},ke=(g,_,T,L=!1,$=!1,F=0)=>{for(let ee=F;ee<g.length;ee++)ne(g[ee],_,T,L,$)},P=g=>{if(g.shapeFlag&6)return P(g.component.subTree);if(g.shapeFlag&128)return g.suspense.next();const _=p(g.anchor||g.el),T=_&&_[Ff];return T?p(T):_};let j=!1;const Z=(g,_,T)=>{g==null?_._vnode&&ne(_._vnode,null,null,!0):h(_._vnode||null,g,_,null,null,null,T),_._vnode=g,j||(j=!0,xl(),Rf(),j=!1)},se={p:h,um:ne,m:me,r:ge,mt:W,mc:A,pc:w,pbc:R,n:P,o:e};return{render:Z,hydrate:void 0,createApp:Fh(Z)}}function ii({type:e,props:t},n){return n==="svg"&&e==="foreignObject"||n==="mathml"&&e==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:n}function Vn({effect:e,job:t},n){n?(e.flags|=32,t.flags|=4):(e.flags&=-33,t.flags&=-5)}function Uh(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function Ra(e,t,n=!1){const r=e.children,o=t.children;if(oe(r)&&oe(o))for(let s=0;s<r.length;s++){const i=r[s];let a=o[s];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=o[s]=Cn(o[s]),a.el=i.el),!n&&a.patchFlag!==-2&&Ra(i,a)),a.type===Fo&&a.patchFlag!==-1&&(a.el=i.el),a.type===Je&&!a.el&&(a.el=i.el)}}function Gh(e){const t=e.slice(),n=[0];let r,o,s,i,a;const l=e.length;for(r=0;r<l;r++){const c=e[r];if(c!==0){if(o=n[n.length-1],e[o]<c){t[r]=o,n.push(r);continue}for(s=0,i=n.length-1;s<i;)a=s+i>>1,e[n[a]]<c?s=a+1:i=a;c<e[n[s]]&&(s>0&&(t[r]=n[s-1]),n[s]=r)}}for(s=n.length,i=n[s-1];s-- >0;)n[s]=i,i=t[i];return n}function cp(e){const t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:cp(t)}function kl(e){if(e)for(let t=0;t<e.length;t++)e[t].flags|=8}const Kh=Symbol.for("v-scx"),qh=()=>Ae(Kh);function up(e,t){return Na(e,null,t)}function ye(e,t,n){return Na(e,t,n)}function Na(e,t,n=Ne){const{immediate:r,deep:o,flush:s,once:i}=n,a=Ke({},n),l=t&&r||!t&&s!=="post";let c;if(Eo){if(s==="sync"){const d=qh();c=d.__watcherHandles||(d.__watcherHandles=[])}else if(!l){const d=()=>{};return d.stop=ft,d.resume=ft,d.pause=ft,d}}const u=ot;a.call=(d,m,h)=>kt(d,u,m,h);let f=!1;s==="post"?a.scheduler=d=>{at(d,u&&u.suspense)}:s!=="sync"&&(f=!0,a.scheduler=(d,m)=>{m?d():Pa(d)}),a.augmentJob=d=>{t&&(d.flags|=4),f&&(d.flags|=2,u&&(d.id=u.uid,d.i=u))};const p=lh(e,t,a);return Eo&&(c?c.push(p):l&&p()),p}function Jh(e,t,n){const r=this.proxy,o=we(e)?e.includes(".")?fp(r,e):()=>r[e]:e.bind(r,r);let s;le(t)?s=t:(s=t.handler,n=t);const i=Lo(this),a=Na(o,s.bind(r),n);return i(),a}function fp(e,t){const n=t.split(".");return()=>{let r=e;for(let o=0;o<n.length&&r;o++)r=r[n[o]];return r}}const Yh=(e,t)=>t==="modelValue"||t==="model-value"?e.modelModifiers:e[`${t}Modifiers`]||e[`${xt(t)}Modifiers`]||e[`${Dn(t)}Modifiers`];function Xh(e,t,...n){if(e.isUnmounted)return;const r=e.vnode.props||Ne;let o=n;const s=t.startsWith("update:"),i=s&&Yh(r,t.slice(7));i&&(i.trim&&(o=n.map(u=>we(u)?u.trim():u)),i.number&&(o=n.map(ma)));let a,l=r[a=ts(t)]||r[a=ts(xt(t))];!l&&s&&(l=r[a=ts(Dn(t))]),l&&kt(l,e,6,o);const c=r[a+"Once"];if(c){if(!e.emitted)e.emitted={};else if(e.emitted[a])return;e.emitted[a]=!0,kt(c,e,6,o)}}const Zh=new WeakMap;function pp(e,t,n=!1){const r=n?Zh:t.emitsCache,o=r.get(e);if(o!==void 0)return o;const s=e.emits;let i={},a=!1;if(!le(e)){const l=c=>{const u=pp(c,t,!0);u&&(a=!0,Ke(i,u))};!n&&t.mixins.length&&t.mixins.forEach(l),e.extends&&l(e.extends),e.mixins&&e.mixins.forEach(l)}return!s&&!a?(Ee(e)&&r.set(e,null),null):(oe(s)?s.forEach(l=>i[l]=null):Ke(i,s),Ee(e)&&r.set(e,i),i)}function Vs(e,t){return!e||!Rs(t)?!1:(t=t.slice(2).replace(/Once$/,""),Pe(e,t[0].toLowerCase()+t.slice(1))||Pe(e,Dn(t))||Pe(e,t))}function Fl(e){const{type:t,vnode:n,proxy:r,withProxy:o,propsOptions:[s],slots:i,attrs:a,emit:l,render:c,renderCache:u,props:f,data:p,setupState:d,ctx:m,inheritAttrs:h}=e,S=ms(e);let b,C;try{if(n.shapeFlag&4){const E=o||r,N=E;b=Wt(c.call(N,E,u,f,d,p,m)),C=a}else{const E=t;b=Wt(E.length>1?E(f,{attrs:a,slots:i,emit:l}):E(f,null)),C=t.props?a:Qh(a)}}catch(E){uo.length=0,$s(E,e,1),b=re(Je)}let y=b;if(C&&h!==!1){const E=Object.keys(C),{shapeFlag:N}=y;E.length&&N&7&&(s&&E.some(fa)&&(C=eg(C,s)),y=fn(y,C,!1,!0))}return n.dirs&&(y=fn(y,null,!1,!0),y.dirs=y.dirs?y.dirs.concat(n.dirs):n.dirs),n.transition&&or(y,n.transition),b=y,ms(S),b}const Qh=e=>{let t;for(const n in e)(n==="class"||n==="style"||Rs(n))&&((t||(t={}))[n]=e[n]);return t},eg=(e,t)=>{const n={};for(const r in e)(!fa(r)||!(r.slice(9)in t))&&(n[r]=e[r]);return n};function tg(e,t,n){const{props:r,children:o,component:s}=e,{props:i,children:a,patchFlag:l}=t,c=s.emitsOptions;if(t.dirs||t.transition)return!0;if(n&&l>=0){if(l&1024)return!0;if(l&16)return r?Ll(r,i,c):!!i;if(l&8){const u=t.dynamicProps;for(let f=0;f<u.length;f++){const p=u[f];if(i[p]!==r[p]&&!Vs(c,p))return!0}}}else return(o||a)&&(!a||!a.$stable)?!0:r===i?!1:r?i?Ll(r,i,c):!0:!!i;return!1}function Ll(e,t,n){const r=Object.keys(t);if(r.length!==Object.keys(e).length)return!0;for(let o=0;o<r.length;o++){const s=r[o];if(t[s]!==e[s]&&!Vs(n,s))return!0}return!1}function ng({vnode:e,parent:t},n){for(;t;){const r=t.subTree;if(r.suspense&&r.suspense.activeBranch===e&&(r.el=e.el),r===e)(e=t.vnode).el=n,t=t.parent;else break}}const dp=e=>e.__isSuspense;function rg(e,t){t&&t.pendingBranch?oe(e)?t.effects.push(...e):t.effects.push(e):fh(e)}const ze=Symbol.for("v-fgt"),Fo=Symbol.for("v-txt"),Je=Symbol.for("v-cmt"),os=Symbol.for("v-stc"),uo=[];let wt=null;function Y(e=!1){uo.push(wt=e?null:[])}function og(){uo.pop(),wt=uo[uo.length-1]||null}let So=1;function _s(e,t=!1){So+=e,e<0&&wt&&t&&(wt.hasOnce=!0)}function mp(e){return e.dynamicChildren=So>0?wt||Pr:null,og(),So>0&&wt&&wt.push(e),e}function ie(e,t,n,r,o,s){return mp(Q(e,t,n,r,o,s,!0))}function He(e,t,n,r,o){return mp(re(e,t,n,r,o,!0))}function Ut(e){return e?e.__v_isVNode===!0:!1}function qn(e,t){return e.type===t.type&&e.key===t.key}const hp=({key:e})=>e??null,ss=({ref:e,ref_key:t,ref_for:n})=>(typeof e=="number"&&(e=""+e),e!=null?we(e)||$e(e)||le(e)?{i:Qe,r:e,k:t,f:!!n}:e:null);function Q(e,t=null,n=null,r=0,o=null,s=e===ze?0:1,i=!1,a=!1){const l={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&hp(t),ref:t&&ss(t),scopeId:kf,slotScopeIds:null,children:n,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:r,dynamicProps:o,dynamicChildren:null,appContext:null,ctx:Qe};return a?(Fa(l,n),s&128&&e.normalize(l)):n&&(l.shapeFlag|=we(n)?8:16),So>0&&!i&&wt&&(l.patchFlag>0||s&6)&&l.patchFlag!==32&&wt.push(l),l}const re=sg;function sg(e,t=null,n=null,r=0,o=null,s=!1){if((!e||e===Jf)&&(e=Je),Ut(e)){const a=fn(e,t,!0);return n&&Fa(a,n),So>0&&!s&&wt&&(a.shapeFlag&6?wt[wt.indexOf(e)]=a:wt.push(a)),a.patchFlag=-2,a}if(mg(e)&&(e=e.__vccOpts),t){t=ig(t);let{class:a,style:l}=t;a&&!we(a)&&(t.class=De(a)),Ee(l)&&(xa(l)&&!oe(l)&&(l=Ke({},l)),t.style=Xt(l))}const i=we(e)?1:dp(e)?128:Lf(e)?64:Ee(e)?4:le(e)?2:0;return Q(e,t,n,r,o,i,s,!0)}function ig(e){return e?xa(e)||rp(e)?Ke({},e):e:null}function fn(e,t,n=!1,r=!1){const{props:o,ref:s,patchFlag:i,children:a,transition:l}=e,c=t?lr(o||{},t):o,u={__v_isVNode:!0,__v_skip:!0,type:e.type,props:c,key:c&&hp(c),ref:t&&t.ref?n&&s?oe(s)?s.concat(ss(t)):[s,ss(t)]:ss(t):s,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:a,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==ze?i===-1?16:i|16:i,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:l,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&fn(e.ssContent),ssFallback:e.ssFallback&&fn(e.ssFallback),placeholder:e.placeholder,el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce};return l&&r&&or(u,l.clone(u)),u}function ka(e=" ",t=0){return re(Fo,null,e,t)}function eE(e,t){const n=re(os,null,e);return n.staticCount=t,n}function On(e="",t=!1){return t?(Y(),He(Je,null,e)):re(Je,null,e)}function Wt(e){return e==null||typeof e=="boolean"?re(Je):oe(e)?re(ze,null,e.slice()):Ut(e)?Cn(e):re(Fo,null,String(e))}function Cn(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:fn(e)}function Fa(e,t){let n=0;const{shapeFlag:r}=e;if(t==null)t=null;else if(oe(t))n=16;else if(typeof t=="object")if(r&65){const o=t.default;o&&(o._c&&(o._d=!1),Fa(e,o()),o._c&&(o._d=!0));return}else{n=32;const o=t._;!o&&!rp(t)?t._ctx=Qe:o===3&&Qe&&(Qe.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}else le(t)?(t={default:t,_ctx:Qe},n=32):(t=String(t),r&64?(n=16,t=[ka(t)]):n=8);e.children=t,e.shapeFlag|=n}function lr(...e){const t={};for(let n=0;n<e.length;n++){const r=e[n];for(const o in r)if(o==="class")t.class!==r.class&&(t.class=De([t.class,r.class]));else if(o==="style")t.style=Xt([t.style,r.style]);else if(Rs(o)){const s=t[o],i=r[o];i&&s!==i&&!(oe(s)&&s.includes(i))&&(t[o]=s?[].concat(s,i):i)}else o!==""&&(t[o]=r[o])}return t}function jt(e,t,n,r=null){kt(e,t,7,[n,r])}const ag=ep();let lg=0;function cg(e,t,n){const r=e.type,o=(t?t.appContext:e.appContext)||ag,s={uid:lg++,vnode:e,type:r,parent:t,appContext:o,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new uf(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(o.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:sp(r,o),emitsOptions:pp(r,o),emit:null,emitted:null,propsDefaults:Ne,inheritAttrs:r.inheritAttrs,ctx:Ne,data:Ne,props:Ne,attrs:Ne,slots:Ne,refs:Ne,setupState:Ne,setupContext:null,suspense:n,suspenseId:n?n.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return s.ctx={_:s},s.root=t?t.root:s,s.emit=Xh.bind(null,s),e.ce&&e.ce(s),s}let ot=null;const Xe=()=>ot||Qe;let vs,Di;{const e=Ls(),t=(n,r)=>{let o;return(o=e[n])||(o=e[n]=[]),o.push(r),s=>{o.length>1?o.forEach(i=>i(s)):o[0](s)}};vs=t("__VUE_INSTANCE_SETTERS__",n=>ot=n),Di=t("__VUE_SSR_SETTERS__",n=>Eo=n)}const Lo=e=>{const t=ot;return vs(e),e.scope.on(),()=>{e.scope.off(),vs(t)}},Dl=()=>{ot&&ot.scope.off(),vs(null)};function gp(e){return e.vnode.shapeFlag&4}let Eo=!1;function ug(e,t=!1,n=!1){t&&Di(t);const{props:r,children:o}=e.vnode,s=gp(e);Dh(e,r,s,t),Hh(e,o,n||t);const i=s?fg(e,t):void 0;return t&&Di(!1),i}function fg(e,t){const n=e.type;e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,Th);const{setup:r}=n;if(r){cn();const o=e.setupContext=r.length>1?vp(e):null,s=Lo(e),i=ko(r,e,0,[e.props,o]),a=tf(i);if(un(),s(),(a||e.sp)&&!Ar(e)&&zf(e),a){if(i.then(Dl,Dl),t)return i.then(l=>{Bl(e,l)}).catch(l=>{$s(l,e,0)});e.asyncDep=i}else Bl(e,i)}else _p(e)}function Bl(e,t,n){le(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:Ee(t)&&(e.setupState=Af(t)),_p(e)}function _p(e,t,n){const r=e.type;e.render||(e.render=r.render||ft);{const o=Lo(e);cn();try{Ih(e)}finally{un(),o()}}}const pg={get(e,t){return rt(e,"get",""),e[t]}};function vp(e){const t=n=>{e.exposed=n||{}};return{attrs:new Proxy(e.attrs,pg),slots:e.slots,emit:e.emit,expose:t}}function Ws(e){return e.exposed?e.exposeProxy||(e.exposeProxy=new Proxy(Af(Sa(e.exposed)),{get(t,n){if(n in t)return t[n];if(n in co)return co[n](e)},has(t,n){return n in t||n in co}})):e.proxy}function dg(e,t=!0){return le(e)?e.displayName||e.name:e.name||t&&e.__name}function mg(e){return le(e)&&"__vccOpts"in e}const k=(e,t)=>ih(e,t,Eo);function We(e,t,n){try{_s(-1);const r=arguments.length;return r===2?Ee(t)&&!oe(t)?Ut(t)?re(e,null,[t]):re(e,t):re(e,null,t):(r>3?n=Array.prototype.slice.call(arguments,2):r===3&&Ut(n)&&(n=[n]),re(e,t,n))}finally{_s(1)}}const hg="3.5.24",gg=ft;/**
* @vue/runtime-dom v3.5.24
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let Bi;const $l=typeof window<"u"&&window.trustedTypes;if($l)try{Bi=$l.createPolicy("vue",{createHTML:e=>e})}catch{}const yp=Bi?e=>Bi.createHTML(e):e=>e,_g="http://www.w3.org/2000/svg",vg="http://www.w3.org/1998/Math/MathML",tn=typeof document<"u"?document:null,jl=tn&&tn.createElement("template"),yg={insert:(e,t,n)=>{t.insertBefore(e,n||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,n,r)=>{const o=t==="svg"?tn.createElementNS(_g,e):t==="mathml"?tn.createElementNS(vg,e):n?tn.createElement(e,{is:n}):tn.createElement(e);return e==="select"&&r&&r.multiple!=null&&o.setAttribute("multiple",r.multiple),o},createText:e=>tn.createTextNode(e),createComment:e=>tn.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>tn.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,n,r,o,s){const i=n?n.previousSibling:t.lastChild;if(o&&(o===s||o.nextSibling))for(;t.insertBefore(o.cloneNode(!0),n),!(o===s||!(o=o.nextSibling)););else{jl.innerHTML=yp(r==="svg"?`<svg>${e}</svg>`:r==="mathml"?`<math>${e}</math>`:e);const a=jl.content;if(r==="svg"||r==="mathml"){const l=a.firstChild;for(;l.firstChild;)a.appendChild(l.firstChild);a.removeChild(l)}t.insertBefore(a,n)}return[i?i.nextSibling:t.firstChild,n?n.previousSibling:t.lastChild]}},yn="transition",Yr="animation",Mr=Symbol("_vtc"),bp={name:String,type:String,css:{type:Boolean,default:!0},duration:[String,Number,Object],enterFromClass:String,enterActiveClass:String,enterToClass:String,appearFromClass:String,appearActiveClass:String,appearToClass:String,leaveFromClass:String,leaveActiveClass:String,leaveToClass:String},wp=Ke({},jf,bp),bg=e=>(e.displayName="Transition",e.props=wp,e),Do=bg((e,{slots:t})=>We(hh,xp(e),t)),Wn=(e,t=[])=>{oe(e)?e.forEach(n=>n(...t)):e&&e(...t)},Hl=e=>e?oe(e)?e.some(t=>t.length>1):e.length>1:!1;function xp(e){const t={};for(const I in e)I in bp||(t[I]=e[I]);if(e.css===!1)return t;const{name:n="v",type:r,duration:o,enterFromClass:s=`${n}-enter-from`,enterActiveClass:i=`${n}-enter-active`,enterToClass:a=`${n}-enter-to`,appearFromClass:l=s,appearActiveClass:c=i,appearToClass:u=a,leaveFromClass:f=`${n}-leave-from`,leaveActiveClass:p=`${n}-leave-active`,leaveToClass:d=`${n}-leave-to`}=e,m=wg(o),h=m&&m[0],S=m&&m[1],{onBeforeEnter:b,onEnter:C,onEnterCancelled:y,onLeave:E,onLeaveCancelled:N,onBeforeAppear:z=b,onAppear:D=C,onAppearCancelled:A=y}=t,v=(I,M,W,X)=>{I._enterCancelled=X,wn(I,M?u:a),wn(I,M?c:i),W&&W()},R=(I,M)=>{I._isLeaving=!1,wn(I,f),wn(I,d),wn(I,p),M&&M()},U=I=>(M,W)=>{const X=I?D:C,G=()=>v(M,I,W);Wn(X,[M,G]),Vl(()=>{wn(M,I?l:s),Ht(M,I?u:a),Hl(X)||Wl(M,r,h,G)})};return Ke(t,{onBeforeEnter(I){Wn(b,[I]),Ht(I,s),Ht(I,i)},onBeforeAppear(I){Wn(z,[I]),Ht(I,l),Ht(I,c)},onEnter:U(!1),onAppear:U(!0),onLeave(I,M){I._isLeaving=!0;const W=()=>R(I,M);Ht(I,f),I._enterCancelled?(Ht(I,p),$i(I)):($i(I),Ht(I,p)),Vl(()=>{I._isLeaving&&(wn(I,f),Ht(I,d),Hl(E)||Wl(I,r,S,W))}),Wn(E,[I,W])},onEnterCancelled(I){v(I,!1,void 0,!0),Wn(y,[I])},onAppearCancelled(I){v(I,!0,void 0,!0),Wn(A,[I])},onLeaveCancelled(I){R(I),Wn(N,[I])}})}function wg(e){if(e==null)return null;if(Ee(e))return[ai(e.enter),ai(e.leave)];{const t=ai(e);return[t,t]}}function ai(e){return Tm(e)}function Ht(e,t){t.split(/\s+/).forEach(n=>n&&e.classList.add(n)),(e[Mr]||(e[Mr]=new Set)).add(t)}function wn(e,t){t.split(/\s+/).forEach(r=>r&&e.classList.remove(r));const n=e[Mr];n&&(n.delete(t),n.size||(e[Mr]=void 0))}function Vl(e){requestAnimationFrame(()=>{requestAnimationFrame(e)})}let xg=0;function Wl(e,t,n,r){const o=e._endId=++xg,s=()=>{o===e._endId&&r()};if(n!=null)return setTimeout(s,n);const{type:i,timeout:a,propCount:l}=Sp(e,t);if(!i)return r();const c=i+"end";let u=0;const f=()=>{e.removeEventListener(c,p),s()},p=d=>{d.target===e&&++u>=l&&f()};setTimeout(()=>{u<l&&f()},a+1),e.addEventListener(c,p)}function Sp(e,t){const n=window.getComputedStyle(e),r=m=>(n[m]||"").split(", "),o=r(`${yn}Delay`),s=r(`${yn}Duration`),i=zl(o,s),a=r(`${Yr}Delay`),l=r(`${Yr}Duration`),c=zl(a,l);let u=null,f=0,p=0;t===yn?i>0&&(u=yn,f=i,p=s.length):t===Yr?c>0&&(u=Yr,f=c,p=l.length):(f=Math.max(i,c),u=f>0?i>c?yn:Yr:null,p=u?u===yn?s.length:l.length:0);const d=u===yn&&/\b(?:transform|all)(?:,|$)/.test(r(`${yn}Property`).toString());return{type:u,timeout:f,propCount:p,hasTransform:d}}function zl(e,t){for(;e.length<t.length;)e=e.concat(e);return Math.max(...t.map((n,r)=>Ul(n)+Ul(e[r])))}function Ul(e){return e==="auto"?0:Number(e.slice(0,-1).replace(",","."))*1e3}function $i(e){return(e?e.ownerDocument:document).body.offsetHeight}function Sg(e,t,n){const r=e[Mr];r&&(t=(t?[t,...r]:[...r]).join(" ")),t==null?e.removeAttribute("class"):n?e.setAttribute("class",t):e.className=t}const ys=Symbol("_vod"),Ep=Symbol("_vsh"),zs={name:"show",beforeMount(e,{value:t},{transition:n}){e[ys]=e.style.display==="none"?"":e.style.display,n&&t?n.beforeEnter(e):Xr(e,t)},mounted(e,{value:t},{transition:n}){n&&t&&n.enter(e)},updated(e,{value:t,oldValue:n},{transition:r}){!t!=!n&&(r?t?(r.beforeEnter(e),Xr(e,!0),r.enter(e)):r.leave(e,()=>{Xr(e,!1)}):Xr(e,t))},beforeUnmount(e,{value:t}){Xr(e,t)}};function Xr(e,t){e.style.display=t?e[ys]:"none",e[Ep]=!t}const Eg=Symbol(""),Pg=/(?:^|;)\s*display\s*:/;function Cg(e,t,n){const r=e.style,o=we(n);let s=!1;if(n&&!o){if(t)if(we(t))for(const i of t.split(";")){const a=i.slice(0,i.indexOf(":")).trim();n[a]==null&&is(r,a,"")}else for(const i in t)n[i]==null&&is(r,i,"");for(const i in n)i==="display"&&(s=!0),is(r,i,n[i])}else if(o){if(t!==n){const i=r[Eg];i&&(n+=";"+i),r.cssText=n,s=Pg.test(n)}}else t&&e.removeAttribute("style");ys in e&&(e[ys]=s?r.display:"",e[Ep]&&(r.display="none"))}const Gl=/\s*!important$/;function is(e,t,n){if(oe(n))n.forEach(r=>is(e,t,r));else if(n==null&&(n=""),t.startsWith("--"))e.setProperty(t,n);else{const r=Tg(e,t);Gl.test(n)?e.setProperty(Dn(r),n.replace(Gl,""),"important"):e[r]=n}}const Kl=["Webkit","Moz","ms"],li={};function Tg(e,t){const n=li[t];if(n)return n;let r=xt(t);if(r!=="filter"&&r in e)return li[t]=r;r=Fs(r);for(let o=0;o<Kl.length;o++){const s=Kl[o]+r;if(s in e)return li[t]=s}return t}const ql="http://www.w3.org/1999/xlink";function Jl(e,t,n,r,o,s=Nm(t)){r&&t.startsWith("xlink:")?n==null?e.removeAttributeNS(ql,t.slice(6,t.length)):e.setAttributeNS(ql,t,n):n==null||s&&!sf(n)?e.removeAttribute(t):e.setAttribute(t,s?"":Nt(n)?String(n):n)}function Yl(e,t,n,r,o){if(t==="innerHTML"||t==="textContent"){n!=null&&(e[t]=t==="innerHTML"?yp(n):n);return}const s=e.tagName;if(t==="value"&&s!=="PROGRESS"&&!s.includes("-")){const a=s==="OPTION"?e.getAttribute("value")||"":e.value,l=n==null?e.type==="checkbox"?"on":"":String(n);(a!==l||!("_value"in e))&&(e.value=l),n==null&&e.removeAttribute(t),e._value=n;return}let i=!1;if(n===""||n==null){const a=typeof e[t];a==="boolean"?n=sf(n):n==null&&a==="string"?(n="",i=!0):a==="number"&&(n=0,i=!0)}try{e[t]=n}catch{}i&&e.removeAttribute(o||t)}function In(e,t,n,r){e.addEventListener(t,n,r)}function Ag(e,t,n,r){e.removeEventListener(t,n,r)}const Xl=Symbol("_vei");function Ig(e,t,n,r,o=null){const s=e[Xl]||(e[Xl]={}),i=s[t];if(r&&i)i.value=r;else{const[a,l]=Og(t);if(r){const c=s[t]=Ng(r,o);In(e,a,c,l)}else i&&(Ag(e,a,i,l),s[t]=void 0)}}const Zl=/(?:Once|Passive|Capture)$/;function Og(e){let t;if(Zl.test(e)){t={};let r;for(;r=e.match(Zl);)e=e.slice(0,e.length-r[0].length),t[r[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Dn(e.slice(2)),t]}let ci=0;const Mg=Promise.resolve(),Rg=()=>ci||(Mg.then(()=>ci=0),ci=Date.now());function Ng(e,t){const n=r=>{if(!r._vts)r._vts=Date.now();else if(r._vts<=n.attached)return;kt(kg(r,n.value),t,5,[r])};return n.value=e,n.attached=Rg(),n}function kg(e,t){if(oe(t)){const n=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{n.call(e),e._stopped=!0},t.map(r=>o=>!o._stopped&&r&&r(o))}else return t}const Ql=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,Fg=(e,t,n,r,o,s)=>{const i=o==="svg";t==="class"?Sg(e,r,i):t==="style"?Cg(e,n,r):Rs(t)?fa(t)||Ig(e,t,n,r,s):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):Lg(e,t,r,i))?(Yl(e,t,r),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Jl(e,t,r,i,s,t!=="value")):e._isVueCE&&(/[A-Z]/.test(t)||!we(r))?Yl(e,xt(t),r,s,t):(t==="true-value"?e._trueValue=r:t==="false-value"&&(e._falseValue=r),Jl(e,t,r,i))};function Lg(e,t,n,r){if(r)return!!(t==="innerHTML"||t==="textContent"||t in e&&Ql(t)&&le(n));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="autocorrect"||t==="sandbox"&&e.tagName==="IFRAME"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const o=e.tagName;if(o==="IMG"||o==="VIDEO"||o==="CANVAS"||o==="SOURCE")return!1}return Ql(t)&&we(n)?!1:t in e}const Pp=new WeakMap,Cp=new WeakMap,bs=Symbol("_moveCb"),ec=Symbol("_enterCb"),Dg=e=>(delete e.props.mode,e),Bg=Dg({name:"TransitionGroup",props:Ke({},wp,{tag:String,moveClass:String}),setup(e,{slots:t}){const n=Xe(),r=$f();let o,s;return qf(()=>{if(!o.length)return;const i=e.moveClass||`${e.name||"v"}-move`;if(!Vg(o[0].el,n.vnode.el,i)){o=[];return}o.forEach($g),o.forEach(jg);const a=o.filter(Hg);$i(n.vnode.el),a.forEach(l=>{const c=l.el,u=c.style;Ht(c,i),u.transform=u.webkitTransform=u.transitionDuration="";const f=c[bs]=p=>{p&&p.target!==c||(!p||p.propertyName.endsWith("transform"))&&(c.removeEventListener("transitionend",f),c[bs]=null,wn(c,i))};c.addEventListener("transitionend",f)}),o=[]}),()=>{const i=Se(e),a=xp(i);let l=i.tag||ze;if(o=[],s)for(let c=0;c<s.length;c++){const u=s[c];u.el&&u.el instanceof Element&&(o.push(u),or(u,xo(u,a,r,n)),Pp.set(u,{left:u.el.offsetLeft,top:u.el.offsetTop}))}s=t.default?Ca(t.default()):[];for(let c=0;c<s.length;c++){const u=s[c];u.key!=null&&or(u,xo(u,a,r,n))}return re(l,null,s)}}}),tE=Bg;function $g(e){const t=e.el;t[bs]&&t[bs](),t[ec]&&t[ec]()}function jg(e){Cp.set(e,{left:e.el.offsetLeft,top:e.el.offsetTop})}function Hg(e){const t=Pp.get(e),n=Cp.get(e),r=t.left-n.left,o=t.top-n.top;if(r||o){const s=e.el.style;return s.transform=s.webkitTransform=`translate(${r}px,${o}px)`,s.transitionDuration="0s",e}}function Vg(e,t,n){const r=e.cloneNode(),o=e[Mr];o&&o.forEach(a=>{a.split(/\s+/).forEach(l=>l&&r.classList.remove(l))}),n.split(/\s+/).forEach(a=>a&&r.classList.add(a)),r.style.display="none";const s=t.nodeType===1?t:t.parentNode;s.appendChild(r);const{hasTransform:i}=Sp(r);return s.removeChild(r),i}const Rr=e=>{const t=e.props["onUpdate:modelValue"]||!1;return oe(t)?n=>ns(t,n):t};function Wg(e){e.target.composing=!0}function tc(e){const t=e.target;t.composing&&(t.composing=!1,t.dispatchEvent(new Event("input")))}const ln=Symbol("_assign");function nc(e,t,n){return t&&(e=e.trim()),n&&(e=ma(e)),e}const nE={created(e,{modifiers:{lazy:t,trim:n,number:r}},o){e[ln]=Rr(o);const s=r||o.props&&o.props.type==="number";In(e,t?"change":"input",i=>{i.target.composing||e[ln](nc(e.value,n,s))}),(n||s)&&In(e,"change",()=>{e.value=nc(e.value,n,s)}),t||(In(e,"compositionstart",Wg),In(e,"compositionend",tc),In(e,"change",tc))},mounted(e,{value:t}){e.value=t??""},beforeUpdate(e,{value:t,oldValue:n,modifiers:{lazy:r,trim:o,number:s}},i){if(e[ln]=Rr(i),e.composing)return;const a=(s||e.type==="number")&&!/^0\d/.test(e.value)?ma(e.value):e.value,l=t??"";a!==l&&(document.activeElement===e&&e.type!=="range"&&(r&&t===n||o&&e.value.trim()===l)||(e.value=l))}},rE={deep:!0,created(e,t,n){e[ln]=Rr(n),In(e,"change",()=>{const r=e._modelValue,o=Tp(e),s=e.checked,i=e[ln];if(oe(r)){const a=af(r,o),l=a!==-1;if(s&&!l)i(r.concat(o));else if(!s&&l){const c=[...r];c.splice(a,1),i(c)}}else if(Ns(r)){const a=new Set(r);s?a.add(o):a.delete(o),i(a)}else i(Ap(e,s))})},mounted:rc,beforeUpdate(e,t,n){e[ln]=Rr(n),rc(e,t,n)}};function rc(e,{value:t,oldValue:n},r){e._modelValue=t;let o;if(oe(t))o=af(t,r.props.value)>-1;else if(Ns(t))o=t.has(r.props.value);else{if(t===n)return;o=Ir(t,Ap(e,!0))}e.checked!==o&&(e.checked=o)}const oE={created(e,{value:t},n){e.checked=Ir(t,n.props.value),e[ln]=Rr(n),In(e,"change",()=>{e[ln](Tp(e))})},beforeUpdate(e,{value:t,oldValue:n},r){e[ln]=Rr(r),t!==n&&(e.checked=Ir(t,r.props.value))}};function Tp(e){return"_value"in e?e._value:e.value}function Ap(e,t){const n=t?"_trueValue":"_falseValue";return n in e?e[n]:t}const zg=["ctrl","shift","alt","meta"],Ug={stop:e=>e.stopPropagation(),prevent:e=>e.preventDefault(),self:e=>e.target!==e.currentTarget,ctrl:e=>!e.ctrlKey,shift:e=>!e.shiftKey,alt:e=>!e.altKey,meta:e=>!e.metaKey,left:e=>"button"in e&&e.button!==0,middle:e=>"button"in e&&e.button!==1,right:e=>"button"in e&&e.button!==2,exact:(e,t)=>zg.some(n=>e[`${n}Key`]&&!t.includes(n))},Gg=(e,t)=>{const n=e._withMods||(e._withMods={}),r=t.join(".");return n[r]||(n[r]=(o,...s)=>{for(let i=0;i<t.length;i++){const a=Ug[t[i]];if(a&&a(o,t))return}return e(o,...s)})},Kg={esc:"escape",space:" ",up:"arrow-up",left:"arrow-left",right:"arrow-right",down:"arrow-down",delete:"backspace"},sE=(e,t)=>{const n=e._withKeys||(e._withKeys={}),r=t.join(".");return n[r]||(n[r]=o=>{if(!("key"in o))return;const s=Dn(o.key);if(t.some(i=>i===s||Kg[i]===s))return e(o)})},qg=Ke({patchProp:Fg},yg);let oc;function Ip(){return oc||(oc=Wh(qg))}const sc=(...e)=>{Ip().render(...e)},Jg=(...e)=>{const t=Ip().createApp(...e),{mount:n}=t;return t.mount=r=>{const o=Xg(r);if(!o)return;const s=t._component;!le(s)&&!s.render&&!s.template&&(s.template=o.innerHTML),o.nodeType===1&&(o.textContent="");const i=n(o,!1,Yg(o));return o instanceof Element&&(o.removeAttribute("v-cloak"),o.setAttribute("data-v-app","")),i},t};function Yg(e){if(e instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&e instanceof MathMLElement)return"mathml"}function Xg(e){return we(e)?document.querySelector(e):e}/*!
 * pinia v2.3.1
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */let Op;const Us=e=>Op=e,Mp=Symbol();function ji(e){return e&&typeof e=="object"&&Object.prototype.toString.call(e)==="[object Object]"&&typeof e.toJSON!="function"}var fo;(function(e){e.direct="direct",e.patchObject="patch object",e.patchFunction="patch function"})(fo||(fo={}));function Zg(){const e=ff(!0),t=e.run(()=>B({}));let n=[],r=[];const o=Sa({install(s){Us(o),o._a=s,s.provide(Mp,o),s.config.globalProperties.$pinia=o,r.forEach(i=>n.push(i)),r=[]},use(s){return this._a?n.push(s):r.push(s),this},_p:n,_a:null,_e:e,_s:new Map,state:t});return o}const Rp=()=>{};function ic(e,t,n,r=Rp){e.push(t);const o=()=>{const s=e.indexOf(t);s>-1&&(e.splice(s,1),r())};return!n&&ha()&&pf(o),o}function mr(e,...t){e.slice().forEach(n=>{n(...t)})}const Qg=e=>e(),ac=Symbol(),ui=Symbol();function Hi(e,t){e instanceof Map&&t instanceof Map?t.forEach((n,r)=>e.set(r,n)):e instanceof Set&&t instanceof Set&&t.forEach(e.add,e);for(const n in t){if(!t.hasOwnProperty(n))continue;const r=t[n],o=e[n];ji(o)&&ji(r)&&e.hasOwnProperty(n)&&!$e(r)&&!kn(r)?e[n]=Hi(o,r):e[n]=r}return e}const e0=Symbol();function t0(e){return!ji(e)||!e.hasOwnProperty(e0)}const{assign:xn}=Object;function n0(e){return!!($e(e)&&e.effect)}function r0(e,t,n,r){const{state:o,actions:s,getters:i}=t,a=n.state.value[e];let l;function c(){a||(n.state.value[e]=o?o():{});const u=nh(n.state.value[e]);return xn(u,s,Object.keys(i||{}).reduce((f,p)=>(f[p]=Sa(k(()=>{Us(n);const d=n._s.get(e);return i[p].call(d,d)})),f),{}))}return l=Np(e,c,t,n,r,!0),l}function Np(e,t,n={},r,o,s){let i;const a=xn({actions:{}},n),l={deep:!0};let c,u,f=[],p=[],d;const m=r.state.value[e];!s&&!m&&(r.state.value[e]={}),B({});let h;function S(A){let v;c=u=!1,typeof A=="function"?(A(r.state.value[e]),v={type:fo.patchFunction,storeId:e,events:d}):(Hi(r.state.value[e],A),v={type:fo.patchObject,payload:A,storeId:e,events:d});const R=h=Symbol();Kt().then(()=>{h===R&&(c=!0)}),u=!0,mr(f,v,r.state.value[e])}const b=s?function(){const{state:v}=n,R=v?v():{};this.$patch(U=>{xn(U,R)})}:Rp;function C(){i.stop(),f=[],p=[],r._s.delete(e)}const y=(A,v="")=>{if(ac in A)return A[ui]=v,A;const R=function(){Us(r);const U=Array.from(arguments),I=[],M=[];function W(O){I.push(O)}function X(O){M.push(O)}mr(p,{args:U,name:R[ui],store:N,after:W,onError:X});let G;try{G=A.apply(this&&this.$id===e?this:N,U)}catch(O){throw mr(M,O),O}return G instanceof Promise?G.then(O=>(mr(I,O),O)).catch(O=>(mr(M,O),Promise.reject(O))):(mr(I,G),G)};return R[ac]=!0,R[ui]=v,R},E={_p:r,$id:e,$onAction:ic.bind(null,p),$patch:S,$reset:b,$subscribe(A,v={}){const R=ic(f,A,v.detached,()=>U()),U=i.run(()=>ye(()=>r.state.value[e],I=>{(v.flush==="sync"?u:c)&&A({storeId:e,type:fo.direct,events:d},I)},xn({},l,v)));return R},$dispose:C},N=Bn(E);r._s.set(e,N);const D=(r._a&&r._a.runWithContext||Qg)(()=>r._e.run(()=>(i=ff()).run(()=>t({action:y}))));for(const A in D){const v=D[A];if($e(v)&&!n0(v)||kn(v))s||(m&&t0(v)&&($e(v)?v.value=m[A]:Hi(v,m[A])),r.state.value[e][A]=v);else if(typeof v=="function"){const R=y(v,A);D[A]=R,a.actions[A]=v}}return xn(N,D),xn(Se(N),D),Object.defineProperty(N,"$state",{get:()=>r.state.value[e],set:A=>{S(v=>{xn(v,A)})}}),r._p.forEach(A=>{xn(N,i.run(()=>A({store:N,app:r._a,pinia:r,options:a})))}),m&&s&&n.hydrate&&n.hydrate(N.$state,m),c=!0,u=!0,N}/*! #__NO_SIDE_EFFECTS__ */function zr(e,t,n){let r,o;const s=typeof t=="function";typeof e=="string"?(r=e,o=s?n:t):(o=e,r=e.id);function i(a,l){const c=Lh();return a=a||(c?Ae(Mp,null):null),a&&Us(a),a=Op,a._s.has(r)||(s?Np(r,t,o,a):r0(r,o,a)),a._s.get(r)}return i.$id=r,i}const o0="modulepreload",s0=function(e,t){return new URL(e,t).href},lc={},mt=function(t,n,r){let o=Promise.resolve();if(n&&n.length>0){const i=document.getElementsByTagName("link"),a=document.querySelector("meta[property=csp-nonce]"),l=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));o=Promise.allSettled(n.map(c=>{if(c=s0(c,r),c in lc)return;lc[c]=!0;const u=c.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(!!r)for(let m=i.length-1;m>=0;m--){const h=i[m];if(h.href===c&&(!u||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${f}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":o0,u||(d.as="script"),d.crossOrigin="",d.href=c,l&&d.setAttribute("nonce",l),document.head.appendChild(d),u)return new Promise((m,h)=>{d.addEventListener("load",m),d.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(i){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=i,window.dispatchEvent(a),!a.defaultPrevented)throw i}return o.then(i=>{for(const a of i||[])a.status==="rejected"&&s(a.reason);return t().catch(s)})};/*!
 * vue-router v4.6.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */const vr=typeof document<"u";function kp(e){return typeof e=="object"||"displayName"in e||"props"in e||"__vccOpts"in e}function i0(e){return e.__esModule||e[Symbol.toStringTag]==="Module"||e.default&&kp(e.default)}const Ie=Object.assign;function fi(e,t){const n={};for(const r in t){const o=t[r];n[r]=Ft(o)?o.map(e):e(o)}return n}const po=()=>{},Ft=Array.isArray;function cc(e,t){const n={};for(const r in e)n[r]=r in t?t[r]:e[r];return n}const Fp=/#/g,a0=/&/g,l0=/\//g,c0=/=/g,u0=/\?/g,Lp=/\+/g,f0=/%5B/g,p0=/%5D/g,Dp=/%5E/g,d0=/%60/g,Bp=/%7B/g,m0=/%7C/g,$p=/%7D/g,h0=/%20/g;function La(e){return e==null?"":encodeURI(""+e).replace(m0,"|").replace(f0,"[").replace(p0,"]")}function g0(e){return La(e).replace(Bp,"{").replace($p,"}").replace(Dp,"^")}function Vi(e){return La(e).replace(Lp,"%2B").replace(h0,"+").replace(Fp,"%23").replace(a0,"%26").replace(d0,"`").replace(Bp,"{").replace($p,"}").replace(Dp,"^")}function _0(e){return Vi(e).replace(c0,"%3D")}function v0(e){return La(e).replace(Fp,"%23").replace(u0,"%3F")}function y0(e){return v0(e).replace(l0,"%2F")}function Po(e){if(e==null)return null;try{return decodeURIComponent(""+e)}catch{}return""+e}const b0=/\/$/,w0=e=>e.replace(b0,"");function pi(e,t,n="/"){let r,o={},s="",i="";const a=t.indexOf("#");let l=t.indexOf("?");return l=a>=0&&l>a?-1:l,l>=0&&(r=t.slice(0,l),s=t.slice(l,a>0?a:t.length),o=e(s.slice(1))),a>=0&&(r=r||t.slice(0,a),i=t.slice(a,t.length)),r=P0(r??t,n),{fullPath:r+s+i,path:r,query:o,hash:Po(i)}}function x0(e,t){const n=t.query?e(t.query):"";return t.path+(n&&"?")+n+(t.hash||"")}function uc(e,t){return!t||!e.toLowerCase().startsWith(t.toLowerCase())?e:e.slice(t.length)||"/"}function S0(e,t,n){const r=t.matched.length-1,o=n.matched.length-1;return r>-1&&r===o&&Nr(t.matched[r],n.matched[o])&&jp(t.params,n.params)&&e(t.query)===e(n.query)&&t.hash===n.hash}function Nr(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function jp(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const n in e)if(!E0(e[n],t[n]))return!1;return!0}function E0(e,t){return Ft(e)?fc(e,t):Ft(t)?fc(t,e):e===t}function fc(e,t){return Ft(t)?e.length===t.length&&e.every((n,r)=>n===t[r]):e.length===1&&e[0]===t}function P0(e,t){if(e.startsWith("/"))return e;if(!e)return t;const n=t.split("/"),r=e.split("/"),o=r[r.length-1];(o===".."||o===".")&&r.push("");let s=n.length-1,i,a;for(i=0;i<r.length;i++)if(a=r[i],a!==".")if(a==="..")s>1&&s--;else break;return n.slice(0,s).join("/")+"/"+r.slice(i).join("/")}const bn={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0};let Wi=function(e){return e.pop="pop",e.push="push",e}({}),di=function(e){return e.back="back",e.forward="forward",e.unknown="",e}({});function C0(e){if(!e)if(vr){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return e[0]!=="/"&&e[0]!=="#"&&(e="/"+e),w0(e)}const T0=/^[^#]+#/;function A0(e,t){return e.replace(T0,"#")+t}function I0(e,t){const n=document.documentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return{behavior:t.behavior,left:r.left-n.left-(t.left||0),top:r.top-n.top-(t.top||0)}}const Gs=()=>({left:window.scrollX,top:window.scrollY});function O0(e){let t;if("el"in e){const n=e.el,r=typeof n=="string"&&n.startsWith("#"),o=typeof n=="string"?r?document.getElementById(n.slice(1)):document.querySelector(n):n;if(!o)return;t=I0(o,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(t.left!=null?t.left:window.scrollX,t.top!=null?t.top:window.scrollY)}function pc(e,t){return(history.state?history.state.position-t:-1)+e}const zi=new Map;function M0(e,t){zi.set(e,t)}function R0(e){const t=zi.get(e);return zi.delete(e),t}function N0(e){return typeof e=="string"||e&&typeof e=="object"}function Hp(e){return typeof e=="string"||typeof e=="symbol"}let je=function(e){return e[e.MATCHER_NOT_FOUND=1]="MATCHER_NOT_FOUND",e[e.NAVIGATION_GUARD_REDIRECT=2]="NAVIGATION_GUARD_REDIRECT",e[e.NAVIGATION_ABORTED=4]="NAVIGATION_ABORTED",e[e.NAVIGATION_CANCELLED=8]="NAVIGATION_CANCELLED",e[e.NAVIGATION_DUPLICATED=16]="NAVIGATION_DUPLICATED",e}({});const Vp=Symbol("");je.MATCHER_NOT_FOUND+"",je.NAVIGATION_GUARD_REDIRECT+"",je.NAVIGATION_ABORTED+"",je.NAVIGATION_CANCELLED+"",je.NAVIGATION_DUPLICATED+"";function kr(e,t){return Ie(new Error,{type:e,[Vp]:!0},t)}function Qt(e,t){return e instanceof Error&&Vp in e&&(t==null||!!(e.type&t))}const k0=["params","query","hash"];function F0(e){if(typeof e=="string")return e;if(e.path!=null)return e.path;const t={};for(const n of k0)n in e&&(t[n]=e[n]);return JSON.stringify(t,null,2)}function L0(e){const t={};if(e===""||e==="?")return t;const n=(e[0]==="?"?e.slice(1):e).split("&");for(let r=0;r<n.length;++r){const o=n[r].replace(Lp," "),s=o.indexOf("="),i=Po(s<0?o:o.slice(0,s)),a=s<0?null:Po(o.slice(s+1));if(i in t){let l=t[i];Ft(l)||(l=t[i]=[l]),l.push(a)}else t[i]=a}return t}function dc(e){let t="";for(let n in e){const r=e[n];if(n=_0(n),r==null){r!==void 0&&(t+=(t.length?"&":"")+n);continue}(Ft(r)?r.map(o=>o&&Vi(o)):[r&&Vi(r)]).forEach(o=>{o!==void 0&&(t+=(t.length?"&":"")+n,o!=null&&(t+="="+o))})}return t}function D0(e){const t={};for(const n in e){const r=e[n];r!==void 0&&(t[n]=Ft(r)?r.map(o=>o==null?null:""+o):r==null?r:""+r)}return t}const B0=Symbol(""),mc=Symbol(""),Da=Symbol(""),Ba=Symbol(""),Ui=Symbol("");function Zr(){let e=[];function t(r){return e.push(r),()=>{const o=e.indexOf(r);o>-1&&e.splice(o,1)}}function n(){e=[]}return{add:t,list:()=>e.slice(),reset:n}}function Tn(e,t,n,r,o,s=i=>i()){const i=r&&(r.enterCallbacks[o]=r.enterCallbacks[o]||[]);return()=>new Promise((a,l)=>{const c=p=>{p===!1?l(kr(je.NAVIGATION_ABORTED,{from:n,to:t})):p instanceof Error?l(p):N0(p)?l(kr(je.NAVIGATION_GUARD_REDIRECT,{from:t,to:p})):(i&&r.enterCallbacks[o]===i&&typeof p=="function"&&i.push(p),a())},u=s(()=>e.call(r&&r.instances[o],t,n,c));let f=Promise.resolve(u);e.length<3&&(f=f.then(c)),f.catch(p=>l(p))})}function mi(e,t,n,r,o=s=>s()){const s=[];for(const i of e)for(const a in i.components){let l=i.components[a];if(!(t!=="beforeRouteEnter"&&!i.instances[a]))if(kp(l)){const c=(l.__vccOpts||l)[t];c&&s.push(Tn(c,n,r,i,a,o))}else{let c=l();s.push(()=>c.then(u=>{if(!u)throw new Error(`Couldn't resolve component "${a}" at "${i.path}"`);const f=i0(u)?u.default:u;i.mods[a]=u,i.components[a]=f;const p=(f.__vccOpts||f)[t];return p&&Tn(p,n,r,i,a,o)()}))}}return s}function $0(e,t){const n=[],r=[],o=[],s=Math.max(t.matched.length,e.matched.length);for(let i=0;i<s;i++){const a=t.matched[i];a&&(e.matched.find(c=>Nr(c,a))?r.push(a):n.push(a));const l=e.matched[i];l&&(t.matched.find(c=>Nr(c,l))||o.push(l))}return[n,r,o]}/*!
 * vue-router v4.6.3
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */let j0=()=>location.protocol+"//"+location.host;function Wp(e,t){const{pathname:n,search:r,hash:o}=t,s=e.indexOf("#");if(s>-1){let i=o.includes(e.slice(s))?e.slice(s).length:1,a=o.slice(i);return a[0]!=="/"&&(a="/"+a),uc(a,"")}return uc(n,e)+r+o}function H0(e,t,n,r){let o=[],s=[],i=null;const a=({state:p})=>{const d=Wp(e,location),m=n.value,h=t.value;let S=0;if(p){if(n.value=d,t.value=p,i&&i===m){i=null;return}S=h?p.position-h.position:0}else r(d);o.forEach(b=>{b(n.value,m,{delta:S,type:Wi.pop,direction:S?S>0?di.forward:di.back:di.unknown})})};function l(){i=n.value}function c(p){o.push(p);const d=()=>{const m=o.indexOf(p);m>-1&&o.splice(m,1)};return s.push(d),d}function u(){if(document.visibilityState==="hidden"){const{history:p}=window;if(!p.state)return;p.replaceState(Ie({},p.state,{scroll:Gs()}),"")}}function f(){for(const p of s)p();s=[],window.removeEventListener("popstate",a),window.removeEventListener("pagehide",u),document.removeEventListener("visibilitychange",u)}return window.addEventListener("popstate",a),window.addEventListener("pagehide",u),document.addEventListener("visibilitychange",u),{pauseListeners:l,listen:c,destroy:f}}function hc(e,t,n,r=!1,o=!1){return{back:e,current:t,forward:n,replaced:r,position:window.history.length,scroll:o?Gs():null}}function V0(e){const{history:t,location:n}=window,r={value:Wp(e,n)},o={value:t.state};o.value||s(r.value,{back:null,current:r.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0);function s(l,c,u){const f=e.indexOf("#"),p=f>-1?(n.host&&document.querySelector("base")?e:e.slice(f))+l:j0()+e+l;try{t[u?"replaceState":"pushState"](c,"",p),o.value=c}catch(d){console.error(d),n[u?"replace":"assign"](p)}}function i(l,c){s(l,Ie({},t.state,hc(o.value.back,l,o.value.forward,!0),c,{position:o.value.position}),!0),r.value=l}function a(l,c){const u=Ie({},o.value,t.state,{forward:l,scroll:Gs()});s(u.current,u,!0),s(l,Ie({},hc(r.value,l,null),{position:u.position+1},c),!1),r.value=l}return{location:r,state:o,push:a,replace:i}}function W0(e){e=C0(e);const t=V0(e),n=H0(e,t.state,t.location,t.replace);function r(s,i=!0){i||n.pauseListeners(),history.go(s)}const o=Ie({location:"",base:e,go:r,createHref:A0.bind(null,e)},t,n);return Object.defineProperty(o,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(o,"state",{enumerable:!0,get:()=>t.state.value}),o}function z0(e){return e=location.host?e||location.pathname+location.search:"",e.includes("#")||(e+="#"),W0(e)}let Jn=function(e){return e[e.Static=0]="Static",e[e.Param=1]="Param",e[e.Group=2]="Group",e}({});var Ge=function(e){return e[e.Static=0]="Static",e[e.Param=1]="Param",e[e.ParamRegExp=2]="ParamRegExp",e[e.ParamRegExpEnd=3]="ParamRegExpEnd",e[e.EscapeNext=4]="EscapeNext",e}(Ge||{});const U0={type:Jn.Static,value:""},G0=/[a-zA-Z0-9_]/;function K0(e){if(!e)return[[]];if(e==="/")return[[U0]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(d){throw new Error(`ERR (${n})/"${c}": ${d}`)}let n=Ge.Static,r=n;const o=[];let s;function i(){s&&o.push(s),s=[]}let a=0,l,c="",u="";function f(){c&&(n===Ge.Static?s.push({type:Jn.Static,value:c}):n===Ge.Param||n===Ge.ParamRegExp||n===Ge.ParamRegExpEnd?(s.length>1&&(l==="*"||l==="+")&&t(`A repeatable param (${c}) must be alone in its segment. eg: '/:ids+.`),s.push({type:Jn.Param,value:c,regexp:u,repeatable:l==="*"||l==="+",optional:l==="*"||l==="?"})):t("Invalid state to consume buffer"),c="")}function p(){c+=l}for(;a<e.length;){if(l=e[a++],l==="\\"&&n!==Ge.ParamRegExp){r=n,n=Ge.EscapeNext;continue}switch(n){case Ge.Static:l==="/"?(c&&f(),i()):l===":"?(f(),n=Ge.Param):p();break;case Ge.EscapeNext:p(),n=r;break;case Ge.Param:l==="("?n=Ge.ParamRegExp:G0.test(l)?p():(f(),n=Ge.Static,l!=="*"&&l!=="?"&&l!=="+"&&a--);break;case Ge.ParamRegExp:l===")"?u[u.length-1]=="\\"?u=u.slice(0,-1)+l:n=Ge.ParamRegExpEnd:u+=l;break;case Ge.ParamRegExpEnd:f(),n=Ge.Static,l!=="*"&&l!=="?"&&l!=="+"&&a--,u="";break;default:t("Unknown state");break}}return n===Ge.ParamRegExp&&t(`Unfinished custom RegExp for param "${c}"`),f(),i(),o}const gc="[^/]+?",q0={sensitive:!1,strict:!1,start:!0,end:!0};var lt=function(e){return e[e._multiplier=10]="_multiplier",e[e.Root=90]="Root",e[e.Segment=40]="Segment",e[e.SubSegment=30]="SubSegment",e[e.Static=40]="Static",e[e.Dynamic=20]="Dynamic",e[e.BonusCustomRegExp=10]="BonusCustomRegExp",e[e.BonusWildcard=-50]="BonusWildcard",e[e.BonusRepeatable=-20]="BonusRepeatable",e[e.BonusOptional=-8]="BonusOptional",e[e.BonusStrict=.7000000000000001]="BonusStrict",e[e.BonusCaseSensitive=.25]="BonusCaseSensitive",e}(lt||{});const J0=/[.+*?^${}()[\]/\\]/g;function Y0(e,t){const n=Ie({},q0,t),r=[];let o=n.start?"^":"";const s=[];for(const c of e){const u=c.length?[]:[lt.Root];n.strict&&!c.length&&(o+="/");for(let f=0;f<c.length;f++){const p=c[f];let d=lt.Segment+(n.sensitive?lt.BonusCaseSensitive:0);if(p.type===Jn.Static)f||(o+="/"),o+=p.value.replace(J0,"\\$&"),d+=lt.Static;else if(p.type===Jn.Param){const{value:m,repeatable:h,optional:S,regexp:b}=p;s.push({name:m,repeatable:h,optional:S});const C=b||gc;if(C!==gc){d+=lt.BonusCustomRegExp;try{`${C}`}catch(E){throw new Error(`Invalid custom RegExp for param "${m}" (${C}): `+E.message)}}let y=h?`((?:${C})(?:/(?:${C}))*)`:`(${C})`;f||(y=S&&c.length<2?`(?:/${y})`:"/"+y),S&&(y+="?"),o+=y,d+=lt.Dynamic,S&&(d+=lt.BonusOptional),h&&(d+=lt.BonusRepeatable),C===".*"&&(d+=lt.BonusWildcard)}u.push(d)}r.push(u)}if(n.strict&&n.end){const c=r.length-1;r[c][r[c].length-1]+=lt.BonusStrict}n.strict||(o+="/?"),n.end?o+="$":n.strict&&!o.endsWith("/")&&(o+="(?:/|$)");const i=new RegExp(o,n.sensitive?"":"i");function a(c){const u=c.match(i),f={};if(!u)return null;for(let p=1;p<u.length;p++){const d=u[p]||"",m=s[p-1];f[m.name]=d&&m.repeatable?d.split("/"):d}return f}function l(c){let u="",f=!1;for(const p of e){(!f||!u.endsWith("/"))&&(u+="/"),f=!1;for(const d of p)if(d.type===Jn.Static)u+=d.value;else if(d.type===Jn.Param){const{value:m,repeatable:h,optional:S}=d,b=m in c?c[m]:"";if(Ft(b)&&!h)throw new Error(`Provided param "${m}" is an array but it is not repeatable (* or + modifiers)`);const C=Ft(b)?b.join("/"):b;if(!C)if(S)p.length<2&&(u.endsWith("/")?u=u.slice(0,-1):f=!0);else throw new Error(`Missing required param "${m}"`);u+=C}}return u||"/"}return{re:i,score:r,keys:s,parse:a,stringify:l}}function X0(e,t){let n=0;for(;n<e.length&&n<t.length;){const r=t[n]-e[n];if(r)return r;n++}return e.length<t.length?e.length===1&&e[0]===lt.Static+lt.Segment?-1:1:e.length>t.length?t.length===1&&t[0]===lt.Static+lt.Segment?1:-1:0}function zp(e,t){let n=0;const r=e.score,o=t.score;for(;n<r.length&&n<o.length;){const s=X0(r[n],o[n]);if(s)return s;n++}if(Math.abs(o.length-r.length)===1){if(_c(r))return 1;if(_c(o))return-1}return o.length-r.length}function _c(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const Z0={strict:!1,end:!0,sensitive:!1};function Q0(e,t,n){const r=Y0(K0(e.path),n),o=Ie(r,{record:e,parent:t,children:[],alias:[]});return t&&!o.record.aliasOf==!t.record.aliasOf&&t.children.push(o),o}function e_(e,t){const n=[],r=new Map;t=cc(Z0,t);function o(f){return r.get(f)}function s(f,p,d){const m=!d,h=yc(f);h.aliasOf=d&&d.record;const S=cc(t,f),b=[h];if("alias"in f){const E=typeof f.alias=="string"?[f.alias]:f.alias;for(const N of E)b.push(yc(Ie({},h,{components:d?d.record.components:h.components,path:N,aliasOf:d?d.record:h})))}let C,y;for(const E of b){const{path:N}=E;if(p&&N[0]!=="/"){const z=p.record.path,D=z[z.length-1]==="/"?"":"/";E.path=p.record.path+(N&&D+N)}if(C=Q0(E,p,S),d?d.alias.push(C):(y=y||C,y!==C&&y.alias.push(C),m&&f.name&&!bc(C)&&i(f.name)),Up(C)&&l(C),h.children){const z=h.children;for(let D=0;D<z.length;D++)s(z[D],C,d&&d.children[D])}d=d||C}return y?()=>{i(y)}:po}function i(f){if(Hp(f)){const p=r.get(f);p&&(r.delete(f),n.splice(n.indexOf(p),1),p.children.forEach(i),p.alias.forEach(i))}else{const p=n.indexOf(f);p>-1&&(n.splice(p,1),f.record.name&&r.delete(f.record.name),f.children.forEach(i),f.alias.forEach(i))}}function a(){return n}function l(f){const p=r_(f,n);n.splice(p,0,f),f.record.name&&!bc(f)&&r.set(f.record.name,f)}function c(f,p){let d,m={},h,S;if("name"in f&&f.name){if(d=r.get(f.name),!d)throw kr(je.MATCHER_NOT_FOUND,{location:f});S=d.record.name,m=Ie(vc(p.params,d.keys.filter(y=>!y.optional).concat(d.parent?d.parent.keys.filter(y=>y.optional):[]).map(y=>y.name)),f.params&&vc(f.params,d.keys.map(y=>y.name))),h=d.stringify(m)}else if(f.path!=null)h=f.path,d=n.find(y=>y.re.test(h)),d&&(m=d.parse(h),S=d.record.name);else{if(d=p.name?r.get(p.name):n.find(y=>y.re.test(p.path)),!d)throw kr(je.MATCHER_NOT_FOUND,{location:f,currentLocation:p});S=d.record.name,m=Ie({},p.params,f.params),h=d.stringify(m)}const b=[];let C=d;for(;C;)b.unshift(C.record),C=C.parent;return{name:S,path:h,params:m,matched:b,meta:n_(b)}}e.forEach(f=>s(f));function u(){n.length=0,r.clear()}return{addRoute:s,resolve:c,removeRoute:i,clearRoutes:u,getRoutes:a,getRecordMatcher:o}}function vc(e,t){const n={};for(const r of t)r in e&&(n[r]=e[r]);return n}function yc(e){const t={path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:e.aliasOf,beforeEnter:e.beforeEnter,props:t_(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}};return Object.defineProperty(t,"mods",{value:{}}),t}function t_(e){const t={},n=e.props||!1;if("component"in e)t.default=n;else for(const r in e.components)t[r]=typeof n=="object"?n[r]:n;return t}function bc(e){for(;e;){if(e.record.aliasOf)return!0;e=e.parent}return!1}function n_(e){return e.reduce((t,n)=>Ie(t,n.meta),{})}function r_(e,t){let n=0,r=t.length;for(;n!==r;){const s=n+r>>1;zp(e,t[s])<0?r=s:n=s+1}const o=o_(e);return o&&(r=t.lastIndexOf(o,r-1)),r}function o_(e){let t=e;for(;t=t.parent;)if(Up(t)&&zp(e,t)===0)return t}function Up({record:e}){return!!(e.name||e.components&&Object.keys(e.components).length||e.redirect)}function wc(e){const t=Ae(Da),n=Ae(Ba),r=k(()=>{const l=x(e.to);return t.resolve(l)}),o=k(()=>{const{matched:l}=r.value,{length:c}=l,u=l[c-1],f=n.matched;if(!u||!f.length)return-1;const p=f.findIndex(Nr.bind(null,u));if(p>-1)return p;const d=xc(l[c-2]);return c>1&&xc(u)===d&&f[f.length-1].path!==d?f.findIndex(Nr.bind(null,l[c-2])):p}),s=k(()=>o.value>-1&&c_(n.params,r.value.params)),i=k(()=>o.value>-1&&o.value===n.matched.length-1&&jp(n.params,r.value.params));function a(l={}){if(l_(l)){const c=t[x(e.replace)?"replace":"push"](x(e.to)).catch(po);return e.viewTransition&&typeof document<"u"&&"startViewTransition"in document&&document.startViewTransition(()=>c),c}return Promise.resolve()}return{route:r,href:k(()=>r.value.href),isActive:s,isExactActive:i,navigate:a}}function s_(e){return e.length===1?e[0]:e}const i_=q({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"},viewTransition:Boolean},useLink:wc,setup(e,{slots:t}){const n=Bn(wc(e)),{options:r}=Ae(Da),o=k(()=>({[Sc(e.activeClass,r.linkActiveClass,"router-link-active")]:n.isActive,[Sc(e.exactActiveClass,r.linkExactActiveClass,"router-link-exact-active")]:n.isExactActive}));return()=>{const s=t.default&&s_(t.default(n));return e.custom?s:We("a",{"aria-current":n.isExactActive?e.ariaCurrentValue:null,href:n.href,onClick:n.navigate,class:o.value},s)}}}),a_=i_;function l_(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&!(e.button!==void 0&&e.button!==0)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function c_(e,t){for(const n in t){const r=t[n],o=e[n];if(typeof r=="string"){if(r!==o)return!1}else if(!Ft(o)||o.length!==r.length||r.some((s,i)=>s!==o[i]))return!1}return!0}function xc(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const Sc=(e,t,n)=>e??t??n,u_=q({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:n}){const r=Ae(Ui),o=k(()=>e.route||r.value),s=Ae(mc,0),i=k(()=>{let c=x(s);const{matched:u}=o.value;let f;for(;(f=u[c])&&!f.components;)c++;return c}),a=k(()=>o.value.matched[i.value]);gt(mc,k(()=>i.value+1)),gt(B0,a),gt(Ui,o);const l=B();return ye(()=>[l.value,a.value,e.name],([c,u,f],[p,d,m])=>{u&&(u.instances[f]=c,d&&d!==u&&c&&c===p&&(u.leaveGuards.size||(u.leaveGuards=d.leaveGuards),u.updateGuards.size||(u.updateGuards=d.updateGuards))),c&&u&&(!d||!Nr(u,d)||!p)&&(u.enterCallbacks[f]||[]).forEach(h=>h(c))},{flush:"post"}),()=>{const c=o.value,u=e.name,f=a.value,p=f&&f.components[u];if(!p)return Ec(n.default,{Component:p,route:c});const d=f.props[u],m=d?d===!0?c.params:typeof d=="function"?d(c):d:null,S=We(p,Ie({},m,t,{onVnodeUnmounted:b=>{b.component.isUnmounted&&(f.instances[u]=null)},ref:l}));return Ec(n.default,{Component:S,route:c})||S}}});function Ec(e,t){if(!e)return null;const n=e(t);return n.length===1?n[0]:n}const f_=u_;function p_(e){const t=e_(e.routes,e),n=e.parseQuery||L0,r=e.stringifyQuery||dc,o=e.history,s=Zr(),i=Zr(),a=Zr(),l=Ea(bn);let c=bn;vr&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const u=fi.bind(null,P=>""+P),f=fi.bind(null,y0),p=fi.bind(null,Po);function d(P,j){let Z,se;return Hp(P)?(Z=t.getRecordMatcher(P),se=j):se=P,t.addRoute(se,Z)}function m(P){const j=t.getRecordMatcher(P);j&&t.removeRoute(j)}function h(){return t.getRoutes().map(P=>P.record)}function S(P){return!!t.getRecordMatcher(P)}function b(P,j){if(j=Ie({},j||l.value),typeof P=="string"){const T=pi(n,P,j.path),L=t.resolve({path:T.path},j),$=o.createHref(T.fullPath);return Ie(T,L,{params:p(L.params),hash:Po(T.hash),redirectedFrom:void 0,href:$})}let Z;if(P.path!=null)Z=Ie({},P,{path:pi(n,P.path,j.path).path});else{const T=Ie({},P.params);for(const L in T)T[L]==null&&delete T[L];Z=Ie({},P,{params:f(T)}),j.params=f(j.params)}const se=t.resolve(Z,j),he=P.hash||"";se.params=u(p(se.params));const g=x0(r,Ie({},P,{hash:g0(he),path:se.path})),_=o.createHref(g);return Ie({fullPath:g,hash:he,query:r===dc?D0(P.query):P.query||{}},se,{redirectedFrom:void 0,href:_})}function C(P){return typeof P=="string"?pi(n,P,l.value.path):Ie({},P)}function y(P,j){if(c!==P)return kr(je.NAVIGATION_CANCELLED,{from:j,to:P})}function E(P){return D(P)}function N(P){return E(Ie(C(P),{replace:!0}))}function z(P,j){const Z=P.matched[P.matched.length-1];if(Z&&Z.redirect){const{redirect:se}=Z;let he=typeof se=="function"?se(P,j):se;return typeof he=="string"&&(he=he.includes("?")||he.includes("#")?he=C(he):{path:he},he.params={}),Ie({query:P.query,hash:P.hash,params:he.path!=null?{}:P.params},he)}}function D(P,j){const Z=c=b(P),se=l.value,he=P.state,g=P.force,_=P.replace===!0,T=z(Z,se);if(T)return D(Ie(C(T),{state:typeof T=="object"?Ie({},he,T.state):he,force:g,replace:_}),j||Z);const L=Z;L.redirectedFrom=j;let $;return!g&&S0(r,se,Z)&&($=kr(je.NAVIGATION_DUPLICATED,{to:L,from:se}),me(se,se,!0,!1)),($?Promise.resolve($):R(L,se)).catch(F=>Qt(F)?Qt(F,je.NAVIGATION_GUARD_REDIRECT)?F:ce(F):w(F,L,se)).then(F=>{if(F){if(Qt(F,je.NAVIGATION_GUARD_REDIRECT))return D(Ie({replace:_},C(F.to),{state:typeof F.to=="object"?Ie({},he,F.to.state):he,force:g}),j||L)}else F=I(L,se,!0,_,he);return U(L,se,F),F})}function A(P,j){const Z=y(P,j);return Z?Promise.reject(Z):Promise.resolve()}function v(P){const j=_e.values().next().value;return j&&typeof j.runWithContext=="function"?j.runWithContext(P):P()}function R(P,j){let Z;const[se,he,g]=$0(P,j);Z=mi(se.reverse(),"beforeRouteLeave",P,j);for(const T of se)T.leaveGuards.forEach(L=>{Z.push(Tn(L,P,j))});const _=A.bind(null,P,j);return Z.push(_),ke(Z).then(()=>{Z=[];for(const T of s.list())Z.push(Tn(T,P,j));return Z.push(_),ke(Z)}).then(()=>{Z=mi(he,"beforeRouteUpdate",P,j);for(const T of he)T.updateGuards.forEach(L=>{Z.push(Tn(L,P,j))});return Z.push(_),ke(Z)}).then(()=>{Z=[];for(const T of g)if(T.beforeEnter)if(Ft(T.beforeEnter))for(const L of T.beforeEnter)Z.push(Tn(L,P,j));else Z.push(Tn(T.beforeEnter,P,j));return Z.push(_),ke(Z)}).then(()=>(P.matched.forEach(T=>T.enterCallbacks={}),Z=mi(g,"beforeRouteEnter",P,j,v),Z.push(_),ke(Z))).then(()=>{Z=[];for(const T of i.list())Z.push(Tn(T,P,j));return Z.push(_),ke(Z)}).catch(T=>Qt(T,je.NAVIGATION_CANCELLED)?T:Promise.reject(T))}function U(P,j,Z){a.list().forEach(se=>v(()=>se(P,j,Z)))}function I(P,j,Z,se,he){const g=y(P,j);if(g)return g;const _=j===bn,T=vr?history.state:{};Z&&(se||_?o.replace(P.fullPath,Ie({scroll:_&&T&&T.scroll},he)):o.push(P.fullPath,he)),l.value=P,me(P,j,Z,_),ce()}let M;function W(){M||(M=o.listen((P,j,Z)=>{if(!Te.listening)return;const se=b(P),he=z(se,Te.currentRoute.value);if(he){D(Ie(he,{replace:!0,force:!0}),se).catch(po);return}c=se;const g=l.value;vr&&M0(pc(g.fullPath,Z.delta),Gs()),R(se,g).catch(_=>Qt(_,je.NAVIGATION_ABORTED|je.NAVIGATION_CANCELLED)?_:Qt(_,je.NAVIGATION_GUARD_REDIRECT)?(D(Ie(C(_.to),{force:!0}),se).then(T=>{Qt(T,je.NAVIGATION_ABORTED|je.NAVIGATION_DUPLICATED)&&!Z.delta&&Z.type===Wi.pop&&o.go(-1,!1)}).catch(po),Promise.reject()):(Z.delta&&o.go(-Z.delta,!1),w(_,se,g))).then(_=>{_=_||I(se,g,!1),_&&(Z.delta&&!Qt(_,je.NAVIGATION_CANCELLED)?o.go(-Z.delta,!1):Z.type===Wi.pop&&Qt(_,je.NAVIGATION_ABORTED|je.NAVIGATION_DUPLICATED)&&o.go(-1,!1)),U(se,g,_)}).catch(po)}))}let X=Zr(),G=Zr(),O;function w(P,j,Z){ce(P);const se=G.list();return se.length?se.forEach(he=>he(P,j,Z)):console.error(P),Promise.reject(P)}function V(){return O&&l.value!==bn?Promise.resolve():new Promise((P,j)=>{X.add([P,j])})}function ce(P){return O||(O=!P,W(),X.list().forEach(([j,Z])=>P?Z(P):j()),X.reset()),P}function me(P,j,Z,se){const{scrollBehavior:he}=e;if(!vr||!he)return Promise.resolve();const g=!Z&&R0(pc(P.fullPath,0))||(se||!Z)&&history.state&&history.state.scroll||null;return Kt().then(()=>he(P,j,g)).then(_=>_&&O0(_)).catch(_=>w(_,P,j))}const ne=P=>o.go(P);let ge;const _e=new Set,Te={currentRoute:l,listening:!0,addRoute:d,removeRoute:m,clearRoutes:t.clearRoutes,hasRoute:S,getRoutes:h,resolve:b,options:e,push:E,replace:N,go:ne,back:()=>ne(-1),forward:()=>ne(1),beforeEach:s.add,beforeResolve:i.add,afterEach:a.add,onError:G.add,isReady:V,install(P){P.component("RouterLink",a_),P.component("RouterView",f_),P.config.globalProperties.$router=Te,Object.defineProperty(P.config.globalProperties,"$route",{enumerable:!0,get:()=>x(l)}),vr&&!ge&&l.value===bn&&(ge=!0,E(o.location).catch(se=>{}));const j={};for(const se in bn)Object.defineProperty(j,se,{get:()=>l.value[se],enumerable:!0});P.provide(Da,Te),P.provide(Ba,Bs(j)),P.provide(Ui,l);const Z=P.unmount;_e.add(P),P.unmount=function(){_e.delete(P),_e.size<1&&(c=bn,M&&M(),M=null,l.value=bn,ge=!1,O=!1),Z()}}};function ke(P){return P.reduce((j,Z)=>j.then(()=>v(Z)),Promise.resolve())}return Te}function Gp(e){return Ae(Ba)}const d_=[{path:"/",redirect:"/items"},{path:"/items",name:"Items",component:()=>mt(()=>import("./ItemsView-BFdpRrHJ.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22]),import.meta.url)},{path:"/bag",name:"Bag",component:()=>mt(()=>import("./BagView-j1qjKSz1.js"),__vite__mapDeps([23,7,8,24,4,2,3,5,25,26,27,18,6,9,17,19,28,29,30,31,32,33,34,35,36,37,38,39]),import.meta.url)},{path:"/map",name:"Map",component:()=>mt(()=>import("./MapView-COIT1ZlS.js"),__vite__mapDeps([40,2,3,4,5,31,32,17,18,19,6,7,8,9,1,10,11,12,13,14,20,21,15,16,41]),import.meta.url)},{path:"/combat",name:"Combat",component:()=>mt(()=>import("./CombatView-DQCP3TF-.js"),__vite__mapDeps([42,43,4,2,3,5,18,44,35,36,37,31,32,33,34,15,16,45,39]),import.meta.url)},{path:"/story",name:"Story",component:()=>mt(()=>import("./StoryView-d5T8PxJh.js"),__vite__mapDeps([46,4,2,3,5,6,7,8,9,31,32,29,30,36,37,15,16,10,11,12,13,47]),import.meta.url)},{path:"/shop",name:"Shop",component:()=>mt(()=>import("./ShopView-BWjVWAN2.js"),__vite__mapDeps([48,33,34,4,2,3,5,31,32,17,18,19,1,6,7,8,9,10,11,12,13,14,49]),import.meta.url)},{path:"/craft-planner",name:"CraftPlanner",component:()=>mt(()=>import("./CraftPlannerView-jcTJqLgN.js"),__vite__mapDeps([50,11,7,8,12,27,18,4,2,3,5,6,9,25,17,19,28,43,44,36,37,29,30,31,32,35,33,34,51]),import.meta.url)},{path:"/settings",name:"Settings",component:()=>mt(()=>import("./SettingsView-DnMxcq1a.js"),__vite__mapDeps([52,7,8,24,4,2,3,5,25,26,36,37,43,18,44,31,32,35,53,54,15,16,10,11,12,13,55,39]),import.meta.url)},{path:"/help",name:"Help",component:()=>mt(()=>import("./Help-BeI6Elk0.js"),__vite__mapDeps([56,57]),import.meta.url)},{path:"/overlay",name:"Overlay",component:()=>mt(()=>import("./OverlayView-DMJ23NCl.js"),__vite__mapDeps([58,53,2,3,54,59]),import.meta.url),meta:{noLayout:!0}},{path:"/debug-overlay",name:"DebugOverlay",component:()=>mt(()=>import("./DebugOverlay-rFIlobty.js"),__vite__mapDeps([60,61]),import.meta.url),meta:{noLayout:!0}},{path:"/story-overlay",name:"StoryOverlay",component:()=>mt(()=>import("./StoryOverlayView-CfhIl2lk.js"),__vite__mapDeps([62,63]),import.meta.url),meta:{noLayout:!0}},{path:"/bag-stash-overlay",name:"BagStashOverlay",component:()=>mt(()=>import("./BagStashOverlayView-BtEjR5xi.js"),__vite__mapDeps([64,65]),import.meta.url),meta:{noLayout:!0}},{path:"/coordinate-picker",name:"CoordinatePicker",component:()=>mt(()=>import("./CoordinatePickerView-BDBlhsZH.js"),__vite__mapDeps([66,67]),import.meta.url),meta:{noLayout:!0}}],m_=p_({history:z0(),routes:d_}),Kp=Symbol(),as="el",h_="is-",zn=(e,t,n,r,o)=>{let s=`${e}-${t}`;return n&&(s+=`-${n}`),r&&(s+=`__${r}`),o&&(s+=`--${o}`),s},qp=Symbol("namespaceContextKey"),$a=e=>{const t=e||(Xe()?Ae(qp,B(as)):B(as));return k(()=>x(t)||as)},Be=(e,t)=>{const n=$a(t);return{namespace:n,b:(h="")=>zn(n.value,e,h,"",""),e:h=>h?zn(n.value,e,"",h,""):"",m:h=>h?zn(n.value,e,"","",h):"",be:(h,S)=>h&&S?zn(n.value,e,h,S,""):"",em:(h,S)=>h&&S?zn(n.value,e,"",h,S):"",bm:(h,S)=>h&&S?zn(n.value,e,h,"",S):"",bem:(h,S,b)=>h&&S&&b?zn(n.value,e,h,S,b):"",is:(h,...S)=>{const b=S.length>=1?S[0]:!0;return h&&b?`${h_}${h}`:""},cssVar:h=>{const S={};for(const b in h)h[b]&&(S[`--${n.value}-${b}`]=h[b]);return S},cssVarName:h=>`--${n.value}-${h}`,cssVarBlock:h=>{const S={};for(const b in h)h[b]&&(S[`--${n.value}-${e}-${b}`]=h[b]);return S},cssVarBlockName:h=>`--${n.value}-${e}-${h}`}};var Jp=typeof global=="object"&&global&&global.Object===Object&&global,g_=typeof self=="object"&&self&&self.Object===Object&&self,hn=Jp||g_||Function("return this")(),qt=hn.Symbol,Yp=Object.prototype,__=Yp.hasOwnProperty,v_=Yp.toString,Qr=qt?qt.toStringTag:void 0;function y_(e){var t=__.call(e,Qr),n=e[Qr];try{e[Qr]=void 0;var r=!0}catch{}var o=v_.call(e);return r&&(t?e[Qr]=n:delete e[Qr]),o}var b_=Object.prototype,w_=b_.toString;function x_(e){return w_.call(e)}var S_="[object Null]",E_="[object Undefined]",Pc=qt?qt.toStringTag:void 0;function Ur(e){return e==null?e===void 0?E_:S_:Pc&&Pc in Object(e)?y_(e):x_(e)}function Fr(e){return e!=null&&typeof e=="object"}var P_="[object Symbol]";function ja(e){return typeof e=="symbol"||Fr(e)&&Ur(e)==P_}function C_(e,t){for(var n=-1,r=e==null?0:e.length,o=Array(r);++n<r;)o[n]=t(e[n],n,e);return o}var pn=Array.isArray,Cc=qt?qt.prototype:void 0,Tc=Cc?Cc.toString:void 0;function Xp(e){if(typeof e=="string")return e;if(pn(e))return C_(e,Xp)+"";if(ja(e))return Tc?Tc.call(e):"";var t=e+"";return t=="0"&&1/e==-1/0?"-0":t}function ws(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}function T_(e){return e}var A_="[object AsyncFunction]",I_="[object Function]",O_="[object GeneratorFunction]",M_="[object Proxy]";function Zp(e){if(!ws(e))return!1;var t=Ur(e);return t==I_||t==O_||t==A_||t==M_}var hi=hn["__core-js_shared__"],Ac=function(){var e=/[^.]+$/.exec(hi&&hi.keys&&hi.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();function R_(e){return!!Ac&&Ac in e}var N_=Function.prototype,k_=N_.toString;function cr(e){if(e!=null){try{return k_.call(e)}catch{}try{return e+""}catch{}}return""}var F_=/[\\^$.*+?()[\]{}|]/g,L_=/^\[object .+?Constructor\]$/,D_=Function.prototype,B_=Object.prototype,$_=D_.toString,j_=B_.hasOwnProperty,H_=RegExp("^"+$_.call(j_).replace(F_,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function V_(e){if(!ws(e)||R_(e))return!1;var t=Zp(e)?H_:L_;return t.test(cr(e))}function W_(e,t){return e==null?void 0:e[t]}function ur(e,t){var n=W_(e,t);return V_(n)?n:void 0}var Gi=ur(hn,"WeakMap");function z_(e,t,n){switch(n.length){case 0:return e.call(t);case 1:return e.call(t,n[0]);case 2:return e.call(t,n[0],n[1]);case 3:return e.call(t,n[0],n[1],n[2])}return e.apply(t,n)}var U_=800,G_=16,K_=Date.now;function q_(e){var t=0,n=0;return function(){var r=K_(),o=G_-(r-n);if(n=r,o>0){if(++t>=U_)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}function J_(e){return function(){return e}}var xs=function(){try{var e=ur(Object,"defineProperty");return e({},"",{}),e}catch{}}(),Y_=xs?function(e,t){return xs(e,"toString",{configurable:!0,enumerable:!1,value:J_(t),writable:!0})}:T_,X_=q_(Y_),Z_=9007199254740991,Q_=/^(?:0|[1-9]\d*)$/;function Ha(e,t){var n=typeof e;return t=t??Z_,!!t&&(n=="number"||n!="symbol"&&Q_.test(e))&&e>-1&&e%1==0&&e<t}function ev(e,t,n){t=="__proto__"&&xs?xs(e,t,{configurable:!0,enumerable:!0,value:n,writable:!0}):e[t]=n}function Va(e,t){return e===t||e!==e&&t!==t}var tv=Object.prototype,nv=tv.hasOwnProperty;function rv(e,t,n){var r=e[t];(!(nv.call(e,t)&&Va(r,n))||n===void 0&&!(t in e))&&ev(e,t,n)}var Ic=Math.max;function ov(e,t,n){return t=Ic(t===void 0?e.length-1:t,0),function(){for(var r=arguments,o=-1,s=Ic(r.length-t,0),i=Array(s);++o<s;)i[o]=r[t+o];o=-1;for(var a=Array(t+1);++o<t;)a[o]=r[o];return a[t]=n(i),z_(e,this,a)}}var sv=9007199254740991;function Wa(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=sv}function iv(e){return e!=null&&Wa(e.length)&&!Zp(e)}var av=Object.prototype;function lv(e){var t=e&&e.constructor,n=typeof t=="function"&&t.prototype||av;return e===n}function cv(e,t){for(var n=-1,r=Array(e);++n<e;)r[n]=t(n);return r}var uv="[object Arguments]";function Oc(e){return Fr(e)&&Ur(e)==uv}var Qp=Object.prototype,fv=Qp.hasOwnProperty,pv=Qp.propertyIsEnumerable,za=Oc(function(){return arguments}())?Oc:function(e){return Fr(e)&&fv.call(e,"callee")&&!pv.call(e,"callee")};function dv(){return!1}var ed=typeof exports=="object"&&exports&&!exports.nodeType&&exports,Mc=ed&&typeof module=="object"&&module&&!module.nodeType&&module,mv=Mc&&Mc.exports===ed,Rc=mv?hn.Buffer:void 0,hv=Rc?Rc.isBuffer:void 0,Ki=hv||dv,gv="[object Arguments]",_v="[object Array]",vv="[object Boolean]",yv="[object Date]",bv="[object Error]",wv="[object Function]",xv="[object Map]",Sv="[object Number]",Ev="[object Object]",Pv="[object RegExp]",Cv="[object Set]",Tv="[object String]",Av="[object WeakMap]",Iv="[object ArrayBuffer]",Ov="[object DataView]",Mv="[object Float32Array]",Rv="[object Float64Array]",Nv="[object Int8Array]",kv="[object Int16Array]",Fv="[object Int32Array]",Lv="[object Uint8Array]",Dv="[object Uint8ClampedArray]",Bv="[object Uint16Array]",$v="[object Uint32Array]",Le={};Le[Mv]=Le[Rv]=Le[Nv]=Le[kv]=Le[Fv]=Le[Lv]=Le[Dv]=Le[Bv]=Le[$v]=!0;Le[gv]=Le[_v]=Le[Iv]=Le[vv]=Le[Ov]=Le[yv]=Le[bv]=Le[wv]=Le[xv]=Le[Sv]=Le[Ev]=Le[Pv]=Le[Cv]=Le[Tv]=Le[Av]=!1;function jv(e){return Fr(e)&&Wa(e.length)&&!!Le[Ur(e)]}function Hv(e){return function(t){return e(t)}}var td=typeof exports=="object"&&exports&&!exports.nodeType&&exports,mo=td&&typeof module=="object"&&module&&!module.nodeType&&module,Vv=mo&&mo.exports===td,gi=Vv&&Jp.process,Nc=function(){try{var e=mo&&mo.require&&mo.require("util").types;return e||gi&&gi.binding&&gi.binding("util")}catch{}}(),kc=Nc&&Nc.isTypedArray,nd=kc?Hv(kc):jv,Wv=Object.prototype,zv=Wv.hasOwnProperty;function Uv(e,t){var n=pn(e),r=!n&&za(e),o=!n&&!r&&Ki(e),s=!n&&!r&&!o&&nd(e),i=n||r||o||s,a=i?cv(e.length,String):[],l=a.length;for(var c in e)(t||zv.call(e,c))&&!(i&&(c=="length"||o&&(c=="offset"||c=="parent")||s&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||Ha(c,l)))&&a.push(c);return a}function Gv(e,t){return function(n){return e(t(n))}}var Kv=Gv(Object.keys,Object),qv=Object.prototype,Jv=qv.hasOwnProperty;function Yv(e){if(!lv(e))return Kv(e);var t=[];for(var n in Object(e))Jv.call(e,n)&&n!="constructor"&&t.push(n);return t}function Xv(e){return iv(e)?Uv(e):Yv(e)}var Zv=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,Qv=/^\w*$/;function ey(e,t){if(pn(e))return!1;var n=typeof e;return n=="number"||n=="symbol"||n=="boolean"||e==null||ja(e)?!0:Qv.test(e)||!Zv.test(e)||t!=null&&e in Object(t)}var Co=ur(Object,"create");function ty(){this.__data__=Co?Co(null):{},this.size=0}function ny(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}var ry="__lodash_hash_undefined__",oy=Object.prototype,sy=oy.hasOwnProperty;function iy(e){var t=this.__data__;if(Co){var n=t[e];return n===ry?void 0:n}return sy.call(t,e)?t[e]:void 0}var ay=Object.prototype,ly=ay.hasOwnProperty;function cy(e){var t=this.__data__;return Co?t[e]!==void 0:ly.call(t,e)}var uy="__lodash_hash_undefined__";function fy(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=Co&&t===void 0?uy:t,this}function sr(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}sr.prototype.clear=ty;sr.prototype.delete=ny;sr.prototype.get=iy;sr.prototype.has=cy;sr.prototype.set=fy;function py(){this.__data__=[],this.size=0}function Ks(e,t){for(var n=e.length;n--;)if(Va(e[n][0],t))return n;return-1}var dy=Array.prototype,my=dy.splice;function hy(e){var t=this.__data__,n=Ks(t,e);if(n<0)return!1;var r=t.length-1;return n==r?t.pop():my.call(t,n,1),--this.size,!0}function gy(e){var t=this.__data__,n=Ks(t,e);return n<0?void 0:t[n][1]}function _y(e){return Ks(this.__data__,e)>-1}function vy(e,t){var n=this.__data__,r=Ks(n,e);return r<0?(++this.size,n.push([e,t])):n[r][1]=t,this}function gn(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}gn.prototype.clear=py;gn.prototype.delete=hy;gn.prototype.get=gy;gn.prototype.has=_y;gn.prototype.set=vy;var To=ur(hn,"Map");function yy(){this.size=0,this.__data__={hash:new sr,map:new(To||gn),string:new sr}}function by(e){var t=typeof e;return t=="string"||t=="number"||t=="symbol"||t=="boolean"?e!=="__proto__":e===null}function qs(e,t){var n=e.__data__;return by(t)?n[typeof t=="string"?"string":"hash"]:n.map}function wy(e){var t=qs(this,e).delete(e);return this.size-=t?1:0,t}function xy(e){return qs(this,e).get(e)}function Sy(e){return qs(this,e).has(e)}function Ey(e,t){var n=qs(this,e),r=n.size;return n.set(e,t),this.size+=n.size==r?0:1,this}function _n(e){var t=-1,n=e==null?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}_n.prototype.clear=yy;_n.prototype.delete=wy;_n.prototype.get=xy;_n.prototype.has=Sy;_n.prototype.set=Ey;var Py="Expected a function";function Ua(e,t){if(typeof e!="function"||t!=null&&typeof t!="function")throw new TypeError(Py);var n=function(){var r=arguments,o=t?t.apply(this,r):r[0],s=n.cache;if(s.has(o))return s.get(o);var i=e.apply(this,r);return n.cache=s.set(o,i)||s,i};return n.cache=new(Ua.Cache||_n),n}Ua.Cache=_n;var Cy=500;function Ty(e){var t=Ua(e,function(r){return n.size===Cy&&n.clear(),r}),n=t.cache;return t}var Ay=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Iy=/\\(\\)?/g,Oy=Ty(function(e){var t=[];return e.charCodeAt(0)===46&&t.push(""),e.replace(Ay,function(n,r,o,s){t.push(o?s.replace(Iy,"$1"):r||n)}),t});function My(e){return e==null?"":Xp(e)}function Js(e,t){return pn(e)?e:ey(e,t)?[e]:Oy(My(e))}function Ga(e){if(typeof e=="string"||ja(e))return e;var t=e+"";return t=="0"&&1/e==-1/0?"-0":t}function rd(e,t){t=Js(t,e);for(var n=0,r=t.length;e!=null&&n<r;)e=e[Ga(t[n++])];return n&&n==r?e:void 0}function od(e,t,n){var r=e==null?void 0:rd(e,t);return r===void 0?n:r}function sd(e,t){for(var n=-1,r=t.length,o=e.length;++n<r;)e[o+n]=t[n];return e}var Fc=qt?qt.isConcatSpreadable:void 0;function Ry(e){return pn(e)||za(e)||!!(Fc&&e&&e[Fc])}function id(e,t,n,r,o){var s=-1,i=e.length;for(n||(n=Ry),o||(o=[]);++s<i;){var a=e[s];t>0&&n(a)?t>1?id(a,t-1,n,r,o):sd(o,a):o[o.length]=a}return o}function Ny(e){var t=e==null?0:e.length;return t?id(e,1):[]}function ky(e){return X_(ov(e,void 0,Ny),e+"")}function Fy(){this.__data__=new gn,this.size=0}function Ly(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n}function Dy(e){return this.__data__.get(e)}function By(e){return this.__data__.has(e)}var $y=200;function jy(e,t){var n=this.__data__;if(n instanceof gn){var r=n.__data__;if(!To||r.length<$y-1)return r.push([e,t]),this.size=++n.size,this;n=this.__data__=new _n(r)}return n.set(e,t),this.size=n.size,this}function Fn(e){var t=this.__data__=new gn(e);this.size=t.size}Fn.prototype.clear=Fy;Fn.prototype.delete=Ly;Fn.prototype.get=Dy;Fn.prototype.has=By;Fn.prototype.set=jy;function Hy(e,t){for(var n=-1,r=e==null?0:e.length,o=0,s=[];++n<r;){var i=e[n];t(i,n,e)&&(s[o++]=i)}return s}function Vy(){return[]}var Wy=Object.prototype,zy=Wy.propertyIsEnumerable,Lc=Object.getOwnPropertySymbols,Uy=Lc?function(e){return e==null?[]:(e=Object(e),Hy(Lc(e),function(t){return zy.call(e,t)}))}:Vy;function Gy(e,t,n){var r=t(e);return pn(e)?r:sd(r,n(e))}function Dc(e){return Gy(e,Xv,Uy)}var qi=ur(hn,"DataView"),Ji=ur(hn,"Promise"),Yi=ur(hn,"Set"),Bc="[object Map]",Ky="[object Object]",$c="[object Promise]",jc="[object Set]",Hc="[object WeakMap]",Vc="[object DataView]",qy=cr(qi),Jy=cr(To),Yy=cr(Ji),Xy=cr(Yi),Zy=cr(Gi),An=Ur;(qi&&An(new qi(new ArrayBuffer(1)))!=Vc||To&&An(new To)!=Bc||Ji&&An(Ji.resolve())!=$c||Yi&&An(new Yi)!=jc||Gi&&An(new Gi)!=Hc)&&(An=function(e){var t=Ur(e),n=t==Ky?e.constructor:void 0,r=n?cr(n):"";if(r)switch(r){case qy:return Vc;case Jy:return Bc;case Yy:return $c;case Xy:return jc;case Zy:return Hc}return t});var Wc=hn.Uint8Array,Qy="__lodash_hash_undefined__";function eb(e){return this.__data__.set(e,Qy),this}function tb(e){return this.__data__.has(e)}function Ss(e){var t=-1,n=e==null?0:e.length;for(this.__data__=new _n;++t<n;)this.add(e[t])}Ss.prototype.add=Ss.prototype.push=eb;Ss.prototype.has=tb;function nb(e,t){for(var n=-1,r=e==null?0:e.length;++n<r;)if(t(e[n],n,e))return!0;return!1}function rb(e,t){return e.has(t)}var ob=1,sb=2;function ad(e,t,n,r,o,s){var i=n&ob,a=e.length,l=t.length;if(a!=l&&!(i&&l>a))return!1;var c=s.get(e),u=s.get(t);if(c&&u)return c==t&&u==e;var f=-1,p=!0,d=n&sb?new Ss:void 0;for(s.set(e,t),s.set(t,e);++f<a;){var m=e[f],h=t[f];if(r)var S=i?r(h,m,f,t,e,s):r(m,h,f,e,t,s);if(S!==void 0){if(S)continue;p=!1;break}if(d){if(!nb(t,function(b,C){if(!rb(d,C)&&(m===b||o(m,b,n,r,s)))return d.push(C)})){p=!1;break}}else if(!(m===h||o(m,h,n,r,s))){p=!1;break}}return s.delete(e),s.delete(t),p}function ib(e){var t=-1,n=Array(e.size);return e.forEach(function(r,o){n[++t]=[o,r]}),n}function ab(e){var t=-1,n=Array(e.size);return e.forEach(function(r){n[++t]=r}),n}var lb=1,cb=2,ub="[object Boolean]",fb="[object Date]",pb="[object Error]",db="[object Map]",mb="[object Number]",hb="[object RegExp]",gb="[object Set]",_b="[object String]",vb="[object Symbol]",yb="[object ArrayBuffer]",bb="[object DataView]",zc=qt?qt.prototype:void 0,_i=zc?zc.valueOf:void 0;function wb(e,t,n,r,o,s,i){switch(n){case bb:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case yb:return!(e.byteLength!=t.byteLength||!s(new Wc(e),new Wc(t)));case ub:case fb:case mb:return Va(+e,+t);case pb:return e.name==t.name&&e.message==t.message;case hb:case _b:return e==t+"";case db:var a=ib;case gb:var l=r&lb;if(a||(a=ab),e.size!=t.size&&!l)return!1;var c=i.get(e);if(c)return c==t;r|=cb,i.set(e,t);var u=ad(a(e),a(t),r,o,s,i);return i.delete(e),u;case vb:if(_i)return _i.call(e)==_i.call(t)}return!1}var xb=1,Sb=Object.prototype,Eb=Sb.hasOwnProperty;function Pb(e,t,n,r,o,s){var i=n&xb,a=Dc(e),l=a.length,c=Dc(t),u=c.length;if(l!=u&&!i)return!1;for(var f=l;f--;){var p=a[f];if(!(i?p in t:Eb.call(t,p)))return!1}var d=s.get(e),m=s.get(t);if(d&&m)return d==t&&m==e;var h=!0;s.set(e,t),s.set(t,e);for(var S=i;++f<l;){p=a[f];var b=e[p],C=t[p];if(r)var y=i?r(C,b,p,t,e,s):r(b,C,p,e,t,s);if(!(y===void 0?b===C||o(b,C,n,r,s):y)){h=!1;break}S||(S=p=="constructor")}if(h&&!S){var E=e.constructor,N=t.constructor;E!=N&&"constructor"in e&&"constructor"in t&&!(typeof E=="function"&&E instanceof E&&typeof N=="function"&&N instanceof N)&&(h=!1)}return s.delete(e),s.delete(t),h}var Cb=1,Uc="[object Arguments]",Gc="[object Array]",Ko="[object Object]",Tb=Object.prototype,Kc=Tb.hasOwnProperty;function Ab(e,t,n,r,o,s){var i=pn(e),a=pn(t),l=i?Gc:An(e),c=a?Gc:An(t);l=l==Uc?Ko:l,c=c==Uc?Ko:c;var u=l==Ko,f=c==Ko,p=l==c;if(p&&Ki(e)){if(!Ki(t))return!1;i=!0,u=!1}if(p&&!u)return s||(s=new Fn),i||nd(e)?ad(e,t,n,r,o,s):wb(e,t,l,n,r,o,s);if(!(n&Cb)){var d=u&&Kc.call(e,"__wrapped__"),m=f&&Kc.call(t,"__wrapped__");if(d||m){var h=d?e.value():e,S=m?t.value():t;return s||(s=new Fn),o(h,S,n,r,s)}}return p?(s||(s=new Fn),Pb(e,t,n,r,o,s)):!1}function ld(e,t,n,r,o){return e===t?!0:e==null||t==null||!Fr(e)&&!Fr(t)?e!==e&&t!==t:Ab(e,t,n,r,ld,o)}function Ib(e,t){return e!=null&&t in Object(e)}function Ob(e,t,n){t=Js(t,e);for(var r=-1,o=t.length,s=!1;++r<o;){var i=Ga(t[r]);if(!(s=e!=null&&n(e,i)))break;e=e[i]}return s||++r!=o?s:(o=e==null?0:e.length,!!o&&Wa(o)&&Ha(i,o)&&(pn(e)||za(e)))}function Mb(e,t){return e!=null&&Ob(e,t,Ib)}function Xi(e){for(var t=-1,n=e==null?0:e.length,r={};++t<n;){var o=e[t];r[o[0]]=o[1]}return r}function Rb(e,t){return ld(e,t)}function Lr(e){return e==null}function Nb(e){return e===void 0}function cd(e,t,n,r){if(!ws(e))return e;t=Js(t,e);for(var o=-1,s=t.length,i=s-1,a=e;a!=null&&++o<s;){var l=Ga(t[o]),c=n;if(l==="__proto__"||l==="constructor"||l==="prototype")return e;if(o!=i){var u=a[l];c=void 0,c===void 0&&(c=ws(u)?u:Ha(t[o+1])?[]:{})}rv(a,l,c),a=a[l]}return e}function kb(e,t,n){for(var r=-1,o=t.length,s={};++r<o;){var i=t[r],a=rd(e,i);n(a,i)&&cd(s,Js(i,e),a)}return s}function Fb(e,t){return kb(e,t,function(n,r){return Mb(e,r)})}var Lb=ky(function(e,t){return e==null?{}:Fb(e,t)});function Db(e,t,n){return e==null?e:cd(e,t,n)}const Ka=e=>e===void 0,ho=e=>typeof e=="boolean",Jt=e=>typeof e=="number",iE=e=>!e&&e!==0||oe(e)&&e.length===0||Ee(e)&&!Object.keys(e).length,Mn=e=>typeof Element>"u"?!1:e instanceof Element,Bb=e=>Lr(e),$b=e=>we(e)?!Number.isNaN(Number(e)):!1;var jb=Object.defineProperty,Hb=Object.defineProperties,Vb=Object.getOwnPropertyDescriptors,qc=Object.getOwnPropertySymbols,Wb=Object.prototype.hasOwnProperty,zb=Object.prototype.propertyIsEnumerable,Jc=(e,t,n)=>t in e?jb(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ub=(e,t)=>{for(var n in t||(t={}))Wb.call(t,n)&&Jc(e,n,t[n]);if(qc)for(var n of qc(t))zb.call(t,n)&&Jc(e,n,t[n]);return e},Gb=(e,t)=>Hb(e,Vb(t));function ud(e,t){var n;const r=Ea();return up(()=>{r.value=e()},Gb(Ub({},t),{flush:(n=void 0)!=null?n:"sync"})),Or(r)}var Yc;const Ye=typeof window<"u",Kb=e=>typeof e<"u",qb=e=>typeof e=="function",Jb=e=>typeof e=="string",Es=()=>{},Yb=Ye&&((Yc=window==null?void 0:window.navigator)==null?void 0:Yc.userAgent)&&/iP(ad|hone|od)/.test(window.navigator.userAgent);function ir(e){return typeof e=="function"?e():x(e)}function Xb(e,t){function n(...r){return new Promise((o,s)=>{Promise.resolve(e(()=>t.apply(this,r),{fn:t,thisArg:this,args:r})).then(o).catch(s)})}return n}function Zb(e,t={}){let n,r,o=Es;const s=a=>{clearTimeout(a),o(),o=Es};return a=>{const l=ir(e),c=ir(t.maxWait);return n&&s(n),l<=0||c!==void 0&&c<=0?(r&&(s(r),r=null),Promise.resolve(a())):new Promise((u,f)=>{o=t.rejectOnCancel?f:u,c&&!r&&(r=setTimeout(()=>{n&&s(n),r=null,u(a())},c)),n=setTimeout(()=>{r&&s(r),r=null,u(a())},l)})}}function Qb(e){return e}function Bo(e){return ha()?(pf(e),!0):!1}function e1(e,t=200,n={}){return Xb(Zb(t,n),e)}function aE(e,t=200,n={}){const r=B(e.value),o=e1(()=>{r.value=e.value},t,n);return ye(e,()=>o()),r}function t1(e,t=!0){Xe()?st(e):t?e():Kt(e)}function Zi(e,t,n={}){const{immediate:r=!0}=n,o=B(!1);let s=null;function i(){s&&(clearTimeout(s),s=null)}function a(){o.value=!1,i()}function l(...c){i(),o.value=!0,s=setTimeout(()=>{o.value=!1,s=null,e(...c)},ir(t))}return r&&(o.value=!0,Ye&&l()),Bo(a),{isPending:Or(o),start:l,stop:a}}function ht(e){var t;const n=ir(e);return(t=n==null?void 0:n.$el)!=null?t:n}const fr=Ye?window:void 0,n1=Ye?window.document:void 0;function er(...e){let t,n,r,o;if(Jb(e[0])||Array.isArray(e[0])?([n,r,o]=e,t=fr):[t,n,r,o]=e,!t)return Es;Array.isArray(n)||(n=[n]),Array.isArray(r)||(r=[r]);const s=[],i=()=>{s.forEach(u=>u()),s.length=0},a=(u,f,p,d)=>(u.addEventListener(f,p,d),()=>u.removeEventListener(f,p,d)),l=ye(()=>[ht(t),ir(o)],([u,f])=>{i(),u&&s.push(...n.flatMap(p=>r.map(d=>a(u,p,d,f))))},{immediate:!0,flush:"post"}),c=()=>{l(),i()};return Bo(c),c}let Xc=!1;function r1(e,t,n={}){const{window:r=fr,ignore:o=[],capture:s=!0,detectIframe:i=!1}=n;if(!r)return;Yb&&!Xc&&(Xc=!0,Array.from(r.document.body.children).forEach(p=>p.addEventListener("click",Es)));let a=!0;const l=p=>o.some(d=>{if(typeof d=="string")return Array.from(r.document.querySelectorAll(d)).some(m=>m===p.target||p.composedPath().includes(m));{const m=ht(d);return m&&(p.target===m||p.composedPath().includes(m))}}),u=[er(r,"click",p=>{const d=ht(e);if(!(!d||d===p.target||p.composedPath().includes(d))){if(p.detail===0&&(a=!l(p)),!a){a=!0;return}t(p)}},{passive:!0,capture:s}),er(r,"pointerdown",p=>{const d=ht(e);d&&(a=!p.composedPath().includes(d)&&!l(p))},{passive:!0}),i&&er(r,"blur",p=>{var d;const m=ht(e);((d=r.document.activeElement)==null?void 0:d.tagName)==="IFRAME"&&!(m!=null&&m.contains(r.document.activeElement))&&t(p)})].filter(Boolean);return()=>u.forEach(p=>p())}function fd(e,t=!1){const n=B(),r=()=>n.value=!!e();return r(),t1(r,t),n}function o1(e){return JSON.parse(JSON.stringify(e))}const Zc=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},Qc="__vueuse_ssr_handlers__";Zc[Qc]=Zc[Qc]||{};function lE(e,t,{window:n=fr,initialValue:r=""}={}){const o=B(r),s=k(()=>{var i;return ht(t)||((i=n==null?void 0:n.document)==null?void 0:i.documentElement)});return ye([s,()=>ir(e)],([i,a])=>{var l;if(i&&n){const c=(l=n.getComputedStyle(i).getPropertyValue(a))==null?void 0:l.trim();o.value=c||r}},{immediate:!0}),ye(o,i=>{var a;(a=s.value)!=null&&a.style&&s.value.style.setProperty(ir(e),i)}),o}function cE({document:e=n1}={}){if(!e)return B("visible");const t=B(e.visibilityState);return er(e,"visibilitychange",()=>{t.value=e.visibilityState}),t}var eu=Object.getOwnPropertySymbols,s1=Object.prototype.hasOwnProperty,i1=Object.prototype.propertyIsEnumerable,a1=(e,t)=>{var n={};for(var r in e)s1.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&eu)for(var r of eu(e))t.indexOf(r)<0&&i1.call(e,r)&&(n[r]=e[r]);return n};function qa(e,t,n={}){const r=n,{window:o=fr}=r,s=a1(r,["window"]);let i;const a=fd(()=>o&&"ResizeObserver"in o),l=()=>{i&&(i.disconnect(),i=void 0)},c=ye(()=>ht(e),f=>{l(),a.value&&o&&f&&(i=new ResizeObserver(t),i.observe(f,s))},{immediate:!0,flush:"post"}),u=()=>{l(),c()};return Bo(u),{isSupported:a,stop:u}}function uE(e,t={width:0,height:0},n={}){const{window:r=fr,box:o="content-box"}=n,s=k(()=>{var l,c;return(c=(l=ht(e))==null?void 0:l.namespaceURI)==null?void 0:c.includes("svg")}),i=B(t.width),a=B(t.height);return qa(e,([l])=>{const c=o==="border-box"?l.borderBoxSize:o==="content-box"?l.contentBoxSize:l.devicePixelContentBoxSize;if(r&&s.value){const u=ht(e);if(u){const f=r.getComputedStyle(u);i.value=parseFloat(f.width),a.value=parseFloat(f.height)}}else if(c){const u=Array.isArray(c)?c:[c];i.value=u.reduce((f,{inlineSize:p})=>f+p,0),a.value=u.reduce((f,{blockSize:p})=>f+p,0)}else i.value=l.contentRect.width,a.value=l.contentRect.height},n),ye(()=>ht(e),l=>{i.value=l?t.width:0,a.value=l?t.height:0}),{width:i,height:a}}var tu=Object.getOwnPropertySymbols,l1=Object.prototype.hasOwnProperty,c1=Object.prototype.propertyIsEnumerable,u1=(e,t)=>{var n={};for(var r in e)l1.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&tu)for(var r of tu(e))t.indexOf(r)<0&&c1.call(e,r)&&(n[r]=e[r]);return n};function fE(e,t,n={}){const r=n,{window:o=fr}=r,s=u1(r,["window"]);let i;const a=fd(()=>o&&"MutationObserver"in o),l=()=>{i&&(i.disconnect(),i=void 0)},c=ye(()=>ht(e),f=>{l(),a.value&&o&&f&&(i=new MutationObserver(t),i.observe(f,s))},{immediate:!0}),u=()=>{l(),c()};return Bo(u),{isSupported:a,stop:u}}var nu;(function(e){e.UP="UP",e.RIGHT="RIGHT",e.DOWN="DOWN",e.LEFT="LEFT",e.NONE="NONE"})(nu||(nu={}));var f1=Object.defineProperty,ru=Object.getOwnPropertySymbols,p1=Object.prototype.hasOwnProperty,d1=Object.prototype.propertyIsEnumerable,ou=(e,t,n)=>t in e?f1(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,m1=(e,t)=>{for(var n in t||(t={}))p1.call(t,n)&&ou(e,n,t[n]);if(ru)for(var n of ru(t))d1.call(t,n)&&ou(e,n,t[n]);return e};const h1={easeInSine:[.12,0,.39,0],easeOutSine:[.61,1,.88,1],easeInOutSine:[.37,0,.63,1],easeInQuad:[.11,0,.5,0],easeOutQuad:[.5,1,.89,1],easeInOutQuad:[.45,0,.55,1],easeInCubic:[.32,0,.67,0],easeOutCubic:[.33,1,.68,1],easeInOutCubic:[.65,0,.35,1],easeInQuart:[.5,0,.75,0],easeOutQuart:[.25,1,.5,1],easeInOutQuart:[.76,0,.24,1],easeInQuint:[.64,0,.78,0],easeOutQuint:[.22,1,.36,1],easeInOutQuint:[.83,0,.17,1],easeInExpo:[.7,0,.84,0],easeOutExpo:[.16,1,.3,1],easeInOutExpo:[.87,0,.13,1],easeInCirc:[.55,0,1,.45],easeOutCirc:[0,.55,.45,1],easeInOutCirc:[.85,0,.15,1],easeInBack:[.36,0,.66,-.56],easeOutBack:[.34,1.56,.64,1],easeInOutBack:[.68,-.6,.32,1.6]};m1({linear:Qb},h1);function pE(e,t,n,r={}){var o,s,i;const{clone:a=!1,passive:l=!1,eventName:c,deep:u=!1,defaultValue:f}=r,p=Xe(),d=(p==null?void 0:p.emit)||((o=p==null?void 0:p.$emit)==null?void 0:o.bind(p))||((i=(s=p==null?void 0:p.proxy)==null?void 0:s.$emit)==null?void 0:i.bind(p==null?void 0:p.proxy));let m=c;m=c||m||`update:${t.toString()}`;const h=b=>a?qb(a)?a(b):o1(b):b,S=()=>Kb(e[t])?h(e[t]):f;if(l){const b=S(),C=B(b);return ye(()=>e[t],y=>C.value=h(y)),ye(C,y=>{(y!==e[t]||u)&&d(m,y)},{deep:u}),C}else return k({get(){return S()},set(b){d(m,b)}})}function dE({window:e=fr}={}){if(!e)return B(!1);const t=B(e.document.hasFocus());return er(e,"blur",()=>{t.value=!1}),er(e,"focus",()=>{t.value=!0}),t}class g1 extends Error{constructor(t){super(t),this.name="ElementPlusError"}}function Ps(e,t){throw new g1(`[${e}] ${t}`)}function mE(e,t){}const su={current:0},iu=B(0),pd=2e3,au=Symbol("elZIndexContextKey"),dd=Symbol("zIndexContextKey"),md=e=>{const t=Xe()?Ae(au,su):su,n=e||(Xe()?Ae(dd,void 0):void 0),r=k(()=>{const i=x(n);return Jt(i)?i:pd}),o=k(()=>r.value+iu.value),s=()=>(t.current++,iu.value=t.current,o.value);return!Ye&&Ae(au),{initialZIndex:r,currentZIndex:o,nextZIndex:s}};var _1={name:"en",el:{breadcrumb:{label:"Breadcrumb"},colorpicker:{confirm:"OK",clear:"Clear",defaultLabel:"color picker",description:"current color is {color}. press enter to select a new color.",alphaLabel:"pick alpha value",alphaDescription:"alpha {alpha}, current color is {color}",hueLabel:"pick hue value",hueDescription:"hue {hue}, current color is {color}",svLabel:"pick saturation and brightness value",svDescription:"saturation {saturation}, brightness {brightness}, current color is {color}",predefineDescription:"select {value} as the color"},datepicker:{now:"Now",today:"Today",cancel:"Cancel",clear:"Clear",confirm:"OK",dateTablePrompt:"Use the arrow keys and enter to select the day of the month",monthTablePrompt:"Use the arrow keys and enter to select the month",yearTablePrompt:"Use the arrow keys and enter to select the year",selectedDate:"Selected date",selectDate:"Select date",selectTime:"Select time",startDate:"Start Date",startTime:"Start Time",endDate:"End Date",endTime:"End Time",prevYear:"Previous Year",nextYear:"Next Year",prevMonth:"Previous Month",nextMonth:"Next Month",year:"",month1:"January",month2:"February",month3:"March",month4:"April",month5:"May",month6:"June",month7:"July",month8:"August",month9:"September",month10:"October",month11:"November",month12:"December",weeks:{sun:"Sun",mon:"Mon",tue:"Tue",wed:"Wed",thu:"Thu",fri:"Fri",sat:"Sat"},weeksFull:{sun:"Sunday",mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday"},months:{jan:"Jan",feb:"Feb",mar:"Mar",apr:"Apr",may:"May",jun:"Jun",jul:"Jul",aug:"Aug",sep:"Sep",oct:"Oct",nov:"Nov",dec:"Dec"}},inputNumber:{decrease:"decrease number",increase:"increase number"},select:{loading:"Loading",noMatch:"No matching data",noData:"No data",placeholder:"Select"},mention:{loading:"Loading"},dropdown:{toggleDropdown:"Toggle Dropdown"},cascader:{noMatch:"No matching data",loading:"Loading",placeholder:"Select",noData:"No data"},pagination:{goto:"Go to",pagesize:"/page",total:"Total {total}",pageClassifier:"",page:"Page",prev:"Go to previous page",next:"Go to next page",currentPage:"page {pager}",prevPages:"Previous {pager} pages",nextPages:"Next {pager} pages",deprecationWarning:"Deprecated usages detected, please refer to the el-pagination documentation for more details"},dialog:{close:"Close this dialog"},drawer:{close:"Close this dialog"},messagebox:{title:"Message",confirm:"OK",cancel:"Cancel",error:"Illegal input",close:"Close this dialog"},upload:{deleteTip:"press delete to remove",delete:"Delete",preview:"Preview",continue:"Continue"},slider:{defaultLabel:"slider between {min} and {max}",defaultRangeStartLabel:"pick start value",defaultRangeEndLabel:"pick end value"},table:{emptyText:"No Data",confirmFilter:"Confirm",resetFilter:"Reset",clearFilter:"All",sumText:"Sum"},tour:{next:"Next",previous:"Previous",finish:"Finish",close:"Close this dialog"},tree:{emptyText:"No Data"},transfer:{noMatch:"No matching data",noData:"No data",titles:["List 1","List 2"],filterPlaceholder:"Enter keyword",noCheckedFormat:"{total} items",hasCheckedFormat:"{checked}/{total} checked"},image:{error:"FAILED"},pageHeader:{title:"Back"},popconfirm:{confirmButtonText:"Yes",cancelButtonText:"No"},carousel:{leftArrow:"Carousel arrow left",rightArrow:"Carousel arrow right",indicator:"Carousel switch to index {index}"}}};const v1=e=>(t,n)=>y1(t,n,x(e)),y1=(e,t,n)=>od(n,e,e).replace(/\{(\w+)\}/g,(r,o)=>{var s;return`${(s=t==null?void 0:t[o])!=null?s:`{${o}}`}`}),b1=e=>{const t=k(()=>x(e).name),n=$e(e)?e:B(e);return{lang:t,locale:n,t:v1(e)}},hd=Symbol("localeContextKey"),w1=e=>{const t=e||Ae(hd,B());return b1(k(()=>t.value||_1))},gd="__epPropKey",be=e=>e,x1=e=>Ee(e)&&!!e[gd],Ys=(e,t)=>{if(!Ee(e)||x1(e))return e;const{values:n,required:r,default:o,type:s,validator:i}=e,l={type:s,required:!!r,validator:n||i?c=>{let u=!1,f=[];if(n&&(f=Array.from(n),Pe(e,"default")&&f.push(o),u||(u=f.includes(c))),i&&(u||(u=i(c))),!u&&f.length>0){const p=[...new Set(f)].map(d=>JSON.stringify(d)).join(", ");gg(`Invalid prop: validation failed${t?` for prop "${t}"`:""}. Expected one of [${p}], got value ${JSON.stringify(c)}.`)}return u}:void 0,[gd]:!0};return Pe(e,"default")&&(l.default=o),l},qe=e=>Xi(Object.entries(e).map(([t,n])=>[t,Ys(n,t)])),S1=["","default","small","large"],hE=Ys({type:String,values:S1,required:!1}),_d=Symbol("size"),gE=()=>{const e=Ae(_d,{});return k(()=>x(e.size)||"")},vd=Symbol("emptyValuesContextKey"),E1=["",void 0,null],P1=void 0,_E=qe({emptyValues:Array,valueOnClear:{type:be([String,Number,Boolean,Function]),default:void 0,validator:e=>(e=le(e)?e():e,oe(e)?e.every(t=>!t):!e)}}),vE=(e,t)=>{const n=Xe()?Ae(vd,B({})):B({}),r=k(()=>e.emptyValues||n.value.emptyValues||E1),o=k(()=>le(e.valueOnClear)?e.valueOnClear():e.valueOnClear!==void 0?e.valueOnClear:le(n.value.valueOnClear)?n.value.valueOnClear():n.value.valueOnClear!==void 0?n.value.valueOnClear:P1),s=i=>{let a=!0;return oe(i)?a=r.value.some(l=>Rb(i,l)):a=r.value.includes(i),a};return s(o.value),{emptyValues:r,valueOnClear:o,isEmptyValue:s}},lu=e=>Object.keys(e),yE=e=>Object.entries(e),bE=(e,t,n)=>({get value(){return od(e,t,n)},set value(r){Db(e,t,r)}}),Cs=B();function yd(e,t=void 0){const n=Xe()?Ae(Kp,Cs):Cs;return e?k(()=>{var r,o;return(o=(r=n.value)==null?void 0:r[e])!=null?o:t}):n}function C1(e,t){const n=yd(),r=Be(e,k(()=>{var a;return((a=n.value)==null?void 0:a.namespace)||as})),o=w1(k(()=>{var a;return(a=n.value)==null?void 0:a.locale})),s=md(k(()=>{var a;return((a=n.value)==null?void 0:a.zIndex)||pd})),i=k(()=>{var a;return x(t)||((a=n.value)==null?void 0:a.size)||""});return T1(k(()=>x(n)||{})),{ns:r,locale:o,zIndex:s,size:i}}const T1=(e,t,n=!1)=>{var r;const o=!!Xe(),s=o?yd():void 0,i=(r=void 0)!=null?r:o?gt:void 0;if(!i)return;const a=k(()=>{const l=x(e);return s!=null&&s.value?A1(s.value,l):l});return i(Kp,a),i(hd,k(()=>a.value.locale)),i(qp,k(()=>a.value.namespace)),i(dd,k(()=>a.value.zIndex)),i(_d,{size:k(()=>a.value.size||"")}),i(vd,k(()=>({emptyValues:a.value.emptyValues,valueOnClear:a.value.valueOnClear}))),(n||!Cs.value)&&(Cs.value=a.value),a},A1=(e,t)=>{const n=[...new Set([...lu(e),...lu(t)])],r={};for(const o of n)r[o]=t[o]!==void 0?t[o]:e[o];return r};var Ve=(e,t)=>{const n=e.__vccOpts||e;for(const[r,o]of t)n[r]=o;return n};const bd=(e="")=>e.split(" ").filter(t=>!!t.trim()),I1=(e,t)=>{if(!e||!t)return!1;if(t.includes(" "))throw new Error("className should not contain space.");return e.classList.contains(t)},qo=(e,t)=>{!e||!t.trim()||e.classList.add(...bd(t))},vi=(e,t)=>{!e||!t.trim()||e.classList.remove(...bd(t))},wE=(e,t)=>{var n;if(!Ye||!e||!t)return"";let r=xt(t);r==="float"&&(r="cssFloat");try{const o=e.style[r];if(o)return o;const s=(n=document.defaultView)==null?void 0:n.getComputedStyle(e,"");return s?s[r]:""}catch{return e.style[r]}};function Qi(e,t="px"){if(!e)return"";if(Jt(e)||$b(e))return`${e}${t}`;if(we(e))return e}const $n=(e,t)=>{if(e.install=n=>{for(const r of[e,...Object.values(t??{})])n.component(r.name,r)},t)for(const[n,r]of Object.entries(t))e[n]=r;return e},O1=(e,t)=>(e.install=n=>{e._context=n._context,n.config.globalProperties[t]=e},e),pr=e=>(e.install=ft,e),M1=qe({size:{type:be([Number,String])},color:{type:String}}),R1=q({name:"ElIcon",inheritAttrs:!1}),N1=q({...R1,props:M1,setup(e){const t=e,n=Be("icon"),r=k(()=>{const{size:o,color:s}=t;return!o&&!s?{}:{fontSize:Ka(o)?void 0:Qi(o),"--color":s}});return(o,s)=>(Y(),ie("i",lr({class:x(n).b(),style:x(r)},o.$attrs),[Re(o.$slots,"default")],16))}});var k1=Ve(N1,[["__file","icon.vue"]]);const Dr=$n(k1);function cu(){let e;const t=(r,o)=>{n(),e=window.setTimeout(r,o)},n=()=>window.clearTimeout(e);return Bo(()=>n()),{registerTimeout:t,cancelTimeout:n}}const F1=qe({showAfter:{type:Number,default:0},hideAfter:{type:Number,default:200},autoClose:{type:Number,default:0}}),L1=({showAfter:e,hideAfter:t,autoClose:n,open:r,close:o})=>{const{registerTimeout:s}=cu(),{registerTimeout:i,cancelTimeout:a}=cu();return{onOpen:(u,f=x(e))=>{s(()=>{r(u);const p=x(n);Jt(p)&&p>0&&i(()=>{o(u)},p)},f)},onClose:(u,f=x(t))=>{a(),s(()=>{o(u)},f)}}};/*! Element Plus Icons Vue v2.3.2 */var D1=q({name:"Aim",__name:"aim",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"}),Q("path",{fill:"currentColor",d:"M512 96a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V128a32 32 0 0 1 32-32m0 576a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V704a32 32 0 0 1 32-32M96 512a32 32 0 0 1 32-32h192a32 32 0 0 1 0 64H128a32 32 0 0 1-32-32m576 0a32 32 0 0 1 32-32h192a32 32 0 1 1 0 64H704a32 32 0 0 1-32-32"})]))}}),xE=D1,B1=q({name:"ArrowDown",__name:"arrow-down",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M831.872 340.864 512 652.672 192.128 340.864a30.59 30.59 0 0 0-42.752 0 29.12 29.12 0 0 0 0 41.6L489.664 714.24a32 32 0 0 0 44.672 0l340.288-331.712a29.12 29.12 0 0 0 0-41.728 30.59 30.59 0 0 0-42.752 0z"})]))}}),$1=B1,j1=q({name:"ArrowLeft",__name:"arrow-left",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M609.408 149.376 277.76 489.6a32 32 0 0 0 0 44.672l331.648 340.352a29.12 29.12 0 0 0 41.728 0 30.59 30.59 0 0 0 0-42.752L339.264 511.936l311.872-319.872a30.59 30.59 0 0 0 0-42.688 29.12 29.12 0 0 0-41.728 0"})]))}}),SE=j1,H1=q({name:"ArrowRight",__name:"arrow-right",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"})]))}}),V1=H1,W1=q({name:"ArrowUp",__name:"arrow-up",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m488.832 344.32-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872 319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0"})]))}}),EE=W1,z1=q({name:"Box",__name:"box",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M317.056 128 128 344.064V896h768V344.064L706.944 128zm-14.528-64h418.944a32 32 0 0 1 24.064 10.88l206.528 236.096A32 32 0 0 1 960 332.032V928a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V332.032a32 32 0 0 1 7.936-21.12L278.4 75.008A32 32 0 0 1 302.528 64"}),Q("path",{fill:"currentColor",d:"M64 320h896v64H64z"}),Q("path",{fill:"currentColor",d:"M448 327.872V640h128V327.872L526.08 128h-28.16zM448 64h128l64 256v352a32 32 0 0 1-32 32H416a32 32 0 0 1-32-32V320z"})]))}}),U1=z1,G1=q({name:"Briefcase",__name:"briefcase",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M320 320V128h384v192h192v192H128V320zM128 576h768v320H128zm256-256h256.064V192H384z"})]))}}),K1=G1,q1=q({name:"Check",__name:"check",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"})]))}}),PE=q1,J1=q({name:"CircleCheck",__name:"circle-check",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"}),Q("path",{fill:"currentColor",d:"M745.344 361.344a32 32 0 0 1 45.312 45.312l-288 288a32 32 0 0 1-45.312 0l-160-160a32 32 0 1 1 45.312-45.312L480 626.752z"})]))}}),Y1=J1,X1=q({name:"CircleCloseFilled",__name:"circle-close-filled",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 393.664L407.936 353.6a38.4 38.4 0 1 0-54.336 54.336L457.664 512 353.6 616.064a38.4 38.4 0 1 0 54.336 54.336L512 566.336 616.064 670.4a38.4 38.4 0 1 0 54.336-54.336L566.336 512 670.4 407.936a38.4 38.4 0 1 0-54.336-54.336z"})]))}}),wd=X1,Z1=q({name:"CircleClose",__name:"circle-close",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m466.752 512-90.496-90.496a32 32 0 0 1 45.248-45.248L512 466.752l90.496-90.496a32 32 0 1 1 45.248 45.248L557.248 512l90.496 90.496a32 32 0 1 1-45.248 45.248L512 557.248l-90.496 90.496a32 32 0 0 1-45.248-45.248z"}),Q("path",{fill:"currentColor",d:"M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"})]))}}),Q1=Z1,e2=q({name:"Close",__name:"close",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"})]))}}),Ja=e2,t2=q({name:"Connection",__name:"connection",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M640 384v64H448a128 128 0 0 0-128 128v128a128 128 0 0 0 128 128h320a128 128 0 0 0 128-128V576a128 128 0 0 0-64-110.848V394.88c74.56 26.368 128 97.472 128 181.056v128a192 192 0 0 1-192 192H448a192 192 0 0 1-192-192V576a192 192 0 0 1 192-192z"}),Q("path",{fill:"currentColor",d:"M384 640v-64h192a128 128 0 0 0 128-128V320a128 128 0 0 0-128-128H256a128 128 0 0 0-128 128v128a128 128 0 0 0 64 110.848v70.272A192.06 192.06 0 0 1 64 448V320a192 192 0 0 1 192-192h320a192 192 0 0 1 192 192v128a192 192 0 0 1-192 192z"})]))}}),n2=t2,r2=q({name:"CopyDocument",__name:"copy-document",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M768 832a128 128 0 0 1-128 128H192A128 128 0 0 1 64 832V384a128 128 0 0 1 128-128v64a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64z"}),Q("path",{fill:"currentColor",d:"M384 128a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64V192a64 64 0 0 0-64-64zm0-64h448a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H384a128 128 0 0 1-128-128V192A128 128 0 0 1 384 64"})]))}}),CE=r2,o2=q({name:"Delete",__name:"delete",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"})]))}}),TE=o2,s2=q({name:"Document",__name:"document",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M832 384H576V128H192v768h640zm-26.496-64L640 154.496V320zM160 64h480l256 256v608a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32m160 448h384v64H320zm0-192h160v64H320zm0 384h384v64H320z"})]))}}),AE=s2,i2=q({name:"Edit",__name:"edit",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"}),Q("path",{fill:"currentColor",d:"m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"})]))}}),IE=i2,a2=q({name:"FirstAidKit",__name:"first-aid-kit",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M192 256a64 64 0 0 0-64 64v448a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V320a64 64 0 0 0-64-64zm0-64h640a128 128 0 0 1 128 128v448a128 128 0 0 1-128 128H192A128 128 0 0 1 64 768V320a128 128 0 0 1 128-128"}),Q("path",{fill:"currentColor",d:"M544 512h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64h96v-96a32 32 0 0 1 64 0zM352 128v64h320v-64zm-32-64h384a32 32 0 0 1 32 32v128a32 32 0 0 1-32 32H320a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32"})]))}}),l2=a2,c2=q({name:"FullScreen",__name:"full-screen",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m160 96.064 192 .192a32 32 0 0 1 0 64l-192-.192V352a32 32 0 0 1-64 0V96h64zm0 831.872V928H96V672a32 32 0 1 1 64 0v191.936l192-.192a32 32 0 1 1 0 64zM864 96.064V96h64v256a32 32 0 1 1-64 0V160.064l-192 .192a32 32 0 1 1 0-64zm0 831.872-192-.192a32 32 0 0 1 0-64l192 .192V672a32 32 0 1 1 64 0v256h-64z"})]))}}),u2=c2,f2=q({name:"Hide",__name:"hide",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M876.8 156.8c0-9.6-3.2-16-9.6-22.4s-12.8-9.6-22.4-9.6-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176S0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4s3.2 16 9.6 22.4 12.8 9.6 22.4 9.6 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4m-646.4 528Q115.2 579.2 76.8 512q43.2-72 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4m140.8-96Q352 555.2 352 512c0-44.8 16-83.2 48-112s67.2-48 112-48c28.8 0 54.4 6.4 73.6 19.2zM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6q-43.2 72-153.6 172.8c-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176S1024 528 1024 512s-48.001-73.6-134.401-176"}),Q("path",{fill:"currentColor",d:"M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112s-67.2 48-112 48"})]))}}),OE=f2,p2=q({name:"InfoFilled",__name:"info-filled",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64m67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344M590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.99 12.99 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z"})]))}}),ea=p2,d2=q({name:"Loading",__name:"loading",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32m0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32m448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32m-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32M195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248m452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248M828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0m-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0"})]))}}),m2=d2,h2=q({name:"MapLocation",__name:"map-location",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M800 416a288 288 0 1 0-576 0c0 118.144 94.528 272.128 288 456.576C705.472 688.128 800 534.144 800 416M512 960C277.312 746.688 160 565.312 160 416a352 352 0 0 1 704 0c0 149.312-117.312 330.688-352 544"}),Q("path",{fill:"currentColor",d:"M512 448a64 64 0 1 0 0-128 64 64 0 0 0 0 128m0 64a128 128 0 1 1 0-256 128 128 0 0 1 0 256m345.6 192L960 960H672v-64H352v64H64l102.4-256zm-68.928 0H235.328l-76.8 192h706.944z"})]))}}),g2=h2,_2=q({name:"Minus",__name:"minus",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M128 544h768a32 32 0 1 0 0-64H128a32 32 0 0 0 0 64"})]))}}),v2=_2,y2=q({name:"Monitor",__name:"monitor",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M544 768v128h192a32 32 0 1 1 0 64H288a32 32 0 1 1 0-64h192V768H192A128 128 0 0 1 64 640V256a128 128 0 0 1 128-128h640a128 128 0 0 1 128 128v384a128 128 0 0 1-128 128zM192 192a64 64 0 0 0-64 64v384a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V256a64 64 0 0 0-64-64z"})]))}}),b2=y2,w2=q({name:"More",__name:"more",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M176 416a112 112 0 1 0 0 224 112 112 0 0 0 0-224m0 64a48 48 0 1 1 0 96 48 48 0 0 1 0-96m336-64a112 112 0 1 1 0 224 112 112 0 0 1 0-224m0 64a48 48 0 1 0 0 96 48 48 0 0 0 0-96m336-64a112 112 0 1 1 0 224 112 112 0 0 1 0-224m0 64a48 48 0 1 0 0 96 48 48 0 0 0 0-96"})]))}}),x2=w2,S2=q({name:"Notebook",__name:"notebook",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M192 128v768h640V128zm-32-64h704a32 32 0 0 1 32 32v832a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V96a32 32 0 0 1 32-32"}),Q("path",{fill:"currentColor",d:"M672 128h64v768h-64zM96 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32m0 192h128q32 0 32 32t-32 32H96q-32 0-32-32t32-32"})]))}}),E2=S2,P2=q({name:"Plus",__name:"plus",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64z"})]))}}),ME=P2,C2=q({name:"QuestionFilled",__name:"question-filled",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496h80.256c0-29.568 5.632-52.8 17.6-68.992 13.376-19.712 35.2-28.864 66.176-28.864 23.936 0 42.944 6.336 56.32 19.712 12.672 13.376 19.712 31.68 19.712 54.912 0 17.6-6.336 34.496-19.008 49.984l-8.448 9.856c-45.76 40.832-73.216 70.4-82.368 89.408-9.856 19.008-14.08 42.24-14.08 68.992v9.856h80.96v-9.856c0-16.896 3.52-31.68 10.56-45.76 6.336-12.672 15.488-24.64 28.16-35.2 33.792-29.568 54.208-48.576 60.544-55.616 16.896-22.528 26.048-51.392 26.048-86.592q0-64.416-42.24-101.376c-28.16-25.344-65.472-37.312-111.232-37.312m-12.672 406.208a54.27 54.27 0 0 0-38.72 14.784 49.4 49.4 0 0 0-15.488 38.016c0 15.488 4.928 28.16 15.488 38.016A54.85 54.85 0 0 0 523.072 768c15.488 0 28.16-4.928 38.72-14.784a51.52 51.52 0 0 0 16.192-38.72 51.97 51.97 0 0 0-15.488-38.016 55.94 55.94 0 0 0-39.424-14.784"})]))}}),T2=C2,A2=q({name:"RefreshLeft",__name:"refresh-left",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M289.088 296.704h92.992a32 32 0 0 1 0 64H232.96a32 32 0 0 1-32-32V179.712a32 32 0 0 1 64 0v50.56a384 384 0 0 1 643.84 282.88 384 384 0 0 1-383.936 384 384 384 0 0 1-384-384h64a320 320 0 1 0 640 0 320 320 0 0 0-555.712-216.448z"})]))}}),RE=A2,I2=q({name:"Refresh",__name:"refresh",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M771.776 794.88A384 384 0 0 1 128 512h64a320 320 0 0 0 555.712 216.448H654.72a32 32 0 1 1 0-64h149.056a32 32 0 0 1 32 32v148.928a32 32 0 1 1-64 0v-50.56zM276.288 295.616h92.992a32 32 0 0 1 0 64H220.16a32 32 0 0 1-32-32V178.56a32 32 0 0 1 64 0v50.56A384 384 0 0 1 896.128 512h-64a320 320 0 0 0-555.776-216.384z"})]))}}),NE=I2,O2=q({name:"Setting",__name:"setting",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357 357 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a352 352 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357 357 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294 294 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293 293 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294 294 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288 288 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293 293 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a288 288 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384m0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256"})]))}}),M2=O2,R2=q({name:"ShoppingBag",__name:"shopping-bag",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M704 320v96a32 32 0 0 1-32 32h-32V320H384v128h-32a32 32 0 0 1-32-32v-96H192v576h640V320zm-384-64a192 192 0 1 1 384 0h160a32 32 0 0 1 32 32v640a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V288a32 32 0 0 1 32-32zm64 0h256a128 128 0 1 0-256 0"}),Q("path",{fill:"currentColor",d:"M192 704h640v64H192z"})]))}}),N2=R2,k2=q({name:"SuccessFilled",__name:"success-filled",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m-55.808 536.384-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.27 38.27 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336z"})]))}}),xd=k2,F2=q({name:"Tools",__name:"tools",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M764.416 254.72a351.7 351.7 0 0 1 86.336 149.184H960v192.064H850.752a351.7 351.7 0 0 1-86.336 149.312l54.72 94.72-166.272 96-54.592-94.72a352.64 352.64 0 0 1-172.48 0L371.136 936l-166.272-96 54.72-94.72a351.7 351.7 0 0 1-86.336-149.312H64v-192h109.248a351.7 351.7 0 0 1 86.336-149.312L204.8 160l166.208-96h.192l54.656 94.592a352.64 352.64 0 0 1 172.48 0L652.8 64h.128L819.2 160l-54.72 94.72zM704 499.968a192 192 0 1 0-384 0 192 192 0 0 0 384 0"})]))}}),L2=F2,D2=q({name:"VideoPause",__name:"video-pause",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 832a384 384 0 0 0 0-768 384 384 0 0 0 0 768m-96-544q32 0 32 32v256q0 32-32 32t-32-32V384q0-32 32-32m192 0q32 0 32 32v256q0 32-32 32t-32-32V384q0-32 32-32"})]))}}),kE=D2,B2=q({name:"View",__name:"view",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 160c320 0 512 352 512 352S832 864 512 864 0 512 0 512s192-352 512-352m0 64c-225.28 0-384.128 208.064-436.8 288 52.608 79.872 211.456 288 436.8 288 225.28 0 384.128-208.064 436.8-288-52.608-79.872-211.456-288-436.8-288m0 64a224 224 0 1 1 0 448 224 224 0 0 1 0-448m0 64a160.19 160.19 0 0 0-160 160c0 88.192 71.744 160 160 160s160-71.808 160-160-71.744-160-160-160"})]))}}),FE=B2,$2=q({name:"WarningFilled",__name:"warning-filled",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896m0 192a58.43 58.43 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.43 58.43 0 0 0 512 256m0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4"})]))}}),Sd=$2,j2=q({name:"ZoomIn",__name:"zoom-in",setup(e){return(t,n)=>(Y(),ie("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 1024 1024"},[Q("path",{fill:"currentColor",d:"m795.904 750.72 124.992 124.928a32 32 0 0 1-45.248 45.248L750.656 795.904a416 416 0 1 1 45.248-45.248zM480 832a352 352 0 1 0 0-704 352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"})]))}}),LE=j2;const wr=be([String,Object,Function]),DE={Close:Ja},H2={Close:Ja,SuccessFilled:xd,InfoFilled:ea,WarningFilled:Sd,CircleCloseFilled:wd},uu={primary:ea,success:xd,warning:Sd,error:wd,info:ea},BE={validating:m2,success:Y1,error:Q1},$E=()=>Ye&&/firefox/i.test(window.navigator.userAgent),V2=()=>Ye&&/android/i.test(window.navigator.userAgent),Ed=e=>e,W2=qe({ariaLabel:String,ariaOrientation:{type:String,values:["horizontal","vertical","undefined"]},ariaControls:String}),Pd=e=>Lb(W2,e),fu={prefix:Math.floor(Math.random()*1e4),current:0},z2=Symbol("elIdInjection"),Cd=()=>Xe()?Ae(z2,fu):fu,U2=e=>{const t=Cd(),n=$a();return ud(()=>x(e)||`${n.value}-id-${t.prefix}-${t.current++}`)},jE=Symbol("formContextKey"),pu=Symbol("formItemContextKey"),G2='a[href],button:not([disabled]),button:not([hidden]),:not([tabindex="-1"]),input:not([disabled]),input:not([type="hidden"]),select:not([disabled]),textarea:not([disabled])',du=e=>typeof Element>"u"?!1:e instanceof Element,K2=e=>getComputedStyle(e).position==="fixed"?!1:e.offsetParent!==null,HE=e=>Array.from(e.querySelectorAll(G2)).filter(t=>Ts(t)&&K2(t)),Ts=e=>{if(e.tabIndex>0||e.tabIndex===0&&e.getAttribute("tabIndex")!==null)return!0;if(e.tabIndex<0||e.hasAttribute("disabled")||e.getAttribute("aria-disabled")==="true")return!1;switch(e.nodeName){case"A":return!!e.href&&e.rel!=="ignore";case"INPUT":return!(e.type==="hidden"||e.type==="file");case"BUTTON":case"SELECT":case"TEXTAREA":return!0;default:return!1}},ls=function(e,t,...n){let r;t.includes("mouse")||t.includes("click")?r="MouseEvents":t.includes("key")?r="KeyboardEvent":r="HTMLEvents";const o=document.createEvent(r);return o.initEvent(t,...n),e.dispatchEvent(o),e},q2=e=>!e.getAttribute("aria-owns"),VE=(e,t,n)=>{const{parentNode:r}=e;if(!r)return null;const o=r.querySelectorAll(n),s=Array.prototype.indexOf.call(o,e);return o[s+t]||null},$o=(e,t)=>{if(!e||!e.focus)return;let n=!1;du(e)&&!Ts(e)&&!e.getAttribute("tabindex")&&(e.setAttribute("tabindex","-1"),n=!0),e.focus(t),du(e)&&n&&e.removeAttribute("tabindex")},WE=e=>{e&&($o(e),!q2(e)&&e.click())},Ya=Symbol("popper"),Td=Symbol("popperContent"),J2=["dialog","grid","group","listbox","menu","navigation","tooltip","tree"],Ad=qe({role:{type:String,values:J2,default:"tooltip"}}),Y2=q({name:"ElPopper",inheritAttrs:!1}),X2=q({...Y2,props:Ad,setup(e,{expose:t}){const n=e,r=B(),o=B(),s=B(),i=B(),a=k(()=>n.role),l={triggerRef:r,popperInstanceRef:o,contentRef:s,referenceRef:i,role:a};return t(l),gt(Ya,l),(c,u)=>Re(c.$slots,"default")}});var Z2=Ve(X2,[["__file","popper.vue"]]);const Q2=q({name:"ElPopperArrow",inheritAttrs:!1}),ew=q({...Q2,setup(e,{expose:t}){const n=Be("popper"),{arrowRef:r,arrowStyle:o}=Ae(Td,void 0);return At(()=>{r.value=void 0}),t({arrowRef:r}),(s,i)=>(Y(),ie("span",{ref_key:"arrowRef",ref:r,class:De(x(n).e("arrow")),style:Xt(x(o)),"data-popper-arrow":""},null,6))}});var tw=Ve(ew,[["__file","arrow.vue"]]);const Id=qe({virtualRef:{type:be(Object)},virtualTriggering:Boolean,onMouseenter:{type:be(Function)},onMouseleave:{type:be(Function)},onClick:{type:be(Function)},onKeydown:{type:be(Function)},onFocus:{type:be(Function)},onBlur:{type:be(Function)},onContextmenu:{type:be(Function)},id:String,open:Boolean}),Od=Symbol("elForwardRef"),nw=e=>{gt(Od,{setForwardRef:n=>{e.value=n}})},rw=e=>({mounted(t){e(t)},updated(t){e(t)},unmounted(){e(null)}}),ow="ElOnlyChild",sw=q({name:ow,setup(e,{slots:t,attrs:n}){var r;const o=Ae(Od),s=rw((r=o==null?void 0:o.setForwardRef)!=null?r:ft);return()=>{var i;const a=(i=t.default)==null?void 0:i.call(t,n);if(!a)return null;const[l,c]=Md(a);return l?Wr(fn(l,n),[[s]]):null}}});function Md(e){if(!e)return[null,0];const t=e,n=t.filter(r=>r.type!==Je).length;for(const r of t){if(Ee(r))switch(r.type){case Je:continue;case Fo:case"svg":return[mu(r),n];case ze:return Md(r.children);default:return[r,n]}return[mu(r),n]}return[null,0]}function mu(e){const t=Be("only-child");return re("span",{class:t.e("content")},[e])}const iw=q({name:"ElPopperTrigger",inheritAttrs:!1}),aw=q({...iw,props:Id,setup(e,{expose:t}){const n=e,{role:r,triggerRef:o}=Ae(Ya,void 0);nw(o);const s=k(()=>a.value?n.id:void 0),i=k(()=>{if(r&&r.value==="tooltip")return n.open&&n.id?n.id:void 0}),a=k(()=>{if(r&&r.value!=="tooltip")return r.value}),l=k(()=>a.value?`${n.open}`:void 0);let c;const u=["onMouseenter","onMouseleave","onClick","onKeydown","onFocus","onBlur","onContextmenu"];return st(()=>{ye(()=>n.virtualRef,f=>{f&&(o.value=ht(f))},{immediate:!0}),ye(o,(f,p)=>{c==null||c(),c=void 0,Mn(p)&&u.forEach(d=>{const m=n[d];m&&p.removeEventListener(d.slice(2).toLowerCase(),m,["onFocus","onBlur"].includes(d))}),Mn(f)&&(u.forEach(d=>{const m=n[d];m&&f.addEventListener(d.slice(2).toLowerCase(),m,["onFocus","onBlur"].includes(d))}),Ts(f)&&(c=ye([s,i,a,l],d=>{["aria-controls","aria-describedby","aria-haspopup","aria-expanded"].forEach((m,h)=>{Lr(d[h])?f.removeAttribute(m):f.setAttribute(m,d[h])})},{immediate:!0}))),Mn(p)&&Ts(p)&&["aria-controls","aria-describedby","aria-haspopup","aria-expanded"].forEach(d=>p.removeAttribute(d))},{immediate:!0})}),At(()=>{if(c==null||c(),c=void 0,o.value&&Mn(o.value)){const f=o.value;u.forEach(p=>{const d=n[p];d&&f.removeEventListener(p.slice(2).toLowerCase(),d,["onFocus","onBlur"].includes(p))}),o.value=void 0}}),t({triggerRef:o}),(f,p)=>f.virtualTriggering?On("v-if",!0):(Y(),He(x(sw),lr({key:0},f.$attrs,{"aria-controls":x(s),"aria-describedby":x(i),"aria-expanded":x(l),"aria-haspopup":x(a)}),{default:de(()=>[Re(f.$slots,"default")]),_:3},16,["aria-controls","aria-describedby","aria-expanded","aria-haspopup"]))}});var lw=Ve(aw,[["__file","trigger.vue"]]);const yi="focus-trap.focus-after-trapped",bi="focus-trap.focus-after-released",cw="focus-trap.focusout-prevented",hu={cancelable:!0,bubbles:!1},uw={cancelable:!0,bubbles:!1},gu="focusAfterTrapped",_u="focusAfterReleased",fw=Symbol("elFocusTrap"),Xa=B(),Xs=B(0),Za=B(0);let Jo=0;const Rd=e=>{const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0||r===document.activeElement?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t},vu=(e,t)=>{for(const n of e)if(!pw(n,t))return n},pw=(e,t)=>{if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1},dw=e=>{const t=Rd(e),n=vu(t,e),r=vu(t.reverse(),e);return[n,r]},mw=e=>e instanceof HTMLInputElement&&"select"in e,Sn=(e,t)=>{if(e){const n=document.activeElement;$o(e,{preventScroll:!0}),Za.value=window.performance.now(),e!==n&&mw(e)&&t&&e.select()}};function yu(e,t){const n=[...e],r=e.indexOf(t);return r!==-1&&n.splice(r,1),n}const hw=()=>{let e=[];return{push:r=>{const o=e[0];o&&r!==o&&o.pause(),e=yu(e,r),e.unshift(r)},remove:r=>{var o,s;e=yu(e,r),(s=(o=e[0])==null?void 0:o.resume)==null||s.call(o)}}},gw=(e,t=!1)=>{const n=document.activeElement;for(const r of e)if(Sn(r,t),document.activeElement!==n)return},bu=hw(),_w=()=>Xs.value>Za.value,Yo=()=>{Xa.value="pointer",Xs.value=window.performance.now()},wu=()=>{Xa.value="keyboard",Xs.value=window.performance.now()},vw=()=>(st(()=>{Jo===0&&(document.addEventListener("mousedown",Yo),document.addEventListener("touchstart",Yo),document.addEventListener("keydown",wu)),Jo++}),At(()=>{Jo--,Jo<=0&&(document.removeEventListener("mousedown",Yo),document.removeEventListener("touchstart",Yo),document.removeEventListener("keydown",wu))}),{focusReason:Xa,lastUserFocusTimestamp:Xs,lastAutomatedFocusTimestamp:Za}),Xo=e=>new CustomEvent(cw,{...uw,detail:e}),Ue={tab:"Tab",enter:"Enter",space:"Space",left:"ArrowLeft",up:"ArrowUp",right:"ArrowRight",down:"ArrowDown",esc:"Escape",delete:"Delete",backspace:"Backspace",numpadEnter:"NumpadEnter",pageUp:"PageUp",pageDown:"PageDown",home:"Home",end:"End"},nn=(e,t,{checkForDefaultPrevented:n=!0}={})=>o=>{const s=e==null?void 0:e(o);if(n===!1||!s)return t==null?void 0:t(o)},Gr=e=>{if(e.code&&e.code!=="Unidentified")return e.code;const t=yw(e);if(t){if(Object.values(Ue).includes(t))return t;switch(t){case" ":return Ue.space;default:return""}}return""},yw=e=>{let t=e.key&&e.key!=="Unidentified"?e.key:"";if(!t&&e.type==="keyup"&&V2()){const n=e.target;t=n.value.charAt(n.selectionStart-1)}return t};let yr=[];const xu=e=>{Gr(e)===Ue.esc&&yr.forEach(n=>n(e))},bw=e=>{st(()=>{yr.length===0&&document.addEventListener("keydown",xu),Ye&&yr.push(e)}),At(()=>{yr=yr.filter(t=>t!==e),yr.length===0&&Ye&&document.removeEventListener("keydown",xu)})},ww=q({name:"ElFocusTrap",inheritAttrs:!1,props:{loop:Boolean,trapped:Boolean,focusTrapEl:Object,focusStartEl:{type:[Object,String],default:"first"}},emits:[gu,_u,"focusin","focusout","focusout-prevented","release-requested"],setup(e,{emit:t}){const n=B();let r,o;const{focusReason:s}=vw();bw(m=>{e.trapped&&!i.paused&&t("release-requested",m)});const i={paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}},a=m=>{if(!e.loop&&!e.trapped||i.paused)return;const{altKey:h,ctrlKey:S,metaKey:b,currentTarget:C,shiftKey:y}=m,{loop:E}=e,z=Gr(m)===Ue.tab&&!h&&!S&&!b,D=document.activeElement;if(z&&D){const A=C,[v,R]=dw(A);if(v&&R){if(!y&&D===R){const I=Xo({focusReason:s.value});t("focusout-prevented",I),I.defaultPrevented||(m.preventDefault(),E&&Sn(v,!0))}else if(y&&[v,A].includes(D)){const I=Xo({focusReason:s.value});t("focusout-prevented",I),I.defaultPrevented||(m.preventDefault(),E&&Sn(R,!0))}}else if(D===A){const I=Xo({focusReason:s.value});t("focusout-prevented",I),I.defaultPrevented||m.preventDefault()}}};gt(fw,{focusTrapRef:n,onKeydown:a}),ye(()=>e.focusTrapEl,m=>{m&&(n.value=m)},{immediate:!0}),ye([n],([m],[h])=>{m&&(m.addEventListener("keydown",a),m.addEventListener("focusin",u),m.addEventListener("focusout",f)),h&&(h.removeEventListener("keydown",a),h.removeEventListener("focusin",u),h.removeEventListener("focusout",f))});const l=m=>{t(gu,m)},c=m=>t(_u,m),u=m=>{const h=x(n);if(!h)return;const S=m.target,b=m.relatedTarget,C=S&&h.contains(S);e.trapped||b&&h.contains(b)||(r=b),C&&t("focusin",m),!i.paused&&e.trapped&&(C?o=S:Sn(o,!0))},f=m=>{const h=x(n);if(!(i.paused||!h))if(e.trapped){const S=m.relatedTarget;!Lr(S)&&!h.contains(S)&&setTimeout(()=>{if(!i.paused&&e.trapped){const b=Xo({focusReason:s.value});t("focusout-prevented",b),b.defaultPrevented||Sn(o,!0)}},0)}else{const S=m.target;S&&h.contains(S)||t("focusout",m)}};async function p(){await Kt();const m=x(n);if(m){bu.push(i);const h=m.contains(document.activeElement)?r:document.activeElement;if(r=h,!m.contains(h)){const b=new Event(yi,hu);m.addEventListener(yi,l),m.dispatchEvent(b),b.defaultPrevented||Kt(()=>{let C=e.focusStartEl;we(C)||(Sn(C),document.activeElement!==C&&(C="first")),C==="first"&&gw(Rd(m),!0),(document.activeElement===h||C==="container")&&Sn(m)})}}}function d(){const m=x(n);if(m){m.removeEventListener(yi,l);const h=new CustomEvent(bi,{...hu,detail:{focusReason:s.value}});m.addEventListener(bi,c),m.dispatchEvent(h),!h.defaultPrevented&&(s.value=="keyboard"||!_w()||m.contains(document.activeElement))&&Sn(r??document.body),m.removeEventListener(bi,c),bu.remove(i),r=null,o=null}}return st(()=>{e.trapped&&p(),ye(()=>e.trapped,m=>{m?p():d()})}),At(()=>{e.trapped&&d(),n.value&&(n.value.removeEventListener("keydown",a),n.value.removeEventListener("focusin",u),n.value.removeEventListener("focusout",f),n.value=void 0)}),{onKeydown:a}}});function xw(e,t,n,r,o,s){return Re(e.$slots,"default",{handleKeydown:e.onKeydown})}var Sw=Ve(ww,[["render",xw],["__file","focus-trap.vue"]]),_t="top",Ct="bottom",Tt="right",vt="left",Qa="auto",jo=[_t,Ct,Tt,vt],Br="start",Ao="end",Ew="clippingParents",Nd="viewport",eo="popper",Pw="reference",Su=jo.reduce(function(e,t){return e.concat([t+"-"+Br,t+"-"+Ao])},[]),el=[].concat(jo,[Qa]).reduce(function(e,t){return e.concat([t,t+"-"+Br,t+"-"+Ao])},[]),Cw="beforeRead",Tw="read",Aw="afterRead",Iw="beforeMain",Ow="main",Mw="afterMain",Rw="beforeWrite",Nw="write",kw="afterWrite",Fw=[Cw,Tw,Aw,Iw,Ow,Mw,Rw,Nw,kw];function Yt(e){return e?(e.nodeName||"").toLowerCase():null}function Lt(e){if(e==null)return window;if(e.toString()!=="[object Window]"){var t=e.ownerDocument;return t&&t.defaultView||window}return e}function $r(e){var t=Lt(e).Element;return e instanceof t||e instanceof Element}function Pt(e){var t=Lt(e).HTMLElement;return e instanceof t||e instanceof HTMLElement}function tl(e){if(typeof ShadowRoot>"u")return!1;var t=Lt(e).ShadowRoot;return e instanceof t||e instanceof ShadowRoot}function Lw(e){var t=e.state;Object.keys(t.elements).forEach(function(n){var r=t.styles[n]||{},o=t.attributes[n]||{},s=t.elements[n];!Pt(s)||!Yt(s)||(Object.assign(s.style,r),Object.keys(o).forEach(function(i){var a=o[i];a===!1?s.removeAttribute(i):s.setAttribute(i,a===!0?"":a)}))})}function Dw(e){var t=e.state,n={popper:{position:t.options.strategy,left:"0",top:"0",margin:"0"},arrow:{position:"absolute"},reference:{}};return Object.assign(t.elements.popper.style,n.popper),t.styles=n,t.elements.arrow&&Object.assign(t.elements.arrow.style,n.arrow),function(){Object.keys(t.elements).forEach(function(r){var o=t.elements[r],s=t.attributes[r]||{},i=Object.keys(t.styles.hasOwnProperty(r)?t.styles[r]:n[r]),a=i.reduce(function(l,c){return l[c]="",l},{});!Pt(o)||!Yt(o)||(Object.assign(o.style,a),Object.keys(s).forEach(function(l){o.removeAttribute(l)}))})}}var kd={name:"applyStyles",enabled:!0,phase:"write",fn:Lw,effect:Dw,requires:["computeStyles"]};function Gt(e){return e.split("-")[0]}var tr=Math.max,As=Math.min,jr=Math.round;function Hr(e,t){t===void 0&&(t=!1);var n=e.getBoundingClientRect(),r=1,o=1;if(Pt(e)&&t){var s=e.offsetHeight,i=e.offsetWidth;i>0&&(r=jr(n.width)/i||1),s>0&&(o=jr(n.height)/s||1)}return{width:n.width/r,height:n.height/o,top:n.top/o,right:n.right/r,bottom:n.bottom/o,left:n.left/r,x:n.left/r,y:n.top/o}}function nl(e){var t=Hr(e),n=e.offsetWidth,r=e.offsetHeight;return Math.abs(t.width-n)<=1&&(n=t.width),Math.abs(t.height-r)<=1&&(r=t.height),{x:e.offsetLeft,y:e.offsetTop,width:n,height:r}}function Fd(e,t){var n=t.getRootNode&&t.getRootNode();if(e.contains(t))return!0;if(n&&tl(n)){var r=t;do{if(r&&e.isSameNode(r))return!0;r=r.parentNode||r.host}while(r)}return!1}function dn(e){return Lt(e).getComputedStyle(e)}function Bw(e){return["table","td","th"].indexOf(Yt(e))>=0}function jn(e){return(($r(e)?e.ownerDocument:e.document)||window.document).documentElement}function Zs(e){return Yt(e)==="html"?e:e.assignedSlot||e.parentNode||(tl(e)?e.host:null)||jn(e)}function Eu(e){return!Pt(e)||dn(e).position==="fixed"?null:e.offsetParent}function $w(e){var t=navigator.userAgent.toLowerCase().indexOf("firefox")!==-1,n=navigator.userAgent.indexOf("Trident")!==-1;if(n&&Pt(e)){var r=dn(e);if(r.position==="fixed")return null}var o=Zs(e);for(tl(o)&&(o=o.host);Pt(o)&&["html","body"].indexOf(Yt(o))<0;){var s=dn(o);if(s.transform!=="none"||s.perspective!=="none"||s.contain==="paint"||["transform","perspective"].indexOf(s.willChange)!==-1||t&&s.willChange==="filter"||t&&s.filter&&s.filter!=="none")return o;o=o.parentNode}return null}function Ho(e){for(var t=Lt(e),n=Eu(e);n&&Bw(n)&&dn(n).position==="static";)n=Eu(n);return n&&(Yt(n)==="html"||Yt(n)==="body"&&dn(n).position==="static")?t:n||$w(e)||t}function rl(e){return["top","bottom"].indexOf(e)>=0?"x":"y"}function go(e,t,n){return tr(e,As(t,n))}function jw(e,t,n){var r=go(e,t,n);return r>n?n:r}function Ld(){return{top:0,right:0,bottom:0,left:0}}function Dd(e){return Object.assign({},Ld(),e)}function Bd(e,t){return t.reduce(function(n,r){return n[r]=e,n},{})}var Hw=function(e,t){return e=typeof e=="function"?e(Object.assign({},t.rects,{placement:t.placement})):e,Dd(typeof e!="number"?e:Bd(e,jo))};function Vw(e){var t,n=e.state,r=e.name,o=e.options,s=n.elements.arrow,i=n.modifiersData.popperOffsets,a=Gt(n.placement),l=rl(a),c=[vt,Tt].indexOf(a)>=0,u=c?"height":"width";if(!(!s||!i)){var f=Hw(o.padding,n),p=nl(s),d=l==="y"?_t:vt,m=l==="y"?Ct:Tt,h=n.rects.reference[u]+n.rects.reference[l]-i[l]-n.rects.popper[u],S=i[l]-n.rects.reference[l],b=Ho(s),C=b?l==="y"?b.clientHeight||0:b.clientWidth||0:0,y=h/2-S/2,E=f[d],N=C-p[u]-f[m],z=C/2-p[u]/2+y,D=go(E,z,N),A=l;n.modifiersData[r]=(t={},t[A]=D,t.centerOffset=D-z,t)}}function Ww(e){var t=e.state,n=e.options,r=n.element,o=r===void 0?"[data-popper-arrow]":r;o!=null&&(typeof o=="string"&&(o=t.elements.popper.querySelector(o),!o)||!Fd(t.elements.popper,o)||(t.elements.arrow=o))}var zw={name:"arrow",enabled:!0,phase:"main",fn:Vw,effect:Ww,requires:["popperOffsets"],requiresIfExists:["preventOverflow"]};function Vr(e){return e.split("-")[1]}var Uw={top:"auto",right:"auto",bottom:"auto",left:"auto"};function Gw(e){var t=e.x,n=e.y,r=window,o=r.devicePixelRatio||1;return{x:jr(t*o)/o||0,y:jr(n*o)/o||0}}function Pu(e){var t,n=e.popper,r=e.popperRect,o=e.placement,s=e.variation,i=e.offsets,a=e.position,l=e.gpuAcceleration,c=e.adaptive,u=e.roundOffsets,f=e.isFixed,p=i.x,d=p===void 0?0:p,m=i.y,h=m===void 0?0:m,S=typeof u=="function"?u({x:d,y:h}):{x:d,y:h};d=S.x,h=S.y;var b=i.hasOwnProperty("x"),C=i.hasOwnProperty("y"),y=vt,E=_t,N=window;if(c){var z=Ho(n),D="clientHeight",A="clientWidth";if(z===Lt(n)&&(z=jn(n),dn(z).position!=="static"&&a==="absolute"&&(D="scrollHeight",A="scrollWidth")),z=z,o===_t||(o===vt||o===Tt)&&s===Ao){E=Ct;var v=f&&z===N&&N.visualViewport?N.visualViewport.height:z[D];h-=v-r.height,h*=l?1:-1}if(o===vt||(o===_t||o===Ct)&&s===Ao){y=Tt;var R=f&&z===N&&N.visualViewport?N.visualViewport.width:z[A];d-=R-r.width,d*=l?1:-1}}var U=Object.assign({position:a},c&&Uw),I=u===!0?Gw({x:d,y:h}):{x:d,y:h};if(d=I.x,h=I.y,l){var M;return Object.assign({},U,(M={},M[E]=C?"0":"",M[y]=b?"0":"",M.transform=(N.devicePixelRatio||1)<=1?"translate("+d+"px, "+h+"px)":"translate3d("+d+"px, "+h+"px, 0)",M))}return Object.assign({},U,(t={},t[E]=C?h+"px":"",t[y]=b?d+"px":"",t.transform="",t))}function Kw(e){var t=e.state,n=e.options,r=n.gpuAcceleration,o=r===void 0?!0:r,s=n.adaptive,i=s===void 0?!0:s,a=n.roundOffsets,l=a===void 0?!0:a,c={placement:Gt(t.placement),variation:Vr(t.placement),popper:t.elements.popper,popperRect:t.rects.popper,gpuAcceleration:o,isFixed:t.options.strategy==="fixed"};t.modifiersData.popperOffsets!=null&&(t.styles.popper=Object.assign({},t.styles.popper,Pu(Object.assign({},c,{offsets:t.modifiersData.popperOffsets,position:t.options.strategy,adaptive:i,roundOffsets:l})))),t.modifiersData.arrow!=null&&(t.styles.arrow=Object.assign({},t.styles.arrow,Pu(Object.assign({},c,{offsets:t.modifiersData.arrow,position:"absolute",adaptive:!1,roundOffsets:l})))),t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-placement":t.placement})}var $d={name:"computeStyles",enabled:!0,phase:"beforeWrite",fn:Kw,data:{}},Zo={passive:!0};function qw(e){var t=e.state,n=e.instance,r=e.options,o=r.scroll,s=o===void 0?!0:o,i=r.resize,a=i===void 0?!0:i,l=Lt(t.elements.popper),c=[].concat(t.scrollParents.reference,t.scrollParents.popper);return s&&c.forEach(function(u){u.addEventListener("scroll",n.update,Zo)}),a&&l.addEventListener("resize",n.update,Zo),function(){s&&c.forEach(function(u){u.removeEventListener("scroll",n.update,Zo)}),a&&l.removeEventListener("resize",n.update,Zo)}}var jd={name:"eventListeners",enabled:!0,phase:"write",fn:function(){},effect:qw,data:{}},Jw={left:"right",right:"left",bottom:"top",top:"bottom"};function cs(e){return e.replace(/left|right|bottom|top/g,function(t){return Jw[t]})}var Yw={start:"end",end:"start"};function Cu(e){return e.replace(/start|end/g,function(t){return Yw[t]})}function ol(e){var t=Lt(e),n=t.pageXOffset,r=t.pageYOffset;return{scrollLeft:n,scrollTop:r}}function sl(e){return Hr(jn(e)).left+ol(e).scrollLeft}function Xw(e){var t=Lt(e),n=jn(e),r=t.visualViewport,o=n.clientWidth,s=n.clientHeight,i=0,a=0;return r&&(o=r.width,s=r.height,/^((?!chrome|android).)*safari/i.test(navigator.userAgent)||(i=r.offsetLeft,a=r.offsetTop)),{width:o,height:s,x:i+sl(e),y:a}}function Zw(e){var t,n=jn(e),r=ol(e),o=(t=e.ownerDocument)==null?void 0:t.body,s=tr(n.scrollWidth,n.clientWidth,o?o.scrollWidth:0,o?o.clientWidth:0),i=tr(n.scrollHeight,n.clientHeight,o?o.scrollHeight:0,o?o.clientHeight:0),a=-r.scrollLeft+sl(e),l=-r.scrollTop;return dn(o||n).direction==="rtl"&&(a+=tr(n.clientWidth,o?o.clientWidth:0)-s),{width:s,height:i,x:a,y:l}}function il(e){var t=dn(e),n=t.overflow,r=t.overflowX,o=t.overflowY;return/auto|scroll|overlay|hidden/.test(n+o+r)}function Hd(e){return["html","body","#document"].indexOf(Yt(e))>=0?e.ownerDocument.body:Pt(e)&&il(e)?e:Hd(Zs(e))}function _o(e,t){var n;t===void 0&&(t=[]);var r=Hd(e),o=r===((n=e.ownerDocument)==null?void 0:n.body),s=Lt(r),i=o?[s].concat(s.visualViewport||[],il(r)?r:[]):r,a=t.concat(i);return o?a:a.concat(_o(Zs(i)))}function ta(e){return Object.assign({},e,{left:e.x,top:e.y,right:e.x+e.width,bottom:e.y+e.height})}function Qw(e){var t=Hr(e);return t.top=t.top+e.clientTop,t.left=t.left+e.clientLeft,t.bottom=t.top+e.clientHeight,t.right=t.left+e.clientWidth,t.width=e.clientWidth,t.height=e.clientHeight,t.x=t.left,t.y=t.top,t}function Tu(e,t){return t===Nd?ta(Xw(e)):$r(t)?Qw(t):ta(Zw(jn(e)))}function ex(e){var t=_o(Zs(e)),n=["absolute","fixed"].indexOf(dn(e).position)>=0,r=n&&Pt(e)?Ho(e):e;return $r(r)?t.filter(function(o){return $r(o)&&Fd(o,r)&&Yt(o)!=="body"}):[]}function tx(e,t,n){var r=t==="clippingParents"?ex(e):[].concat(t),o=[].concat(r,[n]),s=o[0],i=o.reduce(function(a,l){var c=Tu(e,l);return a.top=tr(c.top,a.top),a.right=As(c.right,a.right),a.bottom=As(c.bottom,a.bottom),a.left=tr(c.left,a.left),a},Tu(e,s));return i.width=i.right-i.left,i.height=i.bottom-i.top,i.x=i.left,i.y=i.top,i}function Vd(e){var t=e.reference,n=e.element,r=e.placement,o=r?Gt(r):null,s=r?Vr(r):null,i=t.x+t.width/2-n.width/2,a=t.y+t.height/2-n.height/2,l;switch(o){case _t:l={x:i,y:t.y-n.height};break;case Ct:l={x:i,y:t.y+t.height};break;case Tt:l={x:t.x+t.width,y:a};break;case vt:l={x:t.x-n.width,y:a};break;default:l={x:t.x,y:t.y}}var c=o?rl(o):null;if(c!=null){var u=c==="y"?"height":"width";switch(s){case Br:l[c]=l[c]-(t[u]/2-n[u]/2);break;case Ao:l[c]=l[c]+(t[u]/2-n[u]/2);break}}return l}function Io(e,t){t===void 0&&(t={});var n=t,r=n.placement,o=r===void 0?e.placement:r,s=n.boundary,i=s===void 0?Ew:s,a=n.rootBoundary,l=a===void 0?Nd:a,c=n.elementContext,u=c===void 0?eo:c,f=n.altBoundary,p=f===void 0?!1:f,d=n.padding,m=d===void 0?0:d,h=Dd(typeof m!="number"?m:Bd(m,jo)),S=u===eo?Pw:eo,b=e.rects.popper,C=e.elements[p?S:u],y=tx($r(C)?C:C.contextElement||jn(e.elements.popper),i,l),E=Hr(e.elements.reference),N=Vd({reference:E,element:b,placement:o}),z=ta(Object.assign({},b,N)),D=u===eo?z:E,A={top:y.top-D.top+h.top,bottom:D.bottom-y.bottom+h.bottom,left:y.left-D.left+h.left,right:D.right-y.right+h.right},v=e.modifiersData.offset;if(u===eo&&v){var R=v[o];Object.keys(A).forEach(function(U){var I=[Tt,Ct].indexOf(U)>=0?1:-1,M=[_t,Ct].indexOf(U)>=0?"y":"x";A[U]+=R[M]*I})}return A}function nx(e,t){t===void 0&&(t={});var n=t,r=n.placement,o=n.boundary,s=n.rootBoundary,i=n.padding,a=n.flipVariations,l=n.allowedAutoPlacements,c=l===void 0?el:l,u=Vr(r),f=u?a?Su:Su.filter(function(m){return Vr(m)===u}):jo,p=f.filter(function(m){return c.indexOf(m)>=0});p.length===0&&(p=f);var d=p.reduce(function(m,h){return m[h]=Io(e,{placement:h,boundary:o,rootBoundary:s,padding:i})[Gt(h)],m},{});return Object.keys(d).sort(function(m,h){return d[m]-d[h]})}function rx(e){if(Gt(e)===Qa)return[];var t=cs(e);return[Cu(e),t,Cu(t)]}function ox(e){var t=e.state,n=e.options,r=e.name;if(!t.modifiersData[r]._skip){for(var o=n.mainAxis,s=o===void 0?!0:o,i=n.altAxis,a=i===void 0?!0:i,l=n.fallbackPlacements,c=n.padding,u=n.boundary,f=n.rootBoundary,p=n.altBoundary,d=n.flipVariations,m=d===void 0?!0:d,h=n.allowedAutoPlacements,S=t.options.placement,b=Gt(S),C=b===S,y=l||(C||!m?[cs(S)]:rx(S)),E=[S].concat(y).reduce(function(_e,Te){return _e.concat(Gt(Te)===Qa?nx(t,{placement:Te,boundary:u,rootBoundary:f,padding:c,flipVariations:m,allowedAutoPlacements:h}):Te)},[]),N=t.rects.reference,z=t.rects.popper,D=new Map,A=!0,v=E[0],R=0;R<E.length;R++){var U=E[R],I=Gt(U),M=Vr(U)===Br,W=[_t,Ct].indexOf(I)>=0,X=W?"width":"height",G=Io(t,{placement:U,boundary:u,rootBoundary:f,altBoundary:p,padding:c}),O=W?M?Tt:vt:M?Ct:_t;N[X]>z[X]&&(O=cs(O));var w=cs(O),V=[];if(s&&V.push(G[I]<=0),a&&V.push(G[O]<=0,G[w]<=0),V.every(function(_e){return _e})){v=U,A=!1;break}D.set(U,V)}if(A)for(var ce=m?3:1,me=function(_e){var Te=E.find(function(ke){var P=D.get(ke);if(P)return P.slice(0,_e).every(function(j){return j})});if(Te)return v=Te,"break"},ne=ce;ne>0;ne--){var ge=me(ne);if(ge==="break")break}t.placement!==v&&(t.modifiersData[r]._skip=!0,t.placement=v,t.reset=!0)}}var sx={name:"flip",enabled:!0,phase:"main",fn:ox,requiresIfExists:["offset"],data:{_skip:!1}};function Au(e,t,n){return n===void 0&&(n={x:0,y:0}),{top:e.top-t.height-n.y,right:e.right-t.width+n.x,bottom:e.bottom-t.height+n.y,left:e.left-t.width-n.x}}function Iu(e){return[_t,Tt,Ct,vt].some(function(t){return e[t]>=0})}function ix(e){var t=e.state,n=e.name,r=t.rects.reference,o=t.rects.popper,s=t.modifiersData.preventOverflow,i=Io(t,{elementContext:"reference"}),a=Io(t,{altBoundary:!0}),l=Au(i,r),c=Au(a,o,s),u=Iu(l),f=Iu(c);t.modifiersData[n]={referenceClippingOffsets:l,popperEscapeOffsets:c,isReferenceHidden:u,hasPopperEscaped:f},t.attributes.popper=Object.assign({},t.attributes.popper,{"data-popper-reference-hidden":u,"data-popper-escaped":f})}var ax={name:"hide",enabled:!0,phase:"main",requiresIfExists:["preventOverflow"],fn:ix};function lx(e,t,n){var r=Gt(e),o=[vt,_t].indexOf(r)>=0?-1:1,s=typeof n=="function"?n(Object.assign({},t,{placement:e})):n,i=s[0],a=s[1];return i=i||0,a=(a||0)*o,[vt,Tt].indexOf(r)>=0?{x:a,y:i}:{x:i,y:a}}function cx(e){var t=e.state,n=e.options,r=e.name,o=n.offset,s=o===void 0?[0,0]:o,i=el.reduce(function(u,f){return u[f]=lx(f,t.rects,s),u},{}),a=i[t.placement],l=a.x,c=a.y;t.modifiersData.popperOffsets!=null&&(t.modifiersData.popperOffsets.x+=l,t.modifiersData.popperOffsets.y+=c),t.modifiersData[r]=i}var ux={name:"offset",enabled:!0,phase:"main",requires:["popperOffsets"],fn:cx};function fx(e){var t=e.state,n=e.name;t.modifiersData[n]=Vd({reference:t.rects.reference,element:t.rects.popper,placement:t.placement})}var Wd={name:"popperOffsets",enabled:!0,phase:"read",fn:fx,data:{}};function px(e){return e==="x"?"y":"x"}function dx(e){var t=e.state,n=e.options,r=e.name,o=n.mainAxis,s=o===void 0?!0:o,i=n.altAxis,a=i===void 0?!1:i,l=n.boundary,c=n.rootBoundary,u=n.altBoundary,f=n.padding,p=n.tether,d=p===void 0?!0:p,m=n.tetherOffset,h=m===void 0?0:m,S=Io(t,{boundary:l,rootBoundary:c,padding:f,altBoundary:u}),b=Gt(t.placement),C=Vr(t.placement),y=!C,E=rl(b),N=px(E),z=t.modifiersData.popperOffsets,D=t.rects.reference,A=t.rects.popper,v=typeof h=="function"?h(Object.assign({},t.rects,{placement:t.placement})):h,R=typeof v=="number"?{mainAxis:v,altAxis:v}:Object.assign({mainAxis:0,altAxis:0},v),U=t.modifiersData.offset?t.modifiersData.offset[t.placement]:null,I={x:0,y:0};if(z){if(s){var M,W=E==="y"?_t:vt,X=E==="y"?Ct:Tt,G=E==="y"?"height":"width",O=z[E],w=O+S[W],V=O-S[X],ce=d?-A[G]/2:0,me=C===Br?D[G]:A[G],ne=C===Br?-A[G]:-D[G],ge=t.elements.arrow,_e=d&&ge?nl(ge):{width:0,height:0},Te=t.modifiersData["arrow#persistent"]?t.modifiersData["arrow#persistent"].padding:Ld(),ke=Te[W],P=Te[X],j=go(0,D[G],_e[G]),Z=y?D[G]/2-ce-j-ke-R.mainAxis:me-j-ke-R.mainAxis,se=y?-D[G]/2+ce+j+P+R.mainAxis:ne+j+P+R.mainAxis,he=t.elements.arrow&&Ho(t.elements.arrow),g=he?E==="y"?he.clientTop||0:he.clientLeft||0:0,_=(M=U==null?void 0:U[E])!=null?M:0,T=O+Z-_-g,L=O+se-_,$=go(d?As(w,T):w,O,d?tr(V,L):V);z[E]=$,I[E]=$-O}if(a){var F,ee=E==="x"?_t:vt,J=E==="x"?Ct:Tt,K=z[N],H=N==="y"?"height":"width",ue=K+S[ee],te=K-S[J],ae=[_t,vt].indexOf(b)!==-1,pe=(F=U==null?void 0:U[N])!=null?F:0,ve=ae?ue:K-D[H]-A[H]-pe+R.altAxis,Oe=ae?K+D[H]+A[H]-pe-R.altAxis:te,Ce=d&&ae?jw(ve,K,Oe):go(d?ve:ue,K,d?Oe:te);z[N]=Ce,I[N]=Ce-K}t.modifiersData[r]=I}}var mx={name:"preventOverflow",enabled:!0,phase:"main",fn:dx,requiresIfExists:["offset"]};function hx(e){return{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}}function gx(e){return e===Lt(e)||!Pt(e)?ol(e):hx(e)}function _x(e){var t=e.getBoundingClientRect(),n=jr(t.width)/e.offsetWidth||1,r=jr(t.height)/e.offsetHeight||1;return n!==1||r!==1}function vx(e,t,n){n===void 0&&(n=!1);var r=Pt(t),o=Pt(t)&&_x(t),s=jn(t),i=Hr(e,o),a={scrollLeft:0,scrollTop:0},l={x:0,y:0};return(r||!r&&!n)&&((Yt(t)!=="body"||il(s))&&(a=gx(t)),Pt(t)?(l=Hr(t,!0),l.x+=t.clientLeft,l.y+=t.clientTop):s&&(l.x=sl(s))),{x:i.left+a.scrollLeft-l.x,y:i.top+a.scrollTop-l.y,width:i.width,height:i.height}}function yx(e){var t=new Map,n=new Set,r=[];e.forEach(function(s){t.set(s.name,s)});function o(s){n.add(s.name);var i=[].concat(s.requires||[],s.requiresIfExists||[]);i.forEach(function(a){if(!n.has(a)){var l=t.get(a);l&&o(l)}}),r.push(s)}return e.forEach(function(s){n.has(s.name)||o(s)}),r}function bx(e){var t=yx(e);return Fw.reduce(function(n,r){return n.concat(t.filter(function(o){return o.phase===r}))},[])}function wx(e){var t;return function(){return t||(t=new Promise(function(n){Promise.resolve().then(function(){t=void 0,n(e())})})),t}}function xx(e){var t=e.reduce(function(n,r){var o=n[r.name];return n[r.name]=o?Object.assign({},o,r,{options:Object.assign({},o.options,r.options),data:Object.assign({},o.data,r.data)}):r,n},{});return Object.keys(t).map(function(n){return t[n]})}var Ou={placement:"bottom",modifiers:[],strategy:"absolute"};function Mu(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return!t.some(function(r){return!(r&&typeof r.getBoundingClientRect=="function")})}function al(e){e===void 0&&(e={});var t=e,n=t.defaultModifiers,r=n===void 0?[]:n,o=t.defaultOptions,s=o===void 0?Ou:o;return function(i,a,l){l===void 0&&(l=s);var c={placement:"bottom",orderedModifiers:[],options:Object.assign({},Ou,s),modifiersData:{},elements:{reference:i,popper:a},attributes:{},styles:{}},u=[],f=!1,p={state:c,setOptions:function(h){var S=typeof h=="function"?h(c.options):h;m(),c.options=Object.assign({},s,c.options,S),c.scrollParents={reference:$r(i)?_o(i):i.contextElement?_o(i.contextElement):[],popper:_o(a)};var b=bx(xx([].concat(r,c.options.modifiers)));return c.orderedModifiers=b.filter(function(C){return C.enabled}),d(),p.update()},forceUpdate:function(){if(!f){var h=c.elements,S=h.reference,b=h.popper;if(Mu(S,b)){c.rects={reference:vx(S,Ho(b),c.options.strategy==="fixed"),popper:nl(b)},c.reset=!1,c.placement=c.options.placement,c.orderedModifiers.forEach(function(A){return c.modifiersData[A.name]=Object.assign({},A.data)});for(var C=0;C<c.orderedModifiers.length;C++){if(c.reset===!0){c.reset=!1,C=-1;continue}var y=c.orderedModifiers[C],E=y.fn,N=y.options,z=N===void 0?{}:N,D=y.name;typeof E=="function"&&(c=E({state:c,options:z,name:D,instance:p})||c)}}}},update:wx(function(){return new Promise(function(h){p.forceUpdate(),h(c)})}),destroy:function(){m(),f=!0}};if(!Mu(i,a))return p;p.setOptions(l).then(function(h){!f&&l.onFirstUpdate&&l.onFirstUpdate(h)});function d(){c.orderedModifiers.forEach(function(h){var S=h.name,b=h.options,C=b===void 0?{}:b,y=h.effect;if(typeof y=="function"){var E=y({state:c,name:S,instance:p,options:C}),N=function(){};u.push(E||N)}})}function m(){u.forEach(function(h){return h()}),u=[]}return p}}al();var Sx=[jd,Wd,$d,kd];al({defaultModifiers:Sx});var Ex=[jd,Wd,$d,kd,ux,sx,mx,zw,ax],Px=al({defaultModifiers:Ex});const zd=qe({arrowOffset:{type:Number,default:5}}),Cx=["fixed","absolute"],Tx=qe({boundariesPadding:{type:Number,default:0},fallbackPlacements:{type:be(Array),default:void 0},gpuAcceleration:{type:Boolean,default:!0},offset:{type:Number,default:12},placement:{type:String,values:el,default:"bottom"},popperOptions:{type:be(Object),default:()=>({})},strategy:{type:String,values:Cx,default:"absolute"}}),Ud=qe({...Tx,...zd,id:String,style:{type:be([String,Array,Object])},className:{type:be([String,Array,Object])},effect:{type:be(String),default:"dark"},visible:Boolean,enterable:{type:Boolean,default:!0},pure:Boolean,focusOnShow:Boolean,trapping:Boolean,popperClass:{type:be([String,Array,Object])},popperStyle:{type:be([String,Array,Object])},referenceEl:{type:be(Object)},triggerTargetEl:{type:be(Object)},stopPopperMouseEvent:{type:Boolean,default:!0},virtualTriggering:Boolean,zIndex:Number,...Pd(["ariaLabel"]),loop:Boolean}),Ax={mouseenter:e=>e instanceof MouseEvent,mouseleave:e=>e instanceof MouseEvent,focus:()=>!0,blur:()=>!0,close:()=>!0},Ix=(e,t)=>{const n=B(!1),r=B();return{focusStartRef:r,trapped:n,onFocusAfterReleased:c=>{var u;((u=c.detail)==null?void 0:u.focusReason)!=="pointer"&&(r.value="first",t("blur"))},onFocusAfterTrapped:()=>{t("focus")},onFocusInTrap:c=>{e.visible&&!n.value&&(c.target&&(r.value=c.target),n.value=!0)},onFocusoutPrevented:c=>{e.trapping||(c.detail.focusReason==="pointer"&&c.preventDefault(),n.value=!1)},onReleaseRequested:()=>{n.value=!1,t("close")}}},Ox=(e,t=[])=>{const{placement:n,strategy:r,popperOptions:o}=e,s={placement:n,strategy:r,...o,modifiers:[...Rx(e),...t]};return Nx(s,o==null?void 0:o.modifiers),s},Mx=e=>{if(Ye)return ht(e)};function Rx(e){const{offset:t,gpuAcceleration:n,fallbackPlacements:r}=e;return[{name:"offset",options:{offset:[0,t??12]}},{name:"preventOverflow",options:{padding:{top:0,bottom:0,left:0,right:0}}},{name:"flip",options:{padding:5,fallbackPlacements:r}},{name:"computeStyles",options:{gpuAcceleration:n}}]}function Nx(e,t){t&&(e.modifiers=[...e.modifiers,...t??[]])}const kx=(e,t,n={})=>{const r={name:"updateState",enabled:!0,phase:"write",fn:({state:l})=>{const c=Fx(l);Object.assign(i.value,c)},requires:["computeStyles"]},o=k(()=>{const{onFirstUpdate:l,placement:c,strategy:u,modifiers:f}=x(n);return{onFirstUpdate:l,placement:c||"bottom",strategy:u||"absolute",modifiers:[...f||[],r,{name:"applyStyles",enabled:!1}]}}),s=Ea(),i=B({styles:{popper:{position:x(o).strategy,left:"0",top:"0"},arrow:{position:"absolute"}},attributes:{}}),a=()=>{s.value&&(s.value.destroy(),s.value=void 0)};return ye(o,l=>{const c=x(s);c&&c.setOptions(l)},{deep:!0}),ye([e,t],([l,c])=>{a(),!(!l||!c)&&(s.value=Px(l,c,x(o)))}),At(()=>{a()}),{state:k(()=>{var l;return{...((l=x(s))==null?void 0:l.state)||{}}}),styles:k(()=>x(i).styles),attributes:k(()=>x(i).attributes),update:()=>{var l;return(l=x(s))==null?void 0:l.update()},forceUpdate:()=>{var l;return(l=x(s))==null?void 0:l.forceUpdate()},instanceRef:k(()=>x(s))}};function Fx(e){const t=Object.keys(e.elements),n=Xi(t.map(o=>[o,e.styles[o]||{}])),r=Xi(t.map(o=>[o,e.attributes[o]]));return{styles:n,attributes:r}}const Lx=0,Dx=e=>{const{popperInstanceRef:t,contentRef:n,triggerRef:r,role:o}=Ae(Ya,void 0),s=B(),i=k(()=>e.arrowOffset),a=k(()=>({name:"eventListeners",enabled:!!e.visible})),l=k(()=>{var b;const C=x(s),y=(b=x(i))!=null?b:Lx;return{name:"arrow",enabled:!Nb(C),options:{element:C,padding:y}}}),c=k(()=>({onFirstUpdate:()=>{m()},...Ox(e,[x(l),x(a)])})),u=k(()=>Mx(e.referenceEl)||x(r)),{attributes:f,state:p,styles:d,update:m,forceUpdate:h,instanceRef:S}=kx(u,n,c);return ye(S,b=>t.value=b,{flush:"sync"}),st(()=>{ye(()=>{var b,C;return(C=(b=x(u))==null?void 0:b.getBoundingClientRect)==null?void 0:C.call(b)},()=>{m()})}),{attributes:f,arrowRef:s,contentRef:n,instanceRef:S,state:p,styles:d,role:o,forceUpdate:h,update:m}},Bx=(e,{attributes:t,styles:n,role:r})=>{const{nextZIndex:o}=md(),s=Be("popper"),i=k(()=>x(t).popper),a=B(Jt(e.zIndex)?e.zIndex:o()),l=k(()=>[s.b(),s.is("pure",e.pure),s.is(e.effect),e.popperClass]),c=k(()=>[{zIndex:x(a)},x(n).popper,e.popperStyle||{}]),u=k(()=>r.value==="dialog"?"false":void 0),f=k(()=>x(n).arrow||{});return{ariaModal:u,arrowStyle:f,contentAttrs:i,contentClass:l,contentStyle:c,contentZIndex:a,updateZIndex:()=>{a.value=Jt(e.zIndex)?e.zIndex:o()}}},$x=q({name:"ElPopperContent"}),jx=q({...$x,props:Ud,emits:Ax,setup(e,{expose:t,emit:n}){const r=e,{focusStartRef:o,trapped:s,onFocusAfterReleased:i,onFocusAfterTrapped:a,onFocusInTrap:l,onFocusoutPrevented:c,onReleaseRequested:u}=Ix(r,n),{attributes:f,arrowRef:p,contentRef:d,styles:m,instanceRef:h,role:S,update:b}=Dx(r),{ariaModal:C,arrowStyle:y,contentAttrs:E,contentClass:N,contentStyle:z,updateZIndex:D}=Bx(r,{styles:m,attributes:f,role:S}),A=Ae(pu,void 0);gt(Td,{arrowStyle:y,arrowRef:p}),A&&gt(pu,{...A,addInputId:ft,removeInputId:ft});let v;const R=(I=!0)=>{b(),I&&D()},U=()=>{R(!1),r.visible&&r.focusOnShow?s.value=!0:r.visible===!1&&(s.value=!1)};return st(()=>{ye(()=>r.triggerTargetEl,(I,M)=>{v==null||v(),v=void 0;const W=x(I||d.value),X=x(M||d.value);Mn(W)&&(v=ye([S,()=>r.ariaLabel,C,()=>r.id],G=>{["role","aria-label","aria-modal","id"].forEach((O,w)=>{Lr(G[w])?W.removeAttribute(O):W.setAttribute(O,G[w])})},{immediate:!0})),X!==W&&Mn(X)&&["role","aria-label","aria-modal","id"].forEach(G=>{X.removeAttribute(G)})},{immediate:!0}),ye(()=>r.visible,U,{immediate:!0})}),At(()=>{v==null||v(),v=void 0}),t({popperContentRef:d,popperInstanceRef:h,updatePopper:R,contentStyle:z}),(I,M)=>(Y(),ie("div",lr({ref_key:"contentRef",ref:d},x(E),{style:x(z),class:x(N),tabindex:"-1",onMouseenter:W=>I.$emit("mouseenter",W),onMouseleave:W=>I.$emit("mouseleave",W)}),[re(x(Sw),{loop:I.loop,trapped:x(s),"trap-on-focus-in":!0,"focus-trap-el":x(d),"focus-start-el":x(o),onFocusAfterTrapped:x(a),onFocusAfterReleased:x(i),onFocusin:x(l),onFocusoutPrevented:x(c),onReleaseRequested:x(u)},{default:de(()=>[Re(I.$slots,"default")]),_:3},8,["loop","trapped","focus-trap-el","focus-start-el","onFocusAfterTrapped","onFocusAfterReleased","onFocusin","onFocusoutPrevented","onReleaseRequested"])],16,["onMouseenter","onMouseleave"]))}});var Hx=Ve(jx,[["__file","content.vue"]]);const Vx=$n(Z2),ll=Symbol("elTooltip"),Gd=qe({to:{type:be([String,Object]),required:!0},disabled:Boolean}),Kd=qe({...F1,...Ud,appendTo:{type:Gd.to.type},content:{type:String,default:""},rawContent:Boolean,persistent:Boolean,visible:{type:be(Boolean),default:null},transition:String,teleported:{type:Boolean,default:!0},disabled:Boolean,...Pd(["ariaLabel"])}),qd=qe({...Id,disabled:Boolean,trigger:{type:be([String,Array]),default:"hover"},triggerKeys:{type:be(Array),default:()=>[Ue.enter,Ue.numpadEnter,Ue.space]},focusOnTarget:Boolean}),Wx=Ys({type:be(Boolean),default:null}),zx=Ys({type:be(Function)}),Ux=e=>{const t=`update:${e}`,n=`onUpdate:${e}`,r=[t],o={[e]:Wx,[n]:zx};return{useModelToggle:({indicator:i,toggleReason:a,shouldHideWhenRouteChanges:l,shouldProceed:c,onShow:u,onHide:f})=>{const p=Xe(),{emit:d}=p,m=p.props,h=k(()=>le(m[n])),S=k(()=>m[e]===null),b=D=>{i.value!==!0&&(i.value=!0,a&&(a.value=D),le(u)&&u(D))},C=D=>{i.value!==!1&&(i.value=!1,a&&(a.value=D),le(f)&&f(D))},y=D=>{if(m.disabled===!0||le(c)&&!c())return;const A=h.value&&Ye;A&&d(t,!0),(S.value||!A)&&b(D)},E=D=>{if(m.disabled===!0||!Ye)return;const A=h.value&&Ye;A&&d(t,!1),(S.value||!A)&&C(D)},N=D=>{ho(D)&&(m.disabled&&D?h.value&&d(t,!1):i.value!==D&&(D?b():C()))},z=()=>{i.value?E():y()};return ye(()=>m[e],N),l&&p.appContext.config.globalProperties.$route!==void 0&&ye(()=>({...p.proxy.$route}),()=>{l.value&&i.value&&E()}),st(()=>{N(m[e])}),{hide:E,show:y,toggle:z,hasUpdateHandler:h}},useModelToggleProps:o,useModelToggleEmits:r}},{useModelToggleProps:Gx,useModelToggleEmits:Kx,useModelToggle:qx}=Ux("visible"),Jx=qe({...Ad,...Gx,...Kd,...qd,...zd,showArrow:{type:Boolean,default:!0}}),Yx=[...Kx,"before-show","before-hide","show","hide","open","close"],na=(e,t)=>oe(e)?e.includes(t):e===t,hr=(e,t,n)=>r=>{na(x(e),t)&&n(r)},Xx=q({name:"ElTooltipTrigger"}),Zx=q({...Xx,props:qd,setup(e,{expose:t}){const n=e,r=Be("tooltip"),{controlled:o,id:s,open:i,onOpen:a,onClose:l,onToggle:c}=Ae(ll,void 0),u=B(null),f=()=>{if(x(o)||n.disabled)return!0},p=br(n,"trigger"),d=nn(f,hr(p,"hover",E=>{a(E),n.focusOnTarget&&E.target&&Kt(()=>{$o(E.target,{preventScroll:!0})})})),m=nn(f,hr(p,"hover",l)),h=nn(f,hr(p,"click",E=>{E.button===0&&c(E)})),S=nn(f,hr(p,"focus",a)),b=nn(f,hr(p,"focus",l)),C=nn(f,hr(p,"contextmenu",E=>{E.preventDefault(),c(E)})),y=nn(f,E=>{const N=Gr(E);n.triggerKeys.includes(N)&&(E.preventDefault(),c(E))});return t({triggerRef:u}),(E,N)=>(Y(),He(x(lw),{id:x(s),"virtual-ref":E.virtualRef,open:x(i),"virtual-triggering":E.virtualTriggering,class:De(x(r).e("trigger")),onBlur:x(b),onClick:x(h),onContextmenu:x(C),onFocus:x(S),onMouseenter:x(d),onMouseleave:x(m),onKeydown:x(y)},{default:de(()=>[Re(E.$slots,"default")]),_:3},8,["id","virtual-ref","open","virtual-triggering","class","onBlur","onClick","onContextmenu","onFocus","onMouseenter","onMouseleave","onKeydown"]))}});var Qx=Ve(Zx,[["__file","trigger.vue"]]);const eS=q({__name:"teleport",props:Gd,setup(e){return(t,n)=>t.disabled?Re(t.$slots,"default",{key:0}):(Y(),He(dh,{key:1,to:t.to},[Re(t.$slots,"default")],8,["to"]))}});var tS=Ve(eS,[["__file","teleport.vue"]]);const nS=$n(tS),Jd=()=>{const e=$a(),t=Cd(),n=k(()=>`${e.value}-popper-container-${t.prefix}`),r=k(()=>`#${n.value}`);return{id:n,selector:r}},rS=e=>{const t=document.createElement("div");return t.id=e,document.body.appendChild(t),t},oS=()=>{const{id:e,selector:t}=Jd();return Kf(()=>{Ye&&(document.body.querySelector(t.value)||rS(e.value))}),{id:e,selector:t}},zE=e=>[...new Set(e)],sS=e=>!e&&e!==0?[]:oe(e)?e:[e],iS=q({name:"ElTooltipContent",inheritAttrs:!1}),aS=q({...iS,props:Kd,setup(e,{expose:t}){const n=e,{selector:r}=Jd(),o=Be("tooltip"),s=B(),i=ud(()=>{var w;return(w=s.value)==null?void 0:w.popperContentRef});let a;const{controlled:l,id:c,open:u,trigger:f,onClose:p,onOpen:d,onShow:m,onHide:h,onBeforeShow:S,onBeforeHide:b}=Ae(ll,void 0),C=k(()=>n.transition||`${o.namespace.value}-fade-in-linear`),y=k(()=>n.persistent);At(()=>{a==null||a()});const E=k(()=>x(y)?!0:x(u)),N=k(()=>n.disabled?!1:x(u)),z=k(()=>n.appendTo||r.value),D=k(()=>{var w;return(w=n.style)!=null?w:{}}),A=B(!0),v=()=>{h(),O()&&$o(document.body,{preventScroll:!0}),A.value=!0},R=()=>{if(x(l))return!0},U=nn(R,()=>{n.enterable&&na(x(f),"hover")&&d()}),I=nn(R,()=>{na(x(f),"hover")&&p()}),M=()=>{var w,V;(V=(w=s.value)==null?void 0:w.updatePopper)==null||V.call(w),S==null||S()},W=()=>{b==null||b()},X=()=>{m()},G=()=>{n.virtualTriggering||p()},O=w=>{var V;const ce=(V=s.value)==null?void 0:V.popperContentRef,me=(w==null?void 0:w.relatedTarget)||document.activeElement;return ce==null?void 0:ce.contains(me)};return ye(()=>x(u),w=>{w?(A.value=!1,a=r1(i,()=>{if(x(l))return;sS(x(f)).every(ce=>ce!=="hover"&&ce!=="focus")&&p()},{detectIframe:!0})):a==null||a()},{flush:"post"}),ye(()=>n.content,()=>{var w,V;(V=(w=s.value)==null?void 0:w.updatePopper)==null||V.call(w)}),t({contentRef:s,isFocusInsideContent:O}),(w,V)=>(Y(),He(x(nS),{disabled:!w.teleported,to:x(z)},{default:de(()=>[x(E)||!A.value?(Y(),He(Do,{key:0,name:x(C),appear:!x(y),onAfterLeave:v,onBeforeEnter:M,onAfterEnter:X,onBeforeLeave:W,persisted:""},{default:de(()=>[Wr(re(x(Hx),lr({id:x(c),ref_key:"contentRef",ref:s},w.$attrs,{"aria-label":w.ariaLabel,"aria-hidden":A.value,"boundaries-padding":w.boundariesPadding,"fallback-placements":w.fallbackPlacements,"gpu-acceleration":w.gpuAcceleration,offset:w.offset,placement:w.placement,"popper-options":w.popperOptions,"arrow-offset":w.arrowOffset,strategy:w.strategy,effect:w.effect,enterable:w.enterable,pure:w.pure,"popper-class":w.popperClass,"popper-style":[w.popperStyle,x(D)],"reference-el":w.referenceEl,"trigger-target-el":w.triggerTargetEl,visible:x(N),"z-index":w.zIndex,loop:w.loop,onMouseenter:x(U),onMouseleave:x(I),onBlur:G,onClose:x(p)}),{default:de(()=>[Re(w.$slots,"default")]),_:3},16,["id","aria-label","aria-hidden","boundaries-padding","fallback-placements","gpu-acceleration","offset","placement","popper-options","arrow-offset","strategy","effect","enterable","pure","popper-class","popper-style","reference-el","trigger-target-el","visible","z-index","loop","onMouseenter","onMouseleave","onClose"]),[[zs,x(N)]])]),_:3},8,["name","appear"])):On("v-if",!0)]),_:3},8,["disabled","to"]))}});var lS=Ve(aS,[["__file","content.vue"]]);const cS=q({name:"ElTooltip"}),uS=q({...cS,props:Jx,emits:Yx,setup(e,{expose:t,emit:n}){const r=e;oS();const o=Be("tooltip"),s=U2(),i=B(),a=B(),l=()=>{var y;const E=x(i);E&&((y=E.popperInstanceRef)==null||y.update())},c=B(!1),u=B(),{show:f,hide:p,hasUpdateHandler:d}=qx({indicator:c,toggleReason:u}),{onOpen:m,onClose:h}=L1({showAfter:br(r,"showAfter"),hideAfter:br(r,"hideAfter"),autoClose:br(r,"autoClose"),open:f,close:p}),S=k(()=>ho(r.visible)&&!d.value),b=k(()=>[o.b(),r.popperClass]);gt(ll,{controlled:S,id:s,open:Or(c),trigger:br(r,"trigger"),onOpen:m,onClose:h,onToggle:y=>{x(c)?h(y):m(y)},onShow:()=>{n("show",u.value)},onHide:()=>{n("hide",u.value)},onBeforeShow:()=>{n("before-show",u.value)},onBeforeHide:()=>{n("before-hide",u.value)},updatePopper:l}),ye(()=>r.disabled,y=>{y&&c.value&&(c.value=!1)});const C=y=>{var E;return(E=a.value)==null?void 0:E.isFocusInsideContent(y)};return Uf(()=>c.value&&p()),t({popperRef:i,contentRef:a,isFocusInsideContent:C,updatePopper:l,onOpen:m,onClose:h,hide:p}),(y,E)=>(Y(),He(x(Vx),{ref_key:"popperRef",ref:i,role:y.role},{default:de(()=>[re(Qx,{disabled:y.disabled,trigger:y.trigger,"trigger-keys":y.triggerKeys,"virtual-ref":y.virtualRef,"virtual-triggering":y.virtualTriggering,"focus-on-target":y.focusOnTarget},{default:de(()=>[y.$slots.default?Re(y.$slots,"default",{key:0}):On("v-if",!0)]),_:3},8,["disabled","trigger","trigger-keys","virtual-ref","virtual-triggering","focus-on-target"]),re(lS,{ref_key:"contentRef",ref:a,"aria-label":y.ariaLabel,"boundaries-padding":y.boundariesPadding,content:y.content,disabled:y.disabled,effect:y.effect,enterable:y.enterable,"fallback-placements":y.fallbackPlacements,"hide-after":y.hideAfter,"gpu-acceleration":y.gpuAcceleration,offset:y.offset,persistent:y.persistent,"popper-class":x(b),"popper-style":y.popperStyle,placement:y.placement,"popper-options":y.popperOptions,"arrow-offset":y.arrowOffset,pure:y.pure,"raw-content":y.rawContent,"reference-el":y.referenceEl,"trigger-target-el":y.triggerTargetEl,"show-after":y.showAfter,strategy:y.strategy,teleported:y.teleported,transition:y.transition,"virtual-triggering":y.virtualTriggering,"z-index":y.zIndex,"append-to":y.appendTo,loop:y.loop},{default:de(()=>[Re(y.$slots,"content",{},()=>[y.rawContent?(Y(),ie("span",{key:0,innerHTML:y.content},null,8,["innerHTML"])):(Y(),ie("span",{key:1},No(y.content),1))]),y.showArrow?(Y(),He(x(tw),{key:0})):On("v-if",!0)]),_:3},8,["aria-label","boundaries-padding","content","disabled","effect","enterable","fallback-placements","hide-after","gpu-acceleration","offset","persistent","popper-class","popper-style","placement","popper-options","arrow-offset","pure","raw-content","reference-el","trigger-target-el","show-after","strategy","teleported","transition","virtual-triggering","z-index","append-to","loop"])]),_:3},8,["role"]))}});var fS=Ve(uS,[["__file","tooltip.vue"]]);const Yd=$n(fS),pS=qe({value:{type:[String,Number],default:""},max:{type:Number,default:99},isDot:Boolean,hidden:Boolean,type:{type:String,values:["primary","success","warning","info","danger"],default:"danger"},showZero:{type:Boolean,default:!0},color:String,badgeStyle:{type:be([String,Object,Array])},offset:{type:be(Array),default:[0,0]},badgeClass:{type:String}}),dS=q({name:"ElBadge"}),mS=q({...dS,props:pS,setup(e,{expose:t}){const n=e,r=Be("badge"),o=k(()=>n.isDot?"":Jt(n.value)&&Jt(n.max)?n.max<n.value?`${n.max}+`:`${n.value}`:`${n.value}`),s=k(()=>{var i,a,l,c,u;return[{backgroundColor:n.color,marginRight:Qi(-((a=(i=n.offset)==null?void 0:i[0])!=null?a:0)),marginTop:Qi((c=(l=n.offset)==null?void 0:l[1])!=null?c:0)},(u=n.badgeStyle)!=null?u:{}]});return t({content:o}),(i,a)=>(Y(),ie("div",{class:De(x(r).b())},[Re(i.$slots,"default"),re(Do,{name:`${x(r).namespace.value}-zoom-in-center`,persisted:""},{default:de(()=>[Wr(Q("sup",{class:De([x(r).e("content"),x(r).em("content",i.type),x(r).is("fixed",!!i.$slots.default),x(r).is("dot",i.isDot),x(r).is("hide-zero",!i.showZero&&i.value===0),i.badgeClass]),style:Xt(x(s))},[Re(i.$slots,"content",{value:x(o)},()=>[ka(No(x(o)),1)])],6),[[zs,!i.hidden&&(x(o)||i.isDot||i.$slots.content)]])]),_:3},8,["name"])],2))}});var hS=Ve(mS,[["__file","badge.vue"]]);const gS=$n(hS);function et(e,t){_S(e)&&(e="100%");var n=vS(e);return e=t===360?e:Math.min(t,Math.max(0,parseFloat(e))),n&&(e=parseInt(String(e*t),10)/100),Math.abs(e-t)<1e-6?1:(t===360?e=(e<0?e%t+t:e%t)/parseFloat(String(t)):e=e%t/parseFloat(String(t)),e)}function Qo(e){return Math.min(1,Math.max(0,e))}function _S(e){return typeof e=="string"&&e.indexOf(".")!==-1&&parseFloat(e)===1}function vS(e){return typeof e=="string"&&e.indexOf("%")!==-1}function Xd(e){return e=parseFloat(e),(isNaN(e)||e<0||e>1)&&(e=1),e}function es(e){return e<=1?"".concat(Number(e)*100,"%"):e}function Yn(e){return e.length===1?"0"+e:String(e)}function yS(e,t,n){return{r:et(e,255)*255,g:et(t,255)*255,b:et(n,255)*255}}function Ru(e,t,n){e=et(e,255),t=et(t,255),n=et(n,255);var r=Math.max(e,t,n),o=Math.min(e,t,n),s=0,i=0,a=(r+o)/2;if(r===o)i=0,s=0;else{var l=r-o;switch(i=a>.5?l/(2-r-o):l/(r+o),r){case e:s=(t-n)/l+(t<n?6:0);break;case t:s=(n-e)/l+2;break;case n:s=(e-t)/l+4;break}s/=6}return{h:s,s:i,l:a}}function wi(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*(6*n):n<1/2?t:n<2/3?e+(t-e)*(2/3-n)*6:e}function bS(e,t,n){var r,o,s;if(e=et(e,360),t=et(t,100),n=et(n,100),t===0)o=n,s=n,r=n;else{var i=n<.5?n*(1+t):n+t-n*t,a=2*n-i;r=wi(a,i,e+1/3),o=wi(a,i,e),s=wi(a,i,e-1/3)}return{r:r*255,g:o*255,b:s*255}}function Nu(e,t,n){e=et(e,255),t=et(t,255),n=et(n,255);var r=Math.max(e,t,n),o=Math.min(e,t,n),s=0,i=r,a=r-o,l=r===0?0:a/r;if(r===o)s=0;else{switch(r){case e:s=(t-n)/a+(t<n?6:0);break;case t:s=(n-e)/a+2;break;case n:s=(e-t)/a+4;break}s/=6}return{h:s,s:l,v:i}}function wS(e,t,n){e=et(e,360)*6,t=et(t,100),n=et(n,100);var r=Math.floor(e),o=e-r,s=n*(1-t),i=n*(1-o*t),a=n*(1-(1-o)*t),l=r%6,c=[n,i,s,s,a,n][l],u=[a,n,n,i,s,s][l],f=[s,s,a,n,n,i][l];return{r:c*255,g:u*255,b:f*255}}function ku(e,t,n,r){var o=[Yn(Math.round(e).toString(16)),Yn(Math.round(t).toString(16)),Yn(Math.round(n).toString(16))];return r&&o[0].startsWith(o[0].charAt(1))&&o[1].startsWith(o[1].charAt(1))&&o[2].startsWith(o[2].charAt(1))?o[0].charAt(0)+o[1].charAt(0)+o[2].charAt(0):o.join("")}function xS(e,t,n,r,o){var s=[Yn(Math.round(e).toString(16)),Yn(Math.round(t).toString(16)),Yn(Math.round(n).toString(16)),Yn(SS(r))];return o&&s[0].startsWith(s[0].charAt(1))&&s[1].startsWith(s[1].charAt(1))&&s[2].startsWith(s[2].charAt(1))&&s[3].startsWith(s[3].charAt(1))?s[0].charAt(0)+s[1].charAt(0)+s[2].charAt(0)+s[3].charAt(0):s.join("")}function SS(e){return Math.round(parseFloat(e)*255).toString(16)}function Fu(e){return bt(e)/255}function bt(e){return parseInt(e,16)}function ES(e){return{r:e>>16,g:(e&65280)>>8,b:e&255}}var ra={aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyan:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkgrey:"#a9a9a9",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",goldenrod:"#daa520",gold:"#ffd700",gray:"#808080",green:"#008000",greenyellow:"#adff2f",grey:"#808080",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavenderblush:"#fff0f5",lavender:"#e6e6fa",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",rebeccapurple:"#663399",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",steelblue:"#4682b4",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",tomato:"#ff6347",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"};function PS(e){var t={r:0,g:0,b:0},n=1,r=null,o=null,s=null,i=!1,a=!1;return typeof e=="string"&&(e=AS(e)),typeof e=="object"&&(en(e.r)&&en(e.g)&&en(e.b)?(t=yS(e.r,e.g,e.b),i=!0,a=String(e.r).substr(-1)==="%"?"prgb":"rgb"):en(e.h)&&en(e.s)&&en(e.v)?(r=es(e.s),o=es(e.v),t=wS(e.h,r,o),i=!0,a="hsv"):en(e.h)&&en(e.s)&&en(e.l)&&(r=es(e.s),s=es(e.l),t=bS(e.h,r,s),i=!0,a="hsl"),Object.prototype.hasOwnProperty.call(e,"a")&&(n=e.a)),n=Xd(n),{ok:i,format:e.format||a,r:Math.min(255,Math.max(t.r,0)),g:Math.min(255,Math.max(t.g,0)),b:Math.min(255,Math.max(t.b,0)),a:n}}var CS="[-\\+]?\\d+%?",TS="[-\\+]?\\d*\\.\\d+%?",Rn="(?:".concat(TS,")|(?:").concat(CS,")"),xi="[\\s|\\(]+(".concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")\\s*\\)?"),Si="[\\s|\\(]+(".concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")[,|\\s]+(").concat(Rn,")\\s*\\)?"),It={CSS_UNIT:new RegExp(Rn),rgb:new RegExp("rgb"+xi),rgba:new RegExp("rgba"+Si),hsl:new RegExp("hsl"+xi),hsla:new RegExp("hsla"+Si),hsv:new RegExp("hsv"+xi),hsva:new RegExp("hsva"+Si),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/};function AS(e){if(e=e.trim().toLowerCase(),e.length===0)return!1;var t=!1;if(ra[e])e=ra[e],t=!0;else if(e==="transparent")return{r:0,g:0,b:0,a:0,format:"name"};var n=It.rgb.exec(e);return n?{r:n[1],g:n[2],b:n[3]}:(n=It.rgba.exec(e),n?{r:n[1],g:n[2],b:n[3],a:n[4]}:(n=It.hsl.exec(e),n?{h:n[1],s:n[2],l:n[3]}:(n=It.hsla.exec(e),n?{h:n[1],s:n[2],l:n[3],a:n[4]}:(n=It.hsv.exec(e),n?{h:n[1],s:n[2],v:n[3]}:(n=It.hsva.exec(e),n?{h:n[1],s:n[2],v:n[3],a:n[4]}:(n=It.hex8.exec(e),n?{r:bt(n[1]),g:bt(n[2]),b:bt(n[3]),a:Fu(n[4]),format:t?"name":"hex8"}:(n=It.hex6.exec(e),n?{r:bt(n[1]),g:bt(n[2]),b:bt(n[3]),format:t?"name":"hex"}:(n=It.hex4.exec(e),n?{r:bt(n[1]+n[1]),g:bt(n[2]+n[2]),b:bt(n[3]+n[3]),a:Fu(n[4]+n[4]),format:t?"name":"hex8"}:(n=It.hex3.exec(e),n?{r:bt(n[1]+n[1]),g:bt(n[2]+n[2]),b:bt(n[3]+n[3]),format:t?"name":"hex"}:!1)))))))))}function en(e){return!!It.CSS_UNIT.exec(String(e))}var IS=function(){function e(t,n){t===void 0&&(t=""),n===void 0&&(n={});var r;if(t instanceof e)return t;typeof t=="number"&&(t=ES(t)),this.originalInput=t;var o=PS(t);this.originalInput=t,this.r=o.r,this.g=o.g,this.b=o.b,this.a=o.a,this.roundA=Math.round(100*this.a)/100,this.format=(r=n.format)!==null&&r!==void 0?r:o.format,this.gradientType=n.gradientType,this.r<1&&(this.r=Math.round(this.r)),this.g<1&&(this.g=Math.round(this.g)),this.b<1&&(this.b=Math.round(this.b)),this.isValid=o.ok}return e.prototype.isDark=function(){return this.getBrightness()<128},e.prototype.isLight=function(){return!this.isDark()},e.prototype.getBrightness=function(){var t=this.toRgb();return(t.r*299+t.g*587+t.b*114)/1e3},e.prototype.getLuminance=function(){var t=this.toRgb(),n,r,o,s=t.r/255,i=t.g/255,a=t.b/255;return s<=.03928?n=s/12.92:n=Math.pow((s+.055)/1.055,2.4),i<=.03928?r=i/12.92:r=Math.pow((i+.055)/1.055,2.4),a<=.03928?o=a/12.92:o=Math.pow((a+.055)/1.055,2.4),.2126*n+.7152*r+.0722*o},e.prototype.getAlpha=function(){return this.a},e.prototype.setAlpha=function(t){return this.a=Xd(t),this.roundA=Math.round(100*this.a)/100,this},e.prototype.isMonochrome=function(){var t=this.toHsl().s;return t===0},e.prototype.toHsv=function(){var t=Nu(this.r,this.g,this.b);return{h:t.h*360,s:t.s,v:t.v,a:this.a}},e.prototype.toHsvString=function(){var t=Nu(this.r,this.g,this.b),n=Math.round(t.h*360),r=Math.round(t.s*100),o=Math.round(t.v*100);return this.a===1?"hsv(".concat(n,", ").concat(r,"%, ").concat(o,"%)"):"hsva(".concat(n,", ").concat(r,"%, ").concat(o,"%, ").concat(this.roundA,")")},e.prototype.toHsl=function(){var t=Ru(this.r,this.g,this.b);return{h:t.h*360,s:t.s,l:t.l,a:this.a}},e.prototype.toHslString=function(){var t=Ru(this.r,this.g,this.b),n=Math.round(t.h*360),r=Math.round(t.s*100),o=Math.round(t.l*100);return this.a===1?"hsl(".concat(n,", ").concat(r,"%, ").concat(o,"%)"):"hsla(".concat(n,", ").concat(r,"%, ").concat(o,"%, ").concat(this.roundA,")")},e.prototype.toHex=function(t){return t===void 0&&(t=!1),ku(this.r,this.g,this.b,t)},e.prototype.toHexString=function(t){return t===void 0&&(t=!1),"#"+this.toHex(t)},e.prototype.toHex8=function(t){return t===void 0&&(t=!1),xS(this.r,this.g,this.b,this.a,t)},e.prototype.toHex8String=function(t){return t===void 0&&(t=!1),"#"+this.toHex8(t)},e.prototype.toHexShortString=function(t){return t===void 0&&(t=!1),this.a===1?this.toHexString(t):this.toHex8String(t)},e.prototype.toRgb=function(){return{r:Math.round(this.r),g:Math.round(this.g),b:Math.round(this.b),a:this.a}},e.prototype.toRgbString=function(){var t=Math.round(this.r),n=Math.round(this.g),r=Math.round(this.b);return this.a===1?"rgb(".concat(t,", ").concat(n,", ").concat(r,")"):"rgba(".concat(t,", ").concat(n,", ").concat(r,", ").concat(this.roundA,")")},e.prototype.toPercentageRgb=function(){var t=function(n){return"".concat(Math.round(et(n,255)*100),"%")};return{r:t(this.r),g:t(this.g),b:t(this.b),a:this.a}},e.prototype.toPercentageRgbString=function(){var t=function(n){return Math.round(et(n,255)*100)};return this.a===1?"rgb(".concat(t(this.r),"%, ").concat(t(this.g),"%, ").concat(t(this.b),"%)"):"rgba(".concat(t(this.r),"%, ").concat(t(this.g),"%, ").concat(t(this.b),"%, ").concat(this.roundA,")")},e.prototype.toName=function(){if(this.a===0)return"transparent";if(this.a<1)return!1;for(var t="#"+ku(this.r,this.g,this.b,!1),n=0,r=Object.entries(ra);n<r.length;n++){var o=r[n],s=o[0],i=o[1];if(t===i)return s}return!1},e.prototype.toString=function(t){var n=!!t;t=t??this.format;var r=!1,o=this.a<1&&this.a>=0,s=!n&&o&&(t.startsWith("hex")||t==="name");return s?t==="name"&&this.a===0?this.toName():this.toRgbString():(t==="rgb"&&(r=this.toRgbString()),t==="prgb"&&(r=this.toPercentageRgbString()),(t==="hex"||t==="hex6")&&(r=this.toHexString()),t==="hex3"&&(r=this.toHexString(!0)),t==="hex4"&&(r=this.toHex8String(!0)),t==="hex8"&&(r=this.toHex8String()),t==="name"&&(r=this.toName()),t==="hsl"&&(r=this.toHslString()),t==="hsv"&&(r=this.toHsvString()),r||this.toHexString())},e.prototype.toNumber=function(){return(Math.round(this.r)<<16)+(Math.round(this.g)<<8)+Math.round(this.b)},e.prototype.clone=function(){return new e(this.toString())},e.prototype.lighten=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.l+=t/100,n.l=Qo(n.l),new e(n)},e.prototype.brighten=function(t){t===void 0&&(t=10);var n=this.toRgb();return n.r=Math.max(0,Math.min(255,n.r-Math.round(255*-(t/100)))),n.g=Math.max(0,Math.min(255,n.g-Math.round(255*-(t/100)))),n.b=Math.max(0,Math.min(255,n.b-Math.round(255*-(t/100)))),new e(n)},e.prototype.darken=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.l-=t/100,n.l=Qo(n.l),new e(n)},e.prototype.tint=function(t){return t===void 0&&(t=10),this.mix("white",t)},e.prototype.shade=function(t){return t===void 0&&(t=10),this.mix("black",t)},e.prototype.desaturate=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.s-=t/100,n.s=Qo(n.s),new e(n)},e.prototype.saturate=function(t){t===void 0&&(t=10);var n=this.toHsl();return n.s+=t/100,n.s=Qo(n.s),new e(n)},e.prototype.greyscale=function(){return this.desaturate(100)},e.prototype.spin=function(t){var n=this.toHsl(),r=(n.h+t)%360;return n.h=r<0?360+r:r,new e(n)},e.prototype.mix=function(t,n){n===void 0&&(n=50);var r=this.toRgb(),o=new e(t).toRgb(),s=n/100,i={r:(o.r-r.r)*s+r.r,g:(o.g-r.g)*s+r.g,b:(o.b-r.b)*s+r.b,a:(o.a-r.a)*s+r.a};return new e(i)},e.prototype.analogous=function(t,n){t===void 0&&(t=6),n===void 0&&(n=30);var r=this.toHsl(),o=360/n,s=[this];for(r.h=(r.h-(o*t>>1)+720)%360;--t;)r.h=(r.h+o)%360,s.push(new e(r));return s},e.prototype.complement=function(){var t=this.toHsl();return t.h=(t.h+180)%360,new e(t)},e.prototype.monochromatic=function(t){t===void 0&&(t=6);for(var n=this.toHsv(),r=n.h,o=n.s,s=n.v,i=[],a=1/t;t--;)i.push(new e({h:r,s:o,v:s})),s=(s+a)%1;return i},e.prototype.splitcomplement=function(){var t=this.toHsl(),n=t.h;return[this,new e({h:(n+72)%360,s:t.s,l:t.l}),new e({h:(n+216)%360,s:t.s,l:t.l})]},e.prototype.onBackground=function(t){var n=this.toRgb(),r=new e(t).toRgb(),o=n.a+r.a*(1-n.a);return new e({r:(n.r*n.a+r.r*r.a*(1-n.a))/o,g:(n.g*n.a+r.g*r.a*(1-n.a))/o,b:(n.b*n.a+r.b*r.a*(1-n.a))/o,a:o})},e.prototype.triad=function(){return this.polyad(3)},e.prototype.tetrad=function(){return this.polyad(4)},e.prototype.polyad=function(t){for(var n=this.toHsl(),r=n.h,o=[this],s=360/t,i=1;i<t;i++)o.push(new e({h:(r+i*s)%360,s:n.s,l:n.l}));return o},e.prototype.equals=function(t){return this.toRgbString()===new e(t).toRgbString()},e}(),OS=(e=>(e[e.TEXT=1]="TEXT",e[e.CLASS=2]="CLASS",e[e.STYLE=4]="STYLE",e[e.PROPS=8]="PROPS",e[e.FULL_PROPS=16]="FULL_PROPS",e[e.HYDRATE_EVENTS=32]="HYDRATE_EVENTS",e[e.STABLE_FRAGMENT=64]="STABLE_FRAGMENT",e[e.KEYED_FRAGMENT=128]="KEYED_FRAGMENT",e[e.UNKEYED_FRAGMENT=256]="UNKEYED_FRAGMENT",e[e.NEED_PATCH=512]="NEED_PATCH",e[e.DYNAMIC_SLOTS=1024]="DYNAMIC_SLOTS",e[e.HOISTED=-1]="HOISTED",e[e.BAIL=-2]="BAIL",e))(OS||{});const no=e=>{const t=oe(e)?e:[e],n=[];return t.forEach(r=>{var o;oe(r)?n.push(...no(r)):Ut(r)&&((o=r.component)!=null&&o.subTree)?n.push(r,...no(r.component.subTree)):Ut(r)&&oe(r.children)?n.push(...no(r.children)):Ut(r)&&r.shapeFlag===2?n.push(...no(r.type())):n.push(r)}),n},En=new Map;if(Ye){let e;document.addEventListener("mousedown",t=>e=t),document.addEventListener("mouseup",t=>{if(e){for(const n of En.values())for(const{documentHandler:r}of n)r(t,e);e=void 0}})}function Lu(e,t){let n=[];return oe(t.arg)?n=t.arg:Mn(t.arg)&&n.push(t.arg),function(r,o){const s=t.instance.popperRef,i=r.target,a=o==null?void 0:o.target,l=!t||!t.instance,c=!i||!a,u=e.contains(i)||e.contains(a),f=e===i,p=n.length&&n.some(m=>m==null?void 0:m.contains(i))||n.length&&n.includes(a),d=s&&(s.contains(i)||s.contains(a));l||c||u||f||p||d||t.value(r,o)}}const MS={beforeMount(e,t){En.has(e)||En.set(e,[]),En.get(e).push({documentHandler:Lu(e,t),bindingFn:t.value})},updated(e,t){En.has(e)||En.set(e,[]);const n=En.get(e),r=n.findIndex(s=>s.bindingFn===t.oldValue),o={documentHandler:Lu(e,t),bindingFn:t.value};r>=0?n.splice(r,1,o):n.push(o)},unmounted(e){En.delete(e)}},RS=q({name:"ElCollapseTransition"}),NS=q({...RS,setup(e){const t=Be("collapse-transition"),n=o=>{o.style.maxHeight="",o.style.overflow=o.dataset.oldOverflow,o.style.paddingTop=o.dataset.oldPaddingTop,o.style.paddingBottom=o.dataset.oldPaddingBottom},r={beforeEnter(o){o.dataset||(o.dataset={}),o.dataset.oldPaddingTop=o.style.paddingTop,o.dataset.oldPaddingBottom=o.style.paddingBottom,o.style.height&&(o.dataset.elExistsHeight=o.style.height),o.style.maxHeight=0,o.style.paddingTop=0,o.style.paddingBottom=0},enter(o){requestAnimationFrame(()=>{o.dataset.oldOverflow=o.style.overflow,o.dataset.elExistsHeight?o.style.maxHeight=o.dataset.elExistsHeight:o.scrollHeight!==0?o.style.maxHeight=`${o.scrollHeight}px`:o.style.maxHeight=0,o.style.paddingTop=o.dataset.oldPaddingTop,o.style.paddingBottom=o.dataset.oldPaddingBottom,o.style.overflow="hidden"})},afterEnter(o){o.style.maxHeight="",o.style.overflow=o.dataset.oldOverflow},enterCancelled(o){n(o)},beforeLeave(o){o.dataset||(o.dataset={}),o.dataset.oldPaddingTop=o.style.paddingTop,o.dataset.oldPaddingBottom=o.style.paddingBottom,o.dataset.oldOverflow=o.style.overflow,o.style.maxHeight=`${o.scrollHeight}px`,o.style.overflow="hidden"},leave(o){o.scrollHeight!==0&&(o.style.maxHeight=0,o.style.paddingTop=0,o.style.paddingBottom=0)},afterLeave(o){n(o)},leaveCancelled(o){n(o)}};return(o,s)=>(Y(),He(Do,lr({name:x(t).b()},Ch(r)),{default:de(()=>[Re(o.$slots,"default")]),_:3},16,["name"]))}});var kS=Ve(NS,[["__file","collapse-transition.vue"]]);const FS=$n(kS),ct={placement:"top"},LS=q({name:"ElContainer"}),DS=q({...LS,props:qe({direction:{type:String,values:["horizontal","vertical"]}}),setup(e){const t=e,n=Ah(),r=Be("container"),o=k(()=>t.direction==="vertical"?!0:t.direction==="horizontal"?!1:n&&n.default?n.default().some(i=>{const a=i.type.name;return a==="ElHeader"||a==="ElFooter"}):!1);return(s,i)=>(Y(),ie("section",{class:De([x(r).b(),x(r).is("vertical",x(o))])},[Re(s.$slots,"default")],2))}});var BS=Ve(DS,[["__file","container.vue"]]);const $S=q({name:"ElAside"}),jS=q({...$S,props:{width:{type:String,default:null}},setup(e){const t=e,n=Be("aside"),r=k(()=>t.width?n.cssVarBlock({width:t.width}):{});return(o,s)=>(Y(),ie("aside",{class:De(x(n).b()),style:Xt(x(r))},[Re(o.$slots,"default")],6))}});var Zd=Ve(jS,[["__file","aside.vue"]]);const HS=q({name:"ElFooter"}),VS=q({...HS,props:{height:{type:String,default:null}},setup(e){const t=e,n=Be("footer"),r=k(()=>t.height?n.cssVarBlock({height:t.height}):{});return(o,s)=>(Y(),ie("footer",{class:De(x(n).b()),style:Xt(x(r))},[Re(o.$slots,"default")],6))}});var Qd=Ve(VS,[["__file","footer.vue"]]);const WS=q({name:"ElHeader"}),zS=q({...WS,props:{height:{type:String,default:null}},setup(e){const t=e,n=Be("header"),r=k(()=>t.height?n.cssVarBlock({height:t.height}):{});return(o,s)=>(Y(),ie("header",{class:De(x(n).b()),style:Xt(x(r))},[Re(o.$slots,"default")],6))}});var em=Ve(zS,[["__file","header.vue"]]);const US=q({name:"ElMain"}),GS=q({...US,setup(e){const t=Be("main");return(n,r)=>(Y(),ie("main",{class:De(x(t).b())},[Re(n.$slots,"default")],2))}});var tm=Ve(GS,[["__file","main.vue"]]);const KS=$n(BS,{Aside:Zd,Footer:Qd,Header:em,Main:tm}),qS=pr(Zd);pr(Qd);pr(em);const JS=pr(tm);let YS=class{constructor(t,n){this.parent=t,this.domNode=n,this.subIndex=0,this.subIndex=0,this.init()}init(){this.subMenuItems=this.domNode.querySelectorAll("li"),this.addListeners()}gotoSubIndex(t){t===this.subMenuItems.length?t=0:t<0&&(t=this.subMenuItems.length-1),this.subMenuItems[t].focus(),this.subIndex=t}addListeners(){const t=this.parent.domNode;Array.prototype.forEach.call(this.subMenuItems,n=>{n.addEventListener("keydown",r=>{const o=Gr(r);let s=!1;switch(o){case Ue.down:{this.gotoSubIndex(this.subIndex+1),s=!0;break}case Ue.up:{this.gotoSubIndex(this.subIndex-1),s=!0;break}case Ue.tab:{ls(t,"mouseleave");break}case Ue.enter:case Ue.numpadEnter:case Ue.space:{s=!0,r.currentTarget.click();break}}return s&&(r.preventDefault(),r.stopPropagation()),!1})})}},XS=class{constructor(t,n){this.domNode=t,this.submenu=null,this.submenu=null,this.init(n)}init(t){this.domNode.setAttribute("tabindex","0");const n=this.domNode.querySelector(`.${t}-menu`);n&&(this.submenu=new YS(this,n)),this.addListeners()}addListeners(){this.domNode.addEventListener("keydown",t=>{const n=Gr(t);let r=!1;switch(n){case Ue.down:{ls(t.currentTarget,"mouseenter"),this.submenu&&this.submenu.gotoSubIndex(0),r=!0;break}case Ue.up:{ls(t.currentTarget,"mouseenter"),this.submenu&&this.submenu.gotoSubIndex(this.submenu.subMenuItems.length-1),r=!0;break}case Ue.tab:{ls(t.currentTarget,"mouseleave");break}case Ue.enter:case Ue.numpadEnter:case Ue.space:{r=!0,t.currentTarget.click();break}}r&&t.preventDefault()})}},ZS=class{constructor(t,n){this.domNode=t,this.init(n)}init(t){const n=this.domNode.childNodes;Array.from(n).forEach(r=>{r.nodeType===1&&new XS(r,t)})}};const QS=q({name:"ElMenuCollapseTransition"}),e4=q({...QS,setup(e){const t=Be("menu"),n={onBeforeEnter:r=>r.style.opacity="0.2",onEnter(r,o){qo(r,`${t.namespace.value}-opacity-transition`),r.style.opacity="1",o()},onAfterEnter(r){vi(r,`${t.namespace.value}-opacity-transition`),r.style.opacity=""},onBeforeLeave(r){r.dataset||(r.dataset={}),I1(r,t.m("collapse"))?(vi(r,t.m("collapse")),r.dataset.oldOverflow=r.style.overflow,r.dataset.scrollWidth=r.clientWidth.toString(),qo(r,t.m("collapse"))):(qo(r,t.m("collapse")),r.dataset.oldOverflow=r.style.overflow,r.dataset.scrollWidth=r.clientWidth.toString(),vi(r,t.m("collapse"))),r.style.width=`${r.scrollWidth}px`,r.style.overflow="hidden"},onLeave(r){qo(r,"horizontal-collapse-transition"),r.style.width=`${r.dataset.scrollWidth}px`}};return(r,o)=>(Y(),He(Do,lr({mode:"out-in"},x(n)),{default:de(()=>[Re(r.$slots,"default")]),_:3},16))}});var t4=Ve(e4,[["__file","menu-collapse-transition.vue"]]);function nm(e,t){const n=k(()=>{let o=e.parent;const s=[t.value];for(;o.type.name!=="ElMenu";)o.props.index&&s.unshift(o.props.index),o=o.parent;return s});return{parentMenu:k(()=>{let o=e.parent;for(;o&&!["ElMenu","ElSubMenu"].includes(o.type.name);)o=o.parent;return o}),indexPath:n}}function n4(e){return k(()=>{const n=e.backgroundColor;return n?new IS(n).shade(20).toString():""})}const rm=(e,t)=>{const n=Be("menu");return k(()=>n.cssVarBlock({"text-color":e.textColor||"","hover-text-color":e.textColor||"","bg-color":e.backgroundColor||"","hover-bg-color":n4(e).value||"","active-color":e.activeTextColor||"",level:`${t}`}))},cl="rootMenu",Is="subMenu:",r4=qe({index:{type:String,required:!0},showTimeout:Number,hideTimeout:Number,popperClass:String,popperStyle:{type:be([String,Object])},disabled:Boolean,teleported:{type:Boolean,default:void 0},popperOffset:Number,expandCloseIcon:{type:wr},expandOpenIcon:{type:wr},collapseCloseIcon:{type:wr},collapseOpenIcon:{type:wr}}),Ei="ElSubMenu";var ul=q({name:Ei,props:r4,setup(e,{slots:t,expose:n}){const r=Xe(),{indexPath:o,parentMenu:s}=nm(r,k(()=>e.index)),i=Be("menu"),a=Be("sub-menu"),l=Ae(cl);l||Ps(Ei,"can not inject root menu");const c=Ae(`${Is}${s.value.uid}`);c||Ps(Ei,"can not inject sub menu");const u=B({}),f=B({});let p;const d=B(!1),m=B(),h=B(),S=k(()=>c.level===0),b=k(()=>A.value==="horizontal"&&S.value?"bottom-start":"right-start"),C=k(()=>A.value==="horizontal"&&S.value||A.value==="vertical"&&!l.props.collapse?e.expandCloseIcon&&e.expandOpenIcon?z.value?e.expandOpenIcon:e.expandCloseIcon:$1:e.collapseCloseIcon&&e.collapseOpenIcon?z.value?e.collapseOpenIcon:e.collapseCloseIcon:V1),y=k(()=>{const ne=e.teleported;return Ka(ne)?S.value:ne}),E=k(()=>l.props.collapse?`${i.namespace.value}-zoom-in-left`:`${i.namespace.value}-zoom-in-top`),N=k(()=>A.value==="horizontal"&&S.value?["bottom-start","bottom-end","top-start","top-end","right-start","left-start"]:["right-start","right","right-end","left-start","bottom-start","bottom-end","top-start","top-end"]),z=k(()=>l.openedMenus.includes(e.index)),D=k(()=>[...Object.values(u.value),...Object.values(f.value)].some(({active:ne})=>ne)),A=k(()=>l.props.mode),v=k(()=>l.props.persistent),R=Bn({index:e.index,indexPath:o,active:D}),U=rm(l.props,c.level+1),I=k(()=>{var ne;return(ne=e.popperOffset)!=null?ne:l.props.popperOffset}),M=k(()=>{var ne;return(ne=e.popperClass)!=null?ne:l.props.popperClass}),W=k(()=>{var ne;return(ne=e.popperStyle)!=null?ne:l.props.popperStyle}),X=k(()=>{var ne;return(ne=e.showTimeout)!=null?ne:l.props.showTimeout}),G=k(()=>{var ne;return(ne=e.hideTimeout)!=null?ne:l.props.hideTimeout}),O=()=>{var ne,ge,_e;return(_e=(ge=(ne=h.value)==null?void 0:ne.popperRef)==null?void 0:ge.popperInstanceRef)==null?void 0:_e.destroy()},w=ne=>{ne||O()},V=()=>{l.props.menuTrigger==="hover"&&l.props.mode==="horizontal"||l.props.collapse&&l.props.mode==="vertical"||e.disabled||l.handleSubMenuClick({index:e.index,indexPath:o.value,active:D.value})},ce=(ne,ge=X.value)=>{var _e;if(ne.type!=="focus"){if(l.props.menuTrigger==="click"&&l.props.mode==="horizontal"||!l.props.collapse&&l.props.mode==="vertical"||e.disabled){c.mouseInChild.value=!0;return}c.mouseInChild.value=!0,p==null||p(),{stop:p}=Zi(()=>{l.openMenu(e.index,o.value)},ge),y.value&&((_e=s.value.vnode.el)==null||_e.dispatchEvent(new MouseEvent("mouseenter"))),ne.type==="mouseenter"&&ne.target&&Kt(()=>{$o(ne.target,{preventScroll:!0})})}},me=(ne=!1)=>{var ge;if(l.props.menuTrigger==="click"&&l.props.mode==="horizontal"||!l.props.collapse&&l.props.mode==="vertical"){c.mouseInChild.value=!1;return}p==null||p(),c.mouseInChild.value=!1,{stop:p}=Zi(()=>!d.value&&l.closeMenu(e.index,o.value),G.value),y.value&&ne&&((ge=c.handleMouseleave)==null||ge.call(c,!0))};ye(()=>l.props.collapse,ne=>w(!!ne));{const ne=_e=>{f.value[_e.index]=_e},ge=_e=>{delete f.value[_e.index]};gt(`${Is}${r.uid}`,{addSubMenu:ne,removeSubMenu:ge,handleMouseleave:me,mouseInChild:d,level:c.level+1})}return n({opened:z}),st(()=>{l.addSubMenu(R),c.addSubMenu(R)}),At(()=>{c.removeSubMenu(R),l.removeSubMenu(R)}),()=>{var ne;const ge=[(ne=t.title)==null?void 0:ne.call(t),We(Dr,{class:a.e("icon-arrow"),style:{transform:z.value?e.expandCloseIcon&&e.expandOpenIcon||e.collapseCloseIcon&&e.collapseOpenIcon&&l.props.collapse?"none":"rotateZ(180deg)":"none"}},{default:()=>we(C.value)?We(r.appContext.components[C.value]):We(C.value)})],_e=l.isMenuPopup?We(Yd,{ref:h,visible:z.value,effect:"light",pure:!0,offset:I.value,showArrow:!1,persistent:v.value,popperClass:M.value,popperStyle:W.value,placement:b.value,teleported:y.value,fallbackPlacements:N.value,transition:E.value,gpuAcceleration:!1},{content:()=>{var Te;return We("div",{class:[i.m(A.value),i.m("popup-container"),M.value],onMouseenter:ke=>ce(ke,100),onMouseleave:()=>me(!0),onFocus:ke=>ce(ke,100)},[We("ul",{class:[i.b(),i.m("popup"),i.m(`popup-${b.value}`)],style:U.value},[(Te=t.default)==null?void 0:Te.call(t)])])},default:()=>We("div",{class:a.e("title"),onClick:V},ge)}):We(ze,{},[We("div",{class:a.e("title"),ref:m,onClick:V},ge),We(FS,{},{default:()=>{var Te;return Wr(We("ul",{role:"menu",class:[i.b(),i.m("inline")],style:U.value},[(Te=t.default)==null?void 0:Te.call(t)]),[[zs,z.value]])}})]);return We("li",{class:[a.b(),a.is("active",D.value),a.is("opened",z.value),a.is("disabled",e.disabled)],role:"menuitem",ariaHaspopup:!0,ariaExpanded:z.value,onMouseenter:ce,onMouseleave:()=>me(),onFocus:ce},[_e])}}});const o4=qe({mode:{type:String,values:["horizontal","vertical"],default:"vertical"},defaultActive:{type:String,default:""},defaultOpeneds:{type:be(Array),default:()=>Ed([])},uniqueOpened:Boolean,router:Boolean,menuTrigger:{type:String,values:["hover","click"],default:"hover"},collapse:Boolean,backgroundColor:String,textColor:String,activeTextColor:String,closeOnClickOutside:Boolean,collapseTransition:{type:Boolean,default:!0},ellipsis:{type:Boolean,default:!0},popperOffset:{type:Number,default:6},ellipsisIcon:{type:wr,default:()=>x2},popperEffect:{type:be(String),default:"dark"},popperClass:String,popperStyle:{type:be([String,Object])},showTimeout:{type:Number,default:300},hideTimeout:{type:Number,default:300},persistent:{type:Boolean,default:!0}}),Pi=e=>oe(e)&&e.every(t=>we(t)),s4={close:(e,t)=>we(e)&&Pi(t),open:(e,t)=>we(e)&&Pi(t),select:(e,t,n,r)=>we(e)&&Pi(t)&&Ee(n)&&(Ka(r)||r instanceof Promise)},Du=64;var i4=q({name:"ElMenu",props:o4,emits:s4,setup(e,{emit:t,slots:n,expose:r}){const o=Xe(),s=o.appContext.config.globalProperties.$router,i=B(),a=B(),l=Be("menu"),c=Be("sub-menu");let u=Du;const f=B(-1),p=B(e.defaultOpeneds&&!e.collapse?e.defaultOpeneds.slice(0):[]),d=B(e.defaultActive),m=B({}),h=B({}),S=k(()=>e.mode==="horizontal"||e.mode==="vertical"&&e.collapse),b=()=>{const O=d.value&&m.value[d.value];if(!O||e.mode==="horizontal"||e.collapse)return;O.indexPath.forEach(V=>{const ce=h.value[V];ce&&C(V,ce.indexPath)})},C=(O,w)=>{p.value.includes(O)||(e.uniqueOpened&&(p.value=p.value.filter(V=>w.includes(V))),p.value.push(O),t("open",O,w))},y=O=>{const w=p.value.indexOf(O);w!==-1&&p.value.splice(w,1)},E=(O,w)=>{y(O),t("close",O,w)},N=({index:O,indexPath:w})=>{p.value.includes(O)?E(O,w):C(O,w)},z=O=>{(e.mode==="horizontal"||e.collapse)&&(p.value=[]);const{index:w,indexPath:V}=O;if(!(Lr(w)||Lr(V)))if(e.router&&s){const ce=O.route||w,me=s.push(ce).then(ne=>(ne||(d.value=w),ne));t("select",w,V,{index:w,indexPath:V,route:ce},me)}else d.value=w,t("select",w,V,{index:w,indexPath:V})},D=O=>{var w;const V=m.value,ce=V[O]||d.value&&V[d.value]||V[e.defaultActive];d.value=(w=ce==null?void 0:ce.index)!=null?w:O},A=O=>{const w=getComputedStyle(O),V=Number.parseInt(w.marginLeft,10),ce=Number.parseInt(w.marginRight,10);return O.offsetWidth+V+ce||0},v=()=>{if(!i.value)return-1;const O=Array.from(i.value.childNodes).filter(_e=>_e.nodeName!=="#comment"&&(_e.nodeName!=="#text"||_e.nodeValue)),w=getComputedStyle(i.value),V=Number.parseInt(w.paddingLeft,10),ce=Number.parseInt(w.paddingRight,10),me=i.value.clientWidth-V-ce;let ne=0,ge=0;return O.forEach((_e,Te)=>{ne+=A(_e),ne<=me-u&&(ge=Te+1)}),ge===O.length?-1:ge},R=O=>h.value[O].indexPath,U=(O,w=33.34)=>{let V;return()=>{V&&clearTimeout(V),V=setTimeout(()=>{O()},w)}};let I=!0;const M=()=>{const O=ht(a);if(O&&(u=A(O)||Du),f.value===v())return;const w=()=>{f.value=-1,Kt(()=>{f.value=v()})};I?w():U(w)(),I=!1};ye(()=>e.defaultActive,O=>{m.value[O]||(d.value=""),D(O)}),ye(()=>e.collapse,O=>{O&&(p.value=[])}),ye(m.value,b);let W;up(()=>{e.mode==="horizontal"&&e.ellipsis?W=qa(i,M).stop:W==null||W()});const X=B(!1);{const O=me=>{h.value[me.index]=me},w=me=>{delete h.value[me.index]};gt(cl,Bn({props:e,openedMenus:p,items:m,subMenus:h,activeIndex:d,isMenuPopup:S,addMenuItem:me=>{m.value[me.index]=me},removeMenuItem:me=>{delete m.value[me.index]},addSubMenu:O,removeSubMenu:w,openMenu:C,closeMenu:E,handleMenuItemClick:z,handleSubMenuClick:N})),gt(`${Is}${o.uid}`,{addSubMenu:O,removeSubMenu:w,mouseInChild:X,level:0})}st(()=>{e.mode==="horizontal"&&new ZS(o.vnode.el,l.namespace.value)}),r({open:w=>{const{indexPath:V}=h.value[w];V.forEach(ce=>C(ce,V))},close:y,updateActiveIndex:D,handleResize:M});const G=rm(e,0);return()=>{var O,w;let V=(w=(O=n.default)==null?void 0:O.call(n))!=null?w:[];const ce=[];if(e.mode==="horizontal"&&i.value){const ge=no(V).filter(ke=>(ke==null?void 0:ke.shapeFlag)!==8),_e=f.value===-1?ge:ge.slice(0,f.value),Te=f.value===-1?[]:ge.slice(f.value);Te!=null&&Te.length&&e.ellipsis&&(V=_e,ce.push(We(ul,{ref:a,index:"sub-menu-more",class:c.e("hide-arrow"),popperOffset:e.popperOffset},{title:()=>We(Dr,{class:c.e("icon-more")},{default:()=>We(e.ellipsisIcon)}),default:()=>Te})))}const me=e.closeOnClickOutside?[[MS,()=>{p.value.length&&(X.value||(p.value.forEach(ge=>t("close",ge,R(ge))),p.value=[]))}]]:[],ne=Wr(We("ul",{key:String(e.collapse),role:"menubar",ref:i,style:G.value,class:{[l.b()]:!0,[l.m(e.mode)]:!0,[l.m("collapse")]:e.collapse}},[...V,...ce]),me);return e.collapseTransition&&e.mode==="vertical"?We(t4,()=>ne):ne}}});const a4=qe({index:{type:be([String,null]),default:null},route:{type:be([String,Object])},disabled:Boolean}),l4={click:e=>we(e.index)&&oe(e.indexPath)},oa="ElMenuItem",c4=q({name:oa}),u4=q({...c4,props:a4,emits:l4,setup(e,{expose:t,emit:n}){const r=e;Bb(r.index)&&void 0;const o=Xe(),s=Ae(cl),i=Be("menu"),a=Be("menu-item");s||Ps(oa,"can not inject root menu");const{parentMenu:l,indexPath:c}=nm(o,br(r,"index")),u=Ae(`${Is}${l.value.uid}`);u||Ps(oa,"can not inject sub menu");const f=k(()=>r.index===s.activeIndex),p=Bn({index:r.index,indexPath:c,active:f}),d=()=>{r.disabled||(s.handleMenuItemClick({index:r.index,indexPath:c.value,route:r.route}),n("click",p))};return st(()=>{u.addSubMenu(p),s.addMenuItem(p)}),At(()=>{u.removeSubMenu(p),s.removeMenuItem(p)}),t({parentMenu:l,rootMenu:s,active:f,nsMenu:i,nsMenuItem:a,handleClick:d}),(m,h)=>(Y(),ie("li",{class:De([x(a).b(),x(a).is("active",x(f)),x(a).is("disabled",m.disabled)]),role:"menuitem",tabindex:"-1",onClick:d},[x(l).type.name==="ElMenu"&&x(s).props.collapse&&m.$slots.title?(Y(),He(x(Yd),{key:0,effect:x(s).props.popperEffect,placement:"right","fallback-placements":["left"],persistent:x(s).props.persistent,"focus-on-target":""},{content:de(()=>[Re(m.$slots,"title")]),default:de(()=>[Q("div",{class:De(x(i).be("tooltip","trigger"))},[Re(m.$slots,"default")],2)]),_:3},8,["effect","persistent"])):(Y(),ie(ze,{key:1},[Re(m.$slots,"default"),Re(m.$slots,"title")],64))],2))}});var om=Ve(u4,[["__file","menu-item.vue"]]);const f4={title:String},p4=q({name:"ElMenuItemGroup"}),d4=q({...p4,props:f4,setup(e){const t=Be("menu-item-group");return(n,r)=>(Y(),ie("li",{class:De(x(t).b())},[Q("div",{class:De(x(t).e("title"))},[n.$slots.title?Re(n.$slots,"title",{key:1}):(Y(),ie(ze,{key:0},[ka(No(n.title),1)],64))],2),Q("ul",null,[Re(n.$slots,"default")])],2))}});var sm=Ve(d4,[["__file","menu-item-group.vue"]]);const m4=$n(i4,{MenuItem:om,MenuItemGroup:sm,SubMenu:ul}),h4=pr(om);pr(sm);pr(ul);const im=["primary","success","info","warning","error"],am=["top","top-left","top-right","bottom","bottom-left","bottom-right"],Oo="top",tt=Ed({customClass:"",dangerouslyUseHTMLString:!1,duration:3e3,icon:void 0,id:"",message:"",onClose:void 0,showClose:!1,type:"info",plain:!1,offset:16,placement:void 0,zIndex:0,grouping:!1,repeatNum:1,appendTo:Ye?document.body:void 0}),g4=qe({customClass:{type:String,default:tt.customClass},dangerouslyUseHTMLString:{type:Boolean,default:tt.dangerouslyUseHTMLString},duration:{type:Number,default:tt.duration},icon:{type:wr,default:tt.icon},id:{type:String,default:tt.id},message:{type:be([String,Object,Function]),default:tt.message},onClose:{type:be(Function),default:tt.onClose},showClose:{type:Boolean,default:tt.showClose},type:{type:String,values:im,default:tt.type},plain:{type:Boolean,default:tt.plain},offset:{type:Number,default:tt.offset},placement:{type:String,values:am,default:tt.placement},zIndex:{type:Number,default:tt.zIndex},grouping:{type:Boolean,default:tt.grouping},repeatNum:{type:Number,default:tt.repeatNum}}),_4={destroy:()=>!0},Rt=Bs({}),v4=e=>(Rt[e]||(Rt[e]=Bs([])),Rt[e]),y4=(e,t)=>{const n=Rt[t]||[],r=n.findIndex(i=>i.id===e),o=n[r];let s;return r>0&&(s=n[r-1]),{current:o,prev:s}},b4=(e,t)=>{const{prev:n}=y4(e,t);return n?n.vm.exposed.bottom.value:0},w4=(e,t,n)=>(Rt[n]||[]).findIndex(s=>s.id===e)>0?16:t,x4=q({name:"ElMessage"}),S4=q({...x4,props:g4,emits:_4,setup(e,{expose:t,emit:n}){const r=e,{Close:o}=H2,s=B(!1),{ns:i,zIndex:a}=C1("message"),{currentZIndex:l,nextZIndex:c}=a,u=B(),f=B(!1),p=B(0);let d;const m=k(()=>r.type?r.type==="error"?"danger":r.type:"info"),h=k(()=>{const I=r.type;return{[i.bm("icon",I)]:I&&uu[I]}}),S=k(()=>r.icon||uu[r.type]||""),b=k(()=>r.placement||Oo),C=k(()=>b4(r.id,b.value)),y=k(()=>w4(r.id,r.offset,b.value)+C.value),E=k(()=>p.value+y.value),N=k(()=>b.value.includes("left")?i.is("left"):b.value.includes("right")?i.is("right"):i.is("center")),z=k(()=>b.value.startsWith("top")?"top":"bottom"),D=k(()=>({[z.value]:`${y.value}px`,zIndex:l.value}));function A(){r.duration!==0&&({stop:d}=Zi(()=>{R()},r.duration))}function v(){d==null||d()}function R(){f.value=!1,Kt(()=>{var I;s.value||((I=r.onClose)==null||I.call(r),n("destroy"))})}function U(I){Gr(I)===Ue.esc&&R()}return st(()=>{A(),c(),f.value=!0}),ye(()=>r.repeatNum,()=>{v(),A()}),er(document,"keydown",U),qa(u,()=>{p.value=u.value.getBoundingClientRect().height}),t({visible:f,bottom:E,close:R}),(I,M)=>(Y(),He(Do,{name:x(i).b("fade"),onBeforeEnter:W=>s.value=!0,onBeforeLeave:I.onClose,onAfterLeave:W=>I.$emit("destroy"),persisted:""},{default:de(()=>[Wr(Q("div",{id:I.id,ref_key:"messageRef",ref:u,class:De([x(i).b(),{[x(i).m(I.type)]:I.type},x(i).is("closable",I.showClose),x(i).is("plain",I.plain),x(i).is("bottom",x(z)==="bottom"),x(N),I.customClass]),style:Xt(x(D)),role:"alert",onMouseenter:v,onMouseleave:A},[I.repeatNum>1?(Y(),He(x(gS),{key:0,value:I.repeatNum,type:x(m),class:De(x(i).e("badge"))},null,8,["value","type","class"])):On("v-if",!0),x(S)?(Y(),He(x(Dr),{key:1,class:De([x(i).e("icon"),x(h)])},{default:de(()=>[(Y(),He(Ph(x(S))))]),_:1},8,["class"])):On("v-if",!0),Re(I.$slots,"default",{},()=>[I.dangerouslyUseHTMLString?(Y(),ie(ze,{key:1},[On(" Caution here, message could've been compromised, never use user's input as message "),Q("p",{class:De(x(i).e("content")),innerHTML:I.message},null,10,["innerHTML"])],2112)):(Y(),ie("p",{key:0,class:De(x(i).e("content"))},No(I.message),3))]),I.showClose?(Y(),He(x(Dr),{key:2,class:De(x(i).e("closeBtn")),onClick:Gg(R,["stop"])},{default:de(()=>[re(x(o))]),_:1},8,["class","onClick"])):On("v-if",!0)],46,["id"]),[[zs,f.value]])]),_:3},8,["name","onBeforeEnter","onBeforeLeave","onAfterLeave"]))}});var E4=Ve(S4,[["__file","message.vue"]]);let P4=1;const C4=e=>{if(!e.appendTo)e.appendTo=document.body;else if(we(e.appendTo)){let n=document.querySelector(e.appendTo);Mn(n)||(n=document.body),e.appendTo=n}},T4=e=>{!e.placement&&we(ct.placement)&&ct.placement&&(e.placement=ct.placement),e.placement||(e.placement=Oo),am.includes(e.placement)||(e.placement=Oo)},lm=e=>{const t=!e||we(e)||Ut(e)||le(e)?{message:e}:e,n={...tt,...t};return C4(n),T4(n),ho(ct.grouping)&&!n.grouping&&(n.grouping=ct.grouping),Jt(ct.duration)&&n.duration===3e3&&(n.duration=ct.duration),Jt(ct.offset)&&n.offset===16&&(n.offset=ct.offset),ho(ct.showClose)&&!n.showClose&&(n.showClose=ct.showClose),ho(ct.plain)&&!n.plain&&(n.plain=ct.plain),n},A4=e=>{const t=e.props.placement||Oo,n=Rt[t],r=n.indexOf(e);if(r===-1)return;n.splice(r,1);const{handler:o}=e;o.close()},I4=({appendTo:e,...t},n)=>{const r=`message_${P4++}`,o=t.onClose,s=document.createElement("div"),i={...t,id:r,onClose:()=>{o==null||o(),A4(u)},onDestroy:()=>{sc(null,s)}},a=re(E4,i,le(i.message)||Ut(i.message)?{default:le(i.message)?i.message:()=>i.message}:null);a.appContext=n||ar._context,sc(a,s),e.appendChild(s.firstElementChild);const l=a.component,u={id:r,vnode:a,vm:l,handler:{close:()=>{l.exposed.close()}},props:a.component.props};return u},ar=(e={},t)=>{if(!Ye)return{close:()=>{}};const n=lm(e),r=v4(n.placement||Oo);if(n.grouping&&r.length){const s=r.find(({vnode:i})=>{var a;return((a=i.props)==null?void 0:a.message)===n.message});if(s)return s.props.repeatNum+=1,s.props.type=n.type,s.handler}if(Jt(ct.max)&&r.length>=ct.max)return{close:()=>{}};const o=I4(n,t);return r.push(o),o.handler};im.forEach(e=>{ar[e]=(t={},n)=>{const r=lm(t);return ar({...r,type:e},n)}});function O4(e){for(const t in Rt)if(Pe(Rt,t)){const n=[...Rt[t]];for(const r of n)(!e||e===r.props.type)&&r.handler.close()}}function M4(e){if(!Rt[e])return;[...Rt[e]].forEach(n=>n.handler.close())}ar.closeAll=O4;ar.closeAllByPlacement=M4;ar._context=null;const Me=O1(ar,"$message"),Qs=(e,t)=>{const n=e.__vccOpts||e;for(const[r,o]of t)n[r]=o;return n},R4={__name:"Sidebar",setup(e){const t=Gp(),n=k(()=>t.path);return(r,o)=>{const s=Dr,i=h4,a=m4;return Y(),He(a,{"default-active":n.value,class:"sidebar-menu",router:"",collapse:!1,mode:"vertical"},{default:de(()=>[re(i,{index:"/items"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(U1))]),_:1}),o[0]||(o[0]=Q("span",null,"物品",-1))]),_:1}),re(i,{index:"/bag"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(K1))]),_:1}),o[1]||(o[1]=Q("span",null,"背包",-1))]),_:1}),re(i,{index:"/map"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(g2))]),_:1}),o[2]||(o[2]=Q("span",null,"地图",-1))]),_:1}),re(i,{index:"/combat"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(l2))]),_:1}),o[3]||(o[3]=Q("span",null,"战斗",-1))]),_:1}),re(i,{index:"/story"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(E2))]),_:1}),o[4]||(o[4]=Q("span",null,"剧情",-1))]),_:1}),re(i,{index:"/shop"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(N2))]),_:1}),o[5]||(o[5]=Q("span",null,"商城",-1))]),_:1}),re(i,{index:"/craft-planner"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(L2))]),_:1}),o[6]||(o[6]=Q("span",null,"做装",-1))]),_:1}),re(i,{index:"/settings"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(M2))]),_:1}),o[7]||(o[7]=Q("span",null,"设置",-1))]),_:1}),re(i,{index:"/help"},{default:de(()=>[re(s,null,{default:de(()=>[re(x(T2))]),_:1}),o[8]||(o[8]=Q("span",null,"帮助",-1))]),_:1})]),_:1},8,["default-active"])}}},N4=Qs(R4,[["__scopeId","data-v-d20b6b4c"]]),k4={__name:"MainLayout",setup(e){const t=k(()=>"68px");return(n,r)=>{const o=qS,s=JS,i=KS;return Y(),He(i,{class:"main-layout"},{default:de(()=>[re(o,{width:t.value,class:"sidebar-container"},{default:de(()=>[re(N4)]),_:1},8,["width"]),re(i,null,{default:de(()=>[re(s,{class:"main-content"},{default:de(()=>[Re(n.$slots,"default",{},void 0,!0)]),_:3})]),_:3})]),_:3})}}},F4=Qs(k4,[["__scopeId","data-v-640a1ce7"]]);async function cm(e,t={}){var r;if(typeof e!="string"||e.length===0)throw new TypeError("没有可复制的正则内容");if(typeof t.electronWrite=="function")return t.electronWrite(e);const n=t.browserClipboard??((r=globalThis.navigator)==null?void 0:r.clipboard);if(!n||typeof n.writeText!="function")throw new Error("当前环境不支持剪贴板写入");return await n.writeText(e),{success:!0}}const L4=typeof window<"u"&&!!window.electronAPI,xe=e=>e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e)),D4={system:{detectGameDpi:()=>Promise.resolve({found:!1,primaryScaleFactor:1,error:"非 Electron 环境"})},script:{executePython:()=>Promise.reject(new Error("非 Electron 环境")),generateAndExecute:()=>Promise.reject(new Error("非 Electron 环境")),stop:()=>Promise.resolve({success:!0}),getStatus:()=>Promise.resolve({isRunning:!1}),detectPythonPath:()=>Promise.resolve(null)},file:{save:()=>Promise.resolve(!0),read:()=>Promise.resolve(""),getPaths:()=>Promise.resolve({}),watcher:{start:()=>Promise.resolve(!0),stop:()=>Promise.resolve(!0)}},clipboard:{writeText:e=>cm(e)},shortcut:{initFromSettings:()=>Promise.resolve({success:!0,failed:[]}),register:()=>Promise.resolve({success:!0}),unregister:()=>Promise.resolve({success:!0}),beginCapture:()=>Promise.resolve({success:!0}),endCapture:()=>Promise.resolve({success:!0,failed:[]}),onTriggered:()=>{},onInit:()=>{}},window:{minimize:()=>{},maximize:()=>{},close:()=>{},toggleAlwaysOnTop:()=>Promise.resolve(!1),isAlwaysOnTop:()=>Promise.resolve(!1),onMaximized:()=>{},openDebugOverlay:()=>Promise.resolve({success:!0}),closeDebugOverlay:()=>Promise.resolve({success:!0}),updateDebugOverlay:()=>Promise.resolve({success:!0}),setDevToolsVisible:e=>Promise.resolve({visible:!!e}),getDevToolsVisible:()=>Promise.resolve({visible:!1}),onDevToolsVisibilityChanged:()=>()=>{},pickScreenCoordinate:()=>Promise.resolve({canceled:!0}),getScreenPickerContext:()=>Promise.resolve({mode:"point"}),submitScreenCoordinate:()=>{},submitScreenRegion:()=>{},cancelScreenCoordinatePicker:()=>{}},events:{onPythonOutput:()=>{},onUpdateOverlay:()=>{},onUpdateOverlaySettings:()=>{},onScriptStopped:()=>{},onBagDetectionMatch:()=>()=>{},onBagStashProgress:()=>()=>{},onBagStashCompleted:()=>()=>{},onBagStashStopped:()=>()=>{},onBagDetectionStopped:()=>()=>{},onUpdateDebugOverlay:()=>{}},selectFile:()=>Promise.resolve({canceled:!0,filePaths:[]}),copyFileToProject:()=>Promise.resolve({success:!1}),overlay:{updateSettings:()=>Promise.resolve({success:!0})},bag:{startDetection:()=>Promise.reject(new Error("非 Electron 环境")),stopDetection:()=>Promise.resolve({success:!0}),startStash:()=>Promise.reject(new Error("非 Electron 环境")),stopStash:()=>Promise.resolve({success:!0}),updateOperationDelay:()=>Promise.resolve({success:!0}),updatePreferences:()=>Promise.resolve({success:!0}),uploadTemplate:()=>Promise.reject(new Error("非 Electron 环境")),captureTemplate:()=>Promise.reject(new Error("非 Electron 环境")),getOverlayState:()=>Promise.resolve(null),onOverlayState:()=>()=>{}},combat:{startPotion:()=>Promise.reject(new Error("非 Electron 环境")),stopPotion:()=>Promise.resolve({success:!0}),getPotionStatus:()=>Promise.resolve({running:!1,processId:null}),samplePixel:()=>Promise.reject(new Error("非 Electron 环境")),executePortal:()=>Promise.reject(new Error("非 Electron 环境")),onStatus:()=>()=>{}},storyOverlay:{open:()=>Promise.resolve({success:!0}),close:()=>Promise.resolve({success:!0}),update:()=>Promise.resolve({success:!0}),getState:()=>Promise.resolve(null),resize:()=>Promise.resolve({success:!0}),onState:()=>()=>{}},crafting:{getStatus:()=>Promise.resolve({source:"builtin",manifest:null}),listCategories:()=>Promise.resolve([]),searchBases:()=>Promise.resolve({items:[],total:0}),searchModifiers:()=>Promise.resolve({items:[],total:0}),searchModifierCatalog:()=>Promise.resolve({groups:[],sourceCoverage:{},totalFamilies:0}),createManualSession:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),applyManualCurrency:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualEssences:()=>Promise.resolve({items:[],unresolvedCount:0}),applyManualEssence:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualBenchCrafts:()=>Promise.resolve({items:[],unresolvedCount:0}),applyManualBenchCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualFossils:()=>Promise.resolve({items:[],resonators:[],supportedCount:0}),applyManualFossils:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualHarvestCrafts:()=>Promise.resolve({items:[],categories:[],total:0,executableCount:0}),applyManualHarvestCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualEldritchCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,dominance:{source:null,affixType:null,label:"无支配"}}),applyManualEldritchCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualInfluenceCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,donor:null,influenceLabels:{}}),listAwakenerDonorCandidates:()=>Promise.resolve({bases:[],influences:[],candidates:[]}),configureAwakenerDonor:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),clearAwakenerDonor:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),applyManualInfluenceCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualVeiledCrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,pending:null,options:[],canUnveil:!1,unveilUnavailableReason:""}),applyManualVeiledCraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),selectManualVeiledOption:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),listManualBeastcrafts:()=>Promise.resolve({items:[],total:0,executableCount:0,beastLevel:83,pendingSplitResults:[],imprint:null,foreseeing:!1}),applyManualBeastcraft:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),selectManualSplitResult:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),previewManualCurrency:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),undoManualAction:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),redoManualAction:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),resetManualSession:()=>Promise.reject(new Error("仅 Electron 客户端支持手动做装")),updateData:()=>Promise.reject(new Error("仅 Electron 客户端支持数据更新")),cancelUpdate:()=>Promise.resolve({success:!0}),getPrices:()=>Promise.resolve({records:[],overrides:{},health:"unavailable"}),refreshPrices:()=>Promise.reject(new Error("仅 Electron 客户端支持价格更新")),setPriceOverride:()=>Promise.resolve({success:!0}),removePriceOverride:()=>Promise.resolve({success:!0}),startPlan:()=>Promise.reject(new Error("仅 Electron 客户端支持做装计算")),cancelPlan:()=>Promise.resolve({success:!0}),onUpdateProgress:()=>()=>{},onPlanEvent:()=>()=>{}}},fe=L4?{system:{detectGameDpi:()=>{var e,t;return(t=(e=window.electronAPI).detectGameDpi)==null?void 0:t.call(e)}},script:{executePython:(e,t)=>window.electronAPI.executePython(e,t),generateAndExecute:e=>window.electronAPI.generateAndExecuteScript(e),stop:()=>window.electronAPI.stopScript(),getStatus:()=>window.electronAPI.getScriptStatus(),detectPythonPath:()=>window.electronAPI.detectPythonPath()},file:{save:(e,t)=>window.electronAPI.saveFile(e,t),read:e=>window.electronAPI.readFile(e),getPaths:()=>window.electronAPI.getFilePaths(),watcher:{start:e=>window.electronAPI.startFileWatcher(e),stop:()=>window.electronAPI.stopFileWatcher()}},clipboard:{writeText:e=>cm(e,{electronWrite:window.electronAPI.writeClipboardText})},shortcut:{initFromSettings:e=>window.electronAPI.initShortcutsFromSettings(e),register:(e,t)=>window.electronAPI.registerGlobalShortcut(e,t),unregister:e=>window.electronAPI.unregisterGlobalShortcut(e),beginCapture:()=>{var e,t;return(t=(e=window.electronAPI).beginShortcutCapture)==null?void 0:t.call(e)},endCapture:()=>{var e,t;return(t=(e=window.electronAPI).endShortcutCapture)==null?void 0:t.call(e)},onTriggered:e=>window.electronAPI.onShortcutTriggered(e),onInit:e=>window.electronAPI.onInitShortcuts(e)},window:{minimize:()=>window.electronAPI.minimizeWindow(),maximize:()=>window.electronAPI.maximizeWindow(),close:()=>window.electronAPI.closeWindow(),closeOverlay:()=>window.electronAPI.closeOverlayWindow(),toggleAlwaysOnTop:()=>window.electronAPI.toggleAlwaysOnTop(),isAlwaysOnTop:()=>window.electronAPI.isAlwaysOnTop(),onMaximized:e=>window.electronAPI.onWindowMaximized(e),move:(e,t)=>window.electronAPI.moveWindow(e,t),openDebugOverlay:()=>{var e,t;return(t=(e=window.electronAPI).openDebugOverlay)==null?void 0:t.call(e)},closeDebugOverlay:()=>{var e,t;return(t=(e=window.electronAPI).closeDebugOverlay)==null?void 0:t.call(e)},updateDebugOverlay:e=>{var t,n;return(n=(t=window.electronAPI).updateDebugOverlay)==null?void 0:n.call(t,e)},setDevToolsVisible:e=>{var t,n;return(n=(t=window.electronAPI).setDevToolsVisible)==null?void 0:n.call(t,e)},getDevToolsVisible:()=>{var e,t;return(t=(e=window.electronAPI).getDevToolsVisible)==null?void 0:t.call(e)},onDevToolsVisibilityChanged:e=>{var t,n;return(n=(t=window.electronAPI).onDevToolsVisibilityChanged)==null?void 0:n.call(t,e)},pickScreenCoordinate:()=>{var e,t;return(t=(e=window.electronAPI).pickScreenCoordinate)==null?void 0:t.call(e)},getScreenPickerContext:()=>{var e,t;return(t=(e=window.electronAPI).getScreenPickerContext)==null?void 0:t.call(e)},submitScreenCoordinate:e=>{var t,n;return(n=(t=window.electronAPI).submitScreenCoordinate)==null?void 0:n.call(t,e)},submitScreenRegion:e=>{var t,n;return(n=(t=window.electronAPI).submitScreenRegion)==null?void 0:n.call(t,e)},cancelScreenCoordinatePicker:()=>{var e,t;return(t=(e=window.electronAPI).cancelScreenCoordinatePicker)==null?void 0:t.call(e)}},setIgnoreMouseEvents:(e,t)=>window.electronAPI.setIgnoreMouseEvents(e,t),events:{onPythonOutput:e=>window.electronAPI.onPythonScriptOutput(e),onUpdateOverlay:e=>window.electronAPI.onUpdateOverlay(e),onUpdateOverlaySettings:e=>window.electronAPI.onUpdateOverlaySettings(e),onScriptStopped:e=>window.electronAPI.onScriptStopped(e),onBagDetectionMatch:e=>{var t,n;return(n=(t=window.electronAPI).onBagDetectionMatch)==null?void 0:n.call(t,e)},onBagStashProgress:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashProgress)==null?void 0:n.call(t,e)},onBagStashCompleted:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashCompleted)==null?void 0:n.call(t,e)},onBagStashStopped:e=>{var t,n;return(n=(t=window.electronAPI).onBagStashStopped)==null?void 0:n.call(t,e)},onBagDetectionStopped:e=>{var t,n;return(n=(t=window.electronAPI).onBagDetectionStopped)==null?void 0:n.call(t,e)},onUpdateDebugOverlay:e=>{var t,n;return(n=(t=window.electronAPI).onUpdateDebugOverlay)==null?void 0:n.call(t,e)}},selectFile:()=>window.electronAPI.selectFile(),copyFileToProject:e=>window.electronAPI.copyFileToProject(e),overlay:{updateSettings:e=>window.electronAPI.updateOverlaySettings(e)},bag:{startDetection:e=>{var t,n;return(n=(t=window.electronAPI).startBagDetection)==null?void 0:n.call(t,e)},stopDetection:()=>{var e,t;return(t=(e=window.electronAPI).stopBagDetection)==null?void 0:t.call(e)},startStash:()=>{var e,t;return(t=(e=window.electronAPI).startBagStash)==null?void 0:t.call(e)},stopStash:()=>{var e,t;return(t=(e=window.electronAPI).stopBagStash)==null?void 0:t.call(e)},updateOperationDelay:e=>{var t,n;return(n=(t=window.electronAPI).updateBagOperationDelay)==null?void 0:n.call(t,e)},updatePreferences:e=>{var t,n;return(n=(t=window.electronAPI).updateBagPreferences)==null?void 0:n.call(t,e)},uploadTemplate:(e,t)=>{var n,r;return(r=(n=window.electronAPI).uploadBagTemplate)==null?void 0:r.call(n,e,t)},captureTemplate:e=>{var t,n;return(n=(t=window.electronAPI).captureBagTemplate)==null?void 0:n.call(t,e)},getOverlayState:()=>{var e,t;return(t=(e=window.electronAPI).getBagStashOverlayState)==null?void 0:t.call(e)},onOverlayState:e=>{var t,n;return((n=(t=window.electronAPI).onBagStashOverlayState)==null?void 0:n.call(t,e))||(()=>{})}},combat:{startPotion:e=>{var t,n;return(n=(t=window.electronAPI).startPotionAssist)==null?void 0:n.call(t,e)},stopPotion:()=>{var e,t;return(t=(e=window.electronAPI).stopPotionAssist)==null?void 0:t.call(e)},getPotionStatus:()=>{var e,t;return(t=(e=window.electronAPI).getPotionAssistStatus)==null?void 0:t.call(e)},samplePixel:e=>{var t,n;return(n=(t=window.electronAPI).sampleCombatPixel)==null?void 0:n.call(t,e)},executePortal:e=>{var t,n;return(n=(t=window.electronAPI).executePortalAssist)==null?void 0:n.call(t,e)},onStatus:e=>{var t,n;return((n=(t=window.electronAPI).onCombatStatus)==null?void 0:n.call(t,e))||(()=>{})}},storyOverlay:{open:(e,t)=>{var n,r;return(r=(n=window.electronAPI).openStoryOverlay)==null?void 0:r.call(n,e,t)},close:()=>{var e,t;return(t=(e=window.electronAPI).closeStoryOverlay)==null?void 0:t.call(e)},update:e=>{var t,n;return(n=(t=window.electronAPI).updateStoryOverlay)==null?void 0:n.call(t,e)},getState:()=>{var e,t;return(t=(e=window.electronAPI).getStoryOverlayState)==null?void 0:t.call(e)},resize:e=>{var t,n;return(n=(t=window.electronAPI).resizeStoryOverlay)==null?void 0:n.call(t,e)},onState:e=>{var t,n;return((n=(t=window.electronAPI).onStoryOverlayState)==null?void 0:n.call(t,e))||(()=>{})}},crafting:{getStatus:()=>{var e,t;return(t=(e=window.electronAPI).getCraftingStatus)==null?void 0:t.call(e)},listCategories:()=>{var e,t;return(t=(e=window.electronAPI).listCraftingCategories)==null?void 0:t.call(e)},searchBases:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingBases)==null?void 0:n.call(t,xe(e))},searchModifiers:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingModifiers)==null?void 0:n.call(t,xe(e))},searchModifierCatalog:e=>{var t,n;return(n=(t=window.electronAPI).searchCraftingModifierCatalog)==null?void 0:n.call(t,xe(e))},createManualSession:e=>{var t,n;return(n=(t=window.electronAPI).createManualCraftingSession)==null?void 0:n.call(t,xe(e))},applyManualCurrency:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingCurrency)==null?void 0:r.call(n,xe(e),t)},listManualEssences:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingEssences)==null?void 0:n.call(t,xe(e))},applyManualEssence:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingEssence)==null?void 0:r.call(n,xe(e),t)},listManualBenchCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingBenchCrafts)==null?void 0:n.call(t,xe(e))},applyManualBenchCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingBenchCraft)==null?void 0:r.call(n,xe(e),t)},listManualFossils:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingFossils)==null?void 0:n.call(t,xe(e))},applyManualFossils:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingFossils)==null?void 0:r.call(n,xe(e),xe(t))},listManualHarvestCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingHarvestCrafts)==null?void 0:n.call(t,xe(e))},applyManualHarvestCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingHarvestCraft)==null?void 0:r.call(n,xe(e),t)},listManualEldritchCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingEldritchCrafts)==null?void 0:n.call(t,xe(e))},applyManualEldritchCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingEldritchCraft)==null?void 0:r.call(n,xe(e),t)},listManualInfluenceCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingInfluenceCrafts)==null?void 0:n.call(t,xe(e))},listAwakenerDonorCandidates:(e,t)=>{var n,r;return(r=(n=window.electronAPI).listAwakenerDonorCandidates)==null?void 0:r.call(n,xe(e),xe(t))},configureAwakenerDonor:(e,t)=>{var n,r;return(r=(n=window.electronAPI).configureAwakenerDonor)==null?void 0:r.call(n,xe(e),xe(t))},clearAwakenerDonor:e=>{var t,n;return(n=(t=window.electronAPI).clearAwakenerDonor)==null?void 0:n.call(t,xe(e))},applyManualInfluenceCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingInfluenceCraft)==null?void 0:r.call(n,xe(e),t)},listManualVeiledCrafts:e=>{var t,n;return(n=(t=window.electronAPI).listManualCraftingVeiledCrafts)==null?void 0:n.call(t,xe(e))},applyManualVeiledCraft:(e,t)=>{var n,r;return(r=(n=window.electronAPI).applyManualCraftingVeiledCraft)==null?void 0:r.call(n,xe(e),t)},selectManualVeiledOption:(e,t,n)=>{var r,o;return(o=(r=window.electronAPI).selectManualCraftingVeiledOption)==null?void 0:o.call(r,xe(e),t,n)},listManualBeastcrafts:(e,t)=>{var n,r;return(r=(n=window.electronAPI).listManualCraftingBeastcrafts)==null?void 0:r.call(n,xe(e),xe(t))},applyManualBeastcraft:(e,t,n)=>{var r,o;return(o=(r=window.electronAPI).applyManualCraftingBeastcraft)==null?void 0:o.call(r,xe(e),t,xe(n))},selectManualSplitResult:(e,t)=>{var n,r;return(r=(n=window.electronAPI).selectManualCraftingSplitResult)==null?void 0:r.call(n,xe(e),t)},previewManualCurrency:(e,t)=>{var n,r;return(r=(n=window.electronAPI).previewManualCraftingCurrency)==null?void 0:r.call(n,xe(e),t)},undoManualAction:e=>{var t,n;return(n=(t=window.electronAPI).undoManualCraftingAction)==null?void 0:n.call(t,xe(e))},redoManualAction:e=>{var t,n;return(n=(t=window.electronAPI).redoManualCraftingAction)==null?void 0:n.call(t,xe(e))},resetManualSession:e=>{var t,n;return(n=(t=window.electronAPI).resetManualCraftingSession)==null?void 0:n.call(t,xe(e))},updateData:()=>{var e,t;return(t=(e=window.electronAPI).updateCraftingData)==null?void 0:t.call(e)},cancelUpdate:()=>{var e,t;return(t=(e=window.electronAPI).cancelCraftingUpdate)==null?void 0:t.call(e)},getPrices:()=>{var e,t;return(t=(e=window.electronAPI).getCraftingPrices)==null?void 0:t.call(e)},refreshPrices:(e=!1)=>{var t,n;return(n=(t=window.electronAPI).refreshCraftingPrices)==null?void 0:n.call(t,e)},setPriceOverride:(e,t)=>{var n,r;return(r=(n=window.electronAPI).setCraftingPriceOverride)==null?void 0:r.call(n,e,t)},removePriceOverride:e=>{var t,n;return(n=(t=window.electronAPI).removeCraftingPriceOverride)==null?void 0:n.call(t,e)},startPlan:(e,t)=>{var n,r;return(r=(n=window.electronAPI).startCraftingPlan)==null?void 0:r.call(n,e,t)},cancelPlan:e=>{var t,n;return(n=(t=window.electronAPI).cancelCraftingPlan)==null?void 0:n.call(t,e)},onUpdateProgress:e=>{var t,n;return((n=(t=window.electronAPI).onCraftingUpdateProgress)==null?void 0:n.call(t,e))||(()=>{})},onPlanEvent:e=>{var t,n;return((n=(t=window.electronAPI).onCraftingPlanEvent)==null?void 0:n.call(t,e))||(()=>{})}}}:D4,B4={class:"title-bar"},$4={class:"title-content"},j4={class:"window-controls"},H4=["title"],V4={__name:"TitleBar",setup(e){const t=B(!1);async function n(){t.value=await fe.window.toggleAlwaysOnTop()}function r(){fe.window.minimize()}function o(){fe.window.maximize()}function s(){fe.window.close()}return st(async()=>{t.value=await fe.window.isAlwaysOnTop()}),(i,a)=>{const l=Dr;return Y(),ie("div",B4,[Q("div",$4,[re(l,{class:"app-logo-icon"},{default:de(()=>[re(x(b2))]),_:1}),a[0]||(a[0]=Q("span",{class:"app-title"},"流放助手",-1))]),Q("div",j4,[Q("div",{class:De(["control-btn",{active:t.value}]),onClick:n,title:t.value?"取消置顶":"置顶"},[re(l,{class:"rotate-icon"},{default:de(()=>[re(x(n2))]),_:1})],10,H4),Q("div",{class:"control-btn",onClick:r,title:"最小化"},[re(l,null,{default:de(()=>[re(x(v2))]),_:1})]),Q("div",{class:"control-btn",onClick:o,title:"最大化"},[re(l,null,{default:de(()=>[re(x(u2))]),_:1})]),Q("div",{class:"control-btn close-btn",onClick:s,title:"关闭"},[re(l,null,{default:de(()=>[re(x(Ja))]),_:1})])])])}}},W4=Qs(V4,[["__scopeId","data-v-75b33088"]]),z4=`#!/usr/bin/env python3
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
`,U4=`#!/usr/bin/env python3
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
`,nr=Object.freeze({default:80,min:20,max:500}),ro=e=>{if(e==null||typeof e=="boolean"||typeof e=="string"&&e.trim()==="")return null;const t=Number(e);return Number.isFinite(t)?t:null};function rr(e){const t=ro(e)??nr.default;return Math.max(nr.min,Math.min(nr.max,t))}function G4(e={},t={}){if(e.operationDelayMs!=null)return rr(e.operationDelayMs);const n=ro(t.transferDelayMs);if(n!=null)return rr(n);const r=e.delays;if(r&&typeof r=="object"){const o=[(ro(r.mouseMove)??100)*.05,(ro(r.action)??50)*.2,(ro(r.clipboardRead)??100)*.2];return rr(Math.max(nr.default,...o))}return nr.default}const um=`def enable_per_monitor_dpi_awareness():
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
`;function K4(e){var D,A;const{globalShortcuts:t,currencyPositions:n,operationDelayMs:r,itemPosition:o,preset:s,filePaths:i,dpiScale:a=1}=e,l=(i==null?void 0:i.itemInfoFile)||"temp/item_info.txt",c=(i==null?void 0:i.itemInfoResultFile)||"temp/item_info_result.json",u=rr(r),f=(u/1e3).toFixed(3),p=v=>v.replace(/\\/g,"\\\\"),d=v=>v.split("+").map(I=>I.trim()).map(I=>{const M=I.toLowerCase();switch(M){case"commandorcontrol":case"cmdorctrl":case"control":case"ctrl":return"<ctrl>";case"alt":return"<alt>";case"shift":return"<shift>";case"meta":case"super":return"<cmd>";case"space":return"<space>";case"enter":case"return":return"<enter>";case"esc":case"escape":return"<esc>";case"tab":return"<tab>";case"up":return"<up>";case"down":return"<down>";case"left":return"<left>";case"right":return"<right>";default:return/^f\d+$/.test(M)?"<"+M+">":M}}).join("+"),m=()=>{if(!s.moduleTwo||!s.moduleTwo.enabled)return`def craft_affixes():
    return True`;const v=s.moduleTwo.mode||"alteration",R=s.moduleTwo.enableAugmentation||!1,U=s.moduleTwo.enableRegal||!1,I=s.moduleTwo.enableExalted||!1;let M=`def craft_affixes():
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
`;return v==="alteration"?M+=`
            if rarity == "魔法":
                is_ready = True
            elif rarity == "普通":
                action_needed = "transmutation"
            else:
                # 其他情况（如稀有）都需要重铸
                action_needed = "scouring"
`:v==="chaos"?M+=`
            if rarity == "稀有":
                is_ready = True
            elif rarity == "普通":
                action_needed = "alchemy"
            else:
                # 魔法物品需要重铸
                action_needed = "scouring"
`:v==="alchemy"&&(M+=`
            # 点金模式：从普通开始点金
            if rarity == "普通":
                is_ready = True
            else:
                action_needed = "scouring"
`),M+=`
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
`,M+=`
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
            
`,v==="alteration"?M+=`
            # 使用改造石
            print(f"[操作] 第 {iteration} 次 - 使用改造石")
            if not apply_currency("alteration"):
                print("[错误] 使用改造石失败，重试...")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`:v==="chaos"?M+=`
            # 使用混沌石
            print(f"[操作] 第 {iteration} 次 - 使用混沌石")
            if not apply_currency("chaos"):
                print("[错误] 使用混沌石失败，跳过本次循环")
                time.sleep(0.05)
                continue
            time.sleep(0.05)
`:v==="alchemy"&&(M+=`
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
`),M+=`
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
            if ${v==="alteration"&&R?"True":"False"} and result.get("rarity") == "魔法":
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
`,v==="alteration"?(R&&(M+=`
                # 使用增幅石
                print("[操作] 使用增幅石")
                if not apply_currency("augmentation"):
                    print("[错误] 使用增幅石失败")
                    return False
                time.sleep(0.05)
`),U&&(M+=`
                # 使用富豪石
                print("[操作] 使用富豪石")
                if not apply_currency("regal"):
                    print("[错误] 使用富豪石失败")
                    return False
                time.sleep(0.05)
`)):v==="chaos"&&I&&(M+=`
                # 使用崇高石
                print("[操作] 使用崇高石")
                if not apply_currency("exalted"):
                    print("[错误] 使用崇高石失败")
                    return False
                time.sleep(0.05)
`),M+=`
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
`,M},h=()=>{if(!s.moduleThree||!s.moduleThree.enabled)return`def craft_sockets():
    return True`;const v=s.moduleThree.socket||{},R=s.moduleThree.link||{},U=s.moduleThree.color||{};let I=`def craft_sockets():
    # 插槽制作逻辑
`;return v.enabled&&v.count>0?I+=`
    # 开孔流程
    if craft_socket_count(${v.count}):
`:I+=`
    # 跳过开孔流程
    if True:
`,R.enabled&&R.count>0?I+=`
        # 链接流程
        if craft_links(${R.count}):
`:I+=`
        # 跳过链接流程
        if True:
`,U.enabled&&(U.red>0||U.green>0||U.blue>0)?I+=`
            # 颜色流程
            if craft_colors(${U.red}, ${U.green}, ${U.blue}):
                print("[完成] 插槽制作完成！")
                time.sleep(2)
                return True
`:I+=`
            # 跳过颜色流程
            print("[完成] 插槽制作完成！")
            time.sleep(2)
            return True
`,I+=`
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
`,I},S=(t==null?void 0:t.end)||"Alt+3",b=d(S)||"<alt>+3",C={};if(n)for(const[v,R]of Object.entries(n))R&&(C[v]={x:Math.floor(R.x||0),y:Math.floor(R.y||0)});const y={x:Math.floor((o==null?void 0:o.x)||0),y:Math.floor((o==null?void 0:o.y)||0)};let E=z4;const N=v=>v.replace(/\btrue\b/g,"True").replace(/\bfalse\b/g,"False"),z={"{{GEN_DATE}}":new Date().toLocaleString(),"{{ITEM_INFO_FILE}}":p(l),"{{ITEM_INFO_RESULT_FILE}}":p(c),"{{DELAY_MOUSE_MOVE}}":f,"{{DELAY_MOUSE_CLICK}}":f,"{{DELAY_CLIPBOARD}}":u.toFixed(0),"{{CURRENCY_POSITIONS}}":N(JSON.stringify(C)),"{{ITEM_POSITION}}":N(JSON.stringify(y)),"{{DPI_SCALE_FACTOR}}":String(Math.min(3,Math.max(1,Number(a)||1))),"{{STOP_SHORTCUT}}":S,"{{PYNPUT_STOP_SHORTCUT}}":b,"{{ENABLE_AFFIX}}":(D=s.moduleTwo)!=null&&D.enabled?"True":"False","{{ENABLE_SOCKET}}":(A=s.moduleThree)!=null&&A.enabled?"True":"False","{{AFFIX_CRAFTING_FUNC}}":m(),"{{SOCKET_CRAFTING_FUNC}}":h(),"{{DPI_AWARENESS}}":um};for(const[v,R]of Object.entries(z))E=E.split(v).join(R);return E}function q4(e){var z,D,A,v;const{globalShortcuts:t,currencyPositions:n,inventory:r,operationDelayMs:o,mapConfig:s,filePaths:i,dpiScale:a=1}=e,l=(i==null?void 0:i.itemInfoFile)||"temp/item_info.txt",c=(i==null?void 0:i.itemInfoResultFile)||"temp/item_info_result.json",u=rr(o),f=(u/1e3).toFixed(3),p=R=>R.replace(/\\/g,"\\\\"),d=R=>R.split("+").map(I=>I.trim()).map(I=>{const M=I.toLowerCase(),W={ctrl:"<ctrl>",control:"<ctrl>",alt:"<alt>",shift:"<shift>",cmd:"<cmd>",meta:"<cmd>",enter:"<enter>",return:"<enter>",esc:"<esc>",escape:"<esc>",tab:"<tab>",up:"<up>",down:"<down>",left:"<left>",right:"<right>"};return W[M]?W[M]:/^f\d+$/.test(M)?"<"+M+">":M}).join("+"),m=(t==null?void 0:t.end)||"Alt+3",h=d(m)||"<alt>+3",S={};if(n)for(const[R,U]of Object.entries(n))U&&(S[R]={x:Math.floor(U.x||0),y:Math.floor(U.y||0)});const b=s.grid||{},C={rows:b.rows||5,cols:b.cols||12,startX:((z=r==null?void 0:r.startPos)==null?void 0:z.x)||0,startY:((D=r==null?void 0:r.startPos)==null?void 0:D.y)||0,offsetX:((A=r==null?void 0:r.slotSize)==null?void 0:A.w)||0,offsetY:((v=r==null?void 0:r.slotSize)==null?void 0:v.h)||0};let y=U4;const E=R=>R.replace(/\btrue\b/g,"True").replace(/\bfalse\b/g,"False"),N={"{{GEN_DATE}}":new Date().toLocaleString(),"{{ITEM_INFO_FILE}}":p(l),"{{ITEM_INFO_RESULT_FILE}}":p(c),"{{DELAY_MOUSE_MOVE}}":f,"{{DELAY_MOUSE_CLICK}}":f,"{{DELAY_CLIPBOARD}}":u.toFixed(0),"{{CURRENCY_POSITIONS}}":E(JSON.stringify(S)),"{{GRID_CONFIG}}":E(JSON.stringify(C)),"{{MAP_CONFIG}}":E(JSON.stringify(s)),"{{DPI_SCALE_FACTOR}}":String(Math.min(3,Math.max(1,Number(a)||1))),"{{STOP_SHORTCUT}}":m,"{{PYNPUT_STOP_SHORTCUT}}":h,"{{DPI_AWARENESS}}":um};for(const[R,U]of Object.entries(N))y=y.split(R).join(U);return y}const J4=e=>{var o,s;const t=[],{itemPosition:n}=e;(!n||n.x===0&&n.y===0)&&t.push("物品位置未配置，请先在设置中抓取物品坐标");const{preset:r}=e;if(!r)t.push("未选择预设配置");else{const i=(o=r.moduleTwo)==null?void 0:o.enabled,a=(s=r.moduleThree)==null?void 0:s.enabled;if(!i&&!a&&t.push("请至少启用一个制作模块 (词缀或插槽)"),i){const l=r.moduleTwo.mode||"alteration",{currencyPositions:c}=e,u=(f,p)=>{(!(c!=null&&c[f])||c[f].x===0&&c[f].y===0)&&t.push(`未配置 ${p} (${f}) 的坐标`)};l==="alteration"?(u("alteration","改造石"),r.moduleTwo.enableAugmentation&&u("augmentation","增幅石"),r.moduleTwo.enableRegal&&u("regal","富豪石")):l==="chaos"?(u("chaos","混沌石"),r.moduleTwo.enableExalted&&u("exalted","崇高石")):l==="alchemy"&&(u("alchemy","点金石"),u("scouring","重铸石"))}if(a){const{currencyPositions:l}=e,c=r.moduleThree.socket,u=r.moduleThree.link,f=r.moduleThree.color,p=(d,m)=>{(!(l!=null&&l[d])||l[d].x===0&&l[d].y===0)&&t.push(`未配置 ${m} (${d}) 的坐标`)};c!=null&&c.enabled&&p("jewellers","工匠石"),u!=null&&u.enabled&&p("fusing","链结石"),f!=null&&f.enabled&&p("chromic","幻色石")}}return{isValid:t.length===0,errors:t}},Y4=e=>{var a;const t=[],{inventory:n,currencyPositions:r,mapConfig:o}=e;if(!o)return t.push("未找到地图配置"),{isValid:!1,errors:t};(!(n!=null&&n.startPos)||n.startPos.x===0&&n.startPos.y===0)&&t.push("背包首格坐标未配置，请先在设置中填写"),(!(n!=null&&n.slotSize)||n.slotSize.w<=0||n.slotSize.h<=0)&&t.push("背包单格宽高未配置，请先在设置中填写");const s=(l,c)=>{(!(r!=null&&r[l])||r[l].x===0&&r[l].y===0)&&t.push(`未配置 ${c} (${l}) 的坐标`)},i=o.method||"alchemy";return i==="alchemy"?(s("alchemy","点金石"),s("scouring","重铸石")):i==="chaos"?(s("alchemy","点金石"),s("scouring","重铸石"),s("chaos","混沌石")):t.push(`未知的地图制作方式: ${i}`),(a=o.vaal)!=null&&a.enabled&&s("vaal","瓦尔宝珠"),{isValid:t.length===0,errors:t}},qE={物品数量:"quantity",物品稀有度:"rarity",怪物群大小:"packSize",更多地图:"moreMaps",更多圣甲虫:"moreScarabs",更多通货:"moreCurrency"},X4={quantity:["quantity","quantityNormal","quantityT17"],rarity:["rarity","rarityNormal","rarityT17"],packSize:["packSize","packSizeNormal","packSizeT17"]},Z4=["moreMaps","moreScarabs","moreCurrency"];function Bu(e){return{enabled:!!(e!=null&&e.enabled),value:Number.isFinite(Number(e==null?void 0:e.value))?Number(e.value):0}}function Os(e={}){var n;const t={};for(const[r,o]of Object.entries(X4)){const s=o.filter(a=>e[a]).map(a=>Bu(e[a])),i=s.filter(a=>a.enabled);t[r]={enabled:i.length>0,value:i.length>0?Math.max(...i.map(a=>a.value)):((n=s[0])==null?void 0:n.value)??0}}for(const r of Z4)t[r]=Bu(e[r]);return t}function sa(){return{method:"alchemy",vaal:{enabled:!0,checkAfter:!1},autoStash:!0,grid:{startX:0,startY:0,offsetX:0,offsetY:0,rows:5,cols:12},match:{blacklist:[],whitelist:[],selectedCount:1,mandatoryStats:Os(),optionalStats:Os()}}}function Q4(e={}){const t=sa(),n=e.match||{};return{...t,...e,vaal:{...t.vaal,...e.vaal||{}},grid:{...t.grid,...e.grid||{}},match:{...t.match,...n,blacklist:Array.isArray(n.blacklist)?n.blacklist:[],whitelist:Array.isArray(n.whitelist)?n.whitelist:[],selectedCount:Math.max(1,Number(n.selectedCount)||1),mandatoryStats:Os(n.mandatoryStats),optionalStats:Os(n.optionalStats)},strategy:void 0,tiers:void 0}}function e3(e={}){const t=Q4(e);return delete t.strategy,delete t.tiers,t}const JE=Object.freeze({locale:"zh-CN",gameVersion:"国服正式服-2026-07",updatedAt:"2026-07-21",source:"国服客户端商店文本离线快照"}),t3=Object.freeze([{id:"rr_any",label:"红红任意",preview:"RR*",expression:"r-r-|r-.-r|-r-r"},{id:"gg_any",label:"绿绿任意",preview:"GG*",expression:"g-g-|g-.-g|-g-g"},{id:"bb_any",label:"蓝蓝任意",preview:"BB*",expression:"b-b-|b-.-b|-b-b"},{id:"rrr",label:"三红",preview:"RRR",expression:"r-r-r"},{id:"rrg",label:"两红一绿",preview:"RRG",expression:"r-r-g|r-g-r|g-r-r"},{id:"rrb",label:"两红一蓝",preview:"RRB",expression:"r-r-b|r-b-r|b-r-r"},{id:"ggg",label:"三绿",preview:"GGG",expression:"g-g-g"},{id:"ggr",label:"两绿一红",preview:"GGR",expression:"g-g-r|g-r-g|r-g-g"},{id:"ggb",label:"两绿一蓝",preview:"GGB",expression:"g-g-b|g-b-g|b-g-g"},{id:"bbb",label:"三蓝",preview:"BBB",expression:"b-b-b"},{id:"bbr",label:"两蓝一红",preview:"BBR",expression:"b-b-r|b-r-b|r-b-b"},{id:"bbg",label:"两蓝一绿",preview:"BBG",expression:"b-b-g|b-g-b|g-b-b"},{id:"rgb",label:"红绿蓝",preview:"RGB",expression:"r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r"},{id:"r_any_any",label:"至少一红",preview:"R**",expression:"r-.-.|.-r-.|.-.-r"},{id:"g_any_any",label:"至少一绿",preview:"G**",expression:"g-.-.|.-g-.|.-.-g"},{id:"b_any_any",label:"至少一蓝",preview:"B**",expression:"b-.-.|.-b-.|.-.-b"}]),n3=Object.freeze([{id:"rr",label:"红红",preview:"RR",expression:"r-r"},{id:"gg",label:"绿绿",preview:"GG",expression:"g-g"},{id:"bb",label:"蓝蓝",preview:"BB",expression:"b-b"},{id:"rb",label:"红蓝",preview:"RB",expression:"r-b|b-r"},{id:"gr",label:"绿红",preview:"GR",expression:"g-r|r-g"},{id:"bg",label:"蓝绿",preview:"BG",expression:"b-g|g-b"}]),r3=Object.freeze([{id:"any_colored_two",label:"任意双色相连",expression:"r-g|g-r|r-b|b-r|g-b|b-g"},{id:"any_colored_three",label:"任意三色相连",expression:"r-g-b|r-b-g|g-r-b|g-b-r|b-r-g|b-g-r"},{id:"any_three",label:"任意三连",expression:"-[rgbw]-"},{id:"any_four",label:"任意四连",expression:"(-[rgbw]){3}"},{id:"any_five",label:"任意五连",expression:"(-[rgbw]){4}"},{id:"any_six",label:"任意六连",expression:"(-[rgbw]){5}"},{id:"any_six_socket",label:"任意六孔",expression:"([rgbw][ -]){5}[rgbw]"}]),o3=Object.freeze([{id:"movement_10",label:"移动速度提高 10%",expression:"移动速度.*10%"},{id:"movement_15",label:"移动速度提高 15%",expression:"移动速度.*15%"}]),s3=Object.freeze([{id:"plus_any",label:"+1 任意法术技能石",expression:"所有法术.*技能石等级.*1"},{id:"plus_lightning",label:"+1 闪电法术技能石",expression:"闪电法术.*技能石等级.*1"},{id:"plus_fire",label:"+1 火焰法术技能石",expression:"火焰法术.*技能石等级.*1"},{id:"plus_cold",label:"+1 冰霜法术技能石",expression:"冰霜法术.*技能石等级.*1"},{id:"plus_physical",label:"+1 物理法术技能石",expression:"物理.*法术.*技能石等级.*1"},{id:"plus_chaos",label:"+1 混沌法术技能石",expression:"混沌法术.*技能石等级.*1"}]),i3=Object.freeze([{id:"physical_damage",label:"物理伤害提高",expression:"物理伤害提高"},{id:"fire_dot",label:"火焰持续伤害加成",expression:"火焰持续伤害加成"},{id:"cold_dot",label:"冰霜持续伤害加成",expression:"冰霜持续伤害加成"},{id:"chaos_dot",label:"混沌持续伤害加成",expression:"混沌持续伤害加成"}]),a3=Object.freeze([{id:"axe",label:"斧",expression:"物品类别:.+斧"},{id:"mace",label:"锤",expression:"物品类别:.+锤"},{id:"sword",label:"剑",expression:"物品类别:.+剑"},{id:"staff",label:"长杖",expression:"物品类别:.+长杖"},{id:"sceptre",label:"权杖",expression:"物品类别:.+权杖"},{id:"claw",label:"爪",expression:"物品类别:.+爪"},{id:"bow",label:"弓",expression:"物品类别:.+弓"},{id:"wand",label:"法杖",expression:"物品类别:.+法杖"},{id:"dagger",label:"匕首",expression:"物品类别:.+匕首"},{id:"shield",label:"盾牌",expression:"物品类别:.+盾牌"}]),l3=Object.freeze({threeLinks:t3,twoLinks:n3,anyLinks:r3,movement:o3,plusGems:s3,damage:i3,weaponTypes:a3}),Un=Object.fromEntries(Object.entries(l3).map(([e,t])=>[e,new Set(t.map(n=>n.id))]));function c3(){return{threeLinks:[],twoLinks:[],anyLinks:[],exactColors:{enabled:!1,red:0,green:0,blue:0},movement:[],plusGems:[],damage:[],weaponTypes:[]}}const Gn=(e,t)=>Array.isArray(e)?[...new Set(e.filter(n=>typeof n=="string"&&t.has(n)))]:[],Ci=e=>{const t=Number(e);return Number.isFinite(t)?Math.max(0,Math.min(6,Math.trunc(t))):0};function u3(e){const t=e&&typeof e=="object"?e:{},n=t.exactColors&&typeof t.exactColors=="object"?t.exactColors:{};return{threeLinks:Gn(t.threeLinks,Un.threeLinks),twoLinks:Gn(t.twoLinks,Un.twoLinks),anyLinks:Gn(t.anyLinks,Un.anyLinks),exactColors:{enabled:!!n.enabled,red:Ci(n.red),green:Ci(n.green),blue:Ci(n.blue)},movement:Gn(t.movement,Un.movement),plusGems:Gn(t.plusGems,Un.plusGems),damage:Gn(t.damage,Un.damage),weaponTypes:Gn(t.weaponTypes,Un.weaponTypes)}}function Xn(e="default",t="默认预设"){return{id:e,name:t,vendor:c3()}}function f3(e,t="default",n="默认预设"){const r=e&&typeof e=="object"?e:{};return{id:typeof r.id=="string"&&r.id?r.id:t,name:typeof r.name=="string"&&r.name.trim()?r.name.trim():n,vendor:u3(r.vendor)}}function p3(e){if(!Array.isArray(e))return[Xn()];const t=[],n=new Set;return e.forEach((o,s)=>{const i=f3(o,`shop_preset_${s+1}`,`预设${s+1}`);n.has(i.id)||(n.add(i.id),t.push(i))}),t.findIndex(o=>o.id==="default")===-1&&t.unshift(Xn()),t.length?t:[Xn()]}const fm=zr("preset",()=>{const e=B([{id:"default",name:"默认预设",moduleTwo:{enabled:!0,mode:"alteration",requiredAffixes:[],selectedAffixes:[],selectedCount:1,enableAugmentation:!1,enableRegal:!1,enableExalted:!1},moduleThree:{enabled:!1,socket:{enabled:!1,count:0},link:{enabled:!1,count:0},color:{enabled:!1,red:0,green:0,blue:0}}}]),t=B([{id:"default",name:"默认预设",map:sa()}]),n=B([Xn()]),r=B("default"),o=B("default"),s=B("default"),i=k(()=>e.value.find(A=>A.id===r.value)||e.value[0]),a=k(()=>t.value.find(A=>A.id===o.value)||t.value[0]),l=k(()=>n.value.find(A=>A.id===s.value)||n.value[0]);function c(A){const v={id:`preset_${Date.now()}`,name:A||`预设${e.value.length}`,moduleTwo:{enabled:!0,mode:"alteration",requiredAffixes:[],selectedAffixes:[],selectedCount:1,enableAugmentation:!1,enableRegal:!1,enableExalted:!1},moduleThree:{enabled:!1,socket:{enabled:!1,count:0},link:{enabled:!1,count:0},color:{enabled:!1,red:0,green:0,blue:0}}};return e.value.push(v),r.value=v.id,N(),v}function u(A){const v={id:`map_preset_${Date.now()}`,name:A||`预设${t.value.length}`,map:sa()};return t.value.push(v),o.value=v.id,N(),v}function f(A){const v=Xn(`shop_preset_${Date.now()}`,A||`预设${n.value.length}`);return n.value.push(v),s.value=v.id,N(),v}function p(A){if(A==="default")return!1;const v=e.value.findIndex(R=>R.id===A);return v>-1?(e.value.splice(v,1),r.value===A&&(r.value="default"),N(),!0):!1}function d(A){if(A==="default")return!1;const v=t.value.findIndex(R=>R.id===A);return v>-1?(t.value.splice(v,1),o.value===A&&(o.value="default"),N(),!0):!1}function m(A){if(A==="default")return!1;const v=n.value.findIndex(R=>R.id===A);return v>-1?(n.value.splice(v,1),s.value===A&&(s.value="default"),N(),!0):!1}function h(A){return e.value.find(R=>R.id===A)?(r.value=A,N(),!0):!1}function S(A){return t.value.find(R=>R.id===A)?(o.value=A,N(),!0):!1}function b(A){return n.value.find(R=>R.id===A)?(s.value=A,N(),!0):!1}function C(A){const v=i.value;v&&(Object.assign(v,A),N())}function y(A){const v=a.value;v&&(Object.assign(v,A),N())}function E(A){const v=l.value;v&&(Object.assign(v,A),N())}function N(){try{localStorage.setItem("itemPresets",JSON.stringify(e.value)),localStorage.setItem("currentItemPresetId",r.value),localStorage.setItem("mapPresets",JSON.stringify(t.value)),localStorage.setItem("currentMapPresetId",o.value),localStorage.setItem("shopPresets",JSON.stringify(n.value)),localStorage.setItem("currentShopPresetId",s.value)}catch{}}function z(){try{const A=localStorage.getItem("itemPresets"),v=localStorage.getItem("currentItemPresetId"),R=localStorage.getItem("mapPresets"),U=localStorage.getItem("currentMapPresetId"),I=localStorage.getItem("presets"),M=localStorage.getItem("currentPresetId");if(A)e.value=JSON.parse(A);else if(I){const W=JSON.parse(I);W.forEach(X=>{X.map&&delete X.map,X.moduleOne&&delete X.moduleOne,X.shortcuts&&delete X.shortcuts}),e.value=W}if(v?r.value=v:M&&e.value.find(W=>W.id===M)&&(r.value=M),R){const W=JSON.parse(R);W.forEach(X=>{const G=X.map||{};G.chisel&&delete G.chisel,X.map=e3(G)}),t.value=W}U&&(o.value=U)}catch{}}function D(){try{const A=localStorage.getItem("shopPresets"),v=localStorage.getItem("currentShopPresetId");n.value=A?p3(JSON.parse(A)):[Xn()],s.value=n.value.some(R=>R.id===v)?v:"default"}catch{n.value=[Xn()],s.value="default"}}return z(),D(),{itemPresets:e,mapPresets:t,shopPresets:n,currentItemPresetId:r,currentMapPresetId:o,currentShopPresetId:s,currentItemPreset:i,currentMapPreset:a,currentShopPreset:l,presets:e,currentPresetId:r,currentPreset:i,addPreset:c,deletePreset:p,switchPreset:h,updateCurrentPreset:C,addItemPreset:c,addMapPreset:u,addShopPreset:f,deleteItemPreset:p,deleteMapPreset:d,deleteShopPreset:m,switchItemPreset:h,switchMapPreset:S,switchShopPreset:b,updateCurrentItemPreset:C,updateCurrentMapPreset:y,updateCurrentShopPreset:E,savePresets:N,loadPresets:z,loadShopPresets:D}}),$u={enabled:!0,point:{x:0,y:0},threshold:60,keys:[],recoveryMode:"duration",recoveryCooldownMs:500,instantIntervalMs:100};function ia(){return{potion:{scanIntervalMs:100,maxTriggersPerSecond:5,protectionCooldownMs:1e3,health:{...$u,point:{x:200,y:1850},threshold:60,keys:["1","2","3","4","5","w"]},mana:{...$u,point:{x:3622,y:1944},threshold:80,keys:["5"],recoveryCooldownMs:2e3}},portal:{openKey:"Numpad1",clickPoint:{x:1908,y:890},waitMs:500}}}function xr(e,t,n=1){const r=Number(e);return Number.isFinite(r)&&r>=n?r:t}function ju(e,t){var n,r;return{...t,...e||{},enabled:(e==null?void 0:e.enabled)===void 0?t.enabled:!!e.enabled,point:{x:Number.isFinite(Number((n=e==null?void 0:e.point)==null?void 0:n.x))?Number(e.point.x):t.point.x,y:Number.isFinite(Number((r=e==null?void 0:e.point)==null?void 0:r.y))?Number(e.point.y):t.point.y},threshold:Math.min(255,Math.max(0,Number((e==null?void 0:e.threshold)??t.threshold))),keys:Array.isArray(e==null?void 0:e.keys)?e.keys.map(o=>String(o).trim()).filter(Boolean):t.keys,recoveryMode:(e==null?void 0:e.recoveryMode)==="instant"?"instant":"duration",recoveryCooldownMs:xr(e==null?void 0:e.recoveryCooldownMs,t.recoveryCooldownMs),instantIntervalMs:xr(e==null?void 0:e.instantIntervalMs,t.instantIntervalMs)}}function Hu(e={}){var n,r,o,s,i,a,l,c,u,f,p;const t=ia();return{potion:{scanIntervalMs:xr((n=e.potion)==null?void 0:n.scanIntervalMs,t.potion.scanIntervalMs,10),maxTriggersPerSecond:xr((r=e.potion)==null?void 0:r.maxTriggersPerSecond,t.potion.maxTriggersPerSecond),protectionCooldownMs:xr((o=e.potion)==null?void 0:o.protectionCooldownMs,t.potion.protectionCooldownMs),health:ju((s=e.potion)==null?void 0:s.health,t.potion.health),mana:ju((i=e.potion)==null?void 0:i.mana,t.potion.mana)},portal:{openKey:String(((a=e.portal)==null?void 0:a.openKey)||t.portal.openKey).trim(),clickPoint:{x:Number.isFinite(Number((c=(l=e.portal)==null?void 0:l.clickPoint)==null?void 0:c.x))?Number(e.portal.clickPoint.x):t.portal.clickPoint.x,y:Number.isFinite(Number((f=(u=e.portal)==null?void 0:u.clickPoint)==null?void 0:f.y))?Number(e.portal.clickPoint.y):t.portal.clickPoint.y},waitMs:xr((p=e.portal)==null?void 0:p.waitMs,t.portal.waitMs,0)}}}const Ms=Object.freeze({itemStart:"Alt+1",mapStart:"Alt+2",end:"Alt+3",potionStart:"Numpad7",potionStop:"Numpad8",portal:"Numpad2",storyPrevious:"PageUp",storyNext:"PageDown"}),Vu=(e={})=>{const t={};for(const n of Object.keys(Ms))typeof(e==null?void 0:e[n])=="string"&&(t[n]=e[n]);return{...Ms,...t}},d3=(e,t)=>{const n=t==null?void 0:t[e];return typeof n!="function"?!1:(n(),!0)},Sr="auto",vo="manual";function zt(e,t=null){const n=Number(e);return!Number.isFinite(n)||n<1||n>3?t:Number(n.toFixed(4))}function m3(e={}){const t=zt(e.dpiScale,null),n=e.dpiMode===Sr||e.dpiMode===vo;return{mode:n?e.dpiMode:Sr,manualScale:zt(e.manualDpiScale,t??1),lastDetectedScale:zt(e.lastDetectedDpiScale,n?null:t)}}function h3({mode:e,manualScale:t,detectedScale:n,lastDetectedScale:r,primaryScale:o}={}){if(e===vo)return{scaleFactor:zt(t,1),source:"manual"};const s=zt(n,null);if(s!=null)return{scaleFactor:s,source:"game"};const i=zt(r,null);return i!=null?{scaleFactor:i,source:"history"}:{scaleFactor:zt(o,1),source:"primary"}}function Ti(e={}){const{chisel:t,...n}=e;return n}const vn=zr("settings",()=>{const e=B({...Ms}),t=B(ia()),n=B({alteration:{x:210,y:561},augmentation:{x:425,y:663},regal:{x:830,y:555},chaos:{x:1040,y:567},exalted:{x:570,y:567},alchemy:{x:933,y:567},scouring:{x:822,y:1e3},transmutation:{x:110,y:567},jewellers:{x:209,y:797},fusing:{x:323,y:797},chromic:{x:428,y:798},vaal:{x:1158,y:1017},wisdom:{x:210,y:430}}),r=B({startPos:{x:2658,y:1199},slotSize:{w:100,h:100}}),o=B(nr.default),s=B({x:636,y:930}),i=B(Sr),a=B(1),l=B(null),c=B(null),u=B(1),f=B("idle"),p=B(""),d=B(""),m=k(()=>h3({mode:i.value,manualScale:a.value,detectedScale:c.value,lastDetectedScale:l.value,primaryScale:u.value})),h=k(()=>m.value.scaleFactor),S=k(()=>m.value.source),b=B(!1),C=B({backgroundPath:"",blur:4,maskOpacity:.5}),y=B(560),E=B([]);function N(P){e.value={...e.value,...P},O()}function z(P,j){n.value[P]={...j},O()}function D(P){r.value={...r.value,...P},O()}function A(P){var j;return o.value=rr(P),O(),(j=fe.bag.updateOperationDelay(o.value))==null||j.catch(()=>{}),o.value}function v(P){t.value=Hu(P),O()}function R(P){s.value={...P},O()}function U(P){a.value=zt(P,a.value),O()}function I(P){i.value=P===vo?vo:Sr,i.value===vo&&(c.value=null,f.value="idle",d.value=""),O()}async function M(){if(i.value!==Sr)return{success:!0,skipped:!0,scaleFactor:h.value,source:S.value};f.value="detecting",d.value="";try{const P=await fe.system.detectGameDpi();u.value=zt(P==null?void 0:P.primaryScaleFactor,u.value);const j=P!=null&&P.found?zt(P.scaleFactor,null):null;if(j!=null)return c.value=j,l.value=j,p.value=String(P.windowTitle||""),f.value="success",O(),{success:!0,scaleFactor:h.value,source:S.value,windowTitle:p.value};c.value=null,p.value="",f.value="error",d.value=(P==null?void 0:P.error)||"未找到游戏窗口"}catch(P){c.value=null,p.value="",f.value="error",d.value=(P==null?void 0:P.message)||"识别游戏 DPI 失败"}return O(),{success:!1,scaleFactor:h.value,source:S.value,error:d.value}}function W(P){C.value={...C.value,...P},P.backgroundPath&&X({path:P.backgroundPath}),O(),fe&&fe.overlay&&fe.overlay.updateSettings&&fe.overlay.updateSettings(JSON.parse(JSON.stringify(C.value)))}function X(P){const j=E.value.findIndex(Z=>Z.path===P.path);j!==-1&&E.value.splice(j,1),E.value.unshift(P),E.value.length>6&&(E.value=E.value.slice(0,6))}function G(P){E.value.splice(P,1),O()}function O(){try{localStorage.setItem("settings",JSON.stringify({globalShortcuts:e.value,currencyPositions:Ti(n.value),inventory:r.value,operationDelayMs:o.value,itemPosition:s.value,dpiScale:h.value,dpiMode:i.value,manualDpiScale:a.value,lastDetectedDpiScale:l.value,debugMode:b.value,overlaySettings:C.value,storyOverlayWidth:y.value,backgroundHistory:E.value,combatAssist:t.value}))}catch{}}function w(){try{const P=localStorage.getItem("settings"),j=P?JSON.parse(P):{};let Z={};try{Z=JSON.parse(localStorage.getItem("bagSettings")||"{}")}catch{}if(o.value=G4(j,Z),P){j.globalShortcuts?e.value=Vu(j.globalShortcuts):e.value=Vu(),j.currencyPositions?n.value={...n.value,...Ti(j.currencyPositions)}:n.value=Ti(n.value),j.inventory&&(r.value={...r.value,...j.inventory}),j.itemPosition&&(s.value={...j.itemPosition});const se=m3(j);i.value=se.mode,a.value=se.manualScale,l.value=se.lastDetectedScale,typeof j.debugMode=="boolean"&&(b.value=j.debugMode),j.overlaySettings&&(C.value={...C.value,...j.overlaySettings}),j.backgroundHistory&&(E.value=j.backgroundHistory),j.storyOverlayWidth!=null&&(y.value=Math.max(360,Math.min(1200,Math.round(Number(j.storyOverlayWidth)||560)))),t.value=Hu(j.combatAssist)}}catch{}}const V=Ms,ce={alteration:{x:210,y:561},augmentation:{x:425,y:663},regal:{x:830,y:555},chaos:{x:1040,y:567},exalted:{x:570,y:567},alchemy:{x:933,y:567},scouring:{x:822,y:1e3},transmutation:{x:110,y:567},jewellers:{x:209,y:797},fusing:{x:323,y:797},chromic:{x:428,y:798},vaal:{x:1158,y:1017},wisdom:{x:210,y:430}},me=P=>{y.value=Math.max(360,Math.min(1200,Math.round(Number(P)||560))),O(),fe.storyOverlay.resize({width:y.value})},ne={startPos:{x:2658,y:1199},slotSize:{w:100,h:100}},ge={x:636,y:930},_e={backgroundPath:"",blur:4,maskOpacity:.5};function Te(){var P;e.value={...V},n.value={...ce},r.value={...ne},o.value=nr.default,s.value={...ge},i.value=Sr,a.value=1,l.value=null,c.value=null,u.value=1,f.value="idle",p.value="",d.value="",b.value=!1,C.value={..._e},y.value=560,E.value=[],t.value=ia(),O(),(P=fe.bag.updateOperationDelay(o.value))==null||P.catch(()=>{}),fe&&fe.overlay&&fe.overlay.updateSettings&&fe.overlay.updateSettings(JSON.parse(JSON.stringify(C.value))),fe.window.setDevToolsVisible(!1)}function ke(P){b.value=!!P,O()}return w(),{globalShortcuts:e,combatAssist:t,currencyPositions:n,inventory:r,operationDelayMs:o,itemPosition:s,dpiScale:h,dpiMode:i,manualDpiScale:a,lastDetectedDpiScale:l,detectedDpiScale:c,primaryDpiScale:u,dpiSource:S,dpiDetectionStatus:f,dpiWindowTitle:p,dpiDetectionError:d,debugMode:b,overlaySettings:C,storyOverlayWidth:y,backgroundHistory:E,updateGlobalShortcuts:N,updateCombatAssist:v,updateCurrencyPosition:z,updateInventorySettings:D,updateOperationDelay:A,updateItemPosition:R,updateManualDpiScale:U,updateDpiMode:I,refreshDpiScale:M,updateDebugMode:ke,updateOverlaySettings:W,updateStoryOverlayWidth:me,removeHistoryItem:G,saveSettings:O,loadSettings:w,resetSettings:Te}}),fl=zr("script",()=>{const e=B(!1),t=B(null),n=B(null);function r(a){e.value=a}function o(a){t.value=a}function s(a){n.value=a}function i(){e.value=!1,t.value=null,n.value=null}return{isRunning:e,currentScript:t,processId:n,setRunning:r,setCurrentScript:o,setProcessId:s,reset:i}}),pl=`"""流放助手战斗辅助：自动喝药、像素采样和一键回城。"""

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
`,dl=zr("combat",()=>{const e=B(!1),t=B(!1),n=B(!1),r=B(null),o=B(0),s=B(0),i=B("");function a(l={}){(l.event==="starting"||l.event==="started")&&(i.value=""),typeof l.running=="boolean"&&(e.value=l.running),l.processId!==void 0&&(r.value=l.processId),l.event==="focus"&&(t.value=!!l.active),l.event==="protected"&&(n.value=!0),l.event==="triggered"&&(n.value=!1,l.resource==="health"&&(o.value+=1),l.resource==="mana"&&(s.value+=1)),l.event==="error"&&(i.value=l.error||"战斗辅助发生错误"),e.value||(t.value=!1,n.value=!1,r.value=null)}return{running:e,focused:t,protectedMode:n,processId:r,healthTriggers:o,manaTriggers:s,lastError:i,applyStatus:a}});let Wu=!1;async function g3(){const e=dl();Wu||(fe.combat.onStatus(n=>e.applyStatus(n)),Wu=!0);const t=await fe.combat.getPotionStatus();e.applyStatus({...t,event:t.running?"running":"stopped"})}async function _3(){const e=vn(),t=dl(),n=await fe.combat.startPotion({scriptContent:pl,config:JSON.parse(JSON.stringify(e.combatAssist))});return n!=null&&n.success?(t.applyStatus({running:!0,processId:n.processId,event:"starting"}),n.alreadyRunning||Me.success("自动喝药已启动"),!0):(Me.error((n==null?void 0:n.error)||"启动自动喝药失败"),!1)}async function v3(){const e=dl(),t=await fe.combat.stopPotion();return t!=null&&t.success?(e.applyStatus({running:!1,event:"stopped"}),t.alreadyStopped||Me.success("自动喝药已停止"),!0):(Me.error((t==null?void 0:t.error)||"停止自动喝药失败"),!1)}async function YE(e){return fe.combat.samplePixel({scriptContent:pl,point:{x:Number(e==null?void 0:e.x)||0,y:Number(e==null?void 0:e.y)||0}})}async function y3(){const e=vn(),t=await fe.combat.executePortal({scriptContent:pl,config:{portal:JSON.parse(JSON.stringify(e.combatAssist.portal))}});return t!=null&&t.success?(Me.success("回城流程已执行"),!0):(Me.error((t==null?void 0:t.error)||"一键回城执行失败"),!1)}const pm="storyGuide:v1",dm=1,b3=["red","green","blue"];function zu(e,t,n){const r=e.findIndex(i=>i.id===t),o=e.findIndex(i=>i.id===n);if(r<0||o<0||r===o)return!1;const[s]=e.splice(r,1);return e.splice(o,0,s),!0}let Uu=0;function an(e="story"){var n,r;const t=(r=(n=globalThis.crypto)==null?void 0:n.randomUUID)==null?void 0:r.call(n);return t?`${e}-${t}`:(Uu+=1,`${e}-${Date.now().toString(36)}-${Uu.toString(36)}`)}function Ai(){return{version:dm,chapters:[],currentChapterId:null,currentStepId:null}}function w3(e){return typeof e=="string"?{id:an("step"),text:e}:{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("step"),text:typeof(e==null?void 0:e.text)=="string"?e.text:""}}function x3(e){return{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("skill"),name:typeof(e==null?void 0:e.name)=="string"?e.name:"",color:b3.includes(e==null?void 0:e.color)?e.color:"red"}}function S3(e){return{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("group"),name:typeof(e==null?void 0:e.name)=="string"?e.name:"",skills:Array.isArray(e==null?void 0:e.skills)?e.skills.map(x3):[]}}function E3(e,t){return{id:typeof(e==null?void 0:e.id)=="string"&&e.id?e.id:an("chapter"),name:typeof(e==null?void 0:e.name)=="string"?e.name:`章节 ${t+1}`,steps:Array.isArray(e==null?void 0:e.steps)?e.steps.map(w3):[],skillGroups:Array.isArray(e==null?void 0:e.skillGroups)?e.skillGroups.map(S3):[]}}function Mo(e=[]){return e.flatMap((t,n)=>t.steps.map((r,o)=>({chapter:t,step:r,chapterIndex:n,stepIndex:o})))}function mm(e){const t={version:dm,chapters:Array.isArray(e==null?void 0:e.chapters)?e.chapters.map(E3):[],currentChapterId:typeof(e==null?void 0:e.currentChapterId)=="string"?e.currentChapterId:null,currentStepId:typeof(e==null?void 0:e.currentStepId)=="string"?e.currentStepId:null},n=Mo(t.chapters),r=n.find(i=>i.step.id===t.currentStepId);if(r)return t.currentChapterId=r.chapter.id,t;const o=t.chapters.find(i=>i.id===t.currentChapterId),s=o!=null&&o.steps.length?n.find(i=>i.chapter.id===o.id):n[0];return t.currentChapterId=(s==null?void 0:s.chapter.id)||null,t.currentStepId=(s==null?void 0:s.step.id)||null,t}function P3(e=globalThis.localStorage){if(!(e!=null&&e.getItem))return Ai();try{const t=e.getItem(pm);return t?mm(JSON.parse(t)):Ai()}catch{return Ai()}}function C3(e,t=globalThis.localStorage){if(!(t!=null&&t.setItem))return!1;try{return t.setItem(pm,JSON.stringify(mm(e))),!0}catch{return!1}}function hm(e,t){const n=Mo(e),r=n.findIndex(o=>o.step.id===t);return r<0?{previous:null,current:null,next:null,index:-1,flow:n}:{previous:n[r-1]||null,current:n[r],next:n[r+1]||null,index:r,flow:n}}function T3(e,t,n){const r=hm(e,t);if(!r.flow.length)return null;if(r.index<0)return r.flow[0];const o=Math.max(0,Math.min(r.flow.length-1,r.index+n));return r.flow[o]}function Gu(e,t){const n=Mo(e);return n.length?n[Math.min(Math.max(t,0),n.length-1)]:null}function A3(e,t){var s;const n=hm(e,t),r=((s=n.current)==null?void 0:s.chapter)||null,o=i=>i?{chapterId:i.chapter.id,chapterName:i.chapter.name,stepId:i.step.id,text:i.step.text}:null;return{previous:o(n.previous),current:o(n.current),next:o(n.next),chapter:r?{id:r.id,name:r.name,skillGroups:r.skillGroups.map(i=>({id:i.id,name:i.name,skills:i.skills.filter(a=>a.name.trim()).map(a=>({...a}))})).filter(i=>i.skills.length)}:null}}const Ku=zr("story",()=>{const e=P3(),t=B(e.chapters),n=B(e.currentChapterId),r=B(e.currentStepId),o=B(!1),s=k(()=>t.value.find(M=>M.id===n.value)||null),i=k(()=>{var M;return((M=s.value)==null?void 0:M.steps.find(W=>W.id===r.value))||null}),a=k(()=>A3(t.value,r.value));function l(){return{version:1,chapters:t.value,currentChapterId:n.value,currentStepId:r.value}}function c(){o.value&&fe.storyOverlay.update(JSON.parse(JSON.stringify(a.value)))}function u({sync:M=!0}={}){C3(l()),M&&c()}function f(M){n.value=(M==null?void 0:M.chapter.id)||null,r.value=(M==null?void 0:M.step.id)||null,u()}function p(M){var X;const W=t.value.find(G=>G.id===M);n.value=(W==null?void 0:W.id)||null,r.value=((X=W==null?void 0:W.steps[0])==null?void 0:X.id)||null,u()}function d(M,W){const X=t.value.find(O=>O.id===M),G=X==null?void 0:X.steps.find(O=>O.id===W);!X||!G||(n.value=X.id,r.value=G.id,u())}function m(){const M={id:an("chapter"),name:`章节 ${t.value.length+1}`,steps:[],skillGroups:[]};return t.value.push(M),n.value=M.id,r.value=null,u(),M}function h(M){const X=Mo(t.value).findIndex(w=>w.step.id===r.value),G=t.value.findIndex(w=>w.id===M);if(G<0)return;const O=n.value===M;t.value.splice(G,1),O?f(Gu(t.value,X)):u()}function S(M){const W=t.value.find(G=>G.id===M);if(!W)return null;const X={id:an("step"),text:""};return W.steps.push(X),d(W.id,X.id),X}function b(M,W){const G=Mo(t.value).findIndex(ce=>ce.step.id===W),O=t.value.find(ce=>ce.id===M),w=(O==null?void 0:O.steps.findIndex(ce=>ce.id===W))??-1;if(!O||w<0)return;const V=r.value===W;O.steps.splice(w,1),V?f(Gu(t.value,G)):u()}function C(M,W){return zu(t.value,M,W)?(u(),!0):!1}function y(M,W,X){const G=t.value.find(O=>O.id===M);return!G||!zu(G.steps,W,X)?!1:(u(),!0)}function E(M){const W=t.value.find(G=>G.id===M);if(!W)return null;const X={id:an("group"),name:`技能组 ${W.skillGroups.length+1}`,skills:[]};return W.skillGroups.push(X),u(),X}function N(M,W){const X=t.value.find(O=>O.id===M),G=(X==null?void 0:X.skillGroups.findIndex(O=>O.id===W))??-1;!X||G<0||(X.skillGroups.splice(G,1),u())}function z(M,W){var O;const X=(O=t.value.find(w=>w.id===M))==null?void 0:O.skillGroups.find(w=>w.id===W);if(!X)return null;const G={id:an("skill"),name:"",color:"red"};return X.skills.push(G),u(),G}function D(M,W,X){var w;const G=(w=t.value.find(V=>V.id===M))==null?void 0:w.skillGroups.find(V=>V.id===W),O=(G==null?void 0:G.skills.findIndex(V=>V.id===X))??-1;!G||O<0||(G.skills.splice(O,1),u())}function A(M){f(T3(t.value,r.value,M))}const v=()=>A(-1),R=()=>A(1);async function U(M){const W=await fe.storyOverlay.open(JSON.parse(JSON.stringify(a.value)),M);return o.value=(W==null?void 0:W.success)!==!1,W}async function I(){await fe.storyOverlay.close(),o.value=!1}return{chapters:t,currentChapterId:n,currentStepId:r,overlayVisible:o,currentChapter:s,currentStep:i,snapshot:a,save:u,syncOverlay:c,selectChapter:p,selectStep:d,addChapter:m,deleteChapter:h,addStep:S,deleteStep:b,reorderChapter:C,reorderStep:y,addSkillGroup:E,deleteSkillGroup:N,addSkill:z,deleteSkill:D,previous:v,next:R,showOverlay:U,hideOverlay:I}});function I3(e){return typeof e!="string"?e:e.trim().split("+").map(t=>{const n=t.trim().match(/^numpad([0-9])$/i);return n?`num${n[1]}`:t.trim()}).join("+")}function O3(e){const t=Object.values(e).filter(a=>typeof a=="string"&&a.trim()),n=t.map(a=>I3(a).toLowerCase()),r=/^(?:(?:ctrl|control|alt|shift|commandorcontrol|cmdorctrl|meta)\+)*(?:[a-z0-9]|f(?:[1-9]|1[0-9]|2[0-4])|num(?:pad)?[0-9]|space|enter|return|esc|escape|tab|up|down|left|right|pageup|pagedown|home|end|insert)$/i,o=t.find(a=>!r.test(a.trim()));if(o)return{isValid:!1,error:`快捷键格式无效：${o}`};const s=n.findIndex(a=>a==="f12"||a==="ctrl+shift+i"||a==="control+shift+i"||a==="commandorcontrol+shift+i");if(s!==-1)return{isValid:!1,error:`快捷键 ${t[s]} 为应用保留快捷键`};const i=new Set(n);return n.length!==i.size?{isValid:!1,error:"不同功能的快捷键不能重复，请修改"}:{isValid:!0}}function gm(e){return(e==null?void 0:e.success)===!0&&Number.isInteger(e.processId)&&e.processId>0}let qu=!1,Ju=!1;function _m(e){var t;return((t=e==null?void 0:e.failed)==null?void 0:t.map(n=>n.accelerator).join("、"))||"未知快捷键"}async function vm(e){const t=await e.refreshDpiScale();if(t.success||t.skipped)return;const n=t.source==="history"?"上次识别值":"主屏倍率";Me.warning(`未能识别游戏窗口 DPI，正在使用${n} ${t.scaleFactor}`)}async function M3(){const t=vn().globalShortcuts;try{const n=await fe.shortcut.initFromSettings({...t});if(!(n!=null&&n.success)){const r=_m(n);Me.error(`全局快捷键注册失败：${r}`)}}catch(n){Me.error(`全局快捷键初始化失败：${n.message}`)}qu||(fe.shortcut.onTriggered(n=>{d3(n,{itemStart:R3,mapStart:N3,end:k3,potionStart:_3,potionStop:v3,portal:y3,storyPrevious:()=>Ku().previous(),storyNext:()=>Ku().next()})}),qu=!0),Ju||(fe.events.onPythonOutput(n=>{n.data.trim()}),Ju=!0)}async function R3(){const e=fl(),t=fm(),n=vn();if((await fe.script.getStatus()).isRunning){Me.warning("脚本已在运行中");return}const o=t.currentItemPreset,s=J4({itemPosition:n.itemPosition,currencyPositions:n.currencyPositions,preset:o});if(!s.isValid){Me.error(s.errors[0]);return}try{await vm(n);const i=await fe.file.getPaths(),a=K4({globalShortcuts:n.globalShortcuts,currencyPositions:n.currencyPositions,operationDelayMs:n.operationDelayMs,itemPosition:n.itemPosition,dpiScale:n.dpiScale,preset:o,filePaths:i}),l=JSON.parse(JSON.stringify(o)),c=await fe.script.generateAndExecute({scriptContent:a,preset:l});gm(c)?(e.setRunning(!0),e.setProcessId(c.processId),Me.success("脚本执行成功")):Me.error("脚本执行失败: "+((c==null?void 0:c.error)||"后台进程未返回有效进程标识"))}catch(i){Me.error("启动制作失败: "+i.message)}}async function N3(){const e=fl(),t=fm(),n=vn();if((await fe.script.getStatus()).isRunning){Me.warning("脚本已在运行中");return}const o=t.currentMapPreset,s=o.map;if(!s){Me.error("当前预设未包含地图配置");return}const i=Y4({inventory:n.inventory,currencyPositions:n.currencyPositions,mapConfig:s});if(!i.isValid){Me.error(i.errors[0]);return}try{await vm(n);const a=await fe.file.getPaths(),l=q4({globalShortcuts:n.globalShortcuts,currencyPositions:n.currencyPositions,inventory:n.inventory,operationDelayMs:n.operationDelayMs,mapConfig:s,dpiScale:n.dpiScale,filePaths:a}),c=JSON.parse(JSON.stringify(o)),u=await fe.script.generateAndExecute({scriptContent:l,preset:c});gm(u)?(e.setRunning(!0),e.setProcessId(u.processId),Me.success("地图洗练脚本执行成功")):Me.error("脚本执行失败: "+((u==null?void 0:u.error)||"后台进程未返回有效进程标识"))}catch(a){Me.error("启动制作失败: "+a.message)}}async function k3(){const e=fl();try{(await fe.script.stop()).success&&(e.reset(),await fe.file.watcher.stop(),Me.success("脚本已停止"))}catch(t){Me.error("停止脚本失败: "+t.message)}}async function F3(e=null){const t=vn(),n=e||t.globalShortcuts,r=O3(n);if(!r.isValid)throw new Error(r.error);const o=await fe.shortcut.initFromSettings({...n});if(!(o!=null&&o.success)){const s=_m(o);throw new Error(`全局快捷键注册失败：${s}`)}return o}async function XE(e,t){const n=vn(),r={...n.globalShortcuts,[e]:t};return await F3(r),n.updateGlobalShortcuts({[e]:t}),t}const L3=Object.freeze(["name","baseName","category"]),ZE=Object.freeze({name:"物品名称",baseName:"基底名称",category:"物品类别"}),Er=Object.freeze({left:0,top:0,right:1920,bottom:1080}),gr=Object.freeze({nativeColumns:12,rows:5,minExtraColumns:1,maxExtraColumns:6});function Ot(e,t){const n=Number(e);return Number.isFinite(n)?n:t}function ym(e=[]){return Array.isArray(e)?e.map(t=>({field:String((t==null?void 0:t.field)||""),keyword:String((t==null?void 0:t.keyword)||"").trim()})).filter(t=>L3.includes(t.field)&&t.keyword.length>0):[]}function ml(e={}){const t=Number(e.extraColumns),n=Number.isFinite(t)?Math.min(gr.maxExtraColumns,Math.max(gr.minExtraColumns,Math.trunc(t))):gr.minExtraColumns,r=[],o=new Set;if(Array.isArray(e.excludedSlots))for(const s of e.excludedSlots){const i=Number(s==null?void 0:s.column),a=Number(s==null?void 0:s.row);if(!Number.isInteger(i)||!Number.isInteger(a)||!(i>=0&&i<gr.nativeColumns||i<=-1&&i>=-gr.maxExtraColumns)||a<0||a>=gr.rows)continue;const c=`${i}:${a}`;o.has(c)||(o.add(c),r.push({column:i,row:a}))}return{extraEnabled:!!e.extraEnabled,extraColumns:n,excludedSlots:r}}function bm(){return{moduleEnabled:!1,immediateStash:!0,showStashButtonOnlyWhenReady:!0,templates:{stashTitle:"",inventoryTitle:"",stashRegion:{...Er},inventoryRegion:{...Er},stashCapture:null,inventoryCapture:null},matchThreshold:.8,blacklist:[],inventoryLayout:ml()}}function aa(e={}){return{left:Ot(e.left,Er.left),top:Ot(e.top,Er.top),right:Ot(e.right,Er.right),bottom:Ot(e.bottom,Er.bottom)}}function Yu(e){if(!e||typeof e!="object")return null;const t=Ot(e.width,0),n=Ot(e.height,0);return t>0&&n>0?{width:t,height:n}:null}function Xu(e){if(!e||typeof e!="object")return null;const t=Yu(e.displayPhysicalSize),n=Yu(e.templateSize),r=e.selectedRegion?aa(e.selectedRegion):null,o=Ot(e.scaleFactor,0);return!String(e.displayId??"")||!t||!n||!r||o<=0?null:{displayId:String(e.displayId),scaleFactor:o,displayPhysicalSize:t,templateSize:n,selectedRegion:r,capturedAt:String(e.capturedAt||"")}}function wm(e={}){var r,o,s,i,a,l;const t=bm(),n=Number(e.matchThreshold);return{moduleEnabled:!!e.moduleEnabled,immediateStash:e.immediateStash!==!1,showStashButtonOnlyWhenReady:e.showStashButtonOnlyWhenReady!==!1,templates:{stashTitle:String(((r=e.templates)==null?void 0:r.stashTitle)||""),inventoryTitle:String(((o=e.templates)==null?void 0:o.inventoryTitle)||""),stashRegion:aa((s=e.templates)==null?void 0:s.stashRegion),inventoryRegion:aa((i=e.templates)==null?void 0:i.inventoryRegion),stashCapture:Xu((a=e.templates)==null?void 0:a.stashCapture),inventoryCapture:Xu((l=e.templates)==null?void 0:l.inventoryCapture)},matchThreshold:Number.isFinite(n)?Math.min(1,Math.max(.1,n)):t.matchThreshold,blacklist:ym(e.blacklist),inventoryLayout:ml(e.inventoryLayout)}}function D3(e,t){var r,o,s,i,a,l,c,u;const n=wm(e);return{immediateStash:n.immediateStash,showStashButtonOnlyWhenReady:n.showStashButtonOnlyWhenReady,templates:n.templates,matchThreshold:n.matchThreshold,blacklist:n.blacklist,operationDelayMs:rr(t==null?void 0:t.operationDelayMs),inventory:{startPos:{x:Ot((o=(r=t==null?void 0:t.inventory)==null?void 0:r.startPos)==null?void 0:o.x,2658),y:Ot((i=(s=t==null?void 0:t.inventory)==null?void 0:s.startPos)==null?void 0:i.y,1199)},slotSize:{w:Ot((l=(a=t==null?void 0:t.inventory)==null?void 0:a.slotSize)==null?void 0:l.w,100),h:Ot((u=(c=t==null?void 0:t.inventory)==null?void 0:c.slotSize)==null?void 0:u.h,100)},layout:n.inventoryLayout}}}function B3(e){return!e.templates.stashTitle||!e.templates.inventoryTitle?"请先配置仓库和背包标题模板":[e.templates.stashRegion,e.templates.inventoryRegion].some(r=>r.right<=r.left||r.bottom<=r.top)?"模板匹配区域无效":[e.inventory.startPos.x,e.inventory.startPos.y,e.inventory.slotSize.w,e.inventory.slotSize.h].some(r=>!Number.isFinite(r))?"背包网格配置无效":e.inventory.slotSize.w<=0||e.inventory.slotSize.h<=0?"背包单格宽高无效":""}function Zu(e){if(e==="stashTitle")return"stashCapture";if(e==="inventoryTitle")return"inventoryCapture";throw new Error("不支持的模板目标")}const Qu=()=>({scannedSlots:0,stashedSlots:0,blacklistedSlots:0,emptySlots:0,unreadableSlots:0,progress:0}),Kr=zr("bag",()=>{const e=bm(),t=B(e.moduleEnabled),n=B(e.immediateStash),r=B(e.showStashButtonOnlyWhenReady),o=B(e.templates),s=B(e.matchThreshold),i=B(e.blacklist),a=B(e.inventoryLayout),l=B(!1),c=B(!1),u=B(!1),f=B(0),p=B(Qu()),d=B("");function m(){try{localStorage.setItem("bagSettings",JSON.stringify({moduleEnabled:t.value,immediateStash:n.value,showStashButtonOnlyWhenReady:r.value,templates:o.value,matchThreshold:s.value,blacklist:i.value,inventoryLayout:a.value}))}catch(w){console.error("保存背包设置失败:",w)}}function h(w){const V=wm(w);t.value=V.moduleEnabled,n.value=V.immediateStash,r.value=V.showStashButtonOnlyWhenReady,o.value=V.templates,s.value=V.matchThreshold,i.value=V.blacklist,a.value=V.inventoryLayout}function S(){try{h(JSON.parse(localStorage.getItem("bagSettings")||"{}"))}catch(w){h({}),console.error("加载背包设置失败:",w)}}function b(w){t.value=!!w,m()}function C(w){n.value=!!w,m()}function y(w){r.value=!!w,m()}function E(w){o.value[Zu(w)]=null}function N(w,V){o.value[w]=String(V||""),E(w),m()}function z(w,V){o.value[`${w.replace("Title","")}Region`]={...V},E(w),m()}function D(w,V){const ce=`${w.replace("Title","")}Region`;o.value={...o.value,[w]:String(V.path||""),[ce]:{...V.region},[Zu(w)]:V.metadata?{...V.metadata}:null},m()}function A(w){s.value=Number(w),m()}function v(w){i.value=ym(w),m()}function R(w){a.value=ml({...a.value,...w}),m()}function U(w){l.value=!!w}function I(w){c.value=!!w}function M(w,V={}){u.value=!!w,typeof V=="number"?f.value=V:(p.value={scannedSlots:Number(V.scannedSlots??p.value.scannedSlots),stashedSlots:Number(V.stashedSlots??p.value.stashedSlots),blacklistedSlots:Number(V.blacklistedSlots??p.value.blacklistedSlots),emptySlots:Number(V.emptySlots??p.value.emptySlots),unreadableSlots:Number(V.unreadableSlots??p.value.unreadableSlots),progress:Number(V.progress??p.value.progress)},f.value=Number(V.progress??f.value))}function W(w=""){d.value=String(w)}function X(){f.value=0,p.value=Qu(),d.value=""}function G(){l.value=!1,c.value=!1,u.value=!1,X()}function O(){h(e),G(),m()}return S(),{moduleEnabled:t,immediateStash:n,showStashButtonOnlyWhenReady:r,templates:o,matchThreshold:s,blacklist:i,inventoryLayout:a,isDetecting:l,isMatched:c,isStashing:u,stashProgress:f,stashStats:p,lastStopReason:d,setModuleEnabled:b,setImmediateStash:C,setShowStashButtonOnlyWhenReady:y,setTemplate:N,setTemplateRegion:z,applyTemplateCapture:D,clearCaptureMetadata:E,setMatchThreshold:A,setBlacklist:v,setInventoryLayout:R,setDetectionStatus:U,setMatchedStatus:I,setStashingStatus:M,setStopReason:W,resetRunStats:X,resetStates:G,saveSettings:m,loadSettings:S,resetSettings:O}});let la=!1,ca=[];function $3(){const e=Kr(),t=vn();return D3({moduleEnabled:e.moduleEnabled,immediateStash:e.immediateStash,showStashButtonOnlyWhenReady:e.showStashButtonOnlyWhenReady,templates:e.templates,matchThreshold:e.matchThreshold,blacklist:e.blacklist,inventoryLayout:e.inventoryLayout},t)}async function QE(e={}){const t=Kr();return"immediateStash"in e&&t.setImmediateStash(e.immediateStash),"showStashButtonOnlyWhenReady"in e&&t.setShowStashButtonOnlyWhenReady(e.showStashButtonOnlyWhenReady),t.moduleEnabled?fe.bag.updatePreferences({immediateStash:t.immediateStash,showStashButtonOnlyWhenReady:t.showStashButtonOnlyWhenReady}):{success:!0}}async function xm({silent:e=!1}={}){var s;const t=Kr(),n=$3(),r=B3(n);if(r)return e||Me.warning(r),{success:!1,error:r};const o=await fe.bag.startDetection(n);return o!=null&&o.success?(t.setDetectionStatus(!0),t.setStopReason("")):e||Me.error(`启动背包检测失败：${(o==null?void 0:o.error)||"未知错误"}`),o!=null&&o.success&&((s=o.warnings)!=null&&s.length)&&!e&&Me.warning(o.warnings.join("；")),o}async function eP(e){const t=Kr();if(e){const n=await xm();return n!=null&&n.success?(t.setModuleEnabled(!0),Me.success("背包安全自动入库已启用"),!0):!1}return await fe.bag.stopDetection(),t.setModuleEnabled(!1),t.resetStates(),Me.success("背包安全自动入库已关闭"),!0}async function tP(){const e=await fe.bag.stopStash();return e!=null&&e.success&&Kr().setStashingStatus(!1),e}async function j3(){if(la)return;la=!0;const e=Kr();if(ca=[fe.events.onBagDetectionMatch(t=>{e.setMatchedStatus(!!t.matched)}),fe.events.onBagDetectionStopped(t=>{e.setDetectionStatus(!1),e.setMatchedStatus(!1),t!=null&&t.reason&&t.reason!=="process-ended"&&e.setStopReason(t.reason)}),fe.events.onBagStashProgress(t=>{t.progress===0&&e.resetRunStats(),e.setStashingStatus(!0,t)}),fe.events.onBagStashCompleted(t=>{e.setStashingStatus(!1,t),e.setStopReason(""),Me.success(`自动入库完成：入库 ${t.stashedSlots||0} 格，黑名单保留 ${t.blacklistedSlots||0} 格`)}),fe.events.onBagStashStopped(t=>{e.setStashingStatus(!1,t),e.setStopReason((t==null?void 0:t.reason)||"未知原因"),t!=null&&t.reason&&t.reason!=="user-stopped"&&t.reason!=="process-ended"&&Me.warning(`入库已停止：${V3(t.reason)}`)})].filter(Boolean),e.moduleEnabled)try{await xm({silent:!0})}catch(t){e.setDetectionStatus(!1),e.setStopReason(t.message)}}function H3(){ca.forEach(e=>e==null?void 0:e()),ca=[],la=!1}function V3(e){return{"game-not-foreground":"游戏窗口不在前台","interface-lost":"仓库或背包界面已关闭","user-stopped":"用户停止","process-exited":"进程异常退出","process-ended":"进程已结束"}[e]||String(e||"未知原因")}const W3={class:"app-root"},z3={class:"main-content-wrapper"},U3={__name:"App",setup(e){const t=Gp(),n=vn();let r=null;return st(()=>{var o,s;t.meta.noLayout||(window.electronAPI&&(n.refreshDpiScale(),M3(),g3(),j3()),r=(s=(o=fe.window).onDevToolsVisibilityChanged)==null?void 0:s.call(o,i=>{n.updateDebugMode(i)}),fe.window.setDevToolsVisible(n.debugMode))}),Ta(()=>{r==null||r(),H3(),window.electronAPI&&window.electronAPI.removeAllListeners&&window.electronAPI.removeAllListeners("init-shortcuts")}),(o,s)=>{const i=Eh("router-view");return Y(),ie("div",W3,[x(t).meta.noLayout?(Y(),He(i,{key:1})):(Y(),ie(ze,{key:0},[re(W4),Q("div",z3,[re(F4,null,{default:de(()=>[re(i)]),_:1})])],64))])}}},G3=Qs(U3,[["__scopeId","data-v-9cc81237"]]),K3=()=>{const e=Jg(G3),t=Zg();e.use(t),e.use(m_),e.mount("#app")};K3();export{pE as $,Ve as A,q as B,w1 as C,Be as D,Me as E,ze as F,He as G,Re as H,sE as I,De as J,Gg as K,AE as L,No as M,ft as N,Xt as O,Y1 as P,PE as Q,Ja as R,LE as S,tE as T,Ae as U,Ea as V,rf as W,Rb as X,yE as Y,le as Z,Qs as _,vn as a,el as a$,mE as a0,Kt as a1,At as a2,gt as a3,br as a4,Z3 as a5,lr as a6,$n as a7,Kr as a8,gr as a9,IE as aA,id as aB,J3 as aC,st as aD,no as aE,Ut as aF,Je as aG,m2 as aH,V1 as aI,U2 as aJ,Xe as aK,iE as aL,Ka as aM,Bb as aN,q2 as aO,Ah as aP,vh as aQ,zE as aR,sS as aS,Ye as aT,Gr as aU,Ue as aV,WE as aW,VE as aX,ho as aY,_E as aZ,Kd as a_,Ta as aa,fe as ab,V3 as ac,kE as ad,L3 as ae,ZE as af,eP as ag,QE as ah,tP as ai,sa as aj,qE as ak,dl as al,Bn as am,_3 as an,v3 as ao,xE as ap,y3 as aq,YE as ar,Ku as as,u3 as at,l3 as au,RE as av,CE as aw,JE as ax,We as ay,c3 as az,Q as b,nh as b$,Q1 as b0,wr as b1,hE as b2,Q3 as b3,vE as b4,qa as b5,Wr as b6,$e as b7,zs as b8,Ph as b9,ud as bA,pr as bB,zr as bC,X_ as bD,ov as bE,T_ as bF,ws as bG,iv as bH,Ha as bI,Va as bJ,Xv as bK,ev as bL,Fr as bM,Ki as bN,nd as bO,pn as bP,za as bQ,Zp as bR,Fn as bS,C_ as bT,Cd as bU,FS as bV,Sd as bW,Pe as bX,sc as bY,bE as bZ,od as b_,$1 as ba,nE as bb,MS as bc,e1 as bd,lE as be,tf as bf,DE as bg,fw as bh,Gd as bi,md as bj,yd as bk,as as bl,Qi as bm,Ee as bn,Zi as bo,Do as bp,Sw as bq,nS as br,$E as bs,cE as bt,dE as bu,uE as bv,qf as bw,SE as bx,we as by,Jt as bz,ie as c,Xi as c$,Eh as c0,Y3 as c1,EE as c2,Kf as c3,I1 as c4,vi as c5,Mn as c6,qo as c7,up as c8,er as c9,oE as cA,S1 as cB,jE as cC,pu as cD,aE as cE,rv as cF,lv as cG,Uv as cH,Gv as cI,Ur as cJ,Uy as cK,Vy as cL,sd as cM,Gy as cN,Wc as cO,qt as cP,An as cQ,Hv as cR,Nc as cS,Dc as cT,Js as cU,ky as cV,OS as cW,pf as cX,wE as cY,ja as cZ,gh as c_,Pd as ca,Se as cb,rE as cc,Lb as cd,F1 as ce,lu as cf,uu as cg,L1 as ch,H2 as ci,ld as cj,ey as ck,Ga as cl,Mb as cm,rd as cn,Fs as co,BE as cp,Yb as cq,fE as cr,q3 as cs,ts as ct,NE as cu,nr as cv,HE as cw,C1 as cx,Sa as cy,hn as cz,re as d,Ts as d0,FE as d1,OE as d2,v2 as d3,yw as d4,eE as d5,gE as d6,Fo as d7,IS as d8,XE as e,k as f,On as g,de as h,ka as i,Dr as j,x as k,Yd as l,X3 as m,TE as n,Y as o,ME as p,T2 as q,B as r,oe as s,Ps as t,fm as u,Lr as v,ye as w,qe as x,be as y,Ed as z};

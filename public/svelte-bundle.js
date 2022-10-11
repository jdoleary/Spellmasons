var app=function(){"use strict";function t(){}function e(t,e){for(const n in e)t[n]=e[n];return t}function n(t){return t()}function o(){return Object.create(null)}function s(t){t.forEach(n)}function r(t){return"function"==typeof t}function l(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}let c,i;function a(t,e){return c||(c=document.createElement("a")),c.href=e,t===c.href}function u(t,n,o,s){return t[1]&&s?e(o.ctx.slice(),t[1](s(n))):o.ctx}function d(t){const e={};for(const n in t)"$"!==n[0]&&(e[n]=t[n]);return e}function f(t,e){const n={};e=new Set(e);for(const o in t)e.has(o)||"$"===o[0]||(n[o]=t[o]);return n}function p(t,e){t.appendChild(e)}function $(t,e,n){t.insertBefore(e,n||null)}function m(t){t.parentNode.removeChild(t)}function g(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function h(t){return document.createElement(t)}function v(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function w(t){return document.createTextNode(t)}function x(){return w(" ")}function y(){return w("")}function b(t,e,n,o){return t.addEventListener(e,n,o),()=>t.removeEventListener(e,n,o)}function k(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function R(t,e){const n=Object.getOwnPropertyDescriptors(t.__proto__);for(const o in e)null==e[o]?t.removeAttribute(o):"style"===o?t.style.cssText=e[o]:"__value"===o?t.value=t[o]=e[o]:n[o]&&n[o].set?t[o]=e[o]:k(t,o,e[o])}function C(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function A(t,e){t.value=null==e?"":e}function _(t,e,n,o){null===n?t.style.removeProperty(e):t.style.setProperty(e,n,o?"important":"")}function M(t,e,n){t.classList[n?"add":"remove"](e)}function L(t){i=t}function S(){if(!i)throw new Error("Function called outside component initialization");return i}function E(t){S().$$.on_mount.push(t)}function P(t){S().$$.on_destroy.push(t)}function I(t,e){const n=t.$$.callbacks[e.type];n&&n.slice().forEach((t=>t.call(this,e)))}const N=[],T=[],G=[],B=[],O=Promise.resolve();let U=!1;function j(t){G.push(t)}const D=new Set;let H=0;function V(){const t=i;do{for(;H<N.length;){const t=N[H];H++,L(t),F(t.$$)}for(L(null),N.length=0,H=0;T.length;)T.pop()();for(let t=0;t<G.length;t+=1){const e=G[t];D.has(e)||(D.add(e),e())}G.length=0}while(N.length);for(;B.length;)B.pop()();U=!1,D.clear(),L(t)}function F(t){if(null!==t.fragment){t.update(),s(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(j)}}const J=new Set;let K;function Y(){K={r:0,c:[],p:K}}function q(){K.r||s(K.c),K=K.p}function z(t,e){t&&t.i&&(J.delete(t),t.i(e))}function W(t,e,n,o){if(t&&t.o){if(J.has(t))return;J.add(t),K.c.push((()=>{J.delete(t),o&&(n&&t.d(1),o())})),t.o(e)}else o&&o()}function Z(t,e){const n={},o={},s={$$scope:1};let r=t.length;for(;r--;){const l=t[r],c=e[r];if(c){for(const t in l)t in c||(o[t]=1);for(const t in c)s[t]||(n[t]=c[t],s[t]=1);t[r]=c}else for(const t in l)s[t]=1}for(const t in o)t in n||(n[t]=void 0);return n}function Q(t){t&&t.c()}function X(t,e,o,l){const{fragment:c,on_mount:i,on_destroy:a,after_update:u}=t.$$;c&&c.m(e,o),l||j((()=>{const e=i.map(n).filter(r);a?a.push(...e):s(e),t.$$.on_mount=[]})),u.forEach(j)}function tt(t,e){const n=t.$$;null!==n.fragment&&(s(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function et(t,e){-1===t.$$.dirty[0]&&(N.push(t),U||(U=!0,O.then(V)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function nt(e,n,r,l,c,a,u,d=[-1]){const f=i;L(e);const p=e.$$={fragment:null,ctx:null,props:a,update:t,not_equal:c,bound:o(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(f?f.$$.context:[])),callbacks:o(),dirty:d,skip_bound:!1,root:n.target||f.$$.root};u&&u(p.root);let $=!1;if(p.ctx=r?r(e,n.props||{},((t,n,...o)=>{const s=o.length?o[0]:n;return p.ctx&&c(p.ctx[t],p.ctx[t]=s)&&(!p.skip_bound&&p.bound[t]&&p.bound[t](s),$&&et(e,t)),n})):[],p.update(),$=!0,s(p.before_update),p.fragment=!!l&&l(p.ctx),n.target){if(n.hydrate){const t=function(t){return Array.from(t.childNodes)}(n.target);p.fragment&&p.fragment.l(t),t.forEach(m)}else p.fragment&&p.fragment.c();n.intro&&z(e.$$.fragment),X(e,n.target,n.anchor,n.customElement),V()}L(f)}class ot{$destroy(){tt(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function st(n){let o,s,r,l,c,i,a=[{class:l=`button-wrapper ${n[2]} ${n[1]?"is-active":""}`},n[3]],u={};for(let t=0;t<a.length;t+=1)u=e(u,a[t]);return{c(){o=h("button"),s=h("div"),r=w(n[0]),R(o,u)},m(t,e){$(t,o,e),p(o,s),p(s,r),o.autofocus&&o.focus(),c||(i=b(o,"click",n[4]),c=!0)},p(t,[e]){1&e&&C(r,t[0]),R(o,u=Z(a,[6&e&&l!==(l=`button-wrapper ${t[2]} ${t[1]?"is-active":""}`)&&{class:l},8&e&&t[3]]))},i:t,o:t,d(t){t&&m(o),c=!1,i()}}}function rt(t,n,o){const s=["text","isActive","class"];let r=f(n,s),{text:l}=n,{isActive:c}=n,{class:i=""}=n;return t.$$set=t=>{n=e(e({},n),d(t)),o(3,r=f(n,s)),"text"in t&&o(0,l=t.text),"isActive"in t&&o(1,c=t.isActive),"class"in t&&o(2,i=t.class)},[l,c,i,r,function(e){I.call(this,t,e)}]}class lt extends ot{constructor(t){super(),nt(this,t,rt,st,l,{text:0,isActive:1,class:2})}}function ct(t,e,n){const o=t.slice();return o[5]=e[n][0],o[6]=e[n][1],o[8]=n,o}function it(e){let n,o,s,r,l,c=e[5]+"",i=e[6]+"";return{c(){n=h("tr"),o=h("td"),s=w(c),r=h("td"),l=w(i)},m(t,e){$(t,n,e),p(n,o),p(o,s),p(n,r),p(r,l)},p:t,d(t){t&&m(n)}}}function at(t){let e,n,o,s,r,l,c,i,a,u,d;s=new lt({props:{type:"button",text:"🠔 Back",class:"sm"}}),s.$on("click",t[4]);let f=t[1],v=[];for(let e=0;e<f.length;e+=1)v[e]=it(ct(t,f,e));return{c(){e=h("div"),n=h("aside"),o=h("div"),Q(s.$$.fragment),r=x(),l=h("span"),l.textContent="Credits",c=x(),i=h("main"),a=h("table"),u=h("tbody");for(let t=0;t<v.length;t+=1)v[t].c();k(o,"class","flex align-items-center gap-15 svelte-5yfd45"),k(n,"class","flex flex-direction-column gap-15"),k(e,"class","flex svelte-5yfd45")},m(t,f){$(t,e,f),p(e,n),p(n,o),X(s,o,null),p(o,r),p(o,l),p(e,c),p(e,i),p(i,a),p(a,u);for(let t=0;t<v.length;t+=1)v[t].m(u,null);d=!0},p(t,[e]){if(2&e){let n;for(f=t[1],n=0;n<f.length;n+=1){const o=ct(t,f,n);v[n]?v[n].p(o,e):(v[n]=it(o),v[n].c(),v[n].m(u,null))}for(;n<v.length;n+=1)v[n].d(1);v.length=f.length}},i(t){d||(z(s.$$.fragment,t),d=!0)},o(t){W(s.$$.fragment,t),d=!1},d(t){t&&m(e),tt(s),g(v,t)}}}function ut(t,e,n){let{setRoute:o}=e,{lastRoute:s}=e;function r(){o(s)}return t.$$set=t=>{"setRoute"in t&&n(2,o=t.setRoute),"lastRoute"in t&&n(3,s=t.lastRoute)},[r,[["Jordan O'Leary","Programming, Game Design, and Concept"],["theBlurryBox","Art and Animation"],["Valentin Cochet","@coc_val | Sound Effect Design"],["Jake O'Connell","UI Design"],["BananaMilk","Music"],["Lost Lumens, Brad Clark","Audio Mastering"],["Matt Sweda","Concept Ideation Assistance"]],o,s,()=>r()]}class dt extends ot{constructor(t){super(),nt(this,t,ut,at,l,{setRoute:2,lastRoute:3})}}function ft(n){let o,s,r,l,c,i,u,d,f,g,v,y=[{class:f=`button-wrapper ${n[6]} ${n[4]?"is-active":""}`},n[7]],A={};for(let t=0;t<y.length;t+=1)A=e(A,y[t]);return{c(){o=h("a"),s=h("button"),r=h("div"),l=h("img"),i=x(),u=h("span"),d=w(n[5]),a(l.src,c=n[0])||k(l,"src",c),k(l,"width",n[3]),k(l,"alt",n[1]),k(r,"class","svelte-1c8t67o"),R(s,A),M(s,"svelte-1c8t67o",!0),k(o,"href",n[2])},m(t,e){$(t,o,e),p(o,s),p(s,r),p(r,l),p(r,i),p(r,u),p(u,d),s.autofocus&&s.focus(),g||(v=b(s,"click",n[8]),g=!0)},p(t,[e]){1&e&&!a(l.src,c=t[0])&&k(l,"src",c),8&e&&k(l,"width",t[3]),2&e&&k(l,"alt",t[1]),32&e&&C(d,t[5]),R(s,A=Z(y,[80&e&&f!==(f=`button-wrapper ${t[6]} ${t[4]?"is-active":""}`)&&{class:f},128&e&&t[7]])),M(s,"svelte-1c8t67o",!0),4&e&&k(o,"href",t[2])},i:t,o:t,d(t){t&&m(o),g=!1,v()}}}function pt(t,n,o){const s=["src","alt","href","width","isActive","text","class"];let r=f(n,s),{src:l}=n,{alt:c}=n,{href:i}=n,{width:a}=n,{isActive:u}=n,{text:p=""}=n,{class:$=""}=n;return t.$$set=t=>{n=e(e({},n),d(t)),o(7,r=f(n,s)),"src"in t&&o(0,l=t.src),"alt"in t&&o(1,c=t.alt),"href"in t&&o(2,i=t.href),"width"in t&&o(3,a=t.width),"isActive"in t&&o(4,u=t.isActive),"text"in t&&o(5,p=t.text),"class"in t&&o(6,$=t.class)},[l,c,i,a,u,p,$,r,function(e){I.call(this,t,e)}]}class $t extends ot{constructor(t){super(),nt(this,t,pt,ft,l,{src:0,alt:1,href:2,width:3,isActive:4,text:5,class:6})}}function mt(t,e,n){const o=t.slice();return o[7]=e[n],o}function gt(t){let e,n;return e=new lt({props:{type:"button",text:t[7]}}),e.$on("click",(function(){return t[4](t[7])})),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(e,n){t=e},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function ht(t){let e,n,o,s,r,l,c,i,a,u,d,f,v,w,y,b,R,C,A;r=new lt({props:{type:"button",text:"🠔 Back",class:"sm"}}),r.$on("click",t[3]),y=new $t({props:{src:"ui/UI_Bird.png",alt:"Twitter @spellmasons",width:"24px",href:"https://twitter.com/spellmasons",class:"button-wrapper-bg-2",text:"@spellmasons"}});let _=window.explainKeys||[],M=[];for(let e=0;e<_.length;e+=1)M[e]=gt(mt(t,_,e));const L=t=>W(M[t],1,1,(()=>{M[t]=null}));return{c(){e=h("div"),n=h("aside"),o=h("div"),s=h("div"),Q(r.$$.fragment),l=x(),c=h("h1"),c.textContent="Help",i=x(),a=h("div"),u=x(),d=h("main"),f=h("div"),v=h("h1"),v.textContent="Contact Me!",w=x(),Q(y.$$.fragment),b=x(),R=h("h1"),R.textContent="How to",C=x();for(let t=0;t<M.length;t+=1)M[t].c();k(c,"class","options-title svelte-exei4x"),k(s,"class","flex align-items-center gap-20"),k(a,"class","flex flex-direction-column gap-15"),k(o,"class","flex flex-direction-column gap-15 pad-20"),k(n,"class","svelte-exei4x"),k(f,"class","pad-20 flex flex-direction-column gap-15"),k(e,"class","flex")},m(t,m){$(t,e,m),p(e,n),p(n,o),p(o,s),X(r,s,null),p(s,l),p(s,c),p(o,i),p(o,a),p(e,u),p(e,d),p(d,f),p(f,v),p(f,w),X(y,f,null),p(f,b),p(f,R),p(f,C);for(let t=0;t<M.length;t+=1)M[t].m(f,null);A=!0},p(t,[e]){if(0&e){let n;for(_=window.explainKeys||[],n=0;n<_.length;n+=1){const o=mt(t,_,n);M[n]?(M[n].p(o,e),z(M[n],1)):(M[n]=gt(o),M[n].c(),z(M[n],1),M[n].m(f,null))}for(Y(),n=_.length;n<M.length;n+=1)L(n);q()}},i(t){if(!A){z(r.$$.fragment,t),z(y.$$.fragment,t);for(let t=0;t<_.length;t+=1)z(M[t]);A=!0}},o(t){W(r.$$.fragment,t),W(y.$$.fragment,t),M=M.filter(Boolean);for(let t=0;t<M.length;t+=1)W(M[t]);A=!1},d(t){t&&m(e),tt(r),tt(y),g(M,t)}}}function vt(t,e,n){let{setRoute:o}=e,{lastRoute:s}=e;function r(){o(s)}function l(t){if("Escape"===t.code)r()}E((()=>{document.body.addEventListener("keydown",l)})),P((()=>{document.body.removeEventListener("keydown",l)}));return t.$$set=t=>{"setRoute"in t&&n(1,o=t.setRoute),"lastRoute"in t&&n(2,s=t.lastRoute)},[r,o,s,()=>r(),t=>window.explain(t,!0)]}class wt extends ot{constructor(t){super(),nt(this,t,vt,ht,l,{setRoute:1,lastRoute:2})}}function xt(e){let n;return{c(){n=h("table"),n.innerHTML='<tr><td>Clear Active Spell</td> \n        <td><kbd class="hotkey-badge">Esc</kbd></td></tr> \n    <tr id="center-cam-info"><td>Free Look</td> \n        <td><kbd class="hotkey-badge">W</kbd> \n            <kbd class="hotkey-badge">A</kbd> \n            <kbd class="hotkey-badge">S</kbd> \n            <kbd class="hotkey-badge">D</kbd>\n            or Click and Drag Middle Mouse Button</td></tr> \n    <tr id="center-cam-tooltip"><td>Camera Follow Player</td> \n        <td><kbd class="hotkey-badge">Z</kbd></td></tr> \n    <tr><td>Ping Location</td> \n        <td><kbd class="hotkey-badge">C</kbd></td></tr> \n    <tr><td>Toggle Menu</td> \n        <td><kbd class="hotkey-badge">Esc</kbd></td></tr> \n    <tr><td>Inventory</td> \n        <td><kbd class="hotkey-badge">Tab</kbd>\n            /\n            <kbd class="hotkey-badge">i</kbd></td></tr> \n    <tr><td>View Walk Distance</td> \n        <td><kbd class="hotkey-badge">f</kbd></td></tr>',k(n,"id","keymapping")},m(t,e){$(t,n,e)},p:t,i:t,o:t,d(t){t&&m(n)}}}class yt extends ot{constructor(t){super(),nt(this,t,null,xt,l,{})}}function bt(e){let n,o,r,l,c,i,a,u,d,f;return{c(){n=h("div"),o=h("label"),o.textContent="Robe Color",r=x(),l=h("input"),c=x(),i=h("label"),i.textContent="Player Name",a=x(),u=h("input"),k(o,"for","robe"),k(l,"type","color"),k(l,"name","robe"),k(i,"for","player-name"),k(u,"type","text"),k(u,"name","player-name"),k(n,"class","flex flex-direction-column gap-15")},m(t,s){$(t,n,s),p(n,o),p(n,r),p(n,l),A(l,e[1]),p(n,c),p(n,i),p(n,a),p(n,u),A(u,e[0]),d||(f=[b(l,"input",e[3]),b(l,"blur",e[4]),b(u,"input",e[5]),b(u,"input",e[6])],d=!0)},p(t,[e]){2&e&&A(l,t[1]),1&e&&u.value!==t[0]&&A(u,t[0])},i:t,o:t,d(t){t&&m(n),d=!1,s(f)}}}function kt(t,e,n){let o=localStorage.getItem("player-name"),s=`#${parseInt(localStorage.getItem("player-color")).toString(16)}`;const r=t=>parseInt(t.slice(1),16);return[o,s,r,function(){s=this.value,n(1,s)},()=>{window.configPlayer({color:r(s),name:o})},function(){o=this.value,n(0,o)},()=>{window.configPlayer({color:r(s),name:o})}]}class Rt extends ot{constructor(t){super(),nt(this,t,kt,bt,l,{})}}function Ct(e){let n,o,s;return o=new lt({props:{text:"Toggle FPS/Latency Monitor"}}),o.$on("click",e[10]),{c(){n=h("div"),Q(o.$$.fragment)},m(t,e){$(t,n,e),X(o,n,null),s=!0},p:t,i(t){s||(z(o.$$.fragment,t),s=!0)},o(t){W(o.$$.fragment,t),s=!1},d(t){t&&m(n),tt(o)}}}function At(t){let e,n;return e=new yt({props:{setRoute:t[0],lastRoute:t[1]}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.setRoute=t[0]),2&n&&(o.lastRoute=t[1]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function _t(t){let e,n;return e=new Rt({props:{setRoute:t[0],lastRoute:t[1]}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.setRoute=t[0]),2&n&&(o.lastRoute=t[1]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function Mt(e){let n,o,r,l,c,i,a,u,d;return{c(){n=h("div"),o=w("Total Volume:\r\n                    "),r=h("input"),l=w("\r\n                    Music Volume:\r\n                    "),c=h("input"),i=w("\r\n                    Sound Effects Volume:\r\n                    "),a=h("input"),k(r,"type","range"),r.value=100*window.volume,k(r,"min","0"),k(r,"max","100"),k(c,"type","range"),c.value=100*window.volumeMusic,k(c,"min","0"),k(c,"max","100"),k(a,"type","range"),a.value=100*window.volumeGame,k(a,"min","0"),k(a,"max","100"),k(n,"class","flex flex-direction-column gap-15")},m(t,e){$(t,n,e),p(n,o),p(n,r),p(n,l),p(n,c),p(n,i),p(n,a),u||(d=[b(r,"input",Nt),b(c,"input",Tt),b(a,"input",Gt)],u=!0)},p:t,i:t,o:t,d(t){t&&m(n),u=!1,s(d)}}}function Lt(t){let e,n,o,s,r,l,c,i,a,u,d,f,g,v,w,y,b,R,C,A,_,M;r=new lt({props:{type:"button",text:"🠔 Back",class:"sm"}}),r.$on("click",t[5]),u=new lt({props:{isActive:t[2]==It,type:"button",text:"Audio"}}),u.$on("click",t[6]),f=new lt({props:{isActive:t[2]==Pt,type:"button",text:"Player Configuration"}}),f.$on("click",t[7]),v=new lt({props:{isActive:t[2]==St,type:"button",text:"Controls"}}),v.$on("click",t[8]),y=new lt({props:{isActive:t[2]==Et,type:"button",text:"Extras"}}),y.$on("click",t[9]);const L=[Mt,_t,At,Ct],S=[];function E(t,e){return t[2]==It?0:t[2]==Pt?1:t[2]==St?2:t[2]==Et?3:-1}return~(A=E(t))&&(_=S[A]=L[A](t)),{c(){e=h("div"),n=h("aside"),o=h("div"),s=h("div"),Q(r.$$.fragment),l=x(),c=h("h1"),c.textContent="Settings",i=x(),a=h("div"),Q(u.$$.fragment),d=x(),Q(f.$$.fragment),g=x(),Q(v.$$.fragment),w=x(),Q(y.$$.fragment),b=x(),R=h("main"),C=h("div"),_&&_.c(),k(c,"class","options-title svelte-exei4x"),k(s,"class","flex align-items-center gap-20"),k(a,"class","flex flex-direction-column gap-15"),k(o,"class","flex flex-direction-column gap-15 pad-20"),k(n,"class","svelte-exei4x"),k(C,"class","pad-20"),k(e,"class","flex")},m(t,m){$(t,e,m),p(e,n),p(n,o),p(o,s),X(r,s,null),p(s,l),p(s,c),p(o,i),p(o,a),X(u,a,null),p(a,d),X(f,a,null),p(a,g),X(v,a,null),p(a,w),X(y,a,null),p(e,b),p(e,R),p(R,C),~A&&S[A].m(C,null),M=!0},p(t,[e]){const n={};4&e&&(n.isActive=t[2]==It),u.$set(n);const o={};4&e&&(o.isActive=t[2]==Pt),f.$set(o);const s={};4&e&&(s.isActive=t[2]==St),v.$set(s);const r={};4&e&&(r.isActive=t[2]==Et),y.$set(r);let l=A;A=E(t),A===l?~A&&S[A].p(t,e):(_&&(Y(),W(S[l],1,1,(()=>{S[l]=null})),q()),~A?(_=S[A],_?_.p(t,e):(_=S[A]=L[A](t),_.c()),z(_,1),_.m(C,null)):_=null)},i(t){M||(z(r.$$.fragment,t),z(u.$$.fragment,t),z(f.$$.fragment,t),z(v.$$.fragment,t),z(y.$$.fragment,t),z(_),M=!0)},o(t){W(r.$$.fragment,t),W(u.$$.fragment,t),W(f.$$.fragment,t),W(v.$$.fragment,t),W(y.$$.fragment,t),W(_),M=!1},d(t){t&&m(e),tt(r),tt(u),tt(f),tt(v),tt(y),~A&&S[A].d()}}}const St="KEY_MAPPING",Et="EXTRAS",Pt="PLAYER_CONFIG",It="AUDIO";function Nt(t){window.changeVolume(t.target.value/100)}function Tt(t){window.changeVolumeMusic(t.target.value/100)}function Gt(t){window.changeVolumeGame(t.target.value/100)}function Bt(t,e,n){let{setRoute:o}=e,{lastRoute:s}=e,r=It;function l(t){n(2,r=t)}function c(){o(s)}function i(t){if("Escape"===t.code)c()}E((()=>{document.body.addEventListener("keydown",i)})),P((()=>{document.body.removeEventListener("keydown",i)}));return t.$$set=t=>{"setRoute"in t&&n(0,o=t.setRoute),"lastRoute"in t&&n(1,s=t.lastRoute)},[o,s,r,l,c,()=>c(),()=>l(It),()=>l(Pt),()=>l(St),()=>l(Et),()=>{window.monitorFPS()}]}class Ot extends ot{constructor(t){super(),nt(this,t,Bt,Lt,l,{setRoute:0,lastRoute:1})}}function Ut(t){let n,o,s,r,l,c;const i=t[4].default,a=function(t,e,n,o){if(t){const s=u(t,e,n,o);return t[0](s)}}(i,t,t[3],null);let d=[{class:s=`button-wrapper ${t[1]} ${t[0]?"is-active":""}`},t[2]],f={};for(let t=0;t<d.length;t+=1)f=e(f,d[t]);return{c(){n=h("button"),o=h("div"),a&&a.c(),k(o,"class","svelte-1k1vcg6"),R(n,f),M(n,"svelte-1k1vcg6",!0)},m(e,s){$(e,n,s),p(n,o),a&&a.m(o,null),n.autofocus&&n.focus(),r=!0,l||(c=b(n,"click",t[5]),l=!0)},p(t,[e]){a&&a.p&&(!r||8&e)&&function(t,e,n,o,s,r){if(s){const l=u(e,n,o,r);t.p(l,s)}}(a,i,t,t[3],r?function(t,e,n,o){if(t[2]&&o){const s=t[2](o(n));if(void 0===e.dirty)return s;if("object"==typeof s){const t=[],n=Math.max(e.dirty.length,s.length);for(let o=0;o<n;o+=1)t[o]=e.dirty[o]|s[o];return t}return e.dirty|s}return e.dirty}(i,t[3],e,null):function(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let t=0;t<n;t++)e[t]=-1;return e}return-1}(t[3]),null),R(n,f=Z(d,[(!r||3&e&&s!==(s=`button-wrapper ${t[1]} ${t[0]?"is-active":""}`))&&{class:s},4&e&&t[2]])),M(n,"svelte-1k1vcg6",!0)},i(t){r||(z(a,t),r=!0)},o(t){W(a,t),r=!1},d(t){t&&m(n),a&&a.d(t),l=!1,c()}}}function jt(t,n,o){const s=["isActive","class"];let r=f(n,s),{$$slots:l={},$$scope:c}=n,{isActive:i}=n,{class:a=""}=n;return t.$$set=t=>{n=e(e({},n),d(t)),o(2,r=f(n,s)),"isActive"in t&&o(0,i=t.isActive),"class"in t&&o(1,a=t.class),"$$scope"in t&&o(3,c=t.$$scope)},[i,a,r,c,l,function(e){I.call(this,t,e)}]}class Dt extends ot{constructor(t){super(),nt(this,t,jt,Ut,l,{isActive:0,class:1})}}function Ht(e){let n,o,s,r,l,c,i,a,u,d,f,g,h,x,y,b,R,C,A,_;return{c(){n=v("svg"),o=v("title"),s=w("Language / Localization"),r=v("defs"),l=v("style"),c=w(".cls-1 {\r\n                stroke: #231f20;\r\n            }\r\n\r\n            .cls-1,\r\n            .cls-2 {\r\n                fill: none;\r\n                stroke-miterlimit: 10;\r\n            }\r\n\r\n            .cls-2 {\r\n                stroke: #fff;\r\n            }\r\n        "),i=v("g"),a=v("circle"),u=v("path"),d=v("line"),f=v("g"),g=v("path"),h=v("g"),x=v("path"),y=v("g"),b=v("path"),R=v("g"),C=v("path"),A=v("g"),_=v("line"),k(o,"id","title"),k(a,"class","cls-2"),k(a,"cx","32.5"),k(a,"cy","32.5"),k(a,"r","32"),k(u,"class","cls-1"),k(u,"d","M32.5,64.5v0Z"),k(d,"class","cls-2"),k(d,"x1",".5"),k(d,"y1","32.5"),k(d,"x2","64.5"),k(d,"y2","32.5"),k(i,"id","Layer_1"),k(i,"data-name","Layer 1"),k(g,"class","cls-2"),k(g,"d","M32.5,64.5C-8.55,32.5,32.5,.5,32.5,.5"),k(f,"id","Layer_2"),k(f,"data-name","Layer 2"),k(x,"class","cls-2"),k(x,"d","M32.5,.5s42.98,32,0,64"),k(h,"id","Layer_3"),k(h,"data-name","Layer 3"),k(b,"class","cls-2"),k(b,"d","M11.22,8.49s21.28,13.57,42.6,.15"),k(y,"id","Layer_4"),k(y,"data-name","Layer 4"),k(C,"class","cls-2"),k(C,"d","M11.22,56.56s21.28-13.27,42.6,0"),k(R,"id","Layer_5"),k(R,"data-name","Layer 5"),k(_,"class","cls-2"),k(_,"x1","32.5"),k(_,"y1",".5"),k(_,"x2","32.5"),k(_,"y2","64.5"),k(A,"id","Layer_6"),k(A,"data-name","Layer 6"),k(n,"xmlns","http://www.w3.org/2000/svg"),k(n,"viewBox","-1 0 67 66"),k(n,"labelledby","title"),k(n,"role","img"),k(n,"class","svelte-1sy6cvw")},m(t,e){$(t,n,e),p(n,o),p(o,s),p(n,r),p(r,l),p(l,c),p(n,i),p(i,a),p(i,u),p(i,d),p(n,f),p(f,g),p(n,h),p(h,x),p(n,y),p(y,b),p(n,R),p(R,C),p(n,A),p(A,_)},p:t,i:t,o:t,d(t){t&&m(n)}}}class Vt extends ot{constructor(t){super(),nt(this,t,null,Ht,l,{})}}const Ft="OPTIONS",Jt="CREDITS",Kt="HELP",Yt="PLAY",qt="TODO";function zt(t){let e,n;return e=new Vt({}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function Wt(t){let e,n,o,s,r={ctx:t,current:null,token:null,hasCatch:!0,pending:re,then:Xt,catch:Qt,blocks:[,,,]};return function(t,e){const n=e.token={};function o(t,o,s,r){if(e.token!==n)return;e.resolved=r;let l=e.ctx;void 0!==s&&(l=l.slice(),l[s]=r);const c=t&&(e.current=t)(l);let i=!1;e.block&&(e.blocks?e.blocks.forEach(((t,n)=>{n!==o&&t&&(Y(),W(t,1,1,(()=>{e.blocks[n]===t&&(e.blocks[n]=null)})),q())})):e.block.d(1),c.c(),z(c,1),c.m(e.mount(),e.anchor),i=!0),e.block=c,e.blocks&&(e.blocks[o]=c),i&&V()}if((s=t)&&"object"==typeof s&&"function"==typeof s.then){const n=S();if(t.then((t=>{L(n),o(e.then,1,e.value,t),L(null)}),(t=>{if(L(n),o(e.catch,2,e.error,t),L(null),!e.hasCatch)throw t})),e.current!==e.pending)return o(e.pending,0),!0}else{if(e.current!==e.then)return o(e.then,1,e.value,t),!0;e.resolved=t}var s}(window.setupPixiPromise,r),{c(){e=h("div"),n=x(),o=y(),r.block.c(),k(e,"id","websocket-pie-connection-status")},m(t,l){$(t,e,l),$(t,n,l),$(t,o,l),r.block.m(t,r.anchor=l),r.mount=()=>o.parentNode,r.anchor=o,s=!0},p(e,n){!function(t,e,n){const o=e.slice(),{resolved:s}=t;t.current===t.then&&(o[t.value]=s),t.current===t.catch&&(o[t.error]=s),t.block.p(o,n)}(r,t=e,n)},i(t){s||(z(r.block),s=!0)},o(t){for(let t=0;t<3;t+=1){W(r.blocks[t])}s=!1},d(t){t&&m(e),t&&m(n),t&&m(o),r.block.d(t),r.token=null,r=null}}}function Zt(e){let n,o,s,r,l,c,i;return o=new lt({props:{text:"Resume Game"}}),o.$on("click",ce),r=new lt({props:{text:"Settings"}}),r.$on("click",e[17]),c=new lt({props:{text:"Quit to Main Menu"}}),c.$on("click",e[12]),{c(){n=h("div"),Q(o.$$.fragment),s=x(),Q(r.$$.fragment),l=x(),Q(c.$$.fragment),k(n,"class","list svelte-1g04adh")},m(t,e){$(t,n,e),X(o,n,null),p(n,s),X(r,n,null),p(n,l),X(c,n,null),i=!0},p:t,i(t){i||(z(o.$$.fragment,t),z(r.$$.fragment,t),z(c.$$.fragment,t),i=!0)},o(t){W(o.$$.fragment,t),W(r.$$.fragment,t),W(c.$$.fragment,t),i=!1},d(t){t&&m(n),tt(o),tt(r),tt(c)}}}function Qt(e){let n;return{c(){n=h("p"),n.textContent="Something went wrong loading assets",_(n,"color","red")},m(t,e){$(t,n,e)},p:t,i:t,o:t,d(t){t&&m(n)}}}function Xt(t){let e,n,o,s,r,l,c,i,a,u,d;n=new lt({props:{text:"New Run"}}),n.$on("click",t[8]),s=new lt({props:{text:"Multiplayer"}}),s.$on("click",t[9]),l=new lt({props:{text:"Settings"}}),l.$on("click",t[18]);let f=!1===t[4]&&te(t);return{c(){e=h("div"),Q(n.$$.fragment),o=x(),Q(s.$$.fragment),r=x(),Q(l.$$.fragment),c=x(),i=h("br"),a=x(),f&&f.c(),u=y(),k(e,"class","list svelte-1g04adh")},m(t,m){$(t,e,m),X(n,e,null),p(e,o),X(s,e,null),p(e,r),X(l,e,null),$(t,c,m),$(t,i,m),$(t,a,m),f&&f.m(t,m),$(t,u,m),d=!0},p(t,e){!1===t[4]?f?(f.p(t,e),16&e&&z(f,1)):(f=te(t),f.c(),z(f,1),f.m(u.parentNode,u)):f&&(Y(),W(f,1,1,(()=>{f=null})),q())},i(t){d||(z(n.$$.fragment,t),z(s.$$.fragment,t),z(l.$$.fragment,t),z(f),d=!0)},o(t){W(n.$$.fragment,t),W(s.$$.fragment,t),W(l.$$.fragment,t),W(f),d=!1},d(t){t&&m(e),tt(n),tt(s),tt(l),t&&m(c),t&&m(i),t&&m(a),f&&f.d(t),t&&m(u)}}}function te(t){let e,n,o,r,l,c,i,a,u,d,f,g,v;l=new lt({props:{disabled:t[7],text:"Connect"}}),l.$on("click",t[10]),i=new lt({props:{disabled:!t[7],text:"Disconnect"}}),i.$on("click",t[11]);let k=t[2]&&ee(),R=t[7]&&ne(t);return{c(){e=w("Server Url\r\n            "),n=h("div"),o=h("input"),r=x(),Q(l.$$.fragment),c=x(),Q(i.$$.fragment),a=x(),k&&k.c(),u=x(),R&&R.c(),d=y()},m(s,m){$(s,e,m),$(s,n,m),p(n,o),A(o,t[5]),p(n,r),X(l,n,null),p(n,c),X(i,n,null),$(s,a,m),k&&k.m(s,m),$(s,u,m),R&&R.m(s,m),$(s,d,m),f=!0,g||(v=[b(o,"input",t[19]),b(o,"keypress",t[20])],g=!0)},p(t,e){32&e&&o.value!==t[5]&&A(o,t[5]);const n={};128&e&&(n.disabled=t[7]),l.$set(n);const s={};128&e&&(s.disabled=!t[7]),i.$set(s),t[2]?k||(k=ee(),k.c(),k.m(u.parentNode,u)):k&&(k.d(1),k=null),t[7]?R?(R.p(t,e),128&e&&z(R,1)):(R=ne(t),R.c(),z(R,1),R.m(d.parentNode,d)):R&&(Y(),W(R,1,1,(()=>{R=null})),q())},i(t){f||(z(l.$$.fragment,t),z(i.$$.fragment,t),z(R),f=!0)},o(t){W(l.$$.fragment,t),W(i.$$.fragment,t),W(R),f=!1},d(t){t&&m(e),t&&m(n),tt(l),tt(i),t&&m(a),k&&k.d(t),t&&m(u),R&&R.d(t),t&&m(d),g=!1,s(v)}}}function ee(t){let e,n;return{c(){e=w("Connecting...\r\n                "),n=h("div"),n.innerHTML='<div class="svelte-1g04adh"></div> \n                    <div class="svelte-1g04adh"></div> \n                    <div class="svelte-1g04adh"></div> \n                    <div class="svelte-1g04adh"></div>',k(n,"class","lds-ellipsis svelte-1g04adh")},m(t,o){$(t,e,o),$(t,n,o)},d(t){t&&m(e),t&&m(n)}}}function ne(t){let e,n,o,r,l,c,i,a,u,d;const f=[se,oe],p=[];function g(t,e){return t[3]?0:1}return l=g(t),c=p[l]=f[l](t),{c(){e=h("p"),e.textContent="Game name",n=x(),o=h("input"),r=x(),c.c(),i=y()},m(s,c){$(s,e,c),$(s,n,c),$(s,o,c),A(o,t[6]),$(s,r,c),p[l].m(s,c),$(s,i,c),a=!0,u||(d=[b(o,"input",t[21]),b(o,"keypress",t[22])],u=!0)},p(t,e){64&e&&o.value!==t[6]&&A(o,t[6]);let n=l;l=g(t),l===n?p[l].p(t,e):(Y(),W(p[n],1,1,(()=>{p[n]=null})),q(),c=p[l],c?c.p(t,e):(c=p[l]=f[l](t),c.c()),z(c,1),c.m(i.parentNode,i))},i(t){a||(z(c),a=!0)},o(t){W(c),a=!1},d(t){t&&m(e),t&&m(n),t&&m(o),t&&m(r),p[l].d(t),t&&m(i),u=!1,s(d)}}}function oe(e){let n,o,s,r,l;return o=new lt({props:{text:"Host"}}),o.$on("click",e[13]),r=new lt({props:{text:"Join"}}),r.$on("click",e[13]),{c(){n=h("div"),Q(o.$$.fragment),s=x(),Q(r.$$.fragment),_(n,"display","flex")},m(t,e){$(t,n,e),X(o,n,null),p(n,s),X(r,n,null),l=!0},p:t,i(t){l||(z(o.$$.fragment,t),z(r.$$.fragment,t),l=!0)},o(t){W(o.$$.fragment,t),W(r.$$.fragment,t),l=!1},d(t){t&&m(n),tt(o),tt(r)}}}function se(e){let n,o;return{c(){n=w("Joining...\r\n                    "),o=h("div"),o.innerHTML='<div class="svelte-1g04adh"></div> \n                        <div class="svelte-1g04adh"></div> \n                        <div class="svelte-1g04adh"></div> \n                        <div class="svelte-1g04adh"></div>',k(o,"class","lds-ellipsis svelte-1g04adh")},m(t,e){$(t,n,e),$(t,o,e)},p:t,i:t,o:t,d(t){t&&m(n),t&&m(o)}}}function re(e){let n;return{c(){n=w("loading assets...")},m(t,e){$(t,n,e)},p:t,i:t,o:t,d(t){t&&m(n)}}}function le(t){let e,n,o,s,r,l,c,i,a,u,d,f,g,v,w;n=new lt({props:{text:"Help"}}),n.$on("click",t[14]),r=new lt({props:{text:"Credits"}}),r.$on("click",t[15]),i=new $t({props:{src:"ui/UI_Bird.png",alt:"Twitter @spellmasons",width:"24px",href:"https://twitter.com/spellmasons",class:"button-wrapper-bg-2"}}),u=new Dt({props:{class:"button-wrapper-bg-2",$$slots:{default:[zt]},$$scope:{ctx:t}}}),u.$on("click",t[16]);const b=[Zt,Wt],R=[];function C(t,e){return t[1]?0:1}return f=C(t),g=R[f]=b[f](t),{c(){e=h("div"),Q(n.$$.fragment),o=x(),s=h("div"),Q(r.$$.fragment),l=x(),c=h("div"),Q(i.$$.fragment),a=x(),Q(u.$$.fragment),d=x(),g.c(),v=y(),k(e,"id","corner-left"),k(e,"class","flex gap svelte-1g04adh"),_(e,"flex-direction","column"),k(c,"class","flex gap svelte-1g04adh"),k(s,"id","corner"),k(s,"class","flex gap svelte-1g04adh"),_(s,"flex-direction","column")},m(t,m){$(t,e,m),X(n,e,null),$(t,o,m),$(t,s,m),X(r,s,null),p(s,l),p(s,c),X(i,c,null),p(c,a),X(u,c,null),$(t,d,m),R[f].m(t,m),$(t,v,m),w=!0},p(t,[e]){const n={};33554432&e&&(n.$$scope={dirty:e,ctx:t}),u.$set(n);let o=f;f=C(t),f===o?R[f].p(t,e):(Y(),W(R[o],1,1,(()=>{R[o]=null})),q(),g=R[f],g?g.p(t,e):(g=R[f]=b[f](t),g.c()),z(g,1),g.m(v.parentNode,v))},i(t){w||(z(n.$$.fragment,t),z(r.$$.fragment,t),z(i.$$.fragment,t),z(u.$$.fragment,t),z(g),w=!0)},o(t){W(n.$$.fragment,t),W(r.$$.fragment,t),W(i.$$.fragment,t),W(u.$$.fragment,t),W(g),w=!1},d(t){t&&m(e),tt(n),t&&m(o),t&&m(s),tt(r),tt(i),tt(u),t&&m(d),R[f].d(t),t&&m(v)}}}function ce(){window.closeMenu()}function ie(t,e,n){let o,{setRoute:s}=e,{inGame:r}=e,l=!1,c=!1;function i(){window.playMusic(),o&&m(),n(4,o=!1)}let a,u=new URLSearchParams(location.search),d=u.get("pieUrl"),f=u.get("game");function p(){n(7,a=window.isConnected()),n(2,l=!1)}function $(){if(d){console.log("Menu: Connect to server",d),n(2,l=!0);const t=new URL(location.href);return t.searchParams.set("pieUrl",d),window.history.pushState(null,null,t),window.connect_to_wsPie_server(d).catch(console.error).then(p)}return Promise.reject("No wsUrl defined to connect to")}function m(){window.pieDisconnect().then(p)}function g(){f?window.isConnected()?(console.log("Menu: Connect to game name",f),n(3,c=!0),window.joinRoom({name:f}).then((()=>{const t=new URL(location.href);t.searchParams.set("game",f),window.history.pushState(null,null,t)})).catch((t=>{console.error("Could not join room",t)})).then((()=>{n(3,c=!1)}))):console.error("Cannot join room until pieClient is connected to a pieServer"):console.log("Cannot join game until a gameName is provided")}window.tryAutoConnect=()=>{d&&(console.log("Menu: Start auto connect"),i(),$())};return t.$$set=t=>{"setRoute"in t&&n(0,s=t.setRoute),"inGame"in t&&n(1,r=t.inGame)},[s,r,l,c,o,d,f,a,function(){window.playMusic(),n(4,o=!0),window.startSingleplayer().then((()=>{p()}))},i,$,m,function(){if(confirm("Are you sure you want to quit to Main Menu?")){const t=new URL(location.href);t.searchParams.delete("game"),t.searchParams.delete("pieUrl"),window.history.pushState(null,null,t),window.exitCurrentGame().then(p)}},g,()=>s(Kt),()=>s(Jt),()=>{s(qt)},()=>s(Ft),()=>s(Ft),function(){d=this.value,n(5,d)},t=>{"Enter"==t.key&&$()},function(){f=this.value,n(6,f)},t=>{"Enter"==t.key&&g()}]}class ae extends ot{constructor(t){super(),nt(this,t,ie,le,l,{setRoute:0,inGame:1})}}function ue(e){let n,o,s,r;return s=new lt({props:{type:"button",text:"🠔 Back",class:"sm"}}),s.$on("click",e[3]),{c(){n=h("h1"),n.textContent="This page is still being built",o=x(),Q(s.$$.fragment),k(n,"class","svelte-1n2jha3")},m(t,e){$(t,n,e),$(t,o,e),X(s,t,e),r=!0},p:t,i(t){r||(z(s.$$.fragment,t),r=!0)},o(t){W(s.$$.fragment,t),r=!1},d(t){t&&m(n),t&&m(o),tt(s,t)}}}function de(t,e,n){let{setRoute:o}=e,{lastRoute:s}=e;function r(){o(s)}return t.$$set=t=>{"setRoute"in t&&n(1,o=t.setRoute),"lastRoute"in t&&n(2,s=t.lastRoute)},[r,o,s,()=>r()]}class fe extends ot{constructor(t){super(),nt(this,t,de,ue,l,{setRoute:1,lastRoute:2})}}function pe(t){let e,n;return e=new fe({props:{setRoute:t[3],lastRoute:t[0],route:!0}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.lastRoute=t[0]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function $e(t){let e,n;return e=new wt({props:{setRoute:t[3],lastRoute:t[0],route:!0}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.lastRoute=t[0]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function me(t){let e,n;return e=new dt({props:{setRoute:t[3],lastRoute:t[0],route:!0}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.lastRoute=t[0]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function ge(t){let e,n;return e=new Ot({props:{setRoute:t[3],lastRoute:t[0],route:!0}}),{c(){Q(e.$$.fragment)},m(t,o){X(e,t,o),n=!0},p(t,n){const o={};1&n&&(o.lastRoute=t[0]),e.$set(o)},i(t){n||(z(e.$$.fragment,t),n=!0)},o(t){W(e.$$.fragment,t),n=!1},d(t){tt(e,t)}}}function he(t){let e,n,o,s,r,l,c;return l=new ae({props:{setRoute:t[3],lastRoute:t[0],inGame:t[2]}}),{c(){e=h("div"),n=h("div"),o=h("img"),r=x(),Q(l.$$.fragment),k(o,"id","logo"),a(o.src,s="ui/logo.png")||k(o,"src","ui/logo.png"),k(o,"alt","Spellmasons logo"),k(o,"width","800"),k(n,"id","main-menu-inner"),k(e,"id","main-menu")},m(t,s){$(t,e,s),p(e,n),p(n,o),p(n,r),X(l,n,null),c=!0},p(t,e){const n={};1&e&&(n.lastRoute=t[0]),4&e&&(n.inGame=t[2]),l.$set(n)},i(t){c||(z(l.$$.fragment,t),c=!0)},o(t){W(l.$$.fragment,t),c=!1},d(t){t&&m(e),tt(l)}}}function ve(t){let e,n,o,s,r,l;const c=[he,ge,me,$e,pe],i=[];function a(t,e){return t[1]==Yt?0:t[1]==Ft?1:t[1]==Jt?2:t[1]==Kt?3:t[1]==qt?4:-1}return~(s=a(t))&&(r=i[s]=c[s](t)),{c(){e=h("div"),n=h("div"),o=h("div"),r&&r.c(),k(o,"class","decorative-border"),k(n,"class","full-fill"),k(e,"id","menu")},m(t,r){$(t,e,r),p(e,n),p(n,o),~s&&i[s].m(o,null),l=!0},p(t,[e]){let n=s;s=a(t),s===n?~s&&i[s].p(t,e):(r&&(Y(),W(i[n],1,1,(()=>{i[n]=null})),q()),~s?(r=i[s],r?r.p(t,e):(r=i[s]=c[s](t),r.c()),z(r,1),r.m(o,null)):r=null)},i(t){l||(z(r),l=!0)},o(t){W(r),l=!1},d(t){t&&m(e),~s&&i[s].d()}}}function we(t,e,n){let o,s;console.log("Menu: Svelte menu is running");let r=!1;function l(t){console.log("Menu: Route:",t),n(0,o=s),n(1,s=t),window.updateInGameMenuStatus()}return window.updateInGameMenuStatus=()=>{n(2,r=void 0!==window.player)},l(Yt),window.setMenu=l,[o,s,r,l]}return new class extends ot{constructor(t){super(),nt(this,t,we,ve,l,{})}}({target:document.getElementById("menu-app")||document.body,props:{}})}();
//# sourceMappingURL=svelte-bundle.js.map

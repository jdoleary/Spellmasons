var app=function(){"use strict";function t(){}function n(t){return t()}function e(){return Object.create(null)}function o(t){t.forEach(n)}function c(t){return"function"==typeof t}function r(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function u(t,n){t.appendChild(n)}function i(t,n,e){t.insertBefore(n,e||null)}function l(t){t.parentNode.removeChild(t)}function s(t){return document.createElement(t)}function a(t){return document.createTextNode(t)}function d(){return a(" ")}function f(){return a("")}function p(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function m(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function h(t,n){t.value=null==n?"":n}function w(t,n,e,o){null===e?t.style.removeProperty(n):t.style.setProperty(n,e,o?"important":"")}let g;function $(t){g=t}function b(){if(!g)throw new Error("Function called outside component initialization");return g}const k=[],y=[],x=[],v=[],R=Promise.resolve();let S=!1;function C(t){x.push(t)}const O=new Set;let P=0;function _(){const t=g;do{for(;P<k.length;){const t=k[P];P++,$(t),N(t.$$)}for($(null),k.length=0,P=0;y.length;)y.pop()();for(let t=0;t<x.length;t+=1){const n=x[t];O.has(n)||(O.add(n),n())}x.length=0}while(k.length);for(;v.length;)v.pop()();S=!1,O.clear(),$(t)}function N(t){if(null!==t.fragment){t.update(),o(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(C)}}const T=new Set;let I;function M(){I={r:0,c:[],p:I}}function E(){I.r||o(I.c),I=I.p}function G(t,n){t&&t.i&&(T.delete(t),t.i(n))}function A(t,n,e,o){if(t&&t.o){if(T.has(t))return;T.add(t),I.c.push((()=>{T.delete(t),o&&(e&&t.d(1),o())})),t.o(n)}}function L(t,n){const e=n.token={};function o(t,o,c,r){if(n.token!==e)return;n.resolved=r;let u=n.ctx;void 0!==c&&(u=u.slice(),u[c]=r);const i=t&&(n.current=t)(u);let l=!1;n.block&&(n.blocks?n.blocks.forEach(((t,e)=>{e!==o&&t&&(M(),A(t,1,1,(()=>{n.blocks[e]===t&&(n.blocks[e]=null)})),E())})):n.block.d(1),i.c(),G(i,1),i.m(n.mount(),n.anchor),l=!0),n.block=i,n.blocks&&(n.blocks[o]=i),l&&_()}if((c=t)&&"object"==typeof c&&"function"==typeof c.then){const e=b();if(t.then((t=>{$(e),o(n.then,1,n.value,t),$(null)}),(t=>{if($(e),o(n.catch,2,n.error,t),$(null),!n.hasCatch)throw t})),n.current!==n.pending)return o(n.pending,0),!0}else{if(n.current!==n.then)return o(n.then,1,n.value,t),!0;n.resolved=t}var c}function j(t){t&&t.c()}function U(t,e,r,u){const{fragment:i,on_mount:l,on_destroy:s,after_update:a}=t.$$;i&&i.m(e,r),u||C((()=>{const e=l.map(n).filter(c);s?s.push(...e):o(e),t.$$.on_mount=[]})),a.forEach(C)}function B(t,n){const e=t.$$;null!==e.fragment&&(o(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function q(t,n){-1===t.$$.dirty[0]&&(k.push(t),S||(S=!0,R.then(_)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function z(n,c,r,u,i,s,a,d=[-1]){const f=g;$(n);const p=n.$$={fragment:null,ctx:null,props:s,update:t,not_equal:i,bound:e(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(c.context||(f?f.$$.context:[])),callbacks:e(),dirty:d,skip_bound:!1,root:c.target||f.$$.root};a&&a(p.root);let m=!1;if(p.ctx=r?r(n,c.props||{},((t,e,...o)=>{const c=o.length?o[0]:e;return p.ctx&&i(p.ctx[t],p.ctx[t]=c)&&(!p.skip_bound&&p.bound[t]&&p.bound[t](c),m&&q(n,t)),e})):[],p.update(),m=!0,o(p.before_update),p.fragment=!!u&&u(p.ctx),c.target){if(c.hydrate){const t=function(t){return Array.from(t.childNodes)}(c.target);p.fragment&&p.fragment.l(t),t.forEach(l)}else p.fragment&&p.fragment.c();c.intro&&G(n.$$.fragment),U(n,c.target,c.anchor,c.customElement),_()}$(f)}class V{$destroy(){B(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function D(n){let e,c,r,f,h,w,g,$,b;return{c(){e=s("button"),e.textContent="🠔 Back",c=d(),r=s("div"),f=a("Volume:\r\n    "),h=s("input"),w=d(),g=s("button"),g.textContent="Re-prompt Cookie Consent",m(e,"type","button"),m(h,"type","range"),h.value="100",m(h,"min","0"),m(h,"max","100"),m(g,"type","button")},m(t,o){i(t,e,o),i(t,c,o),i(t,r,o),u(r,f),u(r,h),i(t,w,o),i(t,g,o),$||(b=[p(e,"click",n[2]),p(h,"input",F),p(g,"click",n[3])],$=!0)},p:t,i:t,o:t,d(t){t&&l(e),t&&l(c),t&&l(r),t&&l(w),t&&l(g),$=!1,o(b)}}}function F(t){window.changeVolume(t.target.value)}function H(t,n,e){let{setRoute:o}=n,{lastRoute:c}=n;return t.$$set=t=>{"setRoute"in t&&e(0,o=t.setRoute),"lastRoute"in t&&e(1,c=t.lastRoute)},[o,c,()=>o(c),()=>window.cookieConsentPopup(!0)]}class J extends V{constructor(t){super(),z(this,t,H,D,r,{setRoute:0,lastRoute:1})}}function Q(t){let n,e,c,r,u,a,h,w,g,$,b,k={ctx:t,current:null,token:null,hasCatch:!0,pending:nt,then:W,catch:K};return L(window.setupPixiPromise,k),{c(){n=s("div"),e=d(),c=s("button"),c.textContent="Singleplayer",r=d(),u=s("button"),u.textContent="Multiplayer",a=d(),h=s("br"),w=d(),g=f(),k.block.c(),m(n,"id","websocket-pie-connection-status")},m(o,l){i(o,n,l),i(o,e,l),i(o,c,l),i(o,r,l),i(o,u,l),i(o,a,l),i(o,h,l),i(o,w,l),i(o,g,l),k.block.m(o,k.anchor=l),k.mount=()=>g.parentNode,k.anchor=g,$||(b=[p(c,"click",t[8]),p(u,"click",t[9])],$=!0)},p(n,e){!function(t,n,e){const o=n.slice(),{resolved:c}=t;t.current===t.then&&(o[t.value]=c),t.current===t.catch&&(o[t.error]=c),t.block.p(o,e)}(k,t=n,e)},d(t){t&&l(n),t&&l(e),t&&l(c),t&&l(r),t&&l(u),t&&l(a),t&&l(h),t&&l(w),t&&l(g),k.block.d(t),k.token=null,k=null,$=!1,o(b)}}}function Y(n){let e,c,r,a,f,h,w,g;return{c(){e=s("div"),c=s("button"),c.textContent="Resume Game",r=d(),a=s("button"),a.textContent="Options",f=d(),h=s("button"),h.textContent="Quit to Main Menu",m(c,"class","svelte-1snxd9a"),m(a,"class","svelte-1snxd9a"),m(h,"class","svelte-1snxd9a"),m(e,"class","list svelte-1snxd9a")},m(t,o){i(t,e,o),u(e,c),u(e,r),u(e,a),u(e,f),u(e,h),w||(g=[p(c,"click",ct),p(a,"click",n[13]),p(h,"click",ot)],w=!0)},p:t,d(t){t&&l(e),w=!1,o(g)}}}function K(n){let e;return{c(){e=s("p"),e.textContent="Something went wrong loading assets",w(e,"color","red")},m(t,n){i(t,e,n)},p:t,d(t){t&&l(e)}}}function W(t){let n,e=!1===t[4]&&X(t);return{c(){e&&e.c(),n=f()},m(t,o){e&&e.m(t,o),i(t,n,o)},p(t,o){!1===t[4]?e?e.p(t,o):(e=X(t),e.c(),e.m(n.parentNode,n)):e&&(e.d(1),e=null)},d(t){e&&e.d(t),t&&l(n)}}}function X(t){let n,e,c,r,m,w,g,$,b,k,y,x,v,R,S,C=t[3]&&Z(),O=t[6]&&tt(t);return{c(){n=a("Server Url\r\n            "),e=s("div"),c=s("input"),r=d(),m=s("button"),w=a("Connect"),g=d(),$=s("button"),b=a("Disconnect"),y=d(),C&&C.c(),x=d(),O&&O.c(),v=f(),m.disabled=t[6],$.disabled=k=!t[6]},m(o,l){i(o,n,l),i(o,e,l),u(e,c),h(c,t[5]),u(e,r),u(e,m),u(m,w),u(e,g),u(e,$),u($,b),i(o,y,l),C&&C.m(o,l),i(o,x,l),O&&O.m(o,l),i(o,v,l),R||(S=[p(c,"input",t[14]),p(c,"keypress",t[15]),p(m,"click",t[10]),p($,"click",t[11])],R=!0)},p(t,n){32&n&&c.value!==t[5]&&h(c,t[5]),64&n&&(m.disabled=t[6]),64&n&&k!==(k=!t[6])&&($.disabled=k),t[3]?C||(C=Z(),C.c(),C.m(x.parentNode,x)):C&&(C.d(1),C=null),t[6]?O?O.p(t,n):(O=tt(t),O.c(),O.m(v.parentNode,v)):O&&(O.d(1),O=null)},d(t){t&&l(n),t&&l(e),t&&l(y),C&&C.d(t),t&&l(x),O&&O.d(t),t&&l(v),R=!1,o(S)}}}function Z(t){let n;return{c(){n=a("Connecting...")},m(t,e){i(t,n,e)},d(t){t&&l(n)}}}function tt(t){let n,e,c,r,a,f,m,g,$,b;return{c(){n=s("p"),n.textContent="Game name",e=d(),c=s("input"),r=d(),a=s("div"),f=s("button"),f.textContent="Host",m=d(),g=s("button"),g.textContent="Join",w(a,"display","flex")},m(o,l){i(o,n,l),i(o,e,l),i(o,c,l),h(c,t[7]),i(o,r,l),i(o,a,l),u(a,f),u(a,m),u(a,g),$||(b=[p(c,"input",t[16]),p(c,"keypress",t[17]),p(f,"click",t[12]),p(g,"click",t[12])],$=!0)},p(t,n){128&n&&c.value!==t[7]&&h(c,t[7])},d(t){t&&l(n),t&&l(e),t&&l(c),t&&l(r),t&&l(a),$=!1,o(b)}}}function nt(n){let e;return{c(){e=a("loading assets...")},m(t,n){i(t,e,n)},p:t,d(t){t&&l(e)}}}function et(n){let e;function o(t,n){return t[2]?Y:Q}let c=o(n),r=c(n);return{c(){r.c(),e=f()},m(t,n){r.m(t,n),i(t,e,n)},p(t,[n]){c===(c=o(t))&&r?r.p(t,n):(r.d(1),r=c(t),r&&(r.c(),r.m(e.parentNode,e)))},i:t,o:t,d(t){r.d(t),t&&l(e)}}}function ot(){confirm("Are you sure you want to quit to Main Menu?")&&window.exitCurrentGame()}function ct(){window.closeMenu()}function rt(t,n,e){let o,{setRoute:c}=n,{OPTIONS:r}=n,{inGame:u}=n,i=!1;function l(){window.playMusic(),o&&m(),e(4,o=!1)}let s,a,d=new URLSearchParams(location.search).get("pieUrl");function f(){e(6,s=window.pie.isConnected()),e(3,i=!1)}function p(){if(d){e(3,i=!0),window.connect_to_wsPie_server(d).then(f);const t=new URLSearchParams(location.search);t.set("pieUrl",d),urlSearch=t.toString()}}function m(){window.pie.disconnect().then(f)}function h(){window.pie.isConnected()?(console.log("Setup: Loading complete.. initialize game"),window.joinRoom({name:a}).then((()=>{const t=new URLSearchParams(location.search);t.set("game",a),urlSearch=t.toString()}))):console.error("Cannot join room until pieClient is connected to a pieServer")}d&&(l(),p());return t.$$set=t=>{"setRoute"in t&&e(0,c=t.setRoute),"OPTIONS"in t&&e(1,r=t.OPTIONS),"inGame"in t&&e(2,u=t.inGame)},[c,r,u,i,o,d,s,a,function(){window.playMusic(),e(4,o=!0),window.startSingleplayer().then((()=>{f()}))},l,p,m,h,()=>c(r),function(){d=this.value,e(5,d)},t=>{"Enter"==t.key&&p()},function(){a=this.value,e(7,a)},t=>{"Enter"==t.key&&h()}]}class ut extends V{constructor(t){super(),z(this,t,rt,et,r,{setRoute:0,OPTIONS:1,inGame:2})}}function it(n){let e,c,r,a,f,h,w,g;return{c(){e=s("div"),c=s("button"),c.textContent="Resume Tutorial",r=d(),a=s("button"),a.textContent="Options",f=d(),h=s("button"),h.textContent="Skip Tutorial",m(e,"class","list")},m(t,o){i(t,e,o),u(e,c),u(e,r),u(e,a),u(e,f),u(e,h),w||(g=[p(c,"click",st),p(a,"click",n[2]),p(h,"click",lt)],w=!0)},p:t,i:t,o:t,d(t){t&&l(e),w=!1,o(g)}}}function lt(){confirm("Are you sure you want to skip the tutorial?")&&(window.skipTutorial(),window.exitCurrentGame())}function st(){window.closeMenu()}function at(t,n,e){let{OPTIONS:o}=n,{setRoute:c}=n;return t.$$set=t=>{"OPTIONS"in t&&e(0,o=t.OPTIONS),"setRoute"in t&&e(1,c=t.setRoute)},[o,c,()=>c(o)]}class dt extends V{constructor(t){super(),z(this,t,at,it,r,{OPTIONS:0,setRoute:1})}}function ft(n){let e,o;return e=new dt({props:{setRoute:n[3],OPTIONS:wt}}),{c(){j(e.$$.fragment)},m(t,n){U(e,t,n),o=!0},p:t,i(t){o||(G(e.$$.fragment,t),o=!0)},o(t){A(e.$$.fragment,t),o=!1},d(t){B(e,t)}}}function pt(t){let n,e;return n=new J({props:{setRoute:t[3],lastRoute:t[0]}}),{c(){j(n.$$.fragment)},m(t,o){U(n,t,o),e=!0},p(t,e){const o={};1&e&&(o.lastRoute=t[0]),n.$set(o)},i(t){e||(G(n.$$.fragment,t),e=!0)},o(t){A(n.$$.fragment,t),e=!1},d(t){B(n,t)}}}function mt(t){let n,e;return n=new ut({props:{setRoute:t[3],OPTIONS:wt,inGame:t[2]}}),{c(){j(n.$$.fragment)},m(t,o){U(n,t,o),e=!0},p(t,e){const o={};4&e&&(o.inGame=t[2]),n.$set(o)},i(t){e||(G(n.$$.fragment,t),e=!0)},o(t){A(n.$$.fragment,t),e=!1},d(t){B(n,t)}}}function ht(t){let n,e,o,c;const r=[mt,pt,ft],u=[];function s(t,n){return t[1]==gt?0:t[1]==wt?1:t[1]==$t?2:-1}return~(n=s(t))&&(e=u[n]=r[n](t)),{c(){e&&e.c(),o=f()},m(t,e){~n&&u[n].m(t,e),i(t,o,e),c=!0},p(t,[c]){let i=n;n=s(t),n===i?~n&&u[n].p(t,c):(e&&(M(),A(u[i],1,1,(()=>{u[i]=null})),E()),~n?(e=u[n],e?e.p(t,c):(e=u[n]=r[n](t),e.c()),G(e,1),e.m(o.parentNode,o)):e=null)},i(t){c||(G(e),c=!0)},o(t){A(e),c=!1},d(t){~n&&u[n].d(t),t&&l(o)}}}const wt="OPTIONS",gt="PLAY",$t="TUTORIAL";function bt(t,n,e){let o,c;console.log("Svelte menu is running");let r=!1;function u(t){console.log("Menu: setRoute",t),e(0,o=c),e(1,c=t),window.updateInGameMenuStatus()}return window.updateInGameMenuStatus=()=>{e(2,r=void 0!==window.underworld),console.log("jtest inGame",r,window.underworld,void 0!==window.underworld,null==window.underworld)},u(window.startMenu||o),window.setMenu=u,[o,c,r,u]}return new class extends V{constructor(t){super(),z(this,t,bt,ht,r,{})}}({target:document.getElementById("menu-inner")||document.body,props:{}})}();
//# sourceMappingURL=svelte-bundle.js.map

import{i as e}from"./jsx-runtime-DkCKj1Ep.js";import{t}from"./react-DgAe88G_.js";import{F as n,G as r,P as i}from"./logger.client-DZR3qCBE.js";import{t as a}from"./set-theme-BFrqm-0q.js";function o(){return r(`root`)?.hints??{theme:`light`}}function s(){return r(`root`)?.userPrefs??{locale:`en`,theme:`light`}}var c=e(t());function l(e){let t=document.createElement(`style`);t.appendChild(document.createTextNode(`* {
       -webkit-transition: none !important;
       -moz-transition: none !important;
       -o-transition: none !important;
       -ms-transition: none !important;
       transition: none !important;
    }`)),document.head.appendChild(t),e(),setTimeout(()=>{window.getComputedStyle(t).transition,document.head.removeChild(t)},100)}function u(){let e=i(),t=o(),{theme:n}=s(),r=d(),a=(0,c.useCallback)(t=>{l(()=>{let n=new FormData;n.append(`theme`,t),e.submit(n,{method:`POST`,action:`/api/set-theme`})})},[e]),u=n??t.theme;return r&&(u=r===`system`?t.theme:r),{theme:u,setTheme:a}}function d(){let e=n().find(e=>e.formAction===`/api/set-theme`);if(e?.formData){let t=e.formData.get(`theme`),n=a.safeParse({theme:t});if(n.success)return n.data.theme}}export{s as n,u as t};
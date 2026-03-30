import{i as e,t}from"./jsx-runtime-DkCKj1Ep.js";import{t as n}from"./react-DgAe88G_.js";import{a as r,c as i,d as a,f as o,l as s,o as c,p as l,s as u,u as d}from"./utils-D_DcI-uZ.js";import{A as f,J as ee,L as p,P as m,R as h,U as g,W as _,d as v,f as y,h as b,o as x,q as S,v as C,y as w}from"./logger.client-DZR3qCBE.js";import{n as te,t as T}from"./AudienceOnly-CFrsq1XC.js";import{t as E}from"./ErrorPage-BhVTvTUX.js";import"./AnalyticsLink-D9820-DU.js";import"./button-DhsYDq0R.js";import{t as D}from"./useTheme-CFQzDc6d.js";import"./set-theme-BFrqm-0q.js";var O=e(n());function k(e){function t(t,n){let r=e[n];if(!r)throw Error(`Unknown client hint: ${typeof n==`string`?n:`Unknown`}`);let i=t.split(`;`).map(e=>e.trim()).find(e=>e.startsWith(r.cookieName+`=`))?.split(`=`)[1];if(!i)return null;try{return decodeURIComponent(i)}catch(e){return console.warn(`Failed to decode cookie value for ${r.cookieName}:`,e),null}}function n(n){let r=typeof document<`u`?document.cookie:n===void 0?``:n.headers.get(`Cookie`)??``;return Object.entries(e).reduce((e,[n,i])=>{let a=n;return`transform`in i?e[a]=i.transform(t(r,a)??i.fallback):e[a]=t(r,a)??i.fallback,e},{})}function r(){return`
// This block of code allows us to check if the client hints have changed and
// force a reload of the page with updated hints if they have so you don't get
// a flash of incorrect content.
function checkClientHints() {
	if (!navigator.cookieEnabled) return;

	// set a short-lived cookie to make sure we can set cookies
	document.cookie = "canSetCookies=1; Max-Age=60; SameSite=Lax; path=/";
	const canSetCookies = document.cookie.includes("canSetCookies=1");
	document.cookie = "canSetCookies=; Max-Age=-1; path=/";
	if (!canSetCookies) return;

	const cookies = document.cookie.split(';').map(c => c.trim()).reduce((acc, cur) => {
		const [key, value] = cur.split('=');
		acc[key] = value;
		return acc;
	}, {});

	let cookieChanged = false;
	const hints = [
	${Object.values(e).map(e=>{let t=JSON.stringify(e.cookieName);return`{ name: ${t}, actual: String(${e.getValueCode}), value: cookies[${t}] != null ? cookies[${t}] : encodeURIComponent("${e.fallback}") }`}).join(`,
`)}
	];
	
	// Add safety check to prevent infinite refresh scenarios
	let reloadAttempts = parseInt(sessionStorage.getItem('clientHintReloadAttempts') || '0');
	if (reloadAttempts > 3) {
		console.warn('Too many client hint reload attempts, skipping reload to prevent infinite loop');
		return;
	}
	
	for (const hint of hints) {
		document.cookie = encodeURIComponent(hint.name) + '=' + encodeURIComponent(hint.actual) + '; Max-Age=31536000; SameSite=Lax; path=/';
		
		try {
			const decodedValue = decodeURIComponent(hint.value);
			if (decodedValue !== hint.actual) {
				cookieChanged = true;
			}
		} catch (error) {
			// Handle malformed URI gracefully
			console.warn('Failed to decode cookie value during client hint check:', error);
			// If we can't decode the value, assume it's different to be safe
			cookieChanged = true;
		}
	}
	
	if (cookieChanged) {
		// Increment reload attempts counter
		sessionStorage.setItem('clientHintReloadAttempts', String(reloadAttempts + 1));
		
		// Hide the page content immediately to prevent visual flicker
		const style = document.createElement('style');
		style.textContent = 'html { visibility: hidden !important; }';
		document.head.appendChild(style);

		// Trigger the reload
		window.location.reload();
	} else {
		// Reset reload attempts counter if no reload was needed
		sessionStorage.removeItem('clientHintReloadAttempts');
	}
}

checkClientHints();
`}return{getHints:n,getClientHintCheckScript:r}}const A={cookieName:`CH-prefers-color-scheme`,getValueCode:`window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`,fallback:`light`,transform(e){return e===`dark`?`dark`:`light`}};function j(e,t=A.cookieName){let n=window.matchMedia(`(prefers-color-scheme: dark)`);function r(){let r=n.matches?`dark`:`light`;document.cookie=`${t}=${r}; Max-Age=31536000; SameSite=Lax; Path=/`,e(r)}return n.addEventListener(`change`,r),function(){n.removeEventListener(`change`,r)}}var M=e(t()),N=k({theme:{...A,cookieName:`ibm_bob_ch_color_scheme`}});function P(){let{revalidate:e}=g();return(0,O.useEffect)(()=>j(()=>e(),`ibm_bob_ch_color_scheme`),[e]),(0,M.jsx)(`script`,{dangerouslySetInnerHTML:{__html:N.getClientHintCheckScript()}})}const{getHints:ne}=N;function F(e){let t=e.endsWith(`/`)&&e!==`/`?e.slice(0,-1):e;return t===``||t===`/`?`Product - Overview`:t===`/pricing`?`Product - Pricing`:t===`/docs`?`Product Documentation - Product Index`:t.startsWith(`/docs/`)?`Product Documentation - Article`:`Product - Overview`}function I({appName:e,profileName:t=`in-app-usage`,primaryCategory:n=`PC110`,cookiePreferencesAlwaysOn:r=!1,language:i,pathname:a}){let o=F(a);return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(`script`,{dangerouslySetInnerHTML:{__html:`
// Configure IBM Analytics before loading the script
window._ibmAnalytics = {
  settings: {
    name: '${e}',
    isSpa: true,
    tealiumProfileName: '${t}'
  },
  // Track first page view on load
  onLoad: [["ibmStats.pageview", []]],
  trustarc: {
    isCookiePreferencesButtonAlwaysOn: ${r},
    // Prevent TrustArc from auto-injecting cookie preferences link
    // We're handling it manually in the footer
    isCookiePreferencesInstalled: true
  }
};
`}}),(0,M.jsx)(`script`,{dangerouslySetInnerHTML:{__html:`
const getMeta = (name) => document.getElementsByName(name)[0]?.content || '';
const languageCode = getMeta('languageCode');
const countryCode = getMeta('countryCode');
const focusArea = getMeta('focusArea');
const primaryTopic = getMeta('primaryTopic');
const productName = getMeta('productName');

window.digitalData = {
  page: {
    category: { primaryCategory: '${n}' },
	services: {
	  google: { enabled: false },
      messaging: { enabled: false }
    },
    taxonomy: { primaryTopic, productName, pageType: '${o}' },
    pageInfo: {
      UT30: '30A06',
      pageID: 'IBM Bob',
      productTitle: 'IBM Bob',
      productCode: 'WW3066',
      productCodeType: 'WWPC',
      productId: '5900-BVU',
      analytics: { category: 'Bob Web' },
      language: '${i}',
      ibm: {
        pageID: 'IBM Bob',
        productTitle: 'IBM Bob',
        analytics: { category: 'Bob Web' },
        siteID: 'IBM_${e}',
        country: countryCode,
        messaging: {
          routing: { focusArea, languageCode, regionCode: countryCode },
          translation: { languageCode, regionCode: countryCode }
        },
        sections: 0,
        patterns: 0,
      },
    },
  },
};
`}}),(0,M.jsx)(`script`,{defer:!0,src:`//1.www.s81c.com/common/stats/ibm-common.js`,type:`text/javascript`})]})}function L(){return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(`script`,{defer:!0,src:`https://www.ibm.com/account/ibmidutil/widget/js/loader.js`}),(0,M.jsx)(`script`,{defer:!0,src:`https://www.ibm.com/account/ibmidutil/widget/js/main.js`})]})}function R({reportingKey:e}){return e?(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(`script`,{dangerouslySetInnerHTML:{__html:`
  (function(s,t,a,n){s[t]||(s[t]=a,n=s[a]=function(){n.q.push(arguments)},
  n.q=[],n.v=2,n.l=1*new Date)})(window,"InstanaEumObject","ineum");

  ineum('reportingUrl', 'https://eum-red-saas.instana.io');
  ineum('key', '${e}');
  ineum('trackSessions');
  ineum('autoPageDetection', { titleAsPageName: true });
`}}),(0,M.jsx)(`script`,{defer:!0,crossOrigin:`anonymous`,src:`https://eum.instana.io/1.8.1/eum.min.js`,integrity:`sha384-qFzHZ5BC7HOPEBSYkbYSv+DBWrG34P1QW9mIaCR41db6yOJNYmH4antW6KLkc6v1`})]}):null}function z(){return(0,M.jsx)(`script`,{src:`https://1.www.s81c.com/common/carbon/plex/load-non-latin-plex.js`})}function B(){return(0,M.jsx)(`script`,{type:`application/ld+json`,dangerouslySetInnerHTML:{__html:JSON.stringify({"@context":`https://schema.org`,"@type":`SoftwareApplication`,name:`IBM Bob`,description:`IBM Bob is an AI SDLC (Software Development Lifecycle) partner.`,applicationCategory:`DeveloperApplication`,offers:{"@type":`Offer`,availability:`https://schema.org/InStock`},publisher:{"@type":`Organization`,name:`IBM`}})}})}function re(e,t){if(e==null)return{};var n,r,i=V(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)===-1&&{}.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}function V(e,t){if(e==null)return{};var n={};for(var r in e)if({}.hasOwnProperty.call(e,r)){if(t.indexOf(r)!==-1)continue;n[r]=e[r]}return n}var H=[`crossOrigin`,`integrity`];function U(e,t){var n=document.createElement(`script`);return Object.keys(e||{}).forEach(function(t){n.setAttribute(t,e[t])}),Object.keys(t).forEach(function(e){n[e]=t[e]}),n}function W(e){var t=document.getElementsByTagName(`script`)[0];t&&t.parentNode?t.parentNode.insertBefore(e,t):document.head.appendChild(e)}function G(e,t){var n={src:e,type:`text/javascript`};return t&&typeof t==`function`&&(n.onreadystatechange=t,n.onload=t),n}function K(){return window.navigator.userAgent}function q(e,t,n){typeof t==`function`&&(n=t,t={});var r=G(e,n),i=U(t,r);i.async=!1,W(i)}function J(e,t,n){if(typeof t==`function`&&(n=t,t={}),K().indexOf(`PhantomJS`)!==-1){q(e,t,n);return}var r=t||{},i=r.crossOrigin,a=r.integrity,o=re(r,H),s=G(e,n);a&&(s.integrity=a),i&&(s.crossOrigin=i);var c=U(o,s);c.async=!0,W(c)}var Y=(function(e,t){var n=window,r=n[e];(!r||!r.push)&&(r=[],n[e]=r),r.methods=t,r.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);return t.unshift(e),r.push(t),r}};for(var i=0;i<r.methods.length;i++){var a=r.methods[i];r[a]||(r[a]=r.factory(a))}return r}),X=(function(e,t){var n=window;n.document.readyState===`complete`?e():function(e){var r,i=n.setTimeout(function(){n.removeEventListener(`load`,r),e()},t);r=function(){n.clearTimeout(i),e()},n.addEventListener(`load`,r)}(e)}),Z={segment:1};function ie(){var e=window;if(e.document.cookie!==``){var t=e.document.cookie.replace(/(?:(?:^|.*;\s*)notice_preferences\s*=\s*([^;]*).*$)|^.*$/,`$1`);return t.length?parseInt(t[0],10):null}return null}function ae(e,t){return Z[t]<=e}var oe=(function(e,t){var n=window;e||={};var r=e.analyticsScriptURL?e.analyticsScriptURL:`https://cloud.ibm.com/analytics/build/bluemix-analytics.min.js`,i=e.analyticsScriptIntegrity,a=e.analyticsScriptOrigin,o=e.segmentHostName?e.segmentHostName:`cdn.segment.com/analytics.js/v1`,s=e.segmentApiHostName,c=e.segment_key?e.segment_key:!1,l=e.coremetrics?e.coremetrics:!1,u=e.maximumAnalyticsLoadDelayMs?e.maximumAnalyticsLoadDelayMs:5e3,d=Y(`bluemixAnalytics`,[`compliantLoadingOfThirdParty`,`getCampaigns`,`getUserProfile`,`identify`,`onPageContextSet`,`pageEvent`,`trackEvent`,`trackUserFormAction`,`registerPageLoadCondition`]),f=ie();n.bluemixAnalytics=d,n._analytics=n._analytics||{},n._analytics.segmentHostName=o,c&&(n._analytics.segment_key=c),s&&(n._analytics.segmentApiHostName=s),X(function(){c&&ae(f,`segment`)&&J(`https://${o}/${c}/analytics.min.js`,{id:`loadedViaBxAnalytics-${c}`}),l&&J(`https://1.www.s81c.com/common/stats/ibm-common.js`),J(r,{integrity:i,crossOrigin:a},t)},u)});function se({segmentKey:e}){let t=o(`segment-analytics`,{segmentKey:e}),n=(0,O.useRef)(!1);return(0,O.useEffect)(()=>{if(n.current)return;if(!e){t.warn(`Segment key not provided`);return}let r=()=>{t.debug(`Initializing Segment...`);try{localStorage.setItem(`autoPageView`,`false`),t.debug(`Set autoPageView=false in localStorage`)}catch(e){t.warn({err:e},`Failed to set localStorage`)}window._analytics={...window._analytics,segment_key:e,autoPageView:!1},oe({analyticsScriptURL:`${window.location.origin}/analytics/build/bluemix-analytics.min.js`,segment_key:e,segmentHostName:`cdn.segment.com/analytics.js/v1`,segmentApiHostName:`api.segment.io/v1`}),n.current=!0,t.debug(`Segment initialized successfully`)};return i(u.FUNCTIONAL)?(t.debug(`User has consented to functional. Loading Segment.`),r()):d()?(t.debug(`Express consent required. Waiting for user consent.`),a(u.FUNCTIONAL,r)):t.debug(`User has not consented to functional. Segment will not load.`),s(()=>{t.debug({context:{segmentKey:e,isInitialized:n.current}},`Consent changed - checking Segment analytics status`);let a=i(u.FUNCTIONAL);a&&!n.current?(t.debug(`User granted FUNCTIONAL consent. Initializing Segment now.`),r()):!a&&n.current&&t.debug(`User revoked FUNCTIONAL consent. Tracking disabled.`)})},[e,t]),null}function Q(){return[{rel:`preconnect`,href:`https://1.www.s81c.com`},{rel:`preconnect`,href:`https://1.www.s81c.com`,crossOrigin:`anonymous`},{rel:`stylesheet`,href:`https://1.www.s81c.com/common/carbon/plex/sans.css`},{rel:`stylesheet`,href:`https://1.www.s81c.com/common/carbon/plex/mono.css`},{rel:`icon`,href:`/favicon.ico`,sizes:`32x32`},{rel:`icon`,href:`/favicon.ico`,sizes:`32x32`,media:`(prefers-color-scheme: light)`},{rel:`icon`,href:`/favicon-dark.ico`,sizes:`32x32`,media:`(prefers-color-scheme: dark)`},{rel:`icon`,href:`/icon.svg`,type:`image/svg+xml`},{rel:`icon`,href:`/icon.svg`,type:`image/svg+xml`,media:`(prefers-color-scheme: light)`},{rel:`icon`,href:`/icon-dark.svg`,type:`image/svg+xml`,media:`(prefers-color-scheme: dark)`},{rel:`apple-touch-icon`,href:`/apple-touch-icon.png`}]}function $({env:e,lang:t,dir:n,theme:r,pathname:i,children:a}){return(0,M.jsxs)(`html`,{lang:t,dir:n,className:r,children:[(0,M.jsxs)(`head`,{children:[(0,M.jsx)(P,{}),(0,M.jsx)(`meta`,{charSet:`utf-8`}),(0,M.jsx)(`meta`,{name:`viewport`,content:`width=device-width, initial-scale=1`}),(0,M.jsx)(y,{}),(0,M.jsx)(v,{}),(0,M.jsxs)(T,{audience:`public`,children:[(0,M.jsx)(B,{}),(0,M.jsx)(I,{appName:`BobWeb`,profileName:`in-app-usage`,primaryCategory:`PC110`,language:t,pathname:i}),(0,M.jsx)(R,{reportingKey:e?.INSTANA_KEY})]})]}),(0,M.jsxs)(`body`,{children:[(0,M.jsx)(`noscript`,{children:`You need to enable JavaScript to run this app.`}),a,(0,M.jsx)(w,{}),(0,M.jsx)(C,{}),(0,M.jsx)(z,{}),(0,M.jsxs)(T,{audience:`public`,children:[(0,M.jsx)(L,{}),(0,M.jsx)(se,{segmentKey:e?.SEGMENT_KEY})]})]})]})}function ce(){let e=p(),t=e?.env,n=e?.userPrefs??{locale:`en`,theme:`light`},{theme:i}=D(),{i18n:a}=l(),o=h(),s=m({key:`user`});return(0,O.useEffect)(()=>{if(s.state===`idle`&&!s.data&&s.load(`/api/auth/status`),s.data?.authenticated&&s.data?.userProfile){let e=s.data.userProfile;c(e.user_id,{instanceCount:e.instances.length})}},[s]),(0,O.useEffect)(()=>{n?.locale&&a.language!==n.locale&&a.changeLanguage(n.locale)},[n?.locale,a,a.language]),r(),(0,M.jsx)($,{env:t,dir:a.dir(a.language),lang:a.language,theme:i,pathname:o.pathname,children:(0,M.jsx)(b,{})})}function le(){let e=p(),t=e?.env,n=e?.userPrefs??{locale:`en`,theme:`light`},{theme:r}=D(),{i18n:i}=l(),a=h();return(0,O.useEffect)(()=>{n?.locale&&i.language!==n.locale&&i.changeLanguage(n.locale)},[n?.locale,i,i.language]),(0,M.jsx)($,{env:t,dir:i.dir(i.language),lang:i.language,theme:r,pathname:a.pathname,children:(0,M.jsx)(b,{})})}var ue=S(te()===`public`?ce:le);const de=ee(function(){let e=_(),t=x.serverError,n=``;f(e)&&(n=e.statusText||``);let r=n?`${t.description} (${n})`:t.description;return(0,M.jsx)($,{lang:`en`,dir:`ltr`,theme:`light`,pathname:`/`,env:{BOB_BASE_URL:`https://bob.ibm.com`,DEPLOYMENT_ENV:`production`,INSTANA_KEY:``,SEGMENT_KEY:``},children:(0,M.jsx)(E,{title:t.title,description:r,navigateText:t.returnHome,stack:void 0})})});export{de as ErrorBoundary,ue as default,Q as links};
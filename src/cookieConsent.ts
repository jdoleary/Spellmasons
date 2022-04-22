export default function cookieConsentPopup(forcePopup: boolean) {
    // If user has already allowed cookies, don't show the popup
    if (!forcePopup && localStorage.getItem('cookieConsent') === 'allowed') {
        window.allowCookies = true;
        console.log('Setup: Cookie consent:', window.allowCookies);
        return
    }
    const el = document.createElement('div')
    document.body.appendChild(el);
    el.innerHTML = `
<div id="cookie-consent" style="border:1px solid black; padding:4px; position:fixed;left:0;right:0;bottom:0;background-color:white;z-index:1;">
	<p>
	This website uses cookies, localStorage, and sessionStorage to save relevant information for playing Spellmasons such as your clientID (used to distinguish you from other online players), and the game state (which represents the information needed to play the game).
	</p>
	<div>
        <button id="cookie-consent-allow" type="button">
            Allow
        </button>
        <button id="cookie-consent-deny" type="button">
            Deny
        </button>
	</div>
</div>
`;
    const elAllow = document.getElementById('cookie-consent-allow');
    elAllow?.addEventListener('click', allow);
    const elDeny = document.getElementById('cookie-consent-deny');
    elDeny?.addEventListener('click', deny);
}
function allow() {
    window.allowCookies = true;
    document.getElementById('cookie-consent')?.remove();
    localStorage.setItem('cookieConsent', 'allowed');
}
function deny() {
    window.allowCookies = false;
    localStorage.clear();
    document.getElementById('cookie-consent')?.remove();
}
window.cookieConsentPopup = cookieConsentPopup;
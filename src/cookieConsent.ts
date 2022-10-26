export default function cookieConsentPopup(forcePopup: boolean) {
    // If user has already allowed cookies, don't show the popup
    if (!forcePopup && localStorage.getItem('cookieConsent') === 'allowed') {
        globalThis.allowCookies = true;
        console.log('Setup: Cookie consent:', globalThis.allowCookies);
        return
    }
    const el = document.createElement('div')
    document.body?.appendChild(el);
    el.innerHTML = `
<div id="cookie-consent">
    <div id="cookie-consent-inner">
        <p>
        Spellmasons uses cookies and localStorage to save your game progress, hide the tutorial if you've already completed it, and to store other game-related data.
        </p>
        <p>
        Please allow cookies for the best user experience.
        </P>
        <div>
            <button id="cookie-consent-allow" type="button" style="width:100px;">
                Allow
            </button>
            <button id="cookie-consent-deny" type="button">
                Deny
            </button>
        </div>
    </div>
</div>
`;
    const elAllow = document.getElementById('cookie-consent-allow');
    elAllow?.addEventListener('click', allow);
    const elDeny = document.getElementById('cookie-consent-deny');
    elDeny?.addEventListener('click', deny);
}
function allow() {
    globalThis.allowCookies = true;
    document.getElementById('cookie-consent')?.remove();
    localStorage.setItem('cookieConsent', 'allowed');
}
function deny() {
    globalThis.allowCookies = false;
    localStorage.clear();
    document.getElementById('cookie-consent')?.remove();

}
globalThis.cookieConsentPopup = cookieConsentPopup;
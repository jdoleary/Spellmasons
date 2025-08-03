import * as storage from './storage';
const PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_KEY = 'privacy_policy_and_eula_consent_august_2025';
const PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_VALUE = 'accepted';
export function areCookiesAllowed() {
    return localStorage.getItem(PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_KEY) === PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_VALUE;
}
globalThis.showLegalPopup = cookieConsentPopup;
export default function cookieConsentPopup(forcePopup: boolean) {
    // If user has already allowed cookies, don't show the popup
    if (!forcePopup && localStorage.getItem(PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_KEY) === PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_VALUE) {
        globalThis.privacyPolicyAndEULAConsent = areCookiesAllowed();
        console.log('Setup: Cookie consent:', globalThis.privacyPolicyAndEULAConsent);
        return
    }
    const privacyPolicyEl = document.getElementById('privacy-policy-popup');
    if (privacyPolicyEl) {
        privacyPolicyEl.classList.toggle('show', true);
    } else {
        console.error('Unexpected: could not find privacy policy popup');
    }
    const elAllow = document.getElementById('cookie-consent-allow');
    elAllow?.addEventListener('click', allow);
    const elDeny = document.getElementById('cookie-consent-deny');
    elDeny?.addEventListener('click', deny);
}
function allow() {
    globalThis.privacyPolicyAndEULAConsent = true;
    if (globalThis.pie) {
        storage.set(storage.STORAGE_PIE_CLIENTID_KEY, globalThis.pie.clientId);
    }
    const privacyPolicyEl = document.getElementById('privacy-policy-popup');
    if (privacyPolicyEl) {
        privacyPolicyEl.classList.toggle('show', false);
    } else {
        console.error('Unexpected: could not find privacy policy popup');
    }
    localStorage.setItem(PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_KEY, PRIVACY_POLICY_AND_EULA_CONSENT_STORAGE_VALUE);
}
globalThis.acceptPrivacyPolicyAndEULA = allow;
function deny() {
    globalThis.privacyPolicyAndEULAConsent = false;
    localStorage.clear();
    document.getElementById('cookie-consent')?.remove();

}
globalThis.cookieConsentPopup = cookieConsentPopup;
import languages from '../public/localization/localization.json';
let languageObject: { [key: string]: string };
function i18n(key: string): string {
    if (languageObject) {
        const result = languageObject[key];
        if (result) {
            return result;
        } else {
            // If something hasn't been localized yet, report it with console.error and return the key so
            // the string isn't totally empty as the key might just be an english string for now
            console.error(`i18n: Language ${languageObject.Language} has no value for key ${key}`);
            return key;
        }
    } else {
        console.error('i18n: languageObject has not been set.');
    }
    return key;
}
function setLanguage(langCode: string) {
    const newLanguage = languages.find(l => l.LanguageCode == langCode);
    if (newLanguage) {
        languageObject = newLanguage;
        console.log('i18n: Set language to', newLanguage.Language);
    } else {
        console.error('i18n: Could not find language with code', langCode)
    }
}
// Default to english
setLanguage('en');
// Make localization functions available to Svelte menu
globalThis.i18n = i18n;
globalThis.setLanguage = setLanguage;
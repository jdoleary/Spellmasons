import languages from '../public/localization/localization.json';
let languageObject: { [key: string]: string };
function i18n(key: string): string {
    const errorResult = '----';
    if (languageObject) {
        const result = languageObject[key];
        if (result) {
            return result;
        } else {
            console.error(`Language ${languageObject.Language} has no value for key ${key}`);
        }
    } else {
        console.error('languageObject has not been set.');
    }
    return errorResult;
}
function setLanguage(langCode: string) {
    const newLanguage = languages.find(l => l.LanguageCode == langCode);
    if (newLanguage) {
        languageObject = newLanguage;
        console.log('Set language to', newLanguage.Language);
    } else {
        console.error('Could not find language with code', langCode)
    }
}
// Default to english
setLanguage('en');
export default function setup() {
    globalThis.i18n = i18n;
    globalThis.setLanguage = setLanguage;
    console.log('languages', languages);

}
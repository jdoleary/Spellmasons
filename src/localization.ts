import languages from '../public/localization/localization.json';
import { elEndTurnBtnInner, elLocalizeGameOver, elLocalizeQuitToMainMenu } from './HTMLElements';
import * as storage from './storage';
interface LanguageMapping {
    [key: string]: string
}
let languageMapping: { [key: string]: string };
let chosenLanguageCode: string;
const cachedErrorsReported: string[] = [];
const STORAGE_LANGUAGE_CODE_KEY = 'language';
function returnTranslation(key: string, map: LanguageMapping): string {
    const result = map[key.toLowerCase()];
    if (result) {
        return result;
    } else {
        // Prevent reporting error more than once
        if (!cachedErrorsReported.includes(key)) {
            // If something hasn't been localized yet, report it with console.error and return the key so
            // the string isn't totally empty as the key might just be an english string for now
            console.error(`i18n: Language ${map.language} has no value for key ${key}`);
            cachedErrorsReported.push(key);
        }
        return key;
    }
}
function getTranslation(key: string, languageCode: string) {
    const language = languages.find(l => l.languagecode == languageCode);
    if (language) {
        return returnTranslation(key, language);
    } else {
        console.error('i18n: Could not find language with code', languageCode)
    }
    return key;

}
function i18n(key: string): string {
    if (languageMapping) {
        return returnTranslation(key, languageMapping);
    } else {
        console.error('i18n: languageObject has not been set.');
    }
    return key;
}
function setLanguage(langCode: string, store: boolean) {
    const newLanguage = languages.find(l => l.languagecode == langCode);
    if (newLanguage) {
        languageMapping = newLanguage;
        chosenLanguageCode = langCode;
        if (store) {
            storage.set(STORAGE_LANGUAGE_CODE_KEY, langCode);
        }
        // Manually update html as needed:
        if (elEndTurnBtnInner) {
            elEndTurnBtnInner.innerText = i18n('end turn');
        }
        if (elLocalizeGameOver) {
            elLocalizeGameOver.innerText = i18n('game over');
        }
        if (elLocalizeQuitToMainMenu) {
            elLocalizeQuitToMainMenu.innerText = i18n('quit to main menu');
        }

        console.log('i18n: Set language to', newLanguage.language);
    } else {
        console.error('i18n: Could not find language with code', langCode)
    }
}
function getSupportedLanguages() {
    return languageMapping ? languages.map(l => ({ language: l.language, code: l.languagecode })) : [];
}
function getChosenLanguageCode() {
    return chosenLanguageCode;
}
// Default to english
const storedLanguageCode = storage.get(STORAGE_LANGUAGE_CODE_KEY);
setLanguage(storedLanguageCode ? storedLanguageCode : 'en', false);
// Make localization functions available to Svelte menu
globalThis.i18n = i18n;
globalThis.setLanguage = setLanguage;
globalThis.getSupportedLanguages = getSupportedLanguages;
globalThis.getChosenLanguageCode = getChosenLanguageCode;
globalThis.getTranslation = getTranslation;
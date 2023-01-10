import * as Sentry from "@sentry/browser";
import languages from '../public/localization/localization.json';
import * as storage from './storage';

/*
Note: HTML that needs to be localized simply needs a data-localize-text attribute like so:
          `<div data-localize-text="Quit to Main Menu"></div>`
Now, it will automatically be localized when setLanguage is called.
*/
export interface LanguageMapping {
    [key: string]: string
}
let languageMapping: { [key: string]: string };
let chosenLanguageCode: string;
const cachedErrorsReported: string[] = [];
function returnTranslation(keyOrArray: Localizable, map: LanguageMapping): string {
    const [key = '', ...replacers] = typeof keyOrArray === 'object' ? keyOrArray : [keyOrArray];
    let result = map[key.toLowerCase()];
    if (result) {
        for (let replacer of replacers) {
            result = result.replace('🍞', replacer);
        }
        result = result.replaceAll('❕', '\n');
        // Replace any left over replacers with empty
        result = result.replaceAll('🍞', '');
        if (result == 'Loading...') {
            console.error(`i18n: Key ${key} returned "Loading..." for language ${map.language}`);
            return key;
        }
        return result;
    } else {
        // Prevent reporting error more than once
        if (!cachedErrorsReported.includes(key)) {
            // If something hasn't been localized yet, report it with console.error and return the key so
            // the string isn't totally empty as the key might just be an english string for now
            Sentry.withScope(function (scope) {
                scope.setLevel(Sentry.Severity.Warning);
                // The exception has the event level set by the scope (info).
                Sentry.captureException(new Error(`i18n: Language ${map.language} has no value for key ${keyOrArray}`));
            });
            cachedErrorsReported.push(key);
        }
        return key;
    }
}
// If keyOrArray is an array the first element is the key and the following elements
// replace each instance of '🍞' in a printf fashion
function i18n(keyOrArray: Localizable): string {
    if (languageMapping) {
        return returnTranslation(keyOrArray, languageMapping);
    } else {
        console.error('i18n: languageObject has not been set.');
    }
    return typeof keyOrArray === 'object' ? (keyOrArray[0] || '') : keyOrArray;
}
function setLanguage(langCode: string, store: boolean) {
    const newLanguage = languages.find(l => l.languagecode == langCode);
    if (newLanguage) {
        languageMapping = newLanguage;
        chosenLanguageCode = langCode;
        if (store) {
            storage.set(storage.STORAGE_LANGUAGE_CODE_KEY, langCode);
        }
        // Automatically translate elements with the data-localize-text attribute
        for (let el of Array.from<HTMLElement>(document.querySelectorAll('[data-localize-text]'))) {
            if (el) {
                const text = el.dataset.localizeText;
                if (text) {
                    el.innerHTML = i18n(text);
                }
            }
        }

        console.log('i18n: Set language to', newLanguage.language);
    } else {
        console.error('i18n: Could not find language with code', langCode)
    }
    // Force the menu to rerender now that the language has changed
    if (globalThis.refreshMenu) {
        globalThis.refreshMenu();
    }
}
function getSupportedLanguages() {
    return languageMapping ? languages.map(l => ({ language: l.language, code: l.languagecode })) : [];
}
function getChosenLanguageCode() {
    return chosenLanguageCode;
}
// Default to english
setLanguage('en', false);
// Make localization functions available to Svelte menu
globalThis.i18n = i18n;
globalThis.setLanguage = setLanguage;
globalThis.getSupportedLanguages = getSupportedLanguages;
globalThis.getChosenLanguageCode = getChosenLanguageCode;

export type Localizable = string | string[];
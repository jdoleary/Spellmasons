export interface PromptArgs {
    text: string;
    noBtnText?: string;
    noBtnKey?: string;
    yesText: string;
    yesKey?: string;
    yesKeyText?: string;
    imageSrc?: string;
    // Render inside
    portal?: HTMLElement;
    // forceShow will override the css that prevents the jprompt from rendering in the menu view
    forceShow?: boolean;
}
export default async function Jprompt(prompt: PromptArgs): Promise<boolean> {
    const { text, noBtnText, noBtnKey, yesText, yesKey, yesKeyText = '', imageSrc, portal, forceShow } = prompt;
    if (globalThis.headless) {
        return Promise.resolve(true);
    }
    const el = document.createElement('div')
    el.classList.add('prompt');
    if (forceShow) {
        el.classList.add('forceShow');
    }
    if (portal) {
        el.classList.add('in-portal');
    }
    el.innerHTML = `
<div class="ui-border">
<div class="prompt-inner ${!imageSrc ? 'thin' : ''}">
    <div class="prompt-content">
        ${imageSrc ? `<img src="${imageSrc}"/>` : ''}
        <div class="text">
            ${globalThis.i18n(text)}
        </div>
    </div>
    <div class="button-holder">
        ${noBtnText ? `<button class="no button-wrapper" data-key="${noBtnKey}"> 
            <div class="button-inner">
                ${globalThis.i18n(noBtnText)}
                <div class="hotkey-badge-holder">
                    <kbd class="hotkey-badge">${noBtnKey}</kbd>
                </div>
            </div>
        </button>` : ''}
        <button class="yes button-wrapper" ${yesKey ? `data-key="${yesKey}"` : ''}>
            <div class="button-inner">
                ${globalThis.i18n(yesText)}
                <div class="hotkey-badge-holder">
                    <kbd class="hotkey-badge">${yesKeyText}</kbd>
                </div>
            </div>
        </button>
    </div>
</div>
</div>
`;
    if (portal) {
        portal.appendChild(el);
    } else {
        document.body?.appendChild(el);
    }

    return new Promise<boolean>((res) => {
        const noBtn = el.querySelector('.no') as (HTMLElement | undefined);
        const yesBtn = el.querySelector('.yes') as (HTMLElement | undefined);
        if (noBtn) {
            noBtn.addEventListener('click', (e) => {
                res(false);
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }
        if (yesBtn) {
            yesBtn.addEventListener('click', (e) => {
                res(true);
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
        }
    }).then((result) => {
        el.remove();
        return result;
    });
}

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
}
export default async function Jprompt(prompt: PromptArgs): Promise<boolean> {
    const { text, noBtnText, noBtnKey, yesText, yesKey, yesKeyText = '', imageSrc, portal } = prompt;
    if (globalThis.headless) {
        return Promise.resolve(true);
    }
    const el = document.createElement('div')
    el.classList.add('prompt');
    if (portal) {
        el.classList.add('in-portal');
    }
    el.innerHTML = `
<div class="ui-border">
<div class="prompt-inner ${!imageSrc ? 'thin' : ''}">
    <div class="prompt-content">
        ${imageSrc ? `<img src="${imageSrc}"/>` : ''}
        <div class="text">
            ${text}
        </div>
    </div>
    <div class="button-holder">
        ${noBtnText ? `<button class="no jbutton" data-key="${noBtnKey}"> ${noBtnText}
            <div class="hotkey-badge-holder">
                <kbd class="hotkey-badge">${noBtnKey}</kbd>
            </div>
        </button>` : ''}
        <button class="yes jbutton" ${yesKey ? `data-key="${yesKey}"` : ''}>${yesText}
            <div class="hotkey-badge-holder">
                <kbd class="hotkey-badge">${yesKeyText}</kbd>
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

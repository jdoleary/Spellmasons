import * as storage from '../storage';
interface Prompt {
    text: string;
    noBtnText?: string;
    noBtnKey?: string;
    yesText: string;
    yesKey?: string;
    yesKeyText?: string;
    imageSrc?: string;
}
export default async function Jprompt(prompt: Prompt): Promise<boolean> {
    const { text, noBtnText, noBtnKey, yesText, yesKey, yesKeyText = '', imageSrc } = prompt;
    const el = document.createElement('div')
    el.classList.add('prompt');
    el.innerHTML = `
<div class="ui-border">
<div class="prompt-inner">
    ${imageSrc ? `<div class="text-center"><img src="${imageSrc}"/></div>` : ''}
    <p class="text">
        ${text}
    </p>
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
    document.body?.appendChild(el);

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
        document.body?.removeChild(el);
        return result;
    });
}

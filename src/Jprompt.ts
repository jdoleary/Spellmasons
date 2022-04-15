interface Prompt {
    text: string;
    noBtnText?: string;
    noBtnKey?: string;
    yesText: string;
    yesKey: string;
    yesKeyText: string;
}
export default async function Jprompt(prompt: Prompt): Promise<boolean> {
    const { text, noBtnText, noBtnKey, yesText, yesKey, yesKeyText } = prompt;
    const el = document.createElement('div')
    el.classList.add('prompt');
    el.innerHTML = `
<div class="prompt-inner">
    <div class="text">
        ${text}
    </div>
    <div class="button-holder">
        ${noBtnText ? `<button class="no jbutton" data-key="${noBtnKey}">${noBtnText}</button>` : ''}
        <button class="yes jbutton" data-key="${yesKey}">${yesText}
            <div class="hotkey-badge-holder">
                <div class="hotkey-badge wide">${yesKeyText}</div>
            </div>
        </button>
    </div>
</div>
`;
    document.body.appendChild(el);

    return new Promise<boolean>((res) => {
        const noBtn = el.querySelector('.no') as HTMLElement;
        if (noBtn) {
            noBtn.addEventListener('click', () => {
                res(false);
            });
            // Click outside is the same as no
            const cancelFn = (e: MouseEvent) => {
                // Ignore clicks on the prompt inner
                if (!(e.target && (e.target as Element).closest('.prompt-inner'))) {
                    // Handle clicks outside the prompt the same as if the user clicked the no/cancel button
                    noBtn.click();
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
            el.addEventListener('click', cancelFn);
            el.addEventListener('contextmenu', cancelFn);
        }
        const yesBtn = el.querySelector('.yes')
        if (yesBtn) {
            yesBtn.addEventListener('click', () => {
                res(true);
            });
        }
    }).then((result) => {
        document.body.removeChild(el);
        return result;
    });
}
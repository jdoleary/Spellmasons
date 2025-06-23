
export function showToast(message: string, { duration = 7000 } = {}) {
    const container = document.getElementById('toast-container') as HTMLElement;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = ` ${message} `;

    container.appendChild(toast);
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}


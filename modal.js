// ─── Modal backdrop ───────────────────────────────────────────────────────────

const backdrop = document.getElementById("modal-backdrop");
let backdropHideTimer = null;

export function showBackdrop() {
    clearTimeout(backdropHideTimer);
    backdrop.classList.add("active");
}

export function hideBackdrop() {
    backdropHideTimer = setTimeout(() => {
        if (!document.querySelector(".modal-active")) {
            backdrop.classList.remove("active");
        }
    }, 300);
}

export function removeAddModal(modal) {
    modal.classList.remove("modal-active");
    modal.classList.add("modal-disabled");
    hideBackdrop();
    setTimeout(() => modal.remove(), 300);
}

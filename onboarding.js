import { t, applyTranslations } from "./i18n.js";
import { showBackdrop, removeAddModal } from "./modal.js";

export function maybeShowOnboarding() {
    if (localStorage.getItem("onboardingDismissed")) return;
    if (sessionStorage.getItem("onboardingShown")) return;
    sessionStorage.setItem("onboardingShown", "1");
    openOnboardingModal();
}

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Brave") || navigator.brave) return "brave";
    if (ua.includes("Edg/"))  return "edge";
    if (ua.includes("Firefox")) return "firefox";
    return "chrome";
}

function openOnboardingModal() {
    const modal = document.querySelector('[data-template="onboarding-modal"]')
                          .content.firstElementChild.cloneNode(true);
    document.body.appendChild(modal);
    applyTranslations(modal);
    showBackdrop();
    setTimeout(() => modal.classList.add("modal-active"), 10);

    let activeBrowser = detectBrowser();

    const instructionKeys = {
        chrome:  "onboard_chrome_hp",
        firefox: "onboard_firefox_hp",
        edge:    "onboard_edge_hp",
        brave:   "onboard_brave_hp",
    };

    const instructionEl = modal.querySelector(".onboarding-instruction");

    function updateInstruction() {
        const steps = t(instructionKeys[activeBrowser]).split("|");
        instructionEl.innerHTML = "";
        steps.forEach((step, i) => {
            const row = document.createElement("div");
            row.className = "onboard-step";
            const num = document.createElement("span");
            num.className = "onboard-step-num";
            num.textContent = i + 1;
            const text = document.createElement("span");
            text.textContent = step.trim();
            row.appendChild(num);
            row.appendChild(text);
            instructionEl.appendChild(row);
        });
    }

    function setActiveBrowser(browser) {
        activeBrowser = browser;
        modal.querySelectorAll(".onboard-browser-btn").forEach(b => {
            b.classList.toggle("active", b.dataset.browser === browser);
        });
        updateInstruction();
    }

    modal.querySelectorAll(".onboard-browser-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            setActiveBrowser(btn.dataset.browser);
        });
    });

    setActiveBrowser(activeBrowser);

    modal.querySelector(".onboard-remind-btn").addEventListener("click", e => {
        e.stopPropagation();
        removeAddModal(modal);
        window.removeEventListener("click", outsideOnboardClick);
    });

    modal.querySelector(".onboard-dismiss-btn").addEventListener("click", e => {
        e.stopPropagation();
        localStorage.setItem("onboardingDismissed", "1");
        removeAddModal(modal);
    });

    setTimeout(() => window.addEventListener("click", outsideOnboardClick), 0);
    function outsideOnboardClick(e) {
        if (modal.contains(e.target)) return;
        removeAddModal(modal);
        window.removeEventListener("click", outsideOnboardClick);
    }
}

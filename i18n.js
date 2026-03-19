import { t, translations, detectLanguage, getLang, setLang } from "./translations.js";

export { t, applyTranslations, animateLangChange, buildLanguageList, initLanguageToggle };

function animateLangChange(el) {
    el.classList.remove("lang-change");
    void el.offsetWidth;
    el.classList.add("lang-change");
    el.addEventListener("animationend", () => el.classList.remove("lang-change"), { once: true });
}

function applyTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    root.querySelectorAll("[data-i18n-title]").forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}

function buildLanguageList() {
    const list = document.getElementById("language-list");
    if (!list) return;
    list.innerHTML = "";
    const current = getLang() ?? detectLanguage();

    Object.entries(translations).forEach(([key, lang]) => {
        const row = document.createElement("div");
        row.className = "search-engine" + (key === current ? " selected" : "");
        row.textContent = lang.name;
        row.addEventListener("click", (e) => {
            e.stopPropagation();
            if (key === current) return;

            setLang(key);
            applyTranslations();
            buildLanguageList();

            [document.querySelector(".welcome"), document.querySelector(".time")]
                .filter(Boolean)
                .forEach(el => animateLangChange(el));

            const list    = document.getElementById("language-list");
            const chevron = document.getElementById("language-chevron");
            list?.classList.remove("bg-library-visible");
            if (chevron) chevron.style.transform = "rotate(0deg)";
        });
        list.appendChild(row);
    });
}

function initLanguageToggle() {
    const header  = document.getElementById("language-header");
    const list    = document.getElementById("language-list");
    const chevron = document.getElementById("language-chevron");
    if (!header || !list || !chevron) return;

    header.addEventListener("click", () => {
        const open = list.classList.toggle("bg-library-visible");
        chevron.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
        if (open) buildLanguageList();
    });
}

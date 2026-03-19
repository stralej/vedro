import { fList } from "./data.js";
import { getLang, setLang, detectLanguage } from "./translations.js";
import { applyTranslations } from "./i18n.js";
import { initClock } from "./clock.js";
import { fetchWeather } from "./weather.js";
import { initSearch } from "./search.js";
import { fillFavorites, initAddNewFavorite } from "./favorites.js";
import { makeStorage, checkCheckBoxStatus, initSettings, initSettingsPanel, renderSecretText } from "./settings.js";
import { initWallpaper } from "./wallpaper.js";
import { maybeShowOnboarding } from "./onboarding.js";

// ─── Apply panel blur immediately to avoid flash ──────────────────────────────

(function() {
    const blur = localStorage.getItem("panelBlur") ?? "10";
    document.documentElement.style.setProperty("--panel-blur", blur + "px");
})();

// ─── Init language ────────────────────────────────────────────────────────────

if (!getLang()) setLang(detectLanguage());
applyTranslations();

// ─── Init clock ───────────────────────────────────────────────────────────────

initClock();

// ─── Init settings panel ──────────────────────────────────────────────────────

const { panel: settingsPanel, isOpen: settingsIsOpen } = initSettingsPanel();

// ─── Init settings + toggles ─────────────────────────────────────────────────

initSettings();

// ─── Init search ──────────────────────────────────────────────────────────────

initSearch(settingsIsOpen);

// ─── Init wallpaper ───────────────────────────────────────────────────────────

initWallpaper(settingsPanel);

// ─── Init weather ─────────────────────────────────────────────────────────────

fetchWeather();

// ─── Bootstrap on load ───────────────────────────────────────────────────────

window.addEventListener("load", () => {
    document.body.classList.add("loaded");
    makeStorage(fList);
    checkCheckBoxStatus();

    const favs = JSON.parse(localStorage.getItem("favorites"));
    const migrated = favs.map(f => {
        if (!f.image || f.image.startsWith("images/") || f.image.startsWith("./images/")) {
            try {
                const origin = new URL(f.link).origin;
                return { ...f, image: `https://www.google.com/s2/favicons?domain=${origin}&sz=64` };
            } catch { return f; }
        }
        return f;
    });
    localStorage.setItem("favorites", JSON.stringify(migrated));
    fillFavorites(migrated);
    renderSecretText();
    maybeShowOnboarding();
});

// ─── Init favorites add button ────────────────────────────────────────────────

initAddNewFavorite();

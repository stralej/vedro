import { searchEngineList } from "./data.js";
import { t, applyTranslations, buildLanguageList, initLanguageToggle } from "./i18n.js";
import { showBackdrop, removeAddModal } from "./modal.js";
import { renderWeather } from "./weather.js";



export function makeStorage(fList) {
    if (localStorage.getItem("checkboxes") === null)
        localStorage.setItem("checkboxes", JSON.stringify({ welcome: true, time: true, date: true, favorites: true, clock24: true, seconds: true, weather: true, celsius: true, addnew: true }));

    if (localStorage.getItem("favorites") === null)
        localStorage.setItem("favorites", JSON.stringify(fList));

    if (localStorage.getItem("searchEngine") === null)
        localStorage.setItem("searchEngine", searchEngineList.find(e => e.selected)?.link ?? searchEngineList[0].link);

    if (localStorage.getItem("panelBlur") === null)
        localStorage.setItem("panelBlur", "10");
}

const PILL_TYPES = ["welcome", "time", "date", "favorites", "clock24", "seconds", "weather", "celsius", "addnew"];

export function checkCheckBoxStatus() {
    const storage = JSON.parse(localStorage.getItem("checkboxes"));

    PILL_TYPES.forEach(type => {
        const item   = document.getElementById(`${type}-checkbox`);
        const active = storage[type] ?? true;

        item?.classList.toggle("setting-item-active", active);

        if (type === "clock24" || type === "seconds" || type === "celsius") return;

        if (type === "weather") {
            document.querySelector(".weather")?.classList.toggle("invisible-weather", !active);
            return;
        }

        if (type === "date") {
            document.querySelector(".time")?.classList.toggle("invisible-date", !active);
            return;
        }

        if (type === "favorites") {
            document.getElementById("favorites-bar")?.classList.toggle("invisible-favorites", !active);
            return;
        }

        if (type === "addnew") {
            document.querySelector(".add-new")?.classList.toggle("add-new-hidden", !active);
            return;
        }

        const field = document.querySelector(`.${type}`);
        field?.classList.toggle(`invisible-${type}`, !active);
    });
}

export function initSettings() {
    // Sliders
    const sliderEl  = document.getElementById("blur-slider");
    const blurVal   = document.getElementById("blur-value");
    const track     = sliderEl.querySelector(".custom-slider-track");
    const fill      = sliderEl.querySelector(".custom-slider-fill");
    const thumb     = sliderEl.querySelector(".custom-slider-thumb");

    const MIN = 0, MAX = 30, STEP = 1;
    let currentVal = parseFloat(localStorage.getItem("panelBlur") ?? "10");
    let dragging = false;

    function snap(v) {
        return Math.round(Math.max(MIN, Math.min(MAX, v)) / STEP) * STEP;
    }

    function pct(v) {
        return ((v - MIN) / (MAX - MIN)) * 100;
    }

    function render(v) {
        const p = pct(v) + "%";
        thumb.style.left = p;
        fill.style.width = p;
        blurVal.innerText = Math.round(v) + "px";
        document.documentElement.style.setProperty("--panel-blur", v + "px");
    }

    function valFromEvent(e) {
        const rect = track.getBoundingClientRect();
        const x = (e.clientX ?? e.touches?.[0].clientX) - rect.left;
        return snap((x / rect.width) * (MAX - MIN) + MIN);
    }

    render(currentVal);

    sliderEl.addEventListener("mousedown", e => {
        dragging = true;
        thumb.classList.add("dragging");
        const v = valFromEvent(e);
        currentVal = v;
        render(v);
        e.preventDefault();
    });

    sliderEl.addEventListener("touchstart", e => {
        dragging = true;
        thumb.classList.add("dragging");
        const v = valFromEvent(e);
        currentVal = v;
        render(v);
    }, { passive: true });

    document.addEventListener("mousemove", e => {
        if (!dragging) return;
        const v = valFromEvent(e);
        if (v !== currentVal) {
            currentVal = v;
            render(v);
        }
    });

    document.addEventListener("touchmove", e => {
        if (!dragging) return;
        const v = valFromEvent(e);
        if (v !== currentVal) {
            currentVal = v;
            render(v);
        }
    }, { passive: true });

    function onRelease() {
        if (!dragging) return;
        dragging = false;
        thumb.classList.remove("dragging");
        // Snap with animation on release
        const snapped = snap(currentVal);
        currentVal = snapped;
        render(snapped);
        localStorage.setItem("panelBlur", snapped);
    }

    document.addEventListener("mouseup", onRelease);
    document.addEventListener("touchend", onRelease);

    // Toggle pills
    document.querySelectorAll(".setting-item").forEach(item => {
        item.addEventListener("click", () => {
            const type     = item.id.replace("-checkbox", "");
            const storage  = JSON.parse(localStorage.getItem("checkboxes"));
            const isActive = item.classList.contains("setting-item-active");
            const nowActive = !isActive;

            item.classList.toggle("setting-item-active", nowActive);

            if (type === "clock24" || type === "seconds") {
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, [type]: nowActive }));
                return;
            }

            if (type === "celsius") {
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, celsius: nowActive }));
                renderWeather();
                return;
            }

            if (type === "weather") {
                document.querySelector(".weather")?.classList.toggle("invisible-weather", !nowActive);
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, weather: nowActive }));
                return;
            }

            if (type === "date") {
                document.querySelector(".time")?.classList.toggle("invisible-date", !nowActive);
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, date: nowActive }));
                return;
            }

            if (type === "favorites") {
                document.getElementById("favorites-bar")?.classList.toggle("invisible-favorites", !nowActive);
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, favorites: nowActive }));
                return;
            }

            if (type === "addnew") {
                document.querySelector(".add-new")?.classList.toggle("add-new-hidden", !nowActive);
                localStorage.setItem("checkboxes", JSON.stringify({ ...storage, addnew: nowActive }));
                return;
            }

            const field = document.querySelector(`.${type}`);
            field?.classList.toggle(`invisible-${type}`, !nowActive);
            localStorage.setItem("checkboxes", JSON.stringify({ ...storage, [type]: nowActive }));
        });
    });

    // Search engine list
    function initSearchEngineToggle() {
        const header  = document.getElementById("search-engine-header");
        const list    = document.getElementById("search-engine-list");
        const chevron = document.getElementById("search-engine-chevron");
        if (!header || !list || !chevron) return;

        header.addEventListener("click", () => {
            const open = list.classList.toggle("bg-library-visible");
            chevron.style.transform = open ? "rotate(180deg)" : "rotate(0deg)";
            if (open) buildSearchEngineList();
        });
    }

    initSearchEngineToggle();
    initLanguageToggle();
}

function buildSearchEngineList() {
    const listEl = document.querySelector(".search-engine-list");
    [...listEl.children].forEach(child => {
        if (child.tagName.toLowerCase() !== "template") child.remove();
    });

    const savedEngine = localStorage.getItem("searchEngine");

    searchEngineList.forEach(engine => {
        const el = document.querySelector('[data-template="search-engine"]')
                           .content.firstElementChild.cloneNode(true);

        const isSelected = engine.link === savedEngine || (!savedEngine && engine.selected);
        if (isSelected) el.classList.add("selected");

        el.setAttribute("data-search-engine", engine.link);
        el.querySelector("img").setAttribute("src", engine.image);
        el.querySelector("img").setAttribute("alt", engine.title);
        el.querySelector("p").innerText = engine.title;

        el.addEventListener("click", (e) => {
            e.stopPropagation();
            listEl.querySelector(".selected")?.classList.remove("selected");
            el.classList.add("selected");
            localStorage.setItem("searchEngine", engine.link);
            const list    = document.getElementById("search-engine-list");
            const chevron = document.getElementById("search-engine-chevron");
            list?.classList.remove("bg-library-visible");
            if (chevron) chevron.style.transform = "rotate(0deg)";
        });

        listEl.appendChild(el);
    });
}

// ─── Settings panel open/close ───────────────────────────────────────────────

export function initSettingsPanel(openOnboarding) {
    const settingsButton = document.querySelector(".settings-button");
    const settingsPanel  = document.getElementById("settings");
    let settingsOpen = false;

    let eggClicks = 0;
    let eggTimer  = null;

    settingsButton.addEventListener("click", e => {
        e.stopPropagation();

        eggClicks++;
        clearTimeout(eggTimer);
        eggTimer = setTimeout(() => { eggClicks = 0; }, 2000);

        if (eggClicks >= 10) {
            eggClicks = 0;
            clearTimeout(eggTimer);
            if (settingsOpen) closeSettings();
            openSecretModal();
            return;
        }

        settingsOpen ? closeSettings() : openSettings();
    });

    function openSettings() {
        settingsOpen = true;
        settingsPanel.classList.add("settings-open");
        settingsButton.classList.add("settings-open-active");
        setTimeout(() => window.addEventListener("click", onWindowClickSettings), 0);
    }

    function closeSettings() {
        settingsOpen = false;
        settingsPanel.classList.remove("settings-open");
        settingsButton.classList.remove("settings-open-active");
        window.removeEventListener("click", onWindowClickSettings);
    }

    function onWindowClickSettings(e) {
        if (settingsPanel.contains(e.target)) return;
        closeSettings();
    }

    return {
        panel: settingsPanel,
        isOpen: () => settingsOpen,
    };
}

// ─── Secret modal ─────────────────────────────────────────────────────────────

export function renderSecretText() {
    const el   = document.getElementById("secret-text");
    const text = localStorage.getItem("secretText") || "";
    el.textContent = text;
    document.title = localStorage.getItem("secretTabTitle") || "Vedro";
}

function openSecretModal() {
    const modal = document.querySelector('[data-template="secret-modal"]')
                          .content.firstElementChild.cloneNode(true);
    document.body.appendChild(modal);
    showBackdrop();
    setTimeout(() => {
        applyTranslations(modal);
        modal.classList.add("modal-active");
    }, 10);

    const secretInput    = modal.querySelector("#secret-input");
    const secretTabInput = modal.querySelector("#secret-tab-input");
    secretInput.value    = localStorage.getItem("secretText") || "";
    secretTabInput.value = localStorage.getItem("secretTabTitle") || "";

    const saveBtn   = modal.querySelector(".secret-save-btn");
    const clearBtn  = modal.querySelector(".secret-clear-btn");
    const cancelBtn = modal.querySelector(".secret-cancel-btn");

    saveBtn.addEventListener("click", e => {
        e.stopPropagation();
        localStorage.setItem("secretText", secretInput.value.trim());
        const tabTitle = secretTabInput.value.trim();
        if (tabTitle) localStorage.setItem("secretTabTitle", tabTitle);
        else localStorage.removeItem("secretTabTitle");
        renderSecretText();
        removeAddModal(modal);
    });

    clearBtn.addEventListener("click", e => {
        e.stopPropagation();
        localStorage.removeItem("secretText");
        localStorage.removeItem("secretTabTitle");
        renderSecretText();
        removeAddModal(modal);
    });

    cancelBtn.addEventListener("click", e => {
        e.stopPropagation();
        removeAddModal(modal);
    });

    setTimeout(() => window.addEventListener("click", outsideSecretClick), 0);
    function outsideSecretClick(e) {
        if (modal.contains(e.target)) return;
        removeAddModal(modal);
        window.removeEventListener("click", outsideSecretClick);
    }
}

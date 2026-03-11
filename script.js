import { fList, searchEngineList } from "./data.js";

// ─── Time & Welcome ──────────────────────────────────────────────────────────

function Time() {
    const p = document.getElementById("time");
    const welcome = document.getElementById("welcome");
    const d = new Date();

    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds();

    p.innerText = [h, m, s].map(v => String(v).padStart(2, "0")).join(":");

    if (h >= 3  && h < 12) welcome.innerText = "Good morning 🌻";
    if (h >= 12 && h < 19) welcome.innerText = "Good afternoon ☀️";
    if (h >= 19 && h < 23) welcome.innerText = "Good evening 🌃";
    if (h >= 23 || h < 3)  welcome.innerText = "Good night 🌙";
}

Time();
setInterval(Time, 500);


// ─── Storage bootstrap ───────────────────────────────────────────────────────

window.addEventListener("load", () => {
    makeStorage();
    checkCheckBoxStatus();
    const favs = JSON.parse(localStorage.getItem("favorites"));
    // Migrate any locally stored image paths to favicon URLs
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
});

function makeStorage() {
    if (localStorage.getItem("checkboxes") === null)
        localStorage.setItem("checkboxes", JSON.stringify({ welcome: true, time: true, favorites: true }));

    if (localStorage.getItem("favorites") === null)
        localStorage.setItem("favorites", JSON.stringify(fList));

    if (localStorage.getItem("searchEngine") === null)
        localStorage.setItem("searchEngine", searchEngineList.find(e => e.selected)?.link ?? searchEngineList[0].link);
}


// ─── Search ──────────────────────────────────────────────────────────────────

const input = document.getElementById("search");

function Search() {
    const q = input.value.trim();
    if (!q) return;
    // If it looks like a URL (has a dot and no spaces) go directly, else search
    const isUrl = q.includes(".") && !q.includes(" ");
    if (isUrl) {
        window.location.href = q.startsWith("http") ? q : "https://" + q;
    } else {
        const engine = localStorage.getItem("searchEngine") ?? "https://www.google.com/search?q=";
        window.location.href = engine + encodeURIComponent(q);
    }
}

document.querySelector(".search i").onclick = () => {
    const engine = localStorage.getItem("searchEngine") ?? "https://www.google.com/search?q=";
    window.location.href = engine + encodeURIComponent(input.value.trim());
};

input.addEventListener("keydown", e => { if (e.key === "Enter") Search(); });


// ─── Settings open / close ───────────────────────────────────────────────────

const settingsButton = document.querySelector(".settings-button");
const settingsPanel  = document.getElementById("settings");

let settingsOpen = false;

settingsButton.addEventListener("click", e => {
    e.stopPropagation();
    settingsOpen ? closeSettings() : openSettings();
});

function openSettings() {
    settingsOpen = true;
    settingsPanel.classList.add("settings-open");
    buildSearchEngineList();           // (re)build only when opening
    setTimeout(() => window.addEventListener("click", onWindowClickSettings), 0);
}

function closeSettings() {
    settingsOpen = false;
    settingsPanel.classList.remove("settings-open");
    window.removeEventListener("click", onWindowClickSettings);
}

function onWindowClickSettings(e) {
    if (settingsPanel.contains(e.target)) return;
    closeSettings();
}


// ─── Search-engine list ──────────────────────────────────────────────────────

function buildSearchEngineList() {
    const listEl = document.querySelector(".search-engine-list");

    // Clear existing entries (but leave the <template>)
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

        el.addEventListener("click", () => {
            listEl.querySelector(".selected")?.classList.remove("selected");
            el.classList.add("selected");
            localStorage.setItem("searchEngine", engine.link);
        });

        listEl.appendChild(el);
    });
}


// ─── Checkboxes ──────────────────────────────────────────────────────────────

document.querySelectorAll(".checkbox").forEach(checkbox => {
    checkbox.addEventListener("click", changeCheckboxStatus);
});

function changeCheckboxStatus(e) {
    const storage = JSON.parse(localStorage.getItem("checkboxes"));
    const icon = e.currentTarget.querySelector("i");
    const type = icon.id.split("-")[0];
    const field = document.querySelector(`.${type}`);
    const isChecked = icon.classList.contains("fa-check");

    icon.classList.toggle("fa-check", !isChecked);
    field.classList.toggle(`invisible-${type}`, isChecked);

    localStorage.setItem("checkboxes", JSON.stringify({ ...storage, [type]: !isChecked }));
}

function checkCheckBoxStatus() {
    const storage = JSON.parse(localStorage.getItem("checkboxes"));

    document.querySelectorAll(".checkbox i").forEach(icon => {
        const type = icon.id.split("-")[0];
        const active = storage[type] ?? true;
        const field = document.querySelector(`.${type}`);

        icon.classList.toggle("fa-check", active);
        field?.classList.toggle(`invisible-${type}`, !active);
    });
}


// ─── Favorites ───────────────────────────────────────────────────────────────

const favoritesEl = document.querySelector(".favorites");
const addNewBtn   = document.querySelector(".add-new");

function fillFavorites(list) {
    [...favoritesEl.children].forEach(child => {
        if (!child.classList.contains("add-new") && child.tagName.toLowerCase() !== "template")
            child.remove();
    });

    list.forEach(favorite => {
        const anchor = document.querySelector('[data-template="favorite"]')
                               .content.firstElementChild.cloneNode(true);
        anchor.setAttribute("href", favorite.link);

        const [article, closeBtn] = [...anchor.children];
        const [img, p]            = [...article.children];

        img.setAttribute("src", favorite.image);
        img.setAttribute("alt", favorite.title.toUpperCase());
        p.innerText = favorite.title;

        closeBtn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            openConfirmationModal(anchor, list);
        });

        setupDrag(anchor, list);

        favoritesEl.insertBefore(anchor, addNewBtn);
    });

    localStorage.setItem("favorites", JSON.stringify(list));
}

// ─── Drag to reorder ─────────────────────────────────────────────────────────

let ghost          = null;
let dragSource     = null;
let placeholder    = null;
let longPressTimer = null;
let isDragging     = false;
const LONG_PRESS_MS = 450;

function cleanupDrag() {
    isDragging = false;
    clearTimeout(longPressTimer);
    if (ghost)       { ghost.remove();       ghost       = null; }
    if (placeholder) { placeholder.remove(); placeholder = null; }
    if (dragSource)  {
        dragSource.classList.remove("drag-source-hidden");
        dragSource = null;
    }
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup",   onDragUp);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend",  onDragUp);
}

function setupDrag(anchor, list) {
    let startX = 0, startY = 0;

    function onDown(e) {
        if (isDragging) return;
        startX = e.clientX ?? e.touches?.[0].clientX;
        startY = e.clientY ?? e.touches?.[0].clientY;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => beginDrag(anchor, startX, startY, list), LONG_PRESS_MS);
    }

    function onMove(e) {
        const x = e.clientX ?? e.touches?.[0].clientX;
        const y = e.clientY ?? e.touches?.[0].clientY;
        if (Math.hypot(x - startX, y - startY) > 6) clearTimeout(longPressTimer);
    }

    anchor.addEventListener("mousedown",  onDown);
    anchor.addEventListener("touchstart", onDown, { passive: true });
    anchor.addEventListener("mousemove",  onMove);
    anchor.addEventListener("touchmove",  onMove, { passive: true });
    anchor.addEventListener("mouseup",    () => clearTimeout(longPressTimer));
    anchor.addEventListener("touchend",   () => clearTimeout(longPressTimer));
}

function beginDrag(anchor, startX, startY, list) {
    if (isDragging) return;
    isDragging = true;
    dragSource = anchor;

    // Get the article inside the anchor for accurate sizing
    const article = anchor.querySelector("article");
    const rect    = article.getBoundingClientRect();

    // Ghost — snapshot exact pixel size from the DOM
    ghost = article.cloneNode(true);
    ghost.classList.add("drag-ghost");
    const computed = getComputedStyle(article);
    ghost.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 1000;
        box-sizing: border-box;
        width: ${rect.width}px;
        height: ${rect.height}px;
        left: ${rect.left}px;
        top: ${rect.top}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
        background-color: ${computed.backgroundColor};
        border-radius: ${computed.borderRadius};
        padding: ${computed.padding};
        font-size: ${computed.fontSize};
        text-transform: ${computed.textTransform};
        color: white;
        opacity: 0.85;
        transform: scale(1.08);
        filter: drop-shadow(0 8px 16px #0006);
        overflow: hidden;
    `;
    document.body.appendChild(ghost);

    // Placeholder — same size as the anchor (includes x button space)
    const anchorRect = anchor.getBoundingClientRect();
    placeholder = document.createElement("div");
    placeholder.className    = "drag-placeholder";
    placeholder.style.width  = anchorRect.width  + "px";
    placeholder.style.height = anchorRect.height + "px";
    favoritesEl.insertBefore(placeholder, anchor);
    anchor.classList.add("drag-source-hidden");

    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;

    function onDragMoveLocal(e) {
        const x = e.clientX ?? e.touches?.[0].clientX;
        const y = e.clientY ?? e.touches?.[0].clientY;

        ghost.style.left = (x - offsetX) + "px";
        ghost.style.top  = (y - offsetY) + "px";

        const siblings = [...favoritesEl.children].filter(c =>
            c !== dragSource &&
            c !== placeholder &&
            c !== addNewBtn &&
            c.tagName.toLowerCase() !== "template"
        );

        for (const el of siblings) {
            const r  = el.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                const mid = r.left + r.width / 2;
                favoritesEl.insertBefore(placeholder, x < mid ? el : el.nextSibling);
                break;
            }
        }
    }

    function onDragUpLocal() {
        favoritesEl.insertBefore(dragSource, placeholder);

        const newList = [...favoritesEl.children]
            .filter(c =>
                !c.classList.contains("add-new") &&
                !c.classList.contains("drag-placeholder") &&
                c.tagName.toLowerCase() !== "template"
            )
            .map(c => list.find(f => f.link === c.getAttribute("href")))
            .filter(Boolean);

        cleanupDrag();

        localStorage.setItem("favorites", JSON.stringify(newList));
        fillFavorites(newList);
    }

    // Store references so cleanupDrag can remove them
    onDragMove = onDragMoveLocal;
    onDragUp   = onDragUpLocal;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup",   onDragUp);
    document.addEventListener("touchmove", onDragMove, { passive: true });
    document.addEventListener("touchend",  onDragUp);
}

// Module-level refs so cleanupDrag can always remove the right listeners
let onDragMove = null;
let onDragUp   = null;

// Safety net — if focus leaves the window mid-drag, clean up
window.addEventListener("blur", cleanupDrag);

function openConfirmationModal(anchor, list) {
    const modal   = document.querySelector('[data-template="confirmation-modal"]')
                            .content.firstElementChild.cloneNode(true);
    const article = anchor.querySelector("article");
    const closeBtn = anchor.querySelector(".favorite-x");

    closeBtn.style.opacity = "0";
    article.appendChild(modal);

    setTimeout(() => {
        modal.classList.add("modal-active");
        modal.querySelector("p").innerText = "delete?";

        const [yes, no] = modal.querySelectorAll("button");

        yes.addEventListener("click", e => {
            e.stopPropagation(); e.preventDefault();
            const newList = list.filter(f => f.link !== anchor.href);
            fillFavorites(newList);
        });

        no.addEventListener("click", e => {
            e.stopPropagation(); e.preventDefault();
            modal.classList.remove("modal-active");
            modal.classList.add("modal-disabled");
            closeBtn.style.opacity = "";
        });
    }, 50);
}


// ─── Add-new-favorite modal ──────────────────────────────────────────────────

addNewBtn.addEventListener("click", () => {
    if (document.querySelector(".add-new-favorite-modal")) return;

    const modal = document.querySelector('[data-template="add-new-favorite-modal"]')
                          .content.firstElementChild.cloneNode(true);
    document.body.appendChild(modal);

    setTimeout(() => modal.classList.add("modal-active"), 10);

    const titleInput = modal.querySelector("#favorite-title");
    const linkInput  = modal.querySelector("#favorite-link");
    const addBtn     = modal.querySelector(".modal-buttons .disabled-favorite-button, .modal-buttons button:first-child");
    const imgEl      = modal.querySelector(".favorite-img-input img");
    const fileInput  = modal.querySelector(".favorite-img-input input[type='file']");

    // Enable add button only when both fields are filled
    function checkInputs() {
        const ready = titleInput.value.trim() && linkInput.value.trim();
        addBtn.classList.toggle("disabled-favorite-button", !ready);
    }

    titleInput.addEventListener("input", checkInputs);
    linkInput.addEventListener("input", e => {
        checkInputs();
        // Auto-fetch favicon after user pauses typing
        clearTimeout(linkInput._faviconTimer);
        linkInput._faviconTimer = setTimeout(() => autoFavicon(e.target.value, imgEl), 600);
    });

    // Manual image upload still works as override
    fileInput.addEventListener("change", async () => {
        if (!fileInput.files[0]) return;
        imgEl.src = await fileToBase64(fileInput.files[0]);
    });

    const [addButton, cancelButton] = modal.querySelectorAll(".modal-buttons button");

    addButton.addEventListener("click", () => {
        if (addButton.classList.contains("disabled-favorite-button")) return;

        let link = linkInput.value.trim();
        if (!link.startsWith("http")) link = "https://" + link;
        if (!link.endsWith("/")) link += "/";

        const newEntry = { title: titleInput.value.trim(), image: imgEl.src, link };
        const current  = JSON.parse(localStorage.getItem("favorites")) ?? [];
        fillFavorites([...current, newEntry]);
        removeAddModal(modal);
    });

    cancelButton.addEventListener("click", () => removeAddModal(modal));

    setTimeout(() => window.addEventListener("click", outsideModalClick), 0);

    function outsideModalClick(e) {
        if (modal.contains(e.target)) return;
        removeAddModal(modal);
        window.removeEventListener("click", outsideModalClick);
    }
});

function removeAddModal(modal) {
    modal.classList.remove("modal-active");
    modal.classList.add("modal-disabled");
    setTimeout(() => modal.remove(), 300);
}

// Auto-fetch favicon via Google's public favicon CDN (no CORS issues)
async function autoFavicon(rawUrl, imgEl) {
    let url = rawUrl.trim();
    if (!url) return;
    if (!url.startsWith("http")) url = "https://" + url;

    try {
        const origin = new URL(url).origin;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
        imgEl.src = faviconUrl;
    } catch {
        // invalid URL yet — ignore
    }
}

function fileToBase64(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}


// ─── Background image (IndexedDB) ────────────────────────────────────────────

const PICSUM = "https://picsum.photos/1920/1080";
const DB_NAME = "startpage-bg";
const DB_STORE = "images";
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE, { autoIncrement: true });
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function dbGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const req = tx.objectStore(DB_STORE).getAll();
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function dbGetAllWithKeys() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const store = tx.objectStore(DB_STORE);
        const results = [];
        store.openCursor().onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) { results.push({ key: cursor.key, blob: cursor.value }); cursor.continue(); }
            else resolve(results);
        };
    });
}

async function dbAdd(blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        const req = tx.objectStore(DB_STORE).add(blob);
        req.onsuccess = e => resolve(e.target.result);
        req.onerror   = e => reject(e.target.error);
    });
}

async function dbDelete(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readwrite");
        const req = tx.objectStore(DB_STORE).delete(key);
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    });
}

// "random" | "library"
function getBgMode() { return localStorage.getItem("bgMode") ?? "random"; }
function setBgMode(mode) { localStorage.setItem("bgMode", mode); }

async function applyBackground() {
    const mode = getBgMode();
    if (mode === "library") {
        const all = await dbGetAll();
        if (all.length > 0) {
            const blob = all[Math.floor(Math.random() * all.length)];
            document.body.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
            return;
        }
        // Library empty — fall through to random
    }
    document.body.style.backgroundImage = `url(${PICSUM}?random=${Date.now()})`;
}

applyBackground();

// Mode toggle buttons
const btnRandom  = document.getElementById("bg-mode-random");
const btnLibrary = document.getElementById("bg-mode-library");
const libraryPanel = document.getElementById("bg-library-panel");

function updateModeUI() {
    const mode = getBgMode();
    btnRandom.classList.toggle("selected", mode === "random");
    btnLibrary.classList.toggle("selected", mode === "library");
    libraryPanel.classList.toggle("bg-library-visible", mode === "library");
}

btnRandom.addEventListener("click", () => {
    setBgMode("random");
    updateModeUI();
    applyBackground();
});

btnLibrary.addEventListener("click", () => {
    setBgMode("library");
    updateModeUI();
    applyBackground();
});

// Add images
document.getElementById("background-input").addEventListener("change", async function () {
    const files = [...this.files];
    if (!files.length) return;
    for (const file of files) await dbAdd(file);
    this.value = "";
    await renderBgThumbnails();
    // Auto-switch to library mode when user adds images
    if (getBgMode() !== "library") {
        setBgMode("library");
        updateModeUI();
    }
    await applyBackground();
});

// Thumbnail strip
async function renderBgThumbnails() {
    const container = document.getElementById("bg-thumbnails");
    if (!container) return;

    container.querySelectorAll("img").forEach(img => URL.revokeObjectURL(img.src));
    container.innerHTML = "";

    const entries = await dbGetAllWithKeys();

    if (entries.length === 0) {
        container.innerHTML = `<p class="bg-empty-hint">No images saved yet.</p>`;
        return;
    }

    entries.forEach(({ key, blob }) => {
        const url  = URL.createObjectURL(blob);
        const wrap = document.createElement("div");
        wrap.className = "bg-thumb-wrap";

        const img = document.createElement("img");
        img.src = url;
        img.className = "bg-thumb";

        const del = document.createElement("button");
        del.className = "bg-thumb-delete";
        del.innerHTML = `<i class="fa-solid fa-xmark"></i>`;
        del.addEventListener("click", async e => {
            e.stopPropagation();
            URL.revokeObjectURL(url);
            await dbDelete(key);
            await renderBgThumbnails();
            await applyBackground();
        });

        wrap.appendChild(img);
        wrap.appendChild(del);
        container.appendChild(wrap);
    });
}

// Refresh thumbnails + mode UI whenever settings open
const settingsObserver = new MutationObserver(() => {
    if (settingsPanel.classList.contains("settings-open")) {
        updateModeUI();
        renderBgThumbnails();
    }
});
settingsObserver.observe(settingsPanel, { attributes: true, attributeFilter: ["class"] });
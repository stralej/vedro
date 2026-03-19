const PICSUM = "https://picsum.photos/1920/1080";
const DB_NAME = "startpage-bg";
const DB_STORE = "images";
const DB_VERSION = 1;

// ─── IndexedDB ────────────────────────────────────────────────────────────────

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

// ─── Wallpaper ────────────────────────────────────────────────────────────────

const wallpaperEl = document.getElementById("wallpaper");

function setWallpaper(url) {
    const img = new Image();
    img.onload = () => {
        wallpaperEl.style.transition = "opacity 0.35s ease";
        wallpaperEl.style.opacity = "0";
        setTimeout(() => {
            wallpaperEl.style.backgroundImage = `url(${url})`;
            wallpaperEl.style.opacity = "1";
        }, 350);
    };
    img.onerror = () => {
        wallpaperEl.style.backgroundImage = `url(${url})`;
        wallpaperEl.style.opacity = "1";
    };
    img.src = url;
}

function getBgMode() { return localStorage.getItem("bgMode") ?? "random"; }
function setBgMode(mode) { localStorage.setItem("bgMode", mode); }

const VEDRO_WALLPAPERS = [
    "images/vedro/saraorci.jpeg",
    "images/vedro/bihać.jpeg",
    "images/vedro/bihać2.jpeg",
    "images/vedro/dobri-do.jpeg",
    "images/vedro/saraorci2.jpeg",
    "images/vedro/lozovik.jpeg",
    "images/vedro/lozovik2.jpeg",
    "images/vedro/piran.jpeg",
    "images/vedro/piran2.jpeg",
    "images/vedro/piran3.jpeg",
    "images/vedro/koper.jpeg",
    "images/vedro/kolomban.jpeg",
    "images/vedro/kolomban2.jpeg",
    "images/vedro/piran4.jpeg",
];

export async function applyBackground() {
    const mode = getBgMode();

    if (mode === "vedro") {
        setWallpaper(VEDRO_WALLPAPERS[Math.floor(Math.random() * VEDRO_WALLPAPERS.length)]);
        return;
    }

    if (mode === "library") {
        const all = await dbGetAll();
        if (all.length > 0) {
            const blob = all[Math.floor(Math.random() * all.length)];
            setWallpaper(URL.createObjectURL(blob));
            return;
        }
    }

    setWallpaper(`${PICSUM}?random=${Date.now()}`);
}

export function initWallpaper(settingsPanel) {
    applyBackground();

    const btnRandom    = document.getElementById("bg-mode-random");
    const btnVedro     = document.getElementById("bg-mode-vedro");
    const btnLibrary   = document.getElementById("bg-mode-library");
    const libraryPanel = document.getElementById("bg-library-panel");

    function updateModeUI() {
        const mode = getBgMode();
        btnRandom.classList.toggle("selected",  mode === "random");
        btnVedro.classList.toggle("selected",   mode === "vedro");
        btnLibrary.classList.toggle("selected", mode === "library");
        libraryPanel.classList.toggle("bg-library-visible", mode === "library");
    }

    btnRandom.addEventListener("click", () => { setBgMode("random");  updateModeUI(); applyBackground(); });
    btnVedro.addEventListener("click",  () => { setBgMode("vedro");   updateModeUI(); applyBackground(); });
    btnLibrary.addEventListener("click",() => { setBgMode("library"); updateModeUI(); applyBackground(); });

    document.getElementById("background-input").addEventListener("change", async function () {
        const files = [...this.files];
        if (!files.length) return;
        for (const file of files) await dbAdd(file);
        this.value = "";
        await renderBgThumbnails();
        if (getBgMode() !== "library") { setBgMode("library"); updateModeUI(); }
        await applyBackground();
    });

    const observer = new MutationObserver(() => {
        if (settingsPanel.classList.contains("settings-open")) {
            updateModeUI();
            renderBgThumbnails();
        }
    });
    observer.observe(settingsPanel, { attributes: true, attributeFilter: ["class"] });

    updateModeUI();
}

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

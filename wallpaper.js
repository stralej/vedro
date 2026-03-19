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

function isBottomLeftDark(imgSrc) {
    return new Promise(resolve => {
        const canvas = document.createElement("canvas");
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Sample a 50x50 patch at bottom-left of the image
            ctx.drawImage(img, 0, img.height - 50, 50, 50, 0, 0, 50, 50);
            const data = ctx.getImageData(0, 0, 50, 50).data;
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
            }
            brightness /= (data.length / 4);
            resolve(brightness < 100); // dark if average brightness < 100/255
        };
        img.onerror = () => resolve(true); // assume dark on error
        img.src = imgSrc;
    });
}

function setWallpaper(url) {
    const img = new Image();
    img.onload = async () => {
        wallpaperEl.style.transition = "opacity 0.35s ease";
        wallpaperEl.style.opacity = "0";
        setTimeout(async () => {
            wallpaperEl.style.backgroundImage = `url(${url})`;
            wallpaperEl.style.opacity = "1";
            const dark = await isBottomLeftDark(url);
            document.getElementById("secret-text")?.classList.toggle("on-dark", dark);
        }, 350);
    };
    img.onerror = () => {
        wallpaperEl.style.backgroundImage = `url(${url})`;
        wallpaperEl.style.opacity = "1";
        document.getElementById("secret-text")?.classList.add("on-dark");
    };
    img.src = url;

    // While loading, treat as dark
    document.getElementById("secret-text")?.classList.add("on-dark");
}

function getBgMode() { return localStorage.getItem("bgMode") ?? "random"; }
function setBgMode(mode) { localStorage.setItem("bgMode", mode); }

const VEDRO_WALLPAPERS = [
    "images/vedro/saraorci.jpeg",
    "images/vedro/bihac.jpeg",
    "images/vedro/bihac2.jpeg",
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

function shuffled(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function nextFromQueue(key, items) {
    let queue = JSON.parse(sessionStorage.getItem(key) || "[]");
    if (queue.length === 0) {
        queue = shuffled(items.map((_, i) => i));
        // Avoid repeating the last shown item at the start of a new shuffle
        const lastKey = key + "_last";
        const last = sessionStorage.getItem(lastKey);
        if (last !== null && queue[0] === parseInt(last) && queue.length > 1) {
            queue.push(queue.shift());
        }
    }
    const idx = queue.shift();
    sessionStorage.setItem(key, JSON.stringify(queue));
    sessionStorage.setItem(key + "_last", idx);
    return idx;
}

export async function applyBackground() {
    const mode = getBgMode();

    if (mode === "vedro") {
        const idx = nextFromQueue("vedro_queue", VEDRO_WALLPAPERS);
        setWallpaper(VEDRO_WALLPAPERS[idx]);
        return;
    }

    if (mode === "library") {
        const all = await dbGetAll();
        if (all.length > 0) {
            const idx = nextFromQueue("library_queue", all);
            setWallpaper(URL.createObjectURL(all[idx]));
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

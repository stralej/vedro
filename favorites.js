import { t, applyTranslations } from "./i18n.js";
import { showBackdrop, hideBackdrop, removeAddModal } from "./modal.js";

const favoritesEl = document.getElementById("favorites-bar");
const addNewBtn   = document.querySelector(".add-new");

// Right-click on the bar itself (not on a favorite) opens add-new
favoritesEl.addEventListener("contextmenu", e => {
    // If right-clicking on a favorite anchor, let that handler take over
    if (e.target.closest("a[href]")) return;
    e.preventDefault();
    e.stopPropagation();
    openAddNewModal();
});

export function fillFavorites(list, animateLastIn = false) {
    [...favoritesEl.children].forEach(child => {
        if (!child.classList.contains("add-new") && child.tagName.toLowerCase() !== "template")
            child.remove();
    });

    list.forEach((favorite, i) => {
        const anchor = createFavoriteEl(favorite, list);
        const isLast = animateLastIn && i === list.length - 1;

        if (isLast) anchor.classList.add("fav-enter");
        favoritesEl.insertBefore(anchor, addNewBtn);
        if (isLast) requestAnimationFrame(() => requestAnimationFrame(() => anchor.classList.remove("fav-enter")));
    });

    localStorage.setItem("favorites", JSON.stringify(list));
}

function createFavoriteEl(favorite, list) {
    const anchor = document.querySelector('[data-template="favorite"]')
                           .content.firstElementChild.cloneNode(true);
    anchor.setAttribute("href", favorite.link);

    const article  = anchor.querySelector("article");
    const [img, p] = [...article.children];

    img.setAttribute("src", favorite.image);
    img.setAttribute("alt", favorite.title.toUpperCase());
    p.innerText = favorite.title;

    anchor.addEventListener("contextmenu", e => {
        e.preventDefault();
        e.stopPropagation();
        openFavContextMenu(e, anchor, favorite, list);
    });

    setupDrag(anchor, list);
    return anchor;
}

// ─── Right-click context menu ─────────────────────────────────────────────────

let activeContextMenu = null;

function closeContextMenu() {
    if (!activeContextMenu) return;
    activeContextMenu.classList.remove("visible");
    setTimeout(() => { activeContextMenu?.remove(); activeContextMenu = null; }, 150);
}

function openFavContextMenu(e, anchor, favorite, list) {
    closeContextMenu();

    const menu = document.createElement("div");
    menu.className = "fav-context-menu";

    function makeMenuBtn(iconClass, label, danger = false) {
        const btn = document.createElement("button");
        if (danger) btn.className = "danger";
        const icon = document.createElement("i");
        icon.className = iconClass;
        icon.style.cssText = "width:14px;font-size:12px;opacity:0.7;";
        const text = document.createTextNode(" " + label);
        btn.appendChild(icon);
        btn.appendChild(text);
        return btn;
    }

    const addBtn    = makeMenuBtn("fa-solid fa-plus",  t("ctx_add"));
    const editBtn   = makeMenuBtn("fa-solid fa-pen",   t("ctx_edit"));
    const removeBtn = makeMenuBtn("fa-solid fa-trash", t("ctx_remove"), true);

    menu.appendChild(addBtn);
    menu.appendChild(editBtn);
    menu.appendChild(removeBtn);
    document.body.appendChild(menu);
    activeContextMenu = menu;

    const mw = 130, mh = 80;
    const x = e.clientX + mw > window.innerWidth  ? e.clientX - mw : e.clientX;
    const y = e.clientY + mh > window.innerHeight ? e.clientY - mh : e.clientY;
    menu.style.left = x + "px";
    menu.style.top  = y + "px";

    requestAnimationFrame(() => {
        menu.offsetHeight;
        menu.classList.add("visible");
    });

    addBtn.addEventListener("click", e => {
        e.stopPropagation();
        closeContextMenu();
        openAddNewModal();
    });

    editBtn.addEventListener("click", e => {
        e.stopPropagation();
        closeContextMenu();
        openEditModal(favorite, list);
    });

    removeBtn.addEventListener("click", e => {
        e.stopPropagation();
        closeContextMenu();
        openConfirmationModal(anchor, favorite, list);
    });

    setTimeout(() => window.addEventListener("click", onClickOutsideMenu, { once: true }), 0);
    setTimeout(() => window.addEventListener("contextmenu", onClickOutsideMenu, { once: true }), 0);
}

function onClickOutsideMenu() {
    closeContextMenu();
}

function openConfirmationModal(anchor, favorite, list) {
    const modal = document.querySelector('[data-template="confirmation-modal"]')
                          .content.firstElementChild.cloneNode(true);
    document.body.appendChild(modal);
    applyTranslations(modal);
    showBackdrop();

    modal.querySelector(".confirmation-favicon").src = favorite.image;
    modal.querySelector(".confirmation-favicon").alt = favorite.title;
    modal.querySelector(".confirmation-title").innerText = `${t("fav_remove_btn")} "${favorite.title}"?`;

    setTimeout(() => {
        modal.classList.add("modal-active");

        modal.querySelector(".confirm-remove").addEventListener("click", e => {
            e.stopPropagation(); e.preventDefault();
            anchor.classList.add("fav-exit");
            hideBackdrop();
            modal.remove();
            setTimeout(() => {
                const newList = list.filter(f => f.link !== anchor.href);
                fillFavorites(newList);
            }, 270);
        });

        modal.querySelector(".confirm-cancel").addEventListener("click", e => {
            e.stopPropagation(); e.preventDefault();
            modal.classList.remove("modal-active");
            modal.classList.add("modal-disabled");
            hideBackdrop();
            setTimeout(() => modal.remove(), 300);
        });
    }, 50);
}

function openEditModal(favorite, list) {
    if (document.querySelector(".add-new-favorite-modal")) return;

    const modal = document.querySelector('[data-template="edit-favorite-modal"]')
                          .content.firstElementChild.cloneNode(true);
    document.body.appendChild(modal);
    applyTranslations(modal);
    showBackdrop();
    setTimeout(() => modal.classList.add("modal-active"), 10);

    const titleInput = modal.querySelector("#favorite-title");
    const linkInput  = modal.querySelector("#favorite-link");
    const imgEl      = modal.querySelector(".fav-modal-favicon-preview img");
    const fileInput  = modal.querySelector(".fav-modal-upload-btn input[type='file']");
    const [saveBtn, cancelBtn] = modal.querySelectorAll(".modal-buttons button");

    titleInput.value    = favorite.title;
    linkInput.value     = favorite.link;
    imgEl.src           = favorite.image;
    imgEl.style.opacity = "1";
    imgEl.style.width   = "32px";
    imgEl.style.height  = "32px";

    fileInput.addEventListener("change", async () => {
        if (!fileInput.files[0]) return;
        imgEl.src           = await fileToBase64(fileInput.files[0]);
        imgEl.style.opacity = "1";
        imgEl.style.width   = "32px";
        imgEl.style.height  = "32px";
    });

    linkInput.addEventListener("input", e => {
        clearTimeout(linkInput._faviconTimer);
        linkInput._faviconTimer = setTimeout(() => autoFavicon(e.target.value, imgEl), 600);
    });

    saveBtn.addEventListener("click", () => {
        let link = linkInput.value.trim();
        if (!link.startsWith("http")) link = "https://" + link;
        if (!link.endsWith("/")) link += "/";

        const updated = { title: titleInput.value.trim(), image: imgEl.src, link };
        const newList = list.map(f => f.link === favorite.link ? updated : f);
        fillFavorites(newList);
        removeAddModal(modal);
    });

    cancelBtn.addEventListener("click", () => removeAddModal(modal));

    setTimeout(() => window.addEventListener("click", outsideEditClick), 0);
    function outsideEditClick(e) {
        if (modal.contains(e.target)) return;
        removeAddModal(modal);
        window.removeEventListener("click", outsideEditClick);
    }
}

// ─── Add-new modal ───────────────────────────────────────────────────────────

export function initAddNewFavorite() {
    addNewBtn.addEventListener("click", openAddNewModal);
}

function openAddNewModal() {
    if (document.querySelector(".add-new-favorite-modal")) return;

        const modal = document.querySelector('[data-template="add-new-favorite-modal"]')
                              .content.firstElementChild.cloneNode(true);
        document.body.appendChild(modal);
        applyTranslations(modal);
        showBackdrop();
        setTimeout(() => modal.classList.add("modal-active"), 10);

        const titleInput = modal.querySelector("#favorite-title");
        const linkInput  = modal.querySelector("#favorite-link");
        const addBtn     = modal.querySelector(".modal-buttons button:first-child");
        const imgEl      = modal.querySelector(".fav-modal-favicon-preview img");
        const fileInput  = modal.querySelector(".fav-modal-upload-btn input[type='file']");

        function checkInputs() {
            const ready = titleInput.value.trim() && linkInput.value.trim();
            addBtn.classList.toggle("disabled-favorite-button", !ready);
        }

        titleInput.addEventListener("input", checkInputs);
        linkInput.addEventListener("input", e => {
            checkInputs();
            clearTimeout(linkInput._faviconTimer);
            linkInput._faviconTimer = setTimeout(() => autoFavicon(e.target.value, imgEl), 600);
        });

        fileInput.addEventListener("change", async () => {
            if (!fileInput.files[0]) return;
            imgEl.src = await fileToBase64(fileInput.files[0]);
            imgEl.style.opacity = "1";
            imgEl.style.width   = "32px";
            imgEl.style.height  = "32px";
        });

        const [addButton, cancelButton] = modal.querySelectorAll(".modal-buttons button");

        addButton.addEventListener("click", () => {
            if (addButton.classList.contains("disabled-favorite-button")) return;

            let link = linkInput.value.trim();
            if (!link.startsWith("http")) link = "https://" + link;
            if (!link.endsWith("/")) link += "/";

            const newEntry = { title: titleInput.value.trim(), image: imgEl.src, link };
            const current  = JSON.parse(localStorage.getItem("favorites")) ?? [];
            fillFavorites([...current, newEntry], true);
            removeAddModal(modal);
        });

        cancelButton.addEventListener("click", () => removeAddModal(modal));

        setTimeout(() => window.addEventListener("click", outsideModalClick), 0);
        function outsideModalClick(e) {
            if (modal.contains(e.target)) return;
            removeAddModal(modal);
            window.removeEventListener("click", outsideModalClick);
        }
}

// ─── Drag to reorder ─────────────────────────────────────────────────────────

let ghost          = null;
let dragSource     = null;
let placeholder    = null;
let longPressTimer = null;
let isDragging     = false;
let onDragMove     = null;
let onDragUp       = null;
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

    const article = anchor.querySelector("article");
    const rect    = article.getBoundingClientRect();

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

    onDragMove = onDragMoveLocal;
    onDragUp   = onDragUpLocal;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup",   onDragUp);
    document.addEventListener("touchmove", onDragMove, { passive: true });
    document.addEventListener("touchend",  onDragUp);
}

window.addEventListener("blur", cleanupDrag);

// ─── Utilities ───────────────────────────────────────────────────────────────

async function autoFavicon(rawUrl, imgEl) {
    let url = rawUrl.trim();
    if (!url) return;
    if (!url.startsWith("http")) url = "https://" + url;
    try {
        const origin = new URL(url).origin;
        imgEl.src = `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
    } catch {}
}

function fileToBase64(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

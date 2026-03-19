export function initSearch(settingsOpenFn) {
    const input = document.getElementById("search");

    function doSearch() {
        const q = input.value.trim();
        if (!q) return;
        const isUrl = q.includes(".") && !q.includes(" ");
        if (isUrl) {
            window.location.href = q.startsWith("http") ? q : "https://" + q;
        } else {
            const engine = localStorage.getItem("searchEngine") ?? "https://www.google.com/search?q=";
            window.location.href = engine + encodeURIComponent(q);
        }
    }

    document.querySelector(".search-btn").onclick = () => {
        const engine = localStorage.getItem("searchEngine") ?? "https://www.google.com/search?q=";
        window.location.href = engine + encodeURIComponent(input.value.trim());
    };

    input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

    document.addEventListener("keydown", e => {
        const active = document.activeElement;
        const typing = active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable;
        if (typing) return;
        if (document.querySelector(".modal-active")) return;
        if (settingsOpenFn()) return;
        if (e.key === "s" || e.key === "S" || e.key === " ") {
            e.preventDefault();
            input.focus();
        }
    });
}

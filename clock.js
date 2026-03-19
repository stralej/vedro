import { t } from "./i18n.js";

export function initClock() {
    const d = new Date();
    const use24    = JSON.parse(localStorage.getItem("checkboxes"))?.clock24  ?? true;
    const showSecs = JSON.parse(localStorage.getItem("checkboxes"))?.seconds  ?? true;
    buildTimeSpans(getTimeString(d.getHours(), d.getMinutes(), d.getSeconds(), use24, showSecs));
    tick();
    setInterval(tick, 500);
}

function buildTimeSpans(str) {
    const p = document.getElementById("time");
    p.innerHTML = "";
    const ampmMatch = str.match(/^(.*) (AM|PM)$/);
    const base = ampmMatch ? ampmMatch[1] : str;
    const ampm = ampmMatch ? ampmMatch[2] : null;

    for (const ch of base) {
        const span = document.createElement("span");
        span.className = ch === ":" ? "time-sep" : "time-digit";
        span.textContent = ch;
        p.appendChild(span);
    }
    if (ampm) {
        const span = document.createElement("span");
        span.className = "time-ampm";
        span.textContent = ampm;
        p.appendChild(span);
    }
}

function getTimeString(h, m, s, use24, showSecs) {
    if (use24) {
        const parts = showSecs ? [h, m, s] : [h, m];
        return parts.map(v => String(v).padStart(2, "0")).join(":");
    } else {
        const h12  = h % 12 || 12;
        const ampm = h < 12 ? "AM" : "PM";
        const parts = showSecs ? [h12, m, s] : [h12, m];
        return parts.map(v => String(v).padStart(2, "0")).join(":") + " " + ampm;
    }
}

function tick() {
    const p       = document.getElementById("time");
    const dateEl  = document.getElementById("date");
    const welcome = document.getElementById("welcome");
    const d   = new Date();
    const h   = d.getHours();
    const m   = d.getMinutes();
    const s   = d.getSeconds();
    const use24    = JSON.parse(localStorage.getItem("checkboxes"))?.clock24  ?? true;
    const showSecs = JSON.parse(localStorage.getItem("checkboxes"))?.seconds  ?? true;

    const newStr = getTimeString(h, m, s, use24, showSecs);
    const ampmMatch = newStr.match(/^(.*) (AM|PM)$/);
    const baseStr = ampmMatch ? ampmMatch[1] : newStr;
    const newAmpm = ampmMatch ? ampmMatch[2] : null;

    const spans  = [...p.querySelectorAll(".time-digit, .time-sep")];
    const ampmEl = p.querySelector(".time-ampm");

    if (spans.length !== baseStr.length || !!ampmEl !== !!newAmpm) {
        buildTimeSpans(newStr);
    } else {
        for (let i = 0; i < baseStr.length; i++) {
            if (spans[i].textContent !== baseStr[i]) {
                spans[i].textContent = baseStr[i];
                if (spans[i].classList.contains("time-digit")) {
                    spans[i].classList.remove("time-tick");
                    void spans[i].offsetWidth;
                    spans[i].classList.add("time-tick");
                }
            }
        }
        if (ampmEl && newAmpm && ampmEl.textContent !== newAmpm) {
            ampmEl.textContent = newAmpm;
        }
    }

    if (dateEl) {
        const days   = t("days").split(",");
        const months = t("months").split(",");
        dateEl.innerText = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    }

    if (h >= 3  && h < 12) welcome.innerText = t("welcome_morning");
    if (h >= 12 && h < 19) welcome.innerText = t("welcome_afternoon");
    if (h >= 19 && h < 23) welcome.innerText = t("welcome_evening");
    if (h >= 23 || h < 3)  welcome.innerText = t("welcome_night");
}

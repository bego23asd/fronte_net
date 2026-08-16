const API_URL = (window.API_URL || "https://netflix-trial-backend-u2dh.onrender.com").replace(/\/+$/, "");

const form = document.getElementById("trial-form");
const emailInput = document.getElementById("email");
const statusEl = document.getElementById("status");

// --- Cookie editor ---
const editorToggle = document.getElementById("editor-toggle");
const editorBody = document.getElementById("editor-body");
const cookieInput = document.getElementById("cookie-input");
const cookieClear = document.getElementById("cookie-clear");
const cookiePreview = document.getElementById("cookie-preview");

// Extract the nfvdid value from any of the paste formats.
function extractNfvdid(raw) {
  let text = (raw || "").trim();
  if (!text) return null;

  if (text.startsWith("[")) {
    try {
      const items = JSON.parse(text);
      for (const item of items) {
        if (item && item.name && String(item.name).toLowerCase() === "nfvdid") {
          return String(item.value);
        }
      }
    } catch (err) {
      return null;
    }
    return null;
  }

  if (text.startsWith("{")) {
    try {
      const obj = JSON.parse(text);
      if (obj && obj.name && String(obj.name).toLowerCase() === "nfvdid") {
        return String(obj.value);
      }
    } catch (err) {
      return null;
    }
  }

  if (text.toLowerCase().startsWith("cookie:")) {
    text = text.slice("cookie:".length).trim();
  }

  if (text.includes("=")) {
    for (const part of text.split(";")) {
      const pair = part.trim();
      if (!pair) continue;
      const eq = pair.indexOf("=");
      if (eq < 0) continue;
      const name = pair.slice(0, eq).trim();
      if (name.toLowerCase() === "nfvdid") return pair.slice(eq + 1).trim();
    }
    return null;
  }

  // Bare value
  return text;
}

// Live parse + preview, cookie-editor style.
function refreshCookiePreview() {
  const raw = cookieInput.value;
  if (!raw.trim()) {
    cookiePreview.textContent = "";
    cookiePreview.className = "editor-status";
    return;
  }

  const nfvdid = extractNfvdid(raw);
  if (nfvdid) {
    const short = nfvdid.length > 28 ? nfvdid.slice(0, 24) + "…" : nfvdid;
    cookiePreview.textContent = "✓ nfvdid to inject: " + short;
    cookiePreview.className = "editor-status ok";
  } else {
    cookiePreview.textContent =
      "✗ Hindi mabasa ang nfvdid — i-paste ang JSON array, isang Cookie line, o ang bare value.";
    cookiePreview.className = "editor-status err";
  }
}

cookieInput.addEventListener("input", refreshCookiePreview);

cookieClear.addEventListener("click", () => {
  cookieInput.value = "";
  refreshCookiePreview();
  cookieInput.focus();
});

function toggleEditor() {
  editorBody.classList.toggle("open");
  const chevron = document.getElementById("editor-chevron");
  if (editorBody.classList.contains("open")) {
    chevron.textContent = "▾";
  } else {
    chevron.textContent = "▸";
  }
}

editorToggle.addEventListener("click", toggleEditor);
editorToggle.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleEditor();
  }
});

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = "status " + (kind || "pending");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    setStatus("Please enter an email address.", "err");
    return;
  }

  const cookieRaw = cookieInput.value.trim();
  if (cookieRaw && !extractNfvdid(cookieRaw)) {
    setStatus("Paste a valid cookie (JSON array, Cookie line, or bare nfvdid).", "err");
    return;
  }

  const submitBtn = form.querySelector("button");
  submitBtn.disabled = true;
  setStatus("Sending...", "pending");

  const body = { email };
  if (cookieRaw) body.cookie = cookieRaw;

  try {
    const res = await fetch(`${API_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setStatus(data.message, data.ok ? "ok" : "err");
  } catch (err) {
    setStatus(
      "Failed to reach the backend at " + API_URL + ". Verify that (1) you can open " + API_URL + "/healthz and see {\"status\":\"ok\"}, (2) the backend is not sleeping (Render free plan) or still building, and (3) there is no mix of http/https.",
      "err"
    );
  } finally {
    submitBtn.disabled = false;
  }
});

const API_URL = (window.API_URL || "").replace(/\/+$/, "");

const form = document.getElementById("trial-form");
const emailInput = document.getElementById("email");
const statusEl = document.getElementById("status");

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

  if (!API_URL || API_URL === "https://netflix-trial-backend-u2dh.onrender.com") {
    setStatus("Backend URL not configured yet. Open /config.js and set window.API_URL.", "err");
    return;
  }

  const submitBtn = form.querySelector("button");
  submitBtn.disabled = true;
  setStatus("Sending...");

  try {
    const res = await fetch(`${API_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setStatus(data.message, data.ok ? "ok" : "err");
  } catch (err) {
    setStatus(
      "Failed to reach the backend at " + API_URL + ". Check that (1) config.js has your correct Render URL (no trailing slash), (2) you can open " + API_URL + "/healthz and see {\"status\":\"ok\"}, and (3) the backend is not sleeping (Render free plan) or still building.",
      "err"
    );
  } finally {
    submitBtn.disabled = false;
  }
});
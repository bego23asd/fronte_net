const API_URL = (window.API_URL || "https://netflix-trial-backend-u2dh.onrender.com").replace(/\/+$/, "");

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

  const submitBtn = form.querySelector("button");
  submitBtn.disabled = true;
  setStatus("Sending...", "pending");

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
      "Failed to reach the backend at " + API_URL + ". Verify that (1) you can open " + API_URL + "/healthz and see {\"status\":\"ok\"}, (2) the backend is not sleeping (Render free plan) or still building, and (3) there is no mix of http/https.",
      "err"
    );
  } finally {
    submitBtn.disabled = false;
  }
});

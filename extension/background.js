// Promo Tracker — service worker de l'extension.
// Seul point de contact avec le site : les pages des boutiques passent par ici (pas de CORS, cookies de session inclus).

const SITE = "https://promo-rouge.vercel.app";
const CACHE_MS = 5 * 60 * 1000;
const cache = new Map(); // « store|titre » → { at, data }

async function api(path, init = {}) {
  const res = await fetch(`${SITE}${path}`, { credentials: "include", ...init });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { error: "login", loginUrl: `${SITE}/login` };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function setBadge(tabId, data) {
  if (tabId === undefined) return;
  const best = data && data.best;
  const text = best && best.discount > 0 ? `-${best.discount}%` : "";
  chrome.action.setBadgeText({ tabId, text });
  if (text) {
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#22c55e" });
    if (chrome.action.setBadgeTextColor) chrome.action.setBadgeTextColor({ tabId, color: "#04210f" });
  }
}

async function handle(msg, sender) {
  const tabId = sender.tab && sender.tab.id;

  if (msg.type === "lookup") {
    const key = `${msg.store}|${msg.title.toLowerCase()}`;
    const hit = cache.get(key);
    let data = hit && Date.now() - hit.at < CACHE_MS ? hit.data : null;
    if (!data) {
      const params = new URLSearchParams({ title: msg.title, store: msg.store });
      data = await api(`/api/extension/lookup?${params}`);
      cache.set(key, { at: Date.now(), data });
    }
    setBadge(tabId, data);
    return data;
  }

  if (msg.type === "toggle") {
    const result = await api("/api/extension/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: msg.title, store: msg.store }),
    });
    cache.delete(`${msg.store}|${msg.title.toLowerCase()}`);
    return result;
  }

  if (msg.type === "clear") {
    setBadge(tabId, null);
    return { ok: true };
  }

  return { error: "unknown" };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg, sender).then(sendResponse, (err) => sendResponse({ error: String((err && err.message) || err) }));
  return true; // réponse asynchrone
});

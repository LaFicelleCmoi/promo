// Promo Tracker — sur la page d'un jeu d'une boutique officielle, affiche le meilleur prix suivi par le site.
// Le panneau vit dans un Shadow DOM : ni la page ne le restyle, ni il ne restyle la page.

(() => {
  const HOST_ID = "promo-tracker-panel";

  const text = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  };
  const meta = (property) => {
    const el = document.querySelector(`meta[property="${property}"]`);
    return el ? el.getAttribute("content") || "" : "";
  };
  /** Titre de l'onglet ou balise og:title, sans le nom de la boutique ni les mentions de réduction. */
  const fromTitle = (value) => (value || "").split(/\s+[|–—]\s+|\s+-\s+(?=[^-]*$)/)[0];

  // Page d'un jeu : boutique reconnue par le domaine, page produit reconnue par le chemin.
  const STORES = [
    {
      key: "steam",
      host: /^store\.steampowered\.com$/,
      page: /^\/app\/\d+/,
      title: () => text("#appHubAppName") || text(".apphub_AppName") || meta("og:title"),
    },
    {
      key: "playstation",
      host: /^store\.playstation\.com$/,
      page: /\/(product|concept)\//,
      title: () => text('[data-qa="mfe-game-title#name"]'),
    },
    {
      key: "xbox",
      host: /^www\.xbox\.com$/,
      page: /\/games\/store\//i,
      title: () => text('[data-testid="ProductDetailsHeaderProductTitle"]') || text("h1"),
    },
    {
      key: "nintendo",
      host: /^www\.nintendo\.com$/,
      page: /\/(jeux|games|store\/products|spiele|giochi|juegos)\//i,
      title: () => fromTitle(document.title),
    },
    {
      key: "epic",
      host: /^store\.epicgames\.com$/,
      page: /\/p\//,
      title: () => text('[data-testid="pdp-title"]') || fromTitle(meta("og:title") || document.title),
    },
    {
      key: "gog",
      host: /^www\.gog\.com$/,
      page: /\/game\//,
      title: () => text(".productcard-basics__title") || fromTitle(document.title),
    },
    {
      key: "ubisoft",
      host: /^store\.ubisoft\.com$/,
      page: /\/[0-9a-f]{24}\.html/,
      title: () => text(".c-pdp-banner__product-name") || text("h1"),
    },
    {
      key: "googleplay",
      host: /^play\.google\.com$/,
      page: /^\/store\/apps\/details/,
      title: () => text('h1 [itemprop="name"]') || text("h1"),
    },
    {
      key: "appstore",
      host: /^apps\.apple\.com$/,
      page: /\/app\//,
      title: () => text("h1 .multiline-clamp__text") || fromTitle(meta("og:title")).replace(/^App\s+/, ""),
    },
  ];

  function clean(raw) {
    return (raw || "")
      .replace(/[™®©]/g, "")
      .replace(/\s+(sur|on|auf|en)\s+Steam$/i, "")
      .replace(/\s*-?\d{1,3}\s?%\s*(de réduction|off|discount|rabatt)?/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
  }

  const PLATFORMS = { pc: "PC", playstation: "PlayStation", xbox: "Xbox", switch: "Switch", mobile: "Mobile" };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Attend que la page (souvent une appli monopage) affiche le titre, et qu'il diffère du jeu précédent. */
  async function readTitle(store, previous) {
    for (let i = 0; i < 30; i++) {
      const title = clean(store.title());
      if (title.length >= 2 && (title !== previous || i >= 6)) return title;
      await wait(350);
    }
    return "";
  }

  const fmt = (value, currency) =>
    value === 0
      ? "Gratuit"
      : new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format(value);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const STYLE = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .panel, .pill { font: 13px/1.4 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #e2e8f0; }
    .panel { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; width: 330px; max-width: calc(100vw - 32px);
      background: rgba(20, 24, 33, .97); border: 1px solid #262d3d; border-radius: 16px; overflow: hidden;
      box-shadow: 0 24px 60px -12px rgba(0,0,0,.75), 0 0 0 1px rgba(124,92,255,.08); backdrop-filter: blur(12px);
      animation: pt-in .25s ease-out; }
    @keyframes pt-in { from { opacity: 0; transform: translateY(10px) scale(.98); } }
    @media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
    .head { display: flex; align-items: center; gap: 8px; padding: 10px 10px 10px 14px; border-bottom: 1px solid #262d3d; }
    .logo { font-weight: 900; font-size: 14px; letter-spacing: -.01em; color: #fff; text-decoration: none; }
    .logo b { color: #917aff; }
    .spacer { flex: 1; }
    .icon { all: unset; cursor: pointer; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 7px; color: #8b93a7; }
    .icon:hover { background: #1c2230; color: #fff; }
    .icon:focus-visible, .btn:focus-visible, a:focus-visible { outline: 2px solid #7c5cff; outline-offset: 2px; }
    .body { padding: 14px; }
    .game { font-size: 12px; color: #8b93a7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 8px; }
    .verdict { border-radius: 12px; padding: 12px; background: #1c2230; border: 1px solid #262d3d; }
    .verdict.good { background: rgba(34,197,94,.1); border-color: rgba(34,197,94,.35); }
    .verdict.cheaper { background: rgba(124,92,255,.12); border-color: rgba(124,92,255,.4); }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #8b93a7; font-weight: 600; }
    .price { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
    .price strong { font-size: 24px; font-weight: 900; color: #22c55e; letter-spacing: -.02em; }
    .price s { color: #8b93a7; font-size: 12px; }
    .tag { display: inline-block; border-radius: 6px; background: #22c55e; color: #04210f; font-weight: 900; font-size: 11px; padding: 1px 6px; }
    .where { margin-top: 2px; color: #cbd5e1; }
    .where a { color: #fff; font-weight: 700; }
    .low { margin: 10px 0 0; font-size: 12px; color: #cbd5e1; }
    .low b { color: #fff; }
    ul { list-style: none; margin: 12px 0 0; padding: 0; border-top: 1px solid #262d3d; }
    li a { display: flex; align-items: center; gap: 8px; padding: 7px 2px; text-decoration: none; color: #e2e8f0; border-bottom: 1px solid #1c2230; }
    li a:hover .name { color: #c4b5fd; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .name { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #fff; font-weight: 600; font-size: 12px; line-height: 1.3; }
    .store { display: flex; align-items: center; gap: 5px; white-space: nowrap; overflow: hidden; color: #8b93a7; font-size: 11px; }
    .dot { width: 7px; height: 7px; border-radius: 99px; flex: none; }
    .here { font-size: 10px; font-weight: 700; color: #c4b5fd; background: rgba(124,92,255,.18); border-radius: 5px; padding: 1px 5px; }
    .amount { font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; }
    .disc { width: 38px; text-align: right; color: #22c55e; font-weight: 700; font-size: 12px; }
    .empty { color: #cbd5e1; margin: 0; }
    .muted { color: #8b93a7; font-size: 12px; margin: 6px 0 0; }
    .actions { display: flex; gap: 8px; margin-top: 12px; }
    .btn { all: unset; box-sizing: border-box; cursor: pointer; flex: 1; text-align: center; border-radius: 10px; padding: 9px 10px;
      font-weight: 700; font-size: 13px; border: 1px solid #262d3d; background: #1c2230; color: #fff; text-decoration: none; }
    .btn:hover { border-color: #7c5cff; }
    .btn.primary { background: #7c5cff; border-color: #7c5cff; }
    .btn.primary:hover { background: #917aff; }
    .btn.on { background: rgba(236,72,153,.15); border-color: rgba(236,72,153,.5); color: #f9a8d4; }
    .btn[disabled] { opacity: .6; cursor: default; }
    .note { margin: 10px 0 0; font-size: 11px; color: #8b93a7; text-align: center; }
    .note a { color: #c4b5fd; }
    .skeleton { height: 70px; border-radius: 12px; background: linear-gradient(90deg, #1c2230 25%, #262d3d 50%, #1c2230 75%);
      background-size: 200% 100%; animation: pt-shine 1.2s linear infinite; }
    @keyframes pt-shine { to { background-position: -200% 0; } }
    .pill { all: unset; position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; cursor: pointer; display: flex; align-items: center; gap: 8px;
      padding: 8px 14px; border-radius: 999px; background: rgba(20,24,33,.97); border: 1px solid #262d3d; box-shadow: 0 12px 30px -8px rgba(0,0,0,.7);
      font: 700 13px/1 Inter, ui-sans-serif, system-ui, sans-serif; color: #fff; }
    .pill:hover { border-color: #7c5cff; }
    .pill b { color: #917aff; }
    .pill .amount { color: #22c55e; }
  `;

  let state = { store: null, title: "", data: null, error: null, loading: false, collapsed: false, busy: false };
  let root = null;

  function mount() {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = HOST_ID;
      document.documentElement.appendChild(host);
      root = host.attachShadow({ mode: "open" });
    }
    return root;
  }

  function unmount() {
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
    root = null;
  }

  function offerRow(o) {
    return `<li><a href="${esc(o.url)}" target="_blank" rel="noopener">
      <span class="info">
        <span class="name" title="${esc(o.title)}">${esc(o.title)}</span>
        <span class="store"><span class="dot" style="background:${esc(o.color)}"></span>${esc(o.store)}${
          o.samePlatform ? "" : ` · ${esc(PLATFORMS[o.platform] || o.platform)}`
        }${o.current ? ' <span class="here">ici</span>' : ""}</span>
      </span>
      <span class="amount">${esc(fmt(o.price, o.currency))}</span>
      <span class="disc">${o.discount > 0 ? `-${o.discount}%` : ""}</span>
    </a></li>`;
  }

  function verdict(d) {
    const best = d.best;
    if (!best) return "";
    const approx =
      best.currency !== "EUR" && best.eur !== null
        ? ` <span class="muted">(≈ ${esc(fmt(best.eur, "EUR"))})</span>`
        : "";
    const price = `<div class="price"><strong>${esc(fmt(best.price, best.currency))}</strong>${
      best.normal && best.normal > best.price ? `<s>${esc(fmt(best.normal, best.currency))}</s>` : ""
    }${best.discount > 0 ? `<span class="tag">-${best.discount}%</span>` : ""}</div>`;
    if (best.current) {
      return `<div class="verdict good"><div class="label">✓ Meilleur prix suivi : c'est ici</div>${price}${approx}</div>`;
    }
    return `<div class="verdict cheaper"><div class="label">Moins cher ailleurs</div>${price}${approx}
      <div class="where">sur <a href="${esc(best.url)}" target="_blank" rel="noopener">${esc(best.store)}</a></div></div>`;
  }

  function render() {
    const r = mount();
    const d = state.data;

    if (state.collapsed) {
      const best = d && d.best;
      r.innerHTML = `<style>${STYLE}</style><button class="pill" type="button" aria-label="Ouvrir Promo Tracker">
        <span><b>Promo</b>Tracker</span>${best ? `<span class="amount">${esc(fmt(best.price, best.currency))}</span>` : ""}</button>`;
      r.querySelector(".pill").addEventListener("click", () => setCollapsed(false));
      return;
    }

    let body;
    if (state.loading) {
      body = `<p class="game">${esc(state.title)}</p><div class="skeleton" aria-label="Recherche du meilleur prix…"></div>`;
    } else if (state.error) {
      body = `<p class="empty">Promo Tracker est injoignable pour le moment.</p><p class="muted">${esc(state.error)}</p>`;
    } else if (d) {
      const tracked = d.tracked === true;
      const lowest =
        d.lowestEur !== null && d.lowestEur !== undefined
          ? `<p class="low">Plus bas prix observé : <b>${esc(fmt(d.lowestEur, "EUR"))}</b></p>`
          : "";
      const list = d.offers.length
        ? `<ul>${d.offers.slice(0, 5).map(offerRow).join("")}</ul>`
        : `<p class="empty">Pas de promo en cours pour ce jeu sur les boutiques suivies.</p>
           <p class="muted">Suis-le : tu recevras une notification dès qu'il passe en promo.</p>`;
      body = `<p class="game" title="${esc(d.query)}">${esc(d.query)}</p>${verdict(d)}${lowest}${list}
        <div class="actions">
          <button class="btn ${tracked ? "on" : "primary"}" type="button" data-action="track" ${state.busy ? "disabled" : ""}>
            ${tracked ? "♥ Suivi" : "♡ Suivre ce jeu"}</button>
          <a class="btn" href="${esc(d.searchUrl)}" target="_blank" rel="noopener">Voir le comparatif</a>
        </div>
        ${d.user ? "" : `<p class="note"><a href="${esc(d.loginUrl)}" target="_blank" rel="noopener">Connecte-toi</a> pour suivre des jeux et recevoir les alertes.</p>`}`;
    } else {
      body = "";
    }

    r.innerHTML = `<style>${STYLE}</style>
      <section class="panel" role="dialog" aria-label="Promo Tracker : meilleur prix">
        <div class="head">
          <a class="logo" href="https://promo-rouge.vercel.app" target="_blank" rel="noopener"><b>Promo</b>Tracker</a>
          <span class="spacer"></span>
          <button class="icon" type="button" data-action="collapse" aria-label="Réduire">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg></button>
          <button class="icon" type="button" data-action="close" aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="body">${body}</div>
      </section>`;

    r.querySelector('[data-action="collapse"]').addEventListener("click", () => setCollapsed(true));
    r.querySelector('[data-action="close"]').addEventListener("click", unmount);
    const track = r.querySelector('[data-action="track"]');
    if (track) track.addEventListener("click", toggleTrack);
  }

  function setCollapsed(value) {
    state.collapsed = value;
    try {
      chrome.storage.local.set({ collapsed: value });
    } catch (_) {
      // extension rechargée : l'état n'est simplement pas mémorisé
    }
    render();
  }

  async function send(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (err) {
      return { error: "Extension mise à jour : recharge la page." };
    }
  }

  async function toggleTrack() {
    if (!state.data || state.busy) return;
    if (!state.data.user) {
      window.open(state.data.loginUrl, "_blank", "noopener");
      return;
    }
    state.busy = true;
    render();
    const res = await send({ type: "toggle", title: state.data.query, store: state.store.key });
    state.busy = false;
    if (res && res.error === "login") {
      state.data.user = null;
    } else if (res && !res.error) {
      state.data.tracked = res.inWishlist;
    }
    render();
  }

  let lastUrl = "";
  let lastTitle = "";
  let run = 0;

  async function check() {
    const id = ++run;
    const store = STORES.find((s) => s.host.test(location.hostname));
    if (!store || !store.page.test(location.pathname)) {
      lastTitle = "";
      unmount();
      send({ type: "clear" });
      return;
    }

    const title = await readTitle(store, lastTitle);
    if (id !== run) return; // une navigation plus récente a pris le relais
    if (!title) return;
    lastTitle = title;

    state = { ...state, store, title, data: null, error: null, loading: true, busy: false };
    render();
    const res = await send({ type: "lookup", title, store: store.key });
    if (id !== run) return;
    state.loading = false;
    if (!res || res.error) state.error = (res && res.error) || "Réponse vide";
    else state.data = res;
    render();
  }

  // Les boutiques sont des applis monopages : on surveille les changements d'adresse.
  function watch() {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    check();
  }

  try {
    chrome.storage.local.get("collapsed", (v) => {
      state.collapsed = Boolean(v && v.collapsed);
      watch();
    });
  } catch (_) {
    watch();
  }
  setInterval(watch, 800);
})();

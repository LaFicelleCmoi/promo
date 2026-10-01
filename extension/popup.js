// Promo Tracker — menu de l'extension : compte, wishlist en promo et promos du moment.

const SITE = "https://promo-rouge.vercel.app";

const fmt = (value, currency) =>
  value === 0
    ? "Gratuit"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency || "EUR" }).format(value);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") node.textContent = v;
    else if (k === "style") node.setAttribute("style", v);
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function dealItem(d) {
  return el("li", {}, [
    el("a", { href: d.url, target: "_blank", rel: "noopener" }, [
      el("span", { class: "thumb", style: d.image ? `background-image:url("${encodeURI(d.image)}")` : "" }),
      el("span", { class: "info" }, [
        el("span", { class: "title", text: d.title, title: d.title }),
        el("span", { class: "store" }, [el("span", { class: "dot", style: `background:${d.color}` }), d.store]),
      ]),
      el("span", { class: "price" }, [
        el("strong", { text: fmt(d.price, d.currency) }),
        d.discount > 0 ? el("span", { class: "tag", text: `-${d.discount}%` }) : null,
      ]),
    ]),
  ]);
}

function renderAccount(account) {
  const box = document.getElementById("account");
  box.replaceChildren();
  if (!account) {
    box.append(
      el("div", { class: "card" }, [
        el("span", { class: "who" }, [
          el("strong", { text: "Suis tes jeux préférés" }),
          el("span", { text: "Connecte-toi pour suivre un jeu en un clic depuis les boutiques." }),
        ]),
      ]),
      el("a", { class: "cta", href: `${SITE}/login`, target: "_blank", rel: "noopener", text: "Se connecter" }),
    );
    return;
  }
  const count = account.wishlistCount;
  box.append(
    el("a", { class: "card", href: `${SITE}/wishlist`, target: "_blank", rel: "noopener" }, [
      el("span", { class: "avatar", text: (account.name || "?").slice(0, 1).toUpperCase() }),
      el("span", { class: "who" }, [
        el("strong", { text: account.name }),
        el("span", {
          text: count ? `${count} jeu${count > 1 ? "x" : ""} suivi${count > 1 ? "s" : ""}` : "Aucun jeu suivi",
        }),
      ]),
      el("span", { text: "›" }),
    ]),
  );
  if (account.wishlistDeals.length) {
    document.getElementById("wishlist").hidden = false;
    document.getElementById("wishlist-list").replaceChildren(...account.wishlistDeals.map(dealItem));
  }
}

async function load() {
  const top = document.getElementById("top");
  try {
    const res = await fetch(`${SITE}/api/extension/popup`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAccount(data.account);
    top.replaceChildren(...data.top.map(dealItem));
  } catch (err) {
    top.replaceChildren(el("li", { class: "error", text: "Promo Tracker est injoignable pour le moment." }));
  }
}

document.getElementById("search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = document.getElementById("q").value.trim();
  chrome.tabs.create({ url: q ? `${SITE}/?q=${encodeURIComponent(q)}#resultats` : SITE });
});

load();

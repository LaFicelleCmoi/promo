"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestNotification } from "@/app/notifications/actions";
import { toast } from "@/components/Toaster";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

/** Active / désactive les notifications système sur cet appareil. */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus(ios && !standalone ? "ios-install" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    registration()
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const result = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
      if (!result.ok) throw new Error(result.error);
      setStatus("on");
      toast("Notifications activées sur cet appareil");
    } catch {
      toast("Impossible d'activer les notifications, réessaie.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      toast("Notifications désactivées sur cet appareil", { tone: "info" });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const { ok } = await sendTestNotification();
    setBusy(false);
    if (!ok) toast("La notification de test n'a pas pu être envoyée.", { tone: "error" });
  }

  const on = status === "on";

  return (
    <section
      id="notifications"
      aria-labelledby="notif-title"
      className={`card flex scroll-mt-24 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5 ${on ? "border-deal/40" : "border-accent/40"}`}
    >
      <span
        aria-hidden
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? "bg-deal/15 text-deal" : "bg-accent/15 text-accent"}`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <h2 id="notif-title" className="font-bold text-white">
          {on ? "Notifications activées" : "Reçois une notification dès qu'un jeu passe en promo"}
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          {status === "loading" && "Vérification de ton appareil…"}
          {status === "on" && "Cet appareil sera prévenu quand un jeu de ta wishlist passe sous ton prix cible."}
          {status === "off" &&
            "Notification système sur ton téléphone ou ton ordinateur, même site fermé. Aucun email."}
          {status === "denied" &&
            "Les notifications sont bloquées pour ce site : autorise-les dans les réglages du navigateur (icône à gauche de l'adresse), puis recharge la page."}
          {status === "ios-install" &&
            "Sur iPhone, ajoute d'abord le site à l'écran d'accueil (bouton Partager → « Sur l'écran d'accueil »), puis ouvre-le depuis l'icône."}
          {status === "unsupported" &&
            "Ce navigateur ne gère pas les notifications. Essaie avec Chrome, Edge, Firefox ou Safari."}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {status === "off" && (
          <button type="button" onClick={enable} disabled={busy} className="btn-primary w-full py-2.5 sm:w-auto">
            {busy ? "Activation…" : "Activer les notifications"}
          </button>
        )}
        {status === "on" && (
          <>
            <button type="button" onClick={test} disabled={busy} className="btn-ghost py-2.5">
              Tester
            </button>
            <button type="button" onClick={disable} disabled={busy} className="btn-ghost py-2.5 text-muted">
              Désactiver
            </button>
          </>
        )}
      </div>
    </section>
  );
}

import { ImageResponse } from "next/og";

export const alt = "Promo Tracker — le meilleur prix pour chaque jeu, sur toutes les plateformes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const stores = ["Steam", "PlayStation", "Xbox", "Nintendo eShop", "Epic", "GOG"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "radial-gradient(circle at 80% 0%, #3b2a8f 0%, #0b0d12 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
          <span style={{ color: "#917aff" }}>Promo</span>
          <span>Tracker</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>
            Le meilleur prix pour chaque jeu,
          </div>
          <div style={{ fontSize: 76, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, color: "#22c55e" }}>
            sur toutes les plateformes.
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 28, color: "#8b93a7", fontWeight: 700 }}>
          {stores.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

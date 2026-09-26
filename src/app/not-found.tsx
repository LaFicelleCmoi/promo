import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <p className="text-6xl font-black text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-muted">Cette page n&apos;existe pas ou a été déplacée. Les promos, elles, sont toujours là.</p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Link href="/" className="btn-primary py-3">
          Voir les promos
        </Link>
        <Link href="/?free=1" className="btn-ghost py-3">
          Jeux gratuits
        </Link>
      </div>
    </div>
  );
}

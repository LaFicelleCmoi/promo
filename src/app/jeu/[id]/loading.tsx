export default function Loading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Chargement de la promo">
      <div className="h-4 w-64 rounded bg-surface-2" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="space-y-6">
          <div className="card aspect-[460/215]" />
          <div className="card h-72" />
        </div>
        <div className="card h-96" />
      </div>
    </div>
  );
}

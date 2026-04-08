function LoadingCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.04)] ${className}`}
    >
      <div className="animate-pulse p-6">
        <div className="h-3 w-24 rounded-full bg-[var(--bg)]" />
        <div className="mt-4 h-8 w-44 rounded-2xl bg-[var(--bg)]" />
        <div className="mt-4 space-y-3">
          <div className="h-3 rounded-full bg-[var(--bg)]" />
          <div className="h-3 w-5/6 rounded-full bg-[var(--bg)]" />
          <div className="h-3 w-2/3 rounded-full bg-[var(--bg)]" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} className="min-h-[184px]" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <LoadingCard className="min-h-[360px]" />
        <LoadingCard className="min-h-[360px]" />
      </section>
    </div>
  );
}

const stats = [
  ["Total Today", "47", "text-slate-950"],
  ["Approved", "31", "text-green-600"],
  ["Rejected", "16", "text-red-600"],
  ["Pending Review", "4", "text-amber-600"],
];

export default function StatsBar() {
  return (
    <section className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:grid-cols-4 sm:px-6">
      {stats.map(([label, value, color]) => (
        <article key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-1 text-xl font-black sm:text-2xl ${color}`}>{value}</div>
        </article>
      ))}
    </section>
  );
}

export default function OverviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-zinc-800 rounded w-48" />
        <div className="h-9 bg-zinc-800 rounded w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="h-3 bg-zinc-800 rounded w-2/3" />
            <div className="h-8 bg-zinc-800 rounded w-1/2" />
            <div className="h-2 bg-zinc-800 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
      <div className="h-[420px] bg-zinc-900 border border-zinc-800 rounded-xl" />
    </div>
  );
}

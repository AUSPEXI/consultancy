export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-zinc-800/60 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-zinc-800/60 rounded-xl" />
        <div className="h-64 bg-zinc-800/60 rounded-xl" />
      </div>
      <div className="h-96 bg-zinc-800/60 rounded-xl" />
    </div>
  );
}

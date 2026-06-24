export default function ClientesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-40" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-full w-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
          >
            <div className="w-16 h-4 bg-gray-100 rounded" />
            <div className="flex-1 h-4 bg-gray-100 rounded" />
            <div className="w-32 h-4 bg-gray-100 rounded" />
            <div className="w-40 h-4 bg-gray-100 rounded" />
            <div className="w-24 h-4 bg-gray-100 rounded" />
            <div className="w-16 h-6 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

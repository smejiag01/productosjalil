export default function DetallePedidoLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-7 bg-gray-200 rounded w-48" />
          <div className="h-6 bg-gray-100 rounded-full w-24" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-lg w-28" />
          <div className="h-10 bg-gray-200 rounded-lg w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-40" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-40" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0"
          >
            <div className="flex-1 h-4 bg-gray-100 rounded" />
            <div className="w-16 h-4 bg-gray-100 rounded" />
            <div className="w-24 h-4 bg-gray-100 rounded" />
            <div className="w-20 h-4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

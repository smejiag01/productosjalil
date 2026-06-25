export default function ProductosLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 bg-gray-200 rounded w-36 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-44" />
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-full w-24" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

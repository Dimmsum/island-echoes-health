export default function RecommendationsLoading() {
  return (
    <div className="min-h-screen bg-[#F4F7F3]">
      {/* Navbar skeleton */}
      <div className="border-b border-[#E9EEE9] bg-white px-7 py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between animate-pulse">
          <div className="h-6 w-32 rounded-full bg-[#E9EEE9]" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#E9EEE9]" />
            <div className="h-8 w-8 rounded-full bg-[#E9EEE9]" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-7 py-8">
        <div className="h-6 w-48 rounded-full bg-[#E0E6E0] animate-pulse" />
        <div className="mt-2 h-3 w-96 max-w-full rounded-full bg-[#EEF2EE] animate-pulse" />

        {/* Location card skeleton */}
        <div className="mt-5 rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
          <div className="h-2.5 w-20 rounded-full bg-[#E9EEE9]" />
          <div className="mt-3 flex items-center gap-2">
            <div className="h-9 w-36 rounded-[10px] bg-[#E0E6E0]" />
            <div className="h-9 flex-1 rounded-[10px] bg-[#F0F4F0]" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {[56, 60, 60, 60].map((w, i) => (
              <div key={i} className="h-7 rounded-full bg-[#F0F4F0]" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Suggestions card skeleton */}
        <div className="mt-4 rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
          <div className="h-2.5 w-44 rounded-full bg-[#E9EEE9]" />
          <div className="mt-3 flex flex-wrap gap-2">
            {[150, 180, 130, 160].map((w, i) => (
              <div key={i} className="h-[58px] rounded-[14px] bg-[#F0F4F0]" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Results card skeleton */}
        <div className="mt-4 rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
          <div className="h-2.5 w-24 rounded-full bg-[#E9EEE9]" />
          <div className="mt-4 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-56 rounded-full bg-[#E0E6E0]" />
                <div className="h-3 w-72 max-w-full rounded-full bg-[#EEF2EE]" />
                <div className="h-3 w-40 rounded-full bg-[#F0F4F0]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

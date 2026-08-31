export default function PatientsLoading() {
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

      <div className="mx-auto max-w-[1200px] px-7 py-6">
        {/* Care circle band skeleton */}
        <div className="rounded-2xl border border-[#E9EEE9] bg-white px-5 py-[18px] animate-pulse">
          <div className="flex items-center gap-4">
            <div>
              <div className="h-2.5 w-24 rounded-full bg-[#E9EEE9]" />
              <div className="mt-1.5 h-5 w-36 rounded-full bg-[#E0E6E0]" />
            </div>
            <div className="mx-1 h-9 w-px bg-[#EBF0EB]" />
            <div className="flex items-center gap-2">
              {[80, 96, 88].map((w, i) => (
                <div key={i} className="h-9 rounded-full bg-[#E9EEE9]" style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>

        {/* Patient header skeleton */}
        <div className="mt-4 rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-[#E9EEE9]" />
            <div className="flex-1 space-y-2.5">
              <div className="h-5 w-48 rounded-full bg-[#E0E6E0]" />
              <div className="h-3 w-64 rounded-full bg-[#EEF2EE]" />
            </div>
          </div>
        </div>

        {/* Controls + tiles skeleton */}
        <div className="mt-4 h-14 rounded-2xl border border-[#E9EEE9] bg-white animate-pulse" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[110px] rounded-[14px] bg-[#F0F4F0] animate-pulse" />
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="mt-4 h-[260px] rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
          <div className="h-full w-full rounded-xl bg-[#F0F4F0]" />
        </div>

        {/* Labs / medications / wallet skeleton */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="h-40 rounded-2xl border border-[#E9EEE9] bg-white animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-24 rounded-2xl border border-[#E9EEE9] bg-white animate-pulse" />
            <div className="h-56 rounded-2xl border border-[#E9EEE9] bg-white animate-pulse" />
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="mt-4 h-72 rounded-2xl border border-[#E9EEE9] bg-white animate-pulse" />
      </div>
    </div>
  );
}

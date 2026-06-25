export default function HomeLoading() {
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

      <div className="mx-auto max-w-[1440px] px-7 py-6">
        {/* Care circle band skeleton */}
        <div className="mb-[18px] rounded-2xl border border-[#E9EEE9] bg-white px-5 py-[18px] animate-pulse">
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

        {/* 3-column grid skeleton */}
        <div
          className="gap-[18px]"
          style={{ display: "grid", gridTemplateColumns: "1fr 1.45fr 1fr" }}
        >
          {/* Appointments */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
            <div className="mb-[18px] flex items-center justify-between">
              <div className="h-2.5 w-28 rounded-full bg-[#E9EEE9]" />
              <div className="h-4 w-10 rounded-full bg-[#E9EEE9]" />
            </div>
            <div className="relative pl-[22px] space-y-5">
              <div className="absolute bottom-1.5 left-[5px] top-1.5 w-0.5 bg-[#EAF0EB]" />
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-3 w-24 rounded-full bg-[#E9EEE9]" />
                  <div className="mt-2 h-4 w-40 rounded-full bg-[#E0E6E0]" />
                  <div className="mt-1.5 h-3 w-28 rounded-full bg-[#EEF2EE]" />
                </div>
              ))}
            </div>
          </div>

          {/* Vitals */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
            <div className="mb-4">
              <div className="h-2.5 w-40 rounded-full bg-[#E9EEE9]" />
              <div className="mt-1.5 h-3 w-32 rounded-full bg-[#EEF2EE]" />
            </div>
            <div className="mb-3.5 h-[88px] rounded-[13px] bg-[#F0F4F0]" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[72px] rounded-[12px] bg-[#F0F4F0]" />
              ))}
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border border-[#E9EEE9] bg-white p-[22px] animate-pulse">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-2.5 w-16 rounded-full bg-[#E9EEE9]" />
              <div className="h-4 w-12 rounded-full bg-[#E9EEE9]" />
            </div>
            <div className="mb-4 h-14 w-full rounded-xl bg-[#F0F4F0]" />
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-[#F6FAF7]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

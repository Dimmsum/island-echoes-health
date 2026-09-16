export default function PatientsPortalLoading() {
  return (
    <div className="flex min-h-screen bg-[#f4f6f4]">
      <div className="w-[220px] flex-none bg-[#0f3d2b]" />

      <main className="min-w-0 flex-1 px-6 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 animate-pulse">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="h-5 w-40 rounded-full bg-[#e2e7e2]" />
              <div className="mt-2.5 h-8 w-32 rounded-full bg-[#e2e7e2]" />
              <div className="mt-2 h-3 w-64 rounded-full bg-[#e9ede9]" />
            </div>
            <div className="flex gap-2.5">
              <div className="h-10 w-56 rounded-[9px] bg-[#e2e7e2]" />
              <div className="h-10 w-[230px] rounded-[9px] bg-[#e2e7e2]" />
              <div className="h-10 w-28 rounded-[9px] bg-[#e2e7e2]" />
            </div>
          </div>

          {[0, 1].map((section) => (
            <div key={section}>
              <div className="mb-3 h-3 w-48 rounded-full bg-[#e2e7e2]" />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[260px] rounded-[14px] bg-white" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PatientChartLoading() {
  return (
    <div className="flex min-h-screen bg-[#f4f6f4]">
      <div className="w-[220px] flex-none bg-[#0f3d2b]" />

      <main className="min-w-0 flex-1">
        <div className="border-b border-[rgba(18,61,43,.08)] bg-white px-6 pt-5 sm:px-8">
          <div className="flex animate-pulse items-center gap-4 pb-5">
            <div className="h-[50px] w-[50px] shrink-0 rounded-2xl bg-[#e2e7e2]" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 rounded-full bg-[#e2e7e2]" />
              <div className="h-3 w-56 rounded-full bg-[#e9ede9]" />
            </div>
          </div>
          <div className="flex animate-pulse gap-6 pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-20 rounded-full bg-[#e2e7e2]" />
            ))}
          </div>
        </div>

        <div className="flex animate-pulse flex-col gap-3.5 px-6 py-6 sm:px-8 sm:py-6.5">
          <div className="h-[84px] rounded-[14px] bg-white" />
          <div className="h-[220px] rounded-[14px] bg-white" />
          <div className="h-[180px] rounded-[14px] bg-white" />
          <div className="h-[260px] rounded-[14px] bg-white" />
        </div>
      </main>
    </div>
  );
}

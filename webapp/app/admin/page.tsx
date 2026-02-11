import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClientAdmin } from "@/lib/supabase/admin";
import {
  PendingRequestsTable,
  type PendingRequest,
} from "./PendingRequestsTable";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/home");
  }

  const { data: clinicians, error } = await supabase.rpc("get_clinician_users");

  if (error) {
    console.error("Failed to fetch clinicians:", error);
  }

  const clinicianList = clinicians ?? [];

  const admin = createClientAdmin();
  const { data: pendingList, error: pendingError } = await admin
    .from("clinician_signup_requests")
    .select("id, email, full_name, license_number, specialty, institution_or_clinic_name, license_image_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (pendingError) {
    console.error("Failed to fetch pending clinician requests:", pendingError);
  }

  const pendingRows = pendingList ?? [];
  let pendingWithUrls: PendingRequest[] = [];
  if (pendingRows.length > 0) {
    pendingWithUrls = await Promise.all(
      pendingRows.map(
        async (row): Promise<PendingRequest> => {
          let license_image_url: string | null = null;
          if (row.license_image_path) {
            const { data } = await admin.storage
              .from("clinician-licenses")
              .createSignedUrl(row.license_image_path, 3600);
            license_image_url = data?.signedUrl ?? null;
          }
          return { ...row, license_image_url };
        }
      )
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#E6E15A]/25 blur-3xl" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[40rem] rounded-full bg-[#9CCB4A]/30 blur-3xl" />
        <div className="absolute -left-32 bottom-[-8rem] h-72 w-[36rem] rounded-full bg-[#9CCB4A]/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#1F5F2E]/5 to-transparent" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={140}
              height={50}
              priority
            />
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium text-slate-900 sm:gap-6">
            <Link href="/about" className="hover:text-[#1F5F2E]">
              About
            </Link>
            <Link href="/pricing" className="hover:text-[#1F5F2E]">
              Pricing
            </Link>
            <Link href="/home" className="hover:text-[#1F5F2E]">
              Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <input type="hidden" name="redirectTo" value="/" />
              <button type="submit" className="hover:text-[#1F5F2E]">
                Sign out
              </button>
            </form>
          </nav>
        </header>

        <section className="mt-16 flex w-full flex-1 flex-col md:mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1F5F2E]">
            Admin Portal
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Clinician Users
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Manage clinician and staff accounts.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-slate-900">
            Pending requests
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Review and approve or reject new clinician sign-ups.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
            <PendingRequestsTable requests={pendingWithUrls} />
          </div>

          <h2 className="mt-12 text-xl font-semibold text-slate-900">
            Approved clinicians
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
            {clinicianList.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No clinician users yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinicianList.map(
                    (row: {
                      id: string;
                      full_name: string | null;
                      email: string | null;
                      created_at: string;
                    }) => (
                      <tr
                        key={row.id}
                        className="transition hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {row.full_name ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {row.email ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

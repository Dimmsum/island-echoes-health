import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

// This patient's detail view now lives on /patients itself (the care-circle switcher
// selects which patient's data is shown), reusing the same
// GET /api/home/sponsored/:linkId endpoint. Redirect old links.
export default async function SponsoredPatientRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/patients?patient=${id}`);
}

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-20 text-slate-800">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Terms and Conditions</h1>
        <p className="text-sm text-slate-500">Island Echoes Health &mdash; Last updated: April 15, 2026</p>
      </div>

      <Section title="1. Acceptance of Terms">
        By accessing or using the website and services provided by Island Echoes Health
        (&ldquo;Services&rdquo;), you agree to be bound by these Terms and Conditions. If you do
        not agree, you should not use the Services.
      </Section>

      <Section title="2. Services Overview">
        Island Echoes Health provides integrative health, wellness, and educational services
        designed to support whole-person care. Services may include, but are not limited to,
        personalized consultations, care coordination, wellness programs, health education, and
        digital resources delivered through online or virtual platforms.
        <br /><br />
        Services are intended to support prevention, lifestyle improvement, and overall well-being,
        and may be offered to individuals locally or internationally, subject to applicable laws and
        provider availability.
        <br /><br />
        All Services are subject to availability and may be modified, updated, or discontinued at
        any time without prior notice.
      </Section>

      <Section title="3. Medical Disclaimer">
        The information and services provided by Island Echoes Health are for informational and
        wellness purposes only and are not intended as medical advice, diagnosis, or treatment.
      </Section>

      <Section title="4. User Responsibilities">
        You agree to provide accurate and complete information when required, use the Services only
        for lawful purposes, and not interfere with or disrupt the functionality, security, or
        accessibility of the website or Services.
      </Section>

      <Section title="5. Appointments and Payments">
        All appointments must be scheduled through the designated booking system and may require
        payment in advance. Fees for Services are subject to change at any time without notice.
        <br /><br />
        Failure to attend a scheduled appointment, including late arrival beyond a reasonable grace
        period, may result in forfeiture of payment.
      </Section>

      <Section title="6. Cancellation and Refund Policy">
        Cancellations must be made at least 24&ndash;48 hours in advance. Late cancellations or
        missed appointments may not be eligible for a refund.
        <br /><br />
        Refunds, if any, are issued at the discretion of Island Echoes Health unless otherwise
        required by law.
      </Section>

      <Section title="7. Privacy">
        Your use of the Services is also governed by the Island Echoes Health Privacy Policy. By
        using the Services, you consent to the collection, use, and storage of your information as
        described in that policy.
      </Section>

      <Section title="8. Intellectual Property">
        All content on this website, including but not limited to text, graphics, logos, program
        materials, and digital resources, is the property of Island Echoes Health and is protected
        by applicable intellectual property laws.
        <br /><br />
        You may not copy, reproduce, distribute, modify, or create derivative works without prior
        written permission.
      </Section>

      <Section title="9. Limitation of Liability">
        To the fullest extent permitted by law, Island Echoes Health shall not be liable for any
        indirect, incidental, or consequential damages arising from your use of the Services.
        <br /><br />
        Island Echoes Health makes no guarantees regarding specific results or outcomes.
      </Section>

      <Section title="10. Third-Party Links">
        The website may contain links to third-party websites or resources. Island Echoes Health is
        not responsible for the content, accuracy, or practices of any third-party sites and does
        not endorse them.
      </Section>

      <Section title="11. Modifications to Terms">
        Island Echoes Health reserves the right to update or modify these Terms and Conditions at
        any time. Changes will be effective immediately upon posting. Continued use of the Services
        after changes are posted constitutes your acceptance of those changes.
      </Section>

      <Section title="12. Governing Law">
        These Terms and Conditions are governed by and construed in accordance with the laws of the
        United States of America, without regard to conflict of law principles.
      </Section>

      <Section title="13. Contact Information">
        <span className="block">Island Echoes Health</span>
        <span className="block">
          Email:{' '}
          <a href="mailto:info@islandechoeshealth.com" className="text-emerald-700 underline">
            info@islandechoeshealth.com
          </a>
        </span>
        <span className="block">
          Website:{' '}
          <a
            href="https://islandechoeshealth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline"
          >
            islandechoeshealth.com
          </a>
        </span>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="text-sm leading-relaxed text-slate-700">{children}</p>
    </section>
  );
}

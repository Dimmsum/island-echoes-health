"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Kaushan_Script, Poppins } from "next/font/google";
import { Reveal } from "./components/landing/Reveal";
import { PhotoPlaceholder } from "./components/landing/PhotoPlaceholder";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "#care" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "#steps" },
  { label: "Contact", href: "#cta" },
];

const audienceCards = [
  {
    eyebrow: "For patients & families",
    title: "Know what's next, without chasing updates.",
    body: "Reminders, plain-language summaries, and one calm place to follow the plan of care.",
  },
  {
    eyebrow: "For clinicians",
    title: "Communication that fits real workflows.",
    body: "Structured updates and clear threads that keep the care team aligned without more noise.",
  },
  {
    eyebrow: "For organizations",
    title: "A shared story of each care journey.",
    body: "Trends, transparent costs, and a record that helps your team learn and adapt.",
  },
];

const steps = [
  {
    number: "STEP 01",
    title: "Join your care circle",
    body: "An invite from the clinic links patient, family, and clinicians into one private space.",
  },
  {
    number: "STEP 02",
    title: "Follow the plan of care",
    body: "Visits, medications, and next steps arrive as short summaries anyone can read.",
  },
  {
    number: "STEP 03",
    title: "Stay close from anywhere",
    body: "Ask a question, get a reply from the right person, and keep the family in the loop.",
  },
];

export default function Home() {
  const [showHeader, setShowHeader] = useState(false);

  useEffect(() => {
    const threshold = 80;
    const handleScroll = () => {
      setShowHeader(window.scrollY >= threshold);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`${poppins.variable} ${kaushan.variable} relative max-w-full overflow-x-hidden bg-[#0C3B1E] font-[family-name:var(--font-poppins)] text-[#F2F7EA] antialiased`}
    >
      <header
        className={`fixed inset-x-0 top-0 z-[70] border-b border-[#0C3B1E]/10 bg-white/95 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-7 px-5 py-3 sm:px-8">
          <Link href="/" className="flex flex-none items-center">
            <Image
              src="/island-echoes-health.svg"
              alt="Island Echoes Health"
              width={168}
              height={72}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav className="ml-auto hidden items-center gap-6 whitespace-nowrap md:flex lg:gap-8">
            {navLinks.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                className={
                  i === 0
                    ? "border-b-2 border-[#1F5F2E] pb-[3px] text-sm font-medium text-[#0C3B1E]"
                    : "text-sm text-[#0C3B1E]/65 transition-colors hover:text-[#1F5F2E]"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full border-[1.5px] border-[#0C3B1E]/25 px-5 py-2.5 text-sm font-medium text-[#0C3B1E] transition-colors hover:bg-[#0C3B1E]/[.06]"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-[#0C3B1E] px-[22px] py-[11px] text-sm font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-screen min-h-dvh items-end overflow-hidden">
        <Image
          src="/patient-doctor.png"
          alt=""
          fill
          priority
          className="object-cover object-top"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(9,45,23,.75)_0%,rgba(10,50,26,.5)_38%,rgba(12,59,30,.14)_72%,rgba(12,59,30,.05)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-[#0C3B1E]/0 to-[#0C3B1E]/70" />

        <Image
          src="/island-echoes-icon.svg"
          alt=""
          width={72}
          height={82}
          className="pointer-events-none absolute bottom-6 right-5 h-14 w-auto brightness-0 invert sm:right-8 sm:h-16"
        />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-28 sm:px-8">
          <Reveal className="max-w-[660px]">
            <h1 className="mb-5 text-balance text-[clamp(38px,5.4vw,72px)] font-bold leading-[1.02] tracking-[-0.03em] text-[#F7FBF0]">
              A calm way to stay connected through{" "}
              <span className="text-[#B8DE6F]">every stage of care.</span>
            </h1>
            <p className="mb-8 max-w-[520px] text-pretty text-[17.5px] leading-[1.65] text-[#F2F7EA]/[.86]">
              Secure messaging, clear updates, and coordinated support for
              patients, families, and clinicians — without the noise.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link
                href="/user"
                className="flex items-center gap-3 whitespace-nowrap rounded-full bg-[#B8DE6F] px-[30px] py-4 text-[15.5px] font-semibold text-[#0C3B1E] shadow-[0_18px_38px_-18px_rgba(184,222,111,.7)] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[3px]"
              >
                I am a User <span className="text-[17px]">&rarr;</span>
              </Link>
              <Link
                href="/clinician"
                className="whitespace-nowrap rounded-full border-[1.5px] border-[#F7FBF0]/55 px-[30px] py-4 text-[15.5px] font-medium text-[#F7FBF0] transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[3px] hover:bg-[#F7FBF0]/[.14]"
              >
                I am a Clinician
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="flex animate-[scrollHint_2s_ease-in-out_infinite] flex-col items-center gap-1.5 text-[#F2F7EA]/70">
            <span className="text-[11px] font-medium uppercase tracking-[0.22em]">
              Scroll to see more
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </section>

      <section
        id="care"
        className="relative overflow-hidden bg-[#F3F6EA] py-24"
      >
        <div className="pointer-events-none absolute -right-40 -top-16 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(76,122,50,.14),rgba(76,122,50,0)_70%)]" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="mb-12 max-w-[640px]">
            <p className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#4C7A32]">
              Who it&rsquo;s for
            </p>
            <h2 className="text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.14] tracking-[-0.02em] text-[#0C3B1E]">
              One thread, three points of view.
            </h2>
          </Reveal>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,270px),1fr))] gap-5">
            {audienceCards.map((card) => (
              <Reveal key={card.title}>
                <div className="h-full overflow-hidden rounded-3xl border border-[#0C3B1E]/10 bg-white shadow-[0_22px_44px_-34px_rgba(12,59,30,.45)] transition-all duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2 hover:shadow-[0_30px_54px_-30px_rgba(12,59,30,.5)]">
                  <div className="aspect-[16/10]">
                    <PhotoPlaceholder tone="light" />
                  </div>
                  <div className="px-[26px] pb-[30px] pt-[26px]">
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.19em] text-[#4C7A32]">
                      {card.eyebrow}
                    </p>
                    <h3 className="mb-3 text-xl font-semibold leading-[1.3] text-[#0C3B1E]">
                      {card.title}
                    </h3>
                    <p className="text-[14.5px] leading-[1.7] text-[#4A5A44]">
                      {card.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(165deg,#0C3B1E,#12482A_60%,#0C3B1E)] py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-12 px-5 sm:px-8">
          <Reveal>
            <p className="font-[family-name:var(--font-kaushan)] text-[clamp(32px,3.8vw,48px)] leading-[1.05] text-[#B8DE6F]">
              Better Care.
            </p>
            <h2 className="mb-5 mt-1 text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.03em] text-[#F7FBF0]">
              Together.
            </h2>
            <p className="mb-7 max-w-[440px] text-[16.5px] leading-[1.7] text-[#F2F7EA]/[.84]">
              Island Echoes Health helps care teams, patients, and families stay
              informed, supported, and connected — no matter the distance.
            </p>
            <div className="grid max-w-[440px] gap-4">
              {[
                "One thread per care journey, from admission to recovery at home.",
                "Translations and simple summaries for the whole family.",
                "Works on low bandwidth, so island clinics stay in the loop.",
              ].map((line) => (
                <div key={line} className="flex items-start gap-3.5">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#B8DE6F]/20 text-xs text-[#B8DE6F]">
                    ✓
                  </span>
                  <p className="text-[15px] leading-[1.6] text-[#F2F7EA]/[.88]">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
            <div className="grid gap-4">
              <div className="aspect-[3/4] overflow-hidden rounded-[20px] shadow-[0_30px_56px_-30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
                <PhotoPlaceholder tone="dark" />
              </div>
              <div className="aspect-square overflow-hidden rounded-[20px] shadow-[0_30px_56px_-30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
                <PhotoPlaceholder tone="dark" />
              </div>
            </div>
            <div className="grid animate-[floatUp_9s_ease-in-out_infinite] gap-4">
              <div className="aspect-square overflow-hidden rounded-[20px] shadow-[0_30px_56px_-30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
                <PhotoPlaceholder tone="dark" />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-[20px] shadow-[0_30px_56px_-30px_rgba(0,0,0,.6)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
                <PhotoPlaceholder tone="dark" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="steps" className="bg-[#F3F6EA] py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="mb-[52px] max-w-[640px]">
            <p className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-[0.22em] text-[#4C7A32]">
              How it works
            </p>
            <h2 className="mb-3.5 text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.15] tracking-[-0.02em] text-[#0C3B1E]">
              Three quiet steps between a question and an answer.
            </h2>
            <p className="max-w-[500px] text-[16.5px] leading-[1.65] text-[#4A5A44]">
              No new logins to remember, no chasing the ward for news.
            </p>
          </Reveal>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
            {steps.map((step) => (
              <Reveal key={step.number}>
                <div className="h-full rounded-[22px] bg-white p-[26px] shadow-[0_22px_42px_-32px_rgba(12,59,30,.4)] transition-transform duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-2">
                  <div className="mb-5 aspect-[16/10] overflow-hidden rounded-[14px]">
                    <PhotoPlaceholder tone="light" />
                  </div>
                  <p className="mb-2 text-[11.5px] font-semibold tracking-[0.2em] text-[#4C7A32]">
                    {step.number}
                  </p>
                  <h3 className="mb-2.5 text-[19px] font-semibold text-[#0C3B1E]">
                    {step.title}
                  </h3>
                  <p className="text-[14.5px] leading-[1.7] text-[#4A5A44]">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="relative overflow-hidden py-[104px]">
        <div className="absolute inset-0 opacity-[.34]">
          <PhotoPlaceholder tone="dark" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(12,59,30,.94),rgba(9,45,23,.9))]" />
        <Reveal className="relative mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] items-center gap-8 px-5 sm:px-8">
          <div>
            <h2 className="mb-4 text-[clamp(28px,3.6vw,46px)] font-bold leading-[1.12] tracking-[-0.03em] text-[#F7FBF0]">
              Bring your care team and families onto one calm thread.
            </h2>
            <p className="max-w-[460px] text-[16.5px] leading-[1.65] text-[#F2F7EA]/[.82]">
              Start with a single ward or clinic. We&rsquo;ll help you set it up
              in under a week.
            </p>
          </div>
          <div className="flex flex-wrap justify-start gap-3.5 lg:justify-end">
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-[#B8DE6F] px-[30px] py-4 text-[15.5px] font-semibold text-[#0C3B1E] transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[3px]"
            >
              Get Started
            </Link>
            <a
              href="mailto:hello@islandechoeshealth.com"
              className="whitespace-nowrap rounded-full border-[1.5px] border-[#F7FBF0]/50 px-[30px] py-4 text-[15.5px] font-medium text-[#F7FBF0] transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-[3px] hover:bg-[#F7FBF0]/[.14]"
            >
              Talk to us
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[#B8DE6F]/20 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-8 px-5 sm:px-8">
          <div>
            <p className="mb-2.5 text-sm font-bold tracking-[0.16em] text-[#F2F7EA]">
              ISLAND ECHOES HEALTH
            </p>
            <p className="text-[13.5px] leading-[1.7] text-[#F2F7EA]/60">
              Care that echoes across oceans.
            </p>
          </div>
          <div className="grid content-start gap-2.5">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#B8DE6F]">
              Product
            </p>
            <Link
              href="/user"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              For patients
            </Link>
            <Link
              href="/clinician"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              For clinicians
            </Link>
            <Link
              href="/about"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              For organizations
            </Link>
          </div>
          <div className="grid content-start gap-2.5">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#B8DE6F]">
              Company
            </p>
            <Link
              href="/about"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              About
            </Link>
            <Link
              href="#steps"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              Resources
            </Link>
            <a
              href="mailto:hello@islandechoeshealth.com"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              Contact
            </a>
          </div>
          <div className="grid content-start gap-2.5">
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#B8DE6F]">
              Trust
            </p>
            <Link
              href="/privacy"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[13.5px] text-[#F2F7EA]/70 hover:text-[#B8DE6F]"
            >
              Accessibility
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap justify-between gap-3 border-t border-[#B8DE6F]/[.14] px-5 pt-5 sm:px-8">
          <p className="text-[12.5px] text-[#F2F7EA]/50">
            &copy; 2026 Island Echoes Health
          </p>
          <p className="text-[12.5px] text-[#F2F7EA]/50">
            Built for island communities and the families who love them.
          </p>
        </div>
      </footer>
    </div>
  );
}

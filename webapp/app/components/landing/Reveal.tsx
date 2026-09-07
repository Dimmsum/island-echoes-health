"use client";

import { useEffect, useRef, useState } from "react";

export function Reveal({
  variant = "up",
  className = "",
  children,
}: {
  variant?: "up" | "scale";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform = variant === "scale" ? "scale-[1.04]" : "translate-y-8";

  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
        shown ? "opacity-100 translate-y-0 scale-100" : `opacity-0 ${hiddenTransform}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

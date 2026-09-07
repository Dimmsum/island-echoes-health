const TONES = {
  dark: "bg-gradient-to-br from-[#12482A] via-[#0C3B1E] to-[#08281530]",
  light: "bg-gradient-to-br from-[#E7EFD9] to-[#D7E6C0]",
} as const;

export function PhotoPlaceholder({
  tone = "dark",
  className = "",
}: {
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${TONES[tone]} ${className}`}>
      <div className="absolute -left-6 -top-10 h-32 w-32 rounded-full bg-[#B8DE6F]/20 blur-2xl" />
      <div className="absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-[#B8DE6F]/15 blur-2xl" />
    </div>
  );
}

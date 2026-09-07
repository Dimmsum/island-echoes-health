import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Kaushan_Script } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Island Echoes Health",
  description: "A calm, modern landing experience for Island Echoes Health.",
  icons: {
    icon: [
      { url: "/island-echoes-icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hanken.variable} ${ibmMono.variable} ${kaushan.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

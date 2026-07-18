import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
});
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "GlucoDose — Diabetes Companion",
  description: "Personalized carb ratio and insulin dose calculator.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${jakarta.variable} ${grotesk.variable} ${tajawal.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

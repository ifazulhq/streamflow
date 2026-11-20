import type { Metadata } from "next";
import { Toaster } from "sonner";
import NextAuthProvider from "@/components/NextAuthProvider";
import "./globals.css";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "StreamFlow | MNC-Grade Scalable Video Streaming Platform",
  description:
    "Resumable protocol-level video ingestion and multi-bitrate adaptive bitrate streaming (HLS).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#050505] text-slate-300 antialiased">
        <NextAuthProvider>
          <Toaster position="bottom-right" richColors theme="dark" />
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}

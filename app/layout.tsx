import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASF Digital Reporting Portal",
  description: "Secure operational reporting with structured, reviewable AI assistance.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

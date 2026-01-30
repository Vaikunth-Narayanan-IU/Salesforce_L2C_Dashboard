import type { Metadata } from "next";
import "./globals.css";

import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  title: "L2O Funnel Friction Explorer",
  description: "Explore Lead-to-Cash funnel friction using uploaded CSV data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-dvh">
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}


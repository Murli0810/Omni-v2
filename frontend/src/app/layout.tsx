import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/components/providers/QueryProvider";
import AlertsProvider from "@/components/providers/AlertsProvider";

export const metadata: Metadata = {
  title: "Omni — AI Mobile Urban Intelligence Platform",
  description:
    "Transforms public transport buses into mobile urban sensing units for road defect detection, vehicle density heatmaps, and instant incident escalation.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0EA5A0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="... text-slate-800 ...">
        <QueryProvider>
          <AlertsProvider>
            <AppShell>{children}</AppShell>
          </AlertsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

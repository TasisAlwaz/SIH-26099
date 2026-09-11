import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "BharatMaterials — National Material Intelligence Platform",
  description:
    "National Unified Material Master Platform for Central Public Sector Enterprises (CPSEs)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

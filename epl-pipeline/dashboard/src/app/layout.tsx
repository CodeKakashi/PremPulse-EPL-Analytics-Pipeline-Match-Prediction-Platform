import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPL Pipeline Dashboard",
  description:
    "Real-time data quality monitoring for the English Premier League data engineering pipeline",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}

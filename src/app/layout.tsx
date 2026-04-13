import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Money Tracker",
  description: "Aplikasi pencatat keuangan pribadi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>{children}</body>
    </html>
  );
}

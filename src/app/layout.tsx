import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "拠点明細まとめ",
  description: "顧客の契約状況を拠点×会社でExcel化するツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://karte.ceo-sherpa.com"),
  title: "社長カルテ Light｜経営課題の優先順位を5分で可視化する無料診断",
  description:
    "経営課題の「優先順位」を、約800名の経営者データと比較しながら5分で可視化。何から手をつけるべきかが見えてきます。無料・登録不要。",
  openGraph: {
    type: "website",
    title: "社長カルテ Light｜経営課題の優先順位を5分で可視化する無料診断",
    description:
      "経営課題の「優先順位」を、約800名の経営者データと比較しながら5分で可視化。何から手をつけるべきかが見えてきます。無料・登録不要。",
    url: "https://karte.ceo-sherpa.com/",
    siteName: "社長カルテ",
    images: [
      {
        url: "https://karte.ceo-sherpa.com/ogp.png",
        width: 1200,
        height: 630,
        alt: "社長カルテ Light"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "社長カルテ Light｜経営課題の優先順位を5分で可視化する無料診断",
    description:
      "経営課題の「優先順位」を、約800名の経営者データと比較しながら5分で可視化。無料・登録不要。",
    images: ["https://karte.ceo-sherpa.com/ogp.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreshScan — Food Freshness Detection",
  description: "AI-powered food freshness detection using computer vision and deep learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

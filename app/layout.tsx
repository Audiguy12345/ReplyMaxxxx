import "./globals.css";
import type { Metadata } from "next";

const siteUrl = "https://reply-maxxxx-62k41zld0-audiguy12345s-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ReplyMax",
  description: "Cold outreach that gets replies — and clients.",
  openGraph: {
    title: "ReplyMax",
    description: "Cold outreach that gets replies — and clients.",
    url: siteUrl,
    siteName: "ReplyMax",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReplyMax social preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplyMax",
    description: "Cold outreach that gets replies — and clients.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
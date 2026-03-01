import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const albraDisplay = localFont({
  src: [
    { path: "./fonts/AlbraDisplay-Light.woff", weight: "300", style: "normal" },
    { path: "./fonts/AlbraDisplay-LightItalic.woff", weight: "300", style: "italic" },
    { path: "./fonts/AlbraDisplay-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/AlbraDisplay-RegularItalic.woff", weight: "400", style: "italic" },
    { path: "./fonts/AlbraDisplay-Medium.woff", weight: "500", style: "normal" },
    { path: "./fonts/AlbraDisplay-MediumItalic.woff", weight: "500", style: "italic" },
    { path: "./fonts/AlbraDisplay-Semi.woff", weight: "600", style: "normal" },
    { path: "./fonts/AlbraDisplay-SemiItalic.woff", weight: "600", style: "italic" },
  ],
  variable: "--font-albra-display",
});

const albraSans = localFont({
  src: [
    { path: "./fonts/AlbraSans-Regular.woff", weight: "400", style: "normal" },
  ],
  variable: "--font-albra-sans",
});

export const metadata: Metadata = {
  title: "Neurow",
  description: "AI-powered life operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${albraDisplay.variable} ${albraSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

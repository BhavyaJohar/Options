import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Options Price Calculator | Black-Scholes & Binomial Models",
  description:
    "A modern options pricing tool built by Bhavya Johar. Calculate theoretical option prices using Black-Scholes and Binomial Tree models. Visualize payoffs, Greeks, and build custom strategies.",
  keywords: [
    "options pricing",
    "Black-Scholes calculator",
    "binomial tree model",
    "option payoff diagram",
    "Greeks",
    "financial modeling",
    "Bhavya Johar",
    "options strategies"
  ],
  authors: [{ name: "Bhavya Johar", url: "https://bhavyarjohar.com" }],
  creator: "Bhavya Johar",
  openGraph: {
    title: "Options Price Calculator | Black-Scholes & Binomial Models",
    description:
      "Interactive options pricing tool built by Bhavya Johar. Supports Black-Scholes and Binomial models with real-time diagrams and analysis.",
    url: "https://black-scholes-options-pricer.vercel.app/",
    siteName: "Options Price Calculator",
    type: "website"
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}

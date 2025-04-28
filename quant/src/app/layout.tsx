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
  title: "Options & Portfolio Analysis | Black-Scholes & Portfolio Metrics",
  description:
    "A modern financial analysis tool built by Bhavya Johar. Calculate theoretical option prices using Black-Scholes and Binomial Tree models. Analyze portfolio performance with metrics like Alpha, Beta, Sharpe Ratio, and Monte Carlo simulations.",
  keywords: [
    "options pricing",
    "Black-Scholes calculator",
    "binomial tree model",
    "option payoff diagram",
    "Greeks",
    "financial modeling",
    "portfolio analysis",
    "alpha beta analysis",
    "sharpe ratio calculator",
    "monte carlo simulation",
    "portfolio metrics",
    "Bhavya Johar",
    "options strategies"
  ],
  authors: [{ name: "Bhavya Johar", url: "https://bhavyarjohar.com" }],
  creator: "Bhavya Johar",
  openGraph: {
    title: "Options & Portfolio Analysis | Black-Scholes & Portfolio Metrics",
    description:
      "Interactive financial analysis tool built by Bhavya Johar. Features options pricing with Black-Scholes and Binomial models, plus comprehensive portfolio analysis with Alpha, Beta, Sharpe Ratio, and Monte Carlo simulations.",
    url: "https://bhavyas-options-pricing.vercel.app/",
    siteName: "Options & Portfolio Analysis",
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

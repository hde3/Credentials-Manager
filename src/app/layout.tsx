import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/context/VaultContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credentials Vault",
  description: "High-End Credentials Manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative">
        <div className="background-orb orb-one"></div>
        <div className="background-orb orb-two"></div>
        <VaultProvider>
          {children}
        </VaultProvider>
      </body>
    </html>
  );
}

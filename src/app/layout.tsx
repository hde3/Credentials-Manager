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
  icons: {
    icon: "/logo_2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        {/* Animated mesh background blobs */}
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        <div className="relative z-10 flex flex-col flex-1">
          <VaultProvider>
            {children}
          </VaultProvider>
        </div>
      </body>
    </html>
  );
}

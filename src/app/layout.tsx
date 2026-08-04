import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9eef7" },
    { media: "(prefers-color-scheme: dark)", color: "#05070f" },
  ],
};

/**
 * Applies the saved theme before first paint so there is no light-mode flash.
 * Uses the exact same rule as Sidebar.tsx: "light" -> light, anything else -> dark.
 * Sidebar remains the only place that writes to localStorage.
 */
const themeScript = `
(function(){try{
  var t = localStorage.getItem("theme");
  var c = document.documentElement.classList;
  if (t === "light") { c.remove("dark"); } else { c.add("dark"); }
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* Ambient background is handled by body::before in globals.css */}
        <div className="relative z-10 flex flex-col flex-1">
          <VaultProvider>
            {children}
          </VaultProvider>
        </div>
      </body>
    </html>
  );
}

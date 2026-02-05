

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { WordProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/sonner" 
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Plus",
  description: "Plataforma integral de gestion: seguridad, documentos, personal y reportes.",
  icons: {
    icon: "/logo/logo-solo-icono.png",
    apple: "/logo/logo-solo-icono.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GlobalPlus",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f2a4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WordProvider>
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </WordProvider>
      </body>
    </html>
  );
}

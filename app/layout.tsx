import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";
import HalloweenFX from '@/components/HalloweenFX';
import IosInstallHint from '@/components/IosInstallHint';

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "RUAG System",
  description: "Plataforma de Gestión de Personal",
  applicationName: "RUAG Digital",
  // Abre a pantalla completa al instalarla en iPhone, como la app Android.
  appleWebApp: { capable: true, title: "RUAG", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="antialiased">
        {children}
        {/* Decoración de temporada: sólo se activa en octubre */}
        <HalloweenFX />
        {/* iPhone: cómo instalar la web como app */}
        <IosInstallHint />
        <Toaster richColors position="top-center" closeButton /> 
      </body>
    </html>
  );
}

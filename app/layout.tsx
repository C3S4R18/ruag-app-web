import type { Metadata } from "next";
import { Toaster } from 'sonner';
import "./globals.css";
import HalloweenFX from '@/components/HalloweenFX';

export const metadata: Metadata = {
  title: "RUAG System",
  description: "Plataforma de Gestión de Personal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        {/* Decoración de temporada: sólo se activa en octubre */}
        <HalloweenFX />
        <Toaster richColors position="top-center" closeButton /> 
      </body>
    </html>
  );
}

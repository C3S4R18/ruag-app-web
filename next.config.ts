import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack infería la raíz del workspace como C:\Users\cesar (el padre),
  // y desde ahí @tailwindcss/postcss no encontraba 'tailwindcss'.
  // Fijarla al directorio del proyecto resuelve el import de globals.css.
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      // Agrega aquí tu IP local y el puerto (por defecto 3000)
      allowedOrigins: ["192.168.1.89:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;
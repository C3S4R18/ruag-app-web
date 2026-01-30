import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Agrega aquí tu IP local y el puerto (por defecto 3000)
      allowedOrigins: ["192.168.1.89:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;
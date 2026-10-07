import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Archivos de la ficha clínica: máximo 10 MB + margen del multipart
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;

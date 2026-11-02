/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit carga sus fuentes (.afm) por ruta de archivo en tiempo de ejecución;
  // si webpack lo empaqueta, esas rutas quedan rotas. Se deja fuera del bundle
  // para que Node lo resuelva directo desde node_modules.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

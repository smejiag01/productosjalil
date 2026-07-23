/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit carga sus fuentes (.afm) por ruta de archivo en tiempo de ejecución;
  // si webpack lo empaqueta, esas rutas quedan rotas. Se deja fuera del bundle
  // para que Node lo resuelva directo desde node_modules.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // --- INÍCIO DA AUTORIZAÇÃO ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Este é o seu hostname do Supabase Storage
        hostname: 'xydadlwcbtnmapycaenj.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**', // Permite todas as imagens públicas
      },
    ],
  },
  // --- FIM DA AUTORIZAÇÃO ---
};

export default nextConfig;
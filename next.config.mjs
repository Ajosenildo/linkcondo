/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xydadlwcbtnmapycaenj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Se ainda quiser tentar o multi-tenant sem middleware futuramente, usaria rewrites aqui
};

export default nextConfig;
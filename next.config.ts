/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 86400,
      deviceSizes: [640, 750, 828, 1080],
    },

    compress: true,
    // Remova configurações experimentais problemáticas
    webpack: (config: any) => {
      config.resolve.fallback = { 
        fs: false, 
        path: false,
        stream: false,
        crypto: false
      };
      return config;
    },
    env: {
      NEXT_PUBLIC_APPWRITE_URL: process.env.NEXT_PUBLIC_APPWRITE_URL || '',
      NEXT_PUBLIC_APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
      NEXT_APPWRITE_DB_ID: process.env.NEXT_APPWRITE_DB_ID || '',
      NEXT_APPWRITE_COLLECTION_ID: process.env.NEXT_APPWRITE_COLLECTION_ID || ''
    }
  };
  
  module.exports = nextConfig;
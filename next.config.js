/** @type {import('next').Config} */
const path = require('path')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jgdqutdifkcyiamdndmo.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Désactiver ESLint pendant le build pour éviter les erreurs non bloquantes
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Configuration des alias pour la résolution des modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), 'src'),
    }
    return config
  },
}

module.exports = nextConfig
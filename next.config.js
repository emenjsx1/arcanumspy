/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Garantir que CSS seja tratado corretamente
  experimental: {
    optimizeCss: false,
  },
  
  // Configuração do Webpack simplificada
  webpack: (config, { dev, isServer }) => {
    // Garantir que sharp só seja usado no servidor
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        sharp: false,
      }
      
      // Ignorar sharp no bundle do cliente
      if (Array.isArray(config.externals)) {
        config.externals.push('sharp')
      } else if (config.externals) {
        config.externals = [config.externals, 'sharp']
      } else {
        config.externals = ['sharp']
      }
    }
    
    return config
  },
}

module.exports = nextConfig

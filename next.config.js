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
  // OTIMIZAÇÕES DE PERFORMANCE
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // PROTEÇÃO CONTRA LOOPS DE REBUILD
  // Limita o número de páginas mantidas em memória e reduz rebuilds desnecessários
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 segundos
    pagesBufferLength: 2, // Manter apenas 2 páginas em memória
  },

  // Otimizações de compilação
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // OTIMIZAÇÕES DE PERFORMANCE
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Configuração do Webpack com proteções contra loops e otimizações
  webpack: (config, { dev, isServer }) => {
    // Garantir que sharp e mascarar-criativo só sejam usados no servidor
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
      config.externals = config.externals || []
      if (Array.isArray(config.externals)) {
        config.externals.push('sharp')
      } else {
        config.externals = [config.externals, 'sharp']
      }
    }
    
    // Otimizações para produção
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    if (dev && !isServer) {
      // Otimizar file watching para evitar loops infinitos
      config.watchOptions = {
        ...config.watchOptions,
        poll: false, // Desabilitar polling para melhor performance
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
          '**/.git/**',
          '**/tmp/**',
          '**/workers/**',
          '**/*.md', // Ignorar arquivos markdown
          '**/supabase/migrations/**', // Ignorar migrations (não precisam ser monitoradas)
        ],
        aggregateTimeout: 300, // Aguardar 300ms antes de reconstruir
      }

      // Prevenir rebuilds desnecessários
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
      }
    }
    return config
  },


  // Desabilitar Fast Refresh em modo debug (variável de ambiente)
  ...(process.env.DISABLE_FAST_REFRESH === 'true' && {
    reactStrictMode: false, // Desabilitar strict mode pode ajudar em alguns casos
  }),
}

module.exports = nextConfig

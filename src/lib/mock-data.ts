import { User, Offer, Category, Plan, Log, Ticket, Favorite } from './types'
import { CATEGORIES, PLANS } from './constants'

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    plan: 'pro',
    role: 'user',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    preferences: {
      favoriteNiches: ['Saúde', 'Fitness'],
      theme: 'light',
    },
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@example.com',
    plan: 'pro',
    role: 'user',
    status: 'active',
    createdAt: '2024-02-01T14:30:00Z',
    preferences: {
      favoriteNiches: ['Marketing', 'Negócios'],
      theme: 'dark',
    },
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@swipevault.com',
    plan: 'pro',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Pedro Costa',
    email: 'pedro@example.com',
    plan: 'free',
    role: 'user',
    status: 'active',
    createdAt: '2024-03-10T09:15:00Z',
  },
]

// Mock Offers
export const mockOffers: Offer[] = [
  {
    id: '1',
    title: 'Super Slim - Emagrecimento Rápido',
    bigIdea: 'Emagreça 10kg em 30 dias sem dieta',
    niche: 'Emagrecimento',
    country: 'Brasil',
    category: 'Nutra',
    categoryId: '1',
    status: 'active',
    originalUrl: 'https://example.com/super-slim',
    thumbnail: '/images/offers/super-slim.jpg',
    structure: {
      headline: 'Descubra o Segredo que Médicos Não Querem que Você Saiba',
      subheadline: 'Como uma mulher de 45 anos perdeu 23kg em apenas 8 semanas',
      hook: 'Você já tentou de tudo para emagrecer?',
      angles: ['Medo', 'Autoridade', 'Prova Social'],
      bullets: [
        'Perda de peso rápida e segura',
        'Sem dietas restritivas',
        'Resultados comprovados cientificamente',
        'Garantia de 60 dias',
      ],
      cta: 'Quero Emagrecer Agora',
    },
    analysis: {
      whyItConverts: 'Usa múltiplos gatilhos mentais: medo da obesidade, autoridade médica, prova social com depoimentos, e urgência com oferta limitada.',
      alternativeAngles: [
        'Foco em saúde ao invés de estética',
        'História pessoal do criador',
        'Comparação antes/depois',
      ],
      creatorNotes: 'Oferta muito testada no mercado brasileiro. Taxa de conversão média de 2.5%.',
    },
    creatives: [
      '/images/creatives/super-slim-1.jpg',
      '/images/creatives/super-slim-2.jpg',
    ],
    conversion: 2.5,
    vslSize: 'Médio (5-15 min)',
    format: 'longform',
    productType: 'Suplemento',
    views: 1250,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    title: 'Crypto Master - Curso de Trading',
    bigIdea: 'Aprenda a ganhar $5.000/mês com criptomoedas',
    niche: 'Criptomoedas',
    country: 'Brasil',
    category: 'Crypto',
    categoryId: '6',
    status: 'active',
    originalUrl: 'https://example.com/crypto-master',
    thumbnail: '/images/offers/crypto-master.jpg',
    structure: {
      headline: 'O Método que Transformou R$ 500 em R$ 50.000 em 6 Meses',
      subheadline: 'Estratégia simples de trading que qualquer pessoa pode aplicar',
      hook: 'Você está perdendo dinheiro enquanto outros lucram?',
      angles: ['Ganância', 'Prova Social', 'Urgência'],
      bullets: [
        'Estratégia passo a passo',
        'Acesso a comunidade exclusiva',
        'Suporte direto com o criador',
        'Garantia de 30 dias',
      ],
      cta: 'Quero Começar Agora',
    },
    analysis: {
      whyItConverts: 'Aproveita o interesse crescente por criptomoedas. Usa prova social forte com depoimentos de ganhos. Cria urgência com oferta limitada.',
      alternativeAngles: [
        'Foco em educação ao invés de ganhos',
        'História de superação',
        'Comparação com outros métodos',
      ],
    },
    creatives: [
      '/images/creatives/crypto-1.jpg',
    ],
    conversion: 1.8,
    vslSize: 'Longo (15-30 min)',
    format: 'video',
    productType: 'Curso Online',
    views: 890,
    createdAt: '2024-02-05T10:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: '3',
    title: 'Beauty Glow - Creme Anti-Idade',
    bigIdea: 'Pareça 10 anos mais jovem em 30 dias',
    niche: 'Beleza',
    country: 'Brasil',
    category: 'Beauty',
    categoryId: '7',
    status: 'active',
    originalUrl: 'https://example.com/beauty-glow',
    thumbnail: '/images/offers/beauty-glow.jpg',
    structure: {
      headline: 'Cientistas Descobrem Ingrediente que Reverte o Envelhecimento',
      subheadline: 'Mulheres de 50+ estão usando este creme e parecendo 30',
      hook: 'Você está cansada de ver rugas no espelho?',
      angles: ['Medo', 'Ciência', 'Prova Social'],
      bullets: [
        'Resultados em 30 dias',
        'Ingredientes naturais',
        'Testado dermatologicamente',
        'Garantia de 90 dias',
      ],
      cta: 'Quero Parecer Mais Jovem',
    },
    analysis: {
      whyItConverts: 'Foco no medo do envelhecimento combinado com autoridade científica. Prova social com antes/depois. Nicho muito lucrativo.',
      alternativeAngles: [
        'Foco em autoestima',
        'História pessoal',
        'Comparação com procedimentos caros',
      ],
    },
    creatives: [
      '/images/creatives/beauty-1.jpg',
      '/images/creatives/beauty-2.jpg',
      '/images/creatives/beauty-3.jpg',
    ],
    conversion: 3.2,
    vslSize: 'Médio (5-15 min)',
    format: 'advertorial',
    productType: 'Físico',
    views: 2100,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '4',
    title: 'PLR Empire - Biblioteca de Conteúdo',
    bigIdea: 'Acesso a milhares de produtos PLR prontos para vender',
    niche: 'Marketing',
    country: 'Brasil',
    category: 'PLR',
    categoryId: '2',
    status: 'active',
    originalUrl: 'https://example.com/plr-empire',
    thumbnail: '/images/offers/plr-empire.jpg',
    structure: {
      headline: 'A Biblioteca de Conteúdo que Gerou R$ 2 Milhões em Vendas',
      subheadline: 'Milhares de produtos PLR prontos para você revender',
      hook: 'Quer começar a vender online mas não sabe criar produtos?',
      angles: ['Facilidade', 'Valor', 'Oportunidade'],
      bullets: [
        'Mais de 10.000 produtos PLR',
        'Direitos de revenda incluídos',
        'Atualizações mensais',
        'Acesso vitalício',
      ],
      cta: 'Quero Acesso Agora',
    },
    analysis: {
      whyItConverts: 'Oferece valor massivo com biblioteca grande. Facilita entrada no mercado. Preço acessível com garantia.',
      alternativeAngles: [
        'Foco em resultados de clientes',
        'Comparação com criar do zero',
        'História de sucesso',
      ],
    },
    creatives: [
      '/images/creatives/plr-1.jpg',
    ],
    conversion: 2.1,
    vslSize: 'Curto (< 5 min)',
    format: 'longform',
    productType: 'E-book',
    views: 1560,
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: '5',
    title: 'Finance Pro - Sistema de Investimentos',
    bigIdea: 'Aumente sua renda passiva em 300%',
    niche: 'Finanças',
    country: 'Brasil',
    category: 'Finance',
    categoryId: '5',
    status: 'active',
    originalUrl: 'https://example.com/finance-pro',
    thumbnail: '/images/offers/finance-pro.jpg',
    structure: {
      headline: 'O Sistema que Transformou R$ 1.000 em R$ 100.000 em 2 Anos',
      subheadline: 'Estratégia de investimentos que funciona mesmo para iniciantes',
      hook: 'Você está deixando seu dinheiro perder valor na poupança?',
      angles: ['Ganância', 'Educação', 'Autoridade'],
      bullets: [
        'Sistema passo a passo',
        'Análises de mercado semanais',
        'Comunidade de investidores',
        'Suporte personalizado',
      ],
      cta: 'Quero Investir Melhor',
    },
    analysis: {
      whyItConverts: 'Aproveita desejo de liberdade financeira. Usa autoridade com números específicos. Prova social forte.',
      alternativeAngles: [
        'Foco em segurança',
        'Comparação com outros investimentos',
        'História pessoal',
      ],
    },
    creatives: [
      '/images/creatives/finance-1.jpg',
      '/images/creatives/finance-2.jpg',
    ],
    conversion: 1.5,
    vslSize: 'Longo (15-30 min)',
    format: 'longform',
    productType: 'Curso Online',
    views: 980,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
]

// Mock Favorites
export const mockFavorites: Favorite[] = [
  {
    id: '1',
    userId: '1',
    offerId: '1',
    offer: mockOffers[0],
    personalNotes: 'Ótima estrutura de copy. Vou adaptar para meu produto.',
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    offerId: '3',
    offer: mockOffers[2],
    createdAt: '2024-02-10T10:00:00Z',
  },
]

// Mock Logs
export const mockLogs: Log[] = [
  {
    id: '1',
    type: 'login',
    userId: '1',
    userEmail: 'joao@example.com',
    action: 'User logged in',
    ipAddress: '192.168.1.1',
    timestamp: '2024-03-15T10:00:00Z',
  },
  {
    id: '2',
    type: 'action',
    userId: '1',
    userEmail: 'joao@example.com',
    action: 'Viewed offer: Super Slim',
    timestamp: '2024-03-15T10:05:00Z',
  },
  {
    id: '3',
    type: 'admin_change',
    userId: '3',
    userEmail: 'admin@swipevault.com',
    action: 'Updated offer: Crypto Master',
    timestamp: '2024-03-14T15:30:00Z',
  },
]

// Mock Tickets
export const mockTickets: Ticket[] = [
  {
    id: '1',
    userId: '1',
    userEmail: 'joao@example.com',
    subject: 'Não consigo acessar minhas ofertas favoritas',
    message: 'Quando tento acessar a página de favoritos, recebo um erro 404.',
    status: 'open',
    priority: 'medium',
    responses: [],
    createdAt: '2024-03-15T09:00:00Z',
    updatedAt: '2024-03-15T09:00:00Z',
  },
  {
    id: '2',
    userId: '2',
    userEmail: 'maria@example.com',
    subject: 'Como fazer upgrade do plano?',
    message: 'Gostaria de fazer upgrade do plano Elite para ter acesso a todas as categorias.',
    status: 'resolved',
    priority: 'low',
    responses: [
      {
        id: '1',
        ticketId: '2',
        userId: '3',
        isAdmin: true,
        message: 'Olá Maria! Você pode fazer o upgrade diretamente na página de billing. Se precisar de ajuda, me avise!',
        createdAt: '2024-03-14T14:00:00Z',
      },
    ],
    createdAt: '2024-03-14T13:30:00Z',
    updatedAt: '2024-03-14T14:00:00Z',
  },
]

// Helper functions
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id)
}

export function getPlanByType(type: string): Plan | undefined {
  return PLANS.find(plan => plan.type === type)
}

export function getOffersByCategory(categoryId: string): Offer[] {
  return mockOffers.filter(offer => offer.categoryId === categoryId)
}

export function getFavoriteOffers(userId: string): Favorite[] {
  return mockFavorites.filter(fav => fav.userId === userId)
}


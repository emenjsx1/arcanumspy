import { Category, Plan } from './types'

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Nutra', slug: 'nutra', description: 'Suplementos e produtos naturais', icon: '💊', color: '#10b981', order: 1 },
  { id: '2', name: 'PLR', slug: 'plr', description: 'Private Label Rights', icon: '📚', color: '#3b82f6', order: 2 },
  { id: '3', name: 'E-commerce', slug: 'ecommerce', description: 'Produtos físicos e digitais', icon: '🛒', color: '#f59e0b', order: 3 },
  { id: '4', name: 'BizOpp', slug: 'bizopp', description: 'Oportunidades de negócio', icon: '💼', color: '#8b5cf6', order: 4 },
  { id: '5', name: 'Finance', slug: 'finance', description: 'Produtos financeiros', icon: '💰', color: '#06b6d4', order: 5 },
  { id: '6', name: 'Crypto', slug: 'crypto', description: 'Criptomoedas e blockchain', icon: '₿', color: '#f97316', order: 6 },
  { id: '7', name: 'Beauty', slug: 'beauty', description: 'Produtos de beleza', icon: '✨', color: '#ec4899', order: 7 },
  { id: '8', name: 'Sexual Health', slug: 'sexual-health', description: 'Saúde sexual', icon: '❤️', color: '#ef4444', order: 8 },
]

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    type: 'free',
    description: 'Perfeito para começar',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      offersVisible: 10,
      favorites: 5,
      categories: ['nutra', 'plr'],
      fullAnalysis: false,
    },
    features: [
      '10 ofertas por mês',
      '5 favoritos',
      'Acesso a 2 categorias',
      'Análise básica',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    type: 'pro',
    description: 'Para profissionais sérios',
    priceMonthly: 49,
    priceYearly: 490,
    limits: {
      offersVisible: 100,
      favorites: 50,
      categories: ['nutra', 'plr', 'ecommerce', 'bizopp', 'finance'],
      fullAnalysis: true,
    },
    features: [
      '100 ofertas por mês',
      '50 favoritos',
      'Acesso a 5 categorias',
      'Análise completa',
      'Suporte prioritário',
    ],
  },
]

// Lista completa de países do mundo (principais)
export const COUNTRIES = [
  // América do Norte
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  
  // América Central e Caribe
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicarágua', flag: '🇳🇮' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'PR', name: 'Porto Rico', flag: '🇵🇷' },
  { code: 'TT', name: 'Trinidad e Tobago', flag: '🇹🇹' },
  
  // América do Sul
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Equador', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolívia', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguai', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾' },
  { code: 'GY', name: 'Guiana', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'GF', name: 'Guiana Francesa', flag: '🇬🇫' },
  
  // Europa
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'IE', name: 'Irlanda', flag: '🇮🇪' },
  { code: 'NL', name: 'Países Baixos', flag: '🇳🇱' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'CH', name: 'Suíça', flag: '🇨🇭' },
  { code: 'AT', name: 'Áustria', flag: '🇦🇹' },
  { code: 'PL', name: 'Polônia', flag: '🇵🇱' },
  { code: 'CZ', name: 'República Tcheca', flag: '🇨🇿' },
  { code: 'GR', name: 'Grécia', flag: '🇬🇷' },
  { code: 'SE', name: 'Suécia', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴' },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlândia', flag: '🇫🇮' },
  { code: 'RU', name: 'Rússia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ucrânia', flag: '🇺🇦' },
  { code: 'RO', name: 'Romênia', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungria', flag: '🇭🇺' },
  { code: 'BG', name: 'Bulgária', flag: '🇧🇬' },
  { code: 'HR', name: 'Croácia', flag: '🇭🇷' },
  { code: 'RS', name: 'Sérvia', flag: '🇷🇸' },
  { code: 'SI', name: 'Eslovênia', flag: '🇸🇮' },
  { code: 'SK', name: 'Eslováquia', flag: '🇸🇰' },
  { code: 'LT', name: 'Lituânia', flag: '🇱🇹' },
  { code: 'LV', name: 'Letônia', flag: '🇱🇻' },
  { code: 'EE', name: 'Estônia', flag: '🇪🇪' },
  
  // África
  { code: 'ZA', name: 'África do Sul', flag: '🇿🇦' },
  { code: 'EG', name: 'Egito', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigéria', flag: '🇳🇬' },
  { code: 'KE', name: 'Quênia', flag: '🇰🇪' },
  { code: 'GH', name: 'Gana', flag: '🇬🇭' },
  { code: 'MA', name: 'Marrocos', flag: '🇲🇦' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'MZ', name: 'Moçambique', flag: '🇲🇿' },
  { code: 'TZ', name: 'Tanzânia', flag: '🇹🇿' },
  { code: 'ET', name: 'Etiópia', flag: '🇪🇹' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'CI', name: 'Costa do Marfim', flag: '🇨🇮' },
  { code: 'CM', name: 'Camarões', flag: '🇨🇲' },
  { code: 'TN', name: 'Tunísia', flag: '🇹🇳' },
  { code: 'DZ', name: 'Argélia', flag: '🇩🇿' },
  
  // Ásia
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonésia', flag: '🇮🇩' },
  { code: 'PH', name: 'Filipinas', flag: '🇵🇭' },
  { code: 'TH', name: 'Tailândia', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnã', flag: '🇻🇳' },
  { code: 'MY', name: 'Malásia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'PK', name: 'Paquistão', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'SA', name: 'Arábia Saudita', flag: '🇸🇦' },
  { code: 'AE', name: 'Emirados Árabes Unidos', flag: '🇦🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'TR', name: 'Turquia', flag: '🇹🇷' },
  { code: 'IR', name: 'Irã', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraque', flag: '🇮🇶' },
  { code: 'KZ', name: 'Cazaquistão', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbequistão', flag: '🇺🇿' },
  
  // Oceania
  { code: 'AU', name: 'Austrália', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nova Zelândia', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua Nova Guiné', flag: '🇵🇬' },
]

export const PRODUCT_TYPES = [
  'Suplemento',
  'Curso Online',
  'Software',
  'E-book',
  'Coaching',
  'Consultoria',
  'Físico',
  'Outro',
]

export const VSL_SIZES = [
  'Curto (< 5 min)',
  'Médio (5-15 min)',
  'Longo (15-30 min)',
  'Muito Longo (> 30 min)',
]

export const FORMATS = [
  'Longform',
  'Advertorial',
  'Quiz',
  'Shortform',
  'Video',
]

export const NICHES = [
  'Saúde',
  'Fitness',
  'Emagrecimento',
  'Beleza',
  'Finanças',
  'Marketing',
  'Negócios',
  'Educação',
  'Relacionamentos',
  'Desenvolvimento Pessoal',
  'Tecnologia',
  'Criptomoedas',
]

export const LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
]


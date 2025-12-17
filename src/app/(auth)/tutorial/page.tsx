"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Globe,
  Sparkles,
  Settings,
  CheckSquare,
  Link as LinkIcon,
  GraduationCap,
  Map,
  Phone,
  Users,
  Target,
  TrendingUp,
  Heart,
  Library,
  Image,
  Type,
  ShoppingCart,
  FileAudio,
  Maximize2,
  Eraser,
  CheckCircle2,
  EyeOff,
  Eye,
  Lock,
  Timer,
  Trophy,
  Wallet,
  StickyNote,
  Youtube,
  UserCircle,
  ArrowRight,
  PlayCircle,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const sections = [
  {
    id: "conteudos",
    title: "Conteúdo",
    icon: BookOpen,
    color: "bg-blue-500",
    description: "Acesse cursos, aulas, calls gravadas e a comunidade",
    items: [
      {
        title: "Mapa do Iniciante",
        href: "/conteudos/mapa-iniciante",
        icon: Map,
        description: "Guia completo para iniciantes com cursos estruturados e aulas passo a passo. Navegue pelos módulos e acompanhe seu progresso.",
        steps: [
          "Acesse o Mapa do Iniciante no menu",
          "Escolha um curso que deseja aprender",
          "Abra os módulos e assista às aulas",
          "Marque as aulas como concluídas para acompanhar seu progresso"
        ]
      },
      {
        title: "Calls Gravadas",
        href: "/conteudos/calls-gravadas",
        icon: Phone,
        description: "Acesse gravações de calls importantes, mentorias e reuniões estratégicas.",
        steps: [
          "Navegue até Calls Gravadas",
          "Use a busca para encontrar calls específicas",
          "Ouça as gravações diretamente na plataforma",
          "Baixe as calls para ouvir offline"
        ]
      },
      {
        title: "Comunidade",
        href: "/conteudos/comunidade",
        icon: Users,
        description: "Conecte-se com outros membros, compartilhe experiências e aprenda em grupo.",
        steps: [
          "Acesse a Comunidade",
          "Participe de discussões e grupos",
          "Compartilhe suas experiências",
          "Colabore com outros membros"
        ]
      }
    ]
  },
  {
    id: "espionagem",
    title: "Espionagem",
    icon: Globe,
    color: "bg-purple-500",
    description: "Ferramentas de análise e pesquisa de mercado",
    items: [
      {
        title: "Espião de Domínio",
        href: "/espionagem/espiao-dominios",
        icon: Target,
        description: "Analise domínios de concorrentes e descubra suas estratégias de marketing.",
        steps: [
          "Digite o domínio que deseja analisar",
          "Aguarde a análise completa",
          "Visualize informações sobre campanhas, criativos e estratégias",
          "Use os insights para melhorar suas próprias campanhas"
        ]
      },
      {
        title: "Ofertas Escaladas",
        href: "/espionagem/ofertas-escaladas",
        icon: TrendingUp,
        description: "Descubra ofertas que estão performando bem no mercado.",
        steps: [
          "Acesse Ofertas Escaladas",
          "Filtre por categoria, nicho ou país",
          "Analise métricas de performance",
          "Adicione ofertas interessantes aos favoritos"
        ]
      },
      {
        title: "Favoritos",
        href: "/espionagem/favoritos",
        icon: Heart,
        description: "Salve ofertas, criativos e recursos importantes para acesso rápido.",
        steps: [
          "Clique no ícone de coração em qualquer oferta",
          "Acesse seus Favoritos no menu",
          "Organize e filtre seus favoritos",
          "Compartilhe favoritos com sua equipe"
        ]
      },
      {
        title: "Organizador de Biblioteca",
        href: "/espionagem/organizador-biblioteca",
        icon: Library,
        description: "Organize seus recursos em pastas personalizadas para fácil acesso.",
        steps: [
          "Crie pastas para organizar seus recursos",
          "Arraste e solte itens nas pastas",
          "Use tags e categorias para melhor organização",
          "Compartilhe pastas com sua equipe"
        ]
      }
    ]
  },
  {
    id: "ias",
    title: "Inteligência Artificial",
    icon: Sparkles,
    color: "bg-pink-500",
    description: "Ferramentas de IA para criar e otimizar conteúdo",
    items: [
      {
        title: "Criador de Criativo",
        href: "/ias/criador-criativo",
        icon: Image,
        description: "Gere imagens profissionais para suas campanhas usando IA.",
        steps: [
          "Descreva o criativo que deseja criar",
          "Escolha o estilo (profissional, criativo, minimalista, etc.)",
          "Selecione as dimensões da imagem",
          "Clique em 'Gerar Criativo' e aguarde o resultado"
        ]
      },
      {
        title: "Gerador de Copy de Criativo",
        href: "/ias/gerador-copy-criativo",
        icon: Type,
        description: "Crie textos persuasivos para seus criativos usando IA.",
        steps: [
          "Descreva o produto ou serviço",
          "Selecione o tom e estilo desejado",
          "Escolha o formato (anúncio, email, landing page, etc.)",
          "Gere e edite o copy conforme necessário"
        ]
      },
      {
        title: "Gerador de Upsell",
        href: "/ias/gerador-upsell",
        icon: ShoppingCart,
        description: "Crie ofertas de upsell persuasivas para aumentar o ticket médio.",
        steps: [
          "Informe o produto principal",
          "Descreva o produto de upsell",
          "Configure o desconto e condições",
          "Gere a proposta de upsell otimizada"
        ]
      },
      {
        title: "Transcrever Áudio",
        href: "/ias/transcrever-audio",
        icon: FileAudio,
        description: "Converta áudios em texto automaticamente.",
        steps: [
          "Faça upload do arquivo de áudio",
          "Selecione o idioma do áudio",
          "Aguarde a transcrição automática",
          "Edite e exporte o texto transcrito"
        ]
      },
      {
        title: "Upscale",
        href: "/ias/upscale",
        icon: Maximize2,
        description: "Aumente a resolução de imagens sem perder qualidade.",
        steps: [
          "Faça upload da imagem",
          "Escolha o fator de aumento (2x, 4x, etc.)",
          "Processe a imagem",
          "Baixe a imagem em alta resolução"
        ]
      },
      {
        title: "Remover Background",
        href: "/ias/remover-background",
        icon: Eraser,
        description: "Remova o fundo de imagens automaticamente.",
        steps: [
          "Faça upload da imagem",
          "Aguarde o processamento automático",
          "Visualize o resultado",
          "Baixe a imagem sem fundo"
        ]
      }
    ]
  },
  {
    id: "ferramentas",
    title: "Ferramentas",
    icon: Settings,
    color: "bg-orange-500",
    description: "Utilitários para otimizar suas campanhas",
    items: [
      {
        title: "Otimizador de Campanha",
        href: "/ferramentas/otimizador-campanha",
        icon: TrendingUp,
        description: "Analise e otimize suas campanhas de marketing digital.",
        steps: [
          "Importe dados da sua campanha",
          "Analise métricas e KPIs",
          "Receba sugestões de otimização",
          "Implemente as melhorias sugeridas"
        ]
      },
      {
        title: "Validador de Criativo",
        href: "/ferramentas/validador-criativo",
        icon: CheckCircle2,
        description: "Valide se seus criativos atendem às políticas das plataformas.",
        steps: [
          "Faça upload do criativo",
          "Selecione a plataforma (Facebook, Google, etc.)",
          "Receba relatório de validação",
          "Corrija problemas identificados"
        ]
      },
      {
        title: "Mascarar Criativo",
        href: "/ferramentas/mascarar-criativo",
        icon: EyeOff,
        description: "Oculte elementos sensíveis dos seus criativos.",
        steps: [
          "Faça upload do criativo",
          "Selecione áreas para mascarar",
          "Aplique o mascaramento",
          "Baixe o criativo mascarado"
        ]
      },
      {
        title: "Esconder Criativo",
        href: "/ferramentas/esconder-criativo",
        icon: Eye,
        description: "Oculte criativos de visualização pública.",
        steps: [
          "Selecione o criativo",
          "Configure as permissões de visualização",
          "Salve as configurações",
          "O criativo ficará oculto para usuários não autorizados"
        ]
      },
      {
        title: "Criptografar Texto",
        href: "/ferramentas/criptografar-texto",
        icon: Lock,
        description: "Criptografe textos sensíveis para proteção de dados.",
        steps: [
          "Cole ou digite o texto",
          "Escolha o método de criptografia",
          "Gere o texto criptografado",
          "Copie e use onde necessário"
        ]
      }
    ]
  },
  {
    id: "produtividade",
    title: "Produtividade",
    icon: CheckSquare,
    color: "bg-green-500",
    description: "Organize tarefas, metas e finanças",
    items: [
      {
        title: "Tarefas",
        href: "/produtividade/tarefa",
        icon: CheckSquare,
        description: "Gerencie suas tarefas e listas de afazeres.",
        steps: [
          "Crie listas de tarefas personalizadas",
          "Adicione tarefas com título, descrição e prazo",
          "Defina prioridades (alta, média, baixa)",
          "Marque tarefas como concluídas quando finalizar"
        ]
      },
      {
        title: "Cronômetro",
        href: "/produtividade/cronometro",
        icon: Timer,
        description: "Use o cronômetro para gerenciar seu tempo e produtividade.",
        steps: [
          "Inicie o cronômetro",
          "Configure alertas e intervalos",
          "Acompanhe seu tempo de trabalho",
          "Visualize estatísticas de produtividade"
        ]
      },
      {
        title: "Metas",
        href: "/produtividade/meta",
        icon: Trophy,
        description: "Defina e acompanhe suas metas de negócio.",
        steps: [
          "Crie uma nova meta",
          "Defina o valor objetivo e unidade (R$, %, horas, etc.)",
          "Configure o prazo",
          "Acompanhe o progresso em tempo real"
        ]
      },
      {
        title: "Financeiro",
        href: "/produtividade/financeiro",
        icon: Wallet,
        description: "Controle suas receitas e despesas.",
        steps: [
          "Registre transações (receitas ou despesas)",
          "Categorize cada transação",
          "Visualize gráficos e relatórios",
          "Acompanhe seu saldo e fluxo de caixa"
        ]
      },
      {
        title: "Anotações",
        href: "/produtividade/anotacoes",
        icon: StickyNote,
        description: "Crie e organize suas anotações importantes.",
        steps: [
          "Crie uma nova anotação",
          "Use formatação (negrito, itálico, listas)",
          "Organize por categorias ou tags",
          "Pesquise e encontre anotações rapidamente"
        ]
      }
    ]
  },
  {
    id: "links-uteis",
    title: "Links Úteis",
    icon: LinkIcon,
    color: "bg-cyan-500",
    description: "Recursos adicionais e suporte",
    items: [
      {
        title: "Canal no YouTube",
        href: "/links-uteis/canal-youtube",
        icon: Youtube,
        description: "Acesse nosso canal no YouTube com tutoriais e conteúdo exclusivo.",
        steps: [
          "Acesse o link do canal",
          "Inscreva-se para receber notificações",
          "Assista aos tutoriais e vídeos",
          "Compartilhe com sua equipe"
        ]
      },
      {
        title: "Mentoria Individual",
        href: "/links-uteis/mentoria-individual",
        icon: UserCircle,
        description: "Agende sessões de mentoria personalizada.",
        steps: [
          "Acesse a página de Mentoria Individual",
          "Escolha o horário disponível",
          "Agende sua sessão",
          "Prepare suas dúvidas e objetivos"
        ]
      }
    ]
  }
]

export default function TutorialPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#ff5a1f] rounded-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Tutorial da Plataforma</h1>
            <p className="text-gray-400 mt-1">Aprenda a usar todas as funcionalidades do ArcanumSpy</p>
          </div>
        </div>
        <p className="text-gray-300 text-lg max-w-3xl">
          Este guia completo vai te ajudar a dominar todas as ferramentas e recursos disponíveis na plataforma. 
          Explore cada seção e descubra como maximizar sua produtividade e resultados.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${section.color} rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-white">{section.title}</CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Card key={item.href} className="bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#ff5a1f]/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ItemIcon className="h-5 w-5 text-[#ff5a1f]" />
                              <CardTitle className="text-lg text-white">{item.title}</CardTitle>
                            </div>
                            <Link href={item.href}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ArrowRight className="h-4 w-4 text-gray-400 hover:text-[#ff5a1f]" />
                              </Button>
                            </Link>
                          </div>
                          <CardDescription className="text-gray-400 text-sm">
                            {item.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                              Como usar:
                            </p>
                            <ol className="space-y-2">
                              {item.steps.map((step, index) => (
                                <li key={index} className="flex gap-2 text-sm text-gray-300">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff5a1f]/20 text-[#ff5a1f] flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="flex-1">{step}</span>
                                </li>
                              ))}
                            </ol>
                            <div className="pt-4 mt-4 border-t border-[#2a2a2a]">
                              <Link href={item.href}>
                                <Button 
                                  variant="outline" 
                                  className="w-full border-[#ff5a1f] text-[#ff5a1f] hover:bg-[#ff5a1f] hover:text-white"
                                >
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Acessar Ferramenta
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8 bg-gradient-to-r from-[#ff5a1f]/10 to-[#ff4d29]/10 border-[#ff5a1f]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[#ff5a1f]" />
            Dicas para Começar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ff5a1f] flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Explore o Dashboard</h4>
                <p className="text-gray-400 text-sm">
                  Comece pelo dashboard para ter uma visão geral das suas estatísticas e atividades recentes.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ff5a1f] flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Complete o Mapa do Iniciante</h4>
                <p className="text-gray-400 text-sm">
                  Siga o Mapa do Iniciante para aprender os fundamentos e se familiarizar com a plataforma.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ff5a1f] flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Use as Ferramentas de IA</h4>
                <p className="text-gray-400 text-sm">
                  Experimente o Criador de Criativo e outras ferramentas de IA para acelerar seu trabalho.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ff5a1f] flex items-center justify-center">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Organize com Produtividade</h4>
                <p className="text-gray-400 text-sm">
                  Use as ferramentas de produtividade para gerenciar tarefas, metas e finanças.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}








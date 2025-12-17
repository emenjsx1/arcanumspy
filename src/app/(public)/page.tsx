"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, useScroll, useTransform } from "framer-motion"
import clsx from "clsx"
import { 
  ShoppingCart, 
  TrendingUp, 
  Megaphone, 
  Video, 
  FileText,
  ArrowRight,
  Check,
  Star,
  Search,
  Sparkles,
  Mic,
  Copy,
  BarChart3,
  Users,
  Shield,
  Zap,
  Globe,
  Layers,
  PlayCircle,
  Target,
  Eye
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

// Componente de ícones flutuantes no fundo
function FloatingIcons() {
  const icons = [
    { Icon: ShoppingCart, delay: 0, x: 10, y: 20 },
    { Icon: TrendingUp, delay: 0.5, x: 80, y: 60 },
    { Icon: Megaphone, delay: 1, x: 20, y: 80 },
    { Icon: Video, delay: 1.5, x: 70, y: 30 },
    { Icon: FileText, delay: 2, x: 50, y: 70 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute opacity-10"
          style={{
            left: `${x}%`,
            top: `${y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 15 + index * 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: delay,
            ease: "easeInOut",
          }}
        >
          <Icon className="w-16 h-16 md:w-20 md:h-20 text-[#ff5a1f]" />
        </motion.div>
      ))}
    </div>
  )
}

// Componente de animação ao scroll
function ScrollAnimation({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center"]
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [50, 0])

  return (
    <div className="relative">
      <motion.div
        ref={ref}
        style={{ opacity, y }}
        transition={{ delay }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function MotionBlobs() {
  const blobs = [
    { size: 320, color: "from-[#ff5a1f]/40 to-transparent", x: "-20%", y: "-10%", duration: 18 },
    { size: 260, color: "from-[#ffa51f]/30 to-transparent", x: "60%", y: "-15%", duration: 22 },
    { size: 380, color: "from-[#ff1fbf]/25 to-transparent", x: "10%", y: "45%", duration: 26 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute blur-3xl opacity-60 bg-gradient-to-br ${blob.color}`}
          style={{
            width: blob.size,
            height: blob.size,
            left: blob.x,
            top: blob.y,
          }}
          animate={{
            x: ["0%", "5%", "-3%", "2%", "0%"],
            y: ["0%", "4%", "-6%", "3%", "0%"],
            rotate: [0, 15, -10, 20, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

function MotionGrid() {
  return (
    <motion.div
      className="absolute inset-0 opacity-[0.07] dark:opacity-[0.08]"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 0), linear-gradient(180deg, rgba(255,255,255,0.15) 1px, transparent 0)",
        backgroundSize: "60px 60px",
      }}
      animate={{
        backgroundPosition: ["0px 0px", "30px 30px"],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

function SectionReveal({
  children,
  className,
  delay = 0,
  offset = 60,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  offset?: number
}) {
  return (
    <motion.section
      className={clsx("relative", className)}
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  )
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col bg-[#f9f9f9] dark:bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black">
        <MotionGrid />
        <MotionBlobs />
        <FloatingIcons />
        
        <div className="container relative z-10 px-10 md:px-16 lg:px-20 xl:px-24 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-[1100px] mx-auto text-center space-y-10"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Badge className="bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20 px-4 py-1.5 rounded-full text-sm font-medium">
                Plataforma Completa de Marketing e IA
              </Badge>
            </motion.div>

            {/* Título */}
            <h1
              className="text-[1.8rem] leading-[1.3] sm:text-4xl sm:leading-[1.2] md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-[-0.02em] text-[#0b0c10] dark:text-white mx-auto px-3 sm:px-4 md:px-8 lg:px-12"
              style={{ letterSpacing: '-0.02em', wordSpacing: '0.06em' }}
            >
              <span className="block">Escale seus{" "}
              <span className="text-[#ff5a1f]">anúncios</span>{" "}com ofertas e criativos</span>
              <span className="block">que{" "}
              <span className="text-[#ff5a1f]">realmente convertem</span></span>
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-xl md:text-xl lg:text-2xl text-[#6b6b6b] dark:text-gray-400 max-w-[900px] mx-auto leading-relaxed px-4 md:px-8 lg:px-12 font-light">
              Acesse milhares de ofertas escaladas, crie vozes IA, gere copy profissional e monitore criativos que estão dominando o mercado de resposta direta.
            </p>
            
            {/* Explicação sobre Créditos */}
            <div className="relative bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 border border-[#ff5a1f]/20 dark:border-[#ff5a1f]/30 rounded-xl p-6 max-w-[900px] mx-auto overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/10"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-sm md:text-base text-[#0b0c10] dark:text-white font-medium">
                💳 <strong>Sistema de Créditos:</strong> Use créditos para acessar ofertas, gerar vozes IA e criar copy profissional. Compre apenas o que você precisa, quando precisar.
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 px-4 md:px-8 lg:px-12">
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <motion.div
                    className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-[#ff5a1f] via-[#ff7a1f] to-[#ff1fbf] opacity-70 blur-md"
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <Button 
                    size="lg" 
                    className="relative bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Começar Agora – Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-[#0b0c10] dark:border-white text-[#0b0c10] dark:text-white hover:bg-[#0b0c10] dark:hover:bg-white hover:text-white dark:hover:text-[#0b0c10] rounded-full px-8 py-6 text-lg font-semibold transition-all"
                  >
                    Ver Créditos
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Prova Social */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-10 text-sm md:text-base text-[#6b6b6b] dark:text-gray-400 px-4 md:px-8 lg:px-12">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-[#ff5a1f] text-[#ff5a1f]" />
                <span className="font-semibold text-[#0b0c10] dark:text-white">4,9/5</span>
                <span>de 500+ usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>+1000 ofertas cadastradas</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Atualização diária</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Seção de Benefícios */}
      <SectionReveal className="py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Por que usar o SwipeVault Pro?
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Tudo que você precisa para escalar seus anúncios em uma única plataforma
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Search,
                title: "Ofertas Escaladas",
                description: "Acesse milhares de ofertas que estão realmente convertendo no mercado de resposta direta."
              },
              {
                icon: Sparkles,
                title: "Criativos Vencedores",
                description: "Monitore criativos de Facebook, Instagram e TikTok que estão dominando as plataformas."
              },
              {
                icon: Zap,
                title: "IA Avançada",
                description: "Crie vozes clonadas e gere copy profissional usando inteligência artificial de ponta."
              },
              {
                icon: BarChart3,
                title: "Analytics Completo",
                description: "Acompanhe performance, identifique tendências e tome decisões baseadas em dados."
              }
            ].map((benefit, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white dark:bg-black border-0 shadow-md hover:shadow-xl transition-all rounded-2xl p-8 h-full">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 flex items-center justify-center mb-6">
                      <benefit.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff5a1f]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0b0c10] dark:text-white mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                      {benefit.description}
                    </p>
                  </Card>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Seção de Funcionalidades */}
      <SectionReveal className="py-24 bg-[#f9f9f9] dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Funcionalidades do Produto
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Uma plataforma completa com todas as ferramentas que você precisa
              </p>
            </div>
          </ScrollAnimation>

          <div className="space-y-24 max-w-5xl mx-auto">
            {[
              {
                icon: Search,
                title: "Biblioteca de Ofertas",
                description: "Encontre ofertas vencedoras que estão realmente escalando no mercado. Filtre por nicho, plataforma, país e muito mais. Todas as ofertas vêm com análise completa de performance e histórico de conversão.",
                color: "bg-blue-50"
              },
              {
                icon: Video,
                title: "Criativos de Anúncios",
                description: "Acesse swipe files de criativos que estão dominando Facebook Ads, Instagram Ads e TikTok Ads. Monitore novos ângulos, identifique tendências e modele criativos que convertem.",
                color: "bg-purple-50"
              },
              {
                icon: Copy,
                title: "IA para Copy",
                description: "Gere copy profissional usando inteligência artificial. Escolha entre diferentes modelos (AIDA, PAS, Storytelling) e crie variações instantaneamente. Headlines, descrições e CTAs otimizados para conversão.",
                color: "bg-orange-50"
              },
              {
                icon: Mic,
                title: "IA de Voz",
                description: "Clone sua voz ou de um narrador profissional e gere narrações para VSL, anúncios, TikTok, YouTube e muito mais. Processamento rápido com qualidade profissional.",
                color: "bg-green-50"
              },
              {
                icon: Layers,
                title: "Monitoramento e Organização",
                description: "Organize suas ofertas favoritas, acompanhe performance em tempo real e identifique oportunidades de escalar. Templates prontos e transcrições automáticas de VSLs.",
                color: "bg-pink-50"
              }
            ].map((feature, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                    <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                      <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff5a1f]" />
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold text-[#0b0c10] dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-base md:text-lg text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <div className="aspect-video bg-gradient-to-br from-[#ff5a1f]/10 to-[#ff5a1f]/5 rounded-2xl border border-[#ff5a1f]/20 flex items-center justify-center">
                      <feature.icon className="w-24 h-24 text-[#ff5a1f]/30" />
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Como Funciona */}
      <SectionReveal className="py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Como Funciona
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Escale seus anúncios em 3 passos simples
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                number: "1",
                icon: Users,
                title: "Crie sua conta",
                description: "Cadastre-se gratuitamente e tenha acesso imediato à plataforma. Configure seu perfil em menos de 2 minutos."
              },
              {
                number: "2",
                icon: Search,
                title: "Escolha ofertas e criativos",
                description: "Navegue pela biblioteca, filtre por nicho e plataforma, e encontre ofertas e criativos que se encaixam no seu mercado."
              },
              {
                number: "3",
                icon: Target,
                title: "Implemente nas suas campanhas",
                description: "Use as ferramentas de IA para criar vozes e copy, adapte as ofertas para seu mercado e comece a escalar."
              }
            ].map((step, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className="relative mx-auto w-20 h-20 rounded-full bg-[#ff5a1f]/10 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-[#ff5a1f]/20 blur-xl rounded-full"></div>
                    <div className="relative text-3xl sm:text-4xl font-bold text-[#ff5a1f]">{step.number}</div>
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#ff5a1f]/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#ff5a1f]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#0b0c10] dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Depoimentos */}
      <SectionReveal className="py-24 bg-[#f9f9f9] dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                O que nossos usuários dizem
              </h2>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Maria Silva",
                role: "Afiliada",
                avatar: "MS",
                text: "Consegui escalar minhas campanhas em 3x usando as ofertas e criativos da plataforma. A IA de voz economizou horas do meu tempo."
              },
              {
                name: "João Santos",
                role: "Produtor",
                avatar: "JS",
                text: "A melhor ferramenta que já usei. As ofertas com cloaker quebrado são um diferencial enorme. Recomendo para todos."
              },
              {
                name: "Ana Costa",
                role: "Dropshipper",
                avatar: "AC",
                text: "O monitoramento de criativos me ajudou a identificar tendências antes dos concorrentes. ROI aumentou 250%."
              }
            ].map((testimonial, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white dark:bg-black border-0 shadow-md hover:shadow-xl transition-all rounded-2xl p-8 h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 flex items-center justify-center text-[#ff5a1f] font-bold text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0b0c10] dark:text-white">{testimonial.name}</h4>
                        <p className="text-sm text-[#6b6b6b] dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#ff5a1f] text-[#ff5a1f]" />
                      ))}
                    </div>
                    <p className="text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                      &quot;{testimonial.text}&quot;
                    </p>
                  </Card>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Sistema de Créditos */}
      <SectionReveal className="py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Sistema de Créditos
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Use créditos para acessar todas as funcionalidades. Pague apenas pelo que usar.
              </p>
            </div>
          </ScrollAnimation>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: Eye,
                  title: "Visualizar Ofertas",
                  credits: "1 crédito",
                  description: "Por cada oferta visualizada pela primeira vez"
                },
                {
                  icon: Mic,
                  title: "Gerar Voz IA",
                  credits: "5 créditos/min",
                  description: "Proporcional à duração do áudio gerado"
                },
                {
                  icon: Copy,
                  title: "Gerar Copy",
                  credits: "5 créditos",
                  description: "Por cada geração de copy profissional"
                }
              ].map((item, index) => (
                <ScrollAnimation key={index} delay={index * 0.1}>
                  <Card className="bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl transition-all rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 rounded-xl bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-[#ff5a1f]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0b0c10] dark:text-white mb-2">
                      {item.title}
                    </h3>
                    <div className="text-2xl font-bold text-[#ff5a1f] mb-2">
                      {item.credits}
                    </div>
                    <p className="text-sm text-[#6b6b6b] dark:text-gray-400">
                      {item.description}
                    </p>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
            
            <div className="bg-[#ff5a1f]/10 dark:bg-[#ff5a1f]/20 border border-[#ff5a1f]/20 dark:border-[#ff5a1f]/30 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-[#0b0c10] dark:text-white mb-4">
                Como Funciona?
              </h3>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Compre créditos quando precisar e use conforme sua necessidade. Não há mensalidades fixas - você paga apenas pelo que usar. Os créditos não expiram e você pode comprar mais a qualquer momento.
              </p>
              <Link href="/pricing">
                <Button 
                  size="lg"
                  className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full px-8 py-6 text-lg font-semibold"
                >
                  Ver Pacotes de Créditos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* CTA Final */}
      <SectionReveal className="py-24 bg-white dark:bg-black" offset={40}>
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-6">
                Pronto para Escalar?
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 mb-8 leading-relaxed">
                Junte-se a centenas de profissionais que já estão escalando com o SwipeVault Pro
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg"
                    >
                      Começar Agora – Grátis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/pricing">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-[#0b0c10] dark:border-white text-[#0b0c10] dark:text-white hover:bg-[#0b0c10] dark:hover:bg-white hover:text-white dark:hover:text-[#0b0c10] rounded-full px-8 py-6 text-lg font-semibold"
                    >
                      Ver Créditos
                    </Button>
                  </motion.div>
                </Link>
              </div>
              <p className="text-sm text-[#6b6b6b] dark:text-gray-500 mt-6">
                7 dias de garantia • Cancele quando quiser
              </p>
            </div>
          </ScrollAnimation>
        </div>
      </SectionReveal>
    </div>
  )
}

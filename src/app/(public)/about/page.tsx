"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Target, Users, TrendingUp, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-[#f9f9f9] min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              Sobre
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0b0c10] mb-6 leading-tight">
              O que é um{" "}
              <span className="text-[#ff5a1f]">Swipe File</span>?
            </h1>
            <p className="text-lg md:text-xl text-[#6b6b6b] leading-relaxed">
              Um Swipe File é uma biblioteca organizada de ofertas de marketing direto que foram testadas e comprovadamente convertem. É uma ferramenta essencial para copywriters, marketers e empreendedores que querem criar ofertas de alta conversão.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What is Swipe File */}
      <section className="py-24 bg-[#f9f9f9]">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-[#6b6b6b] leading-relaxed mb-6">
                  Ao invés de começar do zero, você pode estudar ofertas que já funcionam, entender os padrões que fazem elas converterem, e aplicar esses insights nas suas próprias campanhas. É como ter acesso ao &quot;código-fonte&quot; das melhores ofertas do mercado.
                </p>
                <p className="text-lg text-[#6b6b6b] leading-relaxed">
                  No ArcanumSpy, não apenas oferecemos acesso a essas ofertas, mas também fornecemos análises detalhadas, ferramentas de IA para criar vozes e copy, e monitoramento de criativos que estão realmente escalando.
                </p>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] mb-4">
                Como Funciona
              </h2>
              <p className="text-lg text-[#6b6b6b] max-w-2xl mx-auto">
                Entenda como o ArcanumSpy pode transformar sua forma de criar ofertas
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Explore a Biblioteca",
                description: "Navegue por milhares de ofertas organizadas por categoria, nicho e país.",
              },
              {
                step: "2",
                title: "Analise a Estrutura",
                description: "Veja headlines, hooks, bullets, CTAs e todos os elementos que compõem a oferta.",
              },
              {
                step: "3",
                title: "Entenda o Porquê",
                description: "Leia análises detalhadas explicando por que cada oferta converte e quais gatilhos mentais usa.",
              },
              {
                step: "4",
                title: "Aplique e Adapte",
                description: "Use os insights para criar suas próprias ofertas adaptadas ao seu produto e audiência.",
              },
            ].map((item, index) => (
              <ScrollAnimation key={item.step} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all rounded-2xl p-8 h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-[#ff5a1f]/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-[#ff5a1f]">{item.step}</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-[#0b0c10]">
                        {item.title}
                      </CardTitle>
                    </div>
                    <CardContent className="p-0">
                      <p className="text-[#6b6b6b] leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-24 bg-[#f9f9f9]">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] mb-4">
                Para Quem Serve
              </h2>
              <p className="text-lg text-[#6b6b6b] max-w-2xl mx-auto">
                Profissionais que querem criar ofertas que realmente convertem
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Target,
                title: "Copywriters",
                description: "Estude as melhores ofertas do mercado e crie copy que converte para seus clientes.",
              },
              {
                icon: Users,
                title: "Marketers",
                description: "Entenda o que funciona em diferentes nichos e otimize suas campanhas.",
              },
              {
                icon: TrendingUp,
                title: "Empreendedores",
                description: "Crie ofertas de alta conversão para seus produtos e aumente suas vendas.",
              },
            ].map((item, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all rounded-2xl p-8 h-full text-center">
                    <div className="w-16 h-16 rounded-xl bg-[#ff5a1f]/10 flex items-center justify-center mx-auto mb-6">
                      <item.icon className="w-8 h-8 text-[#ff5a1f]" />
                    </div>
                    <CardTitle className="text-xl font-bold text-[#0b0c10] mb-3">
                      {item.title}
                    </CardTitle>
                    <CardContent className="p-0">
                      <p className="text-[#6b6b6b] leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] mb-4">
                  Resultados que Gera
                </h2>
                <p className="text-lg text-[#6b6b6b]">
                  O que nossos usuários conseguem com o ArcanumSpy
                </p>
              </div>
              <Card className="bg-gradient-to-br from-[#ff5a1f] to-[#ff4d29] text-white border-0 shadow-xl rounded-2xl p-8">
                <CardHeader>
                  <CardTitle className="text-2xl mb-6 text-white">
                    O que nossos usuários conseguem:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {[
                      "Aumento médio de 2-3x na taxa de conversão das ofertas",
                      "Economia de tempo ao não precisar testar do zero",
                      "Acesso a estratégias comprovadas de diferentes nichos",
                      "Melhoria contínua através de atualizações semanais",
                      "Confiança para criar ofertas baseadas em dados reais",
                    ].map((result, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span className="text-base leading-relaxed">{result}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-black">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-[#0b0c10] dark:text-white mb-6">
                Pronto para começar?
              </h2>
              <p className="text-lg text-[#6b6b6b] dark:text-gray-400 mb-8 leading-relaxed">
                Junte-se a centenas de profissionais que já estão escalando com o ArcanumSpy
              </p>
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
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}

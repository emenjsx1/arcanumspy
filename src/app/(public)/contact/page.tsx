"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Mail, Phone, Clock, MessageSquare, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useScroll, useTransform } from "framer-motion"

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

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(5, "Assunto deve ter no mínimo 5 caracteres"),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true)
    try {
      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      })
      reset()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar sua mensagem",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "suporte@arcanumspy.com",
    },
    {
      icon: Phone,
      title: "Telefone",
      content: "+55 (11) 9999-9999",
    },
    {
      icon: Clock,
      title: "Horário de Atendimento",
      content: "Segunda a Sexta: 9h às 18h\nSábado: 9h às 13h",
    },
    {
      icon: MessageSquare,
      title: "Status do Suporte",
      content: "Tempo médio de resposta: 2-4 horas",
    },
  ]

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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0b0c10] mb-6 leading-tight">
              Entre em <span className="text-[#ff5a1f]">Contato</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6b6b6b] leading-relaxed">
              Estamos aqui para ajudar. Envie sua mensagem e responderemos o mais rápido possível.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-24 bg-[#f9f9f9]">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            {contactInfo.map((info, index) => (
              <ScrollAnimation key={index} delay={index * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all rounded-2xl p-6 h-full text-center">
                    <div className="w-14 h-14 rounded-xl bg-[#ff5a1f]/10 flex items-center justify-center mx-auto mb-4">
                      <info.icon className="w-7 h-7 text-[#ff5a1f]" />
                    </div>
                    <CardTitle className="text-lg font-bold text-[#0b0c10] mb-2">
                      {info.title}
                    </CardTitle>
                    <CardContent className="p-0">
                      <p className="text-sm text-[#6b6b6b] whitespace-pre-line">
                        {info.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 bg-white">
        <div className="container px-4 md:px-6">
          <ScrollAnimation>
            <div className="max-w-2xl mx-auto">
              <Card className="bg-white border-0 shadow-xl rounded-2xl p-8">
                <CardHeader className="pb-6">
                  <CardTitle className="text-3xl font-bold text-[#0b0c10] mb-2">
                    Envie sua Mensagem
                  </CardTitle>
                  <CardDescription className="text-[#6b6b6b] text-base">
                    Preencha o formulário abaixo e entraremos em contato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#0b0c10] font-semibold">
                          Nome
                        </Label>
                        <Input
                          id="name"
                          placeholder="Seu nome"
                          className="rounded-xl border-gray-200 focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#0b0c10] font-semibold">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="rounded-xl border-gray-200 focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-[#0b0c10] font-semibold">
                        Assunto
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Qual é o assunto?"
                        className="rounded-xl border-gray-200 focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                        {...register("subject")}
                      />
                      {errors.subject && (
                        <p className="text-sm text-red-500">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[#0b0c10] font-semibold">
                        Mensagem
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Sua mensagem..."
                        rows={6}
                        className="rounded-xl border-gray-200 focus:border-[#ff5a1f] focus:ring-[#ff5a1f]"
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500">{errors.message.message}</p>
                      )}
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-[#ff5a1f] hover:bg-[#ff4d29] text-white rounded-full py-6 text-lg font-semibold shadow-lg" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Enviando..." : "Enviar Mensagem"}
                        {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}

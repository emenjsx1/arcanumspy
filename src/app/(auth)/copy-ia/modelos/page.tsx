"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const MODELOS = [
  {
    nome: "AIDA",
    descricao: "Atenção, Interesse, Desejo, Ação",
    explicacao: "Um dos modelos mais clássicos e eficazes de copywriting. Primeiro você chama a atenção, depois desperta o interesse, cria o desejo e finalmente pede a ação.",
    estrutura: [
      "Atenção: Capture a atenção do público com uma afirmação impactante",
      "Interesse: Mantenha o interesse apresentando benefícios relevantes",
      "Desejo: Crie desejo mostrando como o produto resolve o problema",
      "Ação: Finalize com uma chamada para ação clara e urgente",
    ],
    quandoUsar: "Ideal para anúncios, emails e landing pages que precisam de uma estrutura clara e linear.",
    exemplo: "ATENÇÃO: Você está perdendo R$ 1.000 por mês? INTERESSE: Descubra como profissionais estão aumentando sua renda. DESEJO: Imagine ter mais tempo e dinheiro. AÇÃO: Clique agora e comece hoje mesmo.",
  },
  {
    nome: "PAS",
    descricao: "Problema, Agitação, Solução",
    explicacao: "Identifique o problema, agite a dor e apresente a solução. Perfeito para criar urgência e mostrar o valor da sua oferta.",
    estrutura: [
      "Problema: Identifique claramente a dor ou necessidade do público",
      "Agitação: Amplifique o problema, mostre as consequências",
      "Solução: Apresente seu produto como a solução ideal",
    ],
    quandoUsar: "Excelente para nichos onde há uma dor clara e específica, como saúde, finanças e relacionamentos.",
    exemplo: "PROBLEMA: Você sofre com queda de cabelo? AGITAÇÃO: A cada dia que passa, você perde mais fios. A autoconfiança diminui. SOLUÇÃO: Conheça o método que já recuperou mais de 10.000 pessoas.",
  },
  {
    nome: "QPQ",
    descricao: "Questão, Problema, Questão",
    explicacao: "Use perguntas estratégicas para envolver o leitor e guiá-lo através do problema até a solução.",
    estrutura: [
      "Questão inicial: Faça uma pergunta que ressoe com o público",
      "Problema: Explore o problema em detalhes",
      "Questão final: Pergunte se eles querem a solução",
    ],
    quandoUsar: "Ideal para criar engajamento e fazer o leitor refletir sobre sua situação atual.",
    exemplo: "Você já se sentiu frustrado por não conseguir resultados? O problema é que a maioria das pessoas tenta métodos que não funcionam. Você está pronto para conhecer a solução que realmente funciona?",
  },
  {
    nome: "4P's",
    descricao: "Promessa, Prova, Prova Social, Push",
    explicacao: "Faça uma promessa, prove com evidências, mostre prova social e dê um empurrão final para a ação.",
    estrutura: [
      "Promessa: Faça uma promessa clara e específica",
      "Prova: Apresente evidências e dados que comprovem",
      "Prova Social: Mostre depoimentos e resultados de outros clientes",
      "Push: Crie urgência e incentive a ação imediata",
    ],
    quandoUsar: "Perfeito quando você tem dados, depoimentos e resultados comprovados para mostrar.",
    exemplo: "PROMESSA: Emagreça 10kg em 30 dias. PROVA: Baseado em estudos científicos. PROVA SOCIAL: Mais de 5.000 pessoas já emagreceram. PUSH: Apenas hoje, 50% de desconto.",
  },
  {
    nome: "Big Promise",
    descricao: "Grande Promessa Transformadora",
    explicacao: "Foque em uma promessa grande, audaciosa e transformadora. Ideal para produtos que prometem mudanças significativas.",
    estrutura: [
      "Grande Promessa: Faça uma promessa transformadora e específica",
      "Benefícios: Liste os principais benefícios dessa transformação",
      "Credibilidade: Mostre por que você pode fazer essa promessa",
      "Ação: Convide para a transformação",
    ],
    quandoUsar: "Quando seu produto oferece uma transformação significativa na vida do cliente.",
    exemplo: "Transforme sua vida financeira em 90 dias. De dívidas a liberdade financeira. Baseado no método usado por mais de 50.000 pessoas. Comece sua transformação hoje.",
  },
  {
    nome: "Storytelling",
    descricao: "Narrativa Envolvente",
    explicacao: "Conte uma história que conecte emocionalmente com o público. Histórias vendem mais que fatos.",
    estrutura: [
      "Personagem: Apresente um personagem com quem o público se identifica",
      "Problema: Mostre o desafio ou problema enfrentado",
      "Jornada: Descreva a busca pela solução",
      "Transformação: Mostre como o produto transformou a vida",
      "Chamada: Convide o público a viver a mesma transformação",
    ],
    quandoUsar: "Ideal para criar conexão emocional e quando você tem uma história poderosa para contar.",
    exemplo: "Maria tinha 35 anos e estava frustrada com seu cabelo. Tentou de tudo, mas nada funcionava. Até que descobriu nosso método. Hoje, 6 meses depois, ela tem o cabelo dos sonhos. Você também pode ter essa transformação.",
  },
  {
    nome: "Anti-Método",
    descricao: "Mostre o que NÃO fazer",
    explicacao: "Revele os erros comuns e mostre o caminho correto. Cria autoridade e diferenciação.",
    estrutura: [
      "Erro comum: Mostre o que a maioria faz errado",
      "Por que falha: Explique por que o método comum não funciona",
      "Método correto: Apresente a abordagem certa",
      "Resultados: Mostre os resultados do método correto",
    ],
    quandoUsar: "Quando você quer se posicionar como especialista e mostrar que seu método é diferente e superior.",
    exemplo: "A maioria tenta emagrecer cortando calorias. Isso não funciona porque seu metabolismo desacelera. O método correto é acelerar o metabolismo. Resultado: perda de peso sustentável.",
  },
  {
    nome: "Lista de Benefícios",
    descricao: "Benefícios Claros e Objetivos",
    explicacao: "Liste os principais benefícios de forma clara, direta e objetiva. Simples e eficaz.",
    estrutura: [
      "Introdução: Contexto breve",
      "Benefício 1: Primeiro benefício principal",
      "Benefício 2: Segundo benefício principal",
      "Benefício 3: Terceiro benefício principal",
      "CTA: Chamada para ação",
    ],
    quandoUsar: "Quando você quer ser direto ao ponto e seu produto tem benefícios claros e mensuráveis.",
    exemplo: "Nosso produto oferece: 1) Resultados em 30 dias, 2) Método 100% natural, 3) Suporte especializado. Comece agora e transforme sua vida.",
  },
]

export default function ModelosCopyPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Modelos de Copy</h1>
        <p className="text-muted-foreground mt-1">
          Conheça os diferentes modelos de copywriting e quando usar cada um
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {MODELOS.map((modelo) => (
          <Card key={modelo.nome}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-1">{modelo.nome}</CardTitle>
                  <CardDescription>{modelo.descricao}</CardDescription>
                </div>
                <Badge variant="outline">{modelo.nome}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {modelo.explicacao}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Estrutura:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {modelo.estrutura.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Quando usar:</h4>
                <p className="text-sm text-muted-foreground">{modelo.quandoUsar}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Exemplo:</h4>
                <div className="bg-muted/30 rounded-lg p-3 text-sm italic text-muted-foreground">
                  &quot;{modelo.exemplo}&quot;
                </div>
              </div>

              <div className="pt-2">
                <Link href="/copy-ia/gerar">
                  <Button variant="outline" className="w-full">
                    Usar este modelo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dica Profissional</CardTitle>
          <CardDescription>
            Escolha o modelo que melhor se adapta ao seu produto e público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cada modelo tem suas características e funciona melhor em contextos específicos.
            Experimente diferentes modelos para ver qual gera mais conversões com seu público.
            Lembre-se: o melhor modelo é aquele que ressoa com seu público-alvo e transmite
            sua mensagem de forma clara e persuasiva.
          </p>
          <Link href="/copy-ia/gerar">
            <Button>
              Começar a gerar copy
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

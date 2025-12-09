# Scraper da Facebook Ad Library

Este documento descreve como funciona o coletor automático de anúncios do Facebook e como configurá-lo para alimentar diretamente as bibliotecas existentes do ArcanumSpy.

## Visão geral

1. **Coleta** – `workers/facebook-ad-library/index.js` usa Playwright para abrir a Ad Library, pesquisar por cada nicho configurado e extrair:
   - Link do anúncio (ID da Ad Library)
   - Texto/legenda
   - Links de criativos (imagem/vídeo)
   - Nome da página e link do perfil
   - URL final (landing page) decodificada
   - Status/frequência exibida pelo Facebook
2. **Snapshot** – cada execução salva um JSON bruto em `tmp/facebook-ad-library/<timestamp>-<niche>.json`.
3. **Envio para o backend** – os dados são enviados para `POST /api/facebook-ads/import`, que:
   - Garante que categorias/nichos existam e cria se necessário
   - Upserta as ofertas na tabela `offers`
   - Preenche os novos campos (`ad_text`, `landing_page_url`, `creative_asset_urls`, etc.)
   - Atualiza métricas em `offer_scalability_metrics` e marca anúncios com alta escala (`scaled_at`)

## Dependências

- Node.js 18+ (necessário para `fetch` nativo e Playwright)
- Playwright (`npm install playwright`)
- Node-cron (`npm install node-cron`)
- A instância do Next.js/Supabase deve ter as novas migrações aplicadas (`supabase/migrations/039_add_facebook_ad_tracking.sql`)

## Variáveis de ambiente

Adicione ao `.env.local` (veja `VARIAVEIS_ENV_EXEMPLO.txt`):

```
SCRAPER_API_SECRET=token_super_secreto
SCRAPER_API_URL=http://localhost:3000/api/facebook-ads/import
FB_SCRAPER_CRON=*/2 * * * *
FB_SCRAPER_COUNTRY=BR
FB_SCRAPER_MAX_ADS=15
FB_SCRAPER_NICHES=[{"name":"Fitness","query":"fitness","category":"Fitness"}]
```

- `SCRAPER_API_SECRET` deve ser o mesmo secret validado pelo endpoint `/api/facebook-ads/import`.
- `FB_SCRAPER_NICHES` aceita um JSON com `{ name, query, category, country? }`. Caso não seja definido, três nichos padrão (Fitness, Finanças, Saúde) são usados.

## Como executar

1. Certifique-se de que o backend (`npm run dev` / `next start`) está rodando e que o endpoint `/api/facebook-ads/import` está acessível a partir da máquina que executará o scraper.
2. Rode o scraper manualmente:

```
npm run scraper:facebook
```

3. Para uma execução única (sem scheduler), defina `SCRAPER_RUN_ONCE=true`:

```
set SCRAPER_RUN_ONCE=true && npm run scraper:facebook   # Windows PowerShell
# ou
SCRAPER_RUN_ONCE=true npm run scraper:facebook          # macOS/Linux
```

O scheduler padrão dispara a cada 2 minutos (`*/2 * * * *`). Ajuste `FB_SCRAPER_CRON` conforme necessário.

## Integração com Supabase

- Novos campos em `offers` armazenam o texto do anúncio, página, landing page e lista de criativos.
- A tabela `offer_scalability_metrics` guarda contagem de criativos, frequência/impressões e número de execuções do scraper. Quando um anúncio tem ≥3 criativos ou é encontrado em 3 execuções consecutivas, ele é marcado como de “escala alta” (`scaled_at` + `is_high_scale`).
- O endpoint valida categorias/nichos por `slug`; caso não existam, são criados automaticamente para que o conteúdo apareça na biblioteca padrão e na seção de anúncios escalados.

## Boas práticas

- Execute o scraper em um worker separado (PM2, systemd, etc.) para garantir disponibilidade contínua.
- Monitore `tmp/facebook-ad-library` para garantir que os snapshots não cresçam indefinidamente (configurar um cron para limpeza antiga se necessário).
- Use um secret dedicado para o scraper e restrinja o endpoint via firewall/VPC se estiver exposto publicamente.
- Caso o Facebook altere a estrutura da página, ajuste os seletores em `workers/facebook-ad-library/index.js`.



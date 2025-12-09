/**
 * Detecta tecnologias via headers e padrões HTML
 */

export interface DetectedTechnology {
  name: string
  version?: string
  confidence: 'high' | 'medium' | 'low'
  method: 'header' | 'html' | 'cookie' | 'meta'
}

export function detectTech(headers: Record<string, string>, html: string): DetectedTechnology[] {
  const technologies: DetectedTechnology[] = []

  // Detectar via headers
  detectFromHeaders(headers, technologies)

  // Detectar via HTML
  detectFromHTML(html, technologies)

  // Detectar via cookies
  detectFromCookies(headers, technologies)

  // Remover duplicatas (manter a de maior confiança)
  const unique = new Map<string, DetectedTechnology>()
  technologies.forEach(tech => {
    const existing = unique.get(tech.name)
    if (!existing || getConfidenceScore(tech.confidence) > getConfidenceScore(existing.confidence)) {
      unique.set(tech.name, tech)
    }
  })

  return Array.from(unique.values())
}

function detectFromHeaders(headers: Record<string, string>, technologies: DetectedTechnology[]) {
  // X-Powered-By
  const poweredBy = headers['x-powered-by']
  if (poweredBy) {
    const match = poweredBy.match(/([^\/\s]+)(?:\/([\d.]+))?/i)
    if (match) {
      technologies.push({
        name: match[1],
        version: match[2],
        confidence: 'high',
        method: 'header'
      })
    }
  }

  // Server header
  const server = headers['server']
  if (server) {
    const match = server.match(/([^\/\s]+)(?:\/([\d.]+))?/i)
    if (match) {
      const serverName = match[1].toLowerCase()
      if (serverName.includes('nginx')) {
        technologies.push({
          name: 'Nginx',
          version: match[2],
          confidence: 'high',
          method: 'header'
        })
      } else if (serverName.includes('apache')) {
        technologies.push({
          name: 'Apache',
          version: match[2],
          confidence: 'high',
          method: 'header'
        })
      } else if (serverName.includes('cloudflare')) {
        technologies.push({
          name: 'Cloudflare',
          confidence: 'high',
          method: 'header'
        })
      }
    }
  }

  // X-Framework
  const framework = headers['x-framework']
  if (framework) {
    technologies.push({
      name: framework,
      confidence: 'high',
      method: 'header'
    })
  }

  // X-Generator (WordPress, Drupal, etc.)
  const generator = headers['x-generator']
  if (generator) {
    technologies.push({
      name: generator,
      confidence: 'high',
      method: 'header'
    })
  }
}

function detectFromHTML(html: string, technologies: DetectedTechnology[]) {
  const lowerHtml = html.toLowerCase()

  // WordPress
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes') || lowerHtml.includes('wordpress')) {
    const versionMatch = html.match(/wp-content\/themes\/[^\/]+\/style\.css\?ver=([\d.]+)/i)
    technologies.push({
      name: 'WordPress',
      version: versionMatch?.[1],
      confidence: 'high',
      method: 'html'
    })
  }

  // React
  if (lowerHtml.includes('react') || lowerHtml.includes('react-dom') || html.includes('__REACT_DEVTOOLS')) {
    technologies.push({
      name: 'React',
      confidence: 'medium',
      method: 'html'
    })
  }

  // Vue.js
  if (lowerHtml.includes('vue.js') || lowerHtml.includes('vue@') || html.includes('__VUE__')) {
    const versionMatch = html.match(/vue(?:\.js)?[@\/]([\d.]+)/i)
    technologies.push({
      name: 'Vue.js',
      version: versionMatch?.[1],
      confidence: 'medium',
      method: 'html'
    })
  }

  // Angular
  if (lowerHtml.includes('angular') || html.includes('ng-version')) {
    const versionMatch = html.match(/ng-version="([^"]+)"/i)
    technologies.push({
      name: 'Angular',
      version: versionMatch?.[1],
      confidence: 'medium',
      method: 'html'
    })
  }

  // Laravel
  if (html.includes('laravel_session') || lowerHtml.includes('laravel')) {
    technologies.push({
      name: 'Laravel',
      confidence: 'medium',
      method: 'html'
    })
  }

  // Drupal
  if (lowerHtml.includes('drupal') || html.includes('Drupal.settings')) {
    technologies.push({
      name: 'Drupal',
      confidence: 'medium',
      method: 'html'
    })
  }

  // Joomla
  if (lowerHtml.includes('joomla') || html.includes('Joomla!')) {
    technologies.push({
      name: 'Joomla',
      confidence: 'medium',
      method: 'html'
    })
  }

  // Bootstrap
  if (lowerHtml.includes('bootstrap') || html.includes('bootstrap.min.css')) {
    const versionMatch = html.match(/bootstrap[^\/]*\/([\d.]+)/i)
    technologies.push({
      name: 'Bootstrap',
      version: versionMatch?.[1],
      confidence: 'medium',
      method: 'html'
    })
  }

  // jQuery
  if (lowerHtml.includes('jquery') || html.includes('jquery.min.js')) {
    const versionMatch = html.match(/jquery[^\/]*\/([\d.]+)/i)
    technologies.push({
      name: 'jQuery',
      version: versionMatch?.[1],
      confidence: 'medium',
      method: 'html'
    })
  }

  // Next.js
  if (html.includes('__NEXT_DATA__') || lowerHtml.includes('next.js')) {
    technologies.push({
      name: 'Next.js',
      confidence: 'high',
      method: 'html'
    })
  }

  // Shopify
  if (lowerHtml.includes('shopify') || html.includes('Shopify.theme')) {
    technologies.push({
      name: 'Shopify',
      confidence: 'medium',
      method: 'html'
    })
  }

  // WooCommerce
  if (lowerHtml.includes('woocommerce') || html.includes('woocommerce-no-js')) {
    technologies.push({
      name: 'WooCommerce',
      confidence: 'medium',
      method: 'html'
    })
  }
}

function detectFromCookies(headers: Record<string, string>, technologies: DetectedTechnology[]) {
  const cookies = headers['set-cookie'] || ''
  const lowerCookies = cookies.toLowerCase()

  // Laravel
  if (lowerCookies.includes('laravel_session')) {
    technologies.push({
      name: 'Laravel',
      confidence: 'high',
      method: 'cookie'
    })
  }

  // Django
  if (lowerCookies.includes('csrftoken') || lowerCookies.includes('sessionid')) {
    technologies.push({
      name: 'Django',
      confidence: 'medium',
      method: 'cookie'
    })
  }

  // PHP Session
  if (lowerCookies.includes('phpsessid')) {
    technologies.push({
      name: 'PHP',
      confidence: 'medium',
      method: 'cookie'
    })
  }

  // ASP.NET
  if (lowerCookies.includes('asp.net_sessionid')) {
    technologies.push({
      name: 'ASP.NET',
      confidence: 'medium',
      method: 'cookie'
    })
  }
}

function getConfidenceScore(confidence: 'high' | 'medium' | 'low'): number {
  switch (confidence) {
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
    default: return 0
  }
}





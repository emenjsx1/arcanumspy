"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Erro Crítico - ArcanumSpy</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            max-width: 500px;
            width: 100%;
            text-align: center;
          }
          h1 {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #ff5a1f;
          }
          h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #ccc;
          }
          p {
            margin-bottom: 2rem;
            color: #999;
            line-height: 1.6;
          }
          .buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          button {
            padding: 12px 24px;
            font-size: 1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
          }
          .primary {
            background: #ff5a1f;
            color: white;
          }
          .primary:hover {
            background: #ff4d29;
          }
          .secondary {
            background: transparent;
            color: #fff;
            border: 2px solid #fff;
          }
          .secondary:hover {
            background: #fff;
            color: #000;
          }
          a {
            color: #ff5a1f;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Erro Crítico</h1>
          <h2>Algo deu errado</h2>
          <p>
            {error?.message || "Ocorreu um erro crítico. Por favor, recarregue a página."}
          </p>
          <div className="buttons">
            <button className="primary" onClick={reset}>
              Tentar novamente
            </button>
            <a href="/">
              <button className="secondary">
                Voltar para Home
              </button>
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}

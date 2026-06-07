import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center animate-slide-up">
        <div className="text-8xl mb-6">🐾</div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Parece que seu pet fugiu por esse caminho. Vamos voltar para um lugar seguro?
        </p>
        <Link to="/" className="btn-primary">
          <Home size={16} />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

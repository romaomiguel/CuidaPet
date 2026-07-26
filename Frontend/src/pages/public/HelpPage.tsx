import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MessageCircle } from 'lucide-react'
import clsx from 'clsx'
import { HELP_CATEGORIES, HELP_ARTICLES, searchHelpArticles } from '@/data/helpArticles'
import { SupportModal } from '@/components/support/SupportModal'

export function HelpPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => searchHelpArticles(query), [query])
  const featuredArticles = useMemo(() => HELP_ARTICLES.filter(a => a.featured), [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    if (results.length === 1) {
      navigate(`/ajuda/${results[0].category}/${results[0].slug}`)
    } else {
      navigate(`/ajuda/busca?q=${encodeURIComponent(query.trim())}`)
    }
    setResultsOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ─── Hero de Ajuda ─── */}
      <section className="relative bg-primary-50 rounded-b-[3rem]">
        <div className="max-w-3xl mx-auto h-80 px-4 sm:px-6 flex flex-col items-center justify-center text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-3">
            Como podemos ajudar?
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-xl mb-6">
            Dicas para manter sua conta segura: Nunca compartilhe senhas e faça pagamentos apenas pela plataforma.
          </p>

          <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400 z-10" size={22} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setResultsOpen(true) }}
              onFocus={() => setResultsOpen(true)}
              onBlur={() => setTimeout(() => setResultsOpen(false), 150)}
              placeholder="Digite sua dúvida aqui..."
              className="relative w-full pl-16 pr-6 py-4 rounded-pill text-base bg-white border-2 border-transparent focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 shadow-card transition-all duration-200"
            />

            {/* Resultados ao vivo — clique navega direto, Enter aplica a regra 1-resultado/vários */}
            {resultsOpen && query.trim() && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-card-hover border border-stroke overflow-hidden z-20 text-left">
                {results.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted">Nenhum artigo encontrado para "{query}".</p>
                ) : (
                  results.slice(0, 6).map(article => (
                    <Link
                      key={`${article.category}-${article.slug}`}
                      to={`/ajuda/${article.category}/${article.slug}`}
                      className="block px-5 py-3 hover:bg-background transition-colors border-b border-stroke last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-ink">{article.title}</p>
                      <p className="text-xs text-muted mt-0.5">{article.excerpt}</p>
                    </Link>
                  ))
                )}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ─── Categorias / Cards ─── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {HELP_CATEGORIES.map(({ key, icon, title, desc, iconBg }) => (
              <Link
                key={key}
                to={`/ajuda/${key}`}
                className="card-hover group text-center p-8 sm:p-10"
              >
                <div className={clsx('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110', iconBg)}>
                  {icon}
                </div>
                <h2 className="font-heading text-xl font-bold text-ink">{title}</h2>
                <p className="text-muted mt-2 text-sm leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tópicos Frequentes ─── */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl font-bold text-ink mb-1.5">Tópicos Frequentes</h2>
            <p className="text-muted text-sm">As dúvidas mais comuns da nossa comunidade.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
            {featuredArticles.map(({ category, slug, icon, title, excerpt, accent }) => (
              <Link key={slug} to={`/ajuda/${category}/${slug}`} className="flex items-start gap-4 group">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm group-hover:text-primary-600 transition-colors">{title}</h3>
                  <p className="text-muted text-sm mt-0.5 leading-relaxed">{excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Suporte Adicional ─── */}
      <section className="pb-20 px-4 sm:px-6 flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center bg-white rounded-3xl p-10 shadow-card">
          <h2 className="font-heading text-xl font-bold text-ink mb-6">
            Não encontrou o que estava procurando?
          </h2>
          <button onClick={() => setSupportOpen(true)} className="btn-primary px-8 py-3.5 text-base">
            <MessageCircle size={18} /> Falar com o suporte
          </button>
        </div>
      </section>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}

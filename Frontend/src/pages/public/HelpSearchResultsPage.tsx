import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, SearchX } from 'lucide-react'
import clsx from 'clsx'
import { searchHelpArticles } from '@/data/helpArticles'

export function HelpSearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const results = searchHelpArticles(query)

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-primary-50 rounded-b-[3rem] pt-10 pb-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to="/ajuda"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-6"
          >
            <ChevronLeft size={16} /> Voltar pra Ajuda
          </Link>

          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Resultados para "{query}"
          </h1>
          <p className="text-muted text-sm mt-1">
            {results.length} {results.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6">
        {results.length === 0 ? (
          <div className="card text-center py-12">
            <SearchX size={36} className="text-stroke mx-auto mb-3" />
            <p className="text-muted text-sm font-medium">Nenhum artigo encontrado para essa busca.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map(({ category, slug, icon, title, excerpt, accent }) => (
              <Link
                key={slug}
                to={`/ajuda/${category}/${slug}`}
                className="card-hover flex items-start gap-4"
              >
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', accent)}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{title}</h3>
                  <p className="text-muted text-sm mt-0.5 leading-relaxed">{excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

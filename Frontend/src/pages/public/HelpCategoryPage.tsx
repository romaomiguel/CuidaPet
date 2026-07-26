import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, Inbox } from 'lucide-react'
import clsx from 'clsx'
import { HELP_ARTICLES, findHelpCategory } from '@/data/helpArticles'

export function HelpCategoryPage() {
  const { categoria } = useParams<{ categoria: string }>()
  const category = findHelpCategory(categoria)

  if (!category) return <Navigate to="/404" replace />

  const articles = HELP_ARTICLES.filter(a => a.category === category.key)

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-primary-50 rounded-b-[3rem] pt-10 pb-14 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/ajuda"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-6"
          >
            <ChevronLeft size={16} /> Voltar pra Ajuda
          </Link>

          <div className="flex items-center gap-4">
            <div className={clsx('w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0', category.iconBg)}>
              {category.icon}
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{category.title}</h1>
              <p className="text-muted text-sm mt-1">{category.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6">
        {articles.length === 0 ? (
          <div className="card text-center py-12">
            <Inbox size={36} className="text-stroke mx-auto mb-3" />
            <p className="text-muted text-sm font-medium">Ainda não há artigos nesta categoria.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {articles.map(({ category: cat, slug, icon, title, excerpt, accent }) => (
              <Link
                key={slug}
                to={`/ajuda/${cat}/${slug}`}
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

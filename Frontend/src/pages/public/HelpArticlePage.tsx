import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import clsx from 'clsx'
import { findHelpArticle, findHelpCategory } from '@/data/helpArticles'

const BOLD_LINE = /^\*\*(.+)\*\*$/

/**
 * Cada bloco (separado por linha em branco) pode começar com uma linha `**Título**` —
 * essa linha vira subtítulo em negrito, e o restante do bloco continua como texto normal
 * logo abaixo. Blocos sem essa linha inicial são só um parágrafo comum.
 */
function ArticleBody({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-4">
      {content.split('\n\n').map((block, i) => {
        const lines = block.split('\n')
        const boldMatch = lines[0].trim().match(BOLD_LINE)
        if (!boldMatch) {
          return <p key={i} className="text-muted leading-relaxed whitespace-pre-line">{block}</p>
        }
        const rest = lines.slice(1).join(' ').trim()
        return (
          <div key={i}>
            <h3 className="font-heading font-bold text-ink mb-1">{boldMatch[1]}</h3>
            {rest && <p className="text-muted leading-relaxed whitespace-pre-line">{rest}</p>}
          </div>
        )
      })}
    </div>
  )
}

export function HelpArticlePage() {
  const { categoria, slug } = useParams<{ categoria: string; slug: string }>()
  const article = findHelpArticle(categoria, slug)
  const category = findHelpCategory(categoria)

  if (!article || !category) return <Navigate to="/404" replace />

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-primary-50 rounded-b-[3rem] pt-10 pb-14 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <Link
            to={`/ajuda/${category.key}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-6"
          >
            <ChevronLeft size={16} /> Voltar pra {category.title}
          </Link>

          <div className="flex items-center gap-4">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', article.accent)}>
              {article.icon}
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {article.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="card">
          <ArticleBody content={article.content} />
        </div>
      </section>
    </div>
  )
}

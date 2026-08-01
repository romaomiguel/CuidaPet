import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ChevronRight, PlayCircle, Footprints, Home, Gamepad2, Droplets,
  GraduationCap, MapPin, Search, Star, MessageCircle, Map as MapIcon, PawPrint, Plus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { petsitterService } from '@/services/petsitter.service'
import { CardPetsitter }    from '@/components/petsitter/CardPetsitter'
import { SkeletonPetsitterCard } from '@/components/ui/Skeleton'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { useServiceCatalog } from '@/hooks/useServiceCatalog'
import type { ServiceType } from '@/types'

const MATCH_STEPS = [
  { n: 1, title: 'Conte sobre seu pet',                 desc: 'Informações básicas e necessidades especiais.', accent: 'primary' as const },
  { n: 2, title: 'Nosso algoritmo calcula a afinidade',  desc: 'Cruzamento de dados para o match perfeito.',    accent: 'secondary' as const },
  { n: 3, title: 'Escolha o cuidador ideal',             desc: 'Converse, avalie perfis e feche o serviço.',    accent: 'primary' as const },
]

const SERVICES: { type: ServiceType; icon: ReactNode; title: string; desc: string; accent: 'primary' | 'secondary'; floatClassName: string }[] = [
  { type: 'passeio',      icon: <Footprints size={20} />,     title: 'Passeio',       desc: 'Diversão e exercício diário.',        accent: 'primary' as const,   floatClassName: 'top-2 left-0 sm:left-10 -rotate-3' },
  { type: 'hospedagem',   icon: <Home size={20} />,           title: 'Hospedagem',    desc: 'Cuidado no conforto do seu lar.',     accent: 'primary' as const,   floatClassName: 'top-2 right-0 sm:right-10 rotate-3' },
  { type: 'creche',       icon: <Gamepad2 size={20} />,       title: 'Creche',        desc: 'Brincadeiras o dia todo.',            accent: 'secondary' as const, floatClassName: 'bottom-24 sm:bottom-10 left-0 sm:left-10 rotate-2' },
  { type: 'banho_e_tosa', icon: <Droplets size={20} />,       title: 'Banho e Tosa',  desc: 'Higiene e cuidado com os pelos.',     accent: 'primary' as const,   floatClassName: 'bottom-24 sm:bottom-10 right-0 sm:right-10 -rotate-2' },
  { type: 'adestramento', icon: <GraduationCap size={20} />,  title: 'Adestramento',  desc: 'Educação e bons modos.',              accent: 'secondary' as const, floatClassName: '-bottom-2 left-1/2 -translate-x-1/2' },
]

const TRUST_POINTS = [
  { icon: <Star size={22} />,          title: 'Avaliações reais',       desc: 'Cada cuidador é avaliado por tutores que já usaram o serviço — sem enfeite.' },
  { icon: <MessageCircle size={22} />, title: 'Chat direto',            desc: 'Combine cada detalhe com o cuidador, antes, durante e depois do serviço.' },
  { icon: <MapIcon size={22} />,       title: 'Trajeto no mapa',        desc: 'Acompanhe o passeio do seu pet e veja o relatório ao final.' },
]

function FloatingServiceCard({ icon, title, desc, accent = 'primary', className, onClick }: {
  icon: ReactNode; title: string; desc: string; accent?: 'primary' | 'secondary'; className: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`hidden sm:flex absolute bg-white p-3.5 rounded-2xl shadow-lg items-center gap-3 w-48 sm:w-56 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-0 hover:z-30 cursor-pointer ${className}`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${accent === 'secondary' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-ink text-sm">{title}</h4>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const catalog = useServiceCatalog()
  const [city,    setCity]    = useState('')
  const [service, setService] = useState<ServiceType | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['petsitters', 'featured'],
    queryFn:  () => petsitterService.list({ minRating: 4 }),
    staleTime: 10 * 60 * 1000,
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn:  petsitterService.getCities,
    staleTime: Infinity,
  })

  const featured = data?.data?.slice(0, 4) ?? []

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city)    params.set('city',    city)
    if (service) params.set('service', service)
    navigate(`/buscar?${params.toString()}`)
  }

  return (
    <div className="flex flex-col">

      {/* ─── HERO — Match Inteligente é a ação principal ─────────── */}
      <section className="relative w-full overflow-hidden bg-primary-500 pt-16 pb-24 text-white">
        <div className="absolute inset-0 z-0 flex justify-end opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-secondary-500 blob-shape translate-x-1/3 -translate-y-1/4" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 flex flex-col items-start gap-6">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
              O amor e cuidado que seu pet merece, <span className="text-secondary-400">quando você precisar.</span>
            </h1>
            <p className="text-lg text-white/90 max-w-lg">
              Encontre cuidadores e petsitters apaixonados, avaliados por quem já usou e com chat direto para acompanhar cada cuidado.
            </p>

            {/* Match Inteligente — não é só um recurso, é o produto */}
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => navigate('/match')} className="btn-secondary px-8 py-4 text-base">
                Encontrar meu Match
              </button>
              <button
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-all"
              >
                <PlayCircle size={18} /> Ver como funciona
              </button>
            </div>

            {/* Busca manual — alternativa secundária ao Match */}
            <div className="w-full pt-4 mt-2 border-t border-white/15">
              <p className="text-xs font-semibold text-white/60 mb-2">ou busque manualmente</p>
              <form onSubmit={handleSearch} className="w-full bg-white rounded-2xl sm:rounded-pill shadow-card p-1.5 flex flex-col sm:flex-row gap-1.5">
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  cities={cities}
                  placeholder="Sua cidade..."
                  className="flex-1 px-3 py-2 rounded-pill text-ink text-sm"
                  icon={<MapPin size={15} className="text-muted flex-shrink-0" />}
                />
                <select
                  value={service}
                  onChange={e => setService(e.target.value as ServiceType | '')}
                  className="sm:w-40 px-3 py-2 rounded-pill text-sm text-ink outline-none bg-background cursor-pointer"
                >
                  <option value="">Serviço</option>
                  {catalog.byAudience('petsitter').map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary flex-shrink-0 text-sm">
                  <Search size={14} /> Buscar
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-1.5 text-xs mt-3">
                {SERVICES.slice(0, 4).map(({ type, title }) => (
                  <button
                    key={type}
                    onClick={() => navigate(`/buscar?service=${type}`)}
                    className="px-2.5 py-1 rounded-pill bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white/80 font-medium"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 relative z-10">
            <img
              src="/hero-dog.png"
              alt="Mulher sorrindo abraçando um cachorro"
              className="w-full h-[320px] sm:h-[400px] lg:h-[480px] object-cover rounded-3xl shadow-2xl"
            />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#E9EEF4"/>
          </svg>
        </div>
      </section>

      {/* ─── MATCH INTELIGENTE — o mecanismo central do produto ──── */}
      <section id="como-funciona" className="relative py-28 sm:py-32 px-4 sm:px-6 bg-primary-50 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/10 blob-shape-alt pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary-500/20 blob-shape pointer-events-none" />

        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 relative flex justify-center">
            <div className="absolute inset-0 bg-primary-500 blob-shape-alt opacity-90 scale-105 translate-x-4 -translate-y-4" />
            <img
              src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=700"
              alt="Pet fofo"
              className="relative z-10 w-full h-[320px] sm:h-[400px] object-cover blob-shape shadow-2xl"
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-8">
            <div>
              <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-primary-800 mb-3 leading-tight">Como funciona o Match Inteligente</h2>
              <p className="text-muted text-lg">Três passos simples para encontrar o profissional que melhor entende as necessidades do seu pet.</p>
            </div>

            <div className="flex flex-col gap-4">
              {MATCH_STEPS.map(({ n, title, desc, accent }) => (
                <div key={n} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 group">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-xl shadow-sm group-hover:scale-110 transition-transform ${accent === 'secondary' ? 'bg-secondary-500 text-primary-800' : 'bg-primary-500 text-white'}`}>
                    {n}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-primary-800 text-lg mb-0.5">{title}</h3>
                    <p className="text-muted text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/match')} className="btn-secondary self-start px-8 py-4 text-base">
              Encontrar meu Match
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#FBF9F8"/>
          </svg>
        </div>
      </section>

      {/* ─── NOSSOS SERVIÇOS ──────────────────────────────────────── */}
      <section id="nossos-servicos" className="py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-2 mb-12">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-700">Nossos Serviços</h2>
          <p className="text-muted text-lg">Tudo o que seu pet precisa, com o cuidador certo para cada momento.</p>
        </div>

        <div className="relative max-w-4xl mx-auto flex items-center justify-center min-h-[300px] sm:min-h-[600px] mt-6">
          <div className="relative w-56 h-56 sm:w-96 sm:h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-secondary-500 blob-shape opacity-80 rotate-12 scale-110" />
            <img
              src="/cachorro-sessao-servicos.png"
              alt="Cachorro dando as patas, pronto para ser cuidado"
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {SERVICES.map(({ type, icon, title, desc, accent, floatClassName }) => (
            <FloatingServiceCard
              key={type}
              icon={icon}
              title={title}
              desc={desc}
              accent={accent}
              className={floatClassName}
              onClick={() => navigate('/match')}
            />
          ))}

          <FloatingServiceCard
            icon={<Plus size={20} />}
            title="Mais serviços"
            desc="Veja tudo que oferecemos"
            accent="secondary"
            className="top-1/2 -translate-y-1/2 right-0 sm:-right-24 rotate-6"
            onClick={() => navigate('/match')}
          />
        </div>

        {/* Mobile: lista simples no lugar dos cards flutuantes (que não cabem numa tela estreita) */}
        <div className="sm:hidden max-w-md mx-auto grid grid-cols-2 gap-3 mt-6">
          {SERVICES.map(({ type, icon, title, desc, accent }) => (
            <button
              key={type}
              onClick={() => navigate('/match')}
              className="bg-white p-3.5 rounded-2xl shadow-card flex items-start gap-2.5 text-left"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${accent === 'secondary' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                {icon}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-ink text-sm leading-tight">{title}</h4>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => navigate('/match')}
            className="bg-white p-3.5 rounded-2xl shadow-card flex items-start gap-2.5 text-left"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-secondary-100 text-secondary-700">
              <Plus size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-ink text-sm leading-tight">Mais serviços</h4>
              <p className="text-xs text-muted mt-0.5">Veja tudo que oferecemos</p>
            </div>
          </button>
        </div>
      </section>

      {/* ─── CONFIANÇA — o que já protege tutor e pet hoje ───────── */}
      <section className="relative py-20 px-4 sm:px-6 bg-primary-800 text-white overflow-hidden">
        <div className="absolute -top-24 right-0 w-72 h-72 bg-secondary-500/10 blob-shape pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="max-w-xl mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-3">Cuidado que você acompanha de perto</h2>
            <p className="text-white/80 text-lg">Nada de confiar às cegas — você vê o que está acontecendo, do match ao fim do serviço.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {TRUST_POINTS.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-secondary-400">
                  {icon}
                </div>
                <h3 className="font-heading font-bold text-lg text-white">{title}</h3>
                <p className="text-white/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#244F8C"/>
          </svg>
        </div>
      </section>

      {/* ─── PETSITTERS EM DESTAQUE ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-primary-500">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl font-bold text-white mb-2">Petsitters em destaque</h2>
              <p className="text-primary-100">Os mais bem avaliados da plataforma</p>
            </div>
            <button
              onClick={() => navigate('/buscar')}
              className="hidden sm:flex items-center gap-1 text-secondary-400 font-semibold text-sm hover:gap-2 transition-all"
            >
              Ver todos <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => <SkeletonPetsitterCard key={i} />)
              : featured.length > 0
                ? featured.map(ps => <CardPetsitter key={ps.id} petsitter={ps} />)
                : (
                  <div className="col-span-4 py-12 text-center bg-white/10 rounded-2xl">
                    <PawPrint size={36} className="mx-auto mb-3 text-white/70" />
                    <p className="text-white font-medium">Nenhum petsitter cadastrado ainda.</p>
                    <p className="text-primary-100 text-sm mt-1">Seja o primeiro a se cadastrar!</p>
                  </div>
                )
            }
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('/buscar')} className="btn-secondary">
              Ver todos os petsitters <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── CTA — TORNE-SE PETSITTER ─────────────────────────────── */}
      <section className="relative py-20 px-4 sm:px-6 bg-primary-800 overflow-hidden">
        <div className="absolute inset-0 flex justify-center opacity-30 pointer-events-none">
          <div className="w-[600px] h-[600px] bg-secondary-500 blob-shape-alt translate-y-1/4" />
        </div>
        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">Pronto para se tornar um petsitter?</h2>
            <p className="text-white/80 text-lg">Junte-se à nossa comunidade e ganhe dinheiro fazendo o que ama.</p>
          </div>
          <button onClick={() => navigate('/cadastro')} className="btn-secondary px-8 py-4 text-base whitespace-nowrap">
            Cadastrar-se como cuidador
          </button>
        </div>
      </section>
    </div>
  )
}

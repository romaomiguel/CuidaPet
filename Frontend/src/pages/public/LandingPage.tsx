import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Sparkles, PlayCircle, Footprints, Home, Gamepad2, Droplets, GraduationCap, MapPin, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { petsitterService } from '@/services/petsitter.service'
import { CardPetsitter }    from '@/components/petsitter/CardPetsitter'
import { SkeletonPetsitterCard } from '@/components/ui/Skeleton'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { serviceLabels } from '@/utils'
import type { ServiceType } from '@/types'

const MATCH_STEPS = [
  { n: 1, title: 'Conte sobre seu pet',                 desc: 'Informações básicas e necessidades especiais.', accent: 'primary' as const },
  { n: 2, title: 'Nosso algoritmo calcula a afinidade',  desc: 'Cruzamento de dados para o match perfeito.',    accent: 'secondary' as const },
  { n: 3, title: 'Escolha o cuidador ideal',             desc: 'Converse, avalie perfis e feche o serviço.',    accent: 'primary' as const },
]

const SERVICES = [
  { icon: <Footprints size={20} />,     title: 'Passeio',                     desc: 'Diversão e exercício diário.',            accent: 'primary' as const,   floatClassName: 'top-2 left-0 sm:left-10 -rotate-3' },
  { icon: <Home size={20} />,           title: 'Hospedagem (Petsitting)',     desc: 'Cuidado no conforto do seu lar.',         accent: 'primary' as const,   floatClassName: 'top-2 right-0 sm:right-10 rotate-3' },
  { icon: <Gamepad2 size={20} />,       title: 'Creche',                     desc: 'Brincadeiras o dia todo.',                accent: 'secondary' as const, floatClassName: 'bottom-24 sm:bottom-10 left-0 sm:left-10 rotate-2' },
  { icon: <Droplets size={20} />,       title: 'Banho e Tosa',                desc: 'Higiene e cuidado com os pelos.',         accent: 'primary' as const,   floatClassName: 'bottom-24 sm:bottom-10 right-0 sm:right-10 -rotate-2' },
  { icon: <GraduationCap size={20} />,  title: 'Adestramento',                desc: 'Educação e bons modos.',                  accent: 'secondary' as const, floatClassName: '-bottom-2 left-1/2 -translate-x-1/2' },
]

function FloatingServiceCard({ icon, title, desc, accent = 'primary', className }: {
  icon: ReactNode; title: string; desc: string; accent?: 'primary' | 'secondary'; className: string
}) {
  return (
    <div className={`hidden sm:flex absolute bg-white p-3.5 rounded-2xl shadow-lg items-center gap-3 w-48 sm:w-56 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:rotate-0 hover:z-30 cursor-pointer ${className}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${accent === 'secondary' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-primary-800 text-sm">{title}</h4>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
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

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-primary-500 pt-16 pb-28 text-white">
        <div className="absolute inset-0 z-0 flex justify-end opacity-20 pointer-events-none">
          <div className="w-[800px] h-[800px] bg-secondary-500 blob-shape translate-x-1/3 -translate-y-1/4" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-secondary-500 text-primary-800 font-bold text-sm shadow-sm">
              <Sparkles size={18} /> Match Inteligente CuidaPet
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight drop-shadow-sm">
              O amor e cuidado que seu pet merece, <span className="text-secondary-400">quando você precisar.</span>
            </h1>
            <p className="text-lg text-white/90 max-w-lg">
              Encontre cuidadores e petsitters apaixonados, verificados com antecedência e com acompanhamento em tempo real para seu melhor amigo.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={() => navigate('/match')} className="btn-secondary px-8 py-4 text-base">
                Encontrar meu Match
              </button>
              <button
                onClick={() => document.getElementById('nossos-servicos')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-pill text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 flex items-center gap-2 transition-all"
              >
                <PlayCircle size={20} /> Ver como funciona
              </button>
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
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#FBF9F8"/>
          </svg>
        </div>
      </section>

      {/* ─── BUSCA MANUAL ─────────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-muted mb-3">ou busque manualmente</p>
          <form onSubmit={handleSearch} className="bg-white rounded-pill shadow-card p-2 flex flex-col sm:flex-row gap-2">
            <CityAutocomplete
              value={city}
              onChange={setCity}
              cities={cities}
              placeholder="Sua cidade..."
              className="flex-1 px-3 py-2 rounded-pill"
              icon={<MapPin size={16} className="text-muted flex-shrink-0" />}
            />
            <select
              value={service}
              onChange={e => setService(e.target.value as ServiceType | '')}
              className="sm:w-44 px-3 py-2.5 rounded-pill text-sm text-ink outline-none bg-background cursor-pointer"
            >
              <option value="">Serviço</option>
              {Object.entries(serviceLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary flex-shrink-0 text-sm">
              <Search size={15} /> Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ─── NOSSOS SERVIÇOS ──────────────────────────────────────── */}
      <section id="nossos-servicos" className="py-16 px-4 sm:px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-2 mb-4">
          <h2 className="font-heading text-3xl font-bold text-primary-700">Nossos Serviços</h2>
          <p className="text-muted">Tudo o que seu pet precisa em um só lugar.</p>
        </div>

        <div className="relative max-w-4xl mx-auto flex items-center justify-center min-h-[300px] sm:min-h-[600px] mt-6">
          <div className="relative w-56 h-56 sm:w-96 sm:h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-secondary-500 blob-shape opacity-80 rotate-12 scale-110" />
            <img
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=700"
              alt="Cuidador com pet"
              className="relative z-10 w-full h-full object-cover blob-shape-alt shadow-2xl"
            />
          </div>

          {SERVICES.map(({ icon, title, desc, accent, floatClassName }) => (
            <FloatingServiceCard key={title} icon={icon} title={title} desc={desc} accent={accent} className={floatClassName} />
          ))}
        </div>

        {/* Mobile: lista simples no lugar dos cards flutuantes (que não cabem numa tela estreita) */}
        <div className="sm:hidden max-w-md mx-auto grid grid-cols-2 gap-3 mt-6">
          {SERVICES.map(({ icon, title, desc, accent }) => (
            <div key={title} className="bg-white p-3.5 rounded-2xl shadow-card flex items-start gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${accent === 'secondary' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                {icon}
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-primary-800 text-sm leading-tight">{title}</h4>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MATCH INTELIGENTE ────────────────────────────────────── */}
      <section className="relative py-28 sm:py-32 px-4 sm:px-6 bg-primary-50 overflow-hidden">
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
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-primary-500 text-white font-bold text-xs uppercase tracking-wider mb-4">
                <Sparkles size={14} /> Como funciona
              </span>
              <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-primary-800 mb-3 leading-tight">Match Inteligente</h2>
              <p className="text-muted text-lg">Três passos simples para encontrar o profissional que melhor entende as necessidades do seu pet.</p>
            </div>

            <div className="flex flex-col gap-4">
              {MATCH_STEPS.map(({ n, title, desc, accent }) => (
                <div key={n} className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer group">
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
                    <p className="text-4xl mb-3">🐾</p>
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Shield, Star, Clock, ArrowRight, ChevronRight, User, Calendar, Check, Heart, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { petsitterService } from '@/services/petsitter.service'
import { CardPetsitter }    from '@/components/petsitter/CardPetsitter'
import { SkeletonPetsitterCard } from '@/components/ui/Skeleton'
import { CityAutocomplete } from '@/components/ui/CityAutocomplete'
import { serviceLabels } from '@/utils'
import type { ServiceType } from '@/types'

const SERVICES: { type: ServiceType; emoji: string; desc: string }[] = [
  { type: 'hospedagem',  emoji: '🏠', desc: 'Seu pet dorme em casa do petsitter' },
  { type: 'passeio',    emoji: '🦮', desc: 'Passeios diários com muito amor'      },
  { type: 'creche',     emoji: '🎾', desc: 'Diversão e cuidado durante o dia'     },
  { type: 'visita',     emoji: '🚪', desc: 'O petsitter vai até você'             },
  { type: 'banho_e_tosa', emoji: '🛁', desc: 'Banho, tosa e beleza'              },
  { type: 'adestramento', emoji: '🎓', desc: 'Treinamento positivo e eficaz'     },
]

const TESTIMONIALS = [
  { name: 'Ana Paula', city: 'São Paulo', rating: 5, text: 'Serviço impecável! Minha Luna ficou super feliz e bem cuidada. Com certeza vou usar sempre!', avatar: 'A' },
  { name: 'Carlos M.', city: 'Rio de Janeiro', rating: 5, text: 'Encontrei uma petsitter incrível para meu Bob. Ela enviou fotos durante todo o período. Recomendo demais!', avatar: 'C' },
  { name: 'Júlia S.',  city: 'Belo Horizonte', rating: 5, text: 'Aplicativo super fácil de usar. O processo de agendamento é muito simples e seguro. Adorei!', avatar: 'J' },
]

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
      <section className="relative min-h-[92vh] flex items-center bg-primary overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-secondary-400/10 blur-2xl" />
          {/* Paw pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='15' y='40' font-size='30'%3E🐾%3C/text%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* ── Left Column: Text & Search ── */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in border border-white/20">
              <Star size={14} className="fill-secondary-400 text-secondary-400" />
              +2.000 petsitters verificados em todo o Brasil
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4 text-balance animate-slide-up leading-tight">
              O melhor cuidado para o seu melhor amigo
            </h1>
            <p className="text-lg text-white/75 mb-3 max-w-xl mx-auto lg:mx-0 animate-slide-up">
              Responda 5 perguntas e receba os petsitters perfeitos para o seu momento em segundos.
            </p>

            {/* ── Match CTA — PRINCIPAL ── */}
            <div className="animate-slide-up mb-5">
              <button
                onClick={() => navigate('/match')}
                className="inline-flex items-center gap-3 bg-white text-primary-600 font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-300 group border border-white/50"
              >
                ✨ Encontrar meu Match ideal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-white/60 text-sm mt-2 text-center lg:text-left">
                Grátis · Sem cadastro necessário
              </p>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 max-w-sm animate-fade-in mb-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs font-medium">ou busque manualmente</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Search bar — secundário */}
            <form
              onSubmit={handleSearch}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 animate-slide-up max-w-xl mx-auto lg:mx-0"
            >
              <CityAutocomplete
                value={city}
                onChange={setCity}
                cities={cities}
                placeholder="Sua cidade..."
                className="flex-1 px-3 py-2 border border-white/30 rounded-xl focus-within:ring-2 focus-within:ring-white/40 transition-all bg-white/10 text-white placeholder-white/50"
                icon={<MapPin size={16} className="text-white/50 flex-shrink-0" />}
              />
              <select
                value={service}
                onChange={e => setService(e.target.value as ServiceType | '')}
                className="sm:w-44 px-3 py-2.5 border border-white/30 rounded-xl text-sm text-white/80 outline-none focus:ring-2 focus:ring-white/40 bg-white/10 cursor-pointer"
              >
                <option value="" className="text-gray-800">Serviço</option>
                {Object.entries(serviceLabels).map(([k, v]) => (
                  <option key={k} value={k} className="text-gray-800">{v}</option>
                ))}
              </select>
              <button type="submit" className="bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl flex-shrink-0 hover:bg-white/90 transition-colors flex items-center gap-1.5 text-sm">
                <Search size={15} /> Buscar
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/70 text-sm animate-fade-in">
              {[
                { icon: '✓', text: 'Petsitters verificados' },
                { icon: '✓', text: 'Pagamento seguro'       },
                { icon: '✓', text: 'Avaliações reais'       },
              ].map(({ icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <span className="text-secondary-400 font-bold">{icon}</span>{text}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right Column: Image ── */}
          <div className="flex-1 w-full max-w-md lg:max-w-none relative animate-slide-up">
            <div className="absolute inset-0 bg-secondary-400 rounded-full blur-3xl opacity-20 transform translate-x-10 translate-y-10" />
            <img 
              src="/hero-dog.png" 
              alt="Mulher sorrindo abraçando um cachorro" 
              className="relative z-10 w-full h-auto object-cover rounded-[2rem] border-8 border-white shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500"
            />
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 20C480 40 240 80 0 40L0 80Z" fill="#F7FAFC"/>
          </svg>
        </div>
      </section>

      {/* ─── SERVICES ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink mb-3">O que você precisa?</h2>
            <p className="text-muted">Escolha o serviço ideal para o seu pet</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICES.map(({ type, emoji, desc }) => (
              <button
                key={type}
                onClick={() => navigate(`/buscar?service=${type}`)}
                className="group card-hover flex flex-col items-center text-center p-5 gap-3"
              >
                <div className="text-4xl group-hover:scale-110 transition-transform duration-200">{emoji}</div>
                <div>
                  <p className="font-semibold text-ink text-sm">{serviceLabels[type]}</p>
                  <p className="text-xs text-muted mt-0.5 hidden sm:block">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (NOVO LAYOUT) ─────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white overflow-hidden border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col lg:flex-row items-stretch gap-16 lg:gap-8">
            
            {/* Lado Esquerdo */}
            <div className="lg:w-5/12 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
               {/* Ilustração Abstrata de Rotina (App UI Mockup) */}
               <div className="w-full max-w-[320px] mb-10 relative h-[280px]">
                 {/* Fundo com formas suaves */}
                 <div className="absolute inset-0 bg-primary-50 rounded-[40px] transform -rotate-3 transition-transform hover:rotate-0 duration-500"></div>
                 <div className="absolute inset-0 bg-secondary-50 rounded-[40px] transform rotate-3 opacity-70"></div>
                 
                 {/* Mockup: Barra de Busca */}
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4/5 h-12 bg-white rounded-full shadow-sm flex items-center px-4 gap-3">
                   <Search size={18} className="text-gray-400" />
                   <div className="h-2.5 w-1/2 bg-gray-100 rounded-full"></div>
                 </div>

                 {/* Mockup: Card do Petsitter */}
                 <div className="absolute top-24 left-6 right-8 bg-white rounded-2xl shadow-card p-4 flex items-center gap-4 z-10">
                   <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-500">
                     <User size={24} />
                   </div>
                   <div className="flex-1 space-y-2.5">
                     <div className="h-3 w-3/4 bg-gray-200 rounded-full"></div>
                     <div className="flex gap-1">
                       <Star size={12} className="fill-secondary-500 text-secondary-500" />
                       <Star size={12} className="fill-secondary-500 text-secondary-500" />
                       <Star size={12} className="fill-secondary-500 text-secondary-500" />
                       <Star size={12} className="fill-secondary-500 text-secondary-500" />
                       <Star size={12} className="fill-secondary-500 text-secondary-500" />
                     </div>
                   </div>
                 </div>

                 {/* Mockup: Calendário / Reserva */}
                 <div className="absolute bottom-8 right-4 bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center justify-center gap-2 z-20 transform rotate-3">
                   <Calendar size={24} className="text-primary-500" />
                   <div className="h-2 w-12 bg-gray-100 rounded-full mt-1"></div>
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-white">
                     <Check size={14} strokeWidth={3} />
                   </div>
                 </div>
                 
                 {/* Mockup: Pet Feliz flutuando */}
                 <div className="absolute -left-6 bottom-12 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white z-30">
                   <span className="text-3xl">🐶</span>
                 </div>
               </div>

               <h2 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight mb-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
                 Como <span className="text-primary-500">funciona</span>
               </h2>
               <p className="text-muted text-lg max-w-md leading-relaxed">
                 O CuidaPet foi criado para ser amigável e direto. Sem complicação, você garante o bem-estar do seu pet rapidinho.
               </p>
            </div>

            {/* Timeline Central + Lado Direito */}
            <div className="lg:w-7/12 flex relative pt-4 lg:pl-10">
               {/* Linha vertical (Timeline) */}
               <div className="absolute left-[38px] sm:left-[46px] top-10 bottom-10 w-0.5 bg-stroke hidden sm:block"></div>

               <div className="flex flex-col gap-10 w-full relative">

                 {/* ── Passo 0 — Match Inteligente (NOVO) ── */}
                 <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 border-[6px] border-white flex items-center justify-center text-white font-bold text-lg z-10 flex-shrink-0 shadow-md ml-4 sm:ml-0">
                     ✨
                   </div>
                   <div className="pt-1.5 px-4 sm:px-0">
                     <div className="flex items-center gap-2 mb-1.5">
                       <h3 className="text-xl font-bold text-ink">Use o Match Inteligente</h3>
                       <span className="inline-flex items-center gap-1 text-xs font-bold bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">
                         Novo
                       </span>
                     </div>
                     <p className="text-xs font-semibold text-primary-600 mb-1.5">Economize horas de pesquisa</p>
                     <p className="text-muted leading-relaxed">
                       Diga o que precisa em 30 segundos. Analisamos disponibilidade, localização, avaliações e orçamento para indicar os melhores.
                     </p>
                     <button
                       onClick={() => navigate('/match')}
                       className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 group"
                     >
                       Começar o Match <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                     </button>
                   </div>
                 </div>

                 {/* Passo 1 */}
                 <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                   <div className="w-12 h-12 rounded-full bg-primary-100 border-[6px] border-white flex items-center justify-center text-primary-500 font-bold text-lg z-10 flex-shrink-0 shadow-sm ml-4 sm:ml-0">
                     1
                   </div>
                   <div className="pt-1.5 px-4 sm:px-0">
                     <h3 className="text-xl font-bold text-ink mb-2">Encontrar</h3>
                     <p className="text-muted leading-relaxed">
                       Busque profissionais qualificados na sua região. Filtre por serviços, preço e veja avaliações reais de outros tutores.
                     </p>
                   </div>
                 </div>

                 {/* Passo 2 */}
                 <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                   <div className="w-12 h-12 rounded-full bg-secondary-100 border-[6px] border-white flex items-center justify-center text-secondary-600 font-bold text-lg z-10 flex-shrink-0 shadow-sm ml-4 sm:ml-0">
                     2
                   </div>
                   <div className="pt-1.5 px-4 sm:px-0">
                     <h3 className="text-xl font-bold text-ink mb-2">Reservar</h3>
                     <p className="text-muted leading-relaxed">
                       Selecione as datas, combine os detalhes no chat e faça o agendamento pela plataforma de forma segura.
                     </p>
                   </div>
                 </div>

                 {/* Passo 3 */}
                 <div className="flex flex-col sm:flex-row items-start gap-6 relative">
                   <div className="w-12 h-12 rounded-full bg-green-100 border-[6px] border-white flex items-center justify-center text-green-600 font-bold text-lg z-10 flex-shrink-0 shadow-sm ml-4 sm:ml-0">
                     3
                   </div>
                   <div className="pt-1.5 px-4 sm:px-0">
                     <h3 className="text-xl font-bold text-ink mb-2">Aproveitar</h3>
                     <p className="text-muted leading-relaxed">
                       Receba fotos e atualizações durante o serviço. Relaxe sabendo que seu pet está com quem ama o que faz.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Botão Inferior CTA */}
          <div className="mt-16 pt-8 border-t border-stroke flex justify-center">
            <button onClick={() => navigate('/buscar')} className="btn-primary px-8 py-4 text-base sm:text-lg rounded-2xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
               <Search size={20} /> Começar a usar agora
            </button>
          </div>

        </div>
      </section>

      {/* ─── FEATURED PETSITTERS ─────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-ink mb-2">Petsitters em destaque</h2>
              <p className="text-muted">Os mais bem avaliados da plataforma</p>
            </div>
            <button
              onClick={() => navigate('/buscar')}
              className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold text-sm hover:gap-2 transition-all"
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
                  <div className="col-span-4 py-12 text-center">
                    <p className="text-4xl mb-3">🐾</p>
                    <p className="text-gray-500 font-medium">Nenhum petsitter cadastrado ainda.</p>
                    <p className="text-gray-400 text-sm mt-1">Seja o primeiro a se cadastrar!</p>
                  </div>
                )
            }
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('/buscar')} className="btn-outline">
              Ver todos os petsitters <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECURITY & CARE ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white border-t border-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          
          {/* Ícone no Topo */}
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
            <Heart size={28} className="fill-red-500" />
          </div>

          {/* Título Principal */}
          <h2 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight mb-20 text-center max-w-2xl leading-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Cuidamos do seu pet com <br className="hidden sm:block" />
            <span className="text-primary-500">todo amor e segurança</span>
          </h2>

          {/* Blocos de Benefícios (3 Colunas) */}
          <div className="grid md:grid-cols-3 gap-12 w-full mb-16 px-4 sm:px-0">
            
            {/* Benefício 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Garantia Veterinária</h3>
              <p className="text-muted leading-relaxed mb-5 text-sm">
                Cobertura completa para emergências durante qualquer serviço realizado pela plataforma. Seu pet 100% protegido.
              </p>
              <button className="text-primary-600 font-semibold text-sm hover:underline">
                Ver detalhes
              </button>
            </div>

            {/* Benefício 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-secondary-50 rounded-2xl flex items-center justify-center text-secondary-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Petsitters Verificados</h3>
              <p className="text-muted leading-relaxed text-sm">
                Apenas 15% dos candidatos são aprovados. Analisamos antecedentes, experiência e realizamos entrevistas rigorosas.
              </p>
            </div>

            {/* Benefício 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                <User size={28} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Pré-encontro</h3>
              <p className="text-muted leading-relaxed text-sm">
                Conheça o cuidador antes do serviço começar. Um bate-papo sem compromisso para garantir que dá 'match'.
              </p>
            </div>

          </div>

          {/* Botão Inferior CTA */}
          <button onClick={() => navigate('/buscar')} className="btn-primary px-10 py-4 text-lg rounded-full shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <Search size={20} /> Encontrar cuidador seguro
          </button>

        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-primary-500 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-secondary-400/10 blur-2xl" />
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pronto para começar?
            </h2>
            <p className="text-white/70 text-lg">
              Junte-se a mais de 2.000 tutores que já usam o CuidaPet.
            </p>
          </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/match')}
                className="bg-white text-primary-600 font-bold px-6 py-3 rounded-xl hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                ✨ Encontrar Match
              </button>
              <button
                onClick={() => navigate('/buscar')}
                className="bg-secondary-400 text-ink font-bold px-6 py-3 rounded-xl hover:bg-secondary-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <Search size={16} /> Busca manual
              </button>
              <button
                onClick={() => navigate('/cadastro')}
                className="border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                Quero ser petsitter
              </button>
            </div>
        </div>
      </section>
    </div>
  )
}

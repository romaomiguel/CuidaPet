import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, LocateFixed, ArrowRight, ArrowLeft, Clock, CalendarDays, CheckCircle2, Wallet, Info, CheckCircle } from 'lucide-react'
import { serviceLabels } from '@/utils'
import { AmbientBlobs } from '@/components/ui/AmbientBlobs'
import { StepProgress } from '@/components/ui/StepProgress'
import { petService } from '@/services/pet.service'
import type { ServiceType } from '@/types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ── Constantes ─────────────────────────────────────────────────────────────────

const SERVICES: { type: ServiceType; emoji: string; desc: string; ring: string; bg: string }[] = [
  { type: 'hospedagem',   emoji: '🏠', desc: 'Cuidados dia e noite',   ring: 'peer-checked:border-primary-500',   bg: 'bg-primary-100 text-primary-700'   },
  { type: 'passeio',      emoji: '🦮', desc: 'Exercício diário',       ring: 'peer-checked:border-secondary-500', bg: 'bg-secondary-100 text-secondary-700' },
  { type: 'creche',       emoji: '🎾', desc: 'Diversão de dia',        ring: 'peer-checked:border-primary-500',   bg: 'bg-primary-100 text-primary-700'   },
  { type: 'visita',       emoji: '🚪', desc: 'O cuidador vai até você', ring: 'peer-checked:border-secondary-500', bg: 'bg-secondary-100 text-secondary-700' },
  { type: 'banho_e_tosa', emoji: '🛁', desc: 'Limpeza completa',       ring: 'peer-checked:border-primary-500',   bg: 'bg-primary-100 text-primary-700'   },
  { type: 'adestramento', emoji: '🎓', desc: 'Educação positiva',      ring: 'peer-checked:border-error-500',     bg: 'bg-error-50 text-error-600'         },
]

const SPECIES_OPTIONS = [
  { value: 'cachorro', label: 'Cachorro', icon: '🐕' },
  { value: 'gato',     label: 'Gato',     icon: '🐈' },
  { value: 'ave',      label: 'Ave',       icon: '🦜' },
  { value: 'roedor',   label: 'Roedor',   icon: '🐹' },
  { value: 'reptil',   label: 'Réptil',   icon: '🦎' },
  { value: 'outro',    label: 'Outro',    icon: '🐾' },
]

// Serviços que cobram por diária
const DAILY_SERVICES: ServiceType[] = ['hospedagem', 'creche']

// Gera opções de horário de 30 em 30 min
function buildTimeOptions() {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return opts
}
const TIME_OPTIONS = buildTimeOptions()

const BUDGET_TIERS = [
  { max: 50,  text: 'Básico e acessível',        className: 'bg-stroke text-muted'          },
  { max: 120, text: 'Faixa padrão da plataforma', className: 'bg-primary-100 text-primary-700' },
  { max: 180, text: 'Cuidadores Premium',         className: 'bg-secondary-100 text-secondary-700' },
  { max: 250, text: 'Serviço VIP & Certificados', className: 'bg-primary-800 text-white'      },
]
function budgetTier(value: number) {
  return BUDGET_TIERS.find(t => value <= t.max) ?? BUDGET_TIERS[BUDGET_TIERS.length - 1]
}

const TOTAL_STEPS = 4
const STEP_LABELS = ['Serviço', 'Localização e Data', 'Detalhes do Pet', 'Orçamento']

// ── Componente ──────────────────────────────────────────────────────────────────

export function MatchWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Estado do wizard
  const [service,       setService]       = useState<ServiceType | ''>('')
  const [species,       setSpecies]       = useState<string>('')
  const [notes,         setNotes]         = useState<string>('')
  const [date,          setDate]          = useState<string>('')
  const [startTime,     setStartTime]     = useState<string>('')
  const [endTime,       setEndTime]       = useState<string>('')
  const [endDate,       setEndDate]       = useState<string>('')
  const [city,          setCity]          = useState<string>('')
  const [neighborhood,  setNeighborhood]  = useState<string>('')
  const [maxPrice,      setMaxPrice]      = useState<string>('80')

  const [selectedPetId,        setSelectedPetId]        = useState<string>('')
  const [needsAirConditioning, setNeedsAirConditioning] = useState(false)
  const [needsBackyard,        setNeedsBackyard]        = useState(false)
  const [preferredWalkSchedule, setPreferredWalkSchedule] = useState<'' | 'manha' | 'noite'>('')
  const [preferredHomeType,    setPreferredHomeType]    = useState<'' | 'casa' | 'apartamento'>('')

  const { data: savedPets = [] } = useQuery({
    queryKey: ['pets'],
    queryFn:  petService.list,
  })

  const isDaily = DAILY_SERVICES.includes(service as ServiceType)
  const tier = budgetTier(Number(maxPrice) || 80)

  const selectPet = (pet: (typeof savedPets)[number]) => {
    setSelectedPetId(pet.id)
    setSpecies(pet.species)
  }

  // ── Validação por passo ───────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && !service)  return toast.error('Selecione um serviço!')
    if (step === 2 && !city)     return toast.error('Informe sua cidade!')
    if (step === 2 && !date)     return toast.error('Informe a data do serviço!')
    if (step === 3 && !species)  return toast.error('Selecione a espécie do seu pet!')

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      const params = new URLSearchParams()
      params.append('service', service)
      params.append('species', species)
      params.append('city', city)
      if (neighborhood) params.append('neighborhood', neighborhood)
      if (date)         params.append('date', date)
      if (!isDaily && startTime) params.append('startTime', startTime)
      if (!isDaily && endTime)   params.append('endTime', endTime)
      if (isDaily && endDate)    params.append('endDate', endDate)
      if (maxPrice)     params.append('maxPrice', maxPrice)
      if (selectedPetId)         params.append('petId', selectedPetId)
      if (needsAirConditioning)  params.append('needsAirConditioning', 'true')
      if (needsBackyard)         params.append('needsBackyard', 'true')
      if (preferredWalkSchedule) params.append('preferredWalkSchedule', preferredWalkSchedule)
      if (preferredHomeType)     params.append('preferredHomeType', preferredHomeType)
      navigate(`/match/resultados?${params.toString()}`)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background flex items-start justify-center py-16 px-4 overflow-hidden">
      <AmbientBlobs />
      <div className="relative z-10 w-full max-w-2xl">

        {/* Card principal */}
        <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 flex flex-col gap-8">

          <StepProgress step={step} totalSteps={TOTAL_STEPS} label={STEP_LABELS[step - 1]} />

          <div className="min-h-[360px] flex flex-col">

            {/* ── Passo 1 — Serviço ─────────────────────────────── */}
            {step === 1 && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="text-center">
                  <h1 className="font-heading text-3xl font-bold text-ink mb-1">O que seu pet precisa hoje?</h1>
                  <p className="text-muted">Selecione o serviço principal para encontrarmos o cuidador ideal.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {SERVICES.map(({ type, emoji, desc, ring, bg }) => (
                    <label key={type} className="relative cursor-pointer group">
                      <input
                        type="radio"
                        name="service"
                        checked={service === type}
                        onChange={() => setService(type)}
                        className="peer sr-only"
                      />
                      <div className={clsx(
                        'h-full flex flex-col items-center justify-center p-4 rounded-2xl bg-white shadow-sm border-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-md peer-checked:bg-background',
                        ring,
                      )}>
                        <div className={clsx('w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2', bg)}>
                          {emoji}
                        </div>
                        <span className="font-semibold text-sm text-ink text-center">{serviceLabels[type]}</span>
                        <span className="text-xs text-muted text-center mt-0.5">{desc}</span>
                      </div>
                      {service === type && (
                        <CheckCircle2 size={20} className="absolute top-2 right-2 text-primary-600" fill="white" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passo 2 — Localização e Data ──────────────────── */}
            {step === 2 && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="text-center">
                  <h1 className="font-heading text-3xl font-bold text-ink mb-1">Onde e quando?</h1>
                  <p className="text-muted">Conte pra gente onde seu pet precisa de cuidado e as datas certinhas.</p>
                </div>

                <div className="flex flex-col gap-5 max-w-md mx-auto w-full">
                  <div>
                    <label className="label" htmlFor="match-city">Localização</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <input
                        id="match-city"
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Digite sua cidade..."
                        className="input-field pl-11 pr-32"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => toast('Detecção automática em breve! 📍')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary-600 bg-background px-3 py-2 rounded-pill transition-colors"
                      >
                        <LocateFixed size={14} /> Usar atual
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="match-neighborhood">
                      Bairro <span className="text-muted font-normal">(opcional)</span>
                    </label>
                    <input
                      id="match-neighborhood"
                      type="text"
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      placeholder="Ex: Pinheiros, Copacabana..."
                      className="input-field"
                    />
                  </div>

                  {isDaily ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label" htmlFor="match-date-entrada">
                          <CalendarDays size={14} className="inline mr-1 text-primary-500" /> Data de entrada
                        </label>
                        <input id="match-date-entrada" type="date" min={today} value={date}
                          onChange={e => setDate(e.target.value)} className="input-field w-full" />
                      </div>
                      <div>
                        <label className="label" htmlFor="match-date-saida">
                          <CalendarDays size={14} className="inline mr-1 text-primary-500" /> Data de saída
                        </label>
                        <input id="match-date-saida" type="date" min={date || today} value={endDate}
                          onChange={e => setEndDate(e.target.value)} className="input-field w-full" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label" htmlFor="match-date">
                          <CalendarDays size={14} className="inline mr-1 text-primary-500" /> Data do serviço
                        </label>
                        <input id="match-date" type="date" min={today} value={date}
                          onChange={e => setDate(e.target.value)} className="input-field w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label" htmlFor="match-start-time">
                            <Clock size={14} className="inline mr-1 text-primary-500" /> Início
                          </label>
                          <select id="match-start-time" value={startTime} onChange={e => setStartTime(e.target.value)} className="select-field w-full">
                            <option value="">Selecione</option>
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label" htmlFor="match-end-time">
                            <Clock size={14} className="inline mr-1 text-primary-500" /> Fim
                          </label>
                          <select id="match-end-time" value={endTime} onChange={e => setEndTime(e.target.value)} className="select-field w-full">
                            <option value="">Selecione</option>
                            {TIME_OPTIONS.filter(t => !startTime || t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2 border-t border-stroke">
                    <label className="label mb-3">Preferências de ambiente (opcional)</label>
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setNeedsAirConditioning(v => !v)}
                        className={needsAirConditioning ? 'toggle-chip-active' : 'toggle-chip'}
                      >
                        Preciso de ambiente com ar-condicionado
                      </button>
                      <button
                        type="button"
                        onClick={() => setNeedsBackyard(v => !v)}
                        className={needsBackyard ? 'toggle-chip-active' : 'toggle-chip'}
                      >
                        Prefiro cuidador com quintal
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label" htmlFor="match-walk-schedule">Horário de passeio</label>
                          <select id="match-walk-schedule" value={preferredWalkSchedule} onChange={e => setPreferredWalkSchedule(e.target.value as typeof preferredWalkSchedule)} className="select-field w-full">
                            <option value="">Sem preferência</option>
                            <option value="manha">Manhã</option>
                            <option value="noite">Noite</option>
                          </select>
                        </div>
                        <div>
                          <label className="label" htmlFor="match-home-type">Tipo de imóvel</label>
                          <select id="match-home-type" value={preferredHomeType} onChange={e => setPreferredHomeType(e.target.value as typeof preferredHomeType)} className="select-field w-full">
                            <option value="">Sem preferência</option>
                            <option value="casa">Casa</option>
                            <option value="apartamento">Apartamento</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Passo 3 — Detalhes do Pet ─────────────────────── */}
            {step === 3 && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="text-center">
                  <h1 className="font-heading text-3xl font-bold text-ink mb-1">Quem vai receber cuidado?</h1>
                  <p className="text-muted">Conte um pouco mais sobre o seu companheiro.</p>
                </div>

                {savedPets.length > 0 && (
                  <div className="max-w-md mx-auto w-full">
                    <label className="label mb-3">Selecione um pet salvo (opcional)</label>
                    <div className="flex flex-wrap gap-2.5">
                      {savedPets.map(pet => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => selectPet(pet)}
                          className={selectedPetId === pet.id ? 'toggle-chip-active' : 'toggle-chip'}
                        >
                          {pet.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted mt-1.5 px-1">
                      Usamos as informações já salvas do pet (energia, sociabilidade) pra melhorar o match.
                    </p>
                  </div>
                )}

                <div className="max-w-md mx-auto w-full flex flex-col gap-6">
                  <div>
                    <label className="label mb-3">Tipo de Pet</label>
                    <div className="grid grid-cols-3 gap-3">
                      {SPECIES_OPTIONS.map(s => (
                        <label key={s.value} className="relative cursor-pointer group">
                          <input
                            type="radio"
                            name="species"
                            checked={species === s.value}
                            onChange={() => setSpecies(s.value)}
                            className="peer sr-only"
                          />
                          <div className="h-full flex flex-col items-center justify-center p-3 bg-background rounded-2xl gap-1.5 transition-all duration-300 peer-checked:bg-secondary-100 peer-checked:-translate-y-1 hover:-translate-y-1">
                            <span className="text-2xl">{s.icon}</span>
                            <span className="text-xs font-semibold text-muted peer-checked:text-primary-800">{s.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="match-notes">Observações Importantes</label>
                    <textarea
                      id="match-notes"
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Alergias, medicamentos, medos (ex: fogos de artifício), ou comportamentos específicos..."
                      className="w-full p-4 rounded-2xl bg-background border-2 border-transparent focus:border-primary-400 outline-none text-sm text-ink resize-none transition-all"
                    />
                    <p className="text-xs text-muted mt-1.5 px-1">
                      Quanto mais detalhes, melhor o cuidador poderá atender às necessidades do seu pet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Passo 4 — Orçamento ───────────────────────────── */}
            {step === 4 && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mb-3">
                    <Wallet size={26} />
                  </div>
                  <h1 className="font-heading text-2xl font-bold text-ink mb-1">Defina seu orçamento</h1>
                  <p className="text-muted max-w-sm">
                    Ajuste o valor que você está disposto a investir {isDaily ? 'por dia' : 'por hora'}.
                  </p>
                </div>

                <div className="bg-background rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Valor {isDaily ? 'diário' : 'por hora'} aproximado
                    </span>
                    <div className="flex items-baseline gap-1.5 text-primary-800">
                      <span className="font-heading text-2xl font-bold">R$</span>
                      <span className="font-heading text-4xl font-extrabold">{maxPrice || 80}</span>
                    </div>
                    <span className={clsx('text-xs font-semibold px-3 py-1 rounded-pill mt-1', tier.className)}>
                      {tier.text}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={250}
                    step={5}
                    value={maxPrice || 80}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full accent-primary-600"
                    aria-label="Orçamento"
                  />
                  <div className="flex justify-between w-full text-xs text-muted -mt-4">
                    <span>R$ 30</span>
                    <span>R$ 250+</span>
                  </div>

                  <div className="w-full bg-white p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                    <Info size={20} className="text-secondary-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted">
                      Valores mais altos geralmente garantem acesso a cuidadores com avaliações excepcionais, certificações veterinárias ou serviços premium inclusos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-stroke">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className="btn-ghost px-5 flex items-center gap-2 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
              >
                <ArrowLeft size={18} /> Voltar
              </button>

              <button
                onClick={handleNext}
                className="btn-primary px-8 flex items-center gap-2"
              >
                {step === TOTAL_STEPS ? <>Finalizar Match <CheckCircle size={18} /></> : <>Continuar <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>

        {/* Link de busca manual */}
        <p className="text-center text-sm text-muted mt-6">
          Prefere busca manual?{' '}
          <button
            onClick={() => navigate('/buscar')}
            className="text-primary-600 hover:underline font-semibold"
          >
            Ver todos os petsitters →
          </button>
        </p>
      </div>
    </div>
  )
}

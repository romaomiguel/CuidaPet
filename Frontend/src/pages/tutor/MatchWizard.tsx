import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ArrowRight, ArrowLeft, Clock, CalendarDays } from 'lucide-react'
import { serviceLabels } from '@/utils'
import type { ServiceType } from '@/types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ── Constantes ─────────────────────────────────────────────────────────────────

const SERVICES: { type: ServiceType; emoji: string }[] = [
  { type: 'hospedagem',   emoji: '🏠' },
  { type: 'passeio',      emoji: '🦮' },
  { type: 'creche',       emoji: '🎾' },
  { type: 'visita',       emoji: '🚪' },
  { type: 'banho_e_tosa', emoji: '🛁' },
  { type: 'adestramento', emoji: '🎓' },
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

const BUDGET_SHORTCUTS = [
  { label: 'Até R$50',  value: 50 },
  { label: 'Até R$100', value: 100 },
  { label: 'Até R$200', value: 200 },
]

const TOTAL_STEPS = 5

const STEP_LABELS = ['Serviço', 'Pet', 'Quando', 'Onde', 'Orçamento']

// ── Componente ──────────────────────────────────────────────────────────────────

export function MatchWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Estado do wizard
  const [service,       setService]       = useState<ServiceType | ''>('')
  const [species,       setSpecies]       = useState<string>('')
  const [date,          setDate]          = useState<string>('')
  const [startTime,     setStartTime]     = useState<string>('')
  const [endTime,       setEndTime]       = useState<string>('')
  const [endDate,       setEndDate]       = useState<string>('')
  const [city,          setCity]          = useState<string>('')
  const [neighborhood,  setNeighborhood]  = useState<string>('')
  const [maxPrice,      setMaxPrice]      = useState<string>('')

  const isDaily = DAILY_SERVICES.includes(service as ServiceType)

  // ── Validação por passo ───────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 1 && !service)  return toast.error('Selecione um serviço!')
    if (step === 2 && !species)  return toast.error('Selecione a espécie do seu pet!')
    if (step === 3 && !date)     return toast.error('Informe a data do serviço!')
    if (step === 4 && !city)     return toast.error('Informe sua cidade!')

    if (step < TOTAL_STEPS) {
      setStep(s => s + 1)
    } else {
      // Montar params e navegar
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
      navigate(`/match/resultados?${params.toString()}`)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            ✨ Match Inteligente
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Encontre seu Match Perfeito
          </h1>
          <p className="text-gray-500">
            Responda 5 perguntas — analisamos disponibilidade, localização e avaliações para você.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8 px-1 relative">
          <div className="absolute inset-x-0 top-4 h-1 bg-gray-200 rounded-full -z-10" />
          <div
            className="absolute left-0 top-4 h-1 bg-primary-500 rounded-full -z-10 transition-all duration-500"
            style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          />
          {STEP_LABELS.map((label, i) => {
            const num = i + 1
            const done = step > num
            const active = step === num
            return (
              <div key={num} className="flex flex-col items-center gap-1.5">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                  done   ? 'bg-primary-500 border-primary-500 text-white shadow-md' :
                  active ? 'bg-white border-primary-500 text-primary-600 shadow-md' :
                           'bg-white border-gray-200 text-gray-400',
                )}>
                  {done ? '✓' : num}
                </div>
                <span className={clsx(
                  'hidden sm:block text-xs font-medium transition-colors',
                  active ? 'text-primary-600' : done ? 'text-primary-400' : 'text-gray-400',
                )}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 min-h-[340px] flex flex-col">

            {/* ── Passo 1 — Serviço ─────────────────────────────── */}
            {step === 1 && (
              <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                  Qual serviço você precisa?
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SERVICES.map(({ type, emoji }) => (
                    <button
                      key={type}
                      onClick={() => setService(type)}
                      className={clsx(
                        'p-4 rounded-2xl border-2 text-center transition-all hover:shadow-sm group',
                        service === type
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-primary-200',
                      )}
                    >
                      <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {emoji}
                      </span>
                      <span className={clsx(
                        'font-semibold text-sm',
                        service === type ? 'text-primary-700' : 'text-gray-700',
                      )}>
                        {serviceLabels[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passo 2 — Espécie ─────────────────────────────── */}
            {step === 2 && (
              <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                  Qual a espécie do seu pet?
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SPECIES_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setSpecies(s.value)}
                      className={clsx(
                        'p-4 rounded-2xl border-2 text-center transition-all hover:shadow-sm group',
                        species === s.value
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-primary-200',
                      )}
                    >
                      <span className="block text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                        {s.icon}
                      </span>
                      <span className={clsx(
                        'font-semibold text-sm',
                        species === s.value ? 'text-primary-700' : 'text-gray-700',
                      )}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Passo 3 — Quando ──────────────────────────────── */}
            {step === 3 && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Quando você precisa?</h2>
                  <p className="text-sm text-gray-500">
                    {isDaily
                      ? 'Informe o período de hospedagem'
                      : 'Informe a data e horário do serviço'}
                  </p>
                </div>

                {isDaily ? (
                  /* Por diária: data de entrada + saída */
                  <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto w-full">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <CalendarDays size={14} className="inline mr-1 text-primary-500" />
                        Data de entrada
                      </label>
                      <input
                        id="match-date-entrada"
                        type="date"
                        min={today}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <CalendarDays size={14} className="inline mr-1 text-primary-500" />
                        Data de saída
                      </label>
                      <input
                        id="match-date-saida"
                        type="date"
                        min={date || today}
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                ) : (
                  /* Por hora: data + horário início + fim */
                  <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <CalendarDays size={14} className="inline mr-1 text-primary-500" />
                        Data do serviço
                      </label>
                      <input
                        id="match-date"
                        type="date"
                        min={today}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          <Clock size={14} className="inline mr-1 text-primary-500" />
                          Horário início
                        </label>
                        <select
                          id="match-start-time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          className="input-field w-full"
                        >
                          <option value="">Selecione</option>
                          {TIME_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          <Clock size={14} className="inline mr-1 text-primary-500" />
                          Horário fim
                        </label>
                        <select
                          id="match-end-time"
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          className="input-field w-full"
                        >
                          <option value="">Selecione</option>
                          {TIME_OPTIONS.filter(t => !startTime || t > startTime).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Passo 4 — Onde ────────────────────────────────── */}
            {step === 4 && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Onde você está?</h2>
                  <p className="text-sm text-gray-500">
                    Quanto mais preciso, melhor o match de proximidade.
                  </p>
                </div>
                <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <MapPin size={14} className="inline mr-1 text-primary-500" />
                      Cidade
                    </label>
                    <input
                      id="match-city"
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Ex: São Paulo"
                      className="input-field w-full"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <MapPin size={14} className="inline mr-1 text-gray-400" />
                      Bairro{' '}
                      <span className="text-gray-400 font-normal">(opcional, melhora o resultado)</span>
                    </label>
                    <input
                      id="match-neighborhood"
                      type="text"
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      placeholder="Ex: Pinheiros, Copacabana..."
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Passo 5 — Orçamento ───────────────────────────── */}
            {step === 5 && (
              <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Qual o seu orçamento?</h2>
                  <p className="text-sm text-gray-500">
                    {isDaily
                      ? 'Valor máximo que deseja pagar por diária'
                      : 'Valor máximo que deseja pagar por hora'}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-5 max-w-xs mx-auto w-full">
                  {/* Atalhos rápidos */}
                  <div className="flex gap-2 flex-wrap justify-center">
                    {BUDGET_SHORTCUTS.map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setMaxPrice(String(value))}
                        className={clsx(
                          'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                          maxPrice === String(value)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-primary-300',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setMaxPrice('')}
                      className={clsx(
                        'px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all',
                        maxPrice === ''
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-primary-300',
                      )}
                    >
                      Sem limite
                    </button>
                  </div>

                  {/* Ou valor manual */}
                  <div className="w-full">
                    <label className="block text-xs text-gray-400 text-center mb-2">
                      ou digite um valor personalizado
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <input
                        id="match-max-price"
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        placeholder="0"
                        className="input-field pl-10 w-full text-center text-lg font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 1}
                className="btn-secondary px-6 flex items-center gap-2 disabled:opacity-0 disabled:pointer-events-none transition-opacity"
              >
                <ArrowLeft size={18} /> Voltar
              </button>

              <span className="text-xs text-gray-400 font-medium">{step} de {TOTAL_STEPS}</span>

              <button
                onClick={handleNext}
                className="btn-primary px-8 flex items-center gap-2"
              >
                {step === TOTAL_STEPS ? '✨ Encontrar Match' : 'Próximo'}
                {step < TOTAL_STEPS && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Link de busca manual */}
        <p className="text-center text-sm text-gray-400 mt-5">
          Prefere busca manual?{' '}
          <button
            onClick={() => navigate('/buscar')}
            className="text-primary-600 hover:underline font-medium"
          >
            Ver todos os petsitters →
          </button>
        </p>
      </div>
    </div>
  )
}

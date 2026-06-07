import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar as CalendarIcon, PawPrint, Wrench, StickyNote, DollarSign, Clock } from 'lucide-react'
import { Modal }          from '@/components/ui/Modal'
import { petService }     from '@/services/pet.service'
import { bookingService } from '@/services/booking.service'
import { serviceLabels, formatCurrency } from '@/utils'
import { IS_MOCK_MODE } from '@/lib/mock'
import type { PetsitterProfile, ServiceType } from '@/types'
import clsx from 'clsx'
import toast from 'react-hot-toast'

import { DayPicker, DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { parseISO, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BookingModalProps {
  isOpen:    boolean
  onClose:   () => void
  petsitter: PetsitterProfile
}

const schema = z.object({
  petIds:    z.array(z.string()).min(1, 'Selecione ao menos um pet'),
  service:   z.string().min(1, 'Selecione um serviço'),
  notes:     z.string().optional(),
})

type FormData = z.infer<typeof schema>

const DAY_MAP = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function BookingModal({ isOpen, onClose, petsitter }: BookingModalProps) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { petIds: [] }
  })

  // State para o Calendário e Horários
  const selService = watch('service') as ServiceType
  const selPetIds = watch('petIds') || []
  const FULL_DAY_SERVICES = ['hospedagem', 'creche']
  const config = (petsitter.pricingConfig as any)?.[selService]
  const isFixed = selService && (config ? config.type === 'fixed' : FULL_DAY_SERVICES.includes(selService))

  const [range, setRange] = useState<DateRange | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(1)

  // Reseta estado ao trocar de serviço
  useEffect(() => {
    setRange(undefined)
    setSelectedDate(undefined)
    setSelectedTime(null)
    setDuration(1)
  }, [selService])

  // Busca Agendamentos Conflitantes
  const { data: busySlots = [] } = useQuery({
    queryKey: ['busySlots', petsitter.id],
    queryFn: () => bookingService.getBusySlots(petsitter.id),
    enabled: isOpen,
  })

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets'],
    queryFn:  petService.list,
    enabled:  isOpen,
  })

  // Dias desabilitados
  const disabledDays = useMemo(() => {
    return (date: Date) => {
      if (startOfDay(date) < startOfDay(new Date())) return true

      // Se o petsitter ainda não configurou agenda, nenhum dia é bloqueado por schedule
      const sc = petsitter.scheduleConfig as any
      if (sc && Object.keys(sc).length > 0) {
        const dayStr = DAY_MAP[date.getDay()]
        const daySchedule = sc[dayStr]
        if (!daySchedule?.enabled) return true
      }

      if (isFixed) {
         const dTime = startOfDay(date).getTime()
         // Encontra todas as reservas que cobrem esta data
         const overlapping = busySlots.filter(busy => {
            const bStart = startOfDay(parseISO(busy.startDate)).getTime()
            const bEnd = startOfDay(parseISO(busy.endDate)).getTime()
            return dTime >= bStart && dTime <= bEnd
         })
         
         // Soma pets já agendados
         const currentPetsCount = overlapping.reduce((acc, curr) => acc + ((curr as any)._count?.pets || 1), 0)
         const requiredCapacity = Math.max(1, selPetIds.length)
         const maxCapacity = petsitter.capacityPerDay || 1
         
         return currentPetsCount + requiredCapacity > maxCapacity
      }
      return false
    }
  }, [petsitter.scheduleConfig, petsitter.capacityPerDay, busySlots, isFixed, selPetIds.length])

  // Horários disponíveis
  const availableSlots = useMemo(() => {
    if (!selectedDate || isFixed) return []

    const sc = petsitter.scheduleConfig as any
    const dayStr = DAY_MAP[selectedDate.getDay()]
    const daySchedule = sc?.[dayStr]

    // Se a agenda não foi configurada, usa horário padrão 08-18
    const start = daySchedule?.start || '08:00'
    const end   = daySchedule?.end   || '18:00'

    const slots: string[] = []
    const [startH] = start.split(':').map(Number)
    const [endH]   = end.split(':').map(Number)

    for (let h = startH; h < endH; h++) {
       const slotTime = `${h.toString().padStart(2, '0')}:00`
       const slotStart = new Date(selectedDate)
       slotStart.setHours(h, 0, 0, 0)
       const slotEnd = new Date(selectedDate)
       slotEnd.setHours(h + 1, 0, 0, 0)

       const overlapping = busySlots.filter(busy => {
          const bStart = new Date(busy.startDate).getTime()
          const bEnd = new Date(busy.endDate).getTime()
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
       })

       const currentPetsCount = overlapping.reduce((acc, curr) => acc + ((curr as any)._count?.pets || 1), 0)
       const requiredCapacity = Math.max(1, selPetIds.length)
       const maxCapacity = petsitter.capacityPerDay || 1

       if (currentPetsCount + requiredCapacity <= maxCapacity) slots.push(slotTime)
    }
    return slots
  }, [selectedDate, isFixed, petsitter.scheduleConfig, petsitter.capacityPerDay, busySlots, selPetIds.length])

  // Estimativa de preço
  let estimated = 0
  const petsMultiplier = Math.max(1, selPetIds.length)
  if (config) {
     if (isFixed && range?.from) {
        const diffDays = range.to 
           ? Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1)
           : 1
        estimated = config.price * diffDays * petsMultiplier
     } else if (!isFixed && selectedTime) {
        estimated = config.price * duration * petsMultiplier
     }
  }

  const mutation = useMutation({
    mutationFn: (payload: any) => bookingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['busySlots'] })
      toast.success(IS_MOCK_MODE ? 'Agendamento criado (modo demo)! ✅' : 'Agendamento enviado com sucesso! ✅')
      reset()
      onClose()
      navigate('/agendamentos')
    },
  })

  const onSubmit = (data: FormData) => {
     let start: string, end: string
     
     if (isFixed) {
        if (!range?.from) { toast.error('Selecione uma data no calendário'); return }
        start = format(range.from, "yyyy-MM-dd'T'00:00:00.000'Z'")
        end = format(range.to || range.from, "yyyy-MM-dd'T'23:59:59.000'Z'")
     } else {
        if (!selectedDate || !selectedTime) { toast.error('Selecione a data e o horário'); return }
        const [h] = selectedTime.split(':').map(Number)
        
        const sDate = new Date(selectedDate)
        sDate.setHours(h, 0, 0, 0)
        start = sDate.toISOString()
        
        const eDate = new Date(selectedDate)
        eDate.setHours(h + duration, 0, 0, 0)
        end = eDate.toISOString()
     }

     mutation.mutate({
        petsitterId: petsitter.id,
        petIds: data.petIds,
        service: data.service as ServiceType,
        startDate: start,
        endDate: end,
        notes: data.notes
     })
  }

  const footer = (
    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
      <div className="text-sm text-gray-500 flex items-center gap-1.5">
        <DollarSign size={14} className="text-primary-400" />
        Estimativa: <span className="font-bold text-primary-600">{formatCurrency(estimated)}</span>
      </div>
      <div className="flex gap-3 w-full sm:w-auto">
        <button type="button" onClick={onClose} className="btn-ghost flex-1 sm:flex-none">Cancelar</button>
        <button type="submit" form="booking-form" disabled={mutation.isPending} className="btn-primary flex-1 sm:flex-none justify-center">
          {mutation.isPending ? 'Confirmando...' : 'Confirmar agendamento'}
        </button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agendar serviço" description={`Com ${petsitter.user.name}`} size="lg" footer={footer}>
      <form id="booking-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6 overflow-y-auto custom-scrollbar max-h-[65vh] px-1 pb-4">

          {/* ── Serviços ── */}
          <div>
            <label className="label flex items-center gap-1.5 mb-2"><Wrench size={14} className="text-primary-400" /> Serviço *</label>
            <div className="grid grid-cols-2 gap-2">
              {petsitter.services.map(s => {
                const checked = selService === s
                return (
                  <label key={s} className={clsx('flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all', checked ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                    <input type="radio" value={s} {...register('service')} className="accent-primary-500" />
                    <span className={clsx('text-sm font-medium', checked ? 'text-primary-700' : 'text-gray-700')}>{serviceLabels[s]}</span>
                  </label>
                )
              })}
            </div>
            {errors.service && <p className="text-xs text-red-500 mt-1">⚠ {errors.service.message}</p>}
          </div>

          {/* ── Selecione os pets ── */}
          <div>
            <label className="label flex items-center gap-1.5 mb-2"><PawPrint size={14} className="text-primary-400" /> Seu pet *</label>
            {petsLoading ? (
              <div className="input-field text-gray-400 text-sm">Carregando pets…</div>
            ) : pets.length === 0 ? (
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <p className="text-sm text-yellow-700">Você não tem pets cadastrados.</p>
                <button type="button" onClick={() => { onClose(); navigate('/pets') }} className="text-sm text-primary-600 font-semibold hover:underline ml-2">Adicionar →</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pets.map(p => {
                  const isChecked = selPetIds.includes(p.id)
                  return (
                    <label key={p.id} className={clsx('flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer', isChecked ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                      <input 
                        type="checkbox" 
                        value={p.id} 
                        {...register('petIds')} 
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                      />
                      <span className="font-medium text-gray-800">
                        {p.species === 'cachorro' ? '🐶' : p.species === 'gato' ? '🐱' : '🐾'} {p.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
            {errors.petIds && <p className="text-xs text-red-500 mt-1">⚠ {errors.petIds.message}</p>}
          </div>

          {/* ── Calendário Mágico ── */}
          {selService && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <label className="label flex items-center gap-1.5 mb-4 text-primary-700">
                <CalendarIcon size={16} /> 
                {isFixed ? 'Selecione os dias da estadia' : 'Selecione a data e o horário'}
              </label>

              <div className="flex flex-col gap-6">
                {/* Calendário */}
                <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mx-auto h-fit w-fit">
                  {isFixed ? (
                    <DayPicker
                      mode="range"
                      locale={ptBR}
                      selected={range}
                      onSelect={setRange}
                      disabled={disabledDays}
                      modifiersClassNames={{ selected: 'bg-primary-500 text-white rounded-md', today: 'font-bold text-primary-600' }}
                    />
                  ) : (
                    <DayPicker
                      mode="single"
                      locale={ptBR}
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      modifiersClassNames={{ selected: 'bg-primary-500 text-white rounded-md', today: 'font-bold text-primary-600' }}
                    />
                  )}
                </div>

                {/* Horários abaixo do calendário */}
                {!isFixed && selectedDate && (
                  <div className="w-full max-w-[350px] mx-auto animate-fade-in">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3 justify-center sm:justify-start">
                      <Clock size={14} className="text-primary-400" /> Horários disponíveis
                    </label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-center">Não há horários disponíveis para este dia.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={clsx(
                              'py-2 px-1 text-sm font-medium rounded-xl border text-center transition-all',
                              selectedTime === time
                                ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedTime && (
                      <div className="mt-5 animate-fade-in">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block text-center sm:text-left">Duração da reserva</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map(h => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setDuration(h)}
                              className={clsx(
                                'py-2 text-sm font-medium rounded-xl border transition-all',
                                duration === h
                                  ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                              )}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Observações ── */}
          <div>
            <label className="label flex items-center gap-1.5" htmlFor="bk-notes"><StickyNote size={14} className="text-primary-400" /> Observações</label>
            <textarea id="bk-notes" {...register('notes')} rows={3} className="input-field resize-none" placeholder="Informe detalhes importantes..." />
          </div>

        </div>
      </form>
    </Modal>
  )
}

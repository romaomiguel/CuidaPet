import { Search, User, Briefcase, Building, MessageCircle } from 'lucide-react'

export function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ─── Hero de Ajuda ─── */}
      <section className="pt-24 pb-16 px-4 sm:px-6 bg-primary-50 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink tracking-tight mb-4" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Posso te ajudar?
          </h1>
          <p className="text-muted text-lg mb-10 max-w-2xl mx-auto">
            Dicas para manter sua conta segura: Nunca compartilhe senhas e faça pagamentos apenas pela plataforma. Estamos aqui para garantir a melhor experiência para você e seu pet.
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-400" size={24} />
            <input 
              type="text" 
              placeholder="Digite sua dúvida aqui..." 
              className="w-full pl-16 pr-6 py-5 rounded-full text-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* ─── Categorias / Cards ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-stroke rounded-3xl p-10 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-500 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <User size={36} />
              </div>
              <h2 className="text-2xl font-bold text-ink">Sou Cliente</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed">Dúvidas sobre reservas, pagamentos e os cuidados prestados ao seu pet.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-stroke rounded-3xl p-10 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center text-secondary-600 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={36} />
              </div>
              <h2 className="text-2xl font-bold text-ink">Sou Petsitter</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed">Dicas sobre seu perfil, recebimentos e como conseguir fidelizar mais clientes.</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-stroke rounded-3xl p-10 text-center hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Building size={36} />
              </div>
              <h2 className="text-2xl font-bold text-ink">A Plataforma</h2>
              <p className="text-muted mt-2 text-sm leading-relaxed">Políticas, normas de segurança, termos de uso e reportes de comportamentos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Suporte Adicional ─── */}
      <section className="py-16 px-4 sm:px-6 flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center border border-stroke bg-gray-50 rounded-3xl p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-ink mb-6">
            Não encontrou o que estava procurando?
          </h2>
          <button className="btn-primary px-8 py-3 rounded-full shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2">
            <MessageCircle size={18} /> Falar com o suporte
          </button>
        </div>
      </section>

    </div>
  )
}

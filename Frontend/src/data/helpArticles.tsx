import type { ReactNode } from 'react'
import {
  User, Briefcase, Building,
  Calendar, ShieldCheck, XCircle, MessageSquareText, PawPrint,
  UserPlus, FileCheck, Sparkles, Tag, CalendarCheck, MessageCircle, Navigation, Star, Wallet,
  Lock, FileText,
} from 'lucide-react'

export type HelpCategoryKey = 'cliente' | 'petsitter' | 'plataforma'

export interface HelpCategoryInfo {
  key: HelpCategoryKey
  title: string
  desc: string
  icon: ReactNode
  iconBg: string
}

export interface HelpArticle {
  category: HelpCategoryKey
  slug: string
  title: string
  /** Descrição curta — usada no card de "Tópicos Frequentes" e na listagem de categoria. */
  excerpt: string
  /**
   * Corpo completo do artigo — texto simples, sem Markdown, com UMA exceção: uma linha
   * sozinha entre `**` (ex.: `**Título**`) vira um subtítulo em negrito ao renderizar
   * (ver `HelpArticlePage.tsx`). Fora isso, parágrafos são só texto separado por linha em branco.
   */
  content: string
  icon: ReactNode
  accent: string
  /** Aparece na seção "Tópicos Frequentes" da home de Ajuda — curadoria manual, não é toda a lista. */
  featured: boolean
}

export const HELP_CATEGORIES: HelpCategoryInfo[] = [
  {
    key: 'cliente',
    title: 'Sou Cliente',
    desc: 'Dúvidas sobre reservas, pagamentos e os cuidados prestados ao seu pet.',
    icon: <User size={32} />,
    iconBg: 'bg-primary-50 text-primary-600',
  },
  {
    key: 'petsitter',
    title: 'Sou Petsitter',
    desc: 'Dicas sobre seu perfil, recebimentos e como conseguir fidelizar mais clientes.',
    icon: <Briefcase size={32} />,
    iconBg: 'bg-secondary-100 text-secondary-700',
  },
  {
    key: 'plataforma',
    title: 'A Plataforma',
    desc: 'Políticas, normas de segurança, termos de uso e reportes de comportamentos.',
    icon: <Building size={32} />,
    iconBg: 'bg-primary-100 text-primary-800',
  },
]

// Artigo de "Como funciona o pagamento?" (categoria cliente) fica de fora por enquanto —
// descreve uma feature de pagamento que ainda não existe na plataforma. Ver ajuda_implementation.md.
export const HELP_ARTICLES: HelpArticle[] = [
  // ─── Sou Cliente ──────────────────────────────────────────────────────
  {
    category: 'cliente',
    slug: 'como-agendar-um-passeio',
    title: 'Como agendar um passeio?',
    excerpt: 'Passo a passo para encontrar e reservar.',
    content: `Encontrar e reservar um cuidador no PetUno é rápido. Veja o passo a passo:

Comece pelo match inteligente: responda algumas perguntas rápidas sobre o seu pet, o local, a data e o valor que pretende investir. Com base nisso, o PetUno calcula e apresenta uma lista de cuidadores ordenada por compatibilidade, mostrando a porcentagem de match de cada um.

Escolha um cuidador da lista e acesse o perfil dele. Ali você vê a descrição, as avaliações de outros tutores, os serviços oferecidos e se o cuidador compartilha localização durante os passeios.

Encontrou o cuidador ideal? Selecione o serviço desejado e confirme a solicitação de agendamento. O cuidador recebe o seu pedido e, ao aceitar, o agendamento é confirmado e um canal de conversa é aberto entre vocês.

A partir daí, vocês podem combinar os detalhes pelo chat, e você acompanha tudo pela sua área de agendamentos.`,
    icon: <Calendar size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: true,
  },
  {
    category: 'cliente',
    slug: 'politica-de-cancelamento',
    title: 'Política de cancelamento',
    excerpt: 'Regras e reembolsos em caso de desistência.',
    content: `Sabemos que imprevistos acontecem. Veja como funcionam os cancelamentos no PetUno:

Antes de o cuidador aceitar: enquanto o seu pedido de agendamento ainda não foi aceito, você pode cancelar livremente, sem nenhum custo. Como o cuidador ainda não confirmou, não há valor envolvido.

Depois de o cuidador aceitar: uma vez que o cuidador aceita o agendamento, ele reserva seu tempo e se compromete com o serviço. Se você precisar cancelar a partir desse momento, o reembolso é de 50% do valor pago. Os outros 50% ficam com o cuidador, como compensação pelo compromisso assumido e pela reserva da agenda.

Para cancelar, acesse a sua área de agendamentos. Sempre que possível, avise o cuidador pelo chat — a comunicação ajuda a manter uma boa relação na plataforma.`,
    icon: <XCircle size={20} />,
    accent: 'text-error-600 bg-error-50',
    featured: true,
  },
  {
    category: 'cliente',
    slug: 'como-avaliar-um-servico',
    title: 'Como avaliar um serviço?',
    excerpt: 'Deixe sua opinião e ajude a comunidade.',
    content: `Sua opinião ajuda toda a comunidade a escolher melhor. Veja como avaliar:

Depois que um serviço é concluído, ele aparece na sua área de agendamentos com a opção de avaliar. Você não consegue avaliar um serviço que ainda não foi finalizado — a avaliação só libera quando o cuidador marca o atendimento como concluído.

Ao avaliar, dê uma nota de 1 a 5 estrelas. Conforme a nota escolhida, o PetUno sugere etiquetas rápidas que você pode marcar (como "pontual e atencioso" ou "comunicação excelente") — elas variam de acordo com a sua avaliação. Se quiser, escreva também um comentário contando como foi a experiência. Tanto as etiquetas quanto o comentário são opcionais; só a nota é obrigatória.

Sua avaliação aparece no perfil do cuidador e ajuda a construir a reputação dele na plataforma, orientando as escolhas de outros tutores.`,
    icon: <MessageSquareText size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: false,
  },
  {
    category: 'cliente',
    slug: 'atualizar-perfil-do-pet',
    title: 'Atualizar perfil do pet',
    excerpt: 'Mantenha as informações do seu pet sempre atualizadas.',
    content: `Manter o perfil do seu pet atualizado ajuda os cuidadores a oferecerem o melhor atendimento. Veja como:

Acesse a área de pets na sua conta. Ali você pode adicionar ou editar as informações do seu animal — como nome, espécie, características e outros detalhes que ajudam o cuidador a conhecer melhor quem vai cuidar.

Mantenha os dados sempre atualizados, especialmente antes de um novo agendamento, para que o cuidador tenha todas as informações necessárias.`,
    icon: <PawPrint size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },

  // ─── A Plataforma ─────────────────────────────────────────────────────
  {
    category: 'plataforma',
    slug: 'dicas-de-seguranca',
    title: 'Dicas de segurança',
    excerpt: 'Boas práticas para clientes e sitters.',
    content: `Sua segurança é importante para nós. Siga essas orientações para uma experiência tranquila no PetUno:

**Nunca compartilhe sua senha**
A equipe do PetUno nunca irá pedir sua senha por chat, e-mail ou telefone. Se alguém pedir, não forneça e denuncie pela Central de Ajuda.

**Faça pagamentos apenas pela plataforma**
Isso garante que você está protegido pelas políticas do PetUno. Combinações de pagamento fora da plataforma não têm nenhuma garantia ou suporte da nossa parte.

**Confira o perfil do cuidador antes de contratar**
Veja as avaliações de outros tutores, a descrição do perfil e se os documentos foram verificados.

**Use o chat da plataforma para se comunicar**
Manter a conversa dentro do PetUno cria um histórico que pode ser útil em caso de qualquer divergência sobre o serviço combinado.

**Desconfie de pedidos fora do comum**
Solicitações de dados bancários, cópias de documentos pessoais fora do fluxo de verificação, ou pressão para agir rápido são sinais de alerta.

Ao encontrar o cuidador pela primeira vez, se possível, escolha um local público ou combine que outra pessoa esteja por perto, especialmente em serviços de hospedagem.

**Mantenha as informações do seu pet atualizadas**
Isso ajuda o cuidador a agir corretamente em caso de emergência.

**Denuncie comportamento suspeito**
Se algo parecer errado durante um serviço — comunicação estranha, cobrança fora da plataforma, comportamento inadequado — entre em contato com o suporte imediatamente pela Central de Ajuda.`,
    icon: <ShieldCheck size={20} />,
    accent: 'text-success-600 bg-success-50',
    featured: true,
  },
  {
    category: 'plataforma',
    slug: 'politica-de-privacidade',
    title: 'Política de Privacidade',
    excerpt: 'Como coletamos, usamos e protegemos seus dados.',
    content: `Última atualização: julho de 2026

Esta Política de Privacidade explica como o PetUno coleta, usa, armazena e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD).

**1. Quais dados coletamos**
Coletamos os dados que você fornece ao criar sua conta (nome, e-mail, telefone) e, no caso de petsitters, documentos de identificação e comprovante de endereço para fins de verificação. Também coletamos informações sobre os pets cadastrados pelos tutores, mensagens trocadas no chat da plataforma, avaliações realizadas, e, quando o petsitter optar por compartilhar, pontos de localização registrados durante os serviços.

**2. Como usamos seus dados**
Usamos seus dados para viabilizar o funcionamento da plataforma: conectar tutores e cuidadores através do match inteligente, processar agendamentos, permitir a comunicação entre as partes, exibir avaliações e perfis, e verificar a identidade dos cuidadores.

**3. Compartilhamento de dados**
Não vendemos seus dados a terceiros. Informações do seu perfil público (nome, avaliações, serviços oferecidos) são visíveis a outros usuários da plataforma como parte do funcionamento do serviço. Documentos de verificação enviados por petsitters são acessíveis apenas à equipe do PetUno, nunca a outros usuários.

**4. Localização**
O compartilhamento de localização por petsitters é uma funcionalidade opcional, ativada por escolha do próprio cuidador, e limitada aos momentos em que ele decide registrar um ponto durante um serviço ativo. Apenas o tutor daquele agendamento específico tem acesso a esses pontos.

**5. Armazenamento e segurança**
Seus dados são armazenados em servidores com controles de acesso técnicos e protocolos de segurança. Documentos sensíveis são armazenados de forma protegida, com acesso restrito e por tempo limitado quando necessário para visualização.

**6. Seus direitos**
Conforme a LGPD, você tem direito a acessar, corrigir, solicitar a exclusão ou a portabilidade dos seus dados pessoais. Para exercer esses direitos, entre em contato pela Central de Ajuda.

**7. Retenção de dados**
Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para cumprir obrigações legais ou resolver eventuais disputas relacionadas a serviços prestados.

**8. Alterações nesta política**
Esta política pode ser atualizada para refletir mudanças na plataforma ou na legislação. Alterações relevantes serão comunicadas.`,
    icon: <Lock size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: false,
  },
  {
    category: 'plataforma',
    slug: 'termos-de-uso',
    title: 'Termos de Uso',
    excerpt: 'Regras de uso da plataforma PetUno.',
    content: `Última atualização: julho de 2026

Bem-vindo ao PetUno. Estes Termos de Uso regulam o acesso e uso da plataforma, que conecta tutores de animais de estimação a cuidadores (petsitters) para prestação de serviços de cuidado com pets. Ao criar uma conta, você concorda com os termos abaixo.

**1. Cadastro**
Para usar o PetUno, é necessário criar uma conta como tutor ou como petsitter, fornecendo informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas em sua conta.

**2. O papel do PetUno**
O PetUno é uma plataforma de intermediação: conecta tutores e cuidadores, mas não presta os serviços de cuidado diretamente. Os agendamentos, combinações e a execução do serviço são de responsabilidade exclusiva das partes envolvidas — tutor e petsitter.

**3. Cadastro de petsitters**
Os Petsitters devem ser maiores de 18 anos e devem ser solicitados a enviar documentos de identificação para fins de verificação. O PetUno realiza uma análise razoável, mas não garante nem se responsabiliza integralmente pela conduta dos petsitters cadastrados. Tutores devem exercer seu próprio julgamento ao escolher um petsitter.

**4. Agendamentos e cancelamentos**
Os agendamentos seguem as regras de aceite e cancelamento descritas na Central de Ajuda. Cancelamentos após o aceite do petsitter podem estar sujeitos a políticas de compensação, também descritas na Central de Ajuda.

**5. Avaliações**
Usuários podem avaliar os serviços prestados após sua conclusão. Avaliações devem refletir experiências reais e não devem conter conteúdo ofensivo, discriminatório ou falso. O PetUno pode remover avaliações que violem esta regra.

**6. Conduta do usuário**
É proibido usar a plataforma para fins ilícitos, fraudulentos, ou para assediar, discriminar ou prejudicar outros usuários. Documentos falsos, informações enganosas ou uso indevido de dados de terceiros podem levar à suspensão ou exclusão da conta.

**7. Pagamentos**
O PetUno utilizará uma plataforma de pagamento parceira para processar todos os pagamentos realizados pelos tutores. Os valores devidos aos petsitters serão repassados pela plataforma parceira, descontando-se a comissão devida ao PetUno, conforme definida em Políticas de Pagamento específicas.

O tutor pagará o valor total do serviço diretamente ao PetUno no momento da reserva, que reterá esses valores até a data de pagamento dos petsitters, conforme as políticas da plataforma parceira.

**8. Limitação de responsabilidade**
O PetUno não se responsabiliza por danos, prejuízos ou incidentes ocorridos durante a prestação dos serviços entre tutor e petsitter, atuando como intermediário da conexão entre as partes.

**9. Alterações nos termos**
Estes termos podem ser atualizados. Alterações relevantes serão comunicadas aos usuários.

**10. Contato**
Dúvidas sobre estes termos podem ser enviadas pela Central de Ajuda.`,
    icon: <FileText size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },

  // ─── Sou Petsitter — Começar na plataforma ────────────────────────────
  {
    category: 'petsitter',
    slug: 'como-me-tornar-um-petsitter',
    title: 'Como me tornar um petsitter',
    excerpt: 'Monte um perfil completo para começar a receber agendamentos.',
    content: `Bem-vindo ao PetUno. Tornar-se um cuidador na plataforma é o primeiro passo para receber agendamentos, e tudo começa por um perfil bem montado — é ele que os tutores veem quando o PetUno recomenda você.

Ao criar sua conta como petsitter, seu perfil já nasce, mas vazio. O próximo passo é completá-lo: acesse a área de perfil e preencha as informações que vão apresentar você aos tutores. Capriche na descrição — conte sua experiência com animais, o que você oferece e por que um tutor pode confiar o pet a você. É a sua vitrine.

Quanto mais completo e verdadeiro for o seu perfil, mais confiança ele transmite — e confiança é o que faz um tutor escolher você entre os cuidadores recomendados.`,
    icon: <UserPlus size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: true,
  },
  {
    category: 'petsitter',
    slug: 'como-enviar-meus-documentos',
    title: 'Como enviar meus documentos',
    excerpt: 'Verificação de identidade e endereço, de forma segura.',
    content: `Para manter o PetUno um ambiente seguro para todos, pedimos que os cuidadores enviem documentos de verificação. Isso protege os tutores e valoriza você, que demonstra ser um profissional sério e confiável.

Na sua área de perfil, você encontra o espaço para enviar seus documentos, como comprovante de identidade e comprovante de endereço. O envio é feito de forma segura: seus documentos ficam armazenados de maneira protegida e são acessíveis apenas à equipe do PetUno para a verificação — nenhum tutor tem acesso a eles, após a verificação os documentos ficam na base de dados por 7 dias e após isso são excluídos.

Envie arquivos legíveis e dentro do prazo de validade. Depois de enviados, seus documentos passam por uma análise da plataforma. Manter essa etapa em dia deixa seu perfil mais confiável e pronto para receber agendamentos.`,
    icon: <FileCheck size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },

  // ─── Sou Petsitter — Aparecer e ser escolhido ─────────────────────────
  {
    category: 'petsitter',
    slug: 'como-aparecer-para-os-tutores',
    title: 'Como funciona o match e como aparecer para os tutores',
    excerpt: 'Entenda como o match inteligente recomenda você aos tutores.',
    content: `No PetUno, o tutor não fica procurando cuidadores um por um. Ele responde a algumas perguntas — sobre o animal, o local, a data e o valor — e o nosso match inteligente apresenta a ele uma lista de cuidadores ordenada por compatibilidade, com uma porcentagem de match para cada um.

Ou seja: em vez de você disputar atenção numa lista enorme, o PetUno trabalha para colocar você na frente dos tutores certos — aqueles cuja necessidade combina com o que você oferece. Quanto melhor o seu encaixe com o que o tutor procura, mais alto você aparece.

Alguns cuidados ajudam a melhorar a sua posição e a chance de ser escolhido: mantenha seus serviços e disponibilidade atualizados, defina preços coerentes com o que você oferece, complete seu perfil e cuide da sua reputação — avaliações boas contam muito na hora de o tutor decidir. Recursos como o compartilhamento de localização durante os passeios também são um diferencial que os tutores valorizam.`,
    icon: <Sparkles size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: true,
  },
  {
    category: 'petsitter',
    slug: 'como-configurar-servicos-e-precos',
    title: 'Como configurar meus serviços e preços',
    excerpt: 'Defina os serviços que você presta e seus valores.',
    content: `Seus serviços e preços definem o que você oferece e quanto cobra — e são usados pelo PetUno tanto para apresentar você aos tutores quanto para calcular o valor de cada agendamento.

Na sua área de perfil, configure os serviços que você presta (como passeio e hospedagem) e os valores de cada um. Defina preços que reflitam o seu trabalho e que sejam competitivos para a sua região — lembre-se de que o valor pretendido pelo tutor é um dos fatores do match, então preços coerentes ajudam você a aparecer para as pessoas certas.

Mantenha essa configuração sempre atualizada. Se você mudar o que oferece ou os seus valores, ajuste aqui — é a partir daqui que os tutores enxergam e contratam os seus serviços.`,
    icon: <Tag size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },

  // ─── Sou Petsitter — Durante o serviço ────────────────────────────────
  {
    category: 'petsitter',
    slug: 'como-aceitar-e-gerenciar-agendamentos',
    title: 'Como aceitar e gerenciar meus agendamentos',
    excerpt: 'Aceite pedidos e conclua o serviço corretamente.',
    content: `Quando um tutor escolhe você, chega um pedido de agendamento. É você quem decide aceitá-lo ou não — então fique de olho nos seus pedidos.

Na sua área de agendamentos, você vê as solicitações recebidas. Ao aceitar um pedido, o agendamento é confirmado, o tutor é avisado e um canal de conversa é aberto entre vocês, onde dá para combinar os detalhes do serviço. Se não puder atender, você também pode recusar — mas responda sempre que possível, por respeito ao tutor que está aguardando.

Quando o serviço terminar, marque o agendamento como concluído. Esse passo é importante por dois motivos: ele encerra o atendimento e libera a avaliação do tutor sobre o seu trabalho. Um serviço só pode ser avaliado depois que você o marca como concluído, então não esqueça dessa etapa ao final de cada atendimento.`,
    icon: <CalendarCheck size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: false,
  },
  {
    category: 'petsitter',
    slug: 'como-usar-o-chat-com-o-tutor',
    title: 'Como usar o chat com o tutor',
    excerpt: 'Combine os detalhes do atendimento pelo chat.',
    content: `Assim que você aceita um agendamento, abre-se um chat entre você e o tutor. É por ali que vocês combinam os detalhes: horários, particularidades do pet, ponto de encontro, e qualquer dúvida durante o serviço.

Acesse suas conversas pela central de mensagens, no menu da sua conta. Cada conversa corresponde a um agendamento, e o histórico fica guardado — você pode reler o que foi combinado a qualquer momento. Você recebe um aviso quando há mensagens novas.

Uma boa comunicação faz diferença na experiência do tutor e na sua reputação. Responder com rapidez e clareza transmite profissionalismo e deixa o tutor tranquilo em relação ao cuidado com o pet. O chat fica disponível durante o serviço e por um período após a conclusão, para eventuais acertos finais.`,
    icon: <MessageCircle size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },
  {
    category: 'petsitter',
    slug: 'como-compartilhar-localizacao',
    title: 'Como compartilhar a localização durante um passeio',
    excerpt: 'Mostre ao tutor o trajeto do passeio em tempo real.',
    content: `Compartilhar a sua localização durante os passeios é um diferencial que tranquiliza o tutor — ele consegue acompanhar por onde o pet passou. É totalmente opcional e fica sob o seu controle.

Primeiro, ative essa opção no seu perfil, marcando que você compartilha localização durante os passeios. Isso aparece como um diferencial para os tutores quando eles avaliam contratar você.

Durante um passeio, dentro do agendamento ativo, você encontra o botão para compartilhar a sua localização naquele momento. A cada vez que você aperta, o PetUno registra o ponto onde você está, e o tutor consegue ver esse trajeto no mapa. Você decide quando e quantas vezes compartilhar — pode marcar a saída, a chegada ao parque, o caminho de volta.

Vale saber: cada ponto que você compartilha fica registrado no histórico do serviço, visível para o tutor, mesmo depois que o passeio termina. Compartilhe à vontade nos momentos do passeio — é uma forma simples de mostrar cuidado e transparência.`,
    icon: <Navigation size={20} />,
    accent: 'text-success-600 bg-success-50',
    featured: false,
  },

  // ─── Sou Petsitter — Reputação e ganhos ───────────────────────────────
  {
    category: 'petsitter',
    slug: 'como-funcionam-minhas-avaliacoes',
    title: 'Como funcionam as minhas avaliações',
    excerpt: 'Veja como as notas dos tutores constroem sua reputação.',
    content: `Depois de cada serviço concluído, o tutor pode avaliar o seu trabalho com uma nota, etiquetas rápidas e um comentário. Essas avaliações aparecem no seu perfil e formam a sua reputação no PetUno.

Sua reputação é um dos seus maiores ativos na plataforma. Avaliações boas transmitem confiança e pesam quando um tutor está decidindo entre os cuidadores recomendados — um perfil bem avaliado tem mais chance de ser escolhido. Ou seja, cada serviço bem feito hoje ajuda a conquistar os próximos.

Para construir uma boa reputação, o caminho é direto: cuide bem dos animais, comunique-se com clareza, seja pontual e cumpra o que foi combinado. Lembre-se de marcar cada serviço como concluído ao final — é isso que libera a avaliação do tutor. Quanto mais serviços bem avaliados você acumula, mais forte fica o seu perfil.`,
    icon: <Star size={20} />,
    accent: 'text-secondary-700 bg-secondary-100',
    featured: false,
  },
  {
    category: 'petsitter',
    slug: 'como-recebo-meus-pagamentos',
    title: 'Como recebo meus pagamentos',
    excerpt: 'Entenda o prazo e como o valor chega até você.',
    content: `No PetUno, o tutor paga pelo serviço de forma antecipada, no momento da contratação. O valor referente ao seu trabalho fica retido pela plataforma e é liberado para você após o prazo de 48 horas após a conclusão do serviço. Essa retenção protege os dois lados: o tutor tem a segurança de que o serviço será prestado, e você tem a garantia de que o valor está reservado antes mesmo de começar.

Para receber, você precisará cadastrar suas informações de recebimento na plataforma. A parte da comissão do PetUno é descontada automaticamente, e o restante fica destinado a você.

Em caso de cancelamento pelo tutor após o aceite do agendamento, aplica-se a política de cancelamento da plataforma, que prevê a compensação de parte do valor ao cuidador pelo compromisso já assumido.`,
    icon: <Wallet size={20} />,
    accent: 'text-primary-600 bg-primary-50',
    featured: true,
  },
]

export function findHelpCategory(key: string | undefined): HelpCategoryInfo | undefined {
  return HELP_CATEGORIES.find(c => c.key === key)
}

export function findHelpArticle(category: string | undefined, slug: string | undefined): HelpArticle | undefined {
  return HELP_ARTICLES.find(a => a.category === category && a.slug === slug)
}

export function searchHelpArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return HELP_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
  )
}

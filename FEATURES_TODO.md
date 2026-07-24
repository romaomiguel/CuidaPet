# Features TODO — CuidaPet

Registro de features pendentes e decisões de produto já tomadas, para não se
perderem entre sessões. Ver `SECURITY_TODO.md` para pendências de hardening e
deploy. Estado atual: segurança grande (RLS, auth/refresh token com CSRF,
upload via backend) e as features de avaliação, chat e localização estão
concluídas.

## Fluxo do usuário (visão geral)

Pai de pet faz o match (já existe) → acessa a página do cuidador (a enriquecer
com mais customização) → escolhe o serviço → página de pagamento dentro da
plataforma → após pagar, é direcionado ao chat → o serviço aparece numa aba de
agendamentos, onde ele acompanha o chat com o petsitter e a localização do pet.

## Features pendentes (ordem sugerida)

### 1. Frases fixas de avaliação (pequena, próxima a fazer)
Adicionar frases prontas (chips) no modal de avaliação para reduzir atrito de
digitar. Comentário continua opcional.
**Decisão em aberto:** as frases devem se adaptar à nota (elogios se nota alta,
críticas construtivas se nota baixa) para não enviesar avaliações
artificialmente para cima.

### 2. Chat pós-contratação — ✅ CONCLUÍDA (2026-07-19)
Chat entre tutor e petsitter, disponível após a contratação. Implementado com
polling (não WebSockets) + persistência de mensagens no Postgres.
- **Abre/fecha:** a conversa existe desde que `booking.acceptedAt` é setado;
  envio de mensagem fica liberado enquanto `status = accepted`, ou por 48h
  após `completedAt` (`CHAT_CLOSE_WINDOW_MS` no backend). O histórico
  continua visível mesmo depois que o envio fecha.
- **Tempo real:** polling incremental via `?after=<createdAt da última
  mensagem conhecida>` a cada 4s no thread aberto — a carga inteira do
  histórico acontece só na abertura da conversa, o resto do tempo cada poll
  traz só o delta, deduplicado no cliente por id. Lista de conversas e badge
  de não lidas fazem polling a cada 30s, mais invalidação pontual ao
  enviar/marcar como lida.
- **Badge de não lidas (in-app):** atualiza tanto ao abrir a conversa quanto
  automaticamente quando chega mensagem nova com o thread já aberto (não
  fica "preso" contando como não lida algo que o usuário já está vendo).
- **Acesso do admin:** NÃO entra nesta fase — ver decisão detalhada no item 4
  (Pagamento), seção "Acesso do admin às conversas de chat".

**Deixado para depois, de propósito:**
- **Notificação por e-mail/push** — avisar o usuário quando ele NÃO está no
  site (o que foi implementado é só o badge in-app, que exige estar com o
  site aberto). Fica para depois do item 4 (gateway de pagamento), quando
  provavelmente entra junto com outras notificações transacionais do fluxo
  de pagamento.

### 3. Localização do pet — ✅ CONCLUÍDA (2026-07-22)
Modelo escolhido: **check-in manual** (não rastreamento contínuo — ver "deixado
de fora" abaixo). O petsitter, durante um serviço `accepted`, aperta um botão
pra enviar um ponto de GPS; os pontos acumulam formando um trajeto, visível
pelo tutor permanentemente no histórico.
- **Backend:** `Backend/src/location-checkins/` — `POST
  /bookings/:bookingId/location-checkins` (só o petsitter dono, só com
  `booking.status === 'accepted'`, throttled 20/min) e `GET
  .../location-checkins` (só o tutor dono lê o trajeto — o próprio petsitter
  não tem acesso de leitura, por regra de produto). Tabela `LocationCheckIn`
  com RLS deny-all, mesmo padrão do resto do schema (ver `SECURITY_TODO.md`).
- **Frontend:** botão "Compartilhar localização agora" no lado petsitter
  (`PetsitterBookingsPage.tsx`, só em bookings `accepted`), com mensagens
  claras de erro pra permissão negada/GPS indisponível/timeout e aviso de que
  os check-ins ficam no histórico permanente do tutor. Mapa do trajeto
  (`LocationTrailMap.tsx`, Leaflet + OpenStreetMap, sem chave de API)
  acessível tanto pela tela de agendamentos do tutor (`account/BookingsPage.tsx`,
  botão "Ver trajeto") quanto pelo header do chat (`ChatThread.tsx`, ícone de
  pin, só visível pro tutor) — mesmo componente reaproveitado nos dois lugares.
  Estado vazio: "O cuidador ainda não compartilhou localização neste serviço."
- **Diferencial no perfil:** flag `offersLocationSharing` (toggle na aba
  "Perfil Público" de `PetsitterProfilePage.tsx`) exibida como badge na página
  pública do petsitter (`public/PetsitterDetailPage.tsx`) antes do tutor
  contratar, com redação honesta ("compartilha localização durante passeios",
  nunca "tempo real", já que o check-in é manual e depende do petsitter).
- **Validação de dono provada por teste automatizado** (script HTTP,
  registrado e depois limpo do banco): petsitter não-dono tentando check-in →
  403; check-in fora do status `accepted` → 400; petsitter dono tentando ler
  o próprio trajeto → 403; tutor dono lendo → 200 com os pontos.

**Deixado de fora, de propósito:**
- **Rastreamento contínuo/automático** — exige app nativo rodando em segundo
  plano (GPS em background não é viável de forma confiável via navegador web).
  Desejo futuro do dono, não implementado nesta fase.
- Linha de rota traçada entre os pontos (só os pontos já bastam) e
  navegação/roteamento.
- Política de retenção dos pontos — a tabela cresce permanentemente por
  design; custo de armazenamento a longo prazo fica registrado como
  pendência, não resolvido agora.

### 4. Pagamento com gateway (a maior, por último)
Marketplace com split de pagamento.

**PRÉ-REQUISITO:** item 4 do `SECURITY_TODO.md` (validar `pricingConfig` —
hoje aceita preço negativo) DEVE ser feito antes.

Modelo de produto já decidido pelo dono:
- Tutor paga antecipado. Comissão da plataforma é retida na hora. A parte do
  petsitter fica **retida (escrow)** até o serviço concluir.
- Liberação da parte do petsitter acontece por: (a) confirmação manual do
  tutor ("esse serviço já finalizou?"), ou (b) conclusão automática quando
  passa o tempo contratado.
- O **petsitter nunca controla a liberação do dinheiro** (evita fraude de quem
  recebe) — ele pode registrar início/fim, mas isso não libera pagamento.
- **Proteção adicional sugerida (a decidir):** janela de contestação. Quando o
  tempo passa, não libera imediato — o tutor tem um prazo (ex: 24-48h) para
  confirmar ou contestar ("petsitter não apareceu"). Sem contestação no prazo,
  libera automático. Com contestação, dinheiro fica retido → resolução manual
  (admin decide, no início).
- Nunca tocar em dado de cartão diretamente (responsabilidade do gateway /
  PCI-DSS).
- Gateway a escolher: Stripe Connect, Mercado Pago (split) ou Pagar.me. A
  escolha influencia o que é possível (escrow/split nativo vs. gerenciar
  estado no próprio banco). Exige cadastro de recebedor do petsitter (dados
  bancários, verificação).

**DECISÃO — Acesso do admin às conversas de chat** (registrada em 2026-07-19,
antes de implementar o frontend do chat):
- O admin NÃO tem acesso a todas as conversas por padrão — tutor e petsitter
  conversam esperando privacidade.
- O admin só poderá ler a conversa de um booking que estiver EM
  DISPUTA/CONTESTAÇÃO (dentro da janela de 48h pós-conclusão, quando o tutor
  contesta a liberação do escrow — ver "resolução manual" acima).
- Como o conceito de disputa/contestação ainda não existe (nasce junto com
  este módulo de pagamento), o acesso do admin ao chat será implementado
  JUNTO com a contestação, amarrado a ela desde o início — não como um
  "admin lê tudo" provisório a ser restringido depois.
- **Consequência para a feature de chat atual (item 2):** o acesso ao chat
  permanece restrito a tutor e petsitter do booking. Admin fica de fora por
  ora. O acesso condicionado à disputa entra só quando este módulo de
  pagamento for implementado.

### 5. Conclusão automática de serviço por tempo (entrelaçada com o pagamento)
Passado o tempo contratado (+ margem a definir), o booking conclui
automaticamente, liberando avaliação e (no modelo de pagamento) a liberação do
escrow. Requer um **job agendado** no servidor (`@nestjs/schedule` ou
similar) — peça de infraestrutura que o projeto ainda não tem.
**Cuidado:** o Render free tier hiberna, o que afeta jobs agendados.
Conclusão manual do petsitter e automática por tempo precisam conviver (o que
ocorrer primeiro vale). Decidir junto com o pagamento.

### Melhorias menores anotadas
- Página do cuidador: mais formas de customização (o dono mencionou).
- Petsitter poder responder a uma avaliação (possibilidade futura, não
  priorizada).

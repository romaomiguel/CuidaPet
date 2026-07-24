Vamos planejar a feature de CHAT entre tutor e petsitter. Esta é a FASE 1: investigar o que existe e propor a estrutura. NÃO implemente nada ainda.

## Regras de produto (já decididas)
- O chat abre quando o booking é ACEITO pelo petsitter (status accepted). Futuramente o gatilho mudará para "após pagamento", mas por ora é o aceite.
- O chat ENCERRA 48h após o serviço ser marcado como concluído (status completed). Depois disso, as mensagens ficam visíveis (histórico) mas não é possível enviar novas.
- Atualização por POLLING (o frontend pergunta por mensagens novas a cada poucos segundos, automaticamente — a tela atualiza sozinha, sem o usuário recarregar). NÃO usar WebSocket (o Render free tier hiberna e não mantém conexões bem).
- Badge de mensagens NÃO-LIDAS dentro do app (contador que aparece quando há mensagem nova). Notificação por push/e-mail está FORA de escopo por enquanto.

## FASE 1 — Investigar e propor
Investigue e me mostre:
1. O modelo Booking atual: os status que existem (pending, accepted, completed, etc.), como ele liga tutor e petsitter, e onde o horário de "concluído" fica registrado (precisamos dele para a regra das 48h).
2. As telas de agendamento que já existem (BookingsPage do tutor, PetsitterBookingsPage) — onde o acesso ao chat faria sentido.
3. Confirme: existe algum campo/registro de QUANDO o booking virou completed? A regra das 48h depende disso. Se não existir um timestamp de conclusão, isso precisa ser adicionado.

Depois proponha um PLANO cobrindo:

### Backend
- Modelo de dados: uma tabela de mensagens (ChatMessage ou similar) — quem enviou, para qual booking, conteúdo, timestamp, e um jeito de marcar lida/não-lida. Migration versionada (--create-only, mostrar SQL antes de aplicar).
- Endpoints: enviar mensagem, listar mensagens de um booking, e um endpoint leve para o polling (buscar mensagens novas / contar não-lidas). Todos protegidos: só o tutor e o petsitter DAQUELE booking podem ver/enviar (validação de dono — ninguém acessa o chat de um booking alheio).
- Regra de janela: enviar mensagem só é permitido enquanto o chat está "aberto" (booking accepted até 48h após completed). Fora disso, 400/403. Listar (ler histórico) continua permitido.
- Marcar como lida: quando o usuário abre o chat, as mensagens do outro viram lidas.

### Frontend
- Onde o chat aparece (a partir do card de agendamento, provavelmente um modal ou página dedicada).
- O polling: intervalo razoável (ex: 3-5s) enquanto o chat está aberto na tela; parar o polling quando sai da tela (não ficar consultando pra sempre).
- Badge de não-lidas: onde aparece (na aba de agendamentos? no card do booking?), alimentado pelo endpoint de contagem.
- Estado "chat encerrado" (após 48h): mostrar histórico, desabilitar o envio.

### Considerações
- Custo do polling: com o Render free tier hibernando, e o polling perguntando a cada poucos segundos, pense se isso mantém o backend "acordado" o tempo todo (pode ser bom ou ruim). Comente.
- Aponte o que fica FORA de escopo: notificação push/e-mail, envio de imagens/anexos no chat (a menos que você recomende incluir), indicador de "digitando", mensagens editáveis/apagáveis.

Ao final da FASE 1, PARE e aguarde minha aprovação. E limpe os processos órfãos antes.
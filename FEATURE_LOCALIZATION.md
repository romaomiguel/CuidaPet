Vamos planejar a feature de LOCALIZAÇÃO (check-in manual do petsitter durante o serviço). FASE 1: investigar e propor a estrutura. NÃO implemente ainda.

## Regras de produto (decididas)
- Modelo: CHECK-IN MANUAL. O petsitter, durante um serviço ativo (booking accepted), aperta um botão "Compartilhar localização agora"; o navegador captura a posição via Geolocation API (com permissão do usuário) e envia UM ponto. Ele pode fazer vários check-ins ao longo do passeio.
- Os pontos ACUMULAM formando um trajeto. O tutor vê todos os pontos no mapa (a trilha do passeio), cada um com horário.
- O trajeto fica no HISTÓRICO (permanente), consultável pelo tutor mesmo após o serviço terminar.
- Diferencial no perfil: o petsitter marca que oferece compartilhamento de localização, e isso aparece pro tutor ANTES de contratar. IMPORTANTE: redigir com honestidade — "compartilha localização durante passeios" (capacidade oferecida), NÃO "acompanhe em tempo real" (garantia), porque o check-in é manual e depende do petsitter.
- Acesso do tutor ao mapa: DENTRO do agendamento, fácil de acessar a partir do chat/conversa.
- Mapa: usar Leaflet + OpenStreetMap (gratuito, sem chave de API). NÃO Google Maps (tem custo).

## Privacidade / LGPD (importante)
- Localização é dado pessoal sensível. O consentimento do petsitter é o próprio ato de apertar o botão de check-in (ação explícita, por serviço).
- O petsitter precisa estar CIENTE de que os check-ins viram histórico permanente consultável pelo tutor (não é efêmero). Deixe isso claro na UI do lado do petsitter.
- Só o petsitter DAQUELE booking envia check-in; só o tutor DAQUELE booking vê o trajeto (validação de dono, como no chat).
- Check-in só é permitido enquanto o serviço está ativo (booking accepted / dentro da janela do serviço) — não faz sentido compartilhar localização fora do serviço.

## FASE 1 — Investigar e propor
Investigue e mostre:
1. O modelo Booking e como ele liga tutor/petsitter (já usamos isso no chat — confirme).
2. O modelo PetsitterProfile — onde entraria a flag de "oferece compartilhamento de localização" (é um booleano no perfil). Como o perfil é exibido pro tutor antes de contratar (a página do petsitter), pra saber onde a tag aparece.
3. As telas de agendamento e o chat — onde o botão de check-in (lado petsitter) e o mapa (lado tutor) se encaixam, acessível do chat.

Depois proponha o PLANO:

### Backend
- Modelo de dados: tabela de pontos de localização (bookingId, latitude, longitude, timestamp). Migration versionada (--create-only, mostrar SQL antes).
- Flag no PetsitterProfile pra "oferece localização" (migration).
- Endpoints: petsitter envia um check-in (lat/long) — validando que é o petsitter do booking e que o serviço está ativo; tutor lista os pontos do trajeto de um booking — validando que é o tutor do booking. Rate limit razoável no envio (evitar spam de pontos).
- Validação de dono em ambos, como no chat.

### Frontend
- Lado petsitter: botão "Compartilhar localização agora" dentro do agendamento ativo, usando a Geolocation API do navegador (tratar permissão negada / erro de GPS com mensagem clara). Aviso de que os pontos ficam no histórico do tutor.
- Lado tutor: mapa (Leaflet) com os pontos do trajeto + horário de cada, acessível de dentro do agendamento/chat.
- Perfil do petsitter: toggle pra ativar a flag; e a exibição da tag na página pública do petsitter (redação honesta).
- Estado vazio (nenhum check-in ainda): mensagem clara pro tutor ("O cuidador ainda não compartilhou localização neste serviço").

### Considerações
- Aponte o custo de armazenar trajetos permanentemente (retenção futura — não resolver agora, só registrar).
- Fora de escopo: rastreamento contínuo/automático (exige app nativo — desejo futuro do dono), linha de rota traçada entre pontos (só os pontos já bastam), navegação/rotas.

Ao final da FASE 1, PARE e aguarde aprovação. Limpe processos órfãos antes.
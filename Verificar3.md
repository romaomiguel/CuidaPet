Mapeamento aprovado. Vamos implementar a feature de avaliação. Escopo: montar a UI de avaliação usando as peças que já existem (reviewService.create, RatingStars interativo) + os 3 fixes que você identificou. Me mostre os diffs antes de aplicar (pode agrupar por arquivo) e prove no final.

## Backend (2 fixes)
1. GET /bookings: inclua a relação `review` na resposta, para o frontend saber quais bookings já foram avaliados. Cuidado: use select/include que traga só o necessário da review (id, rating) — não exponha campos internos, e mantenha o padrão de não vazar dados sensíveis que a gente estabeleceu.
2. POST /reviews: trate o erro de review duplicada (Prisma P2002 na unique constraint bookingId+tutorId) devolvendo 409 Conflict com mensagem clara ("Você já avaliou este agendamento."), em vez do 500 genérico atual.

## Frontend (a feature em si + 1 fix)
3. Corrija o bug do ID errado na busca de reviews em PetsitterDetailPage.tsx. Confirme qual ID o GET /reviews/petsitter/:petsitterId espera (PetsitterProfile.id? User.id?) e qual está sendo passado hoje — me diga qual era o erro. Depois de corrigir, a lista de avaliações na página do petsitter deve aparecer de verdade.
4. Crie a UI de avaliação:
   - Um modal/form de avaliação usando RatingStars com interactive={true} (seleção de 1-5 estrelas) + um campo de comentário opcional.
   - No BookingsPage.tsx do tutor: um botão "Avaliar" que aparece SÓ em bookings com status 'completed' que AINDA NÃO têm review (usando o include do fix #1). Bookings já avaliados mostram a nota dada, não o botão.
   - Ao enviar, chama reviewService.create, trata sucesso (toast + atualiza a UI pra mostrar que foi avaliado) e erro (incluindo o 409 de duplicada, mostrando a mensagem clara).

## Provas ao final
- Fluxo completo: como tutor, avaliar um booking completed → review criada, rating do petsitter atualizado, botão some/vira nota.
- Tentar avaliar de novo o mesmo booking → 409 com mensagem clara (não 500).
- A avaliação aparece na página do petsitter (prova de que o fix do ID funcionou).
- Tentar avaliar um booking NÃO completed → bloqueado (o backend já faz isso, confirme que a UI nem oferece o botão).
- Me dê o roteiro pra eu testar no navegador.

E antes: confirme que só há 1 backend e 1 frontend rodando.
// Espelha Frontend/src/constants/reviewTags.ts — mantenha os dois em sync manualmente
// (não há pacote compartilhado entre os projetos). Fonte de verdade pra validação do servidor.
export const REVIEW_TAGS_BY_RATING: Record<number, string[]> = {
  5: [
    'Cuidou muito bem do meu pet',
    'Pontual e atencioso',
    'Comunicação excelente',
    'Super recomendo',
    'Meu pet ficou tranquilo e feliz',
  ],
  4: [
    'Bom atendimento',
    'Cuidou bem do meu pet',
    'Comunicação boa',
    'Recomendo',
  ],
  3: [
    'Serviço dentro do esperado',
    'Atendeu o combinado',
    'Comunicação poderia melhorar',
    'Pet ficou bem, mas sem destaque',
  ],
  2: [
    'Não foi muito pontual',
    'Comunicação abaixo do esperado',
    'Não seguiu tudo que foi combinado',
    'Meu pet ficou um pouco desconfortável',
  ],
  1: [
    'Não foi pontual',
    'Comunicação ruim',
    'Não seguiu o combinado',
    'Meu pet não ficou confortável',
  ],
};

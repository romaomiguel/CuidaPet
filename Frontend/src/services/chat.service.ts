import api from '@/lib/axios'
import type { ChatConversation, ChatMessage } from '@/types'

// Timeout mais curto que o padrão do axios (15s) só nas chamadas de polling — uma
// requisição lenta não deve esticar o intervalo efetivo de atualização por muito tempo.
const POLLING_TIMEOUT_MS = 7000

export const chatService = {
  async listConversations(silent = false): Promise<ChatConversation[]> {
    const { data } = await api.get<ChatConversation[]>('/chat/conversations', {
      silentError: silent,
      timeout: POLLING_TIMEOUT_MS,
    })
    return data
  },

  async getUnreadCount(silent = false): Promise<{ count: number }> {
    const { data } = await api.get<{ count: number }>('/chat/unread-count', {
      silentError: silent,
      timeout: POLLING_TIMEOUT_MS,
    })
    return data
  },

  /** Sem `after`: histórico inteiro (carga inicial da conversa). Com `after`: só
   * mensagens criadas depois desse timestamp — usado pelo polling incremental do
   * ChatThread, que acumula o delta no cliente em vez de rebaixar a conversa inteira
   * a cada 4s. */
  async listMessages(bookingId: string, after?: string, silent = false): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/chat/${bookingId}/messages`, {
      params: after ? { after } : undefined,
      silentError: silent,
      timeout: POLLING_TIMEOUT_MS,
    })
    return data
  },

  async sendMessage(bookingId: string, content: string): Promise<void> {
    await api.post(`/chat/${bookingId}/messages`, { content })
  },

  async markRead(bookingId: string): Promise<void> {
    await api.patch(`/chat/${bookingId}/read`)
  },
}

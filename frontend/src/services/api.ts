import axios from 'axios'
import type { Subscription, SubscriptionStats, NotificationConfig, LunarInfo } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const subscriptionApi = {
  getAll: (activeOnly?: boolean, showLunar?: boolean) =>
    api.get<Subscription[]>('/subscriptions', {
      params: { active: activeOnly ? 'true' : undefined, show_lunar: showLunar ? 'true' : undefined },
    }),

  getById: (id: number, showLunar?: boolean) =>
    api.get<{ subscription: Subscription; start_date_lunar?: LunarInfo; end_date_lunar?: LunarInfo }>(
      `/subscriptions/${id}`,
      { params: { show_lunar: showLunar ? 'true' : undefined } }
    ),

  create: (data: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Subscription>('/subscriptions', data),

  update: (id: number, data: Partial<Subscription>) =>
    api.put<Subscription>(`/subscriptions/${id}`, data),

  delete: (id: number) => api.delete(`/subscriptions/${id}`),

  toggleActive: (id: number) => api.post<Subscription>(`/subscriptions/${id}/toggle`),

  getStats: () => api.get<SubscriptionStats>('/subscriptions/stats'),

  getExpiringSoon: () => api.get<Subscription[]>('/subscriptions/expiring-soon'),

  getExpired: () => api.get<Subscription[]>('/subscriptions/expired'),
}

export const lunarApi = {
  getInfo: (date?: string) =>
    api.get<LunarInfo>('/lunar/info', { params: { date } }),

  lunarToSolar: (data: { year: number; month: number; day: number; is_leap_month?: boolean }) =>
    api.post<{ solar_year: number; solar_month: number; solar_day: number }>('/lunar/to-solar', data),
}

export const notificationConfigApi = {
  get: () => api.get<NotificationConfig>('/notification-config'),

  update: (data: Partial<NotificationConfig>) =>
    api.put<NotificationConfig>('/notification-config', data),
}

export const testApi = {
  testWebhook: (data: { title: string; message: string }) =>
    api.post('/test/webhook', data),

  testWechatBot: (data: { title: string; message: string }) =>
    api.post('/test/wechat-bot', data),

  testEmail: (data: { title: string; message: string; email: string }) =>
    api.post('/test/email', data),
}

export default api

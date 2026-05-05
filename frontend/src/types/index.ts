export interface Subscription {
  id: number
  name: string
  service_type: string
  start_date: string
  end_date: string
  is_lunar_date: boolean
  is_auto_renewal: boolean
  renewal_cycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  reminder_days: number
  price: number
  currency: string
  is_active: boolean
  notes: string
  notify_webhook: boolean
  notify_wechat_bot: boolean
  notify_email: boolean
  notify_emails: string
  created_at: string
  updated_at: string
  start_date_lunar?: LunarInfo
  end_date_lunar?: LunarInfo
}

export interface LunarInfo {
  lunar_year: number
  lunar_month: number
  lunar_day: number
  is_leap_month: boolean
  gan_zhi_year: string
  sheng_xiao: string
  month_name: string
  day_name: string
  full_lunar_string: string
}

export interface SubscriptionStats {
  total: number
  active: number
  inactive: number
  expiring_soon: number
  expired: number
}

export interface NotificationConfig {
  id: number
  webhook_url: string
  webhook_method: string
  webhook_headers: string
  wechat_bot_url: string
  email_recipients: string
  updated_at: string
}

export interface NotificationLog {
  id: number
  subscription_id: number
  notify_type: string
  message: string
  is_success: boolean
  error_msg: string
  created_at: string
}

export type RenewalCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export const RENEWAL_CYCLE_OPTIONS: { value: RenewalCycle; label: string }[] = [
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'quarterly', label: '每季度' },
  { value: 'yearly', label: '每年' },
]

export const SERVICE_TYPES = [
  '视频会员',
  '音乐会员',
  '云存储',
  '软件订阅',
  '游戏会员',
  '健身会员',
  '杂志订阅',
  '其他',
]

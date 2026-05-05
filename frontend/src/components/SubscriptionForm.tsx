import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import dayjs from 'dayjs'
import type { Subscription } from '@/types'
import { RENEWAL_CYCLE_OPTIONS, SERVICE_TYPES } from '@/types'

const subscriptionSchema = z.object({
  name: z.string().min(1, '订阅名称不能为空'),
  service_type: z.string().min(1, '服务类型不能为空'),
  start_date: z.string().min(1, '开始日期不能为空'),
  end_date: z.string().min(1, '到期日期不能为空'),
  is_lunar_date: z.boolean().default(false),
  is_auto_renewal: z.boolean().default(false),
  renewal_cycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('yearly'),
  reminder_days: z.number().int().min(0).max(365).default(3),
  price: z.number().min(0).default(0),
  currency: z.string().default('CNY'),
  is_active: z.boolean().default(true),
  notes: z.string().default(''),
  notify_webhook: z.boolean().default(false),
  notify_wechat_bot: z.boolean().default(false),
  notify_email: z.boolean().default(false),
  notify_emails: z.string().default(''),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormProps {
  subscription?: Subscription
  onSubmit: (data: SubscriptionFormData) => void
  onClose: () => void
}

export function SubscriptionForm({ subscription, onSubmit, onClose }: SubscriptionFormProps) {
  const defaultValues: SubscriptionFormData = subscription
    ? {
        name: subscription.name,
        service_type: subscription.service_type,
        start_date: dayjs(subscription.start_date).format('YYYY-MM-DD'),
        end_date: dayjs(subscription.end_date).format('YYYY-MM-DD'),
        is_lunar_date: subscription.is_lunar_date,
        is_auto_renewal: subscription.is_auto_renewal,
        renewal_cycle: subscription.renewal_cycle,
        reminder_days: subscription.reminder_days,
        price: subscription.price,
        currency: subscription.currency,
        is_active: subscription.is_active,
        notes: subscription.notes,
        notify_webhook: subscription.notify_webhook,
        notify_wechat_bot: subscription.notify_wechat_bot,
        notify_email: subscription.notify_email,
        notify_emails: subscription.notify_emails,
      }
    : {
        name: '',
        service_type: '',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        is_lunar_date: false,
        is_auto_renewal: false,
        renewal_cycle: 'yearly',
        reminder_days: 3,
        price: 0,
        currency: 'CNY',
        is_active: true,
        notes: '',
        notify_webhook: false,
        notify_wechat_bot: false,
        notify_email: false,
        notify_emails: '',
      }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  })

  const isAutoRenewal = watch('is_auto_renewal')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {subscription ? '编辑订阅' : '添加订阅'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  订阅名称 *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="input"
                  placeholder="例如：Netflix 会员"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  服务类型 *
                </label>
                <select {...register('service_type')} className="select">
                  <option value="">请选择类型</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.service_type && (
                  <p className="text-red-500 text-sm mt-1">{errors.service_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始日期 *
                </label>
                <input {...register('start_date')} type="date" className="input" />
                {errors.start_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  到期日期 *
                </label>
                <input {...register('end_date')} type="date" className="input" />
                {errors.end_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格
                </label>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  货币
                </label>
                <select {...register('currency')} className="select">
                  <option value="CNY">CNY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="HKD">HKD (HK$)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提前提醒天数
                </label>
                <input
                  {...register('reminder_days', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="365"
                  className="input"
                  placeholder="3"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  {...register('is_lunar_date')}
                  type="checkbox"
                  id="is_lunar_date"
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="is_lunar_date" className="text-sm text-gray-700">
                  日期为农历（用于农历节日等订阅）
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  {...register('is_auto_renewal')}
                  type="checkbox"
                  id="is_auto_renewal"
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="is_auto_renewal" className="text-sm text-gray-700">
                  自动续订
                </label>
              </div>

              {isAutoRenewal && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    续订周期
                  </label>
                  <select {...register('renewal_cycle')} className="select max-w-xs">
                    {RENEWAL_CYCLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  id="is_active"
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  启用订阅
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-800 mb-3">通知设置</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    {...register('notify_webhook')}
                    type="checkbox"
                    id="notify_webhook"
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <label htmlFor="notify_webhook" className="text-sm text-gray-700">
                    Webhook 通知
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    {...register('notify_wechat_bot')}
                    type="checkbox"
                    id="notify_wechat_bot"
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <label htmlFor="notify_wechat_bot" className="text-sm text-gray-700">
                    企业微信机器人通知
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    {...register('notify_email')}
                    type="checkbox"
                    id="notify_email"
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <label htmlFor="notify_email" className="text-sm text-gray-700">
                    邮件通知
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通知邮箱（多个用逗号分隔）
                  </label>
                  <input
                    {...register('notify_emails')}
                    type="text"
                    className="input"
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                {...register('notes')}
                className="input h-24 resize-none"
                placeholder="添加备注信息..."
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : (subscription ? '更新' : '添加')}
          </button>
        </div>
      </div>
    </div>
  )
}

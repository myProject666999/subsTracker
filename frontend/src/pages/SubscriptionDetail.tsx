import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Calendar, DollarSign, Bell, Mail, MessageSquare, Link2 } from 'lucide-react'
import { subscriptionApi } from '@/services/api'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'

export function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const { showLunar } = useAppStore()

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', id, showLunar],
    queryFn: () => subscriptionApi.getById(Number(id), showLunar).then((res) => res.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">订阅不存在</h3>
        </div>
      </div>
    )
  }

  const { subscription, start_date_lunar, end_date_lunar } = data
  const daysUntilExpiry = dayjs(subscription.end_date).diff(dayjs(), 'day')

  const getStatusBadge = () => {
    if (!subscription.is_active) {
      return <span className="badge bg-gray-100 text-gray-600">已停用</span>
    }
    if (daysUntilExpiry < 0) {
      return <span className="badge bg-red-100 text-red-600">已过期</span>
    }
    if (daysUntilExpiry <= 7) {
      return <span className="badge bg-yellow-100 text-yellow-600">即将到期</span>
    }
    return <span className="badge bg-green-100 text-green-600">正常</span>
  }

  const renewalCycleLabels: Record<string, string> = {
    weekly: '每周',
    monthly: '每月',
    quarterly: '每季度',
    yearly: '每年',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{subscription.name}</h1>
            {getStatusBadge()}
            {subscription.is_auto_renewal && (
              <span className="badge bg-blue-100 text-blue-600">自动续订</span>
            )}
          </div>
          <p className="text-gray-500 mt-1">{subscription.service_type}</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          编辑
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">基本信息</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-sm">开始日期</div>
                    <div className="font-medium">
                      {dayjs(subscription.start_date).format('YYYY-MM-DD')}
                      {showLunar && start_date_lunar && (
                        <div className="text-sm text-gray-500">
                          {start_date_lunar.full_lunar_string}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-sm">到期日期</div>
                    <div className="font-medium">
                      {dayjs(subscription.end_date).format('YYYY-MM-DD')}
                      {showLunar && end_date_lunar && (
                        <div className="text-sm text-gray-500">
                          {end_date_lunar.full_lunar_string}
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      {daysUntilExpiry > 0 ? (
                        <span className="text-blue-600">还有 {daysUntilExpiry} 天到期</span>
                      ) : daysUntilExpiry === 0 ? (
                        <span className="text-yellow-600">今天到期</span>
                      ) : (
                        <span className="text-red-600">已过期 {Math.abs(daysUntilExpiry)} 天</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-sm">价格</div>
                    <div className="font-medium text-lg">
                      {subscription.currency} {subscription.price.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-sm">提醒设置</div>
                    <div className="font-medium">提前 {subscription.reminder_days} 天</div>
                    {subscription.is_auto_renewal && (
                      <div className="text-sm text-gray-500">
                        自动续订: {renewalCycleLabels[subscription.renewal_cycle]}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {subscription.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-gray-500 text-sm mb-1">备注</div>
                  <p className="text-gray-700">{subscription.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">通知渠道</h2>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <Link2 className={`w-5 h-5 ${subscription.notify_webhook ? 'text-green-500' : 'text-gray-300'}`} />
                <div>
                  <div className="font-medium">Webhook</div>
                  <div className="text-sm text-gray-500">
                    {subscription.notify_webhook ? '已启用' : '未启用'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MessageSquare className={`w-5 h-5 ${subscription.notify_wechat_bot ? 'text-green-500' : 'text-gray-300'}`} />
                <div>
                  <div className="font-medium">企业微信机器人</div>
                  <div className="text-sm text-gray-500">
                    {subscription.notify_wechat_bot ? '已启用' : '未启用'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${subscription.notify_email ? 'text-green-500' : 'text-gray-300'}`} />
                <div>
                  <div className="font-medium">邮件通知</div>
                  <div className="text-sm text-gray-500">
                    {subscription.notify_email ? '已启用' : '未启用'}
                  </div>
                </div>
              </div>

              {subscription.notify_emails && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">通知邮箱</div>
                  <div className="text-sm">{subscription.notify_emails}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">农历信息</h2>
            </div>
            <div className="card-body">
              {subscription.is_lunar_date ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-orange-100 text-orange-600">农历日期</span>
                  </div>
                  {showLunar && end_date_lunar && (
                    <div className="text-sm space-y-1">
                      <div>干支: {end_date_lunar.gan_zhi_year}</div>
                      <div>生肖: {end_date_lunar.sheng_xiao}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  此订阅使用公历日期。在顶部菜单可以开启农历显示。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

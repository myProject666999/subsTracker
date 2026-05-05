import type { Subscription } from '@/types'
import { useAppStore } from '@/store'
import { Edit2, Trash2, Power, Calendar, DollarSign, Bell } from 'lucide-react'
import dayjs from 'dayjs'

interface SubscriptionCardProps {
  subscription: Subscription
  onEdit: (sub: Subscription) => void
  onDelete: (id: number) => void
  onToggle: (id: number) => void
}

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
  onToggle,
}: SubscriptionCardProps) {
  const { showLunar } = useAppStore()
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

  const getDateDisplay = (date: string, lunarInfo?: any) => {
    const solarDate = dayjs(date).format('YYYY-MM-DD')
    if (showLunar && lunarInfo) {
      return (
        <div>
          <div>{solarDate}</div>
          <div className="text-xs text-gray-500">{lunarInfo.full_lunar_string}</div>
        </div>
      )
    }
    return solarDate
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{subscription.name}</h3>
              {getStatusBadge()}
              {subscription.is_auto_renewal && (
                <span className="badge bg-blue-100 text-blue-600">自动续订</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{subscription.service_type}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(subscription.id)}
              className={`p-2 rounded-lg transition-colors ${
                subscription.is_active
                  ? 'hover:bg-green-100 text-green-600'
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
              title={subscription.is_active ? '停用' : '启用'}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(subscription)}
              className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(subscription.id)}
              className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-500 text-xs">到期日期</div>
              {getDateDisplay(subscription.end_date, subscription.end_date_lunar)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-500 text-xs">价格</div>
              <div>
                {subscription.currency} {subscription.price.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-gray-500 text-xs">提前提醒</div>
              <div>{subscription.reminder_days} 天</div>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs mb-1">通知渠道</div>
            <div className="flex gap-1">
              {subscription.notify_webhook && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Webhook</span>
              )}
              {subscription.notify_wechat_bot && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">微信</span>
              )}
              {subscription.notify_email && (
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">邮件</span>
              )}
              {!subscription.notify_webhook &&
                !subscription.notify_wechat_bot &&
                !subscription.notify_email && (
                  <span className="text-xs text-gray-400">未设置</span>
                )}
            </div>
          </div>
        </div>

        {subscription.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{subscription.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

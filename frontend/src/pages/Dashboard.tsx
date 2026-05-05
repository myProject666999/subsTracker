import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '@/services/api'
import { CreditCard, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { useAppStore } from '@/store'

export function Dashboard() {
  const { showLunar } = useAppStore()
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: () => subscriptionApi.getStats().then((res) => res.data),
  })

  const { data: expiringSoon, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiring-soon'],
    queryFn: () => subscriptionApi.getExpiringSoon().then((res) => res.data),
  })

  const { data: expired, isLoading: expiredLoading } = useQuery({
    queryKey: ['expired'],
    queryFn: () => subscriptionApi.getExpired().then((res) => res.data),
  })

  const statCards = stats && [
    {
      label: '总订阅数',
      value: stats.total,
      icon: CreditCard,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500',
    },
    {
      label: '活跃订阅',
      value: stats.active,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500',
    },
    {
      label: '即将到期',
      value: stats.expiring_soon,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      bgColor: 'bg-yellow-500',
    },
    {
      label: '已过期',
      value: stats.expired,
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
      bgColor: 'bg-red-500',
    },
  ]

  if (statsLoading || expiringLoading || expiredLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 mt-1">管理您的所有订阅和提醒</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards?.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(expiringSoon?.length ?? 0) > 0 && (
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold">即将到期的订阅 ({expiringSoon?.length})</h2>
            </div>
            <div className="card-body space-y-3">
              {expiringSoon?.map((sub) => {
                const daysUntil = dayjs(sub.end_date).diff(dayjs(), 'day')
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(sub.end_date).format('YYYY-MM-DD')}
                        {showLunar && sub.end_date_lunar && (
                          <span className="ml-2 text-xs">
                            ({sub.end_date_lunar.full_lunar_string})
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">
                      {daysUntil} 天后
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(expired?.length ?? 0) > 0 && (
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold">已过期的订阅 ({expired?.length})</h2>
            </div>
            <div className="card-body space-y-3">
              {expired?.map((sub) => {
                const daysSince = Math.abs(dayjs(sub.end_date).diff(dayjs(), 'day'))
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-sm text-gray-500">
                        {dayjs(sub.end_date).format('YYYY-MM-DD')}
                        {showLunar && sub.end_date_lunar && (
                          <span className="ml-2 text-xs">
                            ({sub.end_date_lunar.full_lunar_string})
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      过期 {daysSince} 天
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(expiringSoon?.length ?? 0) === 0 && (expired?.length ?? 0) === 0 && (
          <div className="col-span-2">
            <div className="card">
              <div className="card-body text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">一切正常！</h3>
                <p className="text-gray-500 mt-2">
                  没有即将到期或已过期的订阅
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

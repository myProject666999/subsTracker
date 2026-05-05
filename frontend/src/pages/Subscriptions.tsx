import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter } from 'lucide-react'
import { subscriptionApi } from '@/services/api'
import { SubscriptionCard } from '@/components/SubscriptionCard'
import { SubscriptionForm } from '@/components/SubscriptionForm'
import type { Subscription } from '@/types'
import { useToastStore } from '@/store'
import { useAppStore } from '@/store'

export function Subscriptions() {
  const [showForm, setShowForm] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  
  const queryClient = useQueryClient()
  const { showToast } = useToastStore()
  const { showLunar } = useAppStore()

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['subscriptions', showLunar],
    queryFn: () => subscriptionApi.getAll(false, showLunar).then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: subscriptionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      showToast('订阅添加成功', 'success')
      setShowForm(false)
    },
    onError: () => {
      showToast('添加失败，请重试', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Subscription> }) =>
      subscriptionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      showToast('订阅更新成功', 'success')
      setShowForm(false)
      setEditingSub(undefined)
    },
    onError: () => {
      showToast('更新失败，请重试', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: subscriptionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      showToast('订阅已删除', 'success')
    },
    onError: () => {
      showToast('删除失败，请重试', 'error')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: subscriptionApi.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] })
      showToast('状态已更新', 'success')
    },
    onError: () => {
      showToast('更新失败，请重试', 'error')
    },
  })

  const handleSubmit = (data: any) => {
    if (editingSub) {
      updateMutation.mutate({ id: editingSub.id, data })
    } else {
      createMutation.mutate(data as any)
    }
  }

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setShowForm(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('确定要删除这个订阅吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggle = (id: number) => {
    toggleMutation.mutate(id)
  }

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.service_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterActive === 'all' ? true :
      filterActive === 'active' ? sub.is_active :
      !sub.is_active
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订阅管理</h1>
          <p className="text-gray-500 mt-1">管理您的所有订阅服务</p>
        </div>
        <button
          onClick={() => {
            setEditingSub(undefined)
            setShowForm(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加订阅
        </button>
      </div>

      <div className="card">
        <div className="card-body flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订阅名称或类型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="select"
            >
              <option value="all">全部</option>
              <option value="active">仅活跃</option>
              <option value="inactive">仅停用</option>
            </select>
          </div>
        </div>
      </div>

      {filteredSubscriptions && filteredSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900">暂无订阅</h3>
            <p className="text-gray-500 mt-2">
              {searchTerm ? '没有找到匹配的订阅' : '点击上方按钮添加您的第一个订阅'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                添加订阅
              </button>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          subscription={editingSub}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false)
            setEditingSub(undefined)
          }}
        />
      )}
    </div>
  )
}

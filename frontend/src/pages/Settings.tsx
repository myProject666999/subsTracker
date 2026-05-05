import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationConfigApi, testApi } from '@/services/api'
import { useToastStore } from '@/store'
import { Link2, MessageSquare, Mail, Send } from 'lucide-react'

const configSchema = z.object({
  webhook_url: z.string().url('请输入有效的 URL').or(z.string().length(0)),
  webhook_method: z.enum(['GET', 'POST', 'PUT']).default('POST'),
  webhook_headers: z.string().default(''),
  wechat_bot_url: z.string().url('请输入有效的 URL').or(z.string().length(0)),
  email_recipients: z.string().default(''),
})

type ConfigFormData = z.infer<typeof configSchema>

const testNotificationSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  message: z.string().min(1, '消息不能为空'),
  email: z.string().email('请输入有效的邮箱').optional(),
})

export function Settings() {
  const queryClient = useQueryClient()
  const { showToast } = useToastStore()

  const { data: config, isLoading } = useQuery({
    queryKey: ['notification-config'],
    queryFn: () => notificationConfigApi.get().then((res) => res.data),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      webhook_url: '',
      webhook_method: 'POST',
      webhook_headers: '',
      wechat_bot_url: '',
      email_recipients: '',
    },
    values: config,
  })

  const updateMutation = useMutation({
    mutationFn: notificationConfigApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-config'] })
      showToast('配置已保存', 'success')
    },
    onError: () => {
      showToast('保存失败，请重试', 'error')
    },
  })

  const onSubmit = (data: ConfigFormData) => {
    updateMutation.mutate(data)
  }

  const testWebhookMutation = useMutation({
    mutationFn: testApi.testWebhook,
    onSuccess: () => {
      showToast('Webhook 测试成功', 'success')
    },
    onError: (error: any) => {
      showToast(`测试失败: ${error.response?.data?.error || '未知错误'}`, 'error')
    },
  })

  const testWechatMutation = useMutation({
    mutationFn: testApi.testWechatBot,
    onSuccess: () => {
      showToast('企业微信机器人测试成功', 'success')
    },
    onError: (error: any) => {
      showToast(`测试失败: ${error.response?.data?.error || '未知错误'}`, 'error')
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: testApi.testEmail,
    onSuccess: () => {
      showToast('邮件测试成功', 'success')
    },
    onError: (error: any) => {
      showToast(`测试失败: ${error.response?.data?.error || '未知错误'}`, 'error')
    },
  })

  const handleTestWebhook = () => {
    testWebhookMutation.mutate({
      title: 'Webhook 测试',
      message: '这是一条来自订阅管家的测试消息。',
    })
  }

  const handleTestWechatBot = () => {
    testWechatMutation.mutate({
      title: '企业微信机器人测试',
      message: '这是一条来自订阅管家的测试消息。',
    })
  }

  const handleTestEmail = (email: string) => {
    testEmailMutation.mutate({
      title: '邮件测试',
      message: '这是一条来自订阅管家的测试消息。',
      email,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 mt-1">配置通知渠道和其他设置</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Link2 className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold">Webhook 配置</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <input
                    {...register('webhook_url')}
                    type="url"
                    className="input"
                    placeholder="https://example.com/webhook"
                  />
                  {errors.webhook_url && (
                    <p className="text-red-500 text-sm mt-1">{errors.webhook_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    请求方法
                  </label>
                  <select {...register('webhook_method')} className="select">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    请求头 (JSON 格式)
                  </label>
                  <input
                    {...register('webhook_headers')}
                    type="text"
                    className="input"
                    placeholder='{"Authorization": "Bearer token"}'
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    可选，用于自定义请求头
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestWebhook}
                className="btn btn-outline flex items-center gap-2"
                disabled={testWebhookMutation.isPending || !config?.webhook_url}
              >
                <Send className="w-4 h-4" />
                {testWebhookMutation.isPending ? '测试中...' : '测试 Webhook'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold">企业微信机器人</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  机器人 Webhook URL
                </label>
                <input
                  {...register('wechat_bot_url')}
                  type="url"
                  className="input"
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
                />
                {errors.wechat_bot_url && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.wechat_bot_url.message}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  在企业微信群中添加机器人，获取 Webhook 地址
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestWechatBot}
                className="btn btn-outline flex items-center gap-2"
                disabled={testWechatMutation.isPending || !config?.wechat_bot_url}
              >
                <Send className="w-4 h-4" />
                {testWechatMutation.isPending ? '测试中...' : '测试机器人'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold">邮件通知</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  默认收件人（多个用逗号分隔）
                </label>
                <input
                  {...register('email_recipients')}
                  type="text"
                  className="input"
                  placeholder="admin@example.com, support@example.com"
                />
                <p className="text-gray-500 text-xs mt-1">
                  需要在后端配置 Resend API Key 才能使用邮件功能
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">快速测试</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    id="test-email"
                    className="input max-w-xs"
                    placeholder="输入邮箱进行测试"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('test-email') as HTMLInputElement
                      if (input.value) {
                        handleTestEmail(input.value)
                      }
                    }}
                    className="btn btn-outline flex items-center gap-2"
                    disabled={testEmailMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                    {testEmailMutation.isPending ? '发送中...' : '发送测试'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => reset()} className="btn btn-outline">
              重置
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </form>

      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold">关于农历功能</h2>
        </div>
        <div className="card-body space-y-3 text-sm text-gray-600">
          <p>
            <strong>农历日期支持范围：</strong>1900 年 - 2100 年
          </p>
          <p>
            <strong>农历显示开关：</strong>在左侧导航栏底部可以切换是否显示农历日期。
            开启后，列表和详情页面会同时显示公历和农历日期。
          </p>
          <p>
            <strong>农历订阅：</strong>添加订阅时可以选择"日期为农历"，适用于农历节日、
            传统生日等场景。系统会自动将农历日期转换为公历进行提醒计算。
          </p>
          <p>
            <strong>通知中的农历：</strong>当订阅使用农历日期时，通知消息中会自动包含
            对应的农历信息（干支、生肖、农历日期）。
          </p>
        </div>
      </div>
    </div>
  )
}

import { useToastStore } from '@/store'
import { CheckCircle, XCircle, Info } from 'lucide-react'

export function Toast() {
  const { message, type } = useToastStore()

  if (!message) return null

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  }

  const bgMap = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgMap[type]}`}
      >
        {iconMap[type]}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

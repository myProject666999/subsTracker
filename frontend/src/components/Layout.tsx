import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CreditCard, 
  Settings, 
  Menu,
  Moon,
  Sun
} from 'lucide-react'
import { useAppStore } from '@/store'
import { Toast } from './Toast'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/subscriptions', icon: CreditCard, label: '订阅管理' },
  { path: '/settings', icon: Settings, label: '设置' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar, showLunar, toggleShowLunar } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold">
            S
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg text-gray-800">订阅管家</span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={toggleShowLunar}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors text-gray-600 hover:bg-gray-100"
          >
            {showLunar ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {sidebarOpen && (
              <span>农历显示: {showLunar ? '开启' : '关闭'}</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <Toast />
    </div>
  )
}

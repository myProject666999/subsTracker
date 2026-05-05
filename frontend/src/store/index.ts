import { create } from 'zustand'

interface AppState {
  showLunar: boolean
  sidebarOpen: boolean
  toggleShowLunar: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  showLunar: false,
  sidebarOpen: true,
  toggleShowLunar: () => set((state) => ({ showLunar: !state.showLunar })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))

interface ToastState {
  message: string | null
  type: 'success' | 'error' | 'info'
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  showToast: (message, type = 'info') => {
    set({ message, type })
    setTimeout(() => set({ message: null }), 3000)
  },
  hideToast: () => set({ message: null }),
}))

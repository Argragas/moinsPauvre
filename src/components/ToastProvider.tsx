import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '../lib/ToastContext'
import { Icon } from './Icon'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = useCallback((msg: string) => {
    setMessage(msg)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), 1900)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message && (
        <div className="toast">
          <Icon name="check" size={16} stroke={2.6} color="var(--money)" />
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

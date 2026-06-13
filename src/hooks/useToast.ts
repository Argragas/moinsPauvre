import { useContext } from 'react'
import { ToastContext } from '../lib/ToastContext'

export function useToast() {
  return useContext(ToastContext)
}

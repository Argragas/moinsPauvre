import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

describe('useAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initialise avec session null', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.session).toBeNull()
  })

  it('appelle signInWithPassword avec les bons params', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { session: null, user: null } as any,
      error: null,
    })
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.login('test@test.com', 'password')
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password',
    })
  })
})

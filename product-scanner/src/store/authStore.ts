import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthStore {
  user: any | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      signIn: async (email, password) => {
        set({ loading: true })
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) {
          set({ loading: false })
          throw error
        }
        set({ user: data.user })
        await get().fetchProfile()
        set({ loading: false })
      },
      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },
      fetchProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('*, locations(*)')
          .eq('id', user.id)
          .single()
        if (data) set({ profile: data, user })
      },
      isAuthenticated: () => !!get().user
    }),
    { name: 'auth-storage' }
  )
)

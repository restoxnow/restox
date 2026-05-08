'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import Image from 'next/image'

type Mode = 'login' | 'signup' | 'reset'

function PasswordInput({
  placeholder = 'Password',
  value,
  onChange,
  required,
}: {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm font-body
          focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
          placeholder:text-gray-400"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOAuth = async (provider: 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Check your email for a reset link.')
      } else if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (signUpError) throw signUpError

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError && signInData.session) {
          router.push('/dashboard/settings?tab=profile&welcome=true')
          router.refresh()
        } else {
          setMessage('Check your email to confirm your account.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const hasFullName = !!data.user?.user_metadata?.full_name
        router.push(hasFullName ? '/dashboard' : '/dashboard/settings?tab=profile')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setMessage('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-rx-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/restox-logo-icon.png" alt="Restox" width={64} height={64} className="mb-4 rounded-2xl" />
          <h1 className="font-heading font-bold text-2xl text-white">Restox</h1>
          <p className="text-white/50 text-sm mt-1 font-body">
            {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {mode !== 'reset' && (
            <>
              <button
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200
                  rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors font-body mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400 font-body">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-body
                focus:outline-none focus:ring-2 focus:ring-rx-orange/30 focus:border-rx-orange
                placeholder:text-gray-400"
            />

            {mode !== 'reset' && (
              <PasswordInput
                value={password}
                onChange={setPassword}
                required
              />
            )}

            {mode === 'signup' && (
              <>
                <PasswordInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={v => {
                    setConfirmPassword(v)
                    if (error === 'Passwords do not match') setError('')
                  }}
                  required
                />
                {error === 'Passwords do not match' && (
                  <p className="text-red-500 text-xs font-body -mt-1">{error}</p>
                )}
              </>
            )}

            {error && error !== 'Passwords do not match' && (
              <p className="text-red-500 text-xs font-body">{error}</p>
            )}
            {message && <p className="text-green-600 text-xs font-body">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-rx-orange hover:bg-rx-orange-dark text-white font-semibold
                rounded-xl text-sm transition-colors font-body disabled:opacity-60"
            >
              {loading ? 'Loading…' : mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Link' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center space-y-1">
            {mode === 'login' && (
              <>
                <button onClick={() => switchMode('reset')} className="block w-full text-xs text-gray-400 hover:text-rx-orange font-body transition-colors">
                  Forgot password?
                </button>
                <button onClick={() => switchMode('signup')} className="block w-full text-xs text-rx-blue hover:text-rx-blue-light font-body font-medium transition-colors">
                  Don&apos;t have an account? Sign up
                </button>
              </>
            )}
            {(mode === 'signup' || mode === 'reset') && (
              <button onClick={() => switchMode('login')} className="text-xs text-rx-blue hover:text-rx-blue-light font-body font-medium transition-colors">
                Back to sign in
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] text-gray-400 font-body leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-600 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

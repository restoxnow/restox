'use client'
import { useState, FormEvent } from 'react'

type UserType = 'consumer' | 'business'
type Status = 'idle' | 'loading' | 'success' | 'duplicate' | 'error'

export default function Waitlist() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<UserType>('consumer')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus('error')
      setErrorMsg('Please enter a valid email address.')
      return
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, user_type: userType }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
      } else if (res.status === 409) {
        setStatus('duplicate')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  return (
    <section id="waitlist" className="py-24 relative overflow-hidden">
      {/* Bold gradient background */}
      <div className="absolute inset-0 gradient-hero-bg opacity-95" />
      <div className="absolute inset-0 mesh-overlay" />

      {/* Floating shapes */}
      <div
        className="absolute top-10 right-20 w-48 h-48 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)', animation: 'float 7s ease-in-out infinite' }}
      />
      <div
        className="absolute bottom-10 left-16 w-36 h-36 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', animation: 'floatReverse 9s ease-in-out 2s infinite' }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl text-white mb-4 leading-tight">
            Be First to Automate<br />Everything
          </h2>
          <p className="text-white/85 font-body text-lg leading-relaxed">
            Join the waitlist for early access, founding member pricing, and updates on our launch.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-warm-xl">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-brand-dark mb-3">
                You&apos;re on the list! 🎉
              </h3>
              <p className="text-brand-mid font-body text-base leading-relaxed max-w-sm mx-auto">
                We&apos;ll be in touch soon with early access details. Get ready to automate everything.
              </p>
            </div>
          ) : status === 'duplicate' ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-brand-dark mb-3">
                Already on the list!
              </h3>
              <p className="text-brand-mid font-body text-base">
                This email is already registered. We&apos;ll see you at launch!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-heading font-bold text-brand-dark mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-brand-border bg-brand-warm text-brand-dark placeholder:text-brand-light font-body text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-heading font-bold text-brand-dark mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-brand-border bg-brand-warm text-brand-dark placeholder:text-brand-light font-body text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* User type toggle */}
              <div>
                <p className="block text-sm font-heading font-bold text-brand-dark mb-2">I am a&hellip;</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['consumer', 'business'] as UserType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={`py-3 px-4 rounded-xl border-2 font-heading font-bold text-sm capitalize transition-all duration-200 ${
                        userType === type
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-brand-border bg-white text-brand-mid hover:border-orange-300'
                      }`}
                    >
                      {type === 'consumer' ? '🏠 Consumer' : '💼 Business'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {status === 'error' && errorMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-body">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading' || !name.trim() || !email.trim()}
                className="w-full py-4 rounded-full font-heading font-bold text-base text-white bg-gradient-to-r from-orange-500 to-rose-500 shadow-warm-md hover:shadow-warm-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>
                    Join the Waitlist
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-brand-light font-body">
                No spam. Unsubscribe anytime. We respect your privacy.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

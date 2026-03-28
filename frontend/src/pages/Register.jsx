import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Activity, AlertCircle } from 'lucide-react'

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/60 transition-all"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      await register(form.email, form.name, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8 opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
            <Activity size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-white/40 text-sm mt-1">Start tracking your health with BioSync</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 opacity-0 animate-fade-up animate-delay-100" style={{ animationFillMode:'forwards' }}>
          <div>
            <label className="text-sm text-white/50 mb-2 block">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Doe" className={inputCls} required autoFocus />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-2 block">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputCls} required />
          </div>
          <div>
            <label className="text-sm text-white/50 mb-2 block">Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" className={inputCls} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors text-sm">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30 mt-6 opacity-0 animate-fade-up animate-delay-200" style={{ animationFillMode:'forwards' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

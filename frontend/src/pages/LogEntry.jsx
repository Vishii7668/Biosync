import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Moon, Footprints, Flame, Droplets, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { logsAPI } from '../api/client'

const Field = ({ label, icon: Icon, children, hint }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
      <Icon size={15} className="text-brand-400" /> {label}
    </label>
    {children}
    {hint && <p className="text-xs text-white/30 mt-1.5">{hint}</p>}
  </div>
)

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-500/60 focus:bg-white/8 transition-all"

export default function LogEntry() {
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    date: today, sleep_hours: '', steps: '', calories: '', water_ml: '', notes: ''
  })
  const [status, setStatus] = useState(null) // 'loading' | 'success' | 'error'
  const [error, setError] = useState('')

  // Pre-fill if log exists for today
  useEffect(() => {
    logsAPI.getByDate(today).then(r => {
      const l = r.data
      setForm({ date: l.date, sleep_hours: l.sleep_hours, steps: l.steps, calories: l.calories, water_ml: l.water_ml, notes: l.notes || '' })
    }).catch(() => {})
  }, [today])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      await logsAPI.create({
        date: form.date,
        sleep_hours: parseFloat(form.sleep_hours),
        steps: parseInt(form.steps),
        calories: parseInt(form.calories),
        water_ml: parseInt(form.water_ml) || 0,
        notes: form.notes
      })
      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.detail || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="text-2xl font-semibold">Log Your Day</h1>
        <p className="text-white/40 text-sm mt-1">Track your daily health metrics</p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5 opacity-0 animate-fade-up animate-delay-100" style={{ animationFillMode:'forwards' }}>
        {/* Date */}
        <Field label="Date" icon={FileText}>
          <input type="date" value={form.date} onChange={set('date')} max={today} className={inputCls} required />
        </Field>

        {/* Sleep */}
        <Field label="Sleep Hours" icon={Moon} hint="Recommended: 7–9 hours">
          <input
            type="number" step="0.5" min="0" max="24"
            value={form.sleep_hours} onChange={set('sleep_hours')}
            placeholder="e.g. 7.5"
            className={inputCls} required
          />
          {form.sleep_hours && (
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (parseFloat(form.sleep_hours) / 10) * 100)}%`,
                  background: parseFloat(form.sleep_hours) >= 7 && parseFloat(form.sleep_hours) <= 9 ? '#25a370' : '#f59e0b'
                }}
              />
            </div>
          )}
        </Field>

        {/* Steps */}
        <Field label="Steps" icon={Footprints} hint="Target: 10,000 steps/day">
          <input
            type="number" min="0"
            value={form.steps} onChange={set('steps')}
            placeholder="e.g. 8500"
            className={inputCls} required
          />
          {form.steps && (
            <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.min(100, (parseInt(form.steps) / 10000) * 100)}%` }}
              />
            </div>
          )}
        </Field>

        {/* Calories */}
        <Field label="Calories" icon={Flame} hint="Healthy range: 1,800–2,500 kcal">
          <input
            type="number" min="0"
            value={form.calories} onChange={set('calories')}
            placeholder="e.g. 2100"
            className={inputCls} required
          />
        </Field>

        {/* Water */}
        <Field label="Water Intake (ml)" icon={Droplets} hint="Target: 2,500 ml/day">
          <input
            type="number" step="50" min="0"
            value={form.water_ml} onChange={set('water_ml')}
            placeholder="e.g. 2000"
            className={inputCls}
          />
        </Field>

        {/* Notes */}
        <Field label="Notes (optional)" icon={FileText}>
          <textarea
            value={form.notes} onChange={set('notes')}
            placeholder="How are you feeling today?"
            rows={3}
            className={inputCls + ' resize-none'}
          />
        </Field>

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="flex items-center gap-2 text-brand-400 text-sm bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
            <CheckCircle size={16} /> Saved! Health score updated. Redirecting…
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          {status === 'loading' ? 'Saving…' : 'Save Log'}
        </button>
      </form>
    </div>
  )
}

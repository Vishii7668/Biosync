import { useEffect, useState } from 'react'
import { healthAPI } from '../api/client'
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle, Info, Moon, Footprints, Flame, Droplets } from 'lucide-react'
import ScoreRing from '../components/ScoreRing'

const RISK_CONFIG = {
  low:               { label: 'Low Risk', color: '#25a370', bg: 'bg-brand-500/10 border-brand-500/20', icon: ShieldCheck, textColor: 'text-brand-400' },
  moderate:          { label: 'Moderate Risk', color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20', icon: ShieldAlert, textColor: 'text-amber-400' },
  elevated:          { label: 'Elevated Risk', color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle, textColor: 'text-orange-400' },
  high:              { label: 'High Risk', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, textColor: 'text-red-400' },
  insufficient_data: { label: 'Not Enough Data', color: '#666', bg: 'bg-white/5 border-white/10', icon: Info, textColor: 'text-white/40' },
}

const SUB_METRICS = [
  { key: 'sleep_score', label: 'Sleep Quality', icon: Moon, color: '#a78bfa', weight: '35%' },
  { key: 'steps_score', label: 'Activity Level', icon: Footprints, color: '#25a370', weight: '30%' },
  { key: 'nutrition_score', label: 'Nutrition', icon: Flame, color: '#f59e0b', weight: '20%' },
  { key: 'hydration_score', label: 'Hydration', icon: Droplets, color: '#38bdf8', weight: '15%' },
]

function SubScoreBar({ label, icon: Icon, color, score, weight }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={15} style={{ color }} className="shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-white/60">{label}</span>
          <span className="text-white/40">{weight} weight · <span className="text-white font-medium">{Math.round(score ?? 0)}</span>/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score ?? 0}%`, background: color }}
          />
        </div>
      </div>
    </div>
  )
}

export default function RiskReport() {
  const [risk, setRisk] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    healthAPI.risk().then(r => setRisk(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cfg = RISK_CONFIG[risk?.risk_level] || RISK_CONFIG.insufficient_data
  const RiskIcon = cfg.icon

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="text-2xl font-semibold">Risk Report</h1>
        <p className="text-white/40 text-sm mt-1">Computed from your last 7 days · Updated on each log</p>
      </div>

      {/* Overall risk banner */}
      <div className={`flex items-center gap-4 glass border rounded-2xl px-6 py-5 mb-5 ${cfg.bg} opacity-0 animate-fade-up animate-delay-100`} style={{ animationFillMode:'forwards' }}>
        <RiskIcon size={32} style={{ color: cfg.color }} />
        <div className="flex-1">
          <p className={`text-lg font-semibold ${cfg.textColor}`}>{cfg.label}</p>
          <p className="text-white/40 text-sm">Based on avg sleep, steps, calories & hydration</p>
        </div>
        <ScoreRing score={risk?.overall_score} size={100} />
      </div>

      {/* Sub-scores */}
      <div className="glass rounded-2xl p-6 mb-5 opacity-0 animate-fade-up animate-delay-200" style={{ animationFillMode:'forwards' }}>
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-5">Score Breakdown</h2>
        <div className="space-y-4">
          {SUB_METRICS.map(m => (
            <SubScoreBar key={m.key} {...m} score={risk?.[m.key]} />
          ))}
        </div>
      </div>

      {/* Averages breakdown */}
      {risk?.breakdown && risk.breakdown.avg_sleep && (
        <div className="glass rounded-2xl p-6 mb-5 opacity-0 animate-fade-up animate-delay-300" style={{ animationFillMode:'forwards' }}>
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">7-Day Averages</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Sleep', `${risk.breakdown.avg_sleep}h`, '7–9h ideal'],
              ['Steps', risk.breakdown.avg_steps?.toLocaleString(), '10,000 ideal'],
              ['Calories', `${risk.breakdown.avg_calories?.toLocaleString()} kcal`, '1800–2500 ideal'],
              ['Hydration', `${risk.breakdown.avg_water?.toLocaleString()} ml`, '2500ml ideal'],
            ].map(([label, value, hint]) => (
              <div key={label} className="bg-white/3 rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="font-semibold">{value}</p>
                <p className="text-white/25 text-xs mt-0.5">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {risk?.recommendations?.length > 0 && (
        <div className="glass rounded-2xl p-6 opacity-0 animate-fade-up animate-delay-400" style={{ animationFillMode:'forwards' }}>
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">Recommendations</h2>
          <ul className="space-y-3">
            {risk.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-1 w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                <span className="text-white/70">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Model explanation */}
      <div className="glass rounded-2xl p-5 mt-4 opacity-0 animate-fade-up animate-delay-400" style={{ animationFillMode:'forwards' }}>
        <p className="text-xs text-white/30 leading-relaxed">
          <span className="text-white/50 font-medium">How risk scoring works:</span> Each metric is individually scored 0–100 against evidence-based targets
          (sleep: 7–9h, steps: 10,000/day, calories: 1,800–2,500 kcal, water: 2,500 ml).
          The overall score is a weighted average: Sleep 35% · Steps 30% · Nutrition 20% · Hydration 15%.
          Risk level is then mapped: 80+ = Low, 60–79 = Moderate, 40–59 = Elevated, below 40 = High.
        </p>
      </div>
    </div>
  )
}

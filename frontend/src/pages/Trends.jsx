import { useEffect, useState } from 'react'
import { healthAPI } from '../api/client'
import { Moon, Footprints, Flame, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Legend, Scatter
} from 'recharts'

const METRICS = [
  { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: Moon, color: '#a78bfa' },
  { key: 'steps', label: 'Steps', unit: '', icon: Footprints, color: '#25a370' },
  { key: 'calories', label: 'Calories', unit: 'kcal', icon: Flame, color: '#f59e0b' },
  { key: 'water_ml', label: 'Water', unit: 'ml', icon: Droplets, color: '#38bdf8' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      <p className="text-white/40 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name === 'forecast' ? '📈 Forecast' : 'Actual'}: <span className="font-semibold text-white">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function TrendCard({ metric }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    healthAPI.trend(metric.key).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [metric.key])

  const chartData = data ? [
    ...data.historical.map(p => ({ date: p.date.slice(5), actual: p.value })),
    ...data.forecast.map(p => ({ date: p.date.slice(5), forecast: p.value })),
  ] : []

  const TrendIcon = data?.trend_direction === 'improving' ? TrendingUp
    : data?.trend_direction === 'declining' ? TrendingDown : Minus

  const trendColor = data?.trend_direction === 'improving' ? 'text-brand-400'
    : data?.trend_direction === 'declining' ? 'text-red-400' : 'text-white/40'

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <metric.icon size={16} style={{ color: metric.color }} />
          <span className="font-medium text-sm">{metric.label}</span>
          {metric.unit && <span className="text-xs text-white/30">({metric.unit})</span>}
        </div>
        {data && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={14} />
            <span className="capitalize">{data.trend_direction}</span>
          </div>
        )}
      </div>

      {loading && <div className="h-40 flex items-center justify-center"><div className="w-5 h-5 border border-brand-500 border-t-transparent rounded-full animate-spin" /></div>}

      {!loading && chartData.length === 0 && (
        <p className="text-white/30 text-xs text-center py-8">Log at least 3 days to see trends</p>
      )}

      {!loading && chartData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="actual" name="actual" stroke={metric.color} strokeWidth={2} dot={{ r: 3, fill: metric.color }} connectNulls />
              <Line type="monotone" dataKey="forecast" name="forecast" stroke={metric.color} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: metric.color, opacity: 0.6 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1"><span style={{ width:16, height:2, background: metric.color, display:'inline-block', borderRadius:2 }} /> Historical</span>
            <span className="flex items-center gap-1"><span style={{ width:16, height:2, background: metric.color, display:'inline-block', borderRadius:2, opacity:0.5, borderTop:'2px dashed' }} /> 3-day forecast</span>
            {data && <span className="ml-auto">slope: {data.slope > 0 ? '+' : ''}{data.slope}</span>}
          </div>
        </>
      )}
    </div>
  )
}

export default function Trends() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
        <h1 className="text-2xl font-semibold">Trends & Forecast</h1>
        <p className="text-white/40 text-sm mt-1">Linear regression on your last 14 days · 3-day forecast</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {METRICS.map((m, i) => (
          <div key={m.key} className="opacity-0 animate-fade-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode:'forwards' }}>
            <TrendCard metric={m} />
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 mt-4 opacity-0 animate-fade-up animate-delay-400" style={{ animationFillMode:'forwards' }}>
        <p className="text-xs text-white/30 leading-relaxed">
          <span className="text-white/50 font-medium">How forecasting works:</span> We fit a simple linear regression (scikit-learn) on your last 14 days of data for each metric.
          The model learns the daily rate of change (slope) and projects it 3 days forward.
          A positive slope means improving, negative means declining. Simulated data yields stable forecasts;
          real variability may show wider swings.
        </p>
      </div>
    </div>
  )
}

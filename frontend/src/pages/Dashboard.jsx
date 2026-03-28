import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Footprints, Flame, Droplets, Zap, Calendar, PlusCircle } from 'lucide-react'
import { healthAPI, logsAPI } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/StatCard'
import ScoreRing from '../components/ScoreRing'
import { format, parseISO } from 'date-fns'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <span className="font-medium text-white">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [scores, setScores] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      healthAPI.dashboard(),
      healthAPI.scores(14),
      logsAPI.list(7)
    ]).then(([s, sc, l]) => {
      setStats(s.data)
      setScores([...sc.data].reverse())
      setLogs([...l.data].reverse())
    }).finally(() => setLoading(false))
  }, [])

  const scoreChartData = scores.map(s => ({
    date: format(parseISO(s.date), 'MMM d'),
    score: Math.round(s.score),
    sleep: Math.round(s.sleep_score),
    steps: Math.round(s.steps_score),
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
        <div>
          <h1 className="text-2xl font-semibold">Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-white/40 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <Link
          to="/log"
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 transition-colors text-white text-sm font-medium px-4 py-2.5 rounded-xl"
        >
          <PlusCircle size={16} /> Log Today
        </Link>
      </div>

      {/* Score + Stats row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Score ring card */}
        <div className="col-span-1 glass rounded-2xl p-5 flex flex-col items-center justify-center opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
          <p className="text-xs text-white/40 mb-3 uppercase tracking-widest">Health Score</p>
          <ScoreRing score={stats?.latest_score} />
        </div>
        {/* Stats */}
        <div className="col-span-4 grid grid-cols-4 gap-4">
          <StatCard label="Avg Sleep" value={stats?.avg_sleep} unit="hrs" icon={Moon} color="purple" delay={100} />
          <StatCard label="Avg Steps" value={stats?.avg_steps?.toLocaleString()} icon={Footprints} color="brand" delay={200} />
          <StatCard label="Avg Calories" value={stats?.avg_calories?.toLocaleString()} unit="kcal" icon={Flame} color="amber" delay={300} />
          <StatCard label="Hydration" value={stats?.avg_water} unit="ml" icon={Droplets} color="blue" delay={400} />
        </div>
      </div>

      {/* Streak + Logs count */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5 flex items-center gap-4 opacity-0 animate-fade-up animate-delay-200" style={{ animationFillMode:'forwards' }}>
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Zap size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats?.current_streak ?? 0} <span className="text-sm font-normal text-white/40">day streak</span></p>
            <p className="text-sm text-white/40">Keep logging daily!</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-5 flex items-center gap-4 opacity-0 animate-fade-up animate-delay-300" style={{ animationFillMode:'forwards' }}>
          <div className="p-3 rounded-xl bg-brand-500/10">
            <Calendar size={20} className="text-brand-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats?.total_logs ?? 0} <span className="text-sm font-normal text-white/40">total logs</span></p>
            <p className="text-sm text-white/40">Activity history</p>
          </div>
        </div>
      </div>

      {/* Health Score Chart */}
      {scoreChartData.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6 opacity-0 animate-fade-up animate-delay-300" style={{ animationFillMode:'forwards' }}>
          <h2 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-widest">Health Score — Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={scoreChartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25a370" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#25a370" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" name="Score" stroke="#25a370" strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent logs table */}
      {logs.length > 0 && (
        <div className="glass rounded-2xl p-6 opacity-0 animate-fade-up animate-delay-400" style={{ animationFillMode:'forwards' }}>
          <h2 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-widest">Recent Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-left border-b border-white/5">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Sleep</th>
                  <th className="pb-3 font-medium">Steps</th>
                  <th className="pb-3 font-medium">Calories</th>
                  <th className="pb-3 font-medium">Water</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 text-white/60">{format(parseISO(l.date), 'MMM d, yyyy')}</td>
                    <td className="py-3">{l.sleep_hours}h</td>
                    <td className="py-3">{l.steps.toLocaleString()}</td>
                    <td className="py-3">{l.calories.toLocaleString()} kcal</td>
                    <td className="py-3">{l.water_ml} ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="glass rounded-2xl p-12 text-center opacity-0 animate-fade-up" style={{ animationFillMode:'forwards' }}>
          <p className="text-white/40 mb-4">No logs yet. Start tracking your health!</p>
          <Link to="/log" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors">
            <PlusCircle size={16} /> Log your first day
          </Link>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

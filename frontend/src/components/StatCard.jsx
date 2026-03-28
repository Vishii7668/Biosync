export default function StatCard({ label, value, unit, icon: Icon, color = 'brand', delay = 0 }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-500/10',
    blue:  'text-blue-400 bg-blue-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    rose:  'text-rose-400 bg-rose-500/10',
    purple:'text-purple-400 bg-purple-500/10',
  }
  return (
    <div
      className="glass rounded-2xl p-5 opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} className={colors[color].split(' ')[0]} />
        </div>
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {value ?? '—'}
        {value != null && unit && <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>}
      </p>
      <p className="text-sm text-white/40 mt-1">{label}</p>
    </div>
  )
}

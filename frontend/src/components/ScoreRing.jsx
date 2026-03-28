export default function ScoreRing({ score, size = 140 }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const pct = score != null ? score / 100 : 0
  const dash = circ * pct
  const color = score >= 80 ? '#25a370' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="score-ring -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="text-center -mt-[calc(50%+20px)] mb-[calc(50%+20px)]" style={{ marginTop: -(size/2 + 24), marginBottom: size/2 - 8 }}>
        <div className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {score != null ? Math.round(score) : '—'}
        </div>
        <div className="text-xs text-white/40">{score != null ? label : 'No data'}</div>
      </div>
    </div>
  )
}

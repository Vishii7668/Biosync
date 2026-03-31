import { useState, useRef } from 'react'
import { Upload, Camera, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react'
import api from '../api/client'

const HEALTH_COLORS = {
  'low calorie':       { bg: 'bg-brand-500/10 border-brand-500/20', text: 'text-brand-400', dot: '#25a370' },
  'moderate calorie':  { bg: 'bg-blue-500/10 border-blue-500/20',   text: 'text-blue-400',  dot: '#38bdf8' },
  'high calorie':      { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', dot: '#f59e0b' },
  'very high calorie': { bg: 'bg-red-500/10 border-red-500/20',     text: 'text-red-400',   dot: '#ef4444' },
  'unknown':           { bg: 'bg-white/5 border-white/10',          text: 'text-white/40',  dot: '#888' },
}

export default function FoodClassifier() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleClassify = async () => {
    if (!image) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', image)
      const { data } = await api.post('/food/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Classification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError('')
  }

  const cfg = result ? (HEALTH_COLORS[result.health_tag] || HEALTH_COLORS.unknown) : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-2xl font-semibold">Food Classifier</h1>
        <p className="text-white/40 text-sm mt-1">
          Upload a food photo — MobileNetV2 identifies it and estimates calories
        </p>
      </div>

      {/* Upload area */}
      {!preview && (
        <div
          className={`glass rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 opacity-0 animate-fade-up animate-delay-100 border-2 border-dashed ${
            dragging ? 'border-brand-500/60 bg-brand-500/5' : 'border-white/10 hover:border-white/20'
          }`}
          style={{ animationFillMode: 'forwards' }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <Upload size={28} className="text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-white/80">Drop a food image here</p>
              <p className="text-sm text-white/30 mt-1">or click to browse · JPEG, PNG, WEBP · max 5MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview + classify */}
      {preview && !result && (
        <div className="glass rounded-2xl overflow-hidden opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
          <img src={preview} alt="Food preview" className="w-full max-h-72 object-cover" />
          <div className="p-5 flex gap-3">
            <button
              onClick={handleClassify}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Classifying...
                </>
              ) : (
                <>
                  <Camera size={16} /> Classify This Food
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-5 py-3 glass rounded-xl text-sm text-white/50 hover:text-white transition-colors"
            >
              Change
            </button>
          </div>
          {loading && (
            <div className="px-5 pb-4 text-xs text-white/30 text-center">
              MobileNetV2 is analysing your image... this may take 5–10 seconds on first run
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mt-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>

          {/* Image + main prediction */}
          <div className="glass rounded-2xl overflow-hidden">
            <img src={preview} alt="Food" className="w-full max-h-56 object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{result.prediction.label}</h2>
                  <p className="text-white/40 text-sm mt-0.5">
                    {result.prediction.confidence}% confidence
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {result.health_tag}
                </div>
              </div>

              {/* Calorie highlight */}
              <div className="mt-4 flex items-center gap-3 bg-white/3 rounded-xl px-4 py-3">
                <Zap size={18} className="text-amber-400" />
                <div>
                  <p className="text-xl font-semibold">
                    ~{result.prediction.estimated_calories}
                    <span className="text-sm font-normal text-white/40 ml-1">kcal / 100g</span>
                  </p>
                  <p className="text-xs text-white/30">Estimated calories</p>
                </div>
              </div>

              {/* Advice */}
              <div className={`mt-3 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${cfg.bg} ${cfg.text}`}>
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                {result.advice}
              </div>
            </div>
          </div>

          {/* Top 3 predictions */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
              Top 3 Predictions
            </h3>
            <div className="space-y-3">
              {result.top_predictions.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={i === 0 ? 'font-medium' : 'text-white/60'}>{p.label}</span>
                      <span className="text-white/40">{p.confidence}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${p.confidence}%`,
                          background: i === 0 ? '#25a370' : 'rgba(255,255,255,0.2)'
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-white/30 w-16 text-right">~{p.estimated_calories} kcal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Model info */}
          <div className="glass rounded-2xl p-4 flex items-start gap-3">
            <Info size={15} className="text-white/30 mt-0.5 shrink-0" />
            <p className="text-xs text-white/30 leading-relaxed">
              <span className="text-white/50">{result.model}.</span> {result.note}
            </p>
          </div>

          {/* Try another */}
          <button
            onClick={reset}
            className="w-full py-3 glass rounded-xl text-sm text-white/50 hover:text-white transition-colors"
          >
            Classify another food
          </button>
        </div>
      )}

      {/* How it works */}
      {!result && (
        <div className="glass rounded-2xl p-5 mt-4 opacity-0 animate-fade-up animate-delay-200" style={{ animationFillMode: 'forwards' }}>
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-3">How it works</h3>
          <p className="text-xs text-white/30 leading-relaxed">
            We use <span className="text-white/50">MobileNetV2</span> — a lightweight convolutional neural network
            pretrained on ImageNet (1,000 classes). When you upload a photo, the model extracts visual features
            through 53 convolutional layers and maps them to a food class. We then match the prediction to our
            nutritional database to estimate calories per 100g serving. First classification may take 10–15 seconds
            while the model loads into memory.
          </p>
        </div>
      )}
    </div>
  )
}


import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  History,
  Info,
  Layers3,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wand2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const algorithms = [
  {
    name: 'Unsharp Masking',
    icon: Sparkles,
    accent: 'violet',
    description: 'Enhances edge contrast by subtracting a blurred version and adding a scaled detail mask back into the original image.',
  },
  {
    name: 'Laplacian Filtering',
    icon: Layers3,
    accent: 'blue',
    description: 'Uses the Laplacian response to detect rapid intensity changes and sharpen fine structures with controlled strength.',
  },
  {
    name: 'High-Boost Filtering',
    icon: Gauge,
    accent: 'cyan',
    description: 'Boosts the high-frequency detail term while preserving the base image, ideal for selective emphasis without excessive blur.',
  },
] as const

const steps = [
  'Upload a clear photograph or choose one of the sample images.',
  'Select the sharpening algorithm and tune the kernel, sigma, and strength controls.',
  'Review the processed preview, compare against the original, and download the final result.',
]

const sampleImages = [
  { label: 'City Edge', src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80' },
  { label: 'Forest Contrast', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
  { label: 'Portrait Detail', src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80' },
] as const

const presets: Record<AlgorithmKey, Record<string, { kernelSize?: number; sigma?: number; amount?: number; alpha?: number; boost?: number }>> = {
  unsharp: {
    Soft: { kernelSize: 3, sigma: 0.8, amount: 1.2 },
    Balanced: { kernelSize: 5, sigma: 1.2, amount: 1.8 },
    Strong: { kernelSize: 7, sigma: 1.8, amount: 2.8 },
  },
  laplacian: {
    Soft: { sigma: 0.5, alpha: 0.8 },
    Balanced: { sigma: 1.0, alpha: 1.5 },
    Strong: { sigma: 1.5, alpha: 2.5 },
  },
  highboost: {
    Soft: { kernelSize: 3, sigma: 0.8, boost: 1.2 },
    Balanced: { kernelSize: 5, sigma: 1.2, boost: 1.5 },
    Strong: { kernelSize: 7, sigma: 1.8, boost: 2.3 },
  },
}

const algorithmTips: Record<AlgorithmKey, { heading: string; summary: string; details: string }> = {
  unsharp: {
    heading: 'Unsharp Masking',
    summary: 'Increases local edge contrast by emphasizing the high-frequency detail.',
    details: 'Higher amount and sigma can sharpen edges more strongly but may also increase noise.',
  },
  laplacian: {
    heading: 'Laplacian Filtering',
    summary: 'Detects intensity changes with a second-derivative style response.',
    details: 'A larger alpha increases edge emphasis. Too much can produce halos or a more dramatic effect.',
  },
  highboost: {
    heading: 'High-Boost Filtering',
    summary: 'Boosts detail while keeping the base image structure more stable.',
    details: 'Higher boost values intensify detail, while lower values preserve a softer appearance.',
  },
}

type AlgorithmKey = 'unsharp' | 'laplacian' | 'highboost'

type ImageMetrics = {
  width: number
  height: number
  format: string
  fileSize: string
  channels: number
}

type HistoryItem = {
  id: number
  operation: string
  params: string
  summary: string
  originalUrl: string
  originalFile: File
  processedUrl: string
  algorithm: AlgorithmKey
  values: ParameterValues
  processingTime: number
  originalInfo: ImageMetrics
  processedInfo: ImageMetrics
}

type ParameterValues = {
  kernelSize: number
  sigma: number
  amount: number
  alpha: number
  boost: number
}

type AlgorithmResult = {
  algorithm: AlgorithmKey
  imageUrl: string
  processingTime: number
  parameters: string
}

const formatBytes = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Unable to load the selected image.'))
  image.src = src
})

const readImageMetrics = async (src: string, file?: File): Promise<ImageMetrics> => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas is not available for image analysis.')
  }

  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  const pixelData = context.getImageData(0, 0, width, height).data
  let alphaPixels = 0
  for (let index = 3; index < pixelData.length; index += 4) {
    if (pixelData[index] < 255) alphaPixels += 1
  }

  const format = file?.type?.split('/')[1]?.toUpperCase() || file?.name?.split('.').pop()?.toUpperCase() || 'IMAGE'

  return {
    width,
    height,
    format,
    fileSize: file ? formatBytes(file.size) : 'Sample image',
    channels: alphaPixels > 0 ? 4 : 3,
  }
}

const readHistogram = async (src: string): Promise<number[][]> => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Histogram canvas is not available.')
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const histogram = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)]

  for (let index = 0; index < pixels.length; index += 4) {
    histogram[0][pixels[index]] += 1
    histogram[1][pixels[index + 1]] += 1
    histogram[2][pixels[index + 2]] += 1
  }

  return histogram
}

const readGrayscaleHistogram = async (src: string): Promise<number[]> => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Grayscale histogram canvas is not available.')

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const histogram = new Array(256).fill(0)
  for (let index = 0; index < pixels.length; index += 4) {
    const gray = Math.round(0.299 * pixels[index] + 0.587 * pixels[index + 1] + 0.114 * pixels[index + 2])
    histogram[gray] += 1
  }
  return histogram
}

const readLaplacianResponse = async (src: string): Promise<ImageData> => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 1000 / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height))
  canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
  canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Laplacian analysis canvas is not available.')

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const source = context.getImageData(0, 0, canvas.width, canvas.height)
  const gray = new Float32Array(canvas.width * canvas.height)
  let maximum = 1
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4
    gray[index] = 0.299 * source.data[offset] + 0.587 * source.data[offset + 1] + 0.114 * source.data[offset + 2]
  }

  const response = new Float32Array(gray.length)
  for (let y = 1; y < canvas.height - 1; y += 1) {
    for (let x = 1; x < canvas.width - 1; x += 1) {
      const index = y * canvas.width + x
      const value = Math.abs(4 * gray[index] - gray[index - 1] - gray[index + 1] - gray[index - canvas.width] - gray[index + canvas.width])
      response[index] = value
      maximum = Math.max(maximum, value)
    }
  }

  const output = context.createImageData(canvas.width, canvas.height)
  for (let index = 0; index < response.length; index += 1) {
    const value = Math.round((response[index] / maximum) * 255)
    const offset = index * 4
    output.data[offset] = value
    output.data[offset + 1] = value
    output.data[offset + 2] = value
    output.data[offset + 3] = 255
  }
  return output
}

const drawHistogram = (canvas: HTMLCanvasElement | null, histogram: number[][] | null) => {
  if (!canvas || !histogram) return

  const context = canvas.getContext('2d')
  if (!context) return

  const width = canvas.width = 320
  const height = canvas.height = 140
  context.clearRect(0, 0, width, height)

  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, 'rgba(20, 26, 39, 0.95)')
  background.addColorStop(1, 'rgba(11, 16, 27, 0.95)')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  const maxValue = Math.max(...histogram.flat(), 1)
  const colors = ['#f87171', '#4ade80', '#60a5fa']

  for (let channel = 0; channel < histogram.length; channel += 1) {
    context.beginPath()
    context.lineWidth = 2
    context.strokeStyle = colors[channel]
    for (let index = 0; index < 256; index += 1) {
      const value = histogram[channel][index] / maxValue
      const x = (index / 255) * width
      const y = height - value * (height - 12) - 6
      if (index === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }
}

const drawSingleHistogram = (canvas: HTMLCanvasElement | null, histogram: number[] | null, color: string) => {
  if (!canvas || !histogram) return
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width = 320
  const height = canvas.height = 140
  context.clearRect(0, 0, width, height)
  context.fillStyle = 'rgba(11, 16, 27, 0.95)'
  context.fillRect(0, 0, width, height)
  const maximum = Math.max(...histogram, 1)
  context.beginPath()
  context.lineWidth = 2
  context.strokeStyle = color
  histogram.forEach((count, index) => {
    const x = (index / 255) * width
    const y = height - (count / maximum) * (height - 12) - 6
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
  context.stroke()
}

const drawResponse = (canvas: HTMLCanvasElement | null, response: ImageData | null) => {
  if (!canvas || !response) return
  canvas.width = response.width
  canvas.height = response.height
  canvas.getContext('2d')?.putImageData(response, 0, 0)
}

const parameterSummary = (algorithmKey: AlgorithmKey, values: ParameterValues) => {
  const common = `kernel ${values.kernelSize}, sigma ${values.sigma.toFixed(1)}`
  if (algorithmKey === 'laplacian') return `${common}, alpha ${values.alpha.toFixed(1)}`
  if (algorithmKey === 'highboost') return `${common}, boost ${values.boost.toFixed(1)}`
  return `${common}, amount ${values.amount.toFixed(1)}`
}

const formatAlgorithmName = (algorithmKey: AlgorithmKey) => algorithms.find((item) =>
  item.name.toLowerCase().includes(algorithmKey === 'highboost' ? 'high' : algorithmKey),
)?.name ?? 'Unsharp Masking'

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const originalHistogramRef = useRef<HTMLCanvasElement | null>(null)
  const processedHistogramRef = useRef<HTMLCanvasElement | null>(null)
  const originalGrayHistogramRef = useRef<HTMLCanvasElement | null>(null)
  const processedGrayHistogramRef = useRef<HTMLCanvasElement | null>(null)
  const originalLaplacianRef = useRef<HTMLCanvasElement | null>(null)
  const processedLaplacianRef = useRef<HTMLCanvasElement | null>(null)

  const [algorithm, setAlgorithm] = useState<AlgorithmKey>('unsharp')
  const [kernelSize, setKernelSize] = useState(5)
  const [sigma, setSigma] = useState(1.2)
  const [amount, setAmount] = useState(1.8)
  const [alpha, setAlpha] = useState(1.0)
  const [boost, setBoost] = useState(1.5)
  const [selectedPreset, setSelectedPreset] = useState('Balanced')
  const [status, setStatus] = useState('Ready to process')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(sampleImages[0].src)
  const [processedUrl, setProcessedUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [comparisonOffset, setComparisonOffset] = useState(55)
  const [comparisonView, setComparisonView] = useState<'slider' | 'separate'>('slider')
  const [showHistogram, setShowHistogram] = useState(false)
  const [showLaplacian, setShowLaplacian] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showAlgorithmComparison, setShowAlgorithmComparison] = useState(false)
  const [isComparingAlgorithms, setIsComparingAlgorithms] = useState(false)
  const [algorithmResults, setAlgorithmResults] = useState<AlgorithmResult[]>([])
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [originalInfo, setOriginalInfo] = useState<ImageMetrics | null>(null)
  const [processedInfo, setProcessedInfo] = useState<ImageMetrics | null>(null)
  const [originalHistogram, setOriginalHistogram] = useState<number[][] | null>(null)
  const [processedHistogram, setProcessedHistogram] = useState<number[][] | null>(null)
  const [originalGrayHistogram, setOriginalGrayHistogram] = useState<number[] | null>(null)
  const [processedGrayHistogram, setProcessedGrayHistogram] = useState<number[] | null>(null)
  const [originalLaplacian, setOriginalLaplacian] = useState<ImageData | null>(null)
  const [processedLaplacian, setProcessedLaplacian] = useState<ImageData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const currentMethod = algorithms.find((item) => item.name.toLowerCase().includes(algorithm === 'unsharp' ? 'unsharp' : algorithm === 'laplacian' ? 'laplacian' : 'high'))

  useEffect(() => {
    if (!previewUrl) return
    readHistogram(previewUrl)
      .then(setOriginalHistogram)
      .catch(() => setOriginalHistogram(null))
  }, [previewUrl])

  useEffect(() => {
    if (!processedUrl) return
    readHistogram(processedUrl)
      .then(setProcessedHistogram)
      .catch(() => setProcessedHistogram(null))
  }, [processedUrl])

  useEffect(() => {
    if (!previewUrl) return
    readGrayscaleHistogram(previewUrl).then(setOriginalGrayHistogram).catch(() => setOriginalGrayHistogram(null))
  }, [previewUrl])

  useEffect(() => {
    if (!processedUrl) {
      setProcessedGrayHistogram(null)
      return
    }
    readGrayscaleHistogram(processedUrl).then(setProcessedGrayHistogram).catch(() => setProcessedGrayHistogram(null))
  }, [processedUrl])

  useEffect(() => {
    if (!showLaplacian) return
    readLaplacianResponse(previewUrl).then(setOriginalLaplacian).catch(() => setOriginalLaplacian(null))
    if (processedUrl) {
      readLaplacianResponse(processedUrl).then(setProcessedLaplacian).catch(() => setProcessedLaplacian(null))
    } else {
      setProcessedLaplacian(null)
    }
  }, [previewUrl, processedUrl, showLaplacian])

  useEffect(() => {
    drawHistogram(originalHistogramRef.current, originalHistogram)
    drawHistogram(processedHistogramRef.current, processedHistogram)
    drawSingleHistogram(originalGrayHistogramRef.current, originalGrayHistogram, '#e2e8f0')
    drawSingleHistogram(processedGrayHistogramRef.current, processedGrayHistogram, '#e2e8f0')
    drawResponse(originalLaplacianRef.current, originalLaplacian)
    drawResponse(processedLaplacianRef.current, processedLaplacian)
  }, [originalHistogram, processedHistogram, originalGrayHistogram, processedGrayHistogram, originalLaplacian, processedLaplacian, showHistogram, showLaplacian])

  const presetOptions = Object.keys(presets[algorithm])

  const applyPreset = (presetName: string) => {
    const values = presets[algorithm][presetName]
    if (!values) return

    setSelectedPreset(presetName)

    if ('kernelSize' in values && typeof values.kernelSize === 'number') setKernelSize(values.kernelSize)
    if ('sigma' in values && typeof values.sigma === 'number') setSigma(values.sigma)
    if ('amount' in values && typeof values.amount === 'number') setAmount(values.amount)
    if ('alpha' in values && typeof values.alpha === 'number') setAlpha(values.alpha)
    if ('boost' in values && typeof values.boost === 'number') setBoost(values.boost)

    setStatus(`Preset applied: ${presetName}`)
    setError('')
  }

  async function resolveFileFromUrl(url: string, label: string): Promise<File> {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], `${label}.jpg`, { type: blob.type || 'image/jpeg' })
  }

  const handleImageSelection = async (file: File | null) => {
    if (!file) return

    const nextPreviewUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(nextPreviewUrl)
    setProcessedUrl('')
    setProcessedInfo(null)
    setProcessingTime(null)
    setAlgorithmResults([])
    setError('')
    setStatus(`Selected: ${file.name}`)

    try {
      const metrics = await readImageMetrics(nextPreviewUrl, file)
      setOriginalInfo(metrics)
    } catch {
      setOriginalInfo(null)
    }
  }

  const handleSampleSelect = async (src: string, label: string) => {
    setStatus(`Using sample image: ${label}`)
    const imageFile = await resolveFileFromUrl(src, label)
    await handleImageSelection(imageFile)
  }

  const processWithAlgorithm = async (file: File, algorithmKey: AlgorithmKey, values: ParameterValues) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('algorithm', algorithmKey)
    formData.append('kernel_size', String(values.kernelSize))
    formData.append('sigma', String(values.sigma))
    formData.append('amount', String(values.amount))
    formData.append('alpha', String(values.alpha))
    formData.append('boost', String(values.boost))

    const response = await fetch(`${API_BASE_URL}/process`, { method: 'POST', body: formData })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || `${formatAlgorithmName(algorithmKey)} failed.`)

    const downloadResponse = await fetch(`${API_BASE_URL}/download?path=${encodeURIComponent(payload.output_file)}`)
    if (!downloadResponse.ok) throw new Error('The server could not provide the processed result file.')
    const blob = await downloadResponse.blob()
    return {
      imageUrl: URL.createObjectURL(blob),
      processingTime: Number(payload.processing_time_ms) || 0,
      blob,
    }
  }

  const currentParameters = (): ParameterValues => ({ kernelSize, sigma, amount, alpha, boost })

  const handleProcess = async () => {
    setIsProcessing(true)
    setError('')
    setStatus('Processing image...')

    try {
      const file = selectedFile ?? (await resolveFileFromUrl(sampleImages[0].src, sampleImages[0].label))
      const values = currentParameters()
      const originalUrl = selectedFile ? previewUrl : URL.createObjectURL(file)
      const result = await processWithAlgorithm(file, algorithm, values)
      setProcessedUrl(result.imageUrl)
      setProcessingTime(result.processingTime)
      setAlgorithmResults([])
      setStatus(`Processed successfully using ${algorithm}.`)

      const processedFile = new File([result.blob], `processed-${Date.now()}.png`, { type: result.blob.type || 'image/png' })
      const [sourceMetrics, metrics] = await Promise.all([
        readImageMetrics(originalUrl, file),
        readImageMetrics(result.imageUrl, processedFile),
      ])
      if (!selectedFile) {
        setSelectedFile(file)
        setPreviewUrl(originalUrl)
      }
      setOriginalInfo(sourceMetrics)
      setProcessedInfo(metrics)

      const nextEntry: HistoryItem = {
        id: Date.now(),
        operation: formatAlgorithmName(algorithm),
        params: parameterSummary(algorithm, values),
        summary: `${metrics.width}×${metrics.height}px • ${metrics.format}`,
        originalUrl,
        originalFile: file,
        processedUrl: result.imageUrl,
        algorithm,
        values,
        processingTime: result.processingTime,
        originalInfo: sourceMetrics,
        processedInfo: metrics,
      }
      setHistory((previous) => [nextEntry, ...previous].slice(0, 6))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unexpected processing error')
      setStatus('Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAlgorithmComparison = async () => {
    setIsComparingAlgorithms(true)
    setError('')
    setStatus('Comparing all three algorithms...')
    try {
      const file = selectedFile ?? (await resolveFileFromUrl(sampleImages[0].src, sampleImages[0].label))
      const values = currentParameters()
      const keys: AlgorithmKey[] = ['unsharp', 'laplacian', 'highboost']
      const results = await Promise.all(keys.map(async (algorithmKey) => {
        const result = await processWithAlgorithm(file, algorithmKey, values)
        return {
          algorithm: algorithmKey,
          imageUrl: result.imageUrl,
          processingTime: result.processingTime,
          parameters: parameterSummary(algorithmKey, values),
        }
      }))
      setAlgorithmResults(results)
      setStatus('Three-algorithm comparison completed.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Algorithm comparison failed.')
      setStatus('Algorithm comparison failed')
    } finally {
      setIsComparingAlgorithms(false)
    }
  }

  const restoreHistoryItem = (item: HistoryItem) => {
    setSelectedFile(item.originalFile)
    setPreviewUrl(item.originalUrl)
    setProcessedUrl(item.processedUrl)
    setAlgorithm(item.algorithm)
    setKernelSize(item.values.kernelSize)
    setSigma(item.values.sigma)
    setAmount(item.values.amount)
    setAlpha(item.values.alpha)
    setBoost(item.values.boost)
    setSelectedPreset('')
    setProcessingTime(item.processingTime)
    setOriginalInfo(item.originalInfo)
    setProcessedInfo(item.processedInfo)
    setAlgorithmResults([])
    setComparisonOffset(55)
    setStatus(`Restored ${item.operation} from session history.`)
    setError('')
  }

  const clearHistory = () => {
    if (history.length && !window.confirm('Clear all session history entries? Current images will remain unchanged.')) return
    setHistory([])
  }

  const handleDownload = async () => {
    if (!processedUrl) {
      setError('Generate a processed result before downloading.')
      return
    }

    try {
      const image = await loadImage(processedUrl)
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image export is not available in this browser.')
      if (downloadFormat === 'jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      context.drawImage(image, 0, 0)
      const mimeType = `image/${downloadFormat}`
      const exportedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed.')), mimeType, 0.92)
      })
      if (exportedBlob.type !== mimeType) throw new Error(`${downloadFormat.toUpperCase()} export is not supported by this browser.`)
      const downloadUrl = URL.createObjectURL(exportedBlob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = `sharpened-${algorithm}.${downloadFormat === 'jpeg' ? 'jpg' : downloadFormat}`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      setStatus('Download started successfully.')
      setError('')
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'The processed image could not be exported. Please try again.')
    }
  }

  const handleReset = () => {
    setProcessedUrl('')
    setProcessedInfo(null)
    setProcessingTime(null)
    setAlgorithmResults([])
    setKernelSize(5)
    setSigma(1.2)
    setAmount(1.8)
    setAlpha(1.0)
    setBoost(1.5)
    setAlgorithm('unsharp')
    setSelectedPreset('Balanced')
    setComparisonOffset(55)
    setStatus('Original restored with default parameters')
    setError('')
  }

  const outputSummary = processedInfo ? `${processedInfo.width} × ${processedInfo.height}px • ${processedInfo.format}` : 'Awaiting processed output'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">S</div>
          <div>
            <div className="eyebrow">Digital Image Processing</div>
            <div className="brand-name">SharpLab</div>
          </div>
        </div>

        <nav className="nav">
          <a href="#features">Algorithms</a>
          <a href="#workspace">Workspace</a>
          <a href="#results">Results</a>
          <a href="#about">About</a>
        </nav>

        <button className="primary-button compact" type="button" onClick={() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })}>
          Start sharpening
          <ArrowRight size={18} />
        </button>
      </header>

      <main>
        <section className="hero section-spacing">
          <div className="hero-copy">
            <span className="pill">SharpLab — Image Sharpening Studio</span>
            <h1>Bring out edges, detail, and clarity with scientific sharpening.</h1>
            <p>
              Explore unsharp masking, Laplacian filtering, and high-boost processing in a polished
              workspace designed for visual comparison, parameter tuning, and downloadable results.
            </p>

            <div className="cta-row">
              <button className="primary-button" type="button" onClick={handleProcess}>
                Start Sharpening
                <ArrowRight size={18} />
              </button>
              <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>
                Upload image
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              hidden
              onChange={(event) => handleImageSelection(event.target.files?.[0] ?? null)}
            />

            <div className="trust-row">
              <span>
                <ShieldCheck size={14} /> Guest mode available
              </span>
              <span>
                <UploadCloud size={14} /> PNG, JPG, JPEG, WebP
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card before-card">
              <div className="visual-image soft-bg" />
              <span>Original</span>
            </div>
            <div className="visual-card after-card">
              <div className="visual-image sharp-bg" />
              <span>Sharpened</span>
            </div>
          </div>
        </section>

        <section className="section-spacing" id="features">
          <div className="section-heading">
            <span className="mini-label">Core methods</span>
            <h2>Three proven sharpening approaches.</h2>
          </div>

          <div className="feature-grid">
            {algorithms.map(({ name, icon: Icon, description, accent }) => (
              <article key={name} className={`feature-card ${accent}`}>
                <div className="feature-icon">
                  <Icon size={20} />
                </div>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-spacing how-it-works" id="about">
          <div className="section-heading align-left">
            <span className="mini-label">Workflow</span>
            <h2>How the sharpening studio works.</h2>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <div key={step} className="process-card">
                <span className="step-badge">0{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-spacing workspace" id="workspace">
          <div className="section-heading align-left">
            <span className="mini-label">Workspace</span>
            <h2>Upload, tune, compare, and export.</h2>
          </div>

          <div className="workspace-grid">
            <div className="upload-panel panel">
              <div className="upload-box">
                <UploadCloud size={34} />
                <strong>Drag and drop an image</strong>
                <span>PNG, JPG, JPEG, or WEBP</span>
                <button className="primary-button small" type="button" onClick={() => inputRef.current?.click()}>
                  Browse Image
                </button>
              </div>

              <div className="sample-list">
                <span className="sample-label">Sample images</span>
                <div className="sample-row">
                  {sampleImages.map(({ label, src }) => (
                    <button key={label} className="sample-item" type="button" onClick={() => void handleSampleSelect(src, label)}>
                      <img src={src} alt={label} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="controls-panel panel">
              <div className="panel-head">
                <span className="mini-label">Algorithm controls</span>
                <Wand2 size={18} />
              </div>

              <div className="control-group">
                <label htmlFor="method" className="help-label-wrap">
                  Sharpening method
                  <span className="help-badge" title={algorithmTips[algorithm].summary + ' ' + algorithmTips[algorithm].details}>
                    <Info size={14} />
                  </span>
                </label>
                <select id="method" value={algorithm} onChange={(event) => { setAlgorithm(event.target.value as AlgorithmKey); setSelectedPreset('') }}>
                  <option value="unsharp">Unsharp Masking</option>
                  <option value="laplacian">Laplacian Filtering</option>
                  <option value="highboost">High-Boost Filtering</option>
                </select>
              </div>

              <div className="preset-row">
                {presetOptions.map((presetName) => (
                  <button
                    key={presetName}
                    type="button"
                    className={`preset-button ${selectedPreset === presetName ? 'active' : ''}`}
                    onClick={() => applyPreset(presetName)}
                  >
                    {presetName}
                  </button>
                ))}
              </div>

              <div className="slider-group">
                <label className="help-label-wrap">
                  Kernel size
                  <span className="help-badge" title="Odd kernel sizes work best. Larger values support more aggressive sharpening and can increase detail contrast.">
                    <Info size={14} />
                  </span>
                </label>
                <input type="range" min="3" max="21" step="2" value={kernelSize} onChange={(event) => setKernelSize(Number(event.target.value))} />
                <small>{kernelSize}</small>
              </div>

              <div className="slider-group">
                <label className="help-label-wrap">
                  Sigma / blur strength
                  <span className="help-badge" title="A higher sigma spreads the blur more strongly before detail is emphasized.">
                    <Info size={14} />
                  </span>
                </label>
                <input type="range" min="0.5" max="4" step="0.1" value={sigma} onChange={(event) => setSigma(Number(event.target.value))} />
                <small>{sigma.toFixed(1)}</small>
              </div>

              <div className="slider-group">
                <label className="help-label-wrap">
                  Sharpening amount
                  <span className="help-badge" title="This increases how much the edge detail is added back into the image.">
                    <Info size={14} />
                  </span>
                </label>
                <input type="range" min="0.5" max="5" step="0.1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
                <small>{amount.toFixed(1)}</small>
              </div>

              {algorithm !== 'unsharp' && (
                <div className="slider-group">
                  <label className="help-label-wrap">
                    {algorithm === 'laplacian' ? 'Laplacian alpha' : 'High-boost factor'}
                    <span className="help-badge" title={algorithm === 'laplacian' ? 'Higher alpha values intensify the Laplacian response and can create stronger edge emphasis.' : 'Higher boost values increase the local detail strength while preserving the original image base.'}>
                      <Info size={14} />
                    </span>
                  </label>
                  <input
                    type="range"
                    min={algorithm === 'laplacian' ? '0.2' : '1'}
                    max={algorithm === 'laplacian' ? '5' : '3'}
                    step={0.1}
                    value={algorithm === 'laplacian' ? alpha : boost}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      if (algorithm === 'laplacian') setAlpha(nextValue)
                      else setBoost(nextValue)
                    }}
                  />
                  <small>{(algorithm === 'laplacian' ? alpha : boost).toFixed(1)}</small>
                </div>
              )}

              <div className="action-row">
                <button className="primary-button small" type="button" onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? 'Processing…' : 'Preview'}
                </button>
                <button
                  className="secondary-button small"
                  type="button"
                  onClick={() => applyPreset('Balanced')}
                >
                  Reset
                </button>
              </div>
              <label className="optional-toggle">
                <input type="checkbox" checked={showAlgorithmComparison} onChange={(event) => setShowAlgorithmComparison(event.target.checked)} />
                Compare all three algorithms
              </label>
              {showAlgorithmComparison && (
                <button className="secondary-button small" type="button" onClick={handleAlgorithmComparison} disabled={isComparingAlgorithms}>
                  {isComparingAlgorithms ? 'Comparing…' : 'Run three-algorithm comparison'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="section-spacing results" id="results">
          <div className="section-heading align-left">
            <span className="mini-label">Evaluation</span>
            <h2>Original vs sharpened output.</h2>
          </div>

          <div className={`result-grid ${comparisonView === 'slider' ? 'slider-layout' : 'separate-layout'}`}>
            {comparisonView === 'separate' && (
              <div className="result-card panel">
                <img className="result-image contained-image" src={previewUrl} alt="Original image preview" />
                <div className="result-meta">
                  <span>Original</span>
                  <strong>{originalInfo ? `${originalInfo.width} × ${originalInfo.height}px` : 'Sample image'}</strong>
                </div>
              </div>
            )}

            {comparisonView === 'slider' && (
              <div className="compare-slider panel">
                <div
                  className="compare-stage"
                  style={{
                    aspectRatio: originalInfo ? `${originalInfo.width} / ${originalInfo.height}` : '16 / 9',
                    width: originalInfo ? `min(100%, ${Math.round(380 * originalInfo.width / originalInfo.height)}px)` : 'min(100%, 676px)',
                  }}
                >
                  <img className="compare-layer original-layer" src={previewUrl} alt="Original image" />
                  <img
                    className="compare-layer processed-layer"
                    src={processedUrl || previewUrl}
                    alt="Processed image"
                    style={{ clipPath: `inset(0 ${100 - comparisonOffset}% 0 0)` }}
                  />
                  <div className="compare-divider" style={{ left: `${comparisonOffset}%` }}>
                    <span className="compare-handle"><SlidersHorizontal size={16} /></span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonOffset}
                    onChange={(event) => setComparisonOffset(Number(event.target.value))}
                    className="compare-range"
                    aria-label="Comparison slider"
                    disabled={!processedUrl}
                  />
                  {!processedUrl && <span className="compare-placeholder">Process an image to compare</span>}
                </div>
              </div>
            )}

            {comparisonView === 'separate' && (
              <div className="result-card panel">
                {processedUrl ? <img className="result-image contained-image" src={processedUrl} alt="Processed image preview" /> : <div className="result-image empty-result">Awaiting preview</div>}
                <div className="result-meta">
                  <span>Processed</span>
                  <strong>{processedInfo ? `${processedInfo.width} × ${processedInfo.height}px` : 'Awaiting preview'}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="comparison-toolbar">
            <span>Preview mode</span>
            <div className="segmented-control" role="group" aria-label="Preview mode">
              <button type="button" className={comparisonView === 'slider' ? 'active' : ''} onClick={() => setComparisonView('slider')}>Slider</button>
              <button type="button" className={comparisonView === 'separate' ? 'active' : ''} onClick={() => setComparisonView('separate')}>Separate</button>
            </div>
          </div>

          <div className="analysis-panel panel explanation-panel">
            <button className="analysis-toggle" type="button" onClick={() => setShowExplanation((previous) => !previous)} aria-expanded={showExplanation}>
              <Info size={16} />
              {showExplanation ? 'Hide explanation' : 'Explain This Result'}
            </button>
            {showExplanation && (
              <div className="explanation-content">
                <h3>{algorithmTips[algorithm].heading}</h3>
                <p>{algorithmTips[algorithm].summary} {algorithmTips[algorithm].details}</p>
                <div className="formula-block">
                  {algorithm === 'laplacian' ? 'g(x,y) = f(x,y) + α∇²f(x,y)' : algorithm === 'highboost' ? 'g(x,y) = f(x,y) + (A − 1)[f(x,y) − blur(f)]' : 'g(x,y) = f(x,y) + k[f(x,y) − blur(f)]'}
                </div>
                <p><strong>Current parameters:</strong> {parameterSummary(algorithm, currentParameters())}.</p>
                <p className="helper-text">Strong sharpening can amplify image noise and may create bright or dark edge halos. Results depend on the source image; a larger parameter value is not always perceptually better.</p>
              </div>
            )}
          </div>

          <div className="info-grid">
            <div className="info-card panel">
              <div className="panel-head compact">
                <span className="mini-label">Image details</span>
                <BarChart3 size={16} />
              </div>
              <div className="detail-list">
                <div><span>Original</span><strong>{originalInfo ? `${originalInfo.width} × ${originalInfo.height}px` : '—'}</strong></div>
                <div><span>Processed</span><strong>{processedInfo ? `${processedInfo.width} × ${processedInfo.height}px` : '—'}</strong></div>
                <div><span>Format</span><strong>{processedInfo?.format || originalInfo?.format || '—'}</strong></div>
                <div><span>File size</span><strong>{processedInfo?.fileSize || originalInfo?.fileSize || '—'}</strong></div>
                <div><span>Channels</span><strong>{processedInfo?.channels ? `${processedInfo.channels}-channel` : originalInfo?.channels ? `${originalInfo.channels}-channel` : '—'}</strong></div>
                <div><span>Processing time</span><strong>{processingTime ? `${processingTime} ms` : '—'}</strong></div>
              </div>
            </div>

            <div className="info-card panel">
              <div className="panel-head compact">
                <span className="mini-label">Session history</span>
                <History size={16} />
              </div>
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="helper-text">No saved operations yet. Process an image to begin the session history.</p>
                ) : (
                  history.map((item) => (
                    <button key={item.id} type="button" className="history-item" onClick={() => restoreHistoryItem(item)}>
                      <strong>{item.operation}</strong>
                      <span>{item.params}</span>
                      <small>{item.summary} • {item.processingTime} ms</small>
                    </button>
                  ))
                )}
              </div>
              {history.length > 0 && <button className="text-button" type="button" onClick={clearHistory}>Clear history</button>}
            </div>
          </div>

          <div className="analysis-panel panel">
            <button className="analysis-toggle" type="button" onClick={() => setShowHistogram((previous) => !previous)}>
              <BarChart3 size={16} />
              {showHistogram ? 'Hide histogram' : 'Show histogram analysis'}
            </button>
            {showHistogram && (
              <div className="histogram-grid">
                <div className="histogram-card">
                  <div className="histogram-header">
                    <span>Original</span>
                    <strong>RGB intensity</strong>
                  </div>
                  <canvas ref={originalHistogramRef} className="histogram-canvas" />
                </div>
                <div className="histogram-card">
                  <div className="histogram-header">
                    <span>Processed</span>
                    <strong>RGB intensity</strong>
                  </div>
                  <canvas ref={processedHistogramRef} className="histogram-canvas" />
                </div>
                <div className="histogram-card">
                  <div className="histogram-header"><span>Original</span><strong>Grayscale intensity</strong></div>
                  <canvas ref={originalGrayHistogramRef} className="histogram-canvas" />
                </div>
                <div className="histogram-card">
                  <div className="histogram-header"><span>Processed</span><strong>Grayscale intensity</strong></div>
                  <canvas ref={processedGrayHistogramRef} className="histogram-canvas" />
                </div>
              </div>
            )}
            <button className="analysis-toggle secondary-analysis-toggle" type="button" onClick={() => setShowLaplacian((previous) => !previous)} aria-expanded={showLaplacian}>
              <Layers3 size={16} /> {showLaplacian ? 'Hide Laplacian response' : 'Show Laplacian response'}
            </button>
            {showLaplacian && (
              <div className="laplacian-grid">
                <div className="histogram-card"><div className="histogram-header"><span>Original</span><strong>Edge response</strong></div><canvas ref={originalLaplacianRef} className="laplacian-canvas" /></div>
                <div className="histogram-card"><div className="histogram-header"><span>Processed</span><strong>Edge response</strong></div>{processedUrl ? <canvas ref={processedLaplacianRef} className="laplacian-canvas" /> : <p className="helper-text">Process an image to view its response.</p>}</div>
                <p className="helper-text analysis-note">Laplacian response visualizes local second-derivative edge strength from the displayed image. It is an analysis view, not a quality score.</p>
              </div>
            )}
            <p className="helper-text analysis-note">RGB and grayscale histograms count pixel intensities in each channel. They describe tonal distribution, not perceptual quality; a broader or higher histogram is not inherently better.</p>
          </div>

          {algorithmResults.length > 0 && (
            <div className="algorithm-comparison-section">
              <div className="section-heading align-left">
                <span className="mini-label">Algorithm comparison</span>
                <h3>Same source, three genuine outputs</h3>
              </div>
              <div className="algorithm-result-grid">
                {algorithmResults.map((result) => (
                  <article className="algorithm-result panel" key={result.algorithm}>
                    <img src={result.imageUrl} alt={`${formatAlgorithmName(result.algorithm)} output`} />
                    <h4>{formatAlgorithmName(result.algorithm)}</h4>
                    <p>{result.parameters}</p>
                    <small>Algorithm processing: {result.processingTime} ms</small>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="metrics-grid">
            <div className="metric-card">
              <span>Processing time</span>
              <strong>{processingTime !== null ? `${processingTime} ms` : isProcessing ? 'In progress' : '—'}</strong>
            </div>
            <div className="metric-card">
              <span>Method</span>
              <strong>{currentMethod ? currentMethod.name : 'Unsharp Masking'}</strong>
            </div>
            <div className="metric-card">
              <span>Kernel</span>
              <strong>{kernelSize}</strong>
            </div>
            <div className="metric-card">
              <span>Status</span>
              <strong>{status}</strong>
            </div>
          </div>

          <div className="download-row">
            <label className="format-select-label" htmlFor="download-format">Format</label>
            <select id="download-format" className="format-select" value={downloadFormat} onChange={(event) => setDownloadFormat(event.target.value as 'png' | 'jpeg' | 'webp')}>
              <option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option>
            </select>
            <button className="primary-button" type="button" onClick={handleDownload} disabled={!processedUrl}>
              <Download size={18} /> Download processed image
            </button>
            <button className="secondary-button" type="button" onClick={handleReset}>
              <RotateCcw size={18} /> Reset to original
            </button>
          </div>

          <div className="download-summary">
            <CheckCircle2 size={15} />
            <span>{outputSummary}</span>
          </div>

          {error && <p className="error-banner">{error}</p>}
        </section>
      </main>
      <footer className="site-footer">
        <span>SharpLab</span>
        <p>Developed by <strong>G. Pavani</strong></p>
      </footer>
    </div>
  )
}

export default App

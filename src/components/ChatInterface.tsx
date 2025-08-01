import { useState, useRef } from 'react'
import { Send, Download } from 'lucide-react'
import { AgentService } from '../services/agentService'
import MermaidRenderer, { MermaidRendererRef } from './MermaidRenderer'
import { cn } from '../lib/utils'

export default function ChatInterface() {
  const [ytUrl, setYtUrl] = useState('')
  const [mermaidDiagram, setMermaidDiagram] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const mermaidRef = useRef<MermaidRendererRef>(null)

  const isButtonDisabled = isLoading || !ytUrl.trim()

  const handleDownload = () => {
    if (mermaidRef.current) {
      const filename = `youtube-diagram-${Date.now()}.png`
      mermaidRef.current.downloadAsPNG(filename)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ytUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/
    if (!youtubeRegex.test(ytUrl.trim())) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setIsLoading(true)
    setError('')
    setMermaidDiagram('')

    try {
      const result = await AgentService.processYouTubeUrl(ytUrl)
      setMermaidDiagram(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className="text-slate-400 text-sm">Powered by</div>
            <img src={`${import.meta.env.BASE_URL}logo_everworker.svg`} alt="Everworker" className="h-8 opacity-100 contrast-125" />
          </div>
        </div>

        {/* Main Chat Card */}
        <div className="cyber-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter YouTube URL to generate diagram..."
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                disabled={isLoading}
                className={cn(
                  "cyber-input flex-1",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              />
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={cn(
                  "cyber-button flex items-center gap-2 shrink-0",
                  isButtonDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Diagram
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {/* Mermaid Diagram Display */}
          {mermaidDiagram && (
            <div className="mt-8">
              <div className="border-t border-slate-700/50 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-cyber-blue">Generated Diagram</h3>
                    <p className="text-slate-400 text-sm">Mermaid diagram generated from your YouTube video</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="cyber-button flex items-center gap-2 text-sm px-4 py-2"
                    title="Download diagram as PNG"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                </div>
                <MermaidRenderer 
                  ref={mermaidRef}
                  chart={mermaidDiagram} 
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
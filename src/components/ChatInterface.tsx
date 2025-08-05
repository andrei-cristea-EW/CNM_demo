import { useState, useRef } from 'react'
import { Send, Download, ExternalLink } from 'lucide-react'
import { AgentService } from '../services/agentService'
import MermaidRenderer, { MermaidRendererRef } from './MermaidRenderer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../lib/utils'

export default function ChatInterface() {
  const [ytUrl, setYtUrl] = useState('')
  const [mermaidDiagram, setMermaidDiagram] = useState('')
  const [description, setDescription] = useState('')
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

  const generateDrawIOUrl = (mermaidContent: string): string => {
    try {
      // Create the correct JSON payload for draw.io Mermaid import
      const payload = {
        type: "mermaid",
        data: mermaidContent.trim()
      }
      
      // Convert to JSON string and encode
      const jsonString = JSON.stringify(payload)
      const encodedPayload = encodeURIComponent(jsonString)
      
      // Generate the draw.io URL - using app.diagrams.net as specified in docs
      const drawioUrl = `https://app.diagrams.net/?create=${encodedPayload}`
      
      // Check if URL is too long (browser limits ~2048 chars for some browsers)
      if (drawioUrl.length > 2000) {
        throw new Error('Diagram too large for URL parameter')
      }
      
      return drawioUrl
    } catch (error) {
      console.error('Error generating draw.io URL:', error)
      throw error
    }
  }

  const handleOpenInDrawIO = () => {
    try {
      const drawioUrl = generateDrawIOUrl(mermaidDiagram)
      window.open(drawioUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setError('Unable to open in draw.io: Diagram may be too large')
      console.error('Draw.io integration error:', error)
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
    setDescription('')

    try {
      const result = await AgentService.processYouTubeUrl(ytUrl)
      setMermaidDiagram(result.mermaid)
      setDescription(result.description)
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenInDrawIO}
                      className="cyber-button flex items-center gap-2 text-sm px-4 py-2"
                      title="Open diagram in draw.io for editing"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Edit in draw.io
                    </button>
                    <button
                      onClick={handleDownload}
                      className="cyber-button flex items-center gap-2 text-sm px-4 py-2"
                      title="Download diagram as PNG"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG
                    </button>
                  </div>
                </div>
                <MermaidRenderer 
                  ref={mermaidRef}
                  chart={mermaidDiagram} 
                  className="w-full"
                />
                
                {/* Process Description */}
                {description && (
                  <div className="mt-6 border-t border-slate-700/50 pt-6">
                    <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-6">
                      <div className="prose prose-invert prose-slate max-w-none text-slate-200">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({children}) => <h1 className="text-xl font-bold text-cyber-purple mb-4">{children}</h1>,
                            h2: ({children}) => <h2 className="text-lg font-semibold text-cyber-blue mb-3">{children}</h2>,
                            h3: ({children}) => <h3 className="text-md font-medium text-cyber-pink mb-2">{children}</h3>,
                            p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                            ul: ({children}) => <ul className="list-disc list-outside mb-4 space-y-1 ml-4">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-outside mb-4 space-y-1 ml-4">{children}</ol>,
                            li: ({children}) => <li className="text-slate-300">{children}</li>,
                            code: ({children}) => <code className="bg-slate-700/50 px-2 py-1 rounded text-cyber-green font-mono text-sm">{children}</code>,
                            pre: ({children}) => <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto mb-4 border border-slate-700/30">{children}</pre>,
                            blockquote: ({children}) => <blockquote className="border-l-4 border-cyber-purple pl-4 italic text-slate-400 mb-4">{children}</blockquote>,
                            strong: ({children}) => <strong className="text-cyber-blue font-semibold">{children}</strong>,
                            em: ({children}) => <em className="text-cyber-pink italic">{children}</em>,
                          }}
                        >
                          {description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
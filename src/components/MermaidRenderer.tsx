import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

export interface MermaidRendererRef {
  downloadAsPNG: (filename?: string) => void;
}

const MermaidRenderer = forwardRef<MermaidRendererRef, MermaidRendererProps>(({ chart, className = '' }, ref) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  const downloadAsPNG = (filename: string = 'mermaid-diagram.png') => {
    if (!mermaidRef.current) return;

    const svgElement = mermaidRef.current.querySelector('svg');
    if (!svgElement) return;

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgElement.viewBox?.baseVal?.width || svgRect.width;
    const svgHeight = svgElement.viewBox?.baseVal?.height || svgRect.height;

    // Set explicit dimensions on the cloned SVG
    svgClone.setAttribute('width', svgWidth.toString());
    svgClone.setAttribute('height', svgHeight.toString());

    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions with some padding
    const padding = 40;
    const scale = 2; // For better quality
    canvas.width = (svgWidth + padding * 2) * scale;
    canvas.height = (svgHeight + padding * 2) * scale;

    // Scale the context for high resolution
    ctx.scale(scale, scale);

    // Fill canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, svgWidth + padding * 2, svgHeight + padding * 2);

    // Convert SVG to data URL with embedded styles
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

    // Create image and draw to canvas
    const img = new Image();
    img.crossOrigin = 'anonymous'; // This helps prevent CORS issues
    img.onload = () => {
      try {
        ctx.drawImage(img, padding, padding, svgWidth, svgHeight);
        
        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
          }
        }, 'image/png');
      } catch (error) {
        console.error('Error converting to PNG:', error);
        // Fallback: download as SVG
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const downloadUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename.replace('.png', '.svg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }
    };
    
    img.onerror = () => {
      console.error('Error loading SVG as image');
      // Fallback: download as SVG
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const downloadUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename.replace('.png', '.svg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    };
    
    img.src = svgDataUrl;
  };

  useImperativeHandle(ref, () => ({
    downloadAsPNG
  }));

  useEffect(() => {
    // Initialize mermaid with cyber theme colors
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#8B5CF6',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#0EA5E9',
        lineColor: '#EC4899',
        secondaryColor: '#10B981',
        tertiaryColor: '#1e293b',
        background: '#0f172a',
        mainBkg: '#1e293b',
        secondBkg: '#334155',
        tertiaryBkg: '#475569',
      }
    });

    const renderChart = async () => {
      if (mermaidRef.current && chart.trim()) {
        console.log('Mermaid diagram syntax:', chart);
        try {
          // Clear previous content
          mermaidRef.current.innerHTML = '';
          
          // Generate unique ID for this chart
          const id = `mermaid-${Date.now()}`;
          
          // Render the chart
          const { svg } = await mermaid.render(id, chart);
          
          // Insert the rendered SVG
          mermaidRef.current.innerHTML = svg;
          
          // Style the SVG to fit within the container
          const svgElement = mermaidRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.backgroundColor = 'transparent';
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          mermaidRef.current.innerHTML = `
            <div class="text-red-400 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <h3 class="font-semibold mb-2">Error rendering diagram</h3>
              <p class="text-sm">Unable to render the mermaid diagram. Please check the syntax.</p>
              <details class="mt-2">
                <summary class="cursor-pointer text-xs opacity-70">Show error details</summary>
                <pre class="text-xs mt-1 opacity-70">${error}</pre>
              </details>
            </div>
          `;
        }
      }
    };

    renderChart();
  }, [chart]);

  if (!chart.trim()) {
    return null;
  }

  return (
    <div className={`mermaid-container ${className}`}>
      <div 
        ref={mermaidRef} 
        className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-6 overflow-auto"
      />
    </div>
  );
});

MermaidRenderer.displayName = 'MermaidRenderer';

export default MermaidRenderer;
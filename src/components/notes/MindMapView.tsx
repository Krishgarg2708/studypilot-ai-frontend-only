import { MermaidDiagram } from "@/components/common/MermaidDiagram"

interface MindMapViewProps {
  mermaidSource: string
}

/** Renders a Smart Notes mind map as an actual diagram instead of raw Mermaid syntax. */
export function MindMapView({ mermaidSource }: MindMapViewProps) {
  if (!mermaidSource?.trim()) return null
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <MermaidDiagram chart={mermaidSource} />
    </div>
  )
}

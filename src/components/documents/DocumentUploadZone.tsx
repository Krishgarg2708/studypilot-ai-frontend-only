import { Upload, Loader2 } from "lucide-react"

interface DocumentUploadZoneProps {
  uploading: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/** Drag-friendly file upload control for PDF Chat. Accepts PDF, DOCX, TXT, and images
 * (the same set the backend's extraction pipeline supports, including OCR for scans). */
export function DocumentUploadZone({ uploading, onUpload }: DocumentUploadZoneProps) {
  return (
    <label className="cursor-pointer">
      <input
        type="file"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
        className="hidden"
        onChange={onUpload}
        disabled={uploading}
      />
      <div className="glass-panel rounded-xl p-4 border-dashed border-2 border-border/60 hover:border-primary/50 transition-colors text-center">
        {uploading ? (
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
        ) : (
          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
        )}
        <p className="text-sm font-medium mt-2">{uploading ? "Uploading…" : "Upload document"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX, TXT, or image</p>
      </div>
    </label>
  )
}

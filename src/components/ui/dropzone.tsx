import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, FileAudio } from "lucide-react"

interface DropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  onDrop?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

export function Dropzone({
  onDrop,
  accept,
  multiple = false,
  disabled = false,
  className,
  children,
  ...props
}: DropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (onDrop) {
      onDrop(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (onDrop && files.length > 0) {
      onDrop(files)
    }
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {children || (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Solte os arquivos aqui" : "Adicione ou largue os seus ficheiros áudio"}
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: 32 MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}


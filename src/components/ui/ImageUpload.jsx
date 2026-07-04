import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

export default function ImageUpload({ onFile, accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxSize = 5 * 1024 * 1024 }) {
  const onDrop = useCallback(
    (files) => {
      if (files?.[0]) onFile?.(files[0])
    },
    [onFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize,
    accept,
  })

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--admin-radius-card)] border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] p-8 text-center transition-colors ${
        isDragActive ? 'border-[var(--admin-accent)] bg-[#6366f1]/5' : 'hover:border-[var(--admin-text-muted)]'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 h-10 w-10 text-[var(--admin-text-muted)]" />
      <p className="text-sm text-[var(--admin-text-muted)]">Drop an image or click to browse</p>
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getCroppedImg } from "@/lib/canvasUtils"
import { Loader2, Upload, X, ZoomIn, ZoomOut } from "lucide-react"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
  shape?: "round" | "rect"
  aspect?: number
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  shape = "rect",
  aspect = 1,
  label
}: ImageUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const imageDataUrl = await readFile(file)
      setImageSrc(imageDataUrl as string)
      setIsOpen(true)
      // Reset input value to allow selecting same file again
      e.target.value = ""
    }
  }

  const readFile = (file: File) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.addEventListener("load", () => resolve(reader.result), false)
      reader.readAsDataURL(file)
    })
  }

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    try {
      setIsLoading(true)
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      if (!croppedImageBlob) {
        throw new Error("Failed to crop image")
      }

      const formData = new FormData()
      formData.append("file", croppedImageBlob, "image.jpg")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onChange(data.url)
      setIsOpen(false)
      setImageSrc(null)
    } catch (error) {
      console.error("Upload error:", error)
      // Ideally show toast error here
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setImageSrc(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {shape === "round" ? (
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={value} />
            <AvatarFallback className="text-muted-foreground text-xs">No Image</AvatarFallback>
          </Avatar>
        ) : (
          <div className="relative h-40 w-full overflow-hidden rounded-md border border-border bg-muted">
             {value ? (
               <Image 
                 src={value} 
                 alt="Cover" 
                 fill 
                 className="object-cover"
               />
             ) : (
               <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                 No Image
               </div>
             )}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          <Button 
            variant="outline" 
            disabled={disabled || isLoading}
            onClick={() => document.getElementById(`file-input-${label || shape}`)?.click()}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Image
          </Button>
          <input
            id={`file-input-${label || shape}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={disabled || isLoading}
          />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          
          <div className="relative h-[400px] w-full overflow-hidden rounded-md bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape={shape === "round" ? "round" : "rect"}
                showGrid={false}
              />
            )}
          </div>

          <div className="flex items-center gap-2 py-2">
             <ZoomOut className="h-4 w-4 text-muted-foreground" />
             <input
               type="range"
               value={zoom}
               min={1}
               max={3}
               step={0.1}
               aria-labelledby="Zoom"
               onChange={(e) => setZoom(Number(e.target.value))}
               className="flex-1"
             />
             <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

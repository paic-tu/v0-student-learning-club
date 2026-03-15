"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { uploadFileAction } from "@/lib/actions/upload"

interface MediaUploadFieldProps {
  id?: string
  name?: string
  label?: string
  value?: string
  onChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
  helperText?: string
  isAr?: boolean
  type?: "image" | "video"
  disabled?: boolean
}

export function MediaUploadField({
  id,
  name,
  label,
  value: propValue,
  onChange,
  defaultValue = "",
  placeholder,
  helperText,
  isAr = false,
  type = "image",
  disabled
}: MediaUploadFieldProps) {
  const { toast } = useToast()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isControlled = propValue !== undefined
  const value = (isControlled ? propValue : internalValue) ?? ""

  React.useEffect(() => {
    if (!isControlled) {
      setInternalValue(defaultValue)
    }
  }, [defaultValue, isControlled])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0]
      
      // Basic validation
      if (type === "image" && !file.type.startsWith("image/")) {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: isAr ? "يرجى اختيار ملف صورة" : "Please select an image file",
          variant: "destructive"
        })
        return
      }
      if (type === "video" && !file.type.startsWith("video/")) {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: isAr ? "يرجى اختيار ملف فيديو" : "Please select a video file",
          variant: "destructive"
        })
        return
      }

      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      try {
        // Use API route instead of Server Action for better large file handling
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          if (response.status === 401 || response.status === 403) {
            const fallback = await uploadFileAction(formData)
            if (fallback?.success && fallback.url) {
              handleValueChange(fallback.url)
              toast({
                title: isAr ? "تم بنجاح" : "Success",
                description: isAr ? "تم رفع الملف بنجاح" : "File uploaded successfully",
              })
              return
            }
            throw new Error(fallback?.error || errorData.error || `Upload failed with status: ${response.status}`)
          }
          throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
        }

        const result = await response.json()

        if (result.url) {
          handleValueChange(result.url)
          toast({
            title: isAr ? "تم بنجاح" : "Success",
            description: isAr ? "تم رفع الملف بنجاح" : "File uploaded successfully"
          })
        }
      } catch (error: any) {
        console.error("Upload error:", error)
        toast({
          title: isAr ? "خطأ" : "Error",
          description: error.message || (isAr ? "فشل رفع الملف" : "Failed to upload file"),
          variant: "destructive"
        })
      } finally {
        setIsUploading(false)
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
      }
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          className="flex-1"
          disabled={disabled || isUploading}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {isAr ? "رفع" : "Upload"}
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      
      {value && (
        <div className="mt-2 relative rounded-md overflow-hidden border bg-muted w-full max-w-xs">
          {type === "image" ? (
            <div className="aspect-video relative">
              <Image 
                src={value} 
                alt="Preview" 
                fill 
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <>
              {(value.includes("youtube.com") || value.includes("youtu.be") || value.includes("vimeo.com")) ? (
                <iframe
                  src={
                    value.includes("vimeo.com")
                      ? `https://player.vimeo.com/video/${value.split("/").pop()}`
                      : `https://www.youtube.com/embed/${value.includes("v=") ? value.split("v=")[1].split("&")[0] : value.split("/").pop()}`
                  }
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video 
                  src={value} 
                  controls 
                  className="w-full aspect-video"
                />
              )}
            </>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-70 hover:opacity-100"
            onClick={() => handleValueChange("")}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

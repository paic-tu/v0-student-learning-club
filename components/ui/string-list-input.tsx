"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

interface StringListInputProps {
  value: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}

export function StringListInput({ value = [], onChange, placeholder }: StringListInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()])
      setInputValue("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button type="button" onClick={handleAdd} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
            <span>{item}</span>
            <Button 
              type="button" 
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 hover:bg-destructive/10 hover:text-destructive rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

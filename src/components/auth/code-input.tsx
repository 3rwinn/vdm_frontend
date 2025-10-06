import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react"
import { useMemo, useRef } from "react"

import { cn } from "@/lib/utils"

const CODE_LENGTH = 6

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CodeInput({ value, onChange, disabled }: CodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const digits = useMemo(() => {
    const normalized = value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH)
    return Array.from({ length: CODE_LENGTH }, (_, index) => normalized[index] ?? "")
  }, [value])

  const focusInput = (index: number) => {
    const ref = inputRefs.current[index]
    if (ref) {
      ref.focus()
      ref.select()
    }
  }

  const setDigit = (index: number, next: string) => {
    const nextDigits = [...digits]
    nextDigits[index] = next
    onChange(nextDigits.join(""))
  }

  const handleInput = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value.replace(/[^0-9]/g, "")
    if (!inputValue) {
      setDigit(index, "")
      return
    }

    const chars = inputValue.split("")
    const nextDigits = [...digits]
    chars.forEach((char, offset) => {
      const position = index + offset
      if (position < CODE_LENGTH) {
        nextDigits[position] = char
      }
    })
    onChange(nextDigits.join(""))

    const nextIndex = Math.min(index + chars.length, CODE_LENGTH - 1)
    focusInput(nextIndex)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        event.preventDefault()
        setDigit(index, "")
        return
      }

      const previousIndex = Math.max(index - 1, 0)
      focusInput(previousIndex)
      if (!digits[previousIndex]) {
        setDigit(previousIndex, "")
      }
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusInput(Math.max(index - 1, 0))
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusInput(Math.min(index + 1, CODE_LENGTH - 1))
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text").replace(/[^0-9]/g, "")
    if (!text) {
      return
    }
    event.preventDefault()

    const chars = text.split("")
    const nextDigits = [...digits]
    chars.forEach((char, offset) => {
      const position = index + offset
      if (position < CODE_LENGTH) {
        nextDigits[position] = char
      }
    })
    onChange(nextDigits.join(""))

    const nextIndex = Math.min(index + chars.length, CODE_LENGTH - 1)
    focusInput(nextIndex)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(event) => handleInput(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          disabled={disabled}
          className={cn(
            "h-12 w-11 rounded-lg border border-border/70 bg-white text-center text-lg font-semibold tracking-widest text-foreground shadow-sm focus:border-[#026c7a] focus:outline-none focus:ring-2 focus:ring-[#88d0d9]/60",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
      ))}
    </div>
  )
}

export function isCodeComplete(code: string) {
  return code.replace(/[^0-9]/g, "").length === CODE_LENGTH
}

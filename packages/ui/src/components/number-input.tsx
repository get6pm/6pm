'use client'

import { Input } from '@6pm/ui/components/input'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { NumericFormat, type NumericFormatProps } from 'react-number-format'

export interface NumberInputProps
  extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  stepper?: number
  thousandSeparator?: string
  placeholder?: string
  defaultValue?: number
  min?: number
  max?: number
  value?: number // Controlled value
  suffix?: string
  prefix?: string
  fixedDecimalScale?: boolean
  decimalScale?: number
  withStepper?: boolean
}

export const NumberInput = forwardRef<
  HTMLInputElement,
  NumberInputProps & { onChange?: (value: number | undefined) => void }
>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onChange: onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      withStepper,
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useState<number | undefined>(
      controlledValue ?? defaultValue,
    )

    const handleIncrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined
          ? (stepper ?? 1)
          : Math.min(prev + (stepper ?? 1), max),
      )
    }, [stepper, max])

    const handleDecrement = useCallback(() => {
      setValue((prev) =>
        prev === undefined
          ? -(stepper ?? 1)
          : Math.max(prev - (stepper ?? 1), min),
      )
    }, [stepper, min])

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement ===
          (ref as React.RefObject<HTMLInputElement>).current
        ) {
          if (e.key === 'ArrowUp') {
            handleIncrement()
          } else if (e.key === 'ArrowDown') {
            handleDecrement()
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)

      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [handleIncrement, handleDecrement, ref])

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue)
      }
    }, [controlledValue])

    const handleChange = (values: {
      value: string
      floatValue: number | undefined
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue
      setValue(newValue)
      if (onValueChange) {
        onValueChange(newValue)
      }
    }

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min)
          ;(ref as React.RefObject<HTMLInputElement>).current!.value =
            String(min)
        } else if (value > max) {
          setValue(max)
          ;(ref as React.RefObject<HTMLInputElement>).current!.value =
            String(max)
        }
      }
    }

    return (
      <NumericFormat
        value={value}
        onValueChange={handleChange}
        thousandSeparator={thousandSeparator}
        decimalScale={decimalScale}
        fixedDecimalScale={fixedDecimalScale}
        allowNegative={min < 0}
        valueIsNumericString
        onBlur={handleBlur}
        max={max}
        min={min}
        suffix={suffix}
        prefix={prefix}
        customInput={Input}
        placeholder={placeholder}
        // className="relative [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        getInputRef={ref}
        {...props}
      />
    )
  },
)
export { NumericFormat }

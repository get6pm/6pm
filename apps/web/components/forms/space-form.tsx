'use client'
import { zCreateSpace } from '@/schemas/space'
import { SUPPORTED_CURRENCIES } from '@6pm/db/static-data/currency'
import { Button } from '@6pm/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  zodResolver,
} from '@6pm/ui/components/form'
import { Input } from '@6pm/ui/components/input'
import { toast } from '@6pm/ui/components/sonner'
import { cn } from '@6pm/ui/lib/utils'
import type { z } from '@6pm/ui/lib/zod'
import type { FC } from 'react'
import { CurrencyComboBox } from './currency-combo-box'

export type SpaceFormValues = z.infer<typeof zCreateSpace>

export type SpaceFormProps = {
  submitButtonText?: string
  onSubmit: (values: SpaceFormValues) => Promise<SpaceFormValues>
  initialValues?: Partial<SpaceFormValues>
  autoFocus?: boolean
  className?: string
}

export const SpaceForm: FC<SpaceFormProps> = ({
  onSubmit,
  initialValues,
  autoFocus,
  className,
  submitButtonText = 'Create space',
}) => {
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(zCreateSpace),
    defaultValues: { name: '', baseCurrencyCode: '', ...initialValues },
  })

  const handleSubmit = async (values: SpaceFormValues) => {
    try {
      const updated = await onSubmit(values)
      form.reset(updated)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit form',
      )
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-4', className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Space name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoFocus={autoFocus}
                  placeholder="Enter space name"
                  disabled={form.formState.isSubmitting}
                  className="max-w-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="baseCurrencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Base currency</FormLabel>
              <FormControl>
                <CurrencyComboBox
                  {...field}
                  currencies={SUPPORTED_CURRENCIES.map((currency) => ({
                    value: currency.code,
                    label: (
                      <div className="flex w-full items-center gap-1 overflow-hidden font-medium">
                        <span className="font-bold font-mono">
                          {currency.code}
                        </span>
                        <span>·</span>
                        <span className="line-clamp-1">{currency.name}</span>
                      </div>
                    ),
                  }))}
                  error={form.formState.errors.baseCurrencyCode}
                  placeholder="Select currency"
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="accent"
          disabled={
            form.formState.isSubmitting ||
            (form.formState.isSubmitted && !form.formState.isDirty)
          }
        >
          {submitButtonText}
        </Button>
      </form>
    </Form>
  )
}

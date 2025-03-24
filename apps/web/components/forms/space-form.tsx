'use client'
import { zCreateSpace } from '@/schemas/space'
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
import { cn } from '@6pm/ui/lib/utils'
import type { z } from '@6pm/ui/lib/zod'
import type { FC } from 'react'

export type SpaceFormValues = z.infer<typeof zCreateSpace>

export type SpaceFormProps = {
  submitButtonText?: string
  onSubmit: (values: SpaceFormValues) => void
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
    defaultValues: { name: '', ...initialValues },
  })
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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
                  autoFocus={autoFocus}
                  placeholder="Enter space name"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="accent"
          disabled={form.formState.isSubmitting}
        >
          {submitButtonText}
        </Button>
      </form>
    </Form>
  )
}

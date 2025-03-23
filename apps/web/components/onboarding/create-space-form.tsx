'use client'
import { Button } from '@6pm/ui/components/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  z,
  zodResolver,
} from '@6pm/ui/components/form'
import { Input } from '@6pm/ui/components/input'
import { cn } from '@6pm/ui/lib/utils'
import type { FC } from 'react'

const createSpaceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
})

export type CreateSpaceFormValues = z.infer<typeof createSpaceFormSchema>

export type CreateSpaceFormProps = {
  submitButtonText?: string
  onSubmit?: (values: CreateSpaceFormValues) => void
  initialValues?: CreateSpaceFormValues
  autoFocus?: boolean
  className?: string
}

export const CreateSpaceForm: FC<CreateSpaceFormProps> = ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: just a skeleton
  onSubmit = () => {},
  initialValues,
  autoFocus,
  className,
  submitButtonText = 'Create space',
}) => {
  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(createSpaceFormSchema),
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

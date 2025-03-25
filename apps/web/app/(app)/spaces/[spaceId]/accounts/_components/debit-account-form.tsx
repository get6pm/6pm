'use client'
import config from '@/constants/config'
import { type DebitAccountValues, zDebitAccount } from '@/schemas/account'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  useFormContext,
  zodResolver,
} from '@6pm/ui/components/form'
import { Input } from '@6pm/ui/components/input'
import { cn } from '@6pm/ui/lib/utils'
import type { FC, ReactNode } from 'react'
import { AccountCardPreview } from './account-card-preview'

export type DebitAccountFormProps = {
  initialValues?: Partial<DebitAccountValues>
  children: ReactNode
}

export const DebitAccountForm: FC<DebitAccountFormProps> = ({
  initialValues,
  children,
}) => {
  const form = useForm<DebitAccountValues>({
    defaultValues: {
      name: '',
      institutionName: '',
      lastDigits: '',
      balance: 0,
      ...initialValues,
    },
    resolver: zodResolver(zDebitAccount),
  })
  return <Form {...form}>{children}</Form>
}

export type DebitAccountFormContentProps = {
  onSubmit: (values: DebitAccountValues) => void | Promise<void>
  children?: ReactNode
  className?: string
}

export const DebitAccountFormContent: FC<DebitAccountFormContentProps> = ({
  onSubmit,
  children,
  className,
}) => {
  const form = useFormContext<DebitAccountValues>()
  const { name, color, institutionName, lastDigits } = form.watch()

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      <FormField
        control={form.control}
        name="institutionName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Institution name</FormLabel>
            <FormControl>
              <Input placeholder="VCB, MB, ..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel withAsterisk>Account name</FormLabel>
            <FormControl>
              <Input placeholder="Account name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          <FormField
            control={form.control}
            name="lastDigits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last digits</FormLabel>
                <FormControl>
                  <Input placeholder="1234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balance</FormLabel>
                <FormControl>
                  <Input placeholder="Balance" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-[18px] flex flex-col items-center gap-2">
          <AccountCardPreview
            accountName={name}
            institutionName={institutionName}
            lastDigits={lastDigits}
            color={color}
            className="shrink-0"
            scale={0.98}
          />
          <div className="mt-auto flex flex-row gap-2">
            {Object.entries(config.accountColors).map(([key, value]) => (
              <button
                key={key}
                type="button"
                className={cn('size-6 rounded-full')}
                style={{ backgroundColor: value }}
                onClick={() => form.setValue('color', key)}
              />
            ))}
          </div>
        </div>
      </div>
      {children}
    </form>
  )
}

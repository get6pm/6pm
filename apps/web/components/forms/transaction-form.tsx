'use client'
import { useSpaceAccounts } from '@/hooks/accounts'
import { useSpaceCategories } from '@/hooks/categories'
import { useCurrentSpace } from '@/hooks/spaces'
import { getColorValue } from '@/lib/get-color-value'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import {
  TransactionType,
  type TransactionValues,
  zTransaction,
} from '@/schemas/transaction'
import { Button } from '@6pm/ui/components/button'
import { Calendar } from '@6pm/ui/components/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@6pm/ui/components/dropdown-menu'
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
import { NumericFormat } from '@6pm/ui/components/number-format'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@6pm/ui/components/popover'
import { Textarea } from '@6pm/ui/components/textarea'
import { format } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { capitalize } from 'lodash-es'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  type FC,
  type InputHTMLAttributes,
  type ReactNode,
  useRef,
} from 'react'

export type TransactionFormProps = {
  initialValues?: Partial<TransactionValues>
  onSubmit: (values: TransactionValues) => Promise<void>
  className?: string
  children: ReactNode
}

export const TransactionForm: FC<TransactionFormProps> = ({
  initialValues,
  onSubmit,
  className,
  children,
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const form = useForm<TransactionValues>({
    resolver: zodResolver(zTransaction),
    defaultValues: {
      name: '',
      date: new Date(),
      notes: '',
      isExclusive: false,
      tagIds: [],
      type: TransactionType.EXPENSE,
      isNegative: true,
      amount: 0,
      ...initialValues,
    },
  })

  return (
    <Form {...form}>
      <form
        ref={formRef}
        className={className}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {children}
      </form>
    </Form>
  )
}

export const TransactionTypeField: FC = () => {
  const t = useTranslations()
  const form = useFormContext<TransactionValues>()
  const { setValue } = form
  const value = form.watch('type')
  const handleTypeChange = (type: TransactionType) => {
    setValue('type', type)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="cursor-pointer border-b-2 border-dashed font-bold transition-colors hover:border-primary">
          {capitalize(t(`transaction-types.${value}`))}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="-ml-3">
        {Object.values(TransactionType).map((type) => (
          <DropdownMenuItem key={type} onClick={() => handleTypeChange(type)}>
            {capitalize(t(`transaction-types.${type}`))}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const TransactionNameField: FC<
  {
    className?: string
    onFieldBlur?: (values: TransactionValues) => void
  } & InputHTMLAttributes<HTMLInputElement>
> = ({ className, onFieldBlur, ...props }) => {
  const form = useFormContext<TransactionValues>()

  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormControl onBlur={() => onFieldBlur?.(form.getValues())}>
            <input
              className={cn(
                '-my-1 -mx-2 rounded-md px-2 py-1 transition-colors focus:bg-muted focus:outline-none',
                className,
              )}
              disabled={form.formState.isSubmitting}
              placeholder="Transaction name"
              {...field}
              {...props}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionDateField: FC<{
  onFieldBlur?: (values: TransactionValues) => void
}> = ({ onFieldBlur }) => {
  const form = useFormContext<TransactionValues>()

  return (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem>
          <Popover
            onOpenChange={(open) => {
              if (!open && onFieldBlur) {
                onFieldBlur(form.getValues())
              }
            }}
          >
            <PopoverTrigger asChild disabled={form.formState.isSubmitting}>
              <FormControl>
                <Button
                  variant="ghost"
                  size={null}
                  className="-ml-2 w-min px-2 py-2 font-normal"
                >
                  <CalendarIcon />
                  {field.value ? (
                    format(field.value, 'PPPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => date < new Date('1900-01-01')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionAmountField: FC<{
  className?: string
  onFieldBlur?: (values: TransactionValues) => void
}> = ({ className, onFieldBlur }) => {
  const form = useFormContext<TransactionValues>()
  const space = useCurrentSpace()
  const isNegative = form.watch('isNegative')

  return (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem onBlur={() => onFieldBlur?.(form.getValues())}>
          <FormControl>
            <NumericFormat
              className={cn(
                '-my-1 -mx-2 rounded-md px-2 py-1 transition-colors focus:bg-muted focus:outline-none',
                !isNegative && 'text-green-700',
                className,
              )}
              placeholder="Transaction amount"
              disabled={form.formState.isSubmitting}
              inputMode="decimal"
              {...getCurrencyInputProps(space.baseCurrencyCode)}
              {...field}
              allowedDecimalSeparators={['.', ',']}
              onChange={(event) => {
                const value = event.target.value
                  .replace(/,/g, '.')
                  .replace(/[^0-9]/g, '')
                field.onChange(value ? parseFloat(value) : 0)
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionIsNegativeField: FC = () => {
  const form = useFormContext<TransactionValues>()
  const type = form.watch('type')
  const isNegative = form.watch('isNegative')

  const labels = {
    true:
      (type === TransactionType.EXPENSE && 'Expense') ||
      (type === TransactionType.TRANSFER && 'Incoming') ||
      (type === TransactionType.INCOME && 'Income'),
    false:
      (type === TransactionType.EXPENSE && 'Income') ||
      (type === TransactionType.TRANSFER && 'Outgoing'),
  }

  if (type === TransactionType.INCOME) {
    return null
  }

  return (
    <FormField
      control={form.control}
      name="isNegative"
      render={({ field }) => (
        <FormItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={null}
                className="-ml-2 w-min px-2 py-2 font-normal"
              >
                {labels[`${isNegative}`]}
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {[true, false].map((value) => (
                <DropdownMenuItem
                  key={value ? 'true' : 'false'}
                  onClick={() => {
                    field.onChange(value)
                  }}
                >
                  {labels[`${value}`]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionCategoryField: FC<{
  onFieldBlur?: (values: TransactionValues) => void
}> = ({ onFieldBlur }) => {
  const form = useFormContext<TransactionValues>()
  const type = form.watch('type')
  const space = useCurrentSpace()
  const categories = useSpaceCategories(space.id)

  const renderCategory = ({ name, icon }: { name: string; icon: string }) => (
    <span className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span>{name}</span>
    </span>
  )

  if (type !== 'EXPENSE') {
    return null
  }

  return (
    <FormField
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel>Category</FormLabel>
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open && onFieldBlur) {
                onFieldBlur(form.getValues())
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size={null}
                className="h-9 w-min px-2 py-1 font-normal"
                style={{
                  backgroundColor:
                    field.value &&
                    categories[field.value] &&
                    `${getColorValue(categories[field.value]?.color)}30`,
                }}
              >
                {(field.value &&
                  categories[field.value] &&
                  renderCategory(categories[field.value]!)) ||
                  'Select category'}
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.values(categories).map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => {
                    field.onChange(category.id)
                  }}
                >
                  {renderCategory(category)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionAccountField: FC<{
  onFieldBlur?: (values: TransactionValues) => void
}> = ({ onFieldBlur }) => {
  const form = useFormContext<TransactionValues>()
  const space = useCurrentSpace()
  const accounts = useSpaceAccounts(space.id)

  const renderAccount = ({
    name,
    color,
    lastDigits,
  }: { name: string; color: string; lastDigits?: string | null }) => (
    <span className="flex items-center gap-2">
      <span
        style={{
          backgroundColor: getColorValue(color),
          width: '1rem',
          height: '1rem',
          borderRadius: '0.25rem',
          display: 'inline-block',
        }}
      />
      <span className="flex items-baseline gap-2">
        <span>{name}</span>
        <span className="text-muted-foreground text-xs">{lastDigits}</span>
      </span>
    </span>
  )

  return (
    <FormField
      control={form.control}
      name="accountId"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel>Account</FormLabel>
          <DropdownMenu
            onOpenChange={(open) => {
              if (!open && onFieldBlur) {
                onFieldBlur(form.getValues())
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size={null}
                className="h-9 w-min px-2 py-1 font-normal"
                style={{
                  backgroundColor:
                    field.value &&
                    accounts[field.value] &&
                    `${getColorValue(accounts[field.value]?.color)}30`,
                }}
              >
                {(field.value &&
                  accounts[field.value] &&
                  renderAccount(accounts[field.value]!)) ||
                  'Select account'}
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.values(accounts).map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    field.onChange(account.id)
                  }}
                >
                  {renderAccount(account)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export const TransactionNotesField: FC<{
  onFieldBlur?: (values: TransactionValues) => void
}> = ({ onFieldBlur }) => {
  const form = useFormContext<TransactionValues>()

  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem onBlur={() => onFieldBlur?.(form.getValues())}>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea
              className="w-full"
              disabled={form.formState.isSubmitting}
              placeholder="Notes"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

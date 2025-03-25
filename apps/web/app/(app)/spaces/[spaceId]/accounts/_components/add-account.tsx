'use client'
import { Button } from '@6pm/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@6pm/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@6pm/ui/components/dropdown-menu'
import { useTranslations } from 'next-intl'
import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { DebitAccountForm, DebitAccountFormContent } from './debit-account-form'

type AccountType = 'debit_manual' | 'credit_manual' | 'cash_manual'

type AddAccountContextValue = {
  selectedAccountType: AccountType | null
  setSelectedAccountType: (type: AccountType | null) => void
}
const AddAccountContext = createContext<AddAccountContextValue>({
  selectedAccountType: null,
  // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
  setSelectedAccountType: () => {},
})

export type AddAccountProps = {
  children: ReactNode
}

export const AddAccount: FC<AddAccountProps> = ({ children }) => {
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType | null>(null)

  const accountContentValue: AddAccountContextValue = {
    selectedAccountType,
    setSelectedAccountType,
  }

  return (
    <AddAccountContext.Provider value={accountContentValue}>
      <DropdownMenu>{children}</DropdownMenu>
    </AddAccountContext.Provider>
  )
}

export type AddAccountTriggerProps = {
  children: ReactNode
  asChild?: boolean
}

export type AddAccountContentProps = {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const AddAccountContent: FC<AddAccountContentProps> = ({
  align,
  side,
}) => {
  const { setSelectedAccountType } = useContext(AddAccountContext)
  const t = useTranslations()

  return (
    <DropdownMenuContent align={align} side={side}>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {t('oAQlpK0eVR8wbm3IfSfPo')}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem disabled>
              {t('lB8t6yJYlMJ4G4q0T1np9')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedAccountType('debit_manual')}
            >
              {t('4qGn1lh7s1H5e5bjgKncS')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {t('3wau3IU2uOxBZW_wAyY_N')}
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem disabled>
              {t('yZ9en6VbEffQibTQ429FY')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSelectedAccountType('credit_manual')}
            >
              {t('4qGn1lh7s1H5e5bjgKncS')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuItem onClick={() => setSelectedAccountType('cash_manual')}>
        {t('_IVUeSl_0f5ZRda-pscBR')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export type AddAccountDialogProps = {}

export const AddAccountDialog: FC<AddAccountDialogProps> = () => {
  const { selectedAccountType, setSelectedAccountType } =
    useContext(AddAccountContext)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const t = useTranslations()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedAccountType(null)
    }
  }

  useEffect(() => {
    if (selectedAccountType !== null) {
      setAccountType(selectedAccountType)
    }
  }, [selectedAccountType])

  return (
    <Dialog open={selectedAccountType !== null} onOpenChange={handleOpenChange}>
      <DialogContent backdropBlur>
        <DialogHeader>
          <DialogTitle>
            {accountType &&
              t('OOBfwmc6-ahOkx16nUh4q', {
                accountType: t(`account-types.${accountType}`),
              })}
          </DialogTitle>
          {accountType === 'debit_manual' && (
            <DebitAccountForm>
              <DebitAccountFormContent onSubmit={console.log} className="mt-4">
                <div className="-mt-6 flex justify-start">
                  <Button type="submit" variant="accent">
                    {t('wmWgktgPbxz74naN9Dh4W')}
                  </Button>
                </div>
              </DebitAccountFormContent>
            </DebitAccountForm>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

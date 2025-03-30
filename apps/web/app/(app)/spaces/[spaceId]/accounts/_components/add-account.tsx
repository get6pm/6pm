'use client'
import type { AccountType, AccountValues } from '@/schemas/account'
import { useCurrentSpaceId } from '@/store/hooks'
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
import { toast } from '@6pm/ui/components/sonner'
import { useTranslations } from 'next-intl'
import {
  type FC,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useCreateAccount } from '../../_hooks/accounts'
import { AccountForm, AccountFormContent } from './account-form'

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
              onClick={() => setSelectedAccountType('DEBIT_MANUAL')}
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
              onClick={() => setSelectedAccountType('CREDIT_MANUAL')}
            >
              {t('4qGn1lh7s1H5e5bjgKncS')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuItem onClick={() => setSelectedAccountType('CASH_MANUAL')}>
        {t('_IVUeSl_0f5ZRda-pscBR')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}

export type AddAccountDialogProps = {}

export const AddAccountDialog: FC<AddAccountDialogProps> = () => {
  const spaceId = useCurrentSpaceId()
  const { selectedAccountType, setSelectedAccountType } =
    useContext(AddAccountContext)
  const { createAccount } = useCreateAccount()
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const t = useTranslations()

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedAccountType(null)
    }
  }

  const handleCreateAccount = async (values: AccountValues) => {
    const { success, error, data } = await createAccount({
      spaceId,
      data: values,
    })

    if (error) {
      toast.error(t('b3ztS001UdqTfPG47tct5'), { description: error })
    }

    if (success) {
      toast.success(t('0Hrqik0jBtIfdR8tCM2W6', { name: data.name }))
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
          {accountType && (
            <AccountForm type={accountType}>
              <AccountFormContent
                onSubmit={handleCreateAccount}
                className="mt-4"
              >
                {({ isSubmitting }) => (
                  <div className="-mt-6 flex justify-start">
                    <Button
                      type="submit"
                      variant="accent"
                      disabled={isSubmitting}
                    >
                      {t('wmWgktgPbxz74naN9Dh4W')}
                    </Button>
                  </div>
                )}
              </AccountFormContent>
            </AccountForm>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

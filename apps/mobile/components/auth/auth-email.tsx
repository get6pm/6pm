import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import type { EmailCodeFactor } from '@clerk/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { View } from 'react-native'

import { createUser } from '@/mutations/user'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { XCircleIcon } from 'lucide-react-native'
import { FormProvider, useForm } from 'react-hook-form'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { Button } from '../ui/button'
import { Text } from '../ui/text'
import {
  type EmailFormValues,
  type VerifyEmailFormValues,
  emailFormSchema,
  verifyEmailFormSchema,
} from './emailSchema'

export function AuthEmail() {
  const { i18n } = useLingui()

  const authEmailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
  })
  const verifyEmailForm = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailFormSchema),
  })

  const [verifying, setVerifying] = useState(false)
  const [mode, setMode] = useState<'signUp' | 'signIn'>('signUp')

  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setActiveSignUp,
  } = useSignUp()
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setActiveSignIn,
  } = useSignIn()

  if (!isSignUpLoaded || !isSignInLoaded) {
    return null
  }

  const onContinue = async ({ emailAddress }: EmailFormValues) => {
    try {
      await signUp.create({
        emailAddress,
      })
      await signUp.prepareEmailAddressVerification()
      setVerifying(true)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      if (err?.errors?.[0]?.code === 'form_identifier_exists') {
        // If the email address already exists, try to sign in instead
        setMode('signIn')
        try {
          const { supportedFirstFactors } = await signIn.create({
            identifier: emailAddress,
          })

          const emailCodeFactor = supportedFirstFactors?.find(
            (i) => i.strategy === 'email_code',
          )
          if (emailCodeFactor) {
            await signIn.prepareFirstFactor({
              strategy: 'email_code',
              emailAddressId: (emailCodeFactor as EmailCodeFactor)
                .emailAddressId,
            })
            setVerifying(true)
          }
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (e: any) {
          // biome-ignore lint/suspicious/noConsoleLog: <explanation>
          console.log('error', JSON.stringify(e, null, 2))
        }
      } else {
        authEmailForm.setError('emailAddress', {
          message: err?.errors?.[0]?.message || t(i18n)`An error occurred`,
        })
      }
    }
  }

  const onVerify = async ({ code }: VerifyEmailFormValues) => {
    try {
      if (mode === 'signUp') {
        const signUpAttempt = await signUp.attemptEmailAddressVerification({
          code,
        })
        if (signUpAttempt.status === 'complete') {
          await setActiveSignUp({ session: signUpAttempt.createdSessionId })
          // signed up
          await createUser({
            email: signUpAttempt.emailAddress!,
            name: signUpAttempt.firstName ?? '',
          })
        } else {
          console.error(signUpAttempt)
        }
      } else {
        const signInAttempt = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        })
        if (signInAttempt.status === 'complete') {
          await setActiveSignIn({ session: signInAttempt.createdSessionId })
          // signed in
        } else {
          console.error(signInAttempt)
        }
      }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log('error', JSON.stringify(err, null, 2))
    }
  }

  return (
    <>
      <FormProvider {...authEmailForm}>
        <View className="gap-4">
          <InputField
            name="emailAddress"
            label={t(i18n)`Email`}
            placeholder={t(i18n)`Enter your email address`}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            editable={!verifying}
            onSubmitEditing={authEmailForm.handleSubmit(onContinue)}
            rightSection={
              verifying && (
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() => {
                    setVerifying(false)
                    authEmailForm.reset()
                  }}
                  className="!-right-1.5 top-0.5"
                >
                  <XCircleIcon className="h-5 w-5 text-muted-foreground" />
                </Button>
              )
            }
          />
          {!verifying && (
            <SubmitButton
              onPress={authEmailForm.handleSubmit(onContinue)}
              disabled={verifying}
            >
              <Text>{t(i18n)`Continue`}</Text>
            </SubmitButton>
          )}
        </View>
      </FormProvider>
      {verifying && (
        <FormProvider {...verifyEmailForm}>
          <View className="mt-3 gap-4">
            <InputField
              name="code"
              label={t(i18n)`Verification code`}
              placeholder={t(i18n)`Enter the code sent to your email`}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoFocus
              onEndEditing={verifyEmailForm.handleSubmit(onVerify)}
            />
            <SubmitButton onPress={verifyEmailForm.handleSubmit(onVerify)}>
              <Text>
                {mode === 'signUp' ? t(i18n)`Sign up` : t(i18n)`Sign in`}
              </Text>
            </SubmitButton>
          </View>
        </FormProvider>
      )}
    </>
  )
}

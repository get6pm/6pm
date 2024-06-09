import { getHonoClient } from '@/lib/client'
import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import type { EmailCodeFactor } from '@clerk/types'
import { useState } from 'react'
import { Button } from '../Button'
import { Input } from '../Input'

export function AuthEmail() {
  const [emailAddress, setEmailAddress] = useState('')
  const [code, setCode] = useState('')
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

  const onContinue = async () => {
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

          const emailCodeFactor = supportedFirstFactors.find(
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
        // biome-ignore lint/suspicious/noConsoleLog: <explanation>
        console.log('error', JSON.stringify(err, null, 2))
      }
    }
  }

  const onVerify = async () => {
    try {
      if (mode === 'signUp') {
        const signUpAttempt = await signUp.attemptEmailAddressVerification({
          code,
        })
        if (signUpAttempt.status === 'complete') {
          await setActiveSignUp({ session: signUpAttempt.createdSessionId })
          // signed up
          // create user
          const hc = await getHonoClient()
          await hc.v1.users.$post({
            json: {
              email: emailAddress,
              name: '***',
            },
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

  if (verifying) {
    return (
      <>
        <Input
          placeholder="Enter the code"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          autoFocus
        />
        <Button label="Verify" onPress={onVerify} />
      </>
    )
  }

  return (
    <>
      <Input
        placeholder="Enter your email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
        value={emailAddress}
        onChangeText={setEmailAddress}
      />
      <Button label="Continue" onPress={onContinue} />
    </>
  )
}

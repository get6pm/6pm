import * as z from 'zod'

export const emailFormSchema = z.object({
  emailAddress: z
    .string()
    .email()
    .min(1, { message: 'Input your email address' }),
})

export type EmailFormValues = z.infer<typeof emailFormSchema>

export const verifyEmailFormSchema = z.object({
  code: z.string().min(1, { message: 'Input the verification code' }),
})

export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>

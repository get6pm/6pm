import { Button } from '@6pm/ui/components/button'
import Link from 'next/link'

export default async function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="font-bold font-serif text-2xl">Welcome to 6pm!</h1>
      <p>Financial management for the modern age</p>
      <Button asChild>
        <Link href="/sign-in?next=/spaces">Get Started</Link>
      </Button>
    </div>
  )
}

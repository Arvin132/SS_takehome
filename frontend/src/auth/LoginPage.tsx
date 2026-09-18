import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import heroImage from '../assets/hero.png'
import { Logo } from '../layout/Logo'
import { Button, Eyebrow, Input, ThemeToggle } from '../ui'
import { ArrowRightIcon } from '../ui/icons'
import { useAuth } from './context'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login, loginError, isLoggingIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await login({ username, password })
      const from = (location.state as LocationState | null)?.from?.pathname
      navigate(from ?? '/plants', { replace: true })
    } catch {
      // The error surfaces through loginError.
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={heroImage} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#161c2c]/80 via-[#161c2c]/40 to-primary/30" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Logo className="text-white" />
          <div className="max-w-md space-y-4">
            <Eyebrow className="text-white/80">Fleet soiling advisor</Eyebrow>
            <h1 className="text-4xl font-extralight leading-tight">
              Know which plants are <span className="font-semibold">worth cleaning</span> today.
            </h1>
            <p className="text-sm text-white/75">
              Telemetry from every plant, turned into a ranked, costed cleaning plan your crews can
              act on this morning.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Logo className="lg:hidden" />
            <ThemeToggle className="ml-auto" />
          </div>

          <Eyebrow>Sign in</Eyebrow>
          <h2 className="mt-2 text-3xl font-light text-foreground">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the operator account assigned to your plants.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {loginError ? (
              <p className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
                {loginError}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={isLoggingIn}>
              Sign in
              {!isLoggingIn ? <ArrowRightIcon className="size-4" /> : null}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

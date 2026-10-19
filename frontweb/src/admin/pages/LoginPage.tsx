import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { ConsoleLogo } from '../components/ConsoleLogo'
import { Loader } from '../components/Loader'
import { useAuth } from '../lib/auth'
import { adminPath } from '../lib/paths'
import { stagger } from '../lib/style'
import './LoginPage.css'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? adminPath.overview

  if (loading) return <Loader fullscreen />
  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__art" aria-hidden="true">
        <span className="login__word reveal">
          mint
          <span className="login__orb" />
        </span>
      </div>

      <form className="login__card reveal" style={stagger(2)} onSubmit={handleSubmit}>
        <ConsoleLogo />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="login__error">{error}</p>}
        <Button type="submit" variant="primary" loading={submitting} className="login__submit">
          Sign in
        </Button>
      </form>
    </div>
  )
}

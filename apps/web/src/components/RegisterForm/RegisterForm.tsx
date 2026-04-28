'use client'
// client: multi-step registration form state

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { CountrySelect } from '@/components/CountrySelect/CountrySelect'
import iconSlot from '@/components/IconSlot/iconSlot.module.css'
import styles from './RegisterForm.module.css'

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'TR', name: 'Turkey' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'CY', name: 'Cyprus' },
]

export function RegisterForm() {
  const googleOAuthEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim())
  const githubOAuthEnabled = Boolean(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID?.trim())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null)
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [birthDate, setBirthDate] = useState('')
  const [country, setCountry] = useState('')

  function calculatePasswordStrength(pwd: string): number {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return Math.min(strength, 4)
  }

  function getPasswordFeedback(pwd: string): string[] {
    const feedback: string[] = []
    if (pwd.length < 8) feedback.push('At least 8 characters')
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd)) feedback.push('Mix of uppercase & lowercase')
    if (!/\d/.test(pwd)) feedback.push('Include numbers')
    if (!/[^a-zA-Z0-9]/.test(pwd)) feedback.push('Add special characters')
    return feedback
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    setPasswordStrength(calculatePasswordStrength(value))
    if (confirmPassword) {
      setPasswordMatch(value === confirmPassword)
    }
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value)
    if (password) {
      setPasswordMatch(password === value)
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (value.length > 0) {
      setEmailValid(validateEmail(value))
    } else {
      setEmailValid(null)
    }
  }

  function handleUsernameChange(value: string) {
    setUsername(value)
    if (value.length > 0) {
      setUsernameValid(value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value))
    } else {
      setUsernameValid(null)
    }
  }

  function parseBirthDateToIso(input: string): string | null {
    const value = input.trim()
    if (!value) return null

    const dotMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
    if (dotMatch) {
      const day = Number(dotMatch[1])
      const month = Number(dotMatch[2])
      const year = Number(dotMatch[3])
      if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null
      const parsed = new Date(Date.UTC(year, month - 1, day))
      if (
        parsed.getUTCFullYear() !== year ||
        parsed.getUTCMonth() !== month - 1 ||
        parsed.getUTCDate() !== day
      ) {
        return null
      }
      return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}`
    }

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!isoMatch) return null
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return null
    }
    return value
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    const parsedBirthDate = parseBirthDateToIso(birthDate)
    if (birthDate.trim() !== '' && parsedBirthDate == null) {
      setError('Please use a valid date format: DD.MM.YYYY')
      return
    }

    setIsLoading(true)

    try {
      // Use environment variable or fallback to localhost
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          birthDate: parsedBirthDate ?? undefined,
          country: country || undefined,
        }),
      })

      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const errMsg =
          isRecord(data) && typeof data.error === 'string'
            ? data.error
            : `Registration failed (${response.status})`
        throw new Error(errMsg)
      }

      setShowSuccess(true)

      // Show email verification message
      setTimeout(() => {
        window.location.href = '/login?registered=true'
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = [
    'var(--text-muted)',
    'var(--color-warning)',
    'var(--color-primary-hover)',
    'var(--color-primary)',
  ]

  return (
    <div className={styles.root}>
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <svg
                className={`${iconSlot.block} ${iconSlot.avatar64}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Account Created!</h2>
            <p className={styles.successText}>
              Check your email to verify your account.
              <br />
              <span className={styles.successEmail}>{email}</span>
            </p>
            <p className={styles.successSubtext}>Redirecting to login...</p>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>▶</span>
              <span className={styles.logoText}>MegDB</span>
            </Link>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>
              Free account — rate movies, build your watchlist, and get personalized recommendations
              across 850,000+ titles.
            </p>
          </div>

          <div className={styles.socialButtons}>
            <button
              type="button"
              className={styles.socialBtn}
              disabled={isLoading || !googleOAuthEnabled}
              onClick={() => {
                if (!googleOAuthEnabled) {
                  setError(
                    'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in apps/web/.env.local and restart web dev server.'
                  )
                  return
                }
                void signIn('google', { callbackUrl: '/profile' })
              }}
              aria-label="Continue with Google"
            >
              <svg
                className={`${iconSlot.block} ${iconSlot.md}`}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className={styles.socialBtn}
              disabled={isLoading || !githubOAuthEnabled}
              onClick={() => {
                if (!githubOAuthEnabled) {
                  setError(
                    'GitHub sign-in is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in apps/web/.env.local and restart web dev server.'
                  )
                  return
                }
                void signIn('github', { callbackUrl: '/profile' })
              }}
              aria-label="Continue with GitHub"
            >
              <svg
                className={`${iconSlot.block} ${iconSlot.md}`}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            className={styles.form}
          >
            {error && (
              <div className={styles.error} role="alert">
                <svg
                  className={`${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <div
                className={`${styles.inputWrapper} ${usernameValid === true ? styles.inputValid : usernameValid === false ? styles.inputInvalid : ''}`}
              >
                <svg
                  className={`${styles.inputIcon} ${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={styles.input}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  minLength={3}
                />
                {usernameValid === true && (
                  <svg
                    className={`${styles.validIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {usernameValid === false && (
                  <svg
                    className={`${styles.invalidIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              {usernameValid === false && (
                <p className={styles.fieldHint}>
                  Username must be at least 3 characters (letters, numbers, underscore)
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <div
                className={`${styles.inputWrapper} ${emailValid === true ? styles.inputValid : emailValid === false ? styles.inputInvalid : ''}`}
              >
                <svg
                  className={`${styles.inputIcon} ${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={styles.input}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
                {emailValid === true && (
                  <svg
                    className={`${styles.validIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {emailValid === false && (
                  <svg
                    className={`${styles.invalidIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="birthDate" className={styles.label}>
                Date of Birth
              </label>
              <div className={styles.inputWrapper}>
                <svg
                  className={`${styles.inputIcon} ${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  id="birthDate"
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`${styles.input} ${styles.inputDate}`}
                  placeholder="DD.MM.YYYY"
                  pattern="\d{2}\.\d{2}\.\d{4}"
                  disabled={isLoading}
                  autoComplete="bday"
                  inputMode="numeric"
                />
              </div>
              <p className={styles.fieldHelp}>Use format DD.MM.YYYY</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Country</label>
              <CountrySelect
                value={country}
                onChange={setCountry}
                disabled={isLoading}
                countries={COUNTRIES}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <svg
                  className={`${styles.inputIcon} ${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={styles.input}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg
                      className={`${iconSlot.block} ${iconSlot.md}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      className={`${iconSlot.block} ${iconSlot.md}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <>
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBars}>
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`${styles.strengthBar} ${i < passwordStrength ? styles.strengthBarActive : ''}`}
                          style={{
                            backgroundColor:
                              i < passwordStrength
                                ? strengthColors[passwordStrength - 1]
                                : undefined,
                          }}
                        />
                      ))}
                    </div>
                    {passwordStrength > 0 && (
                      <span
                        className={styles.strengthLabel}
                        style={{ color: strengthColors[passwordStrength - 1] }}
                      >
                        {strengthLabels[passwordStrength - 1]}
                      </span>
                    )}
                  </div>
                  {passwordStrength < 4 && (
                    <div className={styles.passwordFeedback}>
                      {getPasswordFeedback(password).map((hint, idx) => (
                        <span key={idx} className={styles.feedbackHint}>
                          • {hint}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <div
                className={`${styles.inputWrapper} ${passwordMatch === true ? styles.inputValid : passwordMatch === false ? styles.inputInvalid : ''}`}
              >
                <svg
                  className={`${styles.inputIcon} ${iconSlot.block} ${iconSlot.md}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={styles.input}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  minLength={8}
                />
                {passwordMatch === true && (
                  <svg
                    className={`${styles.validIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {passwordMatch === false && (
                  <svg
                    className={`${styles.invalidIcon} ${iconSlot.block} ${iconSlot.md}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
              {passwordMatch === false && (
                <p className={styles.fieldHint}>Passwords do not match</p>
              )}
            </div>

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                required
              />
              <span className={styles.checkboxCustom}>
                <svg
                  className={`${iconSlot.block} ${iconSlot.inline14}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className={styles.checkboxLabel}>
                I agree to the{' '}
                <Link href="/terms" className={styles.link} target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className={styles.link} target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <div className={styles.submitWrap}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading || !acceptTerms}
              >
                Sign Up
              </Button>
            </div>

            <p className={styles.footer}>
              Already have an account?{' '}
              <Link href="/login" className={styles.link}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

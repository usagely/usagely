'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/src/lib/auth-client'
import { Icon } from '@/src/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('priya@acme.co')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await authClient.signIn.email({ email, password })
    if (result.error) {
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        background: 'var(--bg)',
      }}
    >
      <aside
        style={{
          background: 'var(--ink)',
          color: 'var(--bg)',
          padding: '40px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            U.
          </div>
          <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            Usagely
          </div>
        </div>

        <div style={{ maxWidth: 480 }}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.6,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            FinOps for AI
          </div>
          <h1
            style={{
              fontSize: 38,
              lineHeight: 1.1,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Every token, prompt
            <br />
            and seat — accounted for.
          </h1>
          <p
            style={{
              opacity: 0.72,
              marginTop: 16,
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            Usagely unifies AI spend across 40+ providers, attributes cost to
            teams and projects, and surfaces optimizations that cut your bill
            without cutting capability.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid oklch(1 0 0 / 0.12)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                $4.2M
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                saved YTD for customers
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                41
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                native integrations
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                SOC 2
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                Type II audited
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 14,
            fontSize: 11,
            opacity: 0.5,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>v4.12.0</span>
          <span>&middot;</span>
          <span>status: operational</span>
          <span>&middot;</span>
          <span>us-east-1</span>
        </div>

        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -80,
            bottom: -80,
            opacity: 0.08,
          }}
          width="420"
          height="420"
          viewBox="0 0 420 420"
        >
          <defs>
            <pattern
              id="gr"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0H0v20"
                stroke="currentColor"
                strokeWidth="0.5"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="420" height="420" fill="url(#gr)" />
        </svg>
      </aside>

      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          padding: 40,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Sign in
            </div>
            <h2
              style={{
                margin: '4px 0 4px',
                fontSize: 24,
                letterSpacing: '-0.01em',
                fontWeight: 500,
              }}
            >
              Welcome back.
            </h2>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              Continue to your Acme workspace.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <Button
              type="button"
              variant="outline"
              style={{ height: 40, justifyContent: 'center' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
              </svg>
              Continue with Microsoft
            </Button>
            <Button
              type="button"
              variant="outline"
              style={{ height: 40, justifyContent: 'center' }}
            >
              <Icon name="link" size={14} />
              Continue with Google Workspace
            </Button>
            <Button
              type="button"
              variant="outline"
              style={{ height: 40, justifyContent: 'center' }}
            >
              <Icon name="lock" size={14} />
              Continue with Okta SSO
            </Button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--muted)',
              fontSize: 11,
            }}
          >
            <hr
              style={{
                flex: 1,
                border: 'none',
                borderTop: '1px solid var(--hairline)',
              }}
            />
            <span>OR</span>
            <hr
              style={{
                flex: 1,
                border: 'none',
                borderTop: '1px solid var(--hairline)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>
              Work email
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 8,
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              >
                <Icon name="mail" size={14} />
              </span>
              <Input
                style={{ paddingLeft: 32, height: 38 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <label
              style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 8,
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              >
                <Icon name="lock" size={14} />
              </span>
              <Input
                type="password"
                style={{ paddingLeft: 32, height: 38 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{ height: 40, justifyContent: 'center' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}{' '}
            <Icon name="arrow-right" size={14} />
          </Button>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <a style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>
              Forgot password?
            </a>
            <a style={{ color: 'var(--ink-2)', cursor: 'pointer' }}>
              Request access
            </a>
          </div>
        </form>
      </main>
    </div>
  )
}

'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Calculator, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [isMFARequired, setIsMFARequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signError) {
      setError(signError.message)
      setIsLoading(false)
      return
    }

    // Check if MFA is required
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
      setIsMFARequired(true)
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setVerificationError(null)

    const supabase = createClient()

    try {
      // 1. Get factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError

      const factor = factorsData.all.find(f => f.status === 'verified')
      if (!factor) throw new Error('No se encontró un factor verificado')

      // 2. Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id
      })
      if (challengeError) throw challengeError

      // 3. Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code: mfaCode
      })
      if (verifyError) throw verifyError

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setVerificationError(err.message)
      setIsLoading(false)
    }
  }

  // Fix destructuring lint by checking data presence
  useEffect(() => {
    const checkAuthStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
          setIsMFARequired(true)
        }
      }
    }
    checkAuthStatus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md shadow-sm border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-8 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {isMFARequired ? 'Verificación' : 'NOMBRE EMPRESA'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isMFARequired
                ? 'Introduce el código de seguridad'
                : 'Inicia sesión para continuar'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          {!isMFARequired ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <a href="#" className="text-xs text-blue-600 hover:underline">¿Olvidaste tu clave?</a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-lg"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full h-10 rounded-lg font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMFAVerify} className="space-y-6">
              {verificationError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">{verificationError}</span>
                </div>
              )}

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="h-12 w-full rounded-lg text-center text-2xl font-bold tracking-[0.2em]"
                  maxLength={6}
                  autoFocus
                  required
                  disabled={isLoading}
                />
                <p className="text-center text-xs text-slate-500">
                  Introduce el código de tu aplicación autenticadora.
                </p>
              </div>

              <div className="space-y-2">
                <Button type="submit" className="w-full h-10 rounded-lg font-medium" disabled={isLoading || mfaCode.length < 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-9 text-slate-500"
                  onClick={() => setIsMFARequired(false)}
                  disabled={isLoading}
                >
                  Volver
                </Button>
              </div>
            </form>
          )}

          {!isMFARequired && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                ¿No tienes cuenta?{' '}
                <a href="/auth/sign-up" className="text-blue-600 font-medium hover:underline">
                  Regístrate
                </a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

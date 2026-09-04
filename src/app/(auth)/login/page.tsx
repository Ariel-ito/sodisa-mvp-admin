'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { setToken, saveUser, AdminUser } from '@/lib/auth';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

interface TotpRequiredResponse {
  requiresTotp: true;
  tempToken: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // — Segundo paso: código de 2FA
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  async function finishLogin(data: LoginResponse) {
    setToken(data.accessToken);
    saveUser(data.user);
    router.push(from);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data: LoginResponse & TotpRequiredResponse & { message?: string } = await res.json();
      if (!res.ok) {
        throw new ApiError(res.status, (data.message as string) ?? `Error ${res.status}`);
      }
      if (data.requiresTotp) {
        setTempToken(data.tempToken);
        return;
      }
      await finishLogin(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Demasiados intentos. Por favor espera un momento antes de volver a intentarlo.');
        } else if (err.status === 401 || err.status === 403) {
          setError(err.message ?? 'Credenciales inválidas o sin acceso de administrador.');
        } else {
          setError(err.message ?? `Error ${err.status}`);
        }
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitTotp(e: React.FormEvent) {
    e.preventDefault();
    if (!tempToken) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login/totp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken, code: totpCode }),
      });
      const data: LoginResponse & { message?: string } = await res.json();
      if (!res.ok) {
        throw new ApiError(res.status, (data.message as string) ?? `Error ${res.status}`);
      }
      await finishLogin(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message ?? 'Código inválido.');
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-primary text-primary-foreground p-10">
        <div className="flex items-center">
          <Image
            src="/logo-sodisa-blanco.png"
            alt="SODISA"
            width={220}
            height={83}
            className="h-14 w-auto"
            priority
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Panel de<br />Administración
          </h1>
          <p className="text-primary-foreground/60 text-base leading-relaxed max-w-xs">
            Gestiona empresas, usuarios y permisos del sistema de facturación.
          </p>
        </div>

        <p className="text-primary-foreground/30 text-sm">
          © 2025 SODISA · Acceso restringido
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center lg:hidden">
            <Image
              src="/logo-sodisa.png"
              alt="SODISA"
              width={180}
              height={68}
              className="h-12 w-auto"
              priority
            />
          </div>

          {tempToken ? (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Verificación en dos pasos</h2>
                <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos de tu app de autenticación</p>
              </div>

              <form onSubmit={handleSubmitTotp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="totpCode">Código de verificación</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    className="h-10 text-center text-lg tracking-[0.3em]"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                    <Lock className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-10 mt-2" disabled={loading || totpCode.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verificando…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="size-4" />
                      Verificar
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => { setTempToken(null); setTotpCode(''); setError(''); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Volver
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
                <p className="text-sm text-muted-foreground">Ingresa tus credenciales de administrador</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@sodisa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/8 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                    <Lock className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full h-10 mt-2" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Iniciando sesión…
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

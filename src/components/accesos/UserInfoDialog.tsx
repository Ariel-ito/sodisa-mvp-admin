'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ShieldCheck, KeyRound, CheckCircle2, Eye, EyeOff, Copy, Check, ChevronDown } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { swrFetcher, adminFetch, ApiError } from '@/lib/api';
import { PERMISSIONS, PERMISSION_LABEL_MAP } from '@/lib/permissions';
import { toast } from 'sonner';

interface PermissionEntry {
  code: string;
  fromRole?: boolean;
  grantedUntil?: string | null;
}

interface UcaDetail {
  id: number;
  userName?: string;
  userEmail?: string;
  isActive: boolean;
  hasSupervisorPin: boolean;
  roles: string[];
  permissions: PermissionEntry[];
}

interface Props {
  ucaId: number | null;
  onClose: () => void;
}

const MODULE_LABEL_MAP = Object.fromEntries(
  Object.entries(PERMISSIONS).map(([key, mod]) => [key, mod.label]),
);

export function UserInfoDialog({ ucaId, onClose }: Props) {
  const open = ucaId !== null;

  const { data, isLoading } = useSWR<UcaDetail>(
    open ? `/portal/access/${ucaId}` : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 0 },
  );

  // ── Password reset state ──────────────────────────────────────────────────
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [password, setPassword]             = useState('');
  const [showPwd, setShowPwd]               = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [savingPwd, setSavingPwd]           = useState(false);

  function resetPwdState() {
    setShowPwdSection(false);
    setPassword('');
    setShowPwd(false);
    setCopied(false);
  }

  function handleClose() {
    resetPwdState();
    onClose();
  }

  async function copyPassword() {
    if (!password.trim()) return;
    await navigator.clipboard.writeText(password.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || ucaId === null) return;
    setSavingPwd(true);
    try {
      await adminFetch(`/portal/access/${ucaId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: password.trim() }),
      });
      toast.success('Contraseña restablecida');
      resetPwdState();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al restablecer contraseña');
    } finally {
      setSavingPwd(false);
    }
  }

  // ── Permission grouping ───────────────────────────────────────────────────
  const groupedPerms = (data?.permissions ?? []).reduce<Record<string, PermissionEntry[]>>(
    (acc, p) => {
      const prefix = p.code.split('.')[0];
      (acc[prefix] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Cargando…' : (data?.userName ?? 'Usuario')}
          </DialogTitle>
          {data?.userEmail && (
            <p className="text-xs text-muted-foreground">{data.userEmail}</p>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="text-sm text-muted-foreground py-6 text-center">Cargando…</div>
        )}

        {data && (
          <div className="flex flex-col gap-5 pt-1">

            {/* Estado + PIN */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={data.isActive ? 'default' : 'secondary'}>
                {data.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ring-1 ${
                data.hasSupervisorPin
                  ? 'text-green-700 bg-green-50 ring-green-200'
                  : 'text-muted-foreground bg-muted ring-muted-foreground/20'
              }`}>
                <KeyRound className="size-3" />
                PIN supervisor: {data.hasSupervisorPin ? 'Configurado' : 'Sin PIN'}
              </span>
            </div>

            {/* Roles */}
            {data.roles.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Roles activos
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {data.roles.map(r => (
                    <Badge key={r} variant="secondary">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Permisos */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                Permisos ({data.permissions.length})
              </span>

              {data.permissions.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">Sin permisos asignados</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(groupedPerms).map(([prefix, perms]) => (
                    <div key={prefix} className="rounded-lg border p-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground border-b pb-1.5 mb-0.5">
                        {MODULE_LABEL_MAP[prefix] ?? prefix}
                      </span>
                      {perms.map(p => (
                        <div key={p.code} className="flex items-center gap-1.5 flex-wrap">
                          <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                          <span className="text-xs">
                            {PERMISSION_LABEL_MAP[p.code] ?? p.code}
                          </span>
                          {p.fromRole && (
                            <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-px">
                              ROL
                            </span>
                          )}
                          {p.grantedUntil && (
                            <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-px">
                              hasta {new Date(p.grantedUntil).toLocaleDateString('es-HN')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restablecer contraseña */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowPwdSection(v => !v)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <KeyRound className="size-4" />
                Restablecer contraseña
                <ChevronDown className={`size-4 transition-transform ${showPwdSection ? 'rotate-180' : ''}`} />
              </button>

              {showPwdSection && (
                <form onSubmit={handleSavePassword} className="flex flex-col gap-3 mt-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="info-dialog-password">Nueva contraseña</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="info-dialog-password"
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Escribe la contraseña…"
                          className="pr-9"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(s => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyPassword}
                        disabled={!password.trim()}
                        title="Copiar contraseña"
                      >
                        {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El usuario deberá cambiarla al iniciar sesión.
                    </p>
                  </div>
                  <div>
                    <Button type="submit" size="sm" disabled={savingPwd || !password.trim()}>
                      {savingPwd ? 'Guardando…' : 'Guardar contraseña'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

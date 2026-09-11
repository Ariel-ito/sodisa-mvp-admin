'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { KeyRound, Copy, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';
import { toast } from 'sonner';

interface RequestMatch {
  ucaId: number;
  companyId: number;
  companyName: string;
}

interface RequestRow {
  id: number;
  type: string;
  email: string;
  description: string | null;
  createdAt: string;
  matches: RequestMatch[];
}

function generateTempPassword(length = 12): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => charset[v % charset.length]).join('');
}

/**
 * Cola GLOBAL de solicitudes (staff SODISA) -- cubre el caso "el propio admin
 * de la empresa quedó bloqueado". La cola scoped a una sola empresa vive en
 * mvp_app (administracion/usuarios/solicitudes).
 */
export default function SolicitudesPage() {
  const { data: requests, isLoading, mutate } = useSWR<RequestRow[]>('/portal/requests', swrFetcher);

  const [active, setActive] = useState<RequestRow | null>(null);
  const [selectedUcaId, setSelectedUcaId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [revealed, setRevealed] = useState<{ request: RequestRow; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function openResolve(request: RequestRow) {
    setActive(request);
    setSelectedUcaId(request.matches.length === 1 ? request.matches[0].ucaId : null);
  }

  async function handleConfirmResolve() {
    if (!active || !selectedUcaId) return;
    setResolving(true);
    try {
      const tempPassword = generateTempPassword();
      await adminFetch(`/portal/access/${selectedUcaId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: tempPassword }),
      });
      await adminFetch(`/portal/requests/${active.id}/resolve`, { method: 'POST' });

      setRevealed({ request: active, password: tempPassword });
      setActive(null);
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al resolver la solicitud');
    } finally {
      setResolving(false);
    }
  }

  async function copyPassword() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Solicitudes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Solicitudes de usuarios (ej. &ldquo;olvidé mi contraseña&rdquo;) pendientes de revisar
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <>
          {/* ── Vista desktop: tabla ─────────────────────────────── */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Empresa(s)</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay solicitudes pendientes.
                    </TableCell>
                  </TableRow>
                )}
                {requests?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{r.description || '—'}</TableCell>
                    <TableCell>
                      {r.matches.length === 0 ? (
                        <Badge variant="secondary">Sin usuario encontrado</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {r.matches.map((m) => <Badge key={m.ucaId} variant="secondary">{m.companyName}</Badge>)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleString('es-HN')}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" disabled={r.matches.length === 0} onClick={() => openResolve(r)}>
                        <KeyRound className="size-4" /> Resolver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── Vista mobile: cards ───────────────────────────────── */}
          <div className="md:hidden flex flex-col gap-3">
            {requests?.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No hay solicitudes pendientes.</p>
            )}
            {requests?.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{r.email}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(r.createdAt).toLocaleDateString('es-HN')}</span>
                </div>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {r.matches.length === 0
                    ? <Badge variant="secondary">Sin usuario encontrado</Badge>
                    : r.matches.map((m) => <Badge key={m.ucaId} variant="secondary">{m.companyName}</Badge>)}
                </div>
                <Button size="sm" disabled={r.matches.length === 0} onClick={() => openResolve(r)}>
                  <KeyRound className="size-4" /> Resolver
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmar (+ elegir empresa si el usuario tiene más de una) */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver solicitud</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Verifica la identidad de <span className="font-medium text-foreground">{active.email}</span> antes
                de continuar -- se generará una contraseña temporal que deberás compartirle tú mismo.
              </p>
              {active.matches.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Empresa</label>
                  <select
                    value={selectedUcaId ?? ''}
                    onChange={(e) => setSelectedUcaId(Number(e.target.value))}
                    className="rounded-md border px-3 py-2 text-sm bg-background"
                  >
                    <option value="" disabled>Selecciona una empresa</option>
                    {active.matches.map((m) => (
                      <option key={m.ucaId} value={m.ucaId}>{m.companyName}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActive(null)}>Cancelar</Button>
                <Button disabled={!selectedUcaId || resolving} onClick={handleConfirmResolve}>
                  {resolving ? 'Resolviendo…' : 'Restablecer y resolver'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contraseña revelada una sola vez */}
      <Dialog open={!!revealed} onOpenChange={(open) => !open && setRevealed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contraseña restablecida</DialogTitle>
          </DialogHeader>
          {revealed && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Compártela con <span className="font-medium text-foreground">{revealed.request.email}</span> ahora
                -- no se volverá a mostrar.
              </p>
              <div className="flex items-center justify-between gap-2 rounded-md border bg-muted px-3 py-2">
                <span className="font-mono text-sm">{revealed.password}</span>
                <Button variant="ghost" size="icon-sm" onClick={copyPassword} title="Copiar">
                  {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <Button onClick={() => setRevealed(null)}>Listo</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

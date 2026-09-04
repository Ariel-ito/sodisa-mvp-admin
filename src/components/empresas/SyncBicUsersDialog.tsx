'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { RefreshCw, Loader2, UserPlus, Link2, CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banner } from '@/components/ui/Banner';
import { adminFetch, ApiError, swrFetcher } from '@/lib/api';
import { toast } from 'sonner';

interface PreviewItem {
  username: string;
  codigoBic: string | null;
  email: string;
  name: string;
  action: 'nuevo_usuario' | 'nuevo_acceso' | 'sin_cambios';
}

interface Props {
  companyId: number;
  companyName?: string;
  open: boolean;
  onClose: () => void;
  onSynced: () => void;
}

const ACTION_CONFIG: Record<PreviewItem['action'], { label: string; cls: string; Icon: typeof UserPlus }> = {
  nuevo_usuario: { label: 'Usuario nuevo + acceso', cls: 'bg-purple-50 text-purple-700 ring-purple-200', Icon: UserPlus },
  nuevo_acceso:  { label: 'Nuevo acceso',           cls: 'bg-blue-50 text-blue-700 ring-blue-200',       Icon: Link2 },
  sin_cambios:   { label: 'Sin cambios',            cls: 'bg-muted text-muted-foreground ring-muted-foreground/20', Icon: CheckCircle2 },
};

export function SyncBicUsersDialog({ companyId, companyName, open, onClose, onSynced }: Props) {
  const { data: preview, isLoading } = useSWR<PreviewItem[]>(
    open ? `/portal/companies/${companyId}/sync-users/preview` : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 0 },
  );

  const [defaultPassword, setDefaultPassword] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const items = preview ?? [];
  const nuevos     = items.filter(i => i.action === 'nuevo_usuario').length;
  const vinculados = items.filter(i => i.action === 'nuevo_acceso').length;
  const sinCambios = items.filter(i => i.action === 'sin_cambios').length;
  const pendientes = nuevos + vinculados;

  function handleClose() {
    setDefaultPassword('');
    setSyncError(null);
    onClose();
  }

  async function handleConfirm() {
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await adminFetch<{ created: number; linked: number; skipped: number }>(
        `/portal/companies/${companyId}/sync-users`,
        {
          method: 'POST',
          body: JSON.stringify(defaultPassword.trim() ? { defaultPassword: defaultPassword.trim() } : {}),
        },
      );
      toast.success(`Sincronización completada — creados: ${result.created}, vinculados: ${result.linked}, omitidos: ${result.skipped}`);
      onSynced();
      handleClose();
    } catch (err) {
      setSyncError(err instanceof ApiError ? err.message : 'Error desconocido');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sincronizar usuarios BIC{companyName ? ` — ${companyName}` : ''}</DialogTitle>
        </DialogHeader>

        <Banner
          variant="warning"
          title="Esto lee USUARIO_DE_FACTURACION en la BD remota de la empresa"
          message="Se revisan todos los usuarios de facturación (BIC) de esta empresa. Los que no existan en el portal se crean con acceso nuevo; los que ya existan pero sin acceso a esta empresa, se les agrega; los que ya tengan acceso no se tocan."
          dismissible={false}
        />

        {isLoading && (
          <div className="text-sm text-muted-foreground py-6 text-center">Consultando usuarios BIC…</div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No se encontraron usuarios en USUARIO_DE_FACTURACION para esta empresa.
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 bg-purple-50 text-purple-700 ring-purple-200">
                {nuevos} usuario{nuevos !== 1 ? 's' : ''} nuevo{nuevos !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 bg-blue-50 text-blue-700 ring-blue-200">
                {vinculados} acceso{vinculados !== 1 ? 's' : ''} nuevo{vinculados !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 bg-muted text-muted-foreground ring-muted-foreground/20">
                {sinCambios} sin cambios
              </span>
            </div>

            <div className="rounded-lg border overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium">Usuario</th>
                    <th className="text-left px-3 py-1.5 font-medium">Código BIC</th>
                    <th className="text-left px-3 py-1.5 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const cfg = ACTION_CONFIG[item.action];
                    return (
                      <tr key={item.username} className="border-t">
                        <td className="px-3 py-1.5">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.email}</p>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-xs">{item.codigoBic ?? '—'}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${cfg.cls}`}>
                            <cfg.Icon className="size-3" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pendientes > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sync-default-password">Contraseña por defecto para usuarios nuevos (opcional)</Label>
                <Input
                  id="sync-default-password"
                  type="text"
                  value={defaultPassword}
                  onChange={e => setDefaultPassword(e.target.value)}
                  placeholder="Vacío = usa la contraseña por defecto del servidor"
                />
              </div>
            )}
          </>
        )}

        {syncError && (
          <Banner variant="error" title="Error en sincronización" message={syncError} onDismiss={() => setSyncError(null)} />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={syncing}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={syncing || isLoading || pendientes === 0}
          >
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {syncing ? 'Sincronizando…' : `Confirmar sincronización (${pendientes})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

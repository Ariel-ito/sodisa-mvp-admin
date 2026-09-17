'use client';

import { useState } from 'react';
import { ShieldOff } from 'lucide-react';
import { adminFetch, ApiError } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  totpResetPath: string;
  totpEnabled: boolean;
  onSuccess: () => void;
}

/** Botón solo-ícono para resetear el 2FA de un usuario -- mismo look/patrón que LockButton.
 *  `totpResetPath` es la ruta relativa del endpoint (ej. `portal/users/${id}/totp/reset` para
 *  staff, o `${slug}/usuarios/${ucaId}/totp/reset` para un usuario de empresa). */
export function ResetTotpButton({ totpResetPath, totpEnabled, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  if (!totpEnabled) return null;

  async function handleClick() {
    if (!window.confirm('¿Resetear el 2FA de este usuario? Tendrá que configurarlo de nuevo desde su perfil.')) return;

    setLoading(true);
    try {
      await adminFetch(totpResetPath, { method: 'POST' });
      toast.success('2FA reseteado correctamente');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al resetear el 2FA');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title="Resetear 2FA"
      className="flex items-center justify-center size-7 rounded-md transition-colors disabled:opacity-40 text-muted-foreground/30 hover:text-amber-600 hover:bg-amber-50"
    >
      <ShieldOff className="size-3.5 shrink-0" />
    </button>
  );
}

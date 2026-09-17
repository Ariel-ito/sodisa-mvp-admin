'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Banner } from '@/components/ui/Banner';
import { adminFetch } from '@/lib/api';
import type { AdminUser } from '@/lib/auth';

const TOTP_MAX_POSTPONE = 3;

interface Props {
  user: AdminUser;
  /** Refleja localmente un nuevo totpPostponeCount tras posponer (sin refetch completo). */
  onPostponed: (count: number) => void;
}

/**
 * Aviso de 2FA obligatorio -- banner descartable durante el período de gracia, modal
 * bloqueante (con posponer limitado) una vez vencido. El "requerido" lo decide el
 * backend (TotpPolicyService) en cada login/refresh, no este componente.
 */
export function Totp2faGate({ user, onPostponed }: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [postponing, setPostponing] = useState(false);

  if (!user.totpSetupRequired) return null;

  const deadline = user.totpGraceUntil ? new Date(user.totpGraceUntil) : null;

  if (!user.totpGraceExpired) {
    if (dismissed) return null;
    return (
      <div className="px-4 pt-4 md:px-6">
        <Banner
          variant="warning"
          title="Tu rol requiere autenticación en dos pasos"
          message={`Actívala desde tu perfil antes del ${deadline?.toLocaleDateString('es-HN') ?? 'plazo indicado'} -- después de esa fecha no podrás posponerlo indefinidamente.`}
          onDismiss={() => setDismissed(true)}
        />
      </div>
    );
  }

  const canPostpone = (user.totpPostponeCount ?? 0) < TOTP_MAX_POSTPONE;

  async function handlePostpone() {
    setPostponing(true);
    try {
      const res = await adminFetch<{ totpPostponeCount: number }>('portal/auth/me/totp/postpone', { method: 'POST' });
      onPostponed(res.totpPostponeCount);
    } finally {
      setPostponing(false);
    }
  }

  return (
    <Dialog open onOpenChange={() => { /* no se puede cerrar clickeando afuera */ }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-600" />
            Configura tu autenticación en dos pasos
          </DialogTitle>
          <DialogDescription>
            Tu rol requiere 2FA y el período de gracia ya venció. Configúralo ahora desde tu
            perfil para seguir usando el panel con normalidad.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button className="w-full" onClick={() => router.push('/perfil')}>
            Configurar ahora
          </Button>
          {canPostpone && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              disabled={postponing}
              onClick={handlePostpone}
            >
              {postponing ? 'Posponiendo…' : `Posponer (${TOTP_MAX_POSTPONE - (user.totpPostponeCount ?? 0)} restante${TOTP_MAX_POSTPONE - (user.totpPostponeCount ?? 0) === 1 ? '' : 's'})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

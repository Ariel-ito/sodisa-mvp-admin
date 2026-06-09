'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { swrFetcher } from '@/lib/api';
import { LEGACY_ROLES, PERMISSION_LABEL_MAP } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ApiRole {
  id: number;
  name: string;
  permissions: string[];
}

function getRoleLabel(name: string): string {
  return LEGACY_ROLES.find(r => r.name === name)?.label ?? name;
}

interface PendingToggle {
  roleName: string;
  adding: boolean;
  rolePerms: string[];
}

interface Props {
  selected: string[];
  onChange: (roles: string[]) => void;
  /**
   * Called whenever the set of permissions from currently-selected roles changes.
   * Used by AccesoForm to show "pending" badges in PermisosGrid before saving.
   */
  onPendingRolePermissionsChange?: (perms: string[]) => void;
}

export function RolesSection({ selected, onChange, onPendingRolePermissionsChange }: Props) {
  const { data: apiRoles } = useSWR<ApiRole[]>('/portal/roles', swrFetcher);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  // Emit the union of all permissions from currently-selected roles for preview
  useEffect(() => {
    if (!onPendingRolePermissionsChange) return;
    const perms = new Set<string>();
    for (const roleName of selected) {
      const role = apiRoles?.find(r => r.name === roleName);
      if (role) role.permissions.forEach(p => perms.add(p));
    }
    onPendingRolePermissionsChange(Array.from(perms));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, apiRoles]);

  function handleToggle(roleName: string) {
    const adding = !selected.includes(roleName);
    const roleData = apiRoles?.find(r => r.name === roleName);
    const rolePerms = roleData?.permissions ?? [];

    // Always show a confirmation when the role has permissions
    if (rolePerms.length > 0) {
      setPending({ roleName, adding, rolePerms });
    } else {
      commitToggle(roleName, adding);
    }
  }

  function commitToggle(roleName: string, adding: boolean) {
    if (adding) {
      onChange([...selected, roleName]);
    } else {
      onChange(selected.filter(r => r !== roleName));
    }
    setPending(null);
  }

  function handleDialogClose() {
    if (!pending) return;
    commitToggle(pending.roleName, pending.adding);
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LEGACY_ROLES.map(role => (
          <div key={role.name} className="flex items-center gap-2">
            <Checkbox
              id={`role-${role.name}`}
              checked={selected.includes(role.name)}
              onCheckedChange={() => handleToggle(role.name)}
            />
            <Label htmlFor={`role-${role.name}`} className="font-normal">
              {role.label}
            </Label>
          </div>
        ))}
      </div>

      <Dialog open={pending !== null} onOpenChange={open => { if (!open) handleDialogClose(); }}>
        <DialogContent showCloseButton={false}>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {pending.adding ? 'Agregar rol' : 'Quitar rol'}
                </DialogTitle>
                <DialogDescription>
                  {pending.adding ? (
                    <>
                      El rol <strong className="text-foreground">{getRoleLabel(pending.roleName)}</strong>{' '}
                      incluye {pending.rolePerms.length} permiso(s) que se copiarán como
                      permisos directos al guardar. Podrás quitarlos individualmente después.
                    </>
                  ) : (
                    <>
                      Al quitar el rol <strong className="text-foreground">{getRoleLabel(pending.roleName)}</strong>{' '}
                      se eliminarán sus {pending.rolePerms.length} permiso(s) asociados que no
                      hayan sido modificados manualmente.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border bg-muted/40 p-3">
                {pending.rolePerms.map(p => (
                  <span key={p} className="text-xs text-muted-foreground">
                    · {PERMISSION_LABEL_MAP[p] ?? p}
                  </span>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPending(null)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => commitToggle(pending.roleName, pending.adding)}
                >
                  {pending.adding ? 'Sí, agregar rol' : 'Sí, quitar rol'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

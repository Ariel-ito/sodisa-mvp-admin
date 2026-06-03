'use client';

import { useState } from 'react';
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
  permissions: string[];
  onPermissionsChange: (perms: string[]) => void;
}

export function RolesSection({ selected, onChange, permissions, onPermissionsChange }: Props) {
  const { data: apiRoles } = useSWR<ApiRole[]>('/portal/roles', swrFetcher);
  const [pending, setPending] = useState<PendingToggle | null>(null);

  function handleToggle(roleName: string) {
    const adding = !selected.includes(roleName);
    const roleData = apiRoles?.find(r => r.name === roleName);
    const rolePerms = roleData?.permissions ?? [];

    if (rolePerms.length > 0) {
      setPending({ roleName, adding, rolePerms });
    } else {
      commitToggle(roleName, adding, false, []);
    }
  }

  function commitToggle(roleName: string, adding: boolean, syncPerms: boolean, rolePerms: string[]) {
    // Toggle the role
    if (adding) {
      onChange([...selected, roleName]);
    } else {
      onChange(selected.filter(r => r !== roleName));
    }

    // Optionally sync permissions
    if (syncPerms) {
      if (adding) {
        const toAdd = rolePerms.filter(p => !permissions.includes(p));
        onPermissionsChange([...permissions, ...toAdd]);
      } else {
        onPermissionsChange(permissions.filter(p => !rolePerms.includes(p)));
      }
    }

    setPending(null);
  }

  // Called when user dismisses dialog (Escape / backdrop) — treat as "No"
  function handleDialogClose() {
    if (!pending) return;
    commitToggle(pending.roleName, pending.adding, false, pending.rolePerms);
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
                  {pending.adding ? 'Agregar permisos del rol' : 'Quitar permisos del rol'}
                </DialogTitle>
                <DialogDescription>
                  El rol <strong className="text-foreground">{getRoleLabel(pending.roleName)}</strong>{' '}
                  incluye {pending.rolePerms.length} permiso(s).{' '}
                  {pending.adding
                    ? '¿Deseas agregarlos también a los permisos directos del usuario?'
                    : '¿Deseas quitarlos también de los permisos directos del usuario?'}
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
                  onClick={() => commitToggle(pending.roleName, pending.adding, false, pending.rolePerms)}
                >
                  No, solo el rol
                </Button>
                <Button
                  onClick={() => commitToggle(pending.roleName, pending.adding, true, pending.rolePerms)}
                >
                  Sí, {pending.adding ? 'agregar' : 'quitar'} permisos
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

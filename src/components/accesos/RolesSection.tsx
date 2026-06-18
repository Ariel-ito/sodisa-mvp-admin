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
   * Roles that were already active when the form was loaded.
   * Permissions from these roles are NOT emitted as pending — the admin already
   * decided their permission set when saving previously.
   */
  existingRoles?: string[];
  /**
   * Called whenever the set of pending permissions changes.
   * Only includes permissions from roles NEWLY added in this editing session.
   */
  onPendingRolePermissionsChange?: (perms: string[]) => void;
  /**
   * Called when a role is removed. Receives the permission codes that belong
   * exclusively to that role (not shared by any remaining active role),
   * so AccesoForm can uncheck them immediately.
   */
  onRoleRemoved?: (exclusivePerms: string[]) => void;
}

export function RolesSection({ selected, onChange, existingRoles = [], onPendingRolePermissionsChange, onRoleRemoved }: Props) {
  const { data: apiRoles } = useSWR<ApiRole[]>('/portal/roles', swrFetcher);
  const [pending, setPending] = useState<PendingToggle | null>(null);
  // Roles explicitly removed in this editing session — if re-added, treat as new
  const [removedThisSession, setRemovedThisSession] = useState<Set<string>>(new Set());

  // Emit permissions only from roles NEW in this session (never had, or removed+re-added)
  useEffect(() => {
    if (!onPendingRolePermissionsChange) return;
    const perms = new Set<string>();
    for (const roleName of selected) {
      const isNew = !existingRoles.includes(roleName) || removedThisSession.has(roleName);
      if (!isNew) continue;
      const role = apiRoles?.find(r => r.name === roleName);
      if (role) role.permissions.forEach(p => perms.add(p));
    }
    onPendingRolePermissionsChange(Array.from(perms));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, apiRoles, removedThisSession]);

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
      const newSelected = selected.filter(r => r !== roleName);
      onChange(newSelected);
      setRemovedThisSession(prev => new Set([...prev, roleName]));

      // Notify AccesoForm which permissions to uncheck: the removed role's perms
      // that are NOT covered by any of the remaining active roles.
      if (onRoleRemoved && apiRoles) {
        const removedRole = apiRoles.find(r => r.name === roleName);
        if (removedRole) {
          const otherPerms = new Set(
            newSelected.flatMap(r => apiRoles.find(ar => ar.name === r)?.permissions ?? []),
          );
          const exclusive = removedRole.permissions.filter(p => !otherPerms.has(p));
          if (exclusive.length > 0) onRoleRemoved(exclusive);
        }
      }
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

'use client';

import { PERMISSION_MODULES } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
  selected: string[];
  onChange: (codes: string[]) => void;
  /**
   * Permission codes that exist because a role was assigned (saved in DB with sourceRoleId).
   * These show a "ROL" badge but are fully editable — removing them only removes the
   * direct entry; if you want to restore them you re-assign the role.
   */
  fromRolePermissions?: string[];
  /**
   * Permission codes that will be added when the form is saved (pre-save preview
   * from a newly-checked role). Shown as checked + "ROL pendiente" badge but
   * NOT included in `selected` yet — locked until saved.
   */
  pendingRolePermissions?: string[];
}

export function PermisosGrid({
  selected,
  onChange,
  fromRolePermissions = [],
  pendingRolePermissions = [],
}: Props) {

  function toggle(code: string) {
    // Pending-role permissions are not in `selected` yet — ignore clicks on them
    if (pendingRolePermissions.includes(code) && !selected.includes(code)) return;
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  function toggleModule(codes: string[], allDirectSelected: boolean) {
    // Only toggle codes that are not pending (pending ones are auto-managed on save)
    const toggleable = codes.filter(c => !pendingRolePermissions.includes(c) || selected.includes(c));
    if (allDirectSelected) {
      onChange(selected.filter(c => !toggleable.includes(c)));
    } else {
      const toAdd = toggleable.filter(c => !selected.includes(c));
      onChange([...selected, ...toAdd]);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PERMISSION_MODULES.map(module => {
        const codes = module.perms.map(p => p.code);

        // A code is visually "checked" if it's direct OR pending-role
        const someChecked = codes.some(c => selected.includes(c) || pendingRolePermissions.includes(c));
        const allChecked  = codes.every(c => selected.includes(c) || pendingRolePermissions.includes(c));

        // For the module toggle: only look at non-pending codes
        const toggleable = codes.filter(c => !pendingRolePermissions.includes(c) || selected.includes(c));
        const allDirectSelected = toggleable.length > 0 && toggleable.every(c => selected.includes(c));

        return (
          <div key={module.label} className="rounded-lg border p-3 flex flex-col gap-2">
            {/* Module header */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id={`module-${module.label}`}
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onCheckedChange={() => toggleModule(codes, allDirectSelected)}
              />
              <Label htmlFor={`module-${module.label}`} className="font-semibold text-xs uppercase tracking-wide">
                {module.label}
              </Label>
            </div>

            {/* Individual permissions */}
            <div className="flex flex-col gap-1.5">
              {module.perms.map(perm => {
                const isDirect   = selected.includes(perm.code);
                const isFromRole = fromRolePermissions.includes(perm.code);
                const isPending  = pendingRolePermissions.includes(perm.code) && !isDirect;
                const isChecked  = isDirect || isPending;

                return (
                  <div key={perm.code} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm.code}`}
                      checked={isChecked}
                      disabled={isPending}  // locked only when pending (pre-save)
                      onCheckedChange={() => toggle(perm.code)}
                    />
                    <Label
                      htmlFor={`perm-${perm.code}`}
                      className={`font-normal text-xs ${isPending ? 'text-muted-foreground select-none' : ''}`}
                    >
                      {perm.label}
                      {/* Post-save: came from a role, but fully editable */}
                      {isFromRole && !isPending && (
                        <span
                          className="ml-1.5 inline-block text-[9px] font-semibold tracking-wide text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-px"
                          title="Este permiso fue asignado desde un rol. Puedes quitarlo manualmente."
                        >
                          ROL
                        </span>
                      )}
                      {/* Pre-save: pending from newly-assigned role */}
                      {isPending && (
                        <span
                          className="ml-1.5 inline-block text-[9px] font-semibold tracking-wide text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-px"
                          title="Se agregará al guardar (viene del rol que acabas de asignar)."
                        >
                          ROL +
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

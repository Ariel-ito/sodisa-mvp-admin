'use client';

import { PERMISSION_MODULES, COMPANY_MODULE_MAP } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
  selected: string[];
  onChange: (codes: string[]) => void;
  /**
   * Permission codes that exist because a role was assigned (saved in DB with sourceRoleId).
   * These show a "ROL ×" badge but are fully editable.
   */
  fromRolePermissions?: string[];
  /**
   * Permission codes from currently-selected roles that are not yet direct permissions.
   * Shown as checked with "ROL +" badge. User can uncheck them to exclude.
   */
  pendingRolePermissions?: string[];
  /**
   * Subset of pendingRolePermissions that the user explicitly unchecked.
   * These won't be added on save.
   */
  excludedPendingPerms?: string[];
  /** Called when user toggles a pending permission's exclusion. */
  onExcludedChange?: (excluded: string[]) => void;
  /**
   * Active module keys for this company (from company_modules table).
   * When provided and non-empty, permission groups for inactive modules are shown
   * greyed-out and non-interactive.
   */
  companyModules?: string[];
}

/** All permission module prefixes controlled by the company_modules table */
const CONTROLLED_PREFIXES = new Set(Object.values(COMPANY_MODULE_MAP).flat());

/**
 * Returns the set of permission module prefixes that are ACTIVE for the given
 * company modules. Returns null when no company modules are configured (= all active).
 */
function resolveActivePrefixes(companyModules?: string[]): Set<string> | null {
  if (!companyModules || companyModules.length === 0) return null;
  return new Set(companyModules.flatMap((cm) => COMPANY_MODULE_MAP[cm] ?? []));
}

export function PermisosGrid({
  selected,
  onChange,
  fromRolePermissions = [],
  pendingRolePermissions = [],
  excludedPendingPerms = [],
  onExcludedChange,
  companyModules,
}: Props) {
  const activePrefixes = resolveActivePrefixes(companyModules);

  function toggle(code: string) {
    // Pending perm not yet in selected: toggle its exclusion instead of adding to selected
    if (pendingRolePermissions.includes(code) && !selected.includes(code)) {
      if (excludedPendingPerms.includes(code)) {
        onExcludedChange?.(excludedPendingPerms.filter(c => c !== code));
      } else {
        onExcludedChange?.([...excludedPendingPerms, code]);
      }
      return;
    }
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  function isVisuallyChecked(code: string): boolean {
    return selected.includes(code) ||
      (pendingRolePermissions.includes(code) && !excludedPendingPerms.includes(code));
  }

  function toggleModule(codes: string[], allVisuallyChecked: boolean) {
    if (allVisuallyChecked) {
      // Uncheck all: remove direct perms and exclude pending ones
      onChange(selected.filter(c => !codes.includes(c)));
      const toExclude = codes.filter(c => pendingRolePermissions.includes(c) && !selected.includes(c));
      if (toExclude.length > 0) {
        onExcludedChange?.([...new Set([...excludedPendingPerms, ...toExclude])]);
      }
    } else {
      // Check all: add direct perms and un-exclude pending ones
      const toAdd = codes.filter(c => !selected.includes(c) && !pendingRolePermissions.includes(c));
      onChange([...selected, ...toAdd]);
      const toUnexclude = codes.filter(c => pendingRolePermissions.includes(c) && excludedPendingPerms.includes(c));
      if (toUnexclude.length > 0) {
        onExcludedChange?.(excludedPendingPerms.filter(c => !toUnexclude.includes(c)));
      }
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PERMISSION_MODULES.map(module => {
        const prefix = module.perms[0]?.code.split('.')[0] ?? '';

        // Locked when company has modules configured and this group's prefix is
        // controlled (mapped to a company module) but that module is not active.
        const isLocked = activePrefixes !== null
          && CONTROLLED_PREFIXES.has(prefix)
          && !activePrefixes.has(prefix);

        const codes = module.perms.map(p => p.code);

        const someChecked      = codes.some(c => isVisuallyChecked(c));
        const allVisuallyChecked = codes.every(c => isVisuallyChecked(c));

        return (
          <div
            key={module.label}
            className={`rounded-lg border p-3 flex flex-col gap-2 transition-opacity ${isLocked ? 'opacity-40' : ''}`}
            title={isLocked ? 'Este módulo no está habilitado para esta empresa' : undefined}
          >
            {/* Module header */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id={`module-${module.label}`}
                checked={allVisuallyChecked}
                indeterminate={someChecked && !allVisuallyChecked}
                disabled={isLocked}
                onCheckedChange={() => toggleModule(codes, allVisuallyChecked)}
              />
              <Label
                htmlFor={`module-${module.label}`}
                className="font-semibold text-xs uppercase tracking-wide flex-1"
              >
                {module.label}
              </Label>
              {isLocked && (
                <span className="text-[9px] font-medium text-muted-foreground border rounded px-1 py-px shrink-0">
                  No activo
                </span>
              )}
            </div>

            {/* Individual permissions */}
            <div className="flex flex-col gap-1.5">
              {module.perms.map(perm => {
                const isDirect   = selected.includes(perm.code);
                const isFromRole = fromRolePermissions.includes(perm.code);
                const isPending  = pendingRolePermissions.includes(perm.code) && !isDirect;
                const isChecked  = isVisuallyChecked(perm.code);
                const isDisabled = isLocked;

                return (
                  <div key={perm.code} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm.code}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => toggle(perm.code)}
                    />
                    <Label
                      htmlFor={`perm-${perm.code}`}
                      className={`font-normal text-xs ${isPending ? 'text-muted-foreground select-none' : ''}`}
                    >
                      {perm.label}
                      {/* Post-save: came from a role, fully editable */}
                      {isFromRole && !isPending && !isLocked && (
                        <span
                          className="ml-1.5 inline-block text-[9px] font-semibold tracking-wide text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-px cursor-pointer"
                          title="Vino de un rol — puedes desmarcarlo para quitarlo manualmente."
                        >
                          ROL ×
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

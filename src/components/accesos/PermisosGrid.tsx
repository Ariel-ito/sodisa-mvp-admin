'use client';

import { PERMISSION_MODULES } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export function PermisosGrid({ selected, onChange }: Props) {
  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter(c => c !== code));
    } else {
      onChange([...selected, code]);
    }
  }

  function toggleModule(codes: string[], allSelected: boolean) {
    if (allSelected) {
      onChange(selected.filter(c => !codes.includes(c)));
    } else {
      const toAdd = codes.filter(c => !selected.includes(c));
      onChange([...selected, ...toAdd]);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PERMISSION_MODULES.map(module => {
        const codes = module.perms.map(p => p.code);
        const allSelected = codes.every(c => selected.includes(c));
        const someSelected = codes.some(c => selected.includes(c));
        return (
          <div key={module.label} className="rounded-lg border p-3 flex flex-col gap-2">
            {/* Module header */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Checkbox
                id={`module-${module.label}`}
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={() => toggleModule(codes, allSelected)}
              />
              <Label htmlFor={`module-${module.label}`} className="font-semibold text-xs uppercase tracking-wide">
                {module.label}
              </Label>
            </div>
            {/* Individual permissions */}
            <div className="flex flex-col gap-1.5">
              {module.perms.map(perm => (
                <div key={perm.code} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${perm.code}`}
                    checked={selected.includes(perm.code)}
                    onCheckedChange={() => toggle(perm.code)}
                  />
                  <Label htmlFor={`perm-${perm.code}`} className="font-normal text-xs">
                    {perm.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

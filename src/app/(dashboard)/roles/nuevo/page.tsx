import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RolPermsForm } from '@/components/roles/RolPermsForm';

export default function NuevoRolPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href="/roles" className="hover:text-foreground">Roles</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Nuevo</span>
        </nav>
        <h1 className="text-2xl font-semibold">Nuevo rol</h1>
      </div>
      <RolPermsForm mode="create" />
    </div>
  );
}

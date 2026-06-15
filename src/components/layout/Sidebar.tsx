'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Building2, Users, Shield, LayoutDashboard, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUser, clearToken } from '@/lib/auth';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/',         label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/empresas', label: 'Empresas',  icon: Building2 },
  { href: '/usuarios', label: 'Usuarios',  icon: Users },
  { href: '/roles',    label: 'Roles',     icon: Shield },
];

const ROLE_LABEL: Record<string, string> = {
  admin:   'Administrador',
  support: 'Soporte',
};

interface Props {
  /** Controla si el drawer está abierto en mobile */
  isOpen?: boolean;
  /** Callback para cerrar el drawer desde mobile */
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const u = getUser();
    if (u) setUser(u);
  }, []);

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  async function handleLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    clearToken();
    router.push('/login');
  }

  function handleNavClick() {
    // En mobile, cerrar el drawer al navegar
    onClose?.();
  }

  return (
    <>
      {/* ── Backdrop mobile ──────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      {/*
        Mobile: posición fixed (fuera del flow) — desliza desde la izquierda.
        Desktop (md+): posición relative dentro del flex row, siempre visible.
      */}
      <aside
        className={cn(
          'flex flex-col w-60 bg-sidebar text-sidebar-foreground shrink-0',
          // Mobile: overlay fijo + transición
          'fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: vuelve al flujo normal, siempre visible
          'md:relative md:z-auto md:translate-x-0',
        )}
      >
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className="flex h-14 items-center px-4 border-b border-sidebar-border shrink-0">
          <Image
            src="/logo-sodisa-isotipo-blanco.png"
            alt="SODISA"
            width={40}
            height={40}
            className="h-8 w-auto select-none"
            priority
          />
        </div>

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Gestión
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white'
                )}
              >
                {/* Left accent bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-accent" />
                )}
                <Icon className={cn('size-4 shrink-0 transition-colors', active ? 'text-accent' : 'text-sidebar-foreground/50 group-hover:text-accent/80')} />
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────────────────── */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            {/* Avatar — click abre perfil */}
            <Link
              href="/perfil"
              onClick={handleNavClick}
              title="Mi perfil"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-white text-xs font-semibold select-none hover:ring-2 hover:ring-accent/60 transition-all"
            >
              {initials}
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href="/perfil"
                onClick={handleNavClick}
                className="block text-sm font-medium text-sidebar-foreground truncate leading-none mb-0.5 hover:text-white transition-colors"
              >
                {user?.name ?? '…'}
              </Link>
              <span className={cn(
                'inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none',
                user?.role === 'admin'
                  ? 'bg-accent/20 text-accent'
                  : 'bg-blue-500/20 text-blue-300',
              )}>
                {user ? (ROLE_LABEL[user.role] ?? user.role) : '…'}
              </span>
            </div>

            {/* Perfil icon */}
            <Link
              href="/perfil"
              onClick={handleNavClick}
              title="Mi perfil"
              className="shrink-0 flex size-7 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <UserCircle className="size-3.5" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="shrink-0 flex size-7 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import type { SafeAdminUser } from "@/types/admin-user";

type UserRowActionsProps = {
  user: SafeAdminUser;
  isInactive: boolean;
  onEdit: (user: SafeAdminUser) => void;
  onDeactivate: (user: SafeAdminUser) => void;
};

export function UserRowActions({
  user,
  isInactive,
  onEdit,
  onDeactivate,
}: UserRowActionsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex justify-end">
      <button
        type="button"
        aria-label={`Actions for ${user.email}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <span className="text-lg leading-none" aria-hidden>
          ⋯
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-1 min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="menuitem"
            disabled={isInactive}
            title={isInactive ? "Inactive users cannot be edited" : undefined}
            className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => {
              if (isInactive) return;
              setOpen(false);
              onEdit(user);
            }}
          >
            Edit user
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={isInactive}
            title={isInactive ? "User is already inactive" : undefined}
            className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
            onClick={() => {
              if (isInactive) return;
              setOpen(false);
              onDeactivate(user);
            }}
          >
            Deactivate account
          </button>
        </div>
      ) : null}
    </div>
  );
}

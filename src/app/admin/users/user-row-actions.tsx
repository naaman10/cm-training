"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { SafeAdminUser } from "@/types/admin-user";

type UserRowActionsProps = {
  user: SafeAdminUser;
  isInactive: boolean;
  isCurrentUser: boolean;
  onEdit: (user: SafeAdminUser) => void;
  onResetPassword: (user: SafeAdminUser) => void;
  onDeactivate: (user: SafeAdminUser) => void;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

export function UserRowActions({
  user,
  isInactive,
  isCurrentUser,
  onEdit,
  onResetPassword,
  onDeactivate,
}: UserRowActionsProps) {
  const hasEmail = Boolean(user.email.trim());
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function computeMenuPosition(menuHeight = 132): MenuPosition | null {
    const button = buttonRef.current;
    if (!button) return null;
    const rect = button.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove =
      spaceBelow < menuHeight + gap && rect.top > menuHeight + gap;

    return {
      top: openAbove ? rect.top - menuHeight - gap : rect.bottom + gap,
      left: Math.max(8, rect.right - 176),
      minWidth: 176,
    };
  }

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const next = computeMenuPosition(menuRef.current?.offsetHeight ?? 132);
      if (next) setMenuPosition(next);
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
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

  const menu =
    open && menuPosition ? (
      <div
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: menuPosition.top,
          left: menuPosition.left,
          minWidth: menuPosition.minWidth,
          zIndex: 50,
        }}
        className="rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
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
          disabled={isInactive || !hasEmail}
          title={
            !hasEmail
              ? "User has no email address"
              : isInactive
                ? "Inactive users cannot receive password resets"
                : undefined
          }
          className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => {
            if (isInactive || !hasEmail) return;
            setOpen(false);
            onResetPassword(user);
          }}
        >
          Reset password
        </button>
        {!isCurrentUser ? (
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
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className="flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          aria-label={`Actions for ${user.email}`}
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => {
            if (open) {
              setOpen(false);
              setMenuPosition(null);
              return;
            }
            setMenuPosition(computeMenuPosition());
            setOpen(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <span className="text-lg leading-none" aria-hidden>
            ⋯
          </span>
        </button>
      </div>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </>
  );
}

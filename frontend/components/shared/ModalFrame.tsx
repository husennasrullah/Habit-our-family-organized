"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Shared dialog lifecycle for existing module forms without changing their data flow. */
export function ModalFrame({
  children,
  onClose,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== dialog,
    );
    const states = siblings.map((el) => ({ el, inert: el.inert }));
    states.forEach(({ el }) => {
      el.inert = true;
    });
    document.body.style.overflow = "hidden";
    const heading = dialog.querySelector<HTMLElement>("h1,h2,h3");
    if (heading) heading.tabIndex = -1;
    if (!dialog.hasAttribute("aria-label"))
      dialog.setAttribute(
        "aria-label",
        dialog.querySelector("h1,h2,h3")?.textContent?.trim() ||
          "Detail keluarga",
      );
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0);
    (
      heading ??
      dialog.querySelector<HTMLElement>("[autofocus]") ??
      focusable()[0] ??
      dialog
    ).focus();
    const onKey = (event: KeyboardEvent) => {
      if (dialog.inert) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close.current();
      }
      if (event.key === "Tab") {
        const controls = focusable();
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !dialog.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      states.forEach(({ el, inert }) => {
        el.inert = inert;
      });
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected && !opener.closest("[inert]")) opener.focus();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      {...props}
      className={`${props.className ?? ""} habit-dialog`}
      ref={ref}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>,
    document.body,
  );
}

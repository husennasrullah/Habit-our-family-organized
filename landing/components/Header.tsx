"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { APP_URL } from "@/lib/site";
import { Icon } from "./Icon";
const links = [
  { href: "#fitur", label: "Jelajahi fitur" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#faq", label: "Tanya jawab" },
];
export function Header() {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        menu.current &&
        !menu.current.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  useEffect(() => {
    const size = matchMedia("(min-width: 900px)");
    const close = () => setOpen(false);
    size.addEventListener("change", close);
    return () => size.removeEventListener("change", close);
  }, []);
  return (
    <header className="site-header">
      <div className="shell header-row">
        <a
          href="#beranda"
          aria-label="Habit — kembali ke beranda"
          className="brand"
        >
          <Image
            src="/brand/habit-logo.svg"
            alt="Habit"
            width={150}
            height={50}
            priority
          />
        </a>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a
            href={APP_URL}
            className="button button-primary header-cta"
            data-app-link
          >
            Buka Habit
            <Icon name="arrow-up" size={16} />
          </a>
          <button
            className="menu-toggle"
            ref={trigger}
            aria-label={open ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      <div
        className="mobile-nav"
        id="mobile-navigation"
        ref={menu}
        hidden={!open}
      >
        <nav className="shell" aria-label="Navigasi mobile">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

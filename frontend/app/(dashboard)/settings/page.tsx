"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import Link from "next/link";
import {
  Copy,
  Check,
  Users,
  Shield,
  LogOut,
  Pencil,
  Upload,
  RefreshCw,
  UserRound,
  LockKeyhole,
  Bell,
  X,
  Trash2,
  House,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { MemberAvatar } from "@/components/shared/MemberAvatar";
import { PageHeader } from "@/components/shared/PageHeader";
import { ModalFrame } from "@/components/shared/ModalFrame";
import { QueryError } from "@/components/shared/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  currentPushSubscription,
  subscribeToPush,
  supportsPush,
  unsubscribeFromPush,
} from "@/lib/pushNotification";
import type { ApiResponse, AuthUser, Family, MemberRole } from "@/types";
const roles: Record<MemberRole, string> = {
  admin: "Admin",
  member: "Anggota dewasa",
  child: "Anak",
  view_only: "Hanya lihat",
};
const colors = [
  "sky",
  "rose",
  "emerald",
  "amber",
  "violet",
  "orange",
  "teal",
  "pink",
  "indigo",
];
const colorLabels: Record<string, string> = {
  sky: "Biru langit",
  rose: "Mawar",
  emerald: "Hijau",
  amber: "Kuning hangat",
  violet: "Ungu",
  orange: "Jingga",
  teal: "Toska",
  pink: "Merah muda",
  indigo: "Nila",
  blue: "Biru",
  green: "Hijau",
  purple: "Ungu",
};
function message(
  e: unknown,
  fallback = "Perubahan belum dapat disimpan. Coba lagi.",
) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || fallback
  );
}
function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-card">
      <div className="settings-section-title">
        <span>
          {icon}
          {title}
        </span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
type Dialog =
  | { kind: "profile"; member: AuthUser }
  | { kind: "family" }
  | { kind: "rotate" }
  | { kind: "remove"; member: AuthUser }
  | { kind: "password" }
  | { kind: "logout" };
export default function SettingsPage() {
  const user = useAuthStore((s) => s.user),
    setUser = useAuthStore((s) => s.setUser);
  const { logout, isLoggingOut } = useAuth();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<Dialog | null>(null),
    [copied, setCopied] = useState(false),
    [avatarBusy, setAvatarBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const me = useQuery({
    queryKey: ["settings-me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AuthUser>>("/auth/me");
      return data.data;
    },
  });
  useEffect(() => {
    if (me.data) setUser(me.data);
  }, [me.data, setUser]);
  const family = useQuery({
    queryKey: ["family", user?.family_id, user?.role],
    enabled: !!user?.family_id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Family>>("/family");
      return data.data;
    },
  });
  const members = useQuery({
    queryKey: ["family-members", user?.family_id],
    enabled: !!user?.family_id,
    queryFn: async () => {
      const { data } =
        await api.get<ApiResponse<AuthUser[]>>("/family/members");
      return data.data;
    },
  });
  const admin = user?.role === "admin";
  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["family"] }),
      qc.invalidateQueries({ queryKey: ["family-members"] }),
      qc.invalidateQueries({ queryKey: ["settings-me"] }),
    ]);
  }
  async function avatar(f?: File) {
    if (!f) return;
    if (
      f.size > 2 * 1024 * 1024 ||
      !f.size ||
      !["image/jpeg", "image/png"].includes(f.type)
    ) {
      toast.error("Pilih foto JPG/PNG maksimal 2 MB.");
      return;
    }
    setAvatarBusy(true);
    try {
      const body = new FormData();
      body.append("file", f);
      await api.post("/family/avatar", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refresh();
      toast.success("Foto profil diperbarui");
    } catch (e) {
      toast.error(message(e));
    } finally {
      setAvatarBusy(false);
    }
  }
  async function copy() {
    const code = family.data?.invite_code;
    if (!code) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        "Kode belum tersalin. Tekan dan tahan kode untuk menyalin manual.",
      );
    }
  }
  return (
    <div className="space-y-4 min-w-0">
      <PageHeader
        title="Pengaturan"
        description="Ruangmu, keluargamu, dan hal kecil yang membuatnya nyaman."
      />
      <div className="settings-welcome">
        <span>
          <House size={25} />
        </span>
        <div>
          <h2>Nyaman untukmu. Terhubung bersama.</h2>
          <p>Atur profil, keluarga, dan keamanan akun dari satu tempat.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="space-y-4 min-w-0">
          <Section
            title="Profil saya"
            icon={<UserRound size={16} />}
            action={
              user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialog({ kind: "profile", member: user })}
                >
                  <Pencil size={14} />
                  Edit profil
                </Button>
              )
            }
          >
            {me.isError ? (
              <QueryError retry={() => void me.refetch()} />
            ) : !user ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden">
                    <MemberAvatar member={user} size={64} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold break-words">
                      {user.name}
                    </h2>
                    <p className="text-xs text-muted-foreground break-all mt-1">
                      {user.email}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="settings-pill">{roles[user.role]}</span>
                      <span className="settings-provider">
                        <Shield size={12} />
                        {user.auth_provider === "google"
                          ? "Google"
                          : user.auth_provider === "both"
                            ? "Email + Google"
                            : "Email"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={avatarBusy}
                    onClick={() => file.current?.click()}
                  >
                    <Upload size={14} />
                    Ganti foto
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    JPG/PNG · Maks. 2 MB
                  </span>
                  <input
                    aria-label="Pilih foto profil"
                    ref={file}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={avatarBusy}
                    onChange={(e) => {
                      void avatar(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
                <dl className="settings-profile-details">
                  <div>
                    <dt>Warna anggota</dt>
                    <dd>{colorLabels[user.color] || user.color}</dd>
                  </div>
                  <div>
                    <dt>Tanggal lahir</dt>
                    <dd>
                      {user.birth_date
                        ? new Date(
                            user.birth_date.slice(0, 10) + "T00:00:00",
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Belum diatur"}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </Section>
          <Section title="Tampilan" icon={<Pencil size={16} />}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Pilih suasana terang atau gelap.
              </p>
              <ThemeToggle />
            </div>
          </Section>
          <Section title="Notifikasi" icon={<Bell size={16} />}>
            <PushSettings
              enabled={user?.role === "admin" || user?.role === "member"}
              key={user?.id}
            />
          </Section>
          <Section title="Keamanan akun" icon={<LockKeyhole size={16} />}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {user?.auth_provider === "google"
                ? "Akun ini masuk melalui Google. Kelola password dan keamanan di akun Google."
                : "Password baru akan mengeluarkan perangkat lain. Perangkat ini tetap terhubung."}
            </p>
            {user?.auth_provider !== "google" ? (
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setDialog({ kind: "password" })}
              >
                Ganti password
              </Button>
            ) : (
              <a
                className="settings-text-link mt-3 inline-block"
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka keamanan Google ↗
              </a>
            )}
            <div className="settings-account-exit">
              <Button
                variant="ghost"
                loading={isLoggingOut}
                className="text-red-700 dark:text-red-300"
                onClick={() => setDialog({ kind: "logout" })}
              >
                <LogOut size={15} />
                Keluar dari perangkat ini
              </Button>
            </div>
          </Section>
        </div>
        <div className="space-y-4 min-w-0">
          <Section
            title="Keluarga"
            icon={<House size={16} />}
            action={
              admin &&
              family.data && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDialog({ kind: "family" })}
                >
                  <Pencil size={14} />
                  Edit nama
                </Button>
              )
            }
          >
            {!user?.family_id ? (
              <div className="settings-empty">
                <House size={26} />
                <p>Kamu belum bergabung dengan keluarga.</p>
                <Link className="settings-text-link" href="/onboarding">
                  Buat atau gabung keluarga →
                </Link>
              </div>
            ) : family.isLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : family.isError ? (
              <QueryError retry={() => void family.refetch()} />
            ) : family.data ? (
              <>
                <h2 className="text-base font-bold break-words">
                  {family.data.name}
                </h2>
                {admin ? (
                  <div className="settings-invite">
                    <p className="text-xs font-semibold">
                      Undang anggota keluarga
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bagikan kode hanya kepada orang yang ingin kamu undang.
                    </p>
                    <div className="settings-code">
                      <code>{family.data.invite_code || "Belum tersedia"}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void copy()}
                        disabled={!family.data.invite_code}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
                        {copied ? "Disalin" : "Salin"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {family.data.invite_expires_at
                        ? `Berlaku sampai ${new Date(family.data.invite_expires_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`
                        : "Ganti kode untuk membuat undangan baru."}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setDialog({ kind: "rotate" })}
                    >
                      <RefreshCw size={13} />
                      Ganti kode undangan
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    Hubungi admin keluarga untuk mengundang anggota baru.
                  </p>
                )}
              </>
            ) : null}
          </Section>
          {user?.family_id && (
            <Section
              title={`Anggota keluarga${members.data ? ` (${members.data.length})` : ""}`}
              icon={<Users size={16} />}
            >
              {members.isLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : members.isError ? (
                <QueryError retry={() => void members.refetch()} />
              ) : !members.data?.length ? (
                <p className="text-xs text-muted-foreground">
                  Belum ada anggota yang dapat ditampilkan.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {members.data.map((m) => (
                    <div className="settings-member" key={m.id}>
                      <div className="h-10 w-10 shrink-0">
                        <MemberAvatar member={m} size={40} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">
                          {m.name}
                          {m.id === user.id && (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              · Kamu
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {roles[m.role]}
                        </p>
                      </div>
                      {admin && (
                        <div className="flex gap-1">
                          <button
                            className="settings-icon"
                            aria-label={`Edit anggota ${m.name}`}
                            onClick={() =>
                              setDialog({ kind: "profile", member: m })
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          {m.id !== user.id && (
                            <button
                              className="settings-icon text-red-700 dark:text-red-300"
                              aria-label={`Keluarkan ${m.name}`}
                              onClick={() =>
                                setDialog({ kind: "remove", member: m })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {admin && (
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  Tambah anggota melalui kode undangan. Keluarga selalu
                  membutuhkan minimal satu admin.
                </p>
              )}
            </Section>
          )}
        </div>
      </div>
      {dialog && user && (
        <SettingsDialog
          key={dialog.kind === "profile" ? dialog.member.id : dialog.kind}
          dialog={dialog}
          user={user}
          family={family.data}
          onClose={() => setDialog(null)}
          onSaved={async () => {
            setDialog(null);
            await refresh();
          }}
          logout={logout}
        />
      )}
    </div>
  );
}
function PushSettings({ enabled }: { enabled: boolean }) {
  const [supported, setSupported] = useState<boolean | null>(null),
    [active, setActive] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      setActive(await currentPushSubscription());
    } catch {
      setError("Status notifikasi belum dapat diperiksa.");
    }
  }
  useEffect(() => {
    const available = supportsPush();
    setSupported(available);
    if (available && enabled) void load();
  }, [enabled]);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (active) await unsubscribeFromPush();
      else await subscribeToPush();
      await load();
    } catch (e) {
      setError(
        message(e, (e as Error).message || "Notifikasi belum dapat diubah."),
      );
    } finally {
      setBusy(false);
    }
  }
  if (!enabled)
    return (
      <p className="text-xs text-muted-foreground">
        Notifikasi keluarga dikelola melalui akun anggota dewasa.
      </p>
    );
  return (
    <div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Pengingat Jadwal Makan pada perangkat ini.
      </p>
      {supported === false ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Browser belum mendukung notifikasi. Di iPhone, buka melalui aplikasi
          yang ditambahkan ke layar utama.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold mt-2">
            {active ? "Notifikasi aktif" : "Notifikasi belum aktif"}
          </p>
          <Button
            variant="outline"
            className="mt-3"
            loading={busy}
            disabled={supported === null}
            onClick={() => void toggle()}
          >
            {active ? "Nonaktifkan notifikasi" : "Aktifkan notifikasi"}
          </Button>
        </>
      )}
      {error && (
        <div className="mt-2">
          <p role="alert" className="text-xs text-red-700 dark:text-red-300">
            {error}
          </p>
          <button
            className="settings-text-link mt-2"
            onClick={() => void load()}
          >
            Periksa lagi
          </button>
        </div>
      )}
    </div>
  );
}
function SettingsDialog({
  dialog,
  user,
  family,
  onClose,
  onSaved,
  logout,
}: {
  dialog: Dialog;
  user: AuthUser;
  family?: Family;
  onClose: () => void;
  onSaved: () => Promise<void>;
  logout: () => Promise<void>;
}) {
  const member = dialog.kind === "profile" ? dialog.member : null;
  const [name, setName] = useState(member?.name || family?.name || ""),
    [color, setColor] = useState(member?.color || "sky"),
    [birth, setBirth] = useState(member?.birth_date?.slice(0, 10) || ""),
    [role, setRole] = useState<MemberRole>(member?.role || "member");
  const [oldPassword, setOld] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const title = {
    profile:
      member?.id === user.id ? "Edit profil saya" : "Edit anggota keluarga",
    family: "Edit nama keluarga",
    rotate: "Ganti kode undangan?",
    remove: "Keluarkan anggota?",
    password: "Ganti password",
    logout: "Keluar dari perangkat ini?",
  }[dialog.kind];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending.current) return;
    setError("");
    if (dialog.kind === "profile" || dialog.kind === "family") {
      const valid = z
        .string()
        .trim()
        .min(2, "Nama minimal 2 karakter")
        .max(100, "Nama maksimal 100 karakter")
        .safeParse(name);
      if (!valid.success) {
        setError(valid.error.issues[0].message);
        return;
      }
    }
    if (
      dialog.kind === "password" &&
      (password.length < 8 || password !== confirm)
    ) {
      setError(
        password !== confirm
          ? "Konfirmasi password belum cocok."
          : "Password baru minimal 8 karakter.",
      );
      return;
    }
    pending.current = true;
    setSaving(true);
    try {
      switch (dialog.kind) {
        case "profile":
          await api.put(`/family/members/${dialog.member.id}`, {
            name: name.trim(),
            color,
            birth_date: birth || null,
            ...(user.role === "admin" && user.family_id ? { role } : {}),
          });
          break;
        case "family":
          await api.put("/family", { name: name.trim() });
          break;
        case "rotate":
          await api.post("/family/invite-code");
          break;
        case "remove":
          await api.delete(`/family/members/${dialog.member.id}`);
          break;
        case "password":
          await api.put("/auth/password", {
            current_password: oldPassword,
            new_password: password,
          });
          break;
        case "logout":
          await logout();
          onClose();
          return;
      }
      toast.success(
        dialog.kind === "password"
          ? "Password diperbarui; perangkat lain perlu masuk kembali."
          : "Perubahan berhasil disimpan",
      );
      await onSaved();
    } catch (e) {
      setError(message(e));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  return (
    <ModalFrame
      className="settings-overlay"
      onClose={() => {
        if (!pending.current) onClose();
      }}
    >
      <div className="settings-dialog">
        <div className="flex items-center justify-between gap-3">
          <h2>{title}</h2>
          <button
            className="settings-icon"
            disabled={saving}
            aria-label="Tutup pengaturan"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </div>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          {(dialog.kind === "profile" || dialog.kind === "family") && (
            <label className="settings-field">
              {dialog.kind === "family" ? "Nama keluarga" : "Nama lengkap"}
              <input
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={saving}
              />
            </label>
          )}
          {dialog.kind === "profile" && (
            <>
              <label className="settings-field">
                Warna anggota
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={saving}
                >
                  {colors.includes(color) ? null : (
                    <option value={color}>{color}</option>
                  )}
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="settings-field">
                Tanggal lahir (opsional)
                <input
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  disabled={saving}
                />
              </label>
              {user.role === "admin" && user.family_id && (
                <label className="settings-field">
                  Peran keluarga
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as MemberRole)}
                    disabled={saving}
                  >
                    {Object.entries(roles).map(([r, label]) => (
                      <option key={r} value={r}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <span className="settings-help">
                    Minimal satu admin harus tetap berada di keluarga.
                  </span>
                </label>
              )}
            </>
          )}
          {dialog.kind === "rotate" && (
            <p className="settings-help">
              Kode lama langsung tidak berlaku. Kode baru berlaku tujuh hari;
              bagikan ulang kepada calon anggota.
            </p>
          )}
          {dialog.kind === "remove" && (
            <p className="settings-help break-words">
              {dialog.member.name} akan kehilangan akses keluarga dan seluruh
              sesinya dicabut. Akunnya tetap ada dan dapat bergabung ke keluarga
              lain.
            </p>
          )}
          {dialog.kind === "logout" && (
            <p className="settings-help">
              Sesi dan notifikasi perangkat ini akan dinonaktifkan. Perangkat
              lain tetap terhubung.
            </p>
          )}
          {dialog.kind === "password" && (
            <>
              {[
                {
                  label: "Password saat ini",
                  value: oldPassword,
                  set: setOld,
                  complete: "current-password",
                },
                {
                  label: "Password baru",
                  value: password,
                  set: setPassword,
                  complete: "new-password",
                },
                {
                  label: "Ulangi password baru",
                  value: confirm,
                  set: setConfirm,
                  complete: "new-password",
                },
              ].map((f) => (
                <label className="settings-field" key={f.label}>
                  {f.label}
                  <input
                    type="password"
                    autoComplete={f.complete}
                    required
                    maxLength={72}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    disabled={saving}
                  />
                </label>
              ))}
              <p className="settings-help">
                Gunakan 8–72 karakter. Perangkat lain perlu masuk kembali.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="settings-dialog-actions">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" loading={saving}>
              {dialog.kind === "remove"
                ? "Keluarkan anggota"
                : dialog.kind === "rotate"
                  ? "Ganti kode"
                  : dialog.kind === "logout"
                    ? "Keluar"
                    : "Simpan perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </ModalFrame>
  );
}

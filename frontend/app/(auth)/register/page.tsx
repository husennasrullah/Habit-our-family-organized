"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    try {
      await registerUser(data.name, data.email, data.password);
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registrasi gagal, coba lagi";
      setServerError(msg);
    }
  };

  return (
    <div className="auth-form-content w-full space-y-6">
      {/* Heading */}
      <div>
        <p className="auth-form-kicker">LANGKAH KECIL PERTAMA</p>
        <h1 className="auth-form-title">
          Mulai cerita keluargamu.
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Buat akun untuk keseharian yang lebih teratur, bersama.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200"
          >
            {serverError}
          </p>
        )}

        {/* Nama */}
        <div className="space-y-1.5">
          <label
            className="auth-label"
            htmlFor="field-page-authregister-0"
          >
            Nama
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Nama lengkap"
              autoComplete="name"
              {...register("name")}
              className="auth-input pl-10 pr-4"
              id="field-page-authregister-0"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "field-page-authregister-0-error" : undefined}
            />
          </div>
          {errors.name && (
            <p id="field-page-authregister-0-error" className="text-xs text-red-600 dark:text-red-300">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            className="auth-label"
            htmlFor="field-page-authregister-1"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              {...register("email")}
              className="auth-input pl-10 pr-4"
              id="field-page-authregister-1"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "field-page-authregister-1-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="field-page-authregister-1-error" className="text-xs text-red-600 dark:text-red-300">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className="auth-label"
            htmlFor="field-page-authregister-2"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 karakter"
              autoComplete="new-password"
              {...register("password")}
              className="auth-input pl-10 pr-12"
              id="field-page-authregister-2"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "field-page-authregister-2-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="auth-password-toggle"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="field-page-authregister-2-error" className="text-xs text-red-600 dark:text-red-300">{errors.password.message}</p>
          )}
        </div>

        {/* Konfirmasi Password */}
        <div className="space-y-1.5">
          <label
            className="auth-label"
            htmlFor="field-page-authregister-3"
          >
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className="auth-input pl-10 pr-12"
              id="field-page-authregister-3"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "field-page-authregister-3-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="auth-password-toggle"
              aria-label={showConfirm ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              aria-pressed={showConfirm}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="field-page-authregister-3-error" className="text-xs text-red-600 dark:text-red-300">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          loading={isSubmitting}
          className="auth-submit w-full h-[48px] font-bold rounded-xl text-sm bg-primary-600 hover:bg-primary-700 border-0"
        >
          Buat akun Habit →
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground font-medium">
            atau lanjutkan dengan
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"}/auth/google`}
          className="flex w-full items-center justify-center gap-2.5 h-[48px] rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted hover:border-neutral-300 transition-all"
        >
          <GoogleIcon />
          Daftar dengan Google
        </a>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-bold text-primary-600 hover:underline transition-colors"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

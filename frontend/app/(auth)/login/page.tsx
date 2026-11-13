"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    try {
      const result = await login(data.email, data.password);
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (!result.member.family_id) {
        router.push("/onboarding");
      } else {
        router.push(from ?? "/dashboard");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login gagal, coba lagi";
      setServerError(msg);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Selamat datang kembali
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Masuk ke HABIT dan lanjutkan mengatur kehidupan keluargamu.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600"
          >
            {serverError}
          </p>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-bold text-foreground uppercase tracking-wide"
            htmlFor="field-page-authlogin-0"
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
              className="w-full h-[50px] rounded-xl bg-muted border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-card transition-all"
              id="field-page-authlogin-0"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className="text-xs font-bold text-foreground uppercase tracking-wide"
            htmlFor="field-page-authlogin-1"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              autoComplete="current-password"
              {...register("password")}
              className="w-full h-[50px] rounded-xl bg-muted border border-border pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-card transition-all"
              id="field-page-authlogin-1"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Sembunyikan password"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full h-[50px] font-bold rounded-xl text-sm bg-primary-600 hover:bg-primary-700 shadow-sm border-0"
        >
          Masuk ke HABIT →
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
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex w-full items-center justify-center gap-2.5 h-[48px] rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted hover:border-neutral-300 transition-all"
        >
          <GoogleIcon />
          Masuk dengan Google
        </a>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-bold text-primary-600 hover:underline transition-colors"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
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

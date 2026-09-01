"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="w-full space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Selamat Datang</h2>
        <p className="text-sm text-white/50 mt-0.5">Masuk untuk melanjutkan</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p className="rounded-lg bg-red-500/20 border border-red-400/30 px-3 py-2 text-sm text-red-200">
            {serverError}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Email</label>
          <input
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-red-300">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
          />
          {errors.password && (
            <p className="text-xs text-red-300">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full bg-[#f97316] hover:bg-[#ea6c0a] text-white font-semibold rounded-xl py-2.5 border-0"
        >
          Masuk
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-white/15" />
          <span className="text-xs text-white/30">atau</span>
          <div className="flex-1 border-t border-white/15" />
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          <GoogleIcon />
          Login dengan Google
        </a>
      </form>

      <p className="text-center text-sm text-white/40">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-white hover:text-[#f97316] transition-colors">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

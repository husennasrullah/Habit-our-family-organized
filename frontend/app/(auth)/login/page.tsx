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
      <div className="text-center mb-1">
        <h2 className="text-xl font-bold text-neutral-900">Selamat Datang</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Masuk untuk melanjutkan</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            {serverError}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-600">Email</label>
          <input
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-600">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-xl bg-white border border-neutral-200 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-colors"
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full font-semibold rounded-xl py-2.5"
        >
          Masuk
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-neutral-200" />
          <span className="text-xs text-neutral-400">atau</span>
          <div className="flex-1 border-t border-neutral-200" />
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <GoogleIcon />
          Login dengan Google
        </a>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-teal-600 hover:underline transition-colors">
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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="text-center pb-2 px-0">
        <CardTitle className="text-xl font-bold text-neutral-900">Buat Akun</CardTitle>
        <CardDescription className="text-neutral-500">Mulai kelola kehidupan keluarga bersama</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
              {serverError}
            </p>
          )}

          <div className="space-y-1">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" placeholder="Nama lengkap" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-xs text-error-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-error-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min. 8 karakter" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-xs text-error-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input id="confirmPassword" type="password" placeholder="Ulangi password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p className="text-xs text-error-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isSubmitting}>
            Daftar
          </Button>

          <div className="relative my-2 flex items-center gap-2">
            <div className="flex-1 border-t border-neutral-200" />
            <span className="text-xs text-neutral-400">atau</span>
            <div className="flex-1 border-t border-neutral-200" />
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <GoogleIcon />
            Daftar dengan Google
          </a>
        </form>
      </CardContent>

      <CardFooter className="justify-center px-0 pt-2">
        <p className="text-sm text-neutral-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-teal-600 hover:underline">
            Masuk
          </Link>
        </p>
      </CardFooter>
    </Card>
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

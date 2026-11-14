"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserPlus, ArrowLeft, Home, Key } from "lucide-react";

import { familyApi, authApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

const createSchema = z.object({
  name: z.string().min(2, "Nama keluarga minimal 2 karakter"),
});
const joinSchema = z.object({
  invite_code: z.string().min(1, "Invite code wajib diisi"),
});

type CreateForm = z.infer<typeof createSchema>;
type JoinForm = z.infer<typeof joinSchema>;
type Mode = "choose" | "create" | "join";

export default function OnboardingPage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [serverError, setServerError] = useState("");
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });
  const joinForm = useForm<JoinForm>({ resolver: zodResolver(joinSchema) });

  const refreshAndRedirect = async () => {
    try {
      await authApi.refresh();
      const { data: meRes } = await authApi.getMe();
      if (meRes.data) setUser(meRes.data);
    } catch {
      setServerError(
        "Keluarga tersimpan, tetapi sesi belum diperbarui. Muat ulang untuk mencoba lagi.",
      );
      return;
    }
    router.push("/dashboard");
  };

  const onCreateSubmit = async (data: CreateForm) => {
    setServerError("");
    try {
      await familyApi.create({ name: data.name });
      await refreshAndRedirect();
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal membuat keluarga",
      );
    }
  };

  const onJoinSubmit = async (data: JoinForm) => {
    setServerError("");
    try {
      await familyApi.join({ invite_code: data.invite_code });
      await refreshAndRedirect();
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal bergabung ke keluarga",
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Satu langkah lagi! 🎉
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Buat keluarga baru atau bergabung dengan kode undangan untuk mulai.
        </p>
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-sm text-red-600"
        >
          {serverError}
        </p>
      )}

      {/* Mode: choose */}
      {mode === "choose" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("create")}
            className="w-full flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left hover:border-primary-400 hover:bg-primary-50/50 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-bold text-foreground">Buat Keluarga Baru</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Jadilah admin dan undang anggota keluarga
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("join")}
            className="w-full flex items-center gap-4 rounded-2xl border-2 border-border bg-card p-5 text-left hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-foreground">Gabung Keluarga</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Masukkan kode undangan dari admin keluarga
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Mode: create */}
      {mode === "create" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => setMode("choose")}
              className="flex items-center gap-1 hover:text-primary-600 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali
            </button>
          </div>

          <form
            onSubmit={createForm.handleSubmit(onCreateSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold text-foreground uppercase tracking-wide"
                htmlFor="field-page-authonboarding-0"
              >
                Nama Keluarga
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  placeholder='contoh: "Keluarga Budi"'
                  {...createForm.register("name")}
                  className="w-full h-[50px] rounded-xl bg-muted border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:bg-card transition-all"
                  id="field-page-authonboarding-0"
                />
              </div>
              {createForm.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={createForm.formState.isSubmitting}
              className="w-full h-[50px] font-bold rounded-xl text-sm bg-primary-600 hover:bg-primary-700 shadow-sm border-0"
            >
              Buat Keluarga →
            </Button>
          </form>
        </div>
      )}

      {/* Mode: join */}
      {mode === "join" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => setMode("choose")}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali
            </button>
          </div>

          <form
            onSubmit={joinForm.handleSubmit(onJoinSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold text-foreground uppercase tracking-wide"
                htmlFor="field-page-authonboarding-1"
              >
                Kode Undangan
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  placeholder="contoh: ABCD-1234"
                  className="w-full h-[50px] rounded-xl bg-muted border border-border pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 focus:bg-card transition-all uppercase tracking-widest font-mono"
                  {...joinForm.register("invite_code")}
                  id="field-page-authonboarding-1"
                />
              </div>
              {joinForm.formState.errors.invite_code && (
                <p className="text-xs text-red-500">
                  {joinForm.formState.errors.invite_code.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              loading={joinForm.formState.isSubmitting}
              className="w-full h-[50px] font-bold rounded-xl text-sm bg-primary-600 hover:bg-primary-700 shadow-sm border-0"
            >
              Gabung Keluarga →
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

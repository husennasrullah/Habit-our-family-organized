"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, UserPlus } from "lucide-react";

import { familyApi } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const user = useAuthStore((s) => s.user);

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) });
  const joinForm = useForm<JoinForm>({ resolver: zodResolver(joinSchema) });

  const onCreateSubmit = async (data: CreateForm) => {
    setServerError("");
    try {
      await familyApi.create({ name: data.name });
      // Refresh user info
      if (user) {
        const { data: membersRes } = await familyApi.getMembers();
        const me = membersRes.data.find((m) => m.id === user.id);
        if (me) setUser(me);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal membuat keluarga"
      );
    }
  };

  const onJoinSubmit = async (data: JoinForm) => {
    setServerError("");
    try {
      await familyApi.join({ invite_code: data.invite_code });
      if (user) {
        const { data: membersRes } = await familyApi.getMembers();
        const me = membersRes.data.find((m) => m.id === user.id);
        if (me) setUser(me);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setServerError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal bergabung ke keluarga"
      );
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary-500 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">K</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Selamat Datang!</h1>
        <p className="text-neutral-500 mt-1 text-sm">
          Untuk memulai, buat keluarga baru atau bergabung dengan kode undangan.
        </p>
      </div>

      {serverError && (
        <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600 text-center">
          {serverError}
        </p>
      )}

      {mode === "choose" && (
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setMode("create")}
            className="flex items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white p-5 text-left hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Buat Keluarga Baru</p>
              <p className="text-sm text-neutral-500">Jadilah admin dan undang anggota keluarga</p>
            </div>
          </button>

          <button
            onClick={() => setMode("join")}
            className="flex items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white p-5 text-left hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Gabung Keluarga</p>
              <p className="text-sm text-neutral-500">Masukkan kode undangan dari admin keluarga</p>
            </div>
          </button>
        </div>
      )}

      {mode === "create" && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Keluarga Baru</CardTitle>
            <CardDescription>Kamu akan menjadi admin keluarga ini</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="family-name">Nama Keluarga</Label>
                <Input
                  id="family-name"
                  placeholder='contoh: "Keluarga Budi"'
                  {...createForm.register("name")}
                />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-error-500">
                    {createForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode("choose")}
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={createForm.formState.isSubmitting}
                >
                  Buat Keluarga
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === "join" && (
        <Card>
          <CardHeader>
            <CardTitle>Gabung Keluarga</CardTitle>
            <CardDescription>Masukkan kode undangan dari admin keluarga</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="invite-code">Kode Undangan</Label>
                <Input
                  id="invite-code"
                  placeholder="contoh: ABCD-1234"
                  className="uppercase"
                  {...joinForm.register("invite_code")}
                />
                {joinForm.formState.errors.invite_code && (
                  <p className="text-xs text-error-500">
                    {joinForm.formState.errors.invite_code.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode("choose")}
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={joinForm.formState.isSubmitting}
                >
                  Gabung
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

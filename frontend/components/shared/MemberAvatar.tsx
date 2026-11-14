"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import type { FamilyMember } from "@/types";
export function MemberAvatar({
  member,
  size = 40,
}: {
  member: Pick<FamilyMember, "name" | "role" | "avatar_url">;
  size?: number;
}) {
  const raw = member.avatar_url?.trim() || "";
  const [resolved, setResolved] = useState<{ raw: string; url: string } | null>(
    null,
  );
  const [failed, setFailed] = useState("");
  const proxy =
    raw.startsWith("/api/v1/family/members/") && raw.includes("/avatar");
  useEffect(() => {
    if (!proxy) return;
    let disposed = false;
    let url = "";
    void api
      .get<Blob>(raw.replace(/^\/api\/v1/, ""), { responseType: "blob" })
      .then((r) => {
        if (disposed) return;
        url = URL.createObjectURL(r.data);
        setResolved({ raw, url });
      })
      .catch(() => {
        if (!disposed) setFailed(raw);
      });
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [raw, proxy]);
  const fallback =
    member.role === "child"
      ? "/icons/assets-habit/logo-user-anak.png"
      : "/icons/assets-habit/logo-user-ayah.png";
  const src =
    raw && failed !== raw
      ? proxy
        ? resolved?.raw === raw
          ? resolved.url
          : fallback
        : raw
      : fallback;
  return (
    <Image
      src={src || fallback}
      alt={member.name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(raw)}
      className="h-full w-full rounded-full object-cover"
    />
  );
}

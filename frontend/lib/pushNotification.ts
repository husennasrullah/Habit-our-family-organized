import api from "@/lib/api";

export function supportsPush() {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg?.active) throw new Error("Notifikasi belum siap. Muat ulang aplikasi dan coba lagi.");
  return reg;
}

export async function currentPushSubscription() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return false;
  const { data } = await api.get<{ subscribed: boolean }>("/push/subscription", { params: { endpoint: sub.endpoint } });
  return data.subscribed;
}

export async function subscribeToPush() {
  const reg = await registration();
  const { data } = await api.get<{ public_key: string }>("/push/vapid-key");
  if (!data.public_key) throw new Error("Notifikasi belum dikonfigurasi di server.");
  let sub = await reg.pushManager.getSubscription();
  let created = false;
  if (!sub) {
    const key = data.public_key.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(window.atob(key), (c) => c.charCodeAt(0));
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
    created = true;
  }
  try {
    const json = sub.toJSON();
    await api.post("/push/subscribe", { endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth });
  } catch (error) {
    if (created) await sub.unsubscribe().catch(() => false);
    throw error;
  }
}

export async function unsubscribeFromPush() {
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  // Keep the browser subscription intact when the server cannot remove its delivery record.
  await api.delete("/push/subscribe", { data: { endpoint: sub.endpoint } });
  if (!await sub.unsubscribe()) throw new Error("Gagal menonaktifkan notifikasi browser. Coba lagi.");
}

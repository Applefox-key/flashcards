// Utility helpers go here

const API_URL = import.meta.env.VITE_API_URL ?? "https://api.learnapp.pro";

export function getAvatarUrl(img: string | undefined, userId?: number | string): string {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("blob") || img.startsWith("data:")) return img;
  const userParam = userId ? `&userid=${userId}` : "";
  return `${API_URL}/img/avatars?img=${encodeURIComponent(img)}${userParam}`;
}

"use client";

import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import { tryCreateClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type UploadProgress = {
  fileName: string;
  progress: number;
  status: "compressing" | "uploading" | "done" | "error";
  error?: string;
  path?: string;
  previewUrl?: string;
};

function extensionFromType(type: string, fileName: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("heic") || type.includes("heif")) return "jpg";
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

export async function compressImage(file: File): Promise<File> {
  if (!ALLOWED_TYPES.has(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error("JPG, PNG, WEBP(또는 지원되는 HEIC) 이미지만 업로드할 수 있습니다.");
  }

  try {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 2000,
      maxSizeMB: 1.5,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: file.type.includes("png") ? "image/png" : "image/jpeg",
    });
    return new File([compressed], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: compressed.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // HEIC may fail conversion in some browsers — fall back to original if jpeg/png/webp
    if (
      file.type.includes("jpeg") ||
      file.type.includes("jpg") ||
      file.type.includes("png") ||
      file.type.includes("webp")
    ) {
      return file;
    }
    throw new Error(
      "이 기기에서는 HEIC 변환을 지원하지 않습니다. JPG 또는 PNG로 변환 후 다시 시도해 주세요.",
    );
  }
}

export async function uploadImageToStorage(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<{ path: string; publicUrl: string }> {
  const supabase = tryCreateClient();
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않았습니다. .env.local을 확인해 주세요.");
  }

  onProgress?.(5);
  const compressed = await compressImage(file);
  onProgress?.(30);

  const ext = extensionFromType(compressed.type, compressed.name);
  const unique = `${Date.now()}-${uuidv4().slice(0, 8)}.${ext}`;
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const path = `${cleanFolder}/${unique}`;

  const { error } = await supabase.storage.from("images").upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
    contentType: compressed.type,
  });

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다. (${error.message})`);
  }

  onProgress?.(90);

  await supabase.from("media").insert({
    path,
    folder: cleanFolder,
    file_name: unique,
    mime_type: compressed.type,
    size_bytes: compressed.size,
    alt_text: "",
  });

  onProgress?.(100);

  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(path);

  return { path, publicUrl };
}

export async function deleteImageFromStorage(path: string): Promise<void> {
  const supabase = tryCreateClient();
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const { error } = await supabase.storage.from("images").remove([path]);
  if (error) {
    throw new Error(`이미지 삭제에 실패했습니다. (${error.message})`);
  }

  await supabase.from("media").delete().eq("path", path);
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

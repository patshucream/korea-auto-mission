import Image from "next/image";
import { getPublicImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  path?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackLabel?: string;
};

export function SmartImage({
  path,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
  fallbackLabel = "이미지 준비 중",
}: Props) {
  const src = getPublicImageUrl(path);

  if (!src) {
    return (
      <div className={cn("placeholder-media min-h-[220px] w-full", className)} role="img" aria-label={alt}>
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  const isLocal = src.startsWith("/");

  return (
    <div className={cn("relative overflow-hidden bg-light-gray", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        unoptimized={!isLocal && !src.includes("supabase")}
      />
    </div>
  );
}

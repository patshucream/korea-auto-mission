import type { SiteSettings } from "@/lib/types";
import { cn, telHref } from "@/lib/utils";

type Variant = "primary" | "secondary" | "naver" | "ghost";

type Props = {
  settings: SiteSettings;
  variant?: Variant;
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

export function PhoneButton({
  settings,
  variant = "primary",
  className,
  fullWidth,
  children = "전화 상담",
}: Props) {
  return (
    <a
      href={telHref(settings.phone)}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "naver" && "btn-naver",
        variant === "ghost" && "btn-ghost",
        fullWidth && "btn-full",
        className,
      )}
      aria-label={`${settings.phone}로 전화 상담`}
    >
      {children}
    </a>
  );
}

export function NaverReserveButton({
  settings,
  className,
  fullWidth,
  children = "네이버 예약",
}: Omit<Props, "variant">) {
  const href =
    settings.naver_reservation_url?.trim() ||
    settings.naver_blog_url ||
    "https://blog.naver.com/97ga074";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn btn-naver", fullWidth && "btn-full", className)}
      aria-label="네이버 예약 페이지 열기"
    >
      {children}
    </a>
  );
}

import { cn } from "@/lib/utils";

type Props = {
  rating: number;
  className?: string;
  size?: "sm" | "md";
};

export function ReviewStars({ rating, className, size = "md" }: Props) {
  const safe = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <p
      className={cn(
        "font-medium tracking-wide text-gray-300",
        size === "sm" ? "text-sm" : "text-base",
        className,
      )}
      aria-label={`별점 ${safe}점`}
    >
      <span className="text-white/90">{"★".repeat(safe)}</span>
      <span className="text-white/25">{"★".repeat(5 - safe)}</span>
    </p>
  );
}

export function ReviewStarsLight({ rating, className, size = "md" }: Props) {
  const safe = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <p
      className={cn(
        "font-medium tracking-wide",
        size === "sm" ? "text-sm" : "text-base",
        className,
      )}
      aria-label={`별점 ${safe}점`}
    >
      <span className="text-charcoal">{"★".repeat(safe)}</span>
      <span className="text-gray-300">{"★".repeat(5 - safe)}</span>
    </p>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/schemas";
import type { z } from "zod";

type Props = {
  nextPath?: string;
  configured: boolean;
};

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({ nextPath = "/admin", configured }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      next: nextPath,
    },
  });

  if (!configured) {
    return (
      <div className="rounded-[14px] border border-border bg-white p-6">
        <h1 className="text-2xl font-black">관리자 로그인</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Supabase가 아직 연결되지 않았습니다. `.env.local` 설정 후 다시 시도해 주세요.
        </p>
        <Link href="/" className="btn btn-secondary mt-6 inline-flex">
          홈페이지로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form
      className="rounded-[14px] border border-border bg-white p-6 shadow-sm"
      onSubmit={handleSubmit((values) => {
        setError(null);
        const formData = new FormData();
        formData.set("email", values.email);
        formData.set("password", values.password);
        formData.set("next", values.next || nextPath);
        startTransition(async () => {
          const result = await loginAction(formData);
          if (result?.error) setError(result.error);
        });
      })}
    >
      <h1 className="text-2xl font-black text-charcoal">관리자 로그인</h1>
      <p className="mt-2 text-muted">코리아오토미션 관리자 계정으로 로그인하세요.</p>

      <input type="hidden" {...register("next")} />

      <div className="mt-6">
        <label htmlFor="email" className="admin-label">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="admin-input"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-[var(--danger)]">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="mt-4">
        <label htmlFor="password" className="admin-label">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="admin-input"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-[var(--danger)]">{errors.password.message}</p>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}

      <button type="submit" className="btn btn-primary btn-full mt-6" disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </button>

      <Link href="/" className="btn btn-ghost btn-full mt-3">
        홈페이지로 돌아가기
      </Link>
    </form>
  );
}

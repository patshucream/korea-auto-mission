"use client";

import { useState, useTransition } from "react";
import type { Service } from "@/lib/types";
import {
  countWorksForService,
  deleteService,
  reorderServices,
  upsertService,
} from "@/lib/actions/admin";
import { ImageUploader } from "@/components/admin/ImageUploader";

type Props = {
  initialServices: Service[];
};

function emptyService(sortOrder: number): Service {
  return {
    id: "",
    title: "",
    short_description: "",
    detailed_description: "",
    image_path: null,
    sort_order: sortOrder,
    is_published: true,
  };
}

export function ServicesAdmin({ initialServices }: Props) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<Service | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startNew() {
    setError(null);
    setMessage(null);
    setEditing(emptyService(services.length + 1));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;
    const next = [...services];
    [next[index], next[target]] = [next[target], next[index]];
    setServices(next);
    startTransition(async () => {
      try {
        await reorderServices(next.map((s) => s.id));
        setMessage("표시 순서가 저장되었습니다.");
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "순서 저장에 실패했습니다.");
      }
    });
  }

  async function handleDelete(service: Service) {
    setError(null);
    setMessage(null);

    let linked = 0;
    try {
      linked = await countWorksForService(service.id);
    } catch {
      // 카운트 실패 시에도 삭제 확인은 진행
    }

    const linkedWarning =
      linked > 0
        ? `\n\n연결된 작업사례가 ${linked}건 있습니다. 작업사례는 삭제되지 않으며, 서비스 연결만 해제됩니다.`
        : "";

    if (
      !confirm(
        `"${service.title}" 서비스를 삭제할까요?${linkedWarning}\n\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteService(service.id);
        setServices((prev) => prev.filter((s) => s.id !== service.id));
        if (result.linkedWorks > 0) {
          setMessage(
            `서비스가 삭제되었습니다. 연결된 작업사례 ${result.linkedWorks}건은 유지되며 서비스 연결만 해제되었습니다.`,
          );
        } else {
          setMessage("서비스가 삭제되었습니다.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={startNew} disabled={pending}>
          정비 서비스 추가
        </button>
      </div>

      {message ? <p className="font-medium text-navy">{message}</p> : null}
      {error ? <p className="font-medium text-red-700">{error}</p> : null}

      {services.length === 0 ? (
        <p className="rounded-[12px] border border-border bg-white px-5 py-8 text-center text-muted">
          등록된 정비 서비스가 없습니다. &quot;정비 서비스 추가&quot;로 등록해 주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="card-light flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-black text-charcoal">
                  {index + 1}. {service.title}
                </p>
                <p className="text-sm text-muted">
                  {service.is_published ? "홈페이지 표시" : "비공개"} ·{" "}
                  {service.short_description || "짧은 설명 없음"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  disabled={pending || index === 0}
                  onClick={() => move(index, -1)}
                >
                  위로
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  disabled={pending || index >= services.length - 1}
                  onClick={() => move(index, 1)}
                >
                  아래로
                </button>
                <button
                  type="button"
                  className="btn btn-secondary min-h-10 text-sm"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setEditing(service);
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="btn btn-ghost min-h-10 text-sm"
                  disabled={pending}
                  onClick={() => handleDelete(service)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <form
          className="card-light space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (pending) return;
            const title = editing.title.trim();
            if (!title) {
              setError("서비스명을 입력해 주세요.");
              return;
            }
            setError(null);
            startTransition(async () => {
              try {
                await upsertService({
                  id: editing.id || undefined,
                  title,
                  short_description: editing.short_description,
                  detailed_description: editing.detailed_description,
                  image_path: editing.image_path,
                  sort_order: editing.sort_order,
                  is_published: editing.is_published,
                });
                setMessage("저장되었습니다.");
                setEditing(null);
                window.location.reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
              }
            });
          }}
        >
          <h2 className="text-xl font-black">
            {editing.id ? "정비 서비스 수정" : "정비 서비스 추가"}
          </h2>
          <label className="block">
            <span className="admin-label">서비스명</span>
            <input
              className="admin-input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              required
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="admin-label">짧은 설명</span>
            <textarea
              className="admin-textarea"
              value={editing.short_description}
              onChange={(e) =>
                setEditing({ ...editing, short_description: e.target.value })
              }
              disabled={pending}
            />
          </label>
          <label className="block">
            <span className="admin-label">상세 설명</span>
            <textarea
              className="admin-textarea min-h-36"
              value={editing.detailed_description}
              onChange={(e) =>
                setEditing({ ...editing, detailed_description: e.target.value })
              }
              disabled={pending}
            />
          </label>
          <ImageUploader
            folder="services"
            label="대표 이미지"
            value={editing.image_path}
            onChange={(v) =>
              setEditing({ ...editing, image_path: typeof v === "string" ? v : null })
            }
          />
          <label className="flex items-center gap-2 font-bold">
            <input
              type="checkbox"
              checked={editing.is_published}
              onChange={(e) =>
                setEditing({ ...editing, is_published: e.target.checked })
              }
              disabled={pending}
            />
            홈페이지 표시
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => setEditing(null)}
            >
              취소
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

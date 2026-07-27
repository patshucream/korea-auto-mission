"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { MediaItem } from "@/lib/types";
import {
  deleteMediaRecords,
  moveMediaRecords,
  moveMediaToWorkCase,
  reorderWorkCaseGallery,
  setWorkCaseRepresentative,
} from "@/lib/actions/admin";
import { getPublicImageUrl } from "@/lib/media";
import {
  estimateCompressionRatio,
  formatBytes,
  formatDateTime,
  getMediaUsage,
  workCaseDisplayTitle,
  type MediaUsageInfo,
  type WorkCaseMediaSummary,
} from "@/lib/media-usage";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminToast } from "@/components/admin/AdminToast";

type Props = {
  initialMedia: MediaItem[];
  initialUsage: [string, MediaUsageInfo][];
  initialWorks: WorkCaseMediaSummary[];
};

type SortKey = "date_desc" | "date_asc" | "name_asc" | "name_desc";
type ViewMode = "grid" | "list";
type BrowseMode = "library" | "groups";
type QuickFilter = "all" | "unused" | "representative";

type Dims = { width: number; height: number };

const KNOWN_FOLDERS: { value: string; label: string }[] = [
  { value: "all", label: "전체 폴더" },
  { value: "shop", label: "매장·정비" },
  { value: "hero", label: "히어로" },
  { value: "services", label: "정비 서비스" },
  { value: "works", label: "작업사례" },
  { value: "works/temp", label: "임시 업로드" },
  { value: "before-after/injector", label: "전후 · 인젝터" },
  { value: "before-after/intake", label: "전후 · 흡기" },
  { value: "reviews", label: "고객 후기" },
  { value: "brands", label: "브랜드" },
];

const UPLOAD_FOLDERS = KNOWN_FOLDERS.filter((f) => f.value !== "all");

function folderLabel(folder: string) {
  const known = KNOWN_FOLDERS.find((f) => f.value === folder);
  if (known) return known.label;
  if (folder.startsWith("works/") && folder !== "works/temp") {
    return `작업사례 · ${folder.slice("works/".length, "works/".length + 8)}…`;
  }
  return folder || "기타";
}

export function MediaAdmin({ initialMedia, initialUsage, initialWorks }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState(initialMedia);
  const [works, setWorks] = useState(initialWorks);
  const [usageMap, setUsageMap] = useState(() => new Map(initialUsage));
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [browseMode, setBrowseMode] = useState<BrowseMode>("library");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadFolder, setUploadFolder] = useState("shop");
  const [moveFolder, setMoveFolder] = useState("shop");
  const [targetWorkId, setTargetWorkId] = useState("");
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [dimsMap, setDimsMap] = useState<Record<string, Dims>>({});
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    setMedia(initialMedia);
    setWorks(initialWorks);
    setUsageMap(new Map(initialUsage));
  }, [initialMedia, initialWorks, initialUsage]);

  const mediaByPath = useMemo(() => {
    const map = new Map<string, MediaItem>();
    for (const item of media) map.set(item.path, item);
    return map;
  }, [media]);

  const folderOptions = useMemo(() => {
    const fromData = new Set(media.map((m) => m.folder).filter(Boolean));
    const extras = [...fromData]
      .filter((f) => !KNOWN_FOLDERS.some((k) => k.value === f))
      .sort()
      .map((f) => ({ value: f, label: folderLabel(f) }));
    return [...KNOWN_FOLDERS, ...extras];
  }, [media]);

  const activeWork = useMemo(
    () => works.find((w) => w.id === activeWorkId) || null,
    [works, activeWorkId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = media.filter((item) => {
      const usage = getMediaUsage(usageMap, item.path, item.folder);

      if (activeWorkId) {
        const work = works.find((w) => w.id === activeWorkId);
        if (!work || !work.all_image_paths.includes(item.path)) return false;
      }

      if (quickFilter === "unused" && usage.used) return false;
      if (quickFilter === "representative" && !usage.isRepresentative) return false;

      if (folderFilter !== "all") {
        if (folderFilter === "works") {
          if (item.folder === "works/temp") return false;
          if (!(item.folder === "works" || item.folder.startsWith("works/"))) return false;
        } else if (folderFilter === "works/temp") {
          if (item.folder !== "works/temp") return false;
        } else if (item.folder !== folderFilter) {
          return false;
        }
      }

      if (!q) return true;
      return (
        item.file_name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.folder.toLowerCase().includes(q) ||
        (item.alt_text || "").toLowerCase().includes(q) ||
        usage.workTitles.some((t) => t.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "date_desc") return b.created_at.localeCompare(a.created_at);
      if (sort === "date_asc") return a.created_at.localeCompare(b.created_at);
      if (sort === "name_asc") {
        return (a.file_name || a.path).localeCompare(b.file_name || b.path, "ko");
      }
      return (b.file_name || b.path).localeCompare(a.file_name || a.path, "ko");
    });

    return list;
  }, [media, query, folderFilter, sort, usageMap, quickFilter, activeWorkId, works]);

  const selectedItems = useMemo(
    () => media.filter((m) => selected.has(m.id)),
    [media, selected],
  );

  const workGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works
      .filter((w) => w.all_image_paths.length > 0)
      .filter((w) => {
        if (!q) return true;
        const title = workCaseDisplayTitle(w).toLowerCase();
        return title.includes(q) || w.title.toLowerCase().includes(q);
      })
      .sort((a, b) => workCaseDisplayTitle(a).localeCompare(workCaseDisplayTitle(b), "ko"));
  }, [works, query]);

  const stats = useMemo(() => {
    let unused = 0;
    let temp = 0;
    let linked = 0;
    let representative = 0;
    for (const item of media) {
      const u = getMediaUsage(usageMap, item.path, item.folder);
      if (!u.used) unused += 1;
      if (u.isTemp) temp += 1;
      if (u.workTitles.length > 0) linked += 1;
      if (u.isRepresentative) representative += 1;
    }
    return { total: media.length, unused, temp, linked, representative, works: works.length };
  }, [media, usageMap, works]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  function refreshAfterMutation() {
    router.refresh();
  }

  const rememberDims = useCallback((path: string, width: number, height: number) => {
    if (!width || !height) return;
    setDimsMap((prev) => {
      if (prev[path]?.width === width && prev[path]?.height === height) return prev;
      return { ...prev, [path]: { width, height } };
    });
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const allIds = filtered.map((m) => m.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) for (const id of allIds) next.delete(id);
      else for (const id of allIds) next.add(id);
      return next;
    });
  }

  function bulkDelete() {
    if (selectedItems.length === 0) return;
    const usedCount = selectedItems.filter((item) =>
      getMediaUsage(usageMap, item.path, item.folder).used,
    ).length;
    const warn =
      usedCount > 0
        ? `\n\n주의: 선택 항목 중 ${usedCount}장은 콘텐츠에 연결되어 있습니다.`
        : "";
    if (!confirm(`선택한 ${selectedItems.length}장을 삭제할까요?${warn}`)) return;

    const paths = selectedItems.map((i) => i.path);
    const ids = new Set(selectedItems.map((i) => i.id));
    startTransition(async () => {
      const result = await deleteMediaRecords(paths);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setMedia((prev) => prev.filter((m) => !ids.has(m.id)));
      setSelected(new Set());
      setPreview((p) => (p && ids.has(p.id) ? null : p));
      showToast(`${result.deleted}장을 삭제했습니다.`);
      refreshAfterMutation();
    });
  }

  function bulkMoveFolder() {
    if (selectedItems.length === 0) return;
    if (!confirm(`선택한 ${selectedItems.length}장을 "${folderLabel(moveFolder)}"로 이동할까요?`)) {
      return;
    }
    const paths = selectedItems.map((i) => i.path);
    startTransition(async () => {
      const result = await moveMediaRecords(paths, moveFolder);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setMedia((prev) =>
        prev.map((item) => {
          if (!selected.has(item.id)) return item;
          const fileName = item.path.split("/").pop() || item.file_name;
          return { ...item, folder: moveFolder, path: `${moveFolder}/${fileName}` };
        }),
      );
      setSelected(new Set());
      showToast(`${result.moved}장을 이동했습니다.`);
      refreshAfterMutation();
    });
  }

  function bulkMoveToWork() {
    if (selectedItems.length === 0) return;
    if (!targetWorkId) {
      showToast("대상 작업사례를 선택해 주세요.", "error");
      return;
    }
    const target = works.find((w) => w.id === targetWorkId);
    if (
      !confirm(
        `선택한 ${selectedItems.length}장을 "${target ? workCaseDisplayTitle(target) : "작업사례"}"로 이동할까요?`,
      )
    ) {
      return;
    }
    const paths = selectedItems.map((i) => i.path);
    startTransition(async () => {
      const result = await moveMediaToWorkCase(paths, targetWorkId);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setSelected(new Set());
      showToast(`${result.moved}장을 작업사례로 이동했습니다.`);
      refreshAfterMutation();
    });
  }

  function bulkSetRepresentative() {
    if (selectedItems.length !== 1) {
      showToast("대표사진은 이미지 1장만 선택한 뒤 변경해 주세요.", "error");
      return;
    }
    const item = selectedItems[0];
    const usage = getMediaUsage(usageMap, item.path, item.folder);
    let workId = activeWorkId || usage.workIds[0] || "";
    if (!workId && targetWorkId) workId = targetWorkId;
    if (!workId) {
      showToast("대표사진을 지정할 작업사례를 먼저 선택해 주세요.", "error");
      return;
    }
    const work = works.find((w) => w.id === workId);
    if (
      !confirm(
        `"${work ? workCaseDisplayTitle(work) : "작업사례"}"의 대표사진으로 지정할까요?`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await setWorkCaseRepresentative(workId, item.path);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setWorks((prev) =>
        prev.map((w) => {
          if (w.id !== workId) return w;
          const body = w.body_image_paths.filter((p) => p !== item.path);
          if (w.representative_image_path && w.representative_image_path !== item.path) {
            if (!body.includes(w.representative_image_path)) {
              body.unshift(w.representative_image_path);
            }
          }
          return {
            ...w,
            representative_image_path: item.path,
            body_image_paths: body,
            all_image_paths: [item.path, ...body.filter((p) => p !== item.path)],
          };
        }),
      );
      setUsageMap((prev) => {
        const next = new Map(prev);
        for (const [path, info] of next) {
          if (info.workIds.includes(workId) && info.isRepresentative) {
            next.set(path, { ...info, isRepresentative: false, isBody: true });
          }
        }
        const current = next.get(item.path) || {
          used: true,
          isRepresentative: true,
          isTemp: false,
          isBody: false,
          workTitles: work ? [work.title] : [],
          workIds: [workId],
          usedIn: ["대표사진"],
        };
        next.set(item.path, {
          ...current,
          used: true,
          isRepresentative: true,
          isBody: false,
          workIds: current.workIds.includes(workId)
            ? current.workIds
            : [...current.workIds, workId],
        });
        return next;
      });
      showToast("대표사진을 변경했습니다.");
      refreshAfterMutation();
    });
  }

  function onReorderBody(workId: string, fromPath: string, toPath: string) {
    if (!fromPath || !toPath || fromPath === toPath) return;
    const work = works.find((w) => w.id === workId);
    if (!work) return;

    // 갤러리 배열 기준으로 순서 변경 (본문 사진 중 갤러리에 있는 항목)
    const gallery = [...work.gallery_image_paths];
    const fromIdx = gallery.indexOf(fromPath);
    const toIdx = gallery.indexOf(toPath);
    if (fromIdx < 0 || toIdx < 0) {
      showToast("갤러리에 등록된 사진만 순서를 바꿀 수 있습니다.", "error");
      return;
    }
    const nextGallery = [...gallery];
    const [moved] = nextGallery.splice(fromIdx, 1);
    nextGallery.splice(toIdx, 0, moved);

    setWorks((prev) =>
      prev.map((w) => {
        if (w.id !== workId) return w;
        const body = [
          ...nextGallery,
          ...w.before_images,
          ...w.after_images,
          ...w.content_image_paths,
        ].filter((p, i, arr) => p !== w.representative_image_path && arr.indexOf(p) === i);
        return {
          ...w,
          gallery_image_paths: nextGallery,
          body_image_paths: body,
          all_image_paths: [
            ...(w.representative_image_path ? [w.representative_image_path] : []),
            ...body,
          ],
        };
      }),
    );

    startTransition(async () => {
      const result = await reorderWorkCaseGallery(workId, nextGallery);
      if (!result.ok) {
        showToast(result.error, "error");
        refreshAfterMutation();
        return;
      }
      showToast("사진 순서를 저장했습니다.");
    });
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-4">
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryChip label="전체" value={stats.total} />
        <SummaryChip label="작업사례" value={stats.works} />
        <SummaryChip label="사례 연결" value={stats.linked} />
        <SummaryChip label="대표사진" value={stats.representative} />
        <SummaryChip label="미사용" value={stats.unused} />
        <SummaryChip label="임시" value={stats.temp} />
      </div>

      {/* 보기 모드 + 빠른 필터 */}
      <section className="admin-card space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={browseMode === "library"}
              onClick={() => {
                setBrowseMode("library");
              }}
            >
              라이브러리
            </ModeButton>
            <ModeButton
              active={browseMode === "groups"}
              onClick={() => {
                setBrowseMode("groups");
                setActiveWorkId(null);
              }}
            >
              작업사례별 그룹
            </ModeButton>
          </div>
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={quickFilter === "all"}
              onClick={() => setQuickFilter("all")}
              subtle
            >
              전체
            </ModeButton>
            <ModeButton
              active={quickFilter === "unused"}
              onClick={() => {
                setQuickFilter("unused");
                setBrowseMode("library");
                setActiveWorkId(null);
              }}
              subtle
            >
              미사용만
            </ModeButton>
            <ModeButton
              active={quickFilter === "representative"}
              onClick={() => {
                setQuickFilter("representative");
                setBrowseMode("library");
                setActiveWorkId(null);
              }}
              subtle
            >
              대표사진만
            </ModeButton>
            <button
              type="button"
              className="btn btn-ghost min-h-10 px-3 text-sm"
              onClick={() => setUploadOpen((v) => !v)}
            >
              {uploadOpen ? "업로드 닫기" : "업로드"}
            </button>
          </div>
        </div>

        {activeWork ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-navy/20 bg-navy/5 px-3 py-2 text-sm">
            <span className="font-bold text-navy">{workCaseDisplayTitle(activeWork)}</span>
            <span className="text-muted">사용 사진만 보는 중</span>
            <button
              type="button"
              className="btn btn-ghost min-h-9 px-2 text-xs"
              onClick={() => setActiveWorkId(null)}
            >
              필터 해제
            </button>
          </div>
        ) : null}

        {uploadOpen ? (
          <div className="space-y-3 border-t border-border pt-3">
            <label className="block max-w-xs">
              <span className="admin-label">업로드 폴더</span>
              <select
                className="admin-select"
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
              >
                {UPLOAD_FOLDERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <ImageUploader
              folder={uploadFolder}
              multiple
              values={[]}
              onChange={() => {
                showToast("업로드되었습니다. 목록을 새로고침합니다.");
                window.location.reload();
              }}
              label="여러 장 업로드"
            />
          </div>
        ) : null}

        {browseMode === "library" ? (
          <div className="flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-end">
            <label className="block min-w-0 flex-1">
              <span className="admin-label">검색</span>
              <input
                className="admin-input"
                type="search"
                placeholder="파일명, 경로, 작업사례명"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="block w-full lg:w-44">
              <span className="admin-label">폴더</span>
              <select
                className="admin-select"
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
              >
                {folderOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block w-full lg:w-44">
              <span className="admin-label">정렬</span>
              <select
                className="admin-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="date_desc">업로드일 · 최신</option>
                <option value="date_asc">업로드일 · 오래된순</option>
                <option value="name_asc">파일명 · 가나다</option>
                <option value="name_desc">파일명 · 역순</option>
              </select>
            </label>
            <div className="flex gap-2">
              <ModeButton active={view === "grid"} onClick={() => setView("grid")} subtle>
                그리드
              </ModeButton>
              <ModeButton active={view === "list"} onClick={() => setView("list")} subtle>
                리스트
              </ModeButton>
            </div>
          </div>
        ) : (
          <label className="block border-t border-border pt-3">
            <span className="admin-label">작업사례 검색</span>
            <input
              className="admin-input"
              type="search"
              placeholder="차량명, 서비스, 제목"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        )}
      </section>

      {/* 선택 액션바 — 모바일 하단 sticky */}
      <section className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:z-auto sm:rounded-[12px] sm:border sm:p-4 sm:shadow-none sm:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="inline-flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={
                  filtered.length > 0 && filtered.every((m) => selected.has(m.id))
                }
                onChange={toggleSelectAllVisible}
                disabled={browseMode === "groups" && !activeWorkId}
              />
              전체 선택
            </label>
            <span className="text-muted">선택 {selected.size}장</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              className="admin-select min-h-10 flex-1 text-sm sm:max-w-[11rem]"
              value={moveFolder}
              onChange={(e) => setMoveFolder(e.target.value)}
              disabled={selected.size === 0 || pending}
            >
              {UPLOAD_FOLDERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost min-h-10 px-3 text-sm"
              disabled={selected.size === 0 || pending}
              onClick={bulkMoveFolder}
            >
              폴더 이동
            </button>
            <select
              className="admin-select min-h-10 flex-1 text-sm sm:max-w-[14rem]"
              value={targetWorkId}
              onChange={(e) => setTargetWorkId(e.target.value)}
              disabled={selected.size === 0 || pending}
            >
              <option value="">작업사례 선택</option>
              {works.map((w) => (
                <option key={w.id} value={w.id}>
                  {workCaseDisplayTitle(w)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost min-h-10 px-3 text-sm"
              disabled={selected.size === 0 || pending || !targetWorkId}
              onClick={bulkMoveToWork}
            >
              사례로 이동
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-10 px-3 text-sm"
              disabled={selected.size !== 1 || pending}
              onClick={bulkSetRepresentative}
            >
              대표사진 변경
            </button>
            <button
              type="button"
              className="btn min-h-10 px-3 text-sm text-danger"
              disabled={selected.size === 0 || pending}
              onClick={bulkDelete}
            >
              삭제
            </button>
          </div>
        </div>
      </section>

      {/* 본문 */}
      {browseMode === "groups" && !activeWorkId ? (
        <div className="space-y-3">
          {workGroups.length === 0 ? (
            <EmptyState text="이미지가 연결된 작업사례가 없습니다." />
          ) : (
            workGroups.map((work) => (
              <WorkGroupCard
                key={work.id}
                work={work}
                mediaByPath={mediaByPath}
                dimsMap={dimsMap}
                onRememberDims={rememberDims}
                onOpenWork={() => {
                  setActiveWorkId(work.id);
                  setBrowseMode("library");
                  setQuickFilter("all");
                }}
                onPreviewPath={(path) => {
                  const item = mediaByPath.get(path);
                  if (item) setPreview(item);
                }}
                onReorder={(from, to) => onReorderBody(work.id, from, to)}
                dragPath={dragPath}
                setDragPath={setDragPath}
              />
            ))
          )}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState text="조건에 맞는 미디어가 없습니다." />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              usage={getMediaUsage(usageMap, item.path, item.folder)}
              selected={selected.has(item.id)}
              dims={dimsMap[item.path]}
              onToggle={() => toggleSelect(item.id)}
              onPreview={() => setPreview(item)}
              onDims={(w, h) => rememberDims(item.path, w, h)}
            />
          ))}
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto">
          <div className="min-w-[720px] overflow-hidden rounded-[12px] border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-[var(--warm-white)] text-xs text-muted">
                <tr>
                  <th className="px-3 py-3 w-10" />
                  <th className="px-3 py-3">미리보기</th>
                  <th className="px-3 py-3">파일명</th>
                  <th className="px-3 py-3">용량</th>
                  <th className="px-3 py-3">해상도</th>
                  <th className="px-3 py-3">업로드일</th>
                  <th className="px-3 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const usage = getMediaUsage(usageMap, item.path, item.folder);
                  const src = getPublicImageUrl(item.path);
                  const dims = dimsMap[item.path];
                  const compression = estimateCompressionRatio(
                    item.size_bytes,
                    dims?.width,
                    dims?.height,
                  );
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-border last:border-0 ${
                        selected.has(item.id) ? "bg-navy/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="block h-14 w-20 overflow-hidden rounded-md border border-border"
                          onClick={() => setPreview(item)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src || ""}
                            alt=""
                            className="h-full w-full object-cover"
                            onLoad={(e) => {
                              const img = e.currentTarget;
                              rememberDims(item.path, img.naturalWidth, img.naturalHeight);
                            }}
                          />
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-left font-medium hover:text-navy"
                          onClick={() => setPreview(item)}
                        >
                          {item.file_name || item.path.split("/").pop()}
                        </button>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted">{item.path}</p>
                      </td>
                      <td className="px-3 py-2 text-muted">{formatBytes(item.size_bytes)}</td>
                      <td className="px-3 py-2 text-muted">
                        {dims ? `${dims.width}×${dims.height}` : "—"}
                        {compression ? (
                          <span className="mt-0.5 block text-[11px]">
                            압축 {compression.label}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted">{formatDateTime(item.created_at)}</td>
                      <td className="px-3 py-2">
                        <BadgeRow usage={usage} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview ? (
        <Lightbox
          item={preview}
          usage={getMediaUsage(usageMap, preview.path, preview.folder)}
          dims={dimsMap[preview.path]}
          onDims={(w, h) => rememberDims(preview.path, w, h)}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-border bg-white px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[11px] font-semibold text-muted sm:text-xs">{label}</p>
      <p className="mt-0.5 text-xl font-black tabular-nums text-charcoal sm:text-2xl">{value}</p>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
  subtle = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn min-h-10 px-3 text-sm ${
        active ? "btn-primary" : subtle ? "btn-ghost" : "btn-ghost"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-[12px] border border-border bg-white px-5 py-10 text-center text-muted">
      {text}
    </p>
  );
}

function BadgeRow({ usage }: { usage: MediaUsageInfo }) {
  return (
    <div className="flex flex-wrap gap-1">
      {usage.isTemp ? <Badge tone="amber">임시 업로드</Badge> : null}
      {usage.isRepresentative ? <Badge tone="navy">대표사진</Badge> : null}
      {usage.workTitles.length > 0 ? <Badge tone="green">작업사례 연결</Badge> : null}
      {!usage.used ? <Badge tone="muted">미사용</Badge> : null}
      {usage.used && usage.workTitles.length === 0 ? <Badge tone="green">사용 중</Badge> : null}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "navy" | "green" | "amber" | "muted";
}) {
  const styles =
    tone === "navy"
      ? "bg-navy/10 text-navy"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-800"
        : tone === "amber"
          ? "bg-amber-50 text-amber-800"
          : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${styles}`}>
      {children}
    </span>
  );
}

function MediaCard({
  item,
  usage,
  selected,
  dims,
  onToggle,
  onPreview,
  onDims,
}: {
  item: MediaItem;
  usage: MediaUsageInfo;
  selected: boolean;
  dims?: Dims;
  onToggle: () => void;
  onPreview: () => void;
  onDims: (w: number, h: number) => void;
}) {
  const src = getPublicImageUrl(item.path);
  const compression = estimateCompressionRatio(item.size_bytes, dims?.width, dims?.height);
  return (
    <article
      className={`overflow-hidden rounded-[12px] border bg-white ${
        selected ? "border-navy ring-2 ring-navy/20" : "border-border"
      }`}
    >
      <div className="relative">
        <button type="button" className="block w-full" onClick={onPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src || ""}
            alt={item.alt_text || item.file_name}
            className="aspect-square w-full object-cover bg-[var(--warm-white)] sm:aspect-[4/3]"
            onLoad={(e) => {
              const img = e.currentTarget;
              onDims(img.naturalWidth, img.naturalHeight);
            }}
          />
        </button>
        <label className="absolute left-2 top-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white/95 shadow-sm">
          <input type="checkbox" checked={selected} onChange={onToggle} />
        </label>
        <div className="pointer-events-none absolute bottom-2 left-2 right-2">
          <BadgeRow usage={usage} />
        </div>
      </div>
      <div className="space-y-1 p-2.5 sm:p-3">
        <button
          type="button"
          className="line-clamp-1 text-left text-xs font-bold text-charcoal hover:text-navy sm:text-sm"
          onClick={onPreview}
        >
          {item.file_name || item.path.split("/").pop()}
        </button>
        <p className="text-[11px] text-muted sm:text-xs">
          {formatBytes(item.size_bytes)} · {formatDateTime(item.created_at)}
        </p>
        <p className="text-[11px] text-muted sm:text-xs">
          {dims ? `${dims.width}×${dims.height}` : "해상도 확인 중"}
          {compression ? ` · 압축 ${compression.label}` : ""}
        </p>
      </div>
    </article>
  );
}

function WorkGroupCard({
  work,
  mediaByPath,
  dimsMap,
  onRememberDims,
  onOpenWork,
  onPreviewPath,
  onReorder,
  dragPath,
  setDragPath,
}: {
  work: WorkCaseMediaSummary;
  mediaByPath: Map<string, MediaItem>;
  dimsMap: Record<string, Dims>;
  onRememberDims: (path: string, w: number, h: number) => void;
  onOpenWork: () => void;
  onPreviewPath: (path: string) => void;
  onReorder: (from: string, to: string) => void;
  dragPath: string | null;
  setDragPath: (path: string | null) => void;
}) {
  const rep = work.representative_image_path;
  const body = work.body_image_paths;
  const title = workCaseDisplayTitle(work);

  return (
    <article className="overflow-hidden rounded-[12px] border border-border bg-white">
      <button
        type="button"
        className="flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-[var(--warm-white)] sm:flex-row sm:items-center sm:justify-between"
        onClick={onOpenWork}
      >
        <div>
          <h3 className="text-base font-black text-charcoal">{title}</h3>
          <p className="mt-0.5 text-sm text-muted">{work.title}</p>
        </div>
        <p className="text-sm font-semibold text-navy">사용된 사진 보기 →</p>
      </button>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
            ├ 대표사진
          </p>
          {rep ? (
            <Thumb
              path={rep}
              item={mediaByPath.get(rep)}
              badge="대표"
              dims={dimsMap[rep]}
              onDims={onRememberDims}
              onPreview={() => onPreviewPath(rep)}
            />
          ) : (
            <p className="text-sm text-muted">대표사진 없음</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
            ├ 본문사진 {body.length}장
            <span className="ml-2 font-medium normal-case tracking-normal">
              (갤러리 사진은 드래그로 순서 변경)
            </span>
          </p>
          {body.length === 0 ? (
            <p className="text-sm text-muted">본문사진 없음</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {body.map((path) => {
                const inGallery = work.gallery_image_paths.includes(path);
                return (
                  <div
                    key={path}
                    draggable={inGallery}
                    onDragStart={() => inGallery && setDragPath(path)}
                    onDragOver={(e) => {
                      if (inGallery) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragPath && inGallery) onReorder(dragPath, path);
                      setDragPath(null);
                    }}
                    className={inGallery ? "cursor-grab active:cursor-grabbing" : ""}
                  >
                    <Thumb
                      path={path}
                      item={mediaByPath.get(path)}
                      dims={dimsMap[path]}
                      onDims={onRememberDims}
                      onPreview={() => onPreviewPath(path)}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Thumb({
  path,
  item,
  badge,
  dims,
  onDims,
  onPreview,
  compact = false,
}: {
  path: string;
  item?: MediaItem;
  badge?: string;
  dims?: Dims;
  onDims: (path: string, w: number, h: number) => void;
  onPreview: () => void;
  compact?: boolean;
}) {
  const src = getPublicImageUrl(path);
  const compression = estimateCompressionRatio(item?.size_bytes, dims?.width, dims?.height);
  return (
    <button
      type="button"
      onClick={onPreview}
      className={`relative overflow-hidden rounded-lg border border-border bg-[var(--warm-white)] text-left ${
        compact ? "w-full" : "inline-block w-36 sm:w-44"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || ""}
        alt=""
        className={`w-full object-cover ${compact ? "aspect-square" : "aspect-[4/3]"}`}
        onLoad={(e) => {
          const img = e.currentTarget;
          onDims(path, img.naturalWidth, img.naturalHeight);
        }}
      />
      {badge ? (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      {!compact ? (
        <div className="space-y-0.5 p-2 text-[11px] text-muted">
          <p className="truncate font-medium text-charcoal">
            {item?.file_name || path.split("/").pop()}
          </p>
          <p>
            {formatBytes(item?.size_bytes)} · {item ? formatDateTime(item.created_at) : "—"}
          </p>
          <p>
            {dims ? `${dims.width}×${dims.height}` : "—"}
            {compression ? ` · ${compression.label}` : ""}
          </p>
        </div>
      ) : null}
    </button>
  );
}

function Lightbox({
  item,
  usage,
  dims,
  onDims,
  onClose,
}: {
  item: MediaItem;
  usage: MediaUsageInfo;
  dims?: Dims;
  onDims: (w: number, h: number) => void;
  onClose: () => void;
}) {
  const src = getPublicImageUrl(item.path);
  const compression = estimateCompressionRatio(item.size_bytes, dims?.width, dims?.height);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[16px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h3 className="truncate text-sm font-black sm:text-base">
            {item.file_name || "이미지 미리보기"}
          </h3>
          <button type="button" className="btn btn-ghost min-h-10 px-3 text-sm" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-black/90 p-2 sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src || ""}
            alt={item.alt_text || item.file_name}
            className="mx-auto max-h-[55vh] w-auto max-w-full object-contain sm:max-h-[65vh]"
            onLoad={(e) => {
              const img = e.currentTarget;
              onDims(img.naturalWidth, img.naturalHeight);
            }}
          />
        </div>
        <div className="max-h-[32vh] space-y-3 overflow-auto px-4 py-4 sm:max-h-none">
          <BadgeRow usage={usage} />
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Meta label="경로" value={item.path} breakAll />
            <Meta label="폴더" value={folderLabel(item.folder)} />
            <Meta label="파일 크기" value={formatBytes(item.size_bytes)} />
            <Meta label="업로드일" value={formatDateTime(item.created_at)} />
            <Meta
              label="해상도"
              value={dims ? `${dims.width} × ${dims.height}` : "불러오는 중…"}
            />
            <Meta
              label="압축률(추정)"
              value={
                compression
                  ? `${compression.label} (원본 RGB 대비)`
                  : "해상도 로드 후 표시"
              }
            />
            {usage.workTitles.length > 0 ? (
              <Meta label="연결된 작업사례" value={usage.workTitles.join(", ")} wide />
            ) : null}
            {usage.usedIn.length > 0 ? (
              <Meta label="사용처" value={usage.usedIn.join(" · ")} wide />
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  breakAll,
  wide,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={`font-medium text-charcoal ${breakAll ? "break-all" : ""}`}>{value}</dd>
    </div>
  );
}

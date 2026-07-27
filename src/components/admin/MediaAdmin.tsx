"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
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
  formatBytes,
  formatDateTime,
  getMediaUsage,
  primaryUsageBadge,
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

type BrowseMode = "works" | "folders" | "all";
type QuickFilter = "all" | "used" | "unused" | "representative" | "temp" | "temp_old";
type SortKey = "date_desc" | "date_asc" | "name_asc" | "size_desc";
type ViewMode = "grid" | "list";

const FOLDER_OPTIONS = [
  { value: "all", label: "전체 폴더" },
  { value: "works/temp", label: "임시 업로드" },
  { value: "works", label: "작업사례" },
  { value: "shop", label: "작업장" },
  { value: "hero", label: "히어로" },
  { value: "services", label: "서비스" },
  { value: "before-after/injector", label: "전후·인젝터" },
  { value: "before-after/intake", label: "전후·흡기" },
];

const PAGE_SIZE = 48;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function statusLabel(status: string) {
  if (status === "published") return "공개";
  if (status === "draft") return "임시저장";
  if (status === "private") return "비공개";
  if (status === "scheduled") return "예약";
  if (status === "trash") return "휴지통";
  return status || "—";
}

export function MediaAdmin({ initialMedia, initialUsage, initialWorks }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState(initialMedia);
  const [works, setWorks] = useState(initialWorks);
  const [usageMap, setUsageMap] = useState(() => new Map(initialUsage));
  const [browseMode, setBrowseMode] = useState<BrowseMode>("works");
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [folderFilter, setFolderFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [view, setView] = useState<ViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("shop");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [targetWorkId, setTargetWorkId] = useState("");
  const [moveFolder, setMoveFolder] = useState("shop");
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();
  const [nowTick] = useState(() => Date.now());
  const [dataSnapshot, setDataSnapshot] = useState({
    media: initialMedia,
    works: initialWorks,
    usage: initialUsage,
  });
  const filterKey = `${browseMode}|${query}|${quickFilter}|${folderFilter}|${sort}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);

  if (
    initialMedia !== dataSnapshot.media ||
    initialWorks !== dataSnapshot.works ||
    initialUsage !== dataSnapshot.usage
  ) {
    setDataSnapshot({ media: initialMedia, works: initialWorks, usage: initialUsage });
    setMedia(initialMedia);
    setWorks(initialWorks);
    setUsageMap(new Map(initialUsage));
  }

  if (filterKey !== activeFilterKey) {
    setActiveFilterKey(filterKey);
    setPage(1);
  }

  const mediaByPath = useMemo(() => {
    const map = new Map<string, MediaItem>();
    for (const m of media) map.set(m.path, m);
    return map;
  }, [media]);

  const filteredMedia = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = media.filter((item) => {
      const usage = getMediaUsage(usageMap, item.path, item.folder);
      if (quickFilter === "used" && !usage.used) return false;
      if (quickFilter === "unused" && usage.used) return false;
      if (quickFilter === "representative" && !usage.isRepresentative) return false;
      if (quickFilter === "temp" && !usage.isTemp) return false;
      if (quickFilter === "temp_old") {
        if (!usage.isTemp || usage.used) return false;
        if (nowTick - new Date(item.created_at).getTime() < SEVEN_DAYS_MS) return false;
      }
      if (folderFilter !== "all") {
        if (folderFilter === "works") {
          if (item.folder === "works/temp") return false;
          if (!(item.folder === "works" || item.folder.startsWith("works/"))) return false;
        } else if (item.folder !== folderFilter) return false;
      }
      if (!q) return true;
      return (
        item.file_name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        usage.workTitles.some((t) => t.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "date_desc") return b.created_at.localeCompare(a.created_at);
      if (sort === "date_asc") return a.created_at.localeCompare(b.created_at);
      if (sort === "size_desc") return (b.size_bytes || 0) - (a.size_bytes || 0);
      return (a.file_name || "").localeCompare(b.file_name || "", "ko");
    });
    return list;
  }, [media, usageMap, query, quickFilter, folderFilter, sort, nowTick]);

  const pagedMedia = useMemo(
    () => filteredMedia.slice(0, page * PAGE_SIZE),
    [filteredMedia, page],
  );

  const workGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works
      .filter((w) => w.all_image_paths.length > 0)
      .filter((w) => {
        if (!q) return true;
        return (
          workCaseDisplayTitle(w).toLowerCase().includes(q) ||
          w.title.toLowerCase().includes(q)
        );
      });
  }, [works, query]);

  const specialGroups = useMemo(() => {
    const unused: MediaItem[] = [];
    const temp: MediaItem[] = [];
    const home: MediaItem[] = [];
    const service: MediaItem[] = [];
    const shop: MediaItem[] = [];
    for (const item of media) {
      const u = getMediaUsage(usageMap, item.path, item.folder);
      if (u.isTemp) temp.push(item);
      else if (!u.used) unused.push(item);
      if (u.usedIn.some((l) => /홈페이지|Hero|전문성/.test(l))) home.push(item);
      if (u.usedIn.some((l) => l.startsWith("서비스"))) service.push(item);
      if (item.folder === "shop" || u.usedIn.includes("작업장 사진")) shop.push(item);
    }
    return { unused, temp, home, service, shop };
  }, [media, usageMap]);

  const selectedItems = useMemo(
    () => media.filter((m) => selected.has(m.id)),
    [media, selected],
  );

  const previewList = browseMode === "all" || browseMode === "folders" ? pagedMedia : filteredMedia;
  const previewIndex = previewPath
    ? previewList.findIndex((m) => m.path === previewPath)
    : -1;
  const previewItem = previewIndex >= 0 ? previewList[previewIndex] : null;

  function showToast(message: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(message);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkDelete() {
    if (!selectedItems.length) return;
    const used = selectedItems.filter((i) => getMediaUsage(usageMap, i.path, i.folder).used);
    if (used.length > 0) {
      const places = [
        ...new Set(used.flatMap((i) => getMediaUsage(usageMap, i.path, i.folder).usedIn)),
      ].slice(0, 8);
      showToast(
        `사용 중인 이미지 ${used.length}장은 삭제할 수 없습니다. (${places.join(", ")})`,
        "error",
      );
      return;
    }
    if (!confirm(`미사용 이미지 ${selectedItems.length}장을 삭제할까요?`)) return;
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
      showToast(`${result.deleted}장을 삭제했습니다.`);
      router.refresh();
    });
  }

  function bulkMoveFolder() {
    if (!selectedItems.length) return;
    if (
      selectedItems.some((i) => getMediaUsage(usageMap, i.path, i.folder).workIds.length > 1)
    ) {
      showToast("여러 작업사례에 연결된 이미지는 일괄 이동할 수 없습니다.", "error");
      return;
    }
    if (!confirm(`선택한 ${selectedItems.length}장을 폴더로 이동할까요?`)) return;
    startTransition(async () => {
      const result = await moveMediaRecords(
        selectedItems.map((i) => i.path),
        moveFolder,
      );
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setSelected(new Set());
      showToast(`${result.moved}장 이동 완료`);
      router.refresh();
    });
  }

  function bulkMoveToWork() {
    if (!selectedItems.length || !targetWorkId) return;
    if (!confirm("선택한 사진을 해당 작업사례에 연결할까요?")) return;
    startTransition(async () => {
      const result = await moveMediaToWorkCase(
        selectedItems.map((i) => i.path),
        targetWorkId,
      );
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      setSelected(new Set());
      showToast(`${result.moved}장 연결 완료`);
      router.refresh();
    });
  }

  function bulkSetRepresentative() {
    if (selectedItems.length !== 1) {
      showToast("대표 이미지는 정확히 1장만 선택해 주세요.", "error");
      return;
    }
    const item = selectedItems[0];
    const usage = getMediaUsage(usageMap, item.path, item.folder);
    const workId = expandedWorkId || usage.workIds[0] || targetWorkId;
    if (!workId) {
      showToast("대표로 지정할 작업사례를 선택해 주세요.", "error");
      return;
    }
    if (!confirm("이 사진을 작업사례 대표 이미지로 지정할까요?")) return;
    startTransition(async () => {
      const result = await setWorkCaseRepresentative(workId, item.path);
      if (!result.ok) {
        showToast(result.error, "error");
        return;
      }
      showToast("대표 이미지를 변경했습니다.");
      router.refresh();
    });
  }

  function onReorderGallery(workId: string, fromPath: string, toPath: string) {
    const work = works.find((w) => w.id === workId);
    if (!work) return;
    const gallery = [...work.gallery_image_paths];
    const fromIdx = gallery.indexOf(fromPath);
    const toIdx = gallery.indexOf(toPath);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...gallery];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const snapshot = works;
    setWorks((ws) =>
      ws.map((w) => (w.id === workId ? { ...w, gallery_image_paths: next } : w)),
    );
    startTransition(async () => {
      const result = await reorderWorkCaseGallery(workId, next);
      if (!result.ok) {
        setWorks(snapshot);
        showToast(result.error, "error");
        return;
      }
      showToast("순서를 저장했습니다.");
    });
  }

  useEffect(() => {
    if (previewIndex < 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPreviewPath(null);
      if (e.key === "ArrowRight" && previewIndex < previewList.length - 1) {
        setPreviewPath(previewList[previewIndex + 1].path);
      }
      if (e.key === "ArrowLeft" && previewIndex > 0) {
        setPreviewPath(previewList[previewIndex - 1].path);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIndex, previewList]);

  return (
    <div className={`media-library space-y-5 sm:pb-8 ${selected.size > 0 ? "pb-28" : "pb-6"}`}>
      <AdminToast message={toast} type={toastType} onClose={() => setToast(null)} />

      <section className="media-toolbar space-y-4 rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="block min-w-0 flex-1">
            <span className="sr-only">사진 검색</span>
            <input
              className="admin-input border-black/[0.08] bg-[#fafafa]"
              type="search"
              placeholder="작업사례·파일명 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["works", "작업사례별"],
                ["folders", "폴더별"],
                ["all", "전체"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition ${
                  browseMode === id
                    ? "bg-[#1a2744] text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setBrowseMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className="min-h-9 rounded-full px-3.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? "필터 닫기" : "필터"}
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold ${
              view === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setView("grid")}
          >
            그리드
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold ${
              view === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setView("list")}
          >
            리스트
          </button>
          <button
            type="button"
            className="min-h-9 rounded-full px-3.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100"
            onClick={() => setUploadOpen((v) => !v)}
          >
            업로드
          </button>
          {selected.size > 0 ? (
            <span className="ml-auto rounded-full bg-[#1a2744]/08 px-3 py-1.5 text-[12px] font-semibold text-[#1a2744]">
              {selected.size}장 선택됨
            </span>
          ) : null}
        </div>

        {filtersOpen ? (
          <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
            <label className="block">
              <span className="admin-label">상태</span>
              <select
                className="admin-select"
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value as QuickFilter)}
              >
                <option value="all">전체</option>
                <option value="used">사용 중</option>
                <option value="unused">미사용</option>
                <option value="representative">대표 이미지</option>
                <option value="temp">임시 업로드</option>
                <option value="temp_old">임시·7일 이상 미사용</option>
              </select>
            </label>
            <label className="block">
              <span className="admin-label">폴더</span>
              <select
                className="admin-select"
                value={folderFilter}
                onChange={(e) => setFolderFilter(e.target.value)}
              >
                {FOLDER_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="admin-label">정렬</span>
              <select
                className="admin-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="date_desc">최신순</option>
                <option value="date_asc">오래된순</option>
                <option value="name_asc">파일명</option>
                <option value="size_desc">용량</option>
              </select>
            </label>
          </div>
        ) : null}

        {uploadOpen ? (
          <div className="space-y-2 border-t border-border pt-3">
            <select
              className="admin-select max-w-xs"
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value)}
            >
              {FOLDER_OPTIONS.filter((f) => f.value !== "all").map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <ImageUploader
              folder={uploadFolder}
              multiple
              values={[]}
              label="여러 장 업로드"
              onChange={() => router.refresh()}
            />
          </div>
        ) : null}
      </section>

      {browseMode === "works" ? (
        <div className="space-y-3">
          {workGroups.map((work) => (
            <WorkAccordion
              key={work.id}
              work={work}
              mediaByPath={mediaByPath}
              usageMap={usageMap}
              expanded={expandedWorkId === work.id}
              selected={selected}
              onToggleExpand={() =>
                setExpandedWorkId((id) => (id === work.id ? null : work.id))
              }
              onSelectAll={() => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  for (const path of work.all_image_paths) {
                    const item = mediaByPath.get(path);
                    if (item) next.add(item.id);
                  }
                  return next;
                });
              }}
              onToggleItem={toggleSelect}
              onPreview={(path) => setPreviewPath(path)}
              onReorder={(from, to) => onReorderGallery(work.id, from, to)}
              dragPath={dragPath}
              setDragPath={setDragPath}
            />
          ))}
          <Bucket title="임시 업로드" items={specialGroups.temp} usageMap={usageMap} selected={selected} onToggle={toggleSelect} onPreview={setPreviewPath} />
          <Bucket title="미사용 사진" items={specialGroups.unused} usageMap={usageMap} selected={selected} onToggle={toggleSelect} onPreview={setPreviewPath} />
          <Bucket title="홈페이지 공통 이미지" items={specialGroups.home} usageMap={usageMap} selected={selected} onToggle={toggleSelect} onPreview={setPreviewPath} />
          <Bucket title="서비스 이미지" items={specialGroups.service} usageMap={usageMap} selected={selected} onToggle={toggleSelect} onPreview={setPreviewPath} />
          <Bucket title="작업장 사진" items={specialGroups.shop} usageMap={usageMap} selected={selected} onToggle={toggleSelect} onPreview={setPreviewPath} />
        </div>
      ) : (
        <div className="space-y-3">
          {pagedMedia.length === 0 ? (
            <p className="rounded-[12px] border border-border bg-white px-5 py-10 text-center text-muted">
              조건에 맞는 사진이 없습니다.
            </p>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {pagedMedia.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  usage={getMediaUsage(usageMap, item.path, item.folder)}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onPreview={() => setPreviewPath(item.path)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-border bg-white">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-[var(--warm-white)] text-xs text-muted">
                  <tr>
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2 text-left">미리보기</th>
                    <th className="px-3 py-2 text-left">파일</th>
                    <th className="px-3 py-2 text-left">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMedia.map((item) => {
                    const usage = getMediaUsage(usageMap, item.path, item.folder);
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => setPreviewPath(item.path)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getPublicImageUrl(item.path) || ""}
                              alt=""
                              loading="lazy"
                              className="h-12 w-16 rounded object-cover"
                            />
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <p className="truncate font-medium">{item.file_name}</p>
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={badgeTone(primaryUsageBadge(usage))}>
                            {primaryUsageBadge(usage)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {pagedMedia.length < filteredMedia.length ? (
            <button
              type="button"
              className="media-action-btn mx-auto block"
              onClick={() => setPage((p) => p + 1)}
            >
              더 보기 ({pagedMedia.length}/{filteredMedia.length})
            </button>
          ) : null}
        </div>
      )}

      {/* 액션바 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/95 p-3 backdrop-blur-md transition sm:static sm:rounded-2xl sm:border sm:bg-white sm:p-4 sm:backdrop-blur-none ${
          selected.size > 0
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-full opacity-0 sm:pointer-events-auto sm:translate-y-0 sm:opacity-100"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <span
            className={`min-w-[4.5rem] text-[13px] font-semibold tabular-nums ${
              selected.size > 0 ? "text-[#1a2744]" : "text-slate-400"
            }`}
          >
            {selected.size}장 선택
          </span>
          <button
            type="button"
            className="media-action-btn"
            onClick={() => setSelected(new Set())}
          >
            선택 해제
          </button>
          <select
            className="admin-select min-h-9 border-black/[0.08] sm:max-w-[10rem]"
            value={moveFolder}
            onChange={(e) => setMoveFolder(e.target.value)}
            disabled={!selected.size || pending}
          >
            {FOLDER_OPTIONS.filter((f) => f.value !== "all").map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="media-action-btn"
            disabled={!selected.size || pending}
            onClick={bulkMoveFolder}
          >
            폴더 이동
          </button>
          <select
            className="admin-select min-h-9 border-black/[0.08] sm:max-w-[14rem]"
            value={targetWorkId}
            onChange={(e) => setTargetWorkId(e.target.value)}
            disabled={!selected.size || pending}
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
            className="media-action-btn"
            disabled={!selected.size || !targetWorkId || pending}
            onClick={bulkMoveToWork}
          >
            사례에 연결
          </button>
          <button
            type="button"
            className="media-action-btn"
            disabled={selected.size !== 1 || pending}
            onClick={bulkSetRepresentative}
          >
            대표 지정
          </button>
          <a
            className={`media-action-btn ${selected.size !== 1 ? "pointer-events-none opacity-40" : ""}`}
            href={selectedItems[0] ? getPublicImageUrl(selectedItems[0].path) || "#" : "#"}
            download={selectedItems[0]?.file_name || true}
            target="_blank"
            rel="noreferrer"
          >
            다운로드
          </a>
          <button
            type="button"
            className="media-action-btn text-red-600"
            disabled={!selected.size || pending}
            onClick={bulkDelete}
          >
            삭제
          </button>
        </div>
      </div>

      {previewItem ? (
        <Lightbox
          item={previewItem}
          usage={getMediaUsage(usageMap, previewItem.path, previewItem.folder)}
          hasPrev={previewIndex > 0}
          hasNext={previewIndex < previewList.length - 1}
          onPrev={() => setPreviewPath(previewList[previewIndex - 1].path)}
          onNext={() => setPreviewPath(previewList[previewIndex + 1].path)}
          onClose={() => setPreviewPath(null)}
          onDelete={() => {
            setSelected(new Set([previewItem.id]));
            setPreviewPath(null);
            setTimeout(() => bulkDelete(), 0);
          }}
        />
      ) : null}
    </div>
  );
}

function badgeTone(label: string): "rep" | "temp" | "unused" | "used" | "home" {
  if (label.includes("대표")) return "rep";
  if (label.includes("임시")) return "temp";
  if (label.includes("미사용")) return "unused";
  if (/홈|Hero|전문성|작업장/.test(label)) return "home";
  return "used";
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "rep" | "temp" | "unused" | "used" | "home";
}) {
  const resolved = tone || "used";
  const styles =
    resolved === "rep"
      ? "bg-[#1a2744] text-white shadow-sm ring-1 ring-white/25"
      : resolved === "temp"
        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
        : resolved === "unused"
          ? "bg-slate-100 text-slate-500 ring-1 ring-slate-200/70"
          : resolved === "home"
            ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70"
            : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70";
  return (
    <span
      className={`inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[-0.01em] ${
        resolved === "rep" ? "px-2 py-[3px] text-[11px]" : ""
      } ${styles}`}
    >
      {children}
    </span>
  );
}

function MediaTile({
  item,
  usage,
  selected,
  onToggle,
  onPreview,
}: {
  item: MediaItem;
  usage: MediaUsageInfo;
  selected: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const label = primaryUsageBadge(usage);
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white transition ${
        selected
          ? "border-[#1a2744] shadow-[0_0_0_3px_rgba(26,39,68,0.14)]"
          : "border-black/[0.06] hover:border-black/12"
      }`}
    >
      <div className="relative">
        <button type="button" className="block w-full" onClick={onPreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPublicImageUrl(item.path) || ""}
            alt=""
            loading="lazy"
            className="aspect-square h-auto w-full bg-[#f4f5f7] object-cover"
          />
        </button>
        {selected ? (
          <div className="pointer-events-none absolute inset-0 bg-[#1a2744]/18" aria-hidden />
        ) : null}
        <label
          className={`absolute left-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg shadow-sm ring-1 ${
            selected
              ? "bg-[#1a2744] ring-[#1a2744]"
              : "bg-white/95 ring-black/5"
          }`}
        >
          <input
            type="checkbox"
            className={`h-3.5 w-3.5 ${selected ? "accent-white" : "accent-[#1a2744]"}`}
            checked={selected}
            onChange={onToggle}
          />
        </label>
        <span className="pointer-events-none absolute bottom-2 left-2 right-2 drop-shadow-sm">
          <Badge tone={badgeTone(label)}>{label}</Badge>
        </span>
      </div>
      <p className="mt-auto h-8 truncate px-2.5 py-2 text-[11px] font-medium leading-4 text-slate-600">
        {item.file_name || item.path.split("/").pop()}
      </p>
    </article>
  );
}

function Bucket({
  title,
  items,
  usageMap,
  selected,
  onToggle,
  onPreview,
}: {
  title: string;
  items: MediaItem[];
  usageMap: Map<string, MediaUsageInfo>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onPreview: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50/80"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-charcoal">
          {title}{" "}
          <span className="font-medium text-slate-400">({items.length})</span>
        </span>
        <span className="text-[13px] font-medium text-slate-500">{open ? "접기" : "펼치기"}</span>
      </button>
      {open ? (
        <div className="border-t border-black/[0.05] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map((item) => (
              <MediaTile
                key={item.id}
                item={item}
                usage={getMediaUsage(usageMap, item.path, item.folder)}
                selected={selected.has(item.id)}
                onToggle={() => onToggle(item.id)}
                onPreview={() => onPreview(item.path)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WorkAccordion({
  work,
  mediaByPath,
  usageMap,
  expanded,
  selected,
  onToggleExpand,
  onSelectAll,
  onToggleItem,
  onPreview,
  onReorder,
  dragPath,
  setDragPath,
}: {
  work: WorkCaseMediaSummary;
  mediaByPath: Map<string, MediaItem>;
  usageMap: Map<string, MediaUsageInfo>;
  expanded: boolean;
  selected: Set<string>;
  onToggleExpand: () => void;
  onSelectAll: () => void;
  onToggleItem: (id: string) => void;
  onPreview: (path: string) => void;
  onReorder: (from: string, to: string) => void;
  dragPath: string | null;
  setDragPath: (p: string | null) => void;
}) {
  const title = workCaseDisplayTitle(work);
  return (
    <article className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onToggleExpand}>
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-charcoal sm:text-base">
            {title}
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            {work.all_image_paths.length}장 · 대표 {work.representative_image_path ? 1 : 0} · 본문{" "}
            {work.body_image_paths.length} · 전후 {work.before_after_paths.length}
            <span className="mx-1.5 text-slate-300">·</span>
            {statusLabel(work.status)}
          </p>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button type="button" className="media-action-btn" onClick={onSelectAll}>
            전체 선택
          </button>
          <Link href={`/admin/works/${work.id}/edit`} className="media-action-btn">
            열기
          </Link>
          <button type="button" className="media-action-btn" onClick={onToggleExpand}>
            {expanded ? "접기" : "펼치기"}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="space-y-5 border-t border-black/[0.05] px-4 py-4 sm:px-5">
          <PathRow
            label="대표 이미지"
            paths={work.representative_image_path ? [work.representative_image_path] : []}
            mediaByPath={mediaByPath}
            usageMap={usageMap}
            selected={selected}
            onToggleItem={onToggleItem}
            onPreview={onPreview}
          />
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              본문 · 갤러리 드래그로 순서 변경
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {work.gallery_image_paths.map((path) => {
                const item = mediaByPath.get(path);
                if (!item) return null;
                return (
                  <div
                    key={path}
                    draggable
                    onDragStart={() => setDragPath(path)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragPath) onReorder(dragPath, path);
                      setDragPath(null);
                    }}
                  >
                    <MediaTile
                      item={item}
                      usage={getMediaUsage(usageMap, path, item.folder)}
                      selected={selected.has(item.id)}
                      onToggle={() => onToggleItem(item.id)}
                      onPreview={() => onPreview(path)}
                    />
                  </div>
                );
              })}
            </div>
            {work.body_image_paths.filter((p) => !work.gallery_image_paths.includes(p)).length > 0 ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {work.body_image_paths
                  .filter((p) => !work.gallery_image_paths.includes(p))
                  .map((path) => {
                    const item = mediaByPath.get(path);
                    if (!item) return null;
                    return (
                      <MediaTile
                        key={path}
                        item={item}
                        usage={getMediaUsage(usageMap, path, item.folder)}
                        selected={selected.has(item.id)}
                        onToggle={() => onToggleItem(item.id)}
                        onPreview={() => onPreview(path)}
                      />
                    );
                  })}
              </div>
            ) : null}
          </div>
          <PathRow
            label="전후 사진"
            paths={work.before_after_paths}
            mediaByPath={mediaByPath}
            usageMap={usageMap}
            selected={selected}
            onToggleItem={onToggleItem}
            onPreview={onPreview}
          />
        </div>
      ) : null}
    </article>
  );
}

function PathRow({
  label,
  paths,
  mediaByPath,
  usageMap,
  selected,
  onToggleItem,
  onPreview,
}: {
  label: string;
  paths: string[];
  mediaByPath: Map<string, MediaItem>;
  usageMap: Map<string, MediaUsageInfo>;
  selected: Set<string>;
  onToggleItem: (id: string) => void;
  onPreview: (path: string) => void;
}) {
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
        {label} {paths.length}
      </p>
      {paths.length === 0 ? (
        <p className="text-[13px] text-slate-400">없음</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {paths.map((path) => {
            const item = mediaByPath.get(path);
            if (!item) return null;
            return (
              <MediaTile
                key={path}
                item={item}
                usage={getMediaUsage(usageMap, path, item.folder)}
                selected={selected.has(item.id)}
                onToggle={() => onToggleItem(item.id)}
                onPreview={() => onPreview(path)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Lightbox({
  item,
  usage,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onDelete,
}: {
  item: MediaItem;
  usage: MediaUsageInfo;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const src = getPublicImageUrl(item.path);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end bg-black/70 sm:items-center sm:justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-5">
          <p className="truncate text-[14px] font-semibold tracking-[-0.01em] text-charcoal">
            {item.file_name}
          </p>
          <button type="button" className="media-action-btn" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="relative bg-[#0b0f17]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src || ""}
            alt=""
            className="mx-auto max-h-[48vh] w-auto object-contain sm:max-h-[58vh]"
          />
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              type="button"
              className="media-action-btn m-2 disabled:opacity-30"
              disabled={!hasPrev}
              onClick={onPrev}
            >
              ←
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              className="media-action-btn m-2 disabled:opacity-30"
              disabled={!hasNext}
              onClick={onNext}
            >
              →
            </button>
          </div>
        </div>
        <div className="space-y-2.5 overflow-auto px-4 py-4 text-[13px] sm:px-5">
          <p>
            <Badge tone={badgeTone(primaryUsageBadge(usage))}>
              {primaryUsageBadge(usage)}
            </Badge>
          </p>
          <p className="break-all text-slate-500">{item.path}</p>
          <p className="text-slate-500">
            {formatBytes(item.size_bytes)} · {formatDateTime(item.created_at)} ·{" "}
            {item.mime_type || "이미지"}
          </p>
          {usage.usedIn.length ? (
            <p className="text-slate-600">사용처: {usage.usedIn.join(" · ")}</p>
          ) : (
            <p className="text-slate-500">현재 미사용</p>
          )}
          {usage.workTitles.length ? (
            <p className="text-slate-600">작업사례: {usage.workTitles.join(", ")}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              className="media-action-btn"
              href={src || "#"}
              download={item.file_name}
              target="_blank"
              rel="noreferrer"
            >
              다운로드
            </a>
            <button type="button" className="media-action-btn text-red-600" onClick={onDelete}>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

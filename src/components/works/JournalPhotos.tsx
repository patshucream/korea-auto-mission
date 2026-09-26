"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { getPublicImageUrl } from "@/lib/media";
import type { JournalPhoto } from "@/lib/works/journal";
import s from "./RepairJournal.module.css";

export function JournalPhotos({ photos, title }: { photos: JournalPhoto[]; title: string }) {
  const [active,setActive]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    if(active===null)return;
    const modal=dialog.current;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    if(modal&&!modal.open)modal.showModal();
    return ()=>{document.body.style.overflow=overflow;};
  },[active]);
  const valid=photos.filter(photo=>getPublicImageUrl(photo.src));
  if(!valid.length)return null;
  const selected=active===null?null:valid[active];
  return <>
    <div className={`${s.photoGrid} ${valid.length===1?s.singlePhoto:""}`}>
      {valid.map((photo,index)=><figure key={`${photo.src}-${index}`}>
        <button type="button" onClick={()=>setActive(index)} className={s.photoButton} aria-label={`${photo.caption} 사진 크게 보기`}>
          <Image src={getPublicImageUrl(photo.src)!} alt={photo.caption} fill sizes="(max-width:700px) 100vw, 480px" className={s.photo} unoptimized={!photo.src.startsWith("/")&&!photo.src.includes("supabase")} />
          <span className={s.enlarge} aria-hidden="true">↗</span>
        </button>
        <figcaption><span>{String(index+1).padStart(2,"0")}</span>{photo.caption}</figcaption>
      </figure>)}
    </div>
    <dialog ref={dialog} className={s.lightbox} onClose={()=>setActive(null)} aria-label={`${title} 사진 확대`} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e=>{if(active===null)return;if(e.key==="ArrowRight"){e.preventDefault();setActive((active+1)%valid.length);}if(e.key==="ArrowLeft"){e.preventDefault();setActive((active+valid.length-1)%valid.length);}}}>
      {selected&&<div className={s.lightboxInner}>
        <div className={s.lightboxTop}><span>{title} · {active!+1} / {valid.length}</span><button type="button" onClick={()=>dialog.current?.close()} autoFocus>닫기 ×</button></div>
        <div className={s.lightboxImage}><Image src={getPublicImageUrl(selected.src)!} alt={selected.caption} fill sizes="95vw" className={s.photo} unoptimized /></div>
        <div className={s.lightboxBottom}><button type="button" disabled={valid.length<2} onClick={()=>setActive((active!+valid.length-1)%valid.length)} aria-label="이전 사진">←</button><p>{selected.caption}</p><button type="button" disabled={valid.length<2} onClick={()=>setActive((active!+1)%valid.length)} aria-label="다음 사진">→</button></div>
      </div>}
    </dialog>
  </>;
}

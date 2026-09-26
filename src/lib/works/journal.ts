import { sanitizeEditorHtml } from "@/lib/editor/sanitize";
import type { WorkCase } from "@/lib/types";

export type JournalPhoto = { src: string; caption: string };
export type JournalChapter = { id: string; title: string; html: string; photos: JournalPhoto[] };
export function journalText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " })[entity] || entity).replace(/\s+/g, " ").trim();
}
const escape = (text: string) => text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

/** Keep CMS text and captions intact; arrange each heading's photos into an accessible gallery. */
export function buildJournalChapters(work: WorkCase): JournalChapter[] {
  const html = sanitizeEditorHtml(work.content_html || "");
  if (!html) {
    const fields: [string, string | null | undefined][] = [["입고 증상",work.symptoms],["점검 내용",work.diagnosis],["진행한 정비",work.repair_process],["작업 정리",work.work_summary]];
    return fields.filter(([,text])=>Boolean(text?.trim())).map(([title,text],i)=>({id:`journal-step-${i+1}`,title,html:`<p>${escape(text || "").replace(/\n/g,"<br />")}</p>`,photos:[]}));
  }
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const pieces: {title:string;html:string}[]=[];
  const firstIndex = headings[0]?.index ?? html.length;
  if (journalText(html.slice(0,firstIndex)) || /<img/i.test(html.slice(0,firstIndex))) pieces.push({title:"작업 기록",html:html.slice(0,firstIndex)});
  headings.forEach((heading,i)=>pieces.push({title:journalText(heading[1]),html:html.slice(heading.index!+heading[0].length,headings[i+1]?.index ?? html.length)}));
  if (!pieces.length) pieces.push({title:"작업 기록",html});
  return pieces.map((piece,i)=>{
    const photos:JournalPhoto[]=[];
    const addPhoto=(tag:string,caption="")=>{
      const src=tag.match(/\bsrc="([^"]+)"/i)?.[1];
      if (!src) return tag;
      const alt=tag.match(/\bdata-caption="([^"]*)"/i)?.[1] || tag.match(/\balt="([^"]*)"/i)?.[1] || "";
      photos.push({src:src.replace(/&amp;/g,"&"),caption:journalText(caption || alt || piece.title)});
      return "";
    };
    let body=piece.html.replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi,(figure,inner:string)=>{
      const imgs=[...inner.matchAll(/<img\b[^>]*>/gi)];
      if (!imgs.length || /<(?:iframe|video)\b/i.test(inner)) return figure;
      const caption=inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]||"";
      const remaining=inner.replace(/<img\b[^>]*>/gi, "").replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, "");
      // Keep any CMS explanation outside the formal caption.
      imgs.forEach(img=>addPhoto(img[0],caption));return remaining;
    });
    body=body.replace(/<img\b[^>]*>/gi,tag=>addPhoto(tag));
    // The original source is presented once in the journal footer.
    body=body.replace(/<p>\s*<a\b[^>]*href="https:\/\/(?:m\.)?blog\.naver\.com\/[^\"]+"[^>]*>[^<]*블로그 원문[^<]*<\/a>\s*<\/p>/gi,"");
    return {id:`journal-step-${i+1}`,title:piece.title,html:body,photos};
  }).filter(chapter=>journalText(chapter.html)||chapter.photos.length);
}

import Image from "next/image";
import s from "./NaverLocationMap.module.css";

// Exported with Naver Map's download control on 2026-09-26.
// The map is a static preview; the link opens Naver's live place and directions.
export const KOREA_AUTO_NAVER_PLACE = "https://map.naver.com/p/search/코리아오토미션/place/11611827";

export function NaverLocationMap() {
  return (
    <figure className={s.map}>
      <a className={s.imageLink} href={KOREA_AUTO_NAVER_PLACE} target="_blank" rel="noopener noreferrer" aria-label="코리아오토미션 위치 지도 — 네이버 지도에서 확대 및 길찾기, 새 창">
        <Image src="/location/naver-korea-auto-map.png" alt="부산 사상구 삼덕로 95 코리아오토미션의 네이버 지도. 덕포역 동쪽, 덕포초등학교 옆에 매장 위치가 표시되어 있습니다." fill sizes="(max-width: 700px) 100vw, 1200px" className={s.image} />
        <span className={s.open}>네이버 지도에서 길찾기 <span aria-hidden="true">↗</span></span>
      </a>
      <figcaption><span><b>NAVER</b> 지도</span><span>지도를 누르면 네이버 지도에서 확대할 수 있습니다.</span></figcaption>
    </figure>
  );
}

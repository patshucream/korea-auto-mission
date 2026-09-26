// Render a code-defined sharing card. The workshop photograph is an existing,
// unaltered Korea Auto Mission work record; no synthetic repair imagery is used.
import { readFile, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";
import sharp from "sharp";

const photo = await readFile(new URL("../public/blog-imports/224409409390/04.jpg", import.meta.url));
const logo = await readFile(new URL("../public/brand/korea-auto-logo.jpg", import.meta.url));
const response = new ImageResponse(
  h("div", { style: { width: "100%", height: "100%", display: "flex", background: "#1c2021", color: "#f5f4f0", position: "relative" } },
    h("img", { src: `data:image/jpeg;base64,${photo.toString("base64")}`, alt: "", width: 750, height: 630, style: { position: "absolute", right: 0, top: 0, objectFit: "cover" } }),
    h("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(90deg, #1c2021 0%, #1c2021f5 25%, #1c2021a8 49%, #1c202100 85%)", display: "flex" } }),
    h("div", { style: { position: "absolute", left: 54, top: 54, bottom: 52, width: 360, display: "flex", flexDirection: "column", alignItems: "flex-start" } },
      h("img", { src: `data:image/jpeg;base64,${logo.toString("base64")}`, alt: "", width: 76, height: 76, style: { objectFit: "contain", borderRadius: 4 } }),
      h("div", { style: { display: "flex", marginTop: 50, fontSize: 18, letterSpacing: 5, color: "#b6c6c0" } }, "BUSAN · SASANG"),
      h("div", { style: { display: "flex", flexDirection: "column", marginTop: 20, fontSize: 51, fontWeight: 700, letterSpacing: -1, lineHeight: 1.08 } }, h("span", null, "KOREA AUTO"), h("span", null, "MISSION")),
      h("div", { style: { display: "flex", marginTop: 26, fontSize: 15, letterSpacing: 1.5 } }, "TRANSMISSION / DIESEL / EV"),
      h("div", { style: { display: "flex", marginTop: "auto", fontSize: 20, color: "#d5dcd7" } }, "koreauto.co.kr"),
    ),
  ),
  { width: 1200, height: 630 },
);
const jpg = await sharp(Buffer.from(await response.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
await writeFile(new URL("../public/brand/korea-auto-share.jpg", import.meta.url), jpg);
console.log("Created 1200×630 JPEG sharing card.");

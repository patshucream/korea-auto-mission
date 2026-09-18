// Official wcs.trans guide: https://naver.github.io/conversion-tracking/pages/01_script_guide_wcstrans/
// Public site identifier, not an authentication credential.
const ACCOUNT = "s_248ae4c2576f";
const DOMAIN = "koreauto.co.kr";
const OPT_OUT = "korea-marketing-optout";
const ADMIN_VISIT = "korea-admin-visit";

type Conversion = { type: "custom001" | "custom002"; id: string };
declare global {
  interface Window {
    wcs_add?: { wa?: string };
    wcs?: { inflow: (domain: string) => void; trans: (event: Conversion) => void };
    wcs_do?: () => void;
  }
}

let loading: Promise<boolean> | undefined;
let lastPage: string | undefined;

export function naverTrackingAllowed() {
  if (typeof window === "undefined") return false;
  try {
    if (window.location.pathname.startsWith("/admin")) {
      window.sessionStorage.setItem(ADMIN_VISIT, "1");
      return false;
    }
    return [DOMAIN, `www.${DOMAIN}`].includes(window.location.hostname)
      && window.navigator.doNotTrack !== "1"
      && window.localStorage.getItem(OPT_OUT) !== "1"
      && !window.sessionStorage.getItem(ADMIN_VISIT);
  } catch { return false; }
}

function loadNaver() {
  if (!naverTrackingAllowed()) return Promise.resolve(false);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const initialize = () => {
      try {
        if (!naverTrackingAllowed() || !window.wcs || !window.wcs_do) return resolve(false);
        window.wcs_add = { ...window.wcs_add, wa: ACCOUNT };
        window.wcs.inflow(DOMAIN);
        resolve(true);
      } catch { resolve(false); }
    };
    if (window.wcs && window.wcs_do) return initialize();
    const script = document.createElement("script");
    script.id = "naver-conversion-tracking";
    script.src = "https://wcs.naver.net/wcslog.js";
    script.async = true;
    script.onload = initialize;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  }).then((ready) => {
    // Let a later permission change retry initialization after a blocked load.
    if (!ready) {
      loading = undefined;
      document.getElementById("naver-conversion-tracking")?.remove();
    }
    return ready;
  });
  return loading;
}

export async function recordNaverPageView(pathname: string) {
  try {
    if (!await loadNaver() || !naverTrackingAllowed()) return;
    // A slow script must not record a route that the visitor already left.
    if (window.location.pathname !== pathname) return;
    const page = pathname + window.location.search;
    if (lastPage === page) return;
    window.wcs_do!();
    lastPage = page;
  } catch { /* Measurement must never interrupt a visit. */ }
}

export async function recordNaverContact(href: string) {
  const type = href.startsWith("tel:") ? "custom001" : href.startsWith("sms:") ? "custom002" : null;
  if (!type || !naverTrackingAllowed()) return;
  try {
    if (!await loadNaver() || !naverTrackingAllowed()) return;
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
    const key = `korea-naver-contact-v1:${day}:${type}`;
    if (window.sessionStorage.getItem(key)) return;
    const id = window.crypto.randomUUID();
    window.sessionStorage.setItem(key, id);
    try {
      // Only button intent is measured. Do not report a completed lead, call or sale.
      // Naver's "call" event is not included in ad reports; custom001/002 are.
      // Never send the phone number, SMS body or entered vehicle information.
      window.wcs!.trans({ type, id });
    } catch {
      window.sessionStorage.removeItem(key);
    }
  } catch { /* The phone/SMS link remains usable when measurement fails. */ }
}

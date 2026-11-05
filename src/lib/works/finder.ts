/** Group display aliases without changing original case facts or generations. */
export function finderBrand(value: string) {
  return ({ "메르세데스-벤츠": "벤츠", "르노삼성": "르노코리아", "한국GM": "쉐보레" } as Record<string,string>)[value] || value;
}
export function finderModel(value: string) {
  return (value || "").replace(/^올뉴 카니발 (2\.2 디젤|9인승)$/, "올뉴 카니발").replace(/\s+(디젤|4WD)$/i, "");
}
export function finderTerms(value = "") {
  return value.trim().replace(/변속충격/g,"변속 충격").replace(/후진불량/g,"후진 불량")
    .split(/\s+/).map(s => s.replace(/[^가-힣a-zA-Z0-9-]/g, "")).filter(Boolean).slice(0,8);
}
export function finderMatches(text: string, query = "") {
  const compact = text.toLowerCase().replace(/\s+/g, "");
  return finderTerms(query).every(term => finderAlternatives(term).some(word => compact.includes(word.toLowerCase())));
}

export function finderAlternatives(term: string) {
  return ["떨림", "진동"].includes(term) ? ["떨림", "진동"] : [term];
}

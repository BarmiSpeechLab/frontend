// Vite 빌드 시 `./articulation_img/*.gif`를 자동으로 import 해서
// 파일명 `번호_키.gif`(예: `1_ɑ.gif`)의 `키`를 기준으로 `{ cipa: gifUrl }` 매핑을 생성한다.
// 사용처에서는 `getArticulationGifByCipa(cipa)`로 해당 조음 위치 GIF URL을 가져온다.

const gifModules = import.meta.glob("./img/articulation_img/*.gif", {
  eager: true,
  import: "default",
});

export const ARTICULATION_GIF_BY_CIPA = Object.fromEntries(
  Object.entries(gifModules)
    .map(([path, url]) => {
      // 예: ./articulation_img/1_ɑ.gif  -> key: "ɑ"
      const m = path.match(/\/\d+_(.+)\.gif$/);
      if (!m) return null;
      return [m[1], url];
    })
    .filter(Boolean),
);

// IPA 기호 매핑 (파일 이름과 실제 분석 결과의 기호가 다를 경우 대비)
const IPA_ALIASES = {
  "ɹ": "r",  // ɹ -> r 파일 매핑
  "ɜ": "ɝ",  // ɜ -> ɝ 파일 매핑 (유사 발음)
  "ɚ": "ə",  // ɚ -> ə (유사 발음)
  "g": "ɡ",  // g -> ɡ (유니코드 차이 대응)
};

export function getArticulationGifByCipa(cipa) {
  // 1. 직접 매칭
  if (ARTICULATION_GIF_BY_CIPA[cipa]) return ARTICULATION_GIF_BY_CIPA[cipa];

  // 2. Alias 매칭
  const alias = IPA_ALIASES[cipa];
  if (alias && ARTICULATION_GIF_BY_CIPA[alias]) return ARTICULATION_GIF_BY_CIPA[alias];

  return "";
}
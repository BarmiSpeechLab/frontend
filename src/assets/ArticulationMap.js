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
      // 예: ./img/articulation_img/1_ɑ.gif  -> key: "ɑ"
      const m = path.match(/\/\d+_(.+)\.gif$/);
      if (!m) return null;
      return [m[1], url];
    })
    .filter(Boolean),
);

export function getArticulationGifByCipa(cipa) {
  return ARTICULATION_GIF_BY_CIPA[cipa] || "";
}
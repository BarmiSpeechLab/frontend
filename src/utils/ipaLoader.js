
/**
 * IPA 발음 기호 이미지를 ID(숫자) 기반으로 로드
 * 폴더명(예: "1_ɑ")의 앞 숫자를 ID로 간주하여 매핑
 */

// 1. 모든 svg 파일을 Eager Loading
const rawImages = import.meta.glob('/src/assets/img/*/*.svg', { eager: true, import: 'default' });

// 2. ID -> { mouth, tongue } 매핑 테이블 생성
const ipaIdMap = {};

Object.keys(rawImages).forEach((path) => {
    // path 예시: "/src/assets/img/1_ɑ/1.svg"

    // "폴더명/파일명" 패턴 매칭
    const match = path.match(/\/(\d+)_[^/]+\/([12])\.svg/);

    if (match) {
        const id = parseInt(match[1], 10); // ID 추출 (예: 1)
        const fileType = match[2];         // 파일 타입 (1: 입모양, 2: 조음위치)

        if (!ipaIdMap[id]) {
            ipaIdMap[id] = { mouth: null, tongue: null };
        }

        if (fileType === '1') {
            ipaIdMap[id].mouth = rawImages[path];
        } else if (fileType === '2') {
            ipaIdMap[id].tongue = rawImages[path];
        }
    }
});

export const getIpaImages = (id) => {
    // ID가 유효하지 않거나 매핑된 이미지가 없으면 null 반환
    if (!id || !ipaIdMap[id]) return { mouth: null, tongue: null };

    return ipaIdMap[id];
};

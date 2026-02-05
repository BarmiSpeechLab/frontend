
/**
 * IPA 발음 기호 이미지를 ID(숫자) 기반으로 로드
 * 폴더명(예: "1_ɑ")의 앞 숫자를 ID로 간주하여 매핑
 */

// 1. 모든 svg 파일을 Eager Loading
const rawImages = import.meta.glob('/src/assets/img/*/*.svg', { eager: true, import: 'default' });

// 2. ID -> { mouth, tongue } 및 Symbol -> { mouth, tongue } 매핑 생성
const ipaIdMap = {};
const ipaSymbolMap = {};

Object.keys(rawImages).forEach((path) => {
    // path 예시: "/src/assets/img/1_ɑ/1.svg"
    // 정규식 수정: 폴더명에서 ID와 Symbol(특수문자 포함) 모두 추출
    const match = path.match(/\/(\d+)_([^/]+)\/([12])\.svg/);

    if (match) {
        const id = parseInt(match[1], 10); // ID (예: 1)
        const symbol = match[2];           // Symbol (예: ɑ)
        const fileType = match[3];         // 파일 타입 (1: 입모양, 2: 조음위치)

        // ID 맵 초기화
        if (!ipaIdMap[id]) {
            ipaIdMap[id] = { mouth: null, tongue: null };
        }
        // Symbol 맵 초기화
        if (!ipaSymbolMap[symbol]) {
            ipaSymbolMap[symbol] = { mouth: null, tongue: null };
        }

        if (fileType === '1') {
            ipaIdMap[id].mouth = rawImages[path];
            ipaSymbolMap[symbol].mouth = rawImages[path];
        } else if (fileType === '2') {
            ipaIdMap[id].tongue = rawImages[path];
            ipaSymbolMap[symbol].tongue = rawImages[path];
        }
    }
});

export const getIpaImages = (id) => {
    if (!id || !ipaIdMap[id]) return { mouth: null, tongue: null };
    return ipaIdMap[id];
};

export const getIpaImagesBySymbol = (symbol) => {
    if (!symbol || !ipaSymbolMap[symbol]) return { mouth: null, tongue: null };
    return ipaSymbolMap[symbol];
};

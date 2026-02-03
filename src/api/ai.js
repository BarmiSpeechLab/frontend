import api from './index';

/**
 * 발음 평가 제출
 */
export const submitPronunciation = async (file, curriculumId) => {
  console.log('[API 요청] 발음 평가 제출');

  try {
    const formData = new FormData();

    // ✅ 백엔드가 받는 키 이름이 반드시 "file"
    // file이 Blob이면 파일명까지 주는 게 안전함
    formData.append('file', file, file?.name ?? 'audio.webm');

    // ✅ @RequestParam curriculumId 필수
    formData.append('curriculumId', String(curriculumId));

    // ✅ 헤더 지정 제거 (axios가 boundary 포함해서 자동 설정)
    const response = await api.post('/analysis/submit', formData);

    const rawData = response.data;
    let taskId = rawData;

    if (typeof rawData === 'string' && rawData.includes('저장 성공: ')) {
      taskId = rawData.replace('저장 성공: ', '').trim();
    } else if (rawData && rawData.data) {
      taskId = rawData.data;
    }

    console.log('[API 성공] Task ID 수신:', taskId);
    return { taskId };
  } catch (error) {
    console.error('[API 실패] 제출 에러:', error);
    throw error;
  }
};

/**
 * 분석 상태 확인 -> 폴링
 */
export const checkAnalysisStatus = async (curriculumId, taskId) => {
    try {
        const response = await api.get(`/analysis/${curriculumId}/${taskId}`);
        let rawData = response.data;

        console.log('[폴링 응답] rawData:', rawData);

        // 백엔드 응답이 "현재 데이터 : " 접두사를 포함하는 경우 제거하고 파싱 시도
        if (typeof rawData === 'string' && rawData.startsWith('현재 데이터 : ')) {
            const jsonPart = rawData.replace('현재 데이터 : ', '').trim();
            if (jsonPart === 'null') {
                return { status: 'PROCESSING', result: null };
            }
            rawData = jsonPart;
        }

        // 1. 데이터 추출 (ApiResponse or 직접 데이터)
        let content = (rawData && rawData.data !== undefined ? rawData.data : rawData);

        // 2. 자바 toString 형태 파싱 처리
        const parseJavaMapObject = (str) => {
            if (typeof str !== 'string') return str;

            try {
                const result = {};

                // pronunciation={...} 또는 pronunciation=null 추출
                const pronMatch = str.match(/pronunciation=(\{[^}]*\}|null)/);
                if (pronMatch) {
                    if (pronMatch[1] === 'null') {
                        result.pronunciation = null;
                    } else {
                        result.pronunciation = parseMap(pronMatch[1]);
                    }
                }

                // intonations={...} 또는 intonations=null 추출
                const intonMatch = str.match(/intonations=(\{[^}]*\}|null)/);
                if (intonMatch) {
                    if (intonMatch[1] === 'null') {
                        result.intonations = null;
                    } else {
                        result.intonations = parseMap(intonMatch[1]);
                    }
                }

                // llmFeedback={...} 또는 llmFeedback=null 추출
                const llmMatch = str.match(/llmFeedback=(\{[^}]*\}|null)/);
                if (llmMatch) {
                    if (llmMatch[1] === 'null') {
                        result.llmFeedback = null;
                    } else {
                        result.llmFeedback = parseMap(llmMatch[1]);
                    }
                }

                console.log('[Java toString 파싱 결과]', result);
                return result;
            } catch (e) {
                console.error('Java toString 파싱 실패:', e);
                return null;
            }
        };

        // Map 파싱: {key=value, key=value} 형태를 객체로 변환
        const parseMap = (mapStr) => {
            const obj = {};
            // { } 제거
            const content = mapStr.slice(1, -1).trim();
            if (!content) return obj;

            // key=value 쌍 분리 (값에 =가 포함될 수도 있음)
            const pairs = content.split(/,\s*(?=[a-zA-Z_][a-zA-Z0-9_]*=)/);

            pairs.forEach(pair => {
                const firstEqualIndex = pair.indexOf('=');
                if (firstEqualIndex === -1) return;

                const key = pair.substring(0, firstEqualIndex).trim();
                let value = pair.substring(firstEqualIndex + 1).trim();

                // 배열 파싱: [1, 2, 3] 형태
                if (value.startsWith('[') && value.endsWith(']')) {
                    const arrContent = value.slice(1, -1);
                    value = arrContent ? arrContent.split(',').map(v => {
                        const trimmed = v.trim();
                        const num = parseFloat(trimmed);
                        return isNaN(num) ? trimmed : num;
                    }) : [];
                }
                // 숫자 변환 시도
                else {
                    const num = parseFloat(value);
                    if (!isNaN(num) && value === num.toString()) {
                        value = num;
                    }
                }

                obj[key] = value;
            });

            return obj;
        };

        if (typeof content === 'string' && content.includes('IntegratedAnalysisResult')) {
            const parsed = parseJavaMapObject(content);
            if (parsed) {
                const hasData = parsed.pronunciation || parsed.intonations || parsed.llmFeedback;
                if (hasData) {
                    return { status: 'COMPLETED', result: parsed };
                }
            }
        } else if (content && typeof content === 'object') {
            // 이미 객체인 경우
            return { status: 'COMPLETED', result: content };
        }

        return { status: 'PROCESSING', result: null };
    } catch (error) {
        console.error('분석 상태 확인 실패:', error);
        return { status: 'ERROR', error };
    }
};

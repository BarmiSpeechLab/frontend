import "./PronunciationAnalysisResult.css";
import ResultCarousel from "./ResultCarousel";

export default function PronunciationAnalysisResult({
  phonemes = [],
  targetWords = [],
  ckor,
  ukor,
  wordSegments, // 신규 추가
  selectedCipa,
  onSelectCipa,
  className = "",
  onRedo,
}) {
  const ckorArray = Array.isArray(ckor) ? ckor : [];
  const ukorArray = Array.isArray(ukor) ? ukor : [];

  if (!phonemes.length && (!wordSegments || !wordSegments.length)) return null;

  // 1. wordSegments가 명시적으로 전달된 경우 (이상적)
  // 2. 전달되지 않은 경우 기존 로직으로 fallback
  let wordGroups = [];

  if (Array.isArray(wordSegments) && wordSegments.length > 0) {
    wordGroups = wordSegments.map((ws, idx) => ({
      targetWord: ws.word,
      ckorWord: ckorArray[idx] || '', // ckor/ukor는 여전히 인덱스로 매칭
      userWord: ukorArray[idx] || '',
      phonemes: ws.phonemes.map(p => ({
        cipa: p.symbol,
        uipa: p.userSymbol,
        ok: p.isCorrect
      }))
    }));
  } else {
    // 하위 호환성용 fallback (Math.ceil 기반)
    const wordsCount = ckorArray.length || targetWords.length || 1;
    const phonemesPerWord = Math.ceil(phonemes.length / wordsCount) || 1;

    wordGroups = (ckorArray.length ? ckorArray : targetWords).map((_, wordIdx) => {
      const startIdx = wordIdx * phonemesPerWord;
      const endIdx = Math.min(startIdx + phonemesPerWord, phonemes.length);
      const wordPhonemes = phonemes.slice(startIdx, endIdx);

      return {
        targetWord: targetWords[wordIdx] || '',
        ckorWord: ckorArray[wordIdx] || '',
        userWord: ukorArray[wordIdx] || '',
        phonemes: wordPhonemes
      };
    });
  }

  return (
    <section className={`pa-result ${className}`.trim()} aria-live="polite">
      <ResultCarousel
        titles={wordGroups.map(w => w.targetWord || '단어 분석')}
      >
        {wordGroups.map((word, wordIdx) => (
          <div key={wordIdx} className="pa-word-group">
            {/* 중간: IPA 음소들 비교 */}
            <div className="pa-phonemes-row">
              <div className="pa-phonemes-label">표준</div>
              <div className="pa-phonemes-values">
                {word.phonemes.map((p, idx) => {
                  const selected = p?.cipa && p.cipa === selectedCipa;
                  const clickable = p && p.ok === false;

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={[
                        "pa-phoneme-token",
                        p.ok ? "pa-phoneme-token--ok" : "pa-phoneme-token--bad",
                        clickable ? "pa-phoneme-token--clickable" : "",
                        selected ? "pa-phoneme-token--selected" : "",
                      ].join(" ")}
                      disabled={!clickable}
                      onClick={() => clickable && onSelectCipa?.(p.cipa)}
                      title={clickable ? "클릭하여 조음 위치 확인" : undefined}
                    >
                      {p.cipa}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pa-arrow">↓</div>

            <div className="pa-phonemes-row">
              <div className="pa-phonemes-label">내발음</div>
              <div className="pa-phonemes-values">
                {word.phonemes.map((p, idx) => (
                  <span
                    key={idx}
                    className={`pa-phoneme-token ${p.ok ? "pa-phoneme-token--ok" : "pa-phoneme-token--bad"}`}
                  >
                    {p.uipa}
                  </span>
                ))}
              </div>
            </div>

            {/* 하단: 한글 발음 비교 */}
            <div className="pa-korean-row">
              <span className="pa-korean-comparison">
                {word.ckorWord} →{" "}
                <span
                  className={
                    word.phonemes.every(p => p.ok)
                      ? "pa-korean-user--ok"
                      : "pa-korean-user--bad"
                  }
                >{word.userWord}
                </span>
              </span>
            </div>
          </div>
        ))}
      </ResultCarousel>

      <div className="pa-hint">
        * IPA 기호를 클릭하면 상세 조음 위치를 확인할 수 있습니다.
      </div>
    </section>
  );
}
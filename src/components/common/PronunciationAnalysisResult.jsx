import "./PronunciationAnalysisResult.css";
import ResultCarousel from "./ResultCarousel";

export default function PronunciationAnalysisResult({
  phonemes = [],
  targetWords = [],
  ckor,
  ukor,
  selectedCipa,
  onSelectCipa,
  className = "",
  onRedo,
}) {
  const ckorArray = Array.isArray(ckor) ? ckor : [];
  const ukorArray = Array.isArray(ukor) ? ukor : [];

  if (!phonemes.length) return null;

  // phonemes를 단어별로 그룹화
  // phonemes는 이미 flatMap으로 펼쳐진 상태이므로, 
  // ckor/ukor 길이를 기준으로 다시 그룹화 필요
  const wordsCount = ckorArray.length;
  const phonemesPerWord = Math.ceil(phonemes.length / wordsCount) || 1;

  const wordGroups = ckorArray.map((ckorWord, wordIdx) => {
    const startIdx = wordIdx * phonemesPerWord;
    const endIdx = Math.min(startIdx + phonemesPerWord, phonemes.length);
    const wordPhonemes = phonemes.slice(startIdx, endIdx);

    return {
      targetWord: targetWords[wordIdx] || '',
      ckorWord: ckorWord,
      userWord: ukorArray[wordIdx] || '',
      phonemes: wordPhonemes
    };
  });

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
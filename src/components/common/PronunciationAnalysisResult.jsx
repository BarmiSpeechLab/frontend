import "./PronunciationAnalysisResult.css";

export default function PronunciationAnalysisResult({ phonemes = [], ckor, ukor, className = "" }) {
  const ckorText = Array.isArray(ckor) ? ckor.join(" ") : (ckor ?? "");
  const ukorText = Array.isArray(ukor) ? ukor.join(" ") : (ukor ?? "");

  if (!phonemes.length && !ckorText && !ukorText) return null;

  return (
    <section className={`pa-result ${className}`.trim()} aria-live="polite">
      <div className="pa-result__row">
        <div className="pa-result__label">CIPA</div>
        <div className="pa-result__value">
          {phonemes.map((p, idx) => (
            <span key={idx} className={`pa-token ${p.ok ? "pa-token--ok" : "pa-token--bad"}`}>
              {p.cipa}
            </span>
          ))}
        </div>
      </div>

      <div className="pa-result__row">
        <div className="pa-result__label">UIPA</div>
        <div className="pa-result__value">
          {phonemes.map((p, idx) => (
            <span key={idx} className={`pa-token ${p.ok ? "pa-token--ok" : "pa-token--bad"}`}>
              {p.uipa}
            </span>
          ))}
        </div>
      </div>

      <div className="pa-result__row">
        <div className="pa-result__label">CKOR</div>
        <div className="pa-result__value">{ckorText}</div>
      </div>

      <div className="pa-result__row">
        <div className="pa-result__label">UKOR</div>
        <div className="pa-result__value">{ukorText}</div>
      </div>
    </section>
  );
}

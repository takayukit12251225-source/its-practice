function markClass(mark) {
  if (mark === "○") return "mark-circle";
  if (mark === "△") return "mark-tri";
  return "mark-cross";
}

function collectMarksFromProblem(p) {
  const marks = [];
  p.gradedGroups.forEach((g) => {
    g.questions.forEach((q) => {
      if (q.subQuestions && q.questions) {
        q.questions.forEach((subQ) => {
          if (subQ.answers) subQ.answers.forEach((a) => marks.push(a.mark));
          else marks.push(subQ.mark);
        });
      } else if (q.answers) {
        q.answers.forEach((a) => marks.push(a.mark));
      } else {
        marks.push(q.mark);
      }
    });
  });
  return marks;
}

function computeProblemEarned(p) {
  const marks = collectMarksFromProblem(p);
  const n = marks.length;
  const perQ = n === 0 ? 0 : 50 / n;
  const earned = marks.reduce(
    (sum, m) => sum + (m === "○" ? perQ : m === "△" ? perQ / 2 : 0),
    0
  );
  return Math.round(earned * 10) / 10;
}

function KeywordList({ keywords, bonusKeywords, foundRequired, foundBonus }) {
  return (
    <div className="kw-list">
      {(keywords || []).map((kw) => (
        <span
          key={kw}
          className={`kw-tag kw-required ${foundRequired?.includes(kw) ? "kw-ok" : "kw-ng"}`}
        >
          ★ {foundRequired?.includes(kw) ? "✓" : "✗"} {kw}
        </span>
      ))}
      {(bonusKeywords || []).map((kw) => (
        <span
          key={kw}
          className={`kw-tag kw-bonus ${foundBonus?.includes(kw) ? "kw-ok" : "kw-ng"}`}
        >
          {foundBonus?.includes(kw) ? "✓" : "✗"} {kw}
        </span>
      ))}
    </div>
  );
}

function QuestionCard({ label, mark, charLimit, answer, keywords, bonusKeywords, foundRequired, foundBonus, modelAnswer, commentary }) {
  return (
    <div className={`score-question ${markClass(mark)}`}>
      <div className="sq-header">
        <span className="sq-label">{label}</span>
        <span className={`sq-mark ${markClass(mark)}`}>{mark}</span>
        <span className="sq-limit">{charLimit}字以内</span>
      </div>
      <div className="sq-row">
        <span className="sq-row-label">あなたの解答</span>
        <span className="sq-answer">{answer || <em className="no-answer">未回答</em>}</span>
      </div>
      <KeywordList
        keywords={keywords}
        bonusKeywords={bonusKeywords}
        foundRequired={foundRequired}
        foundBonus={foundBonus}
      />
      <div className="sq-row">
        <span className="sq-row-label">模範解答</span>
        <span className="sq-model">{modelAnswer}</span>
      </div>
      <div className="sq-row commentary-row">
        <span className="sq-row-label">講評</span>
        <span className="sq-commentary">{commentary}</span>
      </div>
    </div>
  );
}

export default function ScoreResults({ results }) {
  const allMarks = results.flatMap((p) => collectMarksFromProblem(p));
  const circles = allMarks.filter((m) => m === "○").length;
  const tris = allMarks.filter((m) => m === "△").length;
  const crosses = allMarks.filter((m) => m === "×").length;

  const problemEarned = results.map((p) => computeProblemEarned(p));
  const total = Math.round(problemEarned.reduce((s, e) => s + e, 0) * 10) / 10;
  const totalMax = results.length * 50;
  const pct = totalMax === 0 ? 0 : Math.round((total / totalMax) * 100);

  let resultLabel, resultClass;
  if (pct >= 60) { resultLabel = "合格ライン到達"; resultClass = "result-pass"; }
  else if (pct >= 40) { resultLabel = "もう一息"; resultClass = "result-mid"; }
  else { resultLabel = "要復習"; resultClass = "result-fail"; }

  return (
    <>
      <div className="score-summary">
        <div className="summary-pct-wrap">
          <div className="summary-total-score">
            <span className="summary-pts">{total}</span>
            <span className="summary-pts-denom"> / {totalMax}点</span>
          </div>
          <span className={`summary-label ${resultClass}`}>{resultLabel}</span>
          <div className="summary-problem-scores">
            {results.map((p, i) => (
              <span key={p.id} className="summary-problem-score">
                問{p.id}：{problemEarned[i]} / 50点
              </span>
            ))}
          </div>
          <span className="summary-note">
            ★必須キーワード1個以上一致→○　加点キーワード一致→△
          </span>
        </div>
        <div className="summary-marks">
          <div className="summary-mark mark-circle">
            <span className="mark-icon">○</span>
            <span className="mark-num">{circles}</span>
            <span className="mark-unit">問</span>
          </div>
          <div className="summary-mark mark-tri">
            <span className="mark-icon">△</span>
            <span className="mark-num">{tris}</span>
            <span className="mark-unit">問</span>
          </div>
          <div className="summary-mark mark-cross">
            <span className="mark-icon">×</span>
            <span className="mark-num">{crosses}</span>
            <span className="mark-unit">問</span>
          </div>
        </div>
      </div>

      {results.map((p, pIdx) => (
        <div key={p.id} className="score-problem">
          <h2 className="score-problem-title">
            問{p.id}：{p.title}
            <span className="score-problem-pts">{problemEarned[pIdx]} / 50点</span>
          </h2>
          {p.gradedGroups.map((group, gIdx) => (
            <div key={gIdx} className="score-group">
              <h3 className="score-group-title">{group.groupTitle}</h3>
              {group.questions.map((q) => {
                if (q.subQuestions && q.questions) {
                  return q.questions.map((subQ) => {
                    if (subQ.answers) {
                      const subLabels = ["①", "②"];
                      return subQ.answers.map((ans, ansIdx) => (
                        <QuestionCard
                          key={subQ.id + "_" + ansIdx}
                          label={subQ.label + subLabels[ansIdx]}
                          mark={ans.mark}
                          charLimit={subQ.charLimit}
                          answer={ans.answer}
                          keywords={ans.keywords}
                          bonusKeywords={ans.bonusKeywords}
                          foundRequired={ans.foundRequired}
                          foundBonus={ans.foundBonus}
                          modelAnswer={ans.modelAnswer}
                          commentary={ans.commentary}
                        />
                      ));
                    }
                    return (
                      <QuestionCard
                        key={subQ.id}
                        label={subQ.label}
                        mark={subQ.mark}
                        charLimit={subQ.charLimit}
                        answer={subQ.answer}
                        keywords={subQ.keywords}
                        bonusKeywords={subQ.bonusKeywords}
                        foundRequired={subQ.foundRequired}
                        foundBonus={subQ.foundBonus}
                        modelAnswer={subQ.modelAnswer}
                        commentary={subQ.commentary}
                      />
                    );
                  });
                } else if (q.answers) {
                  const ansLabels = q.label === "設問2" ? ["ア", "イ"] : ["①", "②"];
                  return q.answers.map((ans, ansIdx) => (
                    <QuestionCard
                      key={q.id + "_" + ansIdx}
                      label={q.label + ansLabels[ansIdx]}
                      mark={ans.mark}
                      charLimit={q.charLimit}
                      answer={ans.answer}
                      keywords={ans.keywords}
                      bonusKeywords={ans.bonusKeywords}
                      foundRequired={ans.foundRequired}
                      foundBonus={ans.foundBonus}
                      modelAnswer={ans.modelAnswer}
                      commentary={ans.commentary}
                    />
                  ));
                } else {
                  return (
                    <QuestionCard
                      key={q.id}
                      label={q.label}
                      mark={q.mark}
                      charLimit={q.charLimit}
                      answer={q.answer}
                      keywords={q.keywords}
                      bonusKeywords={q.bonusKeywords}
                      foundRequired={q.foundRequired}
                      foundBonus={q.foundBonus}
                      modelAnswer={q.modelAnswer}
                      commentary={q.commentary}
                    />
                  );
                }
              })}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

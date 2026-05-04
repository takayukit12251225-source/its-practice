function grade(question, answer) {
  const keywords = Array.isArray(question.keywords)
    ? question.keywords
    : Array.isArray(question.keywordPairs)
    ? question.keywordPairs
    : [];
  if (!answer || answer.trim() === "") {
    return { mark: "×", found: [], notFound: keywords };
  }
  const found = keywords.filter((kw) => answer.includes(kw));
  const notFound = keywords.filter((kw) => !answer.includes(kw));
  const ratio = keywords.length === 0 ? 0 : found.length / keywords.length;
  const mark = ratio === 1 ? "○" : ratio > 0 ? "△" : "×";
  return { mark, found, notFound };
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}時間`);
  parts.push(`${m}分`);
  parts.push(`${s}秒`);
  return parts.join("");
}

function markClass(mark) {
  if (mark === "○") return "mark-circle";
  if (mark === "△") return "mark-tri";
  return "mark-cross";
}

export default function ScoreScreen({
  problems,
  answers,
  timeUsed,
  onRestart,
}) {
  // questionGroupsベースの結果作成
  const results = problems.map((p) => {
    const gradedGroups = p.questionGroups.map((group) => ({
      ...group,
      questions: group.questions.map((q) => {
        // 複数小問の場合
        if (q.subQuestions && q.questions) {
          return {
            ...q,
            questions: q.questions.map((subQ, idx) => ({
              ...subQ,
              answer: answers[subQ.id] || "",
              ...grade(subQ, answers[subQ.id] || ""),
              modelAnswer: q.modelAnswers[idx],
              commentary: q.commentaries[idx],
            })),
          };
        }
        // 複数回答の場合
        else if (q.isTwoAnswers && q.modelAnswers) {
          return {
            ...q,
            answers: [0, 1].map((idx) => {
              const ans = answers[q.id + "_" + idx] || "";
              return {
                ...grade({ keywords: q.keywordPairs[idx] }, ans),
                answer: ans,
                modelAnswer: q.modelAnswers[idx],
                keywords: q.keywordPairs[idx],
                commentary: q.commentaries[idx],
              };
            }),
          };
        }
        // 単一回答
        else {
          return {
            ...q,
            answer: answers[q.id] || "",
            ...grade(q, answers[q.id] || ""),
          };
        }
      }),
    }));
    return { ...p, gradedGroups };
  });

  // 統計情報を集計
  const allMarks = [];
  results.forEach((p) => {
    p.gradedGroups.forEach((g) => {
      g.questions.forEach((q) => {
        if (q.subQuestions && q.questions) {
          q.questions.forEach((sq) => allMarks.push(sq.mark));
        } else if (q.answers) {
          q.answers.forEach((a) => allMarks.push(a.mark));
        } else {
          allMarks.push(q.mark);
        }
      });
    });
  });

  const total = allMarks.length;
  const circles = allMarks.filter((m) => m === "○").length;
  const tris = allMarks.filter((m) => m === "△").length;
  const crosses = allMarks.filter((m) => m === "×").length;

  const earned = circles * 2 + tris * 1;
  const max = total * 2;
  const pct = Math.round((earned / max) * 100);

  let resultLabel, resultClass;
  if (pct >= 60) {
    resultLabel = "合格ライン到達";
    resultClass = "result-pass";
  } else if (pct >= 40) {
    resultLabel = "もう一息";
    resultClass = "result-mid";
  } else {
    resultLabel = "要復習";
    resultClass = "result-fail";
  }

  return (
    <div className="score-screen">
      <div className="score-header">
        <h1>採点結果</h1>
        <p className="time-used">解答時間: {formatTime(timeUsed)}</p>
      </div>

      <div className="score-summary">
        <div className="summary-pct-wrap">
          <span className="summary-pct">{pct}%</span>
          <span className={`summary-label ${resultClass}`}>{resultLabel}</span>
          <span className="summary-note">
            (キーワード正答率による概算 ○×2点 △×1点)
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

      {results.map((p) => (
        <div key={p.id} className="score-problem">
          <h2 className="score-problem-title">
            問{p.id}：{p.title}
          </h2>
          {p.gradedGroups.map((group, gIdx) => (
            <div key={gIdx} className="score-group">
              <h3 className="score-group-title">{group.groupTitle}</h3>
              {group.questions.map((q, qIdx) => {
                // 複数小問の場合
                if (q.subQuestions && q.questions) {
                  return q.questions.map((subQ) => (
                    <div
                      key={subQ.id}
                      className={`score-question ${markClass(subQ.mark)}`}
                    >
                      <div className="sq-header">
                        <span className="sq-label">{subQ.label}</span>
                        <span className={`sq-mark ${markClass(subQ.mark)}`}>
                          {subQ.mark}
                        </span>
                        <span className="sq-limit">{subQ.charLimit}字以内</span>
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">あなたの解答</span>
                        <span className="sq-answer">
                          {subQ.answer || (
                            <em className="no-answer">未回答</em>
                          )}
                        </span>
                      </div>
                      <div className="kw-list">
                        {subQ.keywords.map((kw) => (
                          <span
                            key={kw}
                            className={`kw-tag ${
                              subQ.found.includes(kw) ? "kw-ok" : "kw-ng"
                            }`}
                          >
                            {subQ.found.includes(kw) ? "✓" : "✗"} {kw}
                          </span>
                        ))}
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">模範解答</span>
                        <span className="sq-model">{subQ.modelAnswer}</span>
                      </div>
                      <div className="sq-row commentary-row">
                        <span className="sq-row-label">講評</span>
                        <span className="sq-commentary">
                          {subQ.commentary}
                        </span>
                      </div>
                    </div>
                  ));
                }
                // 複数回答の場合
                else if (q.answers) {
                  return q.answers.map((ans, ansIdx) => (
                    <div
                      key={q.id + "_" + ansIdx}
                      className={`score-question ${markClass(ans.mark)}`}
                    >
                      <div className="sq-header">
                        <span className="sq-label">
                          {q.label}
                          {q.label === "設問2" ? ["ア", "イ"][ansIdx] : ["①", "②"][ansIdx]}
                        </span>
                        <span className={`sq-mark ${markClass(ans.mark)}`}>
                          {ans.mark}
                        </span>
                        <span className="sq-limit">{q.charLimit}字以内</span>
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">あなたの解答</span>
                        <span className="sq-answer">
                          {ans.answer || <em className="no-answer">未回答</em>}
                        </span>
                      </div>
                      <div className="kw-list">
                        {ans.keywords.map((kw) => (
                          <span
                            key={kw}
                            className={`kw-tag ${
                              ans.found.includes(kw) ? "kw-ok" : "kw-ng"
                            }`}
                          >
                            {ans.found.includes(kw) ? "✓" : "✗"} {kw}
                          </span>
                        ))}
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">模範解答</span>
                        <span className="sq-model">{ans.modelAnswer}</span>
                      </div>
                      <div className="sq-row commentary-row">
                        <span className="sq-row-label">講評</span>
                        <span className="sq-commentary">{ans.commentary}</span>
                      </div>
                    </div>
                  ));
                }
                // 単一回答
                else {
                  return (
                    <div
                      key={q.id}
                      className={`score-question ${markClass(q.mark)}`}
                    >
                      <div className="sq-header">
                        <span className="sq-label">{q.label}</span>
                        <span className={`sq-mark ${markClass(q.mark)}`}>
                          {q.mark}
                        </span>
                        <span className="sq-limit">{q.charLimit}字以内</span>
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">あなたの解答</span>
                        <span className="sq-answer">
                          {q.answer || <em className="no-answer">未回答</em>}
                        </span>
                      </div>
                      <div className="kw-list">
                        {q.keywords.map((kw) => (
                          <span
                            key={kw}
                            className={`kw-tag ${
                              q.found.includes(kw) ? "kw-ok" : "kw-ng"
                            }`}
                          >
                            {q.found.includes(kw) ? "✓" : "✗"} {kw}
                          </span>
                        ))}
                      </div>
                      <div className="sq-row">
                        <span className="sq-row-label">模範解答</span>
                        <span className="sq-model">{q.modelAnswer}</span>
                      </div>
                      <div className="sq-row commentary-row">
                        <span className="sq-row-label">講評</span>
                        <span className="sq-commentary">{q.commentary}</span>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>
      ))}

      <div className="score-footer">
        <button className="btn-restart" onClick={onRestart}>
          トップに戻る
        </button>
      </div>
    </div>
  );
}

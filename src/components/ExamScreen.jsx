import { useState } from "react";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timerColorClass(seconds) {
  if (seconds < 10 * 60) return "timer-red";
  if (seconds < 30 * 60) return "timer-yellow";
  return "";
}

function formatQuestionLabel(problemId, groupIndex, questionLabel) {
  const settsumonNum = groupIndex + 1;
  return `問${problemId} 設問${settsumonNum} ${questionLabel}`;
}

export default function ExamScreen({
  problems,
  pdfFile,
  answers,
  onAnswerChange,
  timeRemaining,
  isPaused,
  onPauseToggle,
  onSubmit,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const pdfUrl = `/pdf-data/${pdfFile || "2024r06h_st_pm1_qs.pdf"}`;

  const activeProblem = problems && problems[activeTab];

  // activeProblem が存在しない場合は、読み込み中と表示
  if (!activeProblem) {
    return (
      <div className="exam-screen">
        <div className="timer-bar">
          <div className="timer-left">
            <span className="timer-label">読み込み中...</span>
          </div>
        </div>
        <div className="exam-body">
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>問題を読み込んでいます...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-screen">
      {/* ── 固定タイマーバー ── */}
      <div className="timer-bar">
        <div className="timer-left">
          <span className="timer-label">残り時間</span>
          <span className={`timer-value ${timerColorClass(timeRemaining)}`}>
            {formatTime(timeRemaining)}
          </span>
          {isPaused && <span className="paused-badge">一時停止中</span>}
        </div>
        <div className="timer-right">
          <button className="btn-pause" onClick={onPauseToggle}>
            {isPaused ? "▶ 再開" : "⏸ 一時停止"}
          </button>
          <button
            className="btn-score"
            onClick={() => setShowConfirm(true)}
          >
            採点する
          </button>
        </div>
      </div>

      {/* ── タブナビ ── */}
      <div className="tab-nav">
        {problems.map((p, i) => (
          <button
            key={p.id}
            className={`tab-btn ${activeTab === i ? "active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            <span className="tab-num">問{p.id}</span>
            <span className="tab-title-short">{p.title}</span>
          </button>
        ))}
      </div>

      {/* ── メインコンテンツ ── */}
      <div className="exam-body">
        {isPaused ? (
          <div className="pause-overlay">
            <div className="pause-card">
              <span className="pause-icon">⏸</span>
              <p>一時停止中</p>
              <button className="btn-resume" onClick={onPauseToggle}>
                ▶ 再開する
              </button>
            </div>
          </div>
        ) : (
          <div className="exam-layout">
            {/* 問題文パネル (PC: PDF ビューア / スマホ: PDFリンク) */}
            <div className="panel problem-panel">
              {/* PC用: iframeでPDF表示 */}
              <div className="pdf-viewer-container">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  title="問題文PDF"
                  className="pdf-iframe"
                />
              </div>

              {/* スマホ用: PDFを開くボタン */}
              <div className="problem-panel-mobile">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pdf-open"
                >
                  📄 問題PDFを開く
                </a>
              </div>
            </div>

            {/* 解答欄パネル */}
            <div className="panel answer-panel">
              <h2 className="panel-heading">解答欄</h2>
              {activeProblem.questionGroups &&
                activeProblem.questionGroups
                  .flatMap((group, gIdx) =>
                    group.questions.map((q) => {
                      // 複数小問の場合は、subQuestionsの個別処理
                      if (q.subQuestions && q.questions) {
                        return q.questions.map((subQ) => {
                          const ans = answers[subQ.id] || "";
                          const len = ans.length;
                          const over = len > subQ.charLimit;
                          const fullLabel = formatQuestionLabel(
                            activeProblem.id,
                            gIdx,
                            subQ.label
                          );
                          return (
                            <div key={subQ.id} className="q-block">
                              <div className="q-meta">
                                <span className="q-label">{fullLabel}</span>
                                <span className="q-limit">
                                  {subQ.charLimit}字以内
                                </span>
                              </div>
                              <textarea
                                className={`q-textarea ${over ? "over" : ""}`}
                                value={ans}
                                onChange={(e) =>
                                  onAnswerChange(subQ.id, e.target.value)
                                }
                                placeholder={`${subQ.charLimit}字以内で解答してください`}
                                rows={3}
                              />
                              <div className={`char-count ${over ? "over" : ""}`}>
                                {len} / {subQ.charLimit} 字
                                {over ? " ⚠ 字数超過" : ""}
                              </div>
                            </div>
                          );
                        });
                      }
                      // 複数回答の場合
                      else if (q.isTwoAnswers && q.modelAnswers) {
                        return [0, 1].map((idx) => {
                          const ans = answers[q.id + "_" + idx] || "";
                          const len = ans.length;
                          const over = len > q.charLimit;
                          const labels = [
                            q.label === "設問2" ? "ア" : "①",
                            q.label === "設問2" ? "イ" : "②",
                          ];
                          const fullLabel = formatQuestionLabel(
                            activeProblem.id,
                            gIdx,
                            q.label + labels[idx]
                          );
                          return (
                            <div key={q.id + "_" + idx} className="q-block">
                              <div className="q-meta">
                                <span className="q-label">{fullLabel}</span>
                                <span className="q-limit">
                                  {q.charLimit}字以内
                                </span>
                              </div>
                              <textarea
                                className={`q-textarea ${over ? "over" : ""}`}
                                value={ans}
                                onChange={(e) =>
                                  onAnswerChange(q.id + "_" + idx, e.target.value)
                                }
                                placeholder={`${q.charLimit}字以内で解答してください`}
                                rows={3}
                              />
                              <div className={`char-count ${over ? "over" : ""}`}>
                                {len} / {q.charLimit} 字
                                {over ? " ⚠ 字数超過" : ""}
                              </div>
                            </div>
                          );
                        });
                      }
                      // 単一回答
                      else {
                        const ans = answers[q.id] || "";
                        const len = ans.length;
                        const over = len > q.charLimit;
                        const fullLabel = formatQuestionLabel(
                          activeProblem.id,
                          gIdx,
                          q.label
                        );
                        return (
                          <div key={q.id} className="q-block">
                            <div className="q-meta">
                              <span className="q-label">{fullLabel}</span>
                              <span className="q-limit">{q.charLimit}字以内</span>
                            </div>
                            <textarea
                              className={`q-textarea ${over ? "over" : ""}`}
                              value={ans}
                              onChange={(e) =>
                                onAnswerChange(q.id, e.target.value)
                              }
                              placeholder={`${q.charLimit}字以内で解答してください`}
                              rows={3}
                            />
                            <div className={`char-count ${over ? "over" : ""}`}>
                              {len} / {q.charLimit} 字{over ? " ⚠ 字数超過" : ""}
                            </div>
                          </div>
                        );
                      }
                    })
                  )
                  .flat()}
            </div>
          </div>
        )}
      </div>

      {/* ── 採点確認モーダル ── */}
      {showConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>採点しますか？</h3>
            <p>未回答の設問がある場合も採点を行います。よろしいですか？</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                キャンセル
              </button>
              <button className="btn-primary" onClick={onSubmit}>
                採点する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

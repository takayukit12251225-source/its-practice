import { useState } from "react";
import { loadHistory, deleteHistoryEntry } from "../utils/history";

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HistoryScreen({ onBack, onSelect }) {
  const [entries, setEntries] = useState(() => loadHistory());

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("この履歴を削除しますか？")) return;
    deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((en) => en.id !== id));
  };

  return (
    <div className="history-screen">
      <div className="history-hero">
        <div className="history-hero-inner">
          <button className="back-btn history-back-btn" onClick={onBack}>
            ← トップに戻る
          </button>
          <h1>解答履歴</h1>
          <p className="history-subtitle">最大20件まで保存されます</p>
        </div>
      </div>

      <div className="history-main">
        {entries.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">📋</div>
            <p className="history-empty-text">まだ解答履歴がありません</p>
            <p className="history-empty-sub">
              試験を受けると、ここに履歴が表示されます
            </p>
          </div>
        ) : (
          <div className="history-list">
            {entries.map((entry) => {
              const { score } = entry;
              let pctClass = "result-fail";
              if (score.pct >= 60) pctClass = "result-pass";
              else if (score.pct >= 40) pctClass = "result-mid";

              return (
                <div
                  key={entry.id}
                  className="history-card"
                  onClick={() => onSelect(entry)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelect(entry)}
                >
                  <div className="history-card-main">
                    <div className="history-card-row1">
                      <span className="history-date">{formatDate(entry.date)}</span>
                      <span className={`history-pct-badge ${pctClass}`}>
                        {score.pct}%
                      </span>
                    </div>
                    <div className="history-card-row2">
                      <span className="history-year-tag">{entry.yearLabel}</span>
                    </div>
                    <div className="history-card-row3">
                      <span className="hmark hmark-circle">○ {score.circles}</span>
                      <span className="hmark hmark-tri">△ {score.tris}</span>
                      <span className="hmark hmark-cross">× {score.crosses}</span>
                      <span className="hmark hmark-time">
                        ⏱ {formatTime(entry.timeUsed)}
                      </span>
                    </div>
                  </div>
                  <div className="history-card-side">
                    <span className="history-card-arrow">→</span>
                    <button
                      className="history-delete-btn"
                      onClick={(e) => handleDelete(e, entry.id)}
                      title="この履歴を削除"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

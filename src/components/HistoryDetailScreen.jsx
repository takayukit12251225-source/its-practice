import { buildResults } from "../utils/scoring";
import { exams } from "../data/exams";
import ScoreResults from "./ScoreResults";

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

export default function HistoryDetailScreen({ entry, onBack }) {
  const examData = exams[entry.yearKey];
  const problems = examData
    ? examData.problems.filter((p) => entry.problemIds.includes(p.id))
    : [];
  const results = buildResults(problems, entry.answers);

  return (
    <div className="score-screen">
      <div className="score-header">
        <h1>解答履歴の詳細</h1>
        <p className="time-used">
          {formatDate(entry.date)}　{entry.yearLabel}　解答時間: {formatTime(entry.timeUsed)}
        </p>
      </div>
      <ScoreResults results={results} />
      <div className="score-footer">
        <button className="btn-restart" onClick={onBack}>
          ← 履歴一覧に戻る
        </button>
      </div>
    </div>
  );
}

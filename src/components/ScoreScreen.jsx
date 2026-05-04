import { buildResults } from "../utils/scoring";
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

export default function ScoreScreen({ problems, answers, timeUsed, onRestart }) {
  const results = buildResults(problems, answers);

  return (
    <div className="score-screen">
      <div className="score-header">
        <h1>採点結果</h1>
        <p className="time-used">解答時間: {formatTime(timeUsed)}</p>
      </div>
      <ScoreResults results={results} />
      <div className="score-footer">
        <button className="btn-restart" onClick={onRestart}>
          トップに戻る
        </button>
      </div>
    </div>
  );
}

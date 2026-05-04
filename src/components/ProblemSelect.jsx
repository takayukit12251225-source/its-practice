import { useState } from "react";

export default function ProblemSelect({ problems, year, onSelect, onBack }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="select-screen">
      <div className="select-header">
        <button className="back-btn" onClick={onBack}>
          ← トップに戻る
        </button>
        <h1>{year}</h1>
        <p className="select-instruction">
          解答する問題を <strong>2問</strong> 選択してください
        </p>
      </div>

      <div className="problem-cards">
        {problems.map((p) => {
          const isSelected = selected.includes(p.id);
          const isDisabled = !isSelected && selected.length >= 2;
          return (
            <button
              key={p.id}
              className={`problem-card ${isSelected ? "selected" : ""} ${
                isDisabled ? "disabled" : ""
              }`}
              onClick={() => !isDisabled && toggle(p.id)}
              disabled={isDisabled}
            >
              <div className="card-top">
                <span className="problem-num">問{p.id}</span>
                {isSelected && (
                  <span className="selected-badge">✓ 選択中</span>
                )}
              </div>
              <h3 className="card-title">{p.title}</h3>
              <p className="card-summary">{p.summary}</p>
              <div className="card-footer">
                <span className="q-count">
                  設問数:{" "}
                  {p.questionGroups
                    ? p.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)
                    : 0}
                  問
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="select-footer">
        <span className="selected-count">
          {selected.length} / 2 問 選択済み
        </span>
        <button
          className="start-btn"
          disabled={selected.length !== 2}
          onClick={() => onSelect(selected)}
        >
          試験を開始する →
        </button>
      </div>
    </div>
  );
}

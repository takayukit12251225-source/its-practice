import { exams } from "../data/exams";

export default function TopScreen({ onYearSelect }) {
  return (
    <div className="top-screen">
      <header className="top-hero">
        <div className="top-hero-inner">
          <p className="top-badge">情報処理技術者試験</p>
          <h1>ITストラテジスト試験</h1>
          <p className="top-subtitle">午後Ⅰ 記述式問題 練習アプリ</p>
        </div>
      </header>

      <main className="top-main">
        <section className="year-section">
          <h2 className="section-title">年度を選択</h2>
          <div className="year-list">
            {Object.entries(exams).map(([key, data]) => (
              <button
                key={key}
                className="year-card"
                onClick={() => onYearSelect(key)}
              >
                <div className="year-card-left">
                  <span className="year-name">{data.year}</span>
                  <span className="year-meta">
                    全{data.problems.length}問 → 2問選択
                  </span>
                </div>
                <div className="year-card-right">
                  <span className="year-arrow">→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2 className="section-title">試験について</h2>
          <ul className="info-list">
            <li>3問の中から2問を選択して解答します</li>
            <li>制限時間は90分（カウントダウン表示）</li>
            <li>各設問は字数制限付きの記述式解答です</li>
            <li>解答後，キーワードマッチングで自動採点します</li>
            <li>模範解答・採点講評も確認できます</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

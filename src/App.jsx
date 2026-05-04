import { useState, useEffect, useRef } from "react";
import TopScreen from "./components/TopScreen";
import ProblemSelect from "./components/ProblemSelect";
import ExamScreen from "./components/ExamScreen";
import ScoreScreen from "./components/ScoreScreen";
import HistoryScreen from "./components/HistoryScreen";
import HistoryDetailScreen from "./components/HistoryDetailScreen";
import { exams } from "./data/exams";
import { computeScore } from "./utils/scoring";
import { saveHistoryEntry } from "./utils/history";
import "./App.css";

const EXAM_DURATION = 90 * 60;

export default function App() {
  const [screen, setScreen] = useState("top");
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [examActive, setExamActive] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);

  // タイマー切れ時の二重保存防止
  const historySavedRef = useRef(false);

  const examData = selectedYear ? exams[selectedYear] : null;
  const selectedProblemData = examData
    ? examData.problems.filter((p) => selectedProblems.includes(p.id))
    : [];

  useEffect(() => {
    if (!examActive || isPaused) return;
    if (timeRemaining <= 0) {
      setExamActive(false);
      setScreen("score");
      return;
    }
    const id = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          setExamActive(false);
          // タイマー切れ時の履歴保存
          if (!historySavedRef.current) {
            historySavedRef.current = true;
            const score = computeScore(selectedProblemData, answers);
            saveHistoryEntry({
              id: Date.now(),
              date: new Date().toISOString(),
              yearKey: selectedYear,
              yearLabel: examData?.year ?? "",
              problemIds: selectedProblems,
              answers: { ...answers },
              timeUsed: EXAM_DURATION,
              score,
            });
          }
          setScreen("score");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [examActive, isPaused, timeRemaining]);

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setScreen("select");
  };

  const handleProblemSelect = (ids) => {
    setSelectedProblems(ids);
    setAnswers({});
    setTimeRemaining(EXAM_DURATION);
    setIsPaused(false);
    historySavedRef.current = false;
    setExamActive(true);
    setScreen("exam");
  };

  const handleSubmit = () => {
    setExamActive(false);
    const timeUsed = EXAM_DURATION - timeRemaining;
    const score = computeScore(selectedProblemData, answers);
    saveHistoryEntry({
      id: Date.now(),
      date: new Date().toISOString(),
      yearKey: selectedYear,
      yearLabel: examData?.year ?? "",
      problemIds: selectedProblems,
      answers: { ...answers },
      timeUsed,
      score,
    });
    historySavedRef.current = true;
    setScreen("score");
  };

  const handleRestart = () => {
    setSelectedYear(null);
    setSelectedProblems([]);
    setAnswers({});
    setTimeRemaining(EXAM_DURATION);
    setIsPaused(false);
    setExamActive(false);
    setScreen("top");
  };

  return (
    <>
      {screen === "top" && (
        <TopScreen
          onYearSelect={handleYearSelect}
          onShowHistory={() => setScreen("history")}
        />
      )}
      {screen === "select" && examData && (
        <ProblemSelect
          problems={examData.problems}
          year={examData.year}
          onSelect={handleProblemSelect}
          onBack={() => setScreen("top")}
        />
      )}
      {screen === "exam" && (
        <ExamScreen
          problems={selectedProblemData}
          pdfFile={examData?.pdfFile}
          answers={answers}
          onAnswerChange={(id, val) =>
            setAnswers((prev) => ({ ...prev, [id]: val }))
          }
          timeRemaining={timeRemaining}
          isPaused={isPaused}
          onPauseToggle={() => setIsPaused((p) => !p)}
          onSubmit={handleSubmit}
        />
      )}
      {screen === "score" && (
        <ScoreScreen
          problems={selectedProblemData}
          answers={answers}
          timeUsed={EXAM_DURATION - timeRemaining}
          onRestart={handleRestart}
        />
      )}
      {screen === "history" && (
        <HistoryScreen
          onBack={() => setScreen("top")}
          onSelect={(entry) => {
            setSelectedHistoryEntry(entry);
            setScreen("historyDetail");
          }}
        />
      )}
      {screen === "historyDetail" && selectedHistoryEntry && (
        <HistoryDetailScreen
          entry={selectedHistoryEntry}
          onBack={() => setScreen("history")}
        />
      )}
    </>
  );
}

export function grade(question, answer) {
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

export function buildResults(problems, answers) {
  return problems.map((p) => {
    const gradedGroups = p.questionGroups.map((group) => ({
      ...group,
      questions: group.questions.map((q) => {
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
        } else if (q.isTwoAnswers && q.modelAnswers) {
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
        } else {
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
}

export function computeScore(problems, answers) {
  const results = buildResults(problems, answers);
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
  const pct = max === 0 ? 0 : Math.round((earned / max) * 100);
  return { circles, tris, crosses, total, pct };
}

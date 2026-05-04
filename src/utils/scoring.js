export function grade(question, answer) {
  const keywords = Array.isArray(question.keywords) ? question.keywords : [];
  const bonusKeywords = Array.isArray(question.bonusKeywords) ? question.bonusKeywords : [];

  if (!answer || answer.trim() === "") {
    return {
      mark: "×",
      foundRequired: [],
      foundBonus: [],
      notFoundRequired: keywords,
      notFoundBonus: bonusKeywords,
    };
  }

  const foundRequired = keywords.filter((kw) => answer.includes(kw));
  const notFoundRequired = keywords.filter((kw) => !answer.includes(kw));
  const foundBonus = bonusKeywords.filter((kw) => answer.includes(kw));
  const notFoundBonus = bonusKeywords.filter((kw) => !answer.includes(kw));

  const mark =
    foundRequired.length > 0 ? "○" : foundBonus.length > 0 ? "△" : "×";

  return { mark, foundRequired, foundBonus, notFoundRequired, notFoundBonus };
}

export function buildResults(problems, answers) {
  return problems.map((p) => {
    const gradedGroups = p.questionGroups.map((group) => ({
      ...group,
      questions: group.questions.map((q) => {
        if (q.subQuestions && q.questions) {
          return {
            ...q,
            questions: q.questions.map((subQ, idx) => {
              if (subQ.isTwoAnswers && subQ.keywordPairs) {
                return {
                  ...subQ,
                  answers: [0, 1].map((ansIdx) => {
                    const ans = answers[subQ.id + "_" + ansIdx] || "";
                    return {
                      ...grade(
                        {
                          keywords: subQ.keywordPairs[ansIdx],
                          bonusKeywords: subQ.bonusKeywordPairs?.[ansIdx] ?? [],
                        },
                        ans
                      ),
                      answer: ans,
                      modelAnswer: subQ.modelAnswers?.[ansIdx] ?? "",
                      keywords: subQ.keywordPairs[ansIdx],
                      bonusKeywords: subQ.bonusKeywordPairs?.[ansIdx] ?? [],
                      commentary: subQ.commentaries?.[ansIdx] ?? "",
                    };
                  }),
                };
              }
              return {
                ...subQ,
                answer: answers[subQ.id] || "",
                ...grade(subQ, answers[subQ.id] || ""),
                modelAnswer: q.modelAnswers?.[idx] ?? "",
                commentary: q.commentaries?.[idx] ?? "",
              };
            }),
          };
        } else if (q.isTwoAnswers && q.keywordPairs) {
          return {
            ...q,
            answers: [0, 1].map((idx) => {
              const ans = answers[q.id + "_" + idx] || "";
              return {
                ...grade(
                  {
                    keywords: q.keywordPairs[idx],
                    bonusKeywords: q.bonusKeywordPairs?.[idx] ?? [],
                  },
                  ans
                ),
                answer: ans,
                modelAnswer: q.modelAnswers?.[idx] ?? "",
                keywords: q.keywordPairs[idx],
                bonusKeywords: q.bonusKeywordPairs?.[idx] ?? [],
                commentary: q.commentaries?.[idx] ?? "",
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

function collectMarks(p) {
  const marks = [];
  p.gradedGroups.forEach((g) => {
    g.questions.forEach((q) => {
      if (q.subQuestions && q.questions) {
        q.questions.forEach((subQ) => {
          if (subQ.answers) {
            subQ.answers.forEach((a) => marks.push(a.mark));
          } else {
            marks.push(subQ.mark);
          }
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

export function computeScore(problems, answers) {
  const results = buildResults(problems, answers);

  const problemScores = results.map((p) => {
    const marks = collectMarks(p);
    const n = marks.length;
    const perQ = n === 0 ? 0 : 50 / n;
    const earned = marks.reduce(
      (sum, m) => sum + (m === "○" ? perQ : m === "△" ? perQ / 2 : 0),
      0
    );
    return { problemId: p.id, earned: Math.round(earned * 10) / 10, max: 50, n };
  });

  const allMarks = results.flatMap((p) => collectMarks(p));
  const circles = allMarks.filter((m) => m === "○").length;
  const tris = allMarks.filter((m) => m === "△").length;
  const crosses = allMarks.filter((m) => m === "×").length;

  const totalEarned = problemScores.reduce((sum, ps) => sum + ps.earned, 0);
  const totalMax = problemScores.length * 50;
  const total = Math.round(totalEarned * 10) / 10;
  const pct = totalMax === 0 ? 0 : Math.round((totalEarned / totalMax) * 100);

  return { problemScores, total, totalMax, circles, tris, crosses, pct };
}

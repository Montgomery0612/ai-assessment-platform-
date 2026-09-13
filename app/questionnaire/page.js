"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OPTION_LABELS,
  BFI_ITEMS,
  AI_ITEMS
} from "../../src/lib/items.js";

const ALL_ITEMS = [...BFI_ITEMS, ...AI_ITEMS];

function QuestionCard({ item, number, value, onChange }) {
  return (
    <div className={`q${value != null ? " answered" : ""}`} data-id={item.id}>
      <div className="q-head">
        <span className="q-num">{number}</span>
        <span className="q-text">{item.text}</span>
      </div>
      <div className="opts">
        {OPTION_LABELS.map((label, index) => {
          const optionValue = index + 1;
          return (
            <div className="opt" key={optionValue}>
              <input
                type="radio"
                id={`${item.id}_${optionValue}`}
                name={item.id}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(item.id, optionValue)}
              />
              <label htmlFor={`${item.id}_${optionValue}`}>
                <span className="num">{optionValue}</span>
                <span className="lbl">{label}</span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = useMemo(
    () => ALL_ITEMS.filter((item) => answers[item.id] != null).length,
    [answers]
  );

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const missing = ALL_ITEMS.filter((item) => answers[item.id] == null);

    if (missing.length > 0) {
      setError(`还有 ${missing.length} 道题未作答，请完成后再提交。`);
      const first = document.querySelector(`[data-id="${missing[0].id}"]`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.classList.add("highlight");
      setTimeout(() => first?.classList.remove("highlight"), 1600);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "提交失败，请稍后重试。");
        setSubmitting(false);
        return;
      }
      router.push(`/results?id=${data.id}`);
    } catch {
      setError("网络错误，提交失败，请稍后重试。");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>问卷调查</h1>
      <p className="lead">
        请根据你的真实感受作答，答案没有对错之分。所有题目作答完毕后点击提交。
      </p>

      <div className="progress-row">
        <span className="small muted" style={{ whiteSpace: "nowrap" }}>
          已答 {answeredCount} / {ALL_ITEMS.length}
        </span>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(answeredCount / ALL_ITEMS.length) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="section-label">
        <span className="badge">第一部分</span> 大五人格简版量表（BFI-10）
      </h2>
      <p className="small muted" style={{ marginBottom: 16 }}>
        以下描述是否符合你？请选择最接近你实际情况的一项。
      </p>
      {BFI_ITEMS.map((item, index) => (
        <QuestionCard
          key={item.id}
          item={item}
          number={index + 1}
          value={answers[item.id]}
          onChange={setAnswer}
        />
      ))}

      <h2 className="section-label">
        <span className="badge">第二部分</span> 对人工智能的态度与使用意愿
      </h2>
      <p className="small muted" style={{ marginBottom: 16 }}>
        请根据你对 AI 工具（如 ChatGPT、AI 助手等）的真实感受作答。
      </p>
      {AI_ITEMS.map((item, index) => (
        <QuestionCard
          key={item.id}
          item={item}
          number={BFI_ITEMS.length + index + 1}
          value={answers[item.id]}
          onChange={setAnswer}
        />
      ))}

      {error && <p className="form-error">{error}</p>}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "提交中…" : "提交并查看结果"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setAnswers({});
            setError("");
          }}
        >
          清空重填
        </button>
      </div>
    </form>
  );
}

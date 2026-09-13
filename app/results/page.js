"use client";

import { useEffect, useState } from "react";
import {
  BFI_DIMENSIONS,
  AI_SUBSCALES,
  DIMENSION_LABELS,
  SUBSCALE_LABELS
} from "../../src/lib/items.js";
import {
  bfiText,
  aiText,
  levelLabel,
  DISCLAIMER
} from "../../src/lib/interpretation.js";

function fmt(n) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function levelClass(score) {
  if (score >= 60) return "level-high";
  if (score <= 40) return "level-low";
  return "level-mid";
}

function RadarChart({ values, labels }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 34;
  const n = values.length;

  function point(r, i) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = values.map((v, i) => point((v / 100) * maxR, i));
  const polygon = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      {rings.map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => point(r * maxR, i).join(",")).join(" ")}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(maxR, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}
      <polygon points={polygon} fill="rgba(99,102,241,.28)" stroke="#6366f1" strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#4f46e5" />
      ))}
      {values.map((v, i) => {
        const [x, y] = point(maxR + 18, i);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize={11}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#64748b"
          >
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

function BarRow({ name, value, descriptive, interpretation }) {
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span className="bar-name">
          {name}
          {descriptive && <span className="tag">描述性 · 不计入总分</span>}
          <span className={`level-pill ${levelClass(value)}`}>{levelLabel(value)}</span>
        </span>
        <span className="bar-val">{fmt(value)}</span>
      </div>
      <div className={`bar${descriptive ? " descriptive" : ""}`}>
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <p className="interpretation">{interpretation}</p>
    </div>
  );
}

const FEEDBACK_FIELDS = Object.freeze([
  { key: "clarity", label: "题目容易理解" },
  { key: "usability", label: "平台容易使用" },
  { key: "interpretability", label: "结果解释容易理解" },
  { key: "length", label: "测评长度合适" }
]);

function FeedbackForm({ id }) {
  const [ratings, setRatings] = useState(() =>
    Object.fromEntries(FEEDBACK_FIELDS.map((f) => [f.key, 3]))
  );
  const [confusion, setConfusion] = useState("");
  const [improvements, setImprovements] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | done
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ratings, confusion, improvements })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error || "提交失败，请稍后重试。");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("网络错误，提交失败，请稍后重试。");
      setStatus("idle");
    }
  }

  return (
    <div className="card feedback-card">
      <div className="feedback-kicker">Pilot Feedback</div>
      <h2>帮助我们改进这次试测</h2>
      <p className="feedback-desc">反馈与匿名会话 ID 关联，不要求填写任何身份信息。</p>

      {status === "done" ? (
        <p className="feedback-thanks">感谢你的反馈！你的意见会帮助我们改进平台。</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="feedback-rating-row">
            {FEEDBACK_FIELDS.map((field) => (
              <div className="feedback-rating" key={field.key}>
                <label htmlFor={`fb-${field.key}`}>{field.label}</label>
                <select
                  id={`fb-${field.key}`}
                  value={ratings[field.key]}
                  onChange={(e) =>
                    setRatings((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="feedback-field">
            <label htmlFor="fb-confusion">哪些题目或部分令人困惑？</label>
            <textarea
              id="fb-confusion"
              rows={3}
              value={confusion}
              onChange={(e) => setConfusion(e.target.value)}
              placeholder="（可选，留空即可跳过）"
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="fb-improvements">你会如何改进本平台？</label>
            <textarea
              id="fb-improvements"
              rows={3}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="（可选，留空即可跳过）"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
              {status === "submitting" ? "提交中…" : "提交反馈"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) {
      setStatus("notfound");
      return;
    }
    fetch(`/api/submit?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.record) {
          setRecord(data.record);
          setStatus("ready");
        } else {
          setStatus("notfound");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return <p className="muted">正在加载结果…</p>;
  }
  if (status === "notfound") {
    return (
      <div className="card empty">
        <p>未找到对应的评估结果。</p>
        <p className="small">
          请先完成问卷；如果这是旧链接，可能需要重新提交评估。
        </p>
      </div>
    );
  }
  if (status === "error") {
    return <div className="card empty">加载失败，请刷新重试。</div>;
  }

  const { result } = record;
  const overall = result.ai.overall_positive_attitude;
  const bfiValues = BFI_DIMENSIONS.map((d) => result.bfi[d]);
  const bfiLabels = BFI_DIMENSIONS.map((d) => DIMENSION_LABELS[d]);

  return (
    <div>
      <div className="hero">
        <div className="hero-label">总体积极态度</div>
        <div className="hero-score">{fmt(overall)}</div>
        <div className="hero-unit">0–100 分 · 越高代表对 AI 的态度越积极</div>
      </div>

      <div className="results-grid">
        <div className="card">
          <h3>人格剖面（大五）</h3>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart values={bfiValues} labels={bfiLabels} />
          </div>
          <p className="small muted">
            雷达图展示五个维度的相对高低，便于直观比较各维度之间的差异。
          </p>
        </div>

        <div className="card">
          <h3>大五人格（0–100 分）</h3>
          {BFI_DIMENSIONS.map((dim) => (
            <BarRow
              key={dim}
              name={DIMENSION_LABELS[dim]}
              value={result.bfi[dim]}
              interpretation={bfiText(dim, result.bfi[dim])}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>AI 态度分量表（0–100 分）</h3>
        {AI_SUBSCALES.map((sub) => (
          <BarRow
            key={sub}
            name={SUBSCALE_LABELS[sub]}
            value={result.ai[sub]}
            descriptive={sub === "cautious_use"}
            interpretation={aiText(sub, result.ai[sub])}
          />
        ))}
      </div>

      <div className="disclaimer">{DISCLAIMER}</div>

      <FeedbackForm id={record.id} />
    </div>
  );
}

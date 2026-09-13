"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function fmt(n, digits = 1) {
  if (n == null) return "—";
  return Number(n).toFixed(digits);
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function StatCard({ value, label }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Histogram({ distribution }) {
  if (!distribution) return null;
  const max = Math.max(...distribution, 1);
  return (
    <div>
      <div className="hist">
        {distribution.map((count, i) => (
          <div
            key={i}
            className="hist-bar"
            style={{ height: `${(count / max) * 100}%` }}
            title={`${i * 10}–${i * 10 + 10}: ${count}`}
          >
            {count > 0 && <span className="count">{count}</span>}
          </div>
        ))}
      </div>
      <div className="hist-labels">
        {distribution.map((_, i) => (
          <span key={i}>{i * 10}</span>
        ))}
      </div>
    </div>
  );
}

function CorrHeatmap({ labels, matrix }) {
  if (!matrix || !labels.length) return null;
  function color(v) {
    if (v == null) return "transparent";
    const alpha = Math.min(1, Math.abs(v));
    return v >= 0 ? `rgba(99,102,241,${alpha})` : `rgba(239,68,68,${alpha})`;
  }
  function textColor(v) {
    return v != null && Math.abs(v) > 0.55 ? "#fff" : "inherit";
  }
  return (
    <div className="heatmap">
      <table>
        <thead>
          <tr>
            <th />
            {labels.map((l) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th>{labels[i]}</th>
              {row.map((v, j) => (
                <td key={j} style={{ background: color(v), color: textColor(v) }}>
                  {v == null ? "—" : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeedbackTextList({ title, entries }) {
  return (
    <div>
      <h4 style={{ margin: "20px 0 10px" }}>{title}</h4>
      {entries.length === 0 ? (
        <p className="small muted">（无人填写）</p>
      ) : (
        <ul className="feedback-list">
          {entries.map((entry, i) => (
            <li key={i} className="feedback-entry">
              <div className="feedback-entry-text">{entry.text}</div>
              <div className="feedback-entry-meta">
                {entry.id ? `匿名会话 ${entry.id}` : ""} · {fmtDate(entry.submittedAt)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setStats(data.stats);
        else setError("加载统计失败");
      })
      .catch(() => setError("加载统计失败，请刷新重试"));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  }

  if (error) return <div className="card empty">{error}</div>;
  if (!stats) return <p className="muted">正在加载统计…</p>;

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <h1 style={{ margin: 0 }}>研究者仪表盘</h1>
      <button className="btn btn-ghost btn-sm" onClick={logout}>
        退出登录
      </button>
    </div>
  );

  if (stats.count === 0) {
    return (
      <div>
        {header}
        <div className="card empty">
          <p>目前还没有参与者提交数据。</p>
          <p className="small">完成问卷后，这里会自动出现汇总统计。</p>
        </div>
      </div>
    );
  }

  const bfiMetrics = Object.entries(stats.summary).filter(([, v]) => v.group === "bfi");
  const aiMetrics = Object.entries(stats.summary).filter(([, v]) => v.group === "ai");
  const overallMean = stats.summary.overall_positive_attitude?.mean;

  const bfiItems = stats.itemDistributions.filter((i) => i.group === "bfi");
  const aiItems = stats.itemDistributions.filter((i) => i.group === "ai");

  return (
    <div>
      {header}
      <p className="lead">匿名聚合后的作答汇总（数据均不包含任何个人可识别信息）。</p>

      <div className="stat-grid">
        <StatCard value={stats.count} label="参与者数量" />
        <StatCard value={overallMean != null ? fmt(overallMean) : "—"} label="总体积极态度均值" />
        <StatCard value={fmtDate(stats.dateRange?.first)} label="首次提交" />
        <StatCard value={fmtDate(stats.dateRange?.last)} label="最近提交" />
        <StatCard value={stats.feedback?.count ?? 0} label="反馈数量" />
      </div>

      <div className="card">
        <h3>各维度平均分（0–100）</h3>
        <table className="metrics">
          <thead>
            <tr>
              <th>维度</th>
              <th>平均分</th>
              <th>标准差</th>
              <th>最低</th>
              <th>最高</th>
              <th>样本数</th>
            </tr>
          </thead>
          <tbody>
            {[...bfiMetrics, ...aiMetrics].map(([key, m]) => (
              <tr key={key}>
                <td>{m.label}</td>
                <td>{fmt(m.mean)}</td>
                <td>{fmt(m.std)}</td>
                <td>{fmt(m.min)}</td>
                <td>{fmt(m.max)}</td>
                <td>{m.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>分数分布：总体积极态度</h3>
        <Histogram distribution={stats.summary.overall_positive_attitude?.distribution} />
        <p className="small muted" style={{ marginTop: 8 }}>
          横轴为 0–100 分区间，纵轴为人数。
        </p>
      </div>

      <div className="card">
        <h3>题目层面回答分布（1–5）</h3>
        <h4 style={{ margin: "8px 0 12px" }}>大五人格（BFI-10）</h4>
        <div className="item-grid">
          {bfiItems.map((item) => {
            const max = Math.max(...item.counts, 1);
            return (
              <div className="item-cell" key={item.id}>
                <div className="item-text">
                  <b>{item.id}</b> · {item.text}
                </div>
                <div className="item-freq">
                  {item.counts.map((n, i) => (
                    <div
                      key={i}
                      className="freq-bar"
                      style={{ height: `${(n / max) * 100}%` }}
                      title={`选项 ${i + 1}: ${n} 人`}
                    >
                      {n > 0 && <span className="n">{n}</span>}
                    </div>
                  ))}
                </div>
                <div className="item-freq-labels">
                  {item.counts.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <h4 style={{ margin: "20px 0 12px" }}>AI 态度</h4>
        <div className="item-grid">
          {aiItems.map((item) => {
            const max = Math.max(...item.counts, 1);
            return (
              <div className="item-cell" key={item.id}>
                <div className="item-text">
                  <b>{item.id}</b> · {item.text}
                </div>
                <div className="item-freq">
                  {item.counts.map((n, i) => (
                    <div
                      key={i}
                      className="freq-bar"
                      style={{ height: `${(n / max) * 100}%` }}
                      title={`选项 ${i + 1}: ${n} 人`}
                    >
                      {n > 0 && <span className="n">{n}</span>}
                    </div>
                  ))}
                </div>
                <div className="item-freq-labels">
                  {item.counts.map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3>信度分析（克隆巴赫 α）</h3>
        <table className="metrics">
          <thead>
            <tr>
              <th>量表</th>
              <th>α 系数</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.cronbach.bfi).map(([dim, alpha]) => (
              <tr key={dim}>
                <td>BFI · {stats.summary[dim]?.label ?? dim}</td>
                <td>{alpha == null ? "样本不足" : alpha.toFixed(3)}</td>
              </tr>
            ))}
            <tr>
              <td>BFI-10 · 总体</td>
              <td>
                {stats.cronbach.bfiOverall == null
                  ? "样本不足"
                  : stats.cronbach.bfiOverall.toFixed(3)}
              </td>
            </tr>
            {Object.entries(stats.cronbach.ai).map(([sub, alpha]) => (
              <tr key={sub}>
                <td>AI · {stats.summary[sub]?.label ?? sub}</td>
                <td>{alpha == null ? "样本不足" : alpha.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 8 }}>
          注意：BFI-10 每个维度仅 2 题，α 系数参考价值有限，请谨慎解读。
        </p>
      </div>

      <div className="card">
        <h3>相关矩阵 · 大五人格五维</h3>
        <CorrHeatmap
          labels={stats.correlations.bfi.labels}
          matrix={stats.correlations.bfi.matrix}
        />
      </div>

      <div className="card">
        <h3>相关矩阵 · AI 态度分量表</h3>
        <CorrHeatmap
          labels={stats.correlations.ai.labels}
          matrix={stats.correlations.ai.matrix}
        />
      </div>

      <div className="card">
        <h3>每日完成情况</h3>
        {stats.perDay.length === 0 ? (
          <p className="muted">暂无数据。</p>
        ) : (
          <table className="metrics">
            <thead>
              <tr>
                <th>日期</th>
                <th>提交数</th>
              </tr>
            </thead>
            <tbody>
              {stats.perDay.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>试测反馈（Pilot Feedback）</h3>
        {stats.feedback.count === 0 ? (
          <p className="muted">暂无反馈，参与者完成测评后填写的反馈会显示在这里。</p>
        ) : (
          <>
            <table className="metrics">
              <thead>
                <tr>
                  <th>评分项</th>
                  <th>平均分（1–5）</th>
                  <th>样本数</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(stats.feedback.ratings).map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    <td>{r.mean != null ? fmt(r.mean) : "—"}</td>
                    <td>{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <FeedbackTextList
              title="哪些题目或部分令人困惑？"
              entries={stats.feedback.confusion}
            />
            <FeedbackTextList
              title="你会如何改进本平台？"
              entries={stats.feedback.improvements}
            />
          </>
        )}
      </div>
    </div>
  );
}

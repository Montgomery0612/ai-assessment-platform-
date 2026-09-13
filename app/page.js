"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [consented, setConsented] = useState(false);

  return (
    <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h1>介绍与知情同意</h1>
      <p className="lead">
        欢迎参与本次评估。在开始之前，请仔细阅读以下说明。
      </p>

      <h3>评估目的</h3>
      <p className="muted">
        本评估包含两部分：<b>大五人格简版量表（BFI-10）</b> 与
        <b> 对人工智能的态度与使用意愿量表</b>。目的是帮助你了解自己的性格倾向，
        以及你当前对 AI 工具的态度，用于教育与研究探索。
      </p>

      <h3>将收集哪些信息</h3>
      <ul className="consent-list muted">
        <li>你在 20 道题目上的作答（1–5 分选择）；</li>
        <li>提交的时间戳（用于汇总统计）。</li>
      </ul>
      <p className="muted">
        我们<b>不会</b>收集你的姓名、邮箱、手机号、IP 地址等任何个人可识别信息。
      </p>

      <h3>信息将如何使用</h3>
      <ul className="consent-list muted">
        <li>即时为你生成一份个人结果摘要（分数与解释）；</li>
        <li>所有参与者的作答会被<b>匿名聚合</b>，用于研究者分析（如平均值、分布、信度等）。</li>
      </ul>

      <h3>重要说明</h3>
      <p className="muted">
        本评估仅用于<b>教育 / 研究探索</b>，结果反映的是你当前的自我报告倾向，
        不是心理测量诊断，也<b>不构成临床或医学诊断</b>，不能作为任何医疗或专业决策的依据。
      </p>

      <label className="consent-box">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
        />
        <span>
          我已阅读并理解以上说明，自愿参与本次匿名评估，并同意将我的匿名作答用于聚合研究分析。
        </span>
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          className="btn btn-primary"
          disabled={!consented}
          onClick={() => router.push("/questionnaire")}
        >
          同意并开始评估
        </button>
        <button className="btn btn-ghost" onClick={() => router.push("/")}>
          我不同意
        </button>
      </div>

      <div className="notice">
        提示：点击「我不同意」将停留在本页，不会开始评估，也不会记录任何信息。
      </div>
    </div>
  );
}

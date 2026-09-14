"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "登录失败");
        setLoading(false);
      }
    } catch {
      setError("网络错误，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22 }}>管理员登录</h1>
      <p className="lead">请使用管理员账号登录，以查看后台汇总数据。</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">账号</label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="账号或邮箱"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="form-error" style={{ margin: "0 0 12px" }}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
    </div>
  );
}

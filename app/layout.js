import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AI 心理评估平台",
  description:
    "大五人格简版量表（BFI-10）与对人工智能的态度评估 · 仅供教育与研究探索"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <nav className="topnav">
          <div className="nav-inner">
            <Link href="/" className="brand">
              AI 心理评估平台
            </Link>
            <div className="nav-links">
              <Link href="/">知情说明</Link>
              <Link href="/questionnaire">问卷调查</Link>
              <Link href="/admin">管理员入口</Link>
            </div>
          </div>
        </nav>
        <main className="container">{children}</main>
        <footer className="footer">
          本平台仅用于教育与研究探索，不构成临床或医学诊断。
        </footer>
      </body>
    </html>
  );
}

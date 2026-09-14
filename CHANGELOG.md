# 更新日志 (Changelog)

本文件记录平台的重要变更。

## 2026-09-14

### 新增
- 技术报告：新增平台技术报告（中文 / 英文，LaTeX 源码 + PDF），见 `report/` 与 `report.zip`。
- 多账号管理员登录：通过 `ADMIN_ACCOUNTS` 支持多个管理员账号（`admin` 及邮箱账号）。

### 文档
- README 补充后台入口与默认管理员账号说明。

## 2026-09-13

### 新增
- 初始版本：AI 心理评估平台（Next.js 16 + Cloudflare Workers/D1），含 BFI-10 与「对 AI 的态度」两份问卷、匿名数据收集、研究者仪表盘。

### 安全
- 移除认证模块中硬编码的回退密码（fail closed）。

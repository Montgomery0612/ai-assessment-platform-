# AI 心理评估平台

一个基于 Next.js 的心理测评平台，包含「大五人格简版量表（BFI-10）」与「对人工智能的态度与使用意愿」两份问卷，以及匿名数据收集与研究者仪表盘。

> ⚠️ 本平台仅供教育与研究探索，结果不构成临床或医学诊断。

## 快速开始

1. 双击 `index.html` 打开**入口页**，或直接执行下面的命令；
2. 在本文件夹打开终端，运行：

```bash
npm run dev
```

3. 浏览器访问 [<http://localhost:3000>](https://github.com/Montgomery0612/ai-assessment-platform-)。

> 本文件夹已自带 `node_modules` 依赖，通常无需再 `npm install`。若启动报错，请先执行 `npm install`。

## 两个入口

| 入口 | 说明 |
| --- | --- |
| `index.html` | **入口页**（双击打开），检测本地服务状态并引导启动 |
| `问卷-离线版.html` | 离线问卷，双击即用、实时计分，但不保存数据 |

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 介绍与知情同意 |
| `/questionnaire` | 交互式问卷（20 题，5 点李克特） |
| `/results?id=…` | 参与者结果摘要（雷达图 + 条形图 + 解释） |
| `/admin` | 研究者仪表盘（人数 / 均值 / 分布 / 信度 / 相关） |

## 管理员登录

后台入口：`/admin`

| 默认账号 | 默认密码 |
| --- | --- |
| `admin` | `123456` |

> 管理员账号与密码可通过环境变量 `ADMIN_ACCOUNTS` 配置（见 `.env.example`）。

## 数据

- 答卷以 JSONL 追加存储在 `data/responses.jsonl`（首次提交时自动创建）。
- 仅记录作答与时间戳，**不收集任何个人可识别信息**。

## 目录结构

```
app/            页面与 API 路由（Next.js App Router）
  api/submit    提交答卷 + 按 id 查询
  api/stats     聚合统计
src/lib/
  scoring.js    纯计分模块（已测试）
  items.js      题目与标签（来自 config）
  interpretation.js  结果解释文案
  storage.js    JSONL 存储
  stats.js      聚合统计（均值/分布/α/相关）
config/         版本化题库配置
test/           计分单元测试（node test/scoring.test.js）
```

## 测试

```bash
node test/scoring.test.js
```

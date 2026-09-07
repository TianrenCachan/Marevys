# MARÉVYS — 上线与 AI 启用

本次保留 RC19 视觉设计，新增独立线上构建与同源 AI 后端。AI 只有在真实凭证和限流服务配置完整后才能调用；未配置时网页仍使用标明来源的本地解读。

## 本次交付状态（2026-09-06）

- 线上构建、AI 后端、三语来源说明及故障回退已完成。在线资源约 19 MB，入口 HTML 约 42 KB。
- 完整自动验证通过：52 项核心检查、60 项体验检查、44 项 Oracle 检查、30 项后端测试及线上构建检查。体验检查使用 DOM 模拟；当前环境未完成可视浏览器验收。HTTP 首页及直接引用资源返回正常。
- 真实 OpenAI 和 Redis 凭据尚未配置，没有进行真实付费模型调用。
- 用户已授权将精简源码发布至 `TianrenCachan/Marevys` 的 `main` 分支并创建 Vercel 预览站；GitHub 账户连接已核实拥有该仓库写入权限。
- Vercel 文件上传接口限制为 4 MB。完整图片保存在 GitHub；轻量上传方式可在构建时从固定提交下载并校验原图，页面上线后仍从本站缓存资源加载。
- GitHub 鉴权与仓库所有权已核实，远程仓库已初始化。105 张图片及字体已上传并核对，但完整源码树提交被自动审批拒绝：需要用户明确确认将完整源码、AI 后端和图片公开发布到该公共仓库。当前没有 Vercel 部署或在线网址。
- 新增固定 Git 提交的图片恢复脚本及 4 项验证，全部通过。该脚本只下载图片和字体，核对 SHA-256 与文件大小，不下载可执行代码。

## 运行与部署

需要 Node.js 22（本地也可使用 Node.js 24）。项目没有第三方运行时依赖。

```bash
npm run build:web
npm run dev
```

打开 http://localhost:4173 。`dist/index.html` 使用站点根路径，需通过 HTTP 打开。离线预览请使用原来的完整嵌入版。

Vercel 导入项目的配置已写入 `vercel.json`：Framework 为 Other，Build Command 为 `npm run build:web`，Output Directory 为 `dist`，Node.js 为 22.x。根目录应为含 `package.json` 和 `vercel.json` 的这一层。

上传/提交源代码及优化过的 `assets/`，由平台自动构建。无需上传 `source-images/`、`alternatives/`、`brand/`、ZIP 或离线 `index.html`。图片、字体、CSS 和 JS 都通过独立文件加载，使用内容哈希缓存。

现有 GitHub 仓库信息为 `TianrenCachan/Marevys`；只有成功连接并推送后才会启用 Git 自动部署。通过 Vercel 直接发布文件不等于已经同步 GitHub。

## 启用 AI

在 Vercel 项目的 Settings → Environment Variables 添加以下变量，并为测试版选择 Preview，正式版选择 Production。保存后重新部署。

| 变量 | 填写内容 |
| --- | --- |
| `OPENAI_API_KEY` | 你自己的 OpenAI 项目 API Key，仅服务器使用 |
| `OPENAI_MODEL` | 有访问权限、支持 Responses Structured Outputs 的模型 ID；示例 `gpt-5.6-luna` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis 数据库的 HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | 对应数据库的 REST Token |
| `RATE_LIMIT_SALT` | 私有随机字符串，至少 32 字符 |
| `AI_DAILY_REQUEST_LIMIT` | 每个 UTC 日的模型调用总上限；默认 100 |
| `AI_IP_DAILY_LIMIT` | 每个 IP 的每日调用上限；默认 3 |
| `AI_MAX_CONCURRENT` | 同时进行的模型调用上限；默认 4 |

`RATE_LIMIT_SALT` 可在你自己的终端生成，然后直接填入 Vercel：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

可从 Vercel Marketplace 连接 Upstash Redis，或在 Upstash 创建数据库后填写两个 REST 变量。请自行确认所选服务的付费计划；代码不会创建付费订阅。

本地调试时，把 `.env.example` 复制成 `.env.local` 并填值。`npm run check:config` 只报告变量是否存在，不打印秘密。配置存在不等于凭证有效，仍需真实请求验收。

## 解读与费用规则

- 三套入口共用 `POST /api/reading`，响应兼容原来的页面结构。
- 服务器从本地版本化资料重建符义/牌义/卦象；浏览器附带的文字和提示词不作为可信指令。
- Rune/Tarot 使用本站七日解读框架，易经侧重三至十二个月的结构和条件。这是网站的产品框架，不是传统方法的唯一期限。
- 模型只生成解读文字和两枚受控能量标签；已有产品目录和规则负责匹配器物，模型不生成名称、价格、图片或库存。
- 前后端都不自动重试付费请求。服务器模型请求超时 30 秒，前端最多等待 45 秒；错误、限流、未配置会切回本地解读。
- 使用 Redis 原子计数和并发租约，额度不足或限流服务异常时停止在线调用。
- 每日上限是**请求次数上限，不是金额上限**。还应在 OpenAI 项目中设置合适的消费限制，并观察真实 token 用量。
- 默认不保存问题原文或解读正文到应用日志。OpenAI 请求使用 `store:false`；这不等于提供方承诺零数据保留。其滥用监控及数据处理规则仍适用。

## 验收

```bash
npm run build:offline
npm test
```

自动测试使用模拟供应商响应，不会消耗 OpenAI 额度。真实密钥配置后，在 Preview 中分别完成符文、塔罗、易经解读，确认来源显示 AI；再检查法语、中文、英语输出和产品匹配。不要把本地 fallback 显示误当作真实 AI 已接通。

当前产品购买、会员历史和订阅仍是原有体验预览；这次仅增加网站部署与 AI 后端，不会自动开通真实支付或云端账号。

## 正式运营前的账户事项

当前已连接的 Vercel 团队是 `tianrenyufr-6442`，检查时为 Hobby。Vercel 官方限制 Hobby 用于个人非商业用途，面向顾客运营应使用合适的商业计划。域名绑定、业务主体/联系信息及真正的订单支付配置还需根据你的实际账户完成。

官方参考（2026-09-06 核对）：

- [Vercel Git 部署](https://vercel.com/docs/git)
- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel Hobby 使用范围](https://vercel.com/docs/plans/hobby)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI 模型目录](https://developers.openai.com/api/docs/models)

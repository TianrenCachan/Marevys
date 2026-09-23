# MARÉVYS RC22 — 部署与真实服务验收

本文件描述 RC22 的塔罗／星盘主流程，替代旧版的固定七日塔罗和本地自动回退说明。代码可以交付，不等于生产站点已升级。

## 本次状态（2026-09-22）

- 源码包含原创牌面、78 张旋转抽牌、资料摘要检索、单张补牌、本命星盘、双人比较盘及无付费会员的浏览器手记。
- 测试结果参见 VERIFICATION.txt。供应商响应测试使用模拟值；真实 OpenAI／Redis 服务尚未在本次环境验收。
- 本次配置检查未找到 OpenAI／Redis 必需环境变量。当前连接可见的 Vercel 团队未找到对应项目；无法据此更新或确认既有 marevys.vercel.app 的状态。
- 本文件不宣称完成新生产部署、模型权限验证、真实解读质量评估或跨设备账户功能。最终发布需指向实际持有该项目的 Vercel 团队／项目。

## 构建与函数

Node.js 22；安装 package-lock.json 中的依赖，项目已使用 astronomy-engine 与 @js-temporal/polyfill。

```sh
npm ci
npm run build:web
npm test
npm run dev
```

本地地址为 http://localhost:4173 。部署根目录为包含 package.json 和 vercel.json 的目录。vercel.json 配置 Build Command 为 npm run build:web、Output Directory 为 dist、Framework 为 Other。

| 路径 | 用途 | 函数超时 |
| --- | --- | --- |
| POST /api/tarot | 创建会话、固定抽牌、单张补牌 | 15 秒 |
| POST /api/reading | v1 兼容与 v2 深入解读 | 60 秒 |
| POST /api/astrology | 确定性本命盘／双人比较盘及基础象征解读 | 15 秒 |
| GET /api/locations | 出生城市搜索及 IANA 时区自动匹配 | 10 秒 |

函数 includeFiles 包含所需 server 文件；npm 运行时依赖由部署系统安装。dist 只包含公开网页资产，构建使用白名单暴露牌名和原创摘要。原始 PDF、书籍全文、私有工作目录和填好凭据的环境文件不能进入公开资源或提交。

静态 HTML、CSS、图片发布成功只能证明静态站点可访问，不能证明 Node.js API、Redis 或 OpenAI 已启用。旧离线完整嵌入 HTML 不支持 RC22 全部服务器功能。

## 环境变量

在实际 Vercel 项目中分别配置 Preview 与 Production 环境，保存后重新部署。本地使用 .env.local；仓库中的 .env.example 不包含凭据。

| 变量 | 要求与作用 |
| --- | --- |
| OPENAI_API_KEY | AI 必需；仅在服务器使用 |
| OPENAI_MODEL | AI 必需；账户可访问且支持 Responses 严格 JSON Schema 的确切模型 ID |
| UPSTASH_REDIS_REST_URL | AI 限额与生产塔罗会话必需；有效的 Upstash HTTPS REST URL |
| UPSTASH_REDIS_REST_TOKEN | 对应 Redis REST Token |
| RATE_LIMIT_SALT | AI 必需；至少 32 字符的私有随机值，用于 IP 标识；同时作为会话密钥的回退来源 |
| SESSION_SECRET | 可选独立会话密钥；设置后至少 32 字符。否则使用 RATE_LIMIT_SALT |
| AI_DAILY_REQUEST_LIMIT | 每个 UTC 日全站 AI 请求上限，默认 100 |
| AI_IP_DAILY_LIMIT | 每个 UTC 日每个 IP 的 AI 请求上限，默认 3 |
| AI_MAX_CONCURRENT | AI 同时执行数量上限，默认 4 |
| AI_ALLOWED_ORIGINS | 可选的额外完整来源列表，逗号分隔；适用于 reading/tarot。完整应用建议同源 |
| TAROT_SESSION_STORAGE | 仅本地可设为 redis；生产始终使用 Redis |

本站不会为缺失的模型 ID 自动选模型。更新环境中的模型 ID 不等于该账户有访问权限，仍需真实请求。

可以在私有终端独立生成两个随机值，用于 RATE_LIMIT_SALT 和 SESSION_SECRET：

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

稳定的有效会话密钥必须在同一环境的实例间保持一致。修改它会使已有抽牌令牌失效。若独立设置 SESSION_SECRET，单独轮换 RATE_LIMIT_SALT 不会改变会话加密密钥；会改变限额中的 IP 标识。不要在公共 issue、截图或日志中贴出任何密钥或完整会话令牌。

## 各功能的失败方式

- 生产环境缺少会话密钥或 Redis：拒绝塔罗抽牌，不使用不安全默认密钥或进程内账本。
- 本地无配置：允许临时进程内塔罗会话；重启进程会使这些会话失效。这不能模拟多实例生产持久化。
- 缺少 AI 配置、限额服务异常、达到限额、模型拒绝或响应无法校验：返回明确错误，不把本地牌义标记为 AI。
- 本命星盘计算和基础象征解读不需要 OpenAI；AI 深入解读仍需要完整 AI 配置。
- v2 AI 请求超时 45 秒，v1 为 30 秒；浏览器最长等待 55 秒。并发租约为 55 秒。没有自动重试付费请求。

## 限额与保存

默认的每 IP 每日 3 次适合很小流量。初次 AI 解读、追问和补牌后的 AI 解读分别消耗一次额度；洗牌、翻牌、补牌抽取、星盘计算本身不消耗 AI 额度。专家批量验收需要根据预算主动设置合适上限。本次代码没有扩大默认限额。

计数在调用模型前预留，失败请求不退还每日计数。每日次数上限不是金额上限。成功返回中的 metadata.usage 提供供应商实际返回的 token 用量；需要结合实际模型及账户账单监控成本。

生产 Redis 中的塔罗上下文与牌堆使用 AES-256-GCM 加密，7 天到期。读取、固定选牌和补牌通过原子状态更新防止旧令牌重放或并发换牌。没有在 Redis 保存 AI 正文。限额使用 HMAC 后的 IP 标识。应用不会主动记录问题正文或出生信息。

当前塔罗流程保存在 sessionStorage；只有明确保存的手记进入 localStorage。保存的星盘手记包含出生信息、盘面和文字；当前没有账户、云端历史或跨设备同步。AI 请求发送 store:false，但这不代表供应商零保留承诺。

## 真实服务验收

先执行 npm run check:config。它只验证格式及必需变量，不发网络请求、不打印秘密。随后在实际 Preview 环境完成以下验收：

1. 在同源页面创建三张或五张牌阵，确认刷新后牌、正逆位、原问题不变。
2. 开始 AI 解读，确认接口为 HTTP 200、source 为 ai，readingId 与抽牌一致，metadata.model 是预期模型；有 usage 时核对供应商账单。
3. 检查解读引用的牌、牌位、正逆位及 PDF 页码，确认没有把三张独立牌义简单拼接成结果。
4. 追问和补牌各一次，确认原牌保留，不能通过旧请求覆盖原牌或再换一张补牌。
5. 在法语、中文、英语中确认输出语言正确；同一抽牌换语言仍保持原 readingId 与牌阵。
6. 用已知出生时间计算本命盘，检查时区及夏令时；用未知时间确认没有上升、宫位或精确相位。AI 只解读该盘面，不自算替代位置。
7. 确认限额或服务故障时展示明确状态，已抽牌和已计算的盘面保留，页面没有伪造 AI 成功。
8. 与专业同事用相同案例盲评针对性、依据、一致性与行动建议；代码测试不代替专业阅读评审。

确认实际项目访问权限、环境变量和以上真实流程后，才可以把新版本标记为生产就绪。没有新增计费、会员认证、支付或邮件服务。

官方接口参考：[OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)。具体模型访问和当前计费以实际账户为准。

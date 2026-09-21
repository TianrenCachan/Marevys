# MARÉVYS RC21 — v2 API 契约

本文件描述当前在线主流程。api/reading.js 同时保留原有 schemaVersion:1 的 Rune／旧塔罗／易经兼容路径；v1 原字段及旧输出保持不变。RC21 首页使用 v2 塔罗和本命星盘。

## 通用要求

- POST 必须使用 application/json，浏览器与 API 同源；请求通过 Origin 及 Sec-Fetch-Site 检查。
- reading/tarot 请求上限为 32 KiB，astrology 为 8 KiB。
- reading/tarot 出错返回 {error:{code},requestId}；限额错误可能包含 Retry-After 响应头。
- 所有秘密留在服务器。浏览器提交的牌义、提示词、星盘事实和来源不能成为可信模型输入。
- 服务器响应不含 HTML。前端继续以纯文本呈现并转义内容。

## 1. 创建塔罗会话

POST /api/tarot

```json
{
  "action": "start",
  "locale": "zh",
  "question": "我该如何推进当前的合作？",
  "background": "双方对分工还没有达成一致。",
  "timeframe": "未来一个月",
  "spreadId": "three",
  "usesReversals": true
}
```

locale 支持 en/fr/zh；question 为 5–2000 字符，background 为 0–3000 字符，timeframe 为 1–160 字符。背景可以省略。

| spreadId | 固定牌位 ID |
| --- | --- |
| one | focus |
| three | situation、obstacle、action |
| five | theme、obstacle、opportunity、support、perspective |

返回 schemaVersion:2、token、readingId、status:shuffled、context、cardCount:78、expiresAt、clarifierQuestion:null。context.positions 包含三语牌位名称。此时不返回牌堆或任何未揭开的牌；完整牌堆保存在经过认证加密的令牌与服务器状态中。

## 2. 确认选牌

POST /api/tarot

```json
{"action":"reveal","token":"<private token>","indices":[5,19,60]}
```

indices 为 0–77 的互不重复整数，数量必须等于牌阵张数。顺序对应牌位。服务器返回新 token、status:revealed，以及 cards：

```json
{
  "id": "TAROT_00",
  "orientation": "upright",
  "positionId": "situation",
  "position": {"en":"The situation","fr":"La situation","zh":"当前处境"},
  "name": {"en":"The Fool","fr":"Le Mat","zh":"愚者"}
}
```

上述卡牌仅为格式示例，实际结果来自加密的原牌堆。相同请求可重放获得相同结果；不同 indices 不能覆盖已固定的牌。并发请求由 Redis 原子比较更新保证仅一组选择生效。

## 3. 一张澄清牌

POST /api/tarot

```json
{"action":"clarify","token":"<latest private token>","question":"我可以怎样开启分工讨论？"}
```

question 为 5–1000 字符。返回 status:clarified、新 token、原有 cards 加一张 positionId:clarifier 的卡牌和 clarifierQuestion。它固定取原牌堆第一张未使用的牌，不重新洗牌。重复同一请求返回同一结果；更换澄清问题或请求第二张补牌被拒绝。

## 4. 塔罗 AI 深入解读与追问

POST /api/reading

```json
{
  "schemaVersion": 2,
  "system": "TAROT",
  "token": "<revealed or clarified private token>",
  "locale": "zh"
}
```

可选 followupQuestion 为 5–2000 字符。locale 可省略，默认使用创建会话时的语言；也可选择 en/fr/zh 重新解读同一牌阵。切换语言不改变 readingId、原问题、背景、关注期限、牌或正逆位。前端应保存每份已生成文字的实际语言，不将原文字冒充翻译后的结果。

服务器从令牌重建事实，按所抽牌直接读取原创摘要，再按问题、逆位、牌阵、宫廷牌及补牌需求检索相关方法。只有提供给模型的真实 sourceId／PDF 页码组合才允许出现在引用中。

成功响应：

```json
{
  "source": "ai",
  "readingId": "<same reading ID>",
  "reading": {
    "headline": "标题",
    "coreAnswer": "围绕原问题的综合解读",
    "cardReadings": [{"cardId":"TAROT_00","positionId":"situation","text":"结合牌位与背景的解释"}],
    "connections": ["牌之间的关系"],
    "uncertainties": ["仍需澄清的背景"],
    "actions": ["一个可实施行动", "另一个行动"],
    "reflection": "留待观察的问题",
    "followupAnswer": null,
    "sources": [{"sourceId":"tarot_already","page":112}]
  },
  "metadata": {
    "model": "<configured model>",
    "knowledgeVersion": 2,
    "knowledgeStatus": "curated_draft_not_professionally_reviewed",
    "sources": [{"id":"tarot_already","title":"其实你已经很塔罗了（图文版）"}]
  }
}
```

示例仅说明字段。cardReadings 必须与实际全部 cards 按原顺序一一对应；单张牌阵也必须包含 connections，用于关联该牌与用户处境。追问时 followupAnswer 为文本，否则为 null。metadata.usage 在供应商返回有效统计时提供 input_tokens、output_tokens、total_tokens。

本接口不接受客户端新增牌、替代出处或自定义输出字段；生成内容经过严格 JSON Schema 及服务器二次校验。原书目录与可提取文本不等同于完整训练语料，当前线上使用的是经整理的摘要。

## 5. 本命星盘

GET /api/locations?q=Paris&locale=fr 返回有限目录候选、limited:true 和 total。并非全球地理编码服务；没有的地点可手动输入坐标与 IANA 时区。

POST /api/astrology 接受以下字段，返回 {ok:true,chart,reading,requestId}：

```json
{
  "date":"1995-04-15",
  "time":"12:30",
  "timeUnknown":false,
  "latitude":48.8566,
  "longitude":2.3522,
  "timezone":"Europe/Paris",
  "locale":"fr",
  "topic":"work"
}
```

可选 locationId 会使用服务器城市目录的坐标与时区。timeUnknown:true 时 time 可为 null。具体出生范围、夏令时冲突及地点校验由 server/astrology.cjs 执行。

chart 包含行星、星座、整宫制宫位、上升、中天、主要相位、方法和警告。未知时间只返回当天范围和可能星座，不返回精确出生时刻位置、上升、宫位或相位。这里的 reading.mode 为 symbolic-basic，不是 AI。

AI 深入解读调用 POST /api/reading：

```json
{
  "schemaVersion":2,
  "system":"ASTROLOGY",
  "locale":"fr",
  "birth":{"date":"1995-04-15","time":null,"timeUnknown":true,"latitude":48.8566,"longitude":2.3522,"timezone":"Europe/Paris"},
  "topic":"work",
  "question":"Comment mieux comprendre mon rythme de travail ?"
}
```

服务器重新计算 birth，忽略浏览器提供的 chart。question 最多 2000 字符，topic 最多 300 字符。模型获取计算后的盘面事实，不直接收到出生日期及经纬度字段。

成功响应同样为 {source:ai,readingId,reading,metadata}，reading 包含 headline、coreAnswer、sections:[{title,text}]、actions、reflection、uncertainties。星盘 readingId 在 AI 请求成功时生成；前端可用于保存手记。

## 失败、限额与评估

常见错误码：AI_NOT_CONFIGURED、RATE_LIMITED、AI_TIMEOUT、AI_PROVIDER_UNAVAILABLE、INVALID_AI_RESPONSE、SESSION_NOT_CONFIGURED、SESSION_EXPIRED、INVALID_SELECTION、DRAW_ALREADY_FIXED、CLARIFIER_ALREADY_USED、INVALID_LOCALE。

AI 失败响应没有 source:ai 或伪造的 reading。保留既有牌阵、基础牌义或已计算星盘，由用户决定是否重试。每次真实 AI 请求先经过现有每日／IP／并发限额；补牌后的解读和追问也计数，不自动重试。

所有自动测试使用模拟 OpenAI／Redis，不证明真实模型质量或服务凭据有效。专业案例盲评与实际项目的线上验收仍需执行，参见 [DEPLOYMENT.md](DEPLOYMENT.md)。没有会员计费字段、支付接口或真实账户接口。

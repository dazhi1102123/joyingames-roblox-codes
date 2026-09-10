# 部署

## 先读这一段

**这套代码不能原样跑在 Cloudflare Workers 上。**

`lib/db.ts` 用的是 `better-sqlite3`——一个原生 Node 模块,把数据写进本地文件
`readings.db`。Cloudflare Workers 是 V8 isolate:没有原生模块,没有可写文件系统。
不是配置问题,是运行时不兼容,任何 flag 都绕不过去。

有两条路,下面各给一套完整流程。

| | A:Workers + D1 | B:VPS + Cloudflare 在前面 |
|---|---|---|
| 代码改动 | 数据层重写(见下) | **零** |
| 上线时间 | 1 天左右 | 1 小时 |
| 月成本 | ~$0(免费额度内) | VPS $5–10 |
| 静态页分发 | 边缘,最快 | 源站 + CDN 缓存,够快 |
| 40 万群发 | 受子请求上限约束,别放这儿 | 直接跑,无约束 |
| 运维 | 无 | 要管一台机器 |

**建议:先走 B 上线,A 作为之后的迁移目标。** 理由是这个项目现在最要紧的事是把
40 万邮件的冷启动跑起来,而那件事恰恰是 Workers 最不擅长的;等站稳了再迁 D1,
那时候改数据层也不会挡着任何人。

如果你就是要现在上 Workers,A 的流程是完整可执行的,只是要先做那次数据层重写。

---

# A:Cloudflare Workers + D1

## A0. 先确认一个风险点(5 分钟)

Waffo 的 SDK 用 node `crypto.createSign` / `createVerify` 做 RSA-SHA256 签名。
Workers 从 2025 年 4 月起 [完整支持 node:crypto](https://developers.cloudflare.com/changelog/2025-04-08-nodejs-crypto-and-tls/)
(例外只有 DSA/DH 密钥对和 ed448/x448),所以**应该**没问题——但这是整条 A 路的
单点依赖,值得在动手改数据层之前先花五分钟证实,而不是改完才发现。

建一个空 Worker,`compatibility_flags = ["nodejs_compat"]`,里面就一句:

```js
import { createSign } from "node:crypto"
export default {
  fetch() {
    const s = createSign("sha256")
    s.update("test")
    return new Response("createSign ok")
  }
}
```

`wrangler dev` 能跑通就继续;报错就走 B 路,别硬扛。

## A1. 数据层:better-sqlite3 → D1

好消息:**D1 就是 SQLite**,所以 `lib/db.ts` 里的 `SCHEMA`、`INDEXES` 和代码里
每一条 SQL 字符串都原样可用。要改的是调用方式,不是查询本身。

改动清单:

| 现在 | D1 |
|---|---|
| `db().prepare(sql).get(a, b)` | `await env.DB.prepare(sql).bind(a, b).first()` |
| `db().prepare(sql).all(a)` | `(await env.DB.prepare(sql).bind(a).all()).results` |
| `db().prepare(sql).run(a)` | `(await env.DB.prepare(sql).bind(a).run()).meta.changes` |
| `db().transaction(fn)()` | `await env.DB.batch([stmt1, stmt2, ...])` |
| 开库时跑 migration | `wrangler d1 execute` 跑一次迁移文件 |
| `node:fs` / `node:path` | 删掉,D1 没有文件 |

规模:18 个查询点,7 个模块共 47 个导出函数要变成 `async`,以及所有调用它们的
页面和 server action 要加 `await`。服务端组件本来就能 `await`,所以是机械改动,
不是重新设计。

**两个容易漏的地方:**

1. **`verify.ts` 那 145 项检查会全部失效。** 它直接调用 `lib/*` 的同步函数打真库。
   迁移后要么让它跑 `wrangler d1 execute --local`,要么在 miniflare 里跑。这套检查
   是这个项目最值钱的东西之一,别让它在迁移里悄悄死掉——**改完第一件事是让它重新
   变绿**,而不是最后一件。

2. **绑定的取法。** D1 实例来自 `getCloudflareContext()`,静态生成的路由必须用
   异步模式:

   ```ts
   import { getCloudflareContext } from "@opennextjs/cloudflare"

   // 普通动态路由
   const { env } = getCloudflareContext()
   // SSG / ISR 路由必须这样
   const { env } = await getCloudflareContext({ async: true })
   ```

   本项目有 1,269 个预渲染页面,所以异步模式那条是常态,不是特例。

## A2. 装适配器

```bash
cd tarot/web/apps/site
pnpm add @opennextjs/cloudflare@latest
pnpm add -D wrangler@latest
```

`open-next.config.ts`:

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare"
export default defineCloudflareConfig({})
```

`package.json` 加两个脚本:

```json
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy":  "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

## A3. 建 D1 库

```bash
npx wrangler d1 create arcana
```

把 `lib/db.ts` 里的 `SCHEMA` + `INDEXES` 抄进 `schema.sql`,然后:

```bash
npx wrangler d1 execute arcana --remote --file=./schema.sql
npx wrangler d1 execute arcana --local  --file=./schema.sql   # 本地开发用
```

## A4. `wrangler.jsonc`

```jsonc
{
  "name": "arcana",
  "main": ".open-next/worker.js",
  // 必须 2025-04-01 或更晚,否则 wrangler 里设的变量不会进 process.env
  "compatibility_date": "2026-09-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "arcana", "database_id": "<上一步输出的 id>" }
  ],
  "vars": {
    "NEXT_PUBLIC_SITE_URL": "https://arcanapress.com",
    "OPERATOR_LEGAL_NAME": "……",
    "MAIL_TX_FROM": "Arcana Press <hello@arcanapress.com>",
    "MAIL_MK_FROM": "Arcana Press <daily@arcanadaily.com>",
    "MAIL_POSTAL_ADDRESS": "……",
    "PAYMENT_PROVIDER": "waffo",
    "MAIL_PROVIDER": "resend",
    "AI_PROVIDER": "corpus"
  }
}
```

`compatibility_date` 那条注释不是废话:早于 2025-04-01 时
`nodejs_compat_populate_process_env` 不会自动开,`vars` 里的东西读不到,而代码里
到处都是 `process.env.X`,表现是一堆变量静默变成 undefined。

## A5. 密钥用 secret,不要用 vars

```bash
npx wrangler secret put WAFFO_PRIVATE_KEY
npx wrangler secret put WAFFO_MERCHANT_ID
npx wrangler secret put WAFFO_PRODUCT_ID
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put ANTHROPIC_API_KEY   # 或 KIE_API_KEY / OPENAI_API_KEY
```

`vars` 会明文写进 `wrangler.jsonc` 并进 git。**Waffo 私钥进过 git 就等于泄露**,
到 Waffo 后台重新生成再填。

## A6. 每日发送的定时触发

`@opennextjs/cloudflare` 生成的 Worker 只导出 `fetch`,没有 `scheduled`。所以
**不要**试图把 cron 挂在主 Worker 上,而是单独建一个几行的 Worker,定时去打
已有的那个路由:

```js
export default {
  async scheduled(event, env) {
    await fetch("https://arcanapress.com/api/cron/daily?send=1", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    })
  }
}
```

```jsonc
{ "triggers": { "crons": ["0 23 * * *"] } }   // UTC,对应北京时间早 7 点
```

**40 万邮件在这里会撞墙**:Workers 每次调用的子请求上限是 1000。现在的 mailer
一封一个请求,一次触发最多发 1000 封。发送逻辑本身是分页且可续跑的(按 UTC 零点
去重),所以理论上可以每 5 分钟触发一次跑到发完——但那是 400 次调用。真要在
Workers 上群发,先把 mailer 改成用 Resend 的批量接口(100 封/请求)。
**这是 A 路目前唯一没解决的东西**,也是我建议先走 B 的主要原因。

## A7. 上线

```bash
pnpm preview   # 本地用 workerd 跑一遍,不是 next dev
pnpm deploy
```

---

# B:VPS + Cloudflare 做 DNS/CDN/WAF

零代码改动,今天就能上。

## B1. 一台小机器

任意 VPS(2 核 2G 足够),Ubuntu,装 Node 22 + pnpm。

```bash
git clone -b claude/online-tarot-website-k6f31j <repo> arcana
cd arcana/tarot/web
pnpm install
pnpm build
```

## B2. 环境变量写进 systemd

`/etc/arcana.env`(权限 `chmod 600`,不进 git):

```
NEXT_PUBLIC_SITE_URL=https://arcanapress.com
OPERATOR_LEGAL_NAME=……
OPERATOR_ADDRESS=……
OPERATOR_COUNTRY=China
OPERATOR_EMAIL=hello@arcanapress.com
OPERATOR_REG_NUMBER=……
MAIL_TX_FROM=Arcana Press <hello@arcanapress.com>
MAIL_MK_FROM=Arcana Press <daily@arcanadaily.com>
MAIL_POSTAL_ADDRESS=……
MAIL_PROVIDER=resend
RESEND_API_KEY=……
PAYMENT_PROVIDER=waffo
WAFFO_MERCHANT_ID=……
WAFFO_PRIVATE_KEY=……
WAFFO_PRODUCT_ID=……
ADMIN_KEY=……
ADMIN_EMAILS=你的邮箱
READINGS_DB=/var/lib/arcana/readings.db
```

`/etc/systemd/system/arcana.service`:

```ini
[Unit]
After=network.target

[Service]
WorkingDirectory=/opt/arcana/tarot/web/apps/site
EnvironmentFile=/etc/arcana.env
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

`READINGS_DB` 指到 `/var/lib/arcana/` 而不是项目目录里——**否则下次
`git clean` 或重新 clone 会把整个数据库删掉**。

## B3. 每日发送用系统 cron

不需要 `CRON_SECRET`,也不需要那个路由,直接跑 CLI:

```cron
0 7 * * *  cd /opt/arcana/tarot/web/apps/site && set -a && . /etc/arcana.env && set +a && pnpm daily -- --send >> /var/log/arcana-daily.log 2>&1
```

第一次先不加 `--send` 跑一遍,确认牌和收件人数量对得上再加。

## B4. Cloudflare 那边

DNS 里加一条 A 记录指向 VPS,**橙色云开启**(走代理),然后:

- **SSL/TLS 模式设 Full (strict)**,机器上用 Caddy 或 certbot 装真证书。
  设成 Flexible 的话 Cloudflare 到你机器这段是明文 HTTP,而这条链路上跑着
  登录 cookie 和后台会话。
- **Cache Rules**:把 `/cards/*`、`/combinations/*`、`/questions/*`、
  `/birth-card/*` 这些静态内容页设成 Cache Everything。1,269 个预渲染页面
  基本都能吃到边缘缓存,SEO 抓取速度直接受益。
- **不要缓存** `/admin/*`、`/account/*`、`/desk/*`、`/order/*`、`/api/*`。
  这几条路径都带会话,缓存了就是把一个人的页面发给另一个人。
- WAF 开着默认规则就够。

---

# 两条路都要做:邮件的 DNS

这部分和跑在哪没关系,但它决定 40 万封信进不进收件箱。

**两个域名都要配**,在 Cloudflare DNS 里:

| 记录 | 作用 |
|---|---|
| SPF (`TXT`) | 声明谁能代你发信。Resend 会给你具体值 |
| DKIM (`TXT`) | 签名,Resend 给 |
| DMARC (`TXT`) | `v=DMARC1; p=none; rua=mailto:你的邮箱` 起步,观察两周再收紧到 `p=quarantine` |

DMARC 一上来就设 `p=reject` 是个常见的自伤动作——配错了自己的信全被拒,而且
你不会收到任何报告来告诉你哪里错了。先 `p=none` 收报告。

**然后养域名。** 新域名直发 40 万封是最快让自己被全网拦截的方式,不管同意手续
多干净。前两周每天几百封发给最活跃的地址,再逐步放量。

---

# 上线前的检查

```bash
pnpm build && pnpm verify     # 145 项,必须全绿
```

然后打开 `/admin`,顶部那几行状态是专门为这一刻做的:

- **Payment provider** —— 显示 `waffo` 而不是红字"selected but not configured"
- **Mail channels** —— 显示 `separated`。红字说明两个发信域名相同,营销邮件会被拒发
- **Interpretation** —— 显示你选的 provider;红字说明 key 没配,会退回语料解读
- `/legal/notice` 上不能有任何 **MISSING** 红字

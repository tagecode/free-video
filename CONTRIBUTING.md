# 贡献指南

感谢你愿意参与 Free Video。无论是报问题、补线路还是改代码，都很有价值。

## 报告问题

- **功能缺陷、界面问题**：使用 [Bug 报告](https://github.com/tagecode/free-video/issues/new?template=bug_report.yml) 模板，请附上系统版本、应用版本和复现步骤。
- **某条线路播不出来**：使用 [线路反馈](https://github.com/tagecode/free-video/issues/new?template=line_failure.yml) 模板。线路失效是这类项目的常态，附上实测结果能省掉大量来回沟通。
- **安全漏洞**：**不要开公开 issue**，请按 [SECURITY.md](SECURITY.md) 的流程私密报告。

提问前建议先看一眼 [常见问题](README.md#常见问题)。

## 开发环境

| 依赖    | 版本                                             |
| ------- | ------------------------------------------------ |
| Node.js | ≥ 22                                             |
| pnpm    | 10（由 `package.json` 的 `packageManager` 锁定） |

```bash
corepack enable   # 自动使用仓库锁定的 pnpm 版本
pnpm install
pnpm dev
```

`pnpm install` 会执行 `postinstall`，安装 Electron 并在必要时重建原生依赖；国内网络较慢时可参考 README 里的镜像配置。

辅助命令：

```bash
pnpm lint         # ESLint
pnpm test         # Vitest 单元测试
pnpm typecheck    # 类型检查（node 与 web 两套 tsconfig）
pnpm format       # Prettier 格式化
pnpm build        # 类型检查 + 构建到 out/
```

## 代码约定

- **TypeScript strict**，不要用 `any` 绕过类型；跨进程的数据结构定义在 `src/shared/`，并由 zod schema 校验。
- **主进程与渲染进程只通过 `src/shared/ipc.ts` 的契约通信**。新增 IPC 需要同时更新：handler（`src/main/ipc/handlers/`）、preload 白名单（`src/preload/index.ts`）、类型声明（`src/shared/api.ts`）。
- 样式统一走 Tailwind 工具类与 `src/renderer/src/components/ui/` 下的既有组件，不引入新的样式方案。
- 代码注释只写「为什么」，不复述代码在做什么。
- 提交前请确保 `pnpm lint`、`pnpm test` 与 `pnpm typecheck` 通过——CI 会在三个平台上跑这几项并完整打包。

## 提交规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，用中文描述：

```text
feat: 线路页支持拖拽排序
fix: 修复全屏后播放视图 bounds 未同步
docs: 补充线路导入的 JSON 格式说明
chore: 升级 electron 到 44.x
```

一个提交只做一件事。改动涉及用户可见行为时，在正文里写清楚原因（`fix`/`feat` 的「为什么」）比罗列文件更有用。

## 分支与 PR

1. 从 `main` 拉分支，命名随意但能看出意图（`feat/line-reorder`、`fix/fullscreen-bounds`）；
2. 保持 PR 聚焦，不要混入无关的格式化或重构；
3. PR 描述里说明：改了什么、为什么、怎么验证的；
4. 涉及界面的改动请附截图或录屏；
5. 合并后 `main` 会自动触发三平台构建，所有平台都必须通过。

## 最有价值的贡献：维护线路

内置线路位于 `resources/lines.default.json`，都是互联网上公开分享的第三方解析服务，随时可能停服。补一条能用的线路，往往比改十行代码对用户更有帮助。

提交线路时请一并给出实测信息：

```json
{ "name": "线路名称", "endpoint": "https://example.com/parse?url=", "joinMode": "prefix" }
```

- `joinMode: "prefix"` 表示把编码后的视频地址直接拼到末尾，`"template"` 表示地址中使用 `{url}` 占位符；
- 请确认实测可播放，并说明测试用的是哪个平台、什么视频页，附上响应耗时；
- 不要提交需要登录、需要邀请码或来源不明的接口。

## 许可

本项目采用 [MIT](LICENSE)。提交 PR 即表示你同意以相同许可发布你的贡献。

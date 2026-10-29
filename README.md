# Free Video

**一款跨平台 VIP 视频解析播放客户端** — 粘贴播放页链接即可观看，解析线路可自维护、失效可自愈。

[![build](https://github.com/tagecode/free-video/actions/workflows/build.yml/badge.svg)](https://github.com/tagecode/free-video/actions/workflows/build.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

---

## 简介

Free Video 把网页版的「视频解析」做成一个可安装、可自维护的桌面应用。它本身不存储、不代理任何视频内容，只做一件事：把你粘贴的视频页地址交给第三方解析接口，再把解析结果渲染在一个隔离的 `WebContentsView` 里。

相比直接用浏览器开解析站，它解决了四件事：

- **线路可管理** —— 内置线路可启用/禁用/排序，也能自己加、导入导出；
- **失效可自愈** —— 当前线路加载失败或超时时，自动按顺序落到下一条；
- **失败可诊断** —— 一键批量探测线路可用性，显示每条的响应耗时；
- **离线可留存** —— 播放历史与收藏落盘，重启不丢。

## 功能特性

### 解析与播放

- 粘贴腾讯视频、爱奇艺、优酷、芒果 TV、哔哩哔哩等平台的播放页地址，自动识别平台
- 下拉选择解析线路，记住上次选择
- 解析页加载在独立的 `WebContentsView` 中，**不受 `X-Frame-Options` / `frame-ancestors` 限制**（这是普通 `<iframe>` 做不到的）
- 加载失败或超时（默认 15s）时，自动尝试下一条线路，尝试次数可配
- 播放区支持重新加载、关闭

### 线路管理

- 内置 42 条线路，随应用发布，升级不会覆盖你的改动
- 启用 / 禁用 / 置顶 / 上移 / 下移，顺序影响默认选择与自动切换
- 自定义线路：前缀式（`前缀 + 地址`）或模板式（`{url}` 占位符），保存前可预览拼接结果
- 线路配置导出为 JSON、从 JSON 导入、一键恢复内置线路默认状态
- 一键健康检测：并发 6 条探测，展示 可用 / 失败 / 超时 与响应耗时

### 数据与设置

- 播放历史（最近 100 条，按视频地址 + 线路去重）、收藏
- 主题：深色 / 浅色 / 跟随系统
- 播放超时、健康检查超时、最大自动切换次数、代理
- 基于 `electron-updater` + GitHub Releases 的自动更新，启动静默检查 + 手动检查
- 首次启动展示免责声明，确认后方可使用

## 下载安装

前往 [Releases](https://github.com/tagecode/free-video/releases) 下载对应平台的安装包：

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows x64 | `FreeVideo-{version}-win-x64.exe` | NSIS 安装包 |
| macOS Intel | `FreeVideo-{version}-mac-x64.dmg` | macOS 12+ |
| macOS Apple Silicon | `FreeVideo-{version}-mac-arm64.dmg` | macOS 12+，M 系列芯片 |
| Linux x64 | `FreeVideo-{version}-linux-x86_64.AppImage` | 免安装，`chmod +x` 后直接运行 |
| Linux x64 | `FreeVideo-{version}-linux-amd64.deb` | Debian / Ubuntu |

> **macOS 首次打开**：当前版本未购买 Apple 开发者证书，仅做 ad-hoc 签名，系统会提示「无法验证开发者」。请**右键点击应用 → 打开**，或到「系统设置 → 隐私与安全性」中点击「仍要打开」。不要双击，双击会被拦截。

> **Windows 首次运行**：未做代码签名，SmartScreen 可能提示「已保护你的电脑」，点击「更多信息 → 仍要运行」。

## 使用

1. 在视频平台复制播放页地址，例如 `https://v.qq.com/x/cover/xxx.html`；
2. 粘贴到应用顶部地址栏，回车或点击「开始播放」；
3. 应用识别平台后，用当前线路发起解析。失败会自动换线，也可以手动在下拉框里换；
4. 某条线路长期不可用时，到「线路」页把它禁用，或检测一遍看看哪条还活着。

## 常见问题

**所有线路都解析失败？**
内置线路来自公开分享的第三方服务，随时可能停服，这是这类工具的固有现实。建议：在「线路」页执行健康检测排查，或自行添加已知可用的解析接口。应用不对内容可用性作任何承诺。

**为什么不用 `<iframe>` 直接嵌网页？**
绝大多数解析站的响应带有 `X-Frame-Options` 或 CSP `frame-ancestors` 限制，普通 iframe 会被浏览器拒绝渲染。`WebContentsView` 以独立 frame 加载，不受该限制。

**数据存在哪里？**
`electron-store` 写在系统的用户数据目录：Windows 为 `%APPDATA%\free-video`，macOS 为 `~/Library/Application Support/free-video`，Linux 为 `~/.config/free-video`。纯 JSON 文件，卸载前可自行备份。

**升级后我的线路配置会丢吗？**
不会。内置线路以只读形式随包分发，用户对内置线路的启用状态、排序、改名与自定义线路单独存放，升级只更新只读部分。

## 开发

### 环境要求

- Node.js ≥ 22
- pnpm 10（版本由 `package.json` 的 `packageManager` 字段锁定，`corepack enable` 即可自动匹配）

### 常用命令

```bash
pnpm install      # 安装依赖
pnpm dev          # 启动开发环境（主进程热重载 + 渲染进程 HMR）
pnpm lint         # ESLint 检查
pnpm typecheck    # TypeScript 类型检查（node + web 两套配置）
pnpm build        # 类型检查 + 构建到 out/
pnpm build:unpack # 只打包成目录，不做安装包，便于快速验证
```

### 打包安装包

```bash
pnpm build:win    # Windows → nsis
pnpm build:mac    # macOS → dmg + zip（x64 与 arm64 各一套）
pnpm build:linux  # Linux → AppImage + deb
```

跨平台打包建议直接在对应系统或 CI 上执行。国内网络若在打包阶段卡在下载 `dmgbuild` / `nsis` 等二进制（表现为 `Timeout awaiting 'request'`），设置镜像即可：

```bash
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

Electron 自身的下载镜像已在 `electron-builder.yml` 的 `electronDownload.mirror` 中配置。

### 发布

版本号以 `package.json` 为唯一来源。推送与版本号一致的 tag 会触发 `release.yml`，三平台并行打包并上传到 GitHub Release：

```bash
git tag v1.0.0
git push origin v1.0.0
```

tag 与 `package.json` 版本不一致时工作流会直接失败，避免发出错误版本的包。

### 目录结构

```
src/
├── main/          # 主进程：窗口、IPC 处理器、线路/历史/收藏/播放/更新服务
├── preload/       # 预加载脚本：向渲染进程暴露白名单 IPC
├── renderer/      # React UI：页面、组件、状态
└── shared/        # 三端共享：IPC 契约、zod schema、类型、URL 拼接与平台识别
resources/         # 随包分发的只读数据（内置线路）
build/             # 图标、entitlements 等打包资源
docs/              # 产品需求、技术架构文档
```

### 技术栈

| 层 | 选型 |
| --- | --- |
| 运行时 | Electron 44 |
| 构建 | electron-vite 6（Vite 8）、electron-builder 26 |
| 界面 | React 19、TypeScript 5.9（strict）、Tailwind CSS 4、Radix UI（shadcn 风格源码内联组件） |
| 状态与路由 | Zustand 5、React Router 7（HashRouter） |
| 存储 | electron-store 12，zod 4 统一校验 |
| 日志 / 更新 | electron-log 5、electron-updater 6 |

## 文档

- [产品需求文档 docs/Prd.md](docs/Prd.md)
- [技术架构文档 docs/Arch.md](docs/Arch.md)

## 免责声明

> **本项目仅供编程学习与技术研究使用。**
>
> - 本应用**不提供、不存储、不代理、不分发任何视频内容**，仅是第三方解析页面的容器；
> - 所有解析线路均为互联网公开分享的第三方服务，与本项目作者无关，其合法性、稳定性与安全性不做任何保证；
> - 使用本工具获取的内容，其版权归原权利人所有。请勿用于商业用途，请支持正版；
> - 因使用本工具产生的任何直接或间接后果（包括但不限于账号封禁、法律纠纷、数据损失），由使用者自行承担，作者不承担任何责任；
> - 如果你是权利人并认为本项目侵犯了你的权益，请提 issue 联系，我们将及时处理。

## 贡献

欢迎提交 Issue 与 Pull Request。

- 提交前请确保 `pnpm lint` 与 `pnpm typecheck` 通过（CI 会校验三平台构建）；
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)，如 `feat: 支持线路分组`、`fix: 修复全屏后 bounds 未同步`；
- **新增或更新内置线路**是最有价值的贡献之一，请附上实际测试结果（可用性、响应耗时、实测平台）。

## 许可证

[MIT](LICENSE) © 2026 tagecode

## 致谢

思路参考 [huangguangda/free_vip_video](https://github.com/huangguangda/free_vip_video) —— 一个把解析线路列表做到极致的单页实现。本项目的线路库源自其公开分享的清单，并在此基础上去重、结构化与持续维护。

# 下班倒计时 / Off-work Countdown

一个 DeepSeek Harness 插件：在页面上悬浮显示距离下班的时间，可自由拖动到任意位置（位置会记住）。

## 功能

- 工作日 **17:30** 前显示 `距下班还有 HH:MM:SS`
- 过了 17:30 显示 `已下班 🎉`
- 周六 / 周日显示 `周末休息 🎉`
- 中英文自动跟随界面语言
- 样式全部使用宿主主题 token，自动适配明 / 暗主题

## 安装

在 DeepSeek Harness 中把本目录作为 bundle 安装：

```bash
plugin_manager install_bundle "<本仓库绝对路径>"
```

或通过 Harness 的插件安装入口选择该目录。

## 目录结构

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包清单与 `dsh.client` 声明 |
| `cordis.patch.yml` | 注入插件行 |
| `index.js` | Host 半部分（无逻辑） |
| `client.js` | 倒计时渲染逻辑 |
| `locale/` | 中英文元数据 |
| `icon.svg` | 插件图标 |

## 验证

- 安装结果 `application: applied`
- 已在 `conversation.composer.dock` 槽位注册为活跃条目
- JS 语法检查通过

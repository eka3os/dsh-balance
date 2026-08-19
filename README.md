# dsh-balance

[English](#english) | [中文](#中文)

<a id="english"></a>

## English

A [DeepSeek Harness](https://github.com/deepseek-ai/dsh) Web plugin that displays your DeepSeek API balance in the sidebar footer.

![show balance](images/image.png)

> The plugin is currently `0.1.0` and requires DeepSeek Harness `>=0.1.0-rc.7`.

### Features

- Displays CNY and USD balances next to the sidebar settings area.
- Reads the balance through the official DeepSeek API endpoint.
- Keeps the API key on the server side; the browser only receives normalized balance data.
- Refreshes the balance automatically every 60 seconds.
- Shows `--` while loading, when no balance is available, or when the request fails.
- Supports installation directly from a GitHub repository.

### Requirements

- DeepSeek Harness `>=0.1.0-rc.7`
- The `web` profile
- A configured `DEEPSEEK_API_KEY`

### Installation

#### Install directly from GitHub

```bash
dsh plugin --profile web add github:eka3os/dsh-balance
```

Restart the Web profile after installation:

```bash
dsh web
```

`dsh plugin` installs the package into the selected profile and automatically activates it as a profile bundle because this package declares `dsh.bundle.patch`.

### Configuration

The plugin uses the `DEEPSEEK_API_KEY` credential reference. Configure the key through the DeepSeek Harness credentials/settings UI when available. You can also provide it through the launch environment for a single run:

```bash
DEEPSEEK_API_KEY=sk-your-key dsh web
```

For a managed local credential, add the key to `$DSH_HOME/.credentials.yaml`:

```yaml
DEEPSEEK_API_KEY: sk-your-key
```

Do not commit API keys or credential files to Git.

### How it works

1. The Host plugin registers `GET /api/dsh-balance`.
2. The route resolves `DEEPSEEK_API_KEY` through DSH credentials.
3. The Host requests `https://api.deepseek.com/user/balance` with a server-side Bearer token.
4. The client plugin renders the returned CNY/USD balances in the sidebar footer.
5. The client repeats the request every 60 seconds while the wide sidebar is visible.

### API endpoint

| Method | Path | Description |
| --- | --- | --- |
| `GET`, `HEAD` | `/api/dsh-balance` | Returns the current DeepSeek API balance. |

Successful responses contain the following shape:

```json
{
  "isAvailable": true,
  "balances": [
    { "currency": "CNY", "totalBalance": "10.00" },
    { "currency": "USD", "totalBalance": "1.00" }
  ]
}
```

The route returns `503` when the credential is missing and `502` when the DeepSeek API cannot be reached or returns an unsuccessful response. Unsupported methods return `405`.

### GitHub distribution

This plugin is distributed through GitHub only and is not published to npm. Push the repository to GitHub and make sure the built `lib/` files and the package files listed in `package.json` are committed.

### License

MIT

---

<a id="中文"></a>

## 中文

一个用于 [DeepSeek Harness](https://github.com/deepseek-ai/dsh) Web 界面的插件，会将 DeepSeek API 余额显示在侧边栏底部。

![show balance](images/image.png)

> 当前版本为 `0.1.0`，要求 DeepSeek Harness `>=0.1.0-rc.7`。

### 功能

- 在侧边栏设置区域附近显示 CNY 和 USD 余额。
- 通过 DeepSeek 官方余额接口获取数据。
- API Key 只在服务端使用，浏览器只接收规范化后的余额数据。
- 每 60 秒自动刷新一次余额。
- 加载中、没有余额或请求失败时显示 `--`。
- 支持直接从 GitHub 仓库安装。

### 环境要求

- DeepSeek Harness `>=0.1.0-rc.7`
- `web` profile
- 已配置的 `DEEPSEEK_API_KEY`

### 安装

#### 直接从 GitHub 安装

```bash
dsh plugin --profile web add github:eka3os/dsh-balance
```

安装完成后重新启动 Web profile：

```bash
dsh web
```

`dsh plugin` 会将包安装到指定 profile，并根据本包声明的 `dsh.bundle.patch` 自动将其激活为 profile bundle。

### 配置

插件使用 `DEEPSEEK_API_KEY` 作为凭据引用。建议在 DeepSeek Harness 的凭据／设置界面中配置 API Key。也可以在启动时通过环境变量提供，仅对本次运行生效：

```bash
DEEPSEEK_API_KEY=sk-your-key dsh web
```

如果使用 DSH 的本地凭据文件，可以将密钥写入 `$DSH_HOME/.credentials.yaml`：

```yaml
DEEPSEEK_API_KEY: sk-your-key
```

请勿将 API Key 或凭据文件提交到 Git 仓库。

### 工作原理

1. Host 插件注册 `GET /api/dsh-balance` 路由。
2. 路由通过 DSH credentials 服务解析 `DEEPSEEK_API_KEY`。
3. Host 使用服务端 Bearer Token 请求 `https://api.deepseek.com/user/balance`。
4. Client 插件将返回的 CNY/USD 余额渲染到侧边栏底部。
5. 侧边栏处于宽布局时，Client 每 60 秒重复请求一次。

### API 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET`、`HEAD` | `/api/dsh-balance` | 返回当前 DeepSeek API 余额。 |

成功响应示例：

```json
{
  "isAvailable": true,
  "balances": [
    { "currency": "CNY", "totalBalance": "10.00" },
    { "currency": "USD", "totalBalance": "1.00" }
  ]
}
```

凭据缺失时返回 `503`；DeepSeek API 无法访问或返回失败状态时返回 `502`；不支持的方法返回 `405`。

### GitHub 分发

本插件仅通过 GitHub 分发，不发布到 npm。将仓库推送到 GitHub，并确保已提交 `lib/` 构建产物以及 `package.json` 中列出的包文件。

### 许可证

MIT

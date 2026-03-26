# 个人知识库问答助手

[English README](./README.md)

一个面向 Windows 的本地优先桌面知识库问答工具。应用由 Electron 桌面壳、React 前端和 FastAPI 本地服务组成，支持导入本地文档、建立向量索引，并基于检索结果完成问答和引用回溯。

## 技术栈
- 桌面壳：Electron
- 前端：React + TypeScript
- 后端：Python + FastAPI
- 元数据存储：SQLite
- 向量检索：FAISS
- 文档解析：PDF / TXT / Markdown / DOCX
- 模型接入：OpenAI 兼容接口（可接 OpenAI / 豆包 / DeepSeek / Kimi）

## 当前已实现
- Windows 桌面三栏工作区
  - 左侧：聊天记录、新建聊天、文档库入口
  - 中间：问答聊天区
  - 右侧：引用文档与引用片段详情
- 文档导入与索引
  - 通过 Electron 选择本地文件
  - 文档解析、文本切分、向量化、FAISS 建索引
  - SQLite 持久化文档、分片、配置与聊天记录
- 问答链路
  - 检索 `top_k` 片段
  - 拼接上下文
  - 调用聊天模型生成答案
  - 返回答案与引用来源
- 模型配置
  - 服务商选择
  - API Key
  - 模型服务地址
  - 拉取模型列表
  - 测试连接
- 本地状态恢复
  - 恢复上次会话
  - 恢复聊天记录
  - 恢复主题和语言

## 目录结构
```text
desktop/
  electron/                  # Electron 主进程、preload、后端启动器
  renderer/                  # React 前端
backend/
  app/
    api/                     # FastAPI 路由
    services/                # 文档处理、检索、问答、配置
    models/                  # Pydantic 模型与实体定义
    storage/                 # SQLite / FAISS 读写
    utils/                   # 配置与工具
scripts/
  build-windows.ps1          # Windows 打包脚本
  dev.ps1                    # 本地开发辅助脚本
```

## 本地开发（Windows）

### 1. 创建项目虚拟环境
```powershell
cd D:\Person\personal-knowledge-base
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

说明：
- 建议始终使用 `.venv`
- 不要把项目依赖装进 Anaconda `base`

### 2. 准备环境变量
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item desktop\.env.example desktop\.env
```

### 3. 安装桌面端依赖
```powershell
cd D:\Person\personal-knowledge-base\desktop
npm install
```

### 4. 启动后端
```powershell
cd D:\Person\personal-knowledge-base
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. 启动桌面端
```powershell
cd D:\Person\personal-knowledge-base\desktop
npm run dev
```

默认情况下，Electron 可以自动拉起 `.venv` 中的后端。如果你打算手动运行后端，可以先设置：
```powershell
$env:PKB_BACKEND_AUTOSTART="0"
```

## 主要接口
- `GET /api/health`
- `GET /api/documents`
- `POST /api/documents/import`
- `POST /api/documents/reindex`
- `POST /api/retrieval/search`
- `POST /api/chat/ask`
- `GET /api/settings`
- `PUT /api/settings`
- `POST /api/settings/models`
- `POST /api/settings/test-connection`
- `GET /api/conversations`

## Windows 打包

### 已支持的产物
当前项目已经支持三种 Windows 产物：

1. `NSIS 安装包 .exe`
2. `Portable 便携版 .exe`
3. `MSI 安装包 .msi`

### 一键打包脚本
在项目根目录运行：

```powershell
cd D:\Person\personal-knowledge-base
.\scripts\build-windows.ps1
```

默认会生成 `NSIS .exe` 安装包。

如果要指定目标：

```powershell
.\scripts\build-windows.ps1 -Target nsis
.\scripts\build-windows.ps1 -Target portable
.\scripts\build-windows.ps1 -Target msi
```

### 打包流程
脚本会按下面顺序执行：

1. 使用 PyInstaller 打包后端为 `pkb_backend.exe`
2. 将后端可执行文件复制到 `desktop/resources/backend`
3. 构建 Electron 主进程和前端页面
4. 使用 `electron-builder` 产出 Windows 安装包

### 输出目录
打包后的文件默认输出到：

```text
desktop/dist/installer/
```

### 也可以单独执行桌面打包命令
```powershell
cd D:\Person\personal-knowledge-base\desktop
npm run package:win
npm run package:portable
npm run package:msi
```

## 第一版 Release 建议

如果你现在要发布第一版，建议优先发这两个文件：

1. `NSIS 安装包 .exe`
2. `Portable 便携版 .exe`

原因：
- `NSIS .exe` 适合普通用户安装
- `Portable .exe` 适合测试和分发
- `MSI` 更偏企业内网、统一部署场景，首版不是必须

建议首个版本号：

```text
v0.1.0
```

### 建议发布步骤
1. 先确保本地构建通过
2. 运行打包脚本生成安装包
3. 在 GitHub 创建 `v0.1.0` tag
4. 在 GitHub Releases 页面新建 Release
5. 上传以下产物
   - `NSIS 安装包 .exe`
   - `Portable .exe`
   - 可选：`MSI`
6. Release 说明写清楚：
   - 支持的文档格式
   - 模型配置方式
   - 当前 MVP 边界
   - 已知限制

### 建议 Release 说明内容
```text
Personal Knowledge Base Assistant v0.1.0

- 支持 PDF / TXT / Markdown / DOCX 导入
- 支持本地索引与知识库问答
- 支持引用回溯
- 支持 OpenAI 兼容模型接口
- 支持 Windows 桌面安装运行

已知限制：
- 当前登录页为本地 UI 门面，不接真实账号系统
- OCR、云同步、自动更新暂未实现
```

## 常见问题

### 1. 为什么推荐 `.venv`
因为这样不会污染系统 Python 或 Anaconda 环境。

### 2. FAISS 在 Windows 上容易出问题吗
会。主要风险是 NumPy 版本兼容。当前项目建议使用 `numpy==1.26.4`。

### 3. 为什么问答模型和 embedding 没有完全共用
因为多数厂商聊天模型和 embedding 模型不是一个接口。当前项目为了降低配置复杂度，默认将 embedding 保持为本地侧实现，聊天模型使用你配置的厂商接口。

### 4. 首版发 `.exe` 还是 `.msi`
首版建议优先发：
- `NSIS .exe`
- `Portable .exe`

只有在你明确需要企业环境统一安装时，再补 `MSI`。

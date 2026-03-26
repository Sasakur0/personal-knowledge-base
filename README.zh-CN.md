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

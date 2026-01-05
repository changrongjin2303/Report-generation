# 自动化工程造价咨询报告生成系统 - 开发文档

**日期**: 2026-01-04
**状态**: 规划与初期开发中
**作者**: Gemini Agent

---

## 1. 项目概述

*   **项目名称**: 自动化工程造价咨询报告生成系统 (Auto-CostReport System)
*   **目标**: 构建一个云端 SaaS 系统，允许用户上传工程相关资料（合同、结算书、开工报告等），系统自动提取关键数据，并生成标准格式的 Word 咨询报告。
*   **核心痛点解决**: 解决人工从大量分散的工程文档中查找数据、手工录入 Word 报告效率低且易出错的问题。

## 2. 系统架构 (Technical Architecture)

采用 **B/S (Browser/Server)** 架构，前后端分离，容器化部署。

### 2.1 技术栈
*   **前端 (Frontend)**:
    *   **核心**: React 18 + TypeScript + Vite
    *   **UI 库**: Ant Design (B端风格，表单组件丰富)
    *   **状态管理**: Zustand 或 React Context
*   **后端 (Backend)**:
    *   **核心**: Python 3.10+ / FastAPI
    *   **文档处理**: `python-docx` (Word), `docxtpl` (模板渲染), `pdfplumber` (PDF解析), `openpyxl` (Excel)
    *   **OCR**: `EasyOCR` 或 `PaddleOCR` (处理扫描件)
    *   **AI/LLM**: OpenAI SDK / LangChain (调用多模态大模型进行语义提取)
*   **数据存储**:
    *   **临时存储**: 本地文件系统 / Redis (存储会话期间的上传文件和提取结果)
    *   **持久化 (未来)**: PostgreSQL (用户管理、历史报告记录)

### 2.2 数据流向
1.  **Input**: 用户上传多格式文件 (PDF, Doc, Xls, JPG)。
2.  **Processing**: 后端进行 OCR 识别 -> 文本清洗 -> LLM 提取 -> 生成结构化 JSON。
3.  **Verification**: 前端展示 JSON 数据表单 -> 用户人工校对/修改。
4.  **Output**: 后端接收最终 JSON -> 注入 `.docx` 模板 -> 生成最终报告文件。

## 3. 数据结构定义 (Data Schema)

系统内部流转的核心 JSON 数据结构（暂定）：

```json
{
  "project_meta": {
    "report_code": "2026-HZ-001", // 报告编号
    "report_date": "2026年01月04日"
  },
  "project_info": {
    "name": "江南大道及两侧楼宇景观亮化提升工程",
    "location": "杭州市滨江区",
    "description": "本工程建筑面积... (工程概况详细描述)"
  },
  "participants": {
    "client": "杭州市滨江区城市建设投资集团有限公司", // 建设单位
    "designer": "中国联合工程有限公司",
    "contractor": "浙江省一建建设集团有限公司",
    "supervisor": "杭州市建设工程监理有限公司",
    "agent": "杭州市滨江区代建中心" // 代建单位
  },
  "contract_info": {
    "duration_days": 365,
    "start_date": "2024年05月01日",
    "end_date": "2025年05月01日",
    "contract_amount": 1500.00 // 单位：万元
  },
  "audit_result": {
    "submit_amount": 1550.00, // 送审金额
    "audit_amount": 1480.00,  // 核准金额
    "deduct_amount": 70.00,   // 核减金额
    "audit_fee": 0.35,        // 追加审计费
    "net_deduct": 70.00       // 净核减额
  },
  "adjustments": [ // 调整原因列表
    {
      "index": 1,
      "content": "C30混凝土工程量调整",
      "amount": 20.00
    },
    {
      "index": 2,
      "content": "部分苗木未种植扣除",
      "amount": 15.00
    }
  ]
}
```

## 4. 模块开发计划 (Roadmap)

### 阶段一：模板引擎与生成模块 (Report Generation Core)
*   **目标**: 实现“输入 JSON -> 输出完美 Word”的核心功能。
*   **步骤**:
    1.  将现有的 `.doc` 范本标准化为 `.docx` 模板文件 (`template.docx`)。
    2.  在模板中设置 Jinja2 占位符 (如 `{{ project_name }}`)。
    3.  开发 Python 脚本 `generator.py`，测试数据注入功能。
    4.  处理表格动态行（如“调整原因”列表的循环渲染）。

### 阶段二：后端 API 服务 (Backend API)
*   **目标**: 提供 Web 接口，支持文件上传和报告下载。
*   **步骤**:
    1.  初始化 FastAPI 项目。
    2.  实现 `POST /upload` 接口：接收文件并保存到临时目录。
    3.  实现 `POST /generate` 接口：接收 JSON 数据，调用生成模块，返回文件流。

### 阶段三：AI 智能提取模块 (AI Extraction)
*   **目标**: 接入 LLM，实现从文档中自动“抠”数据。
*   **步骤**:
    1.  集成 OCR 工具，将 PDF/图片转为纯文本。
    2.  设计 Prompt (提示词)：让 AI 阅读文本并按上述 JSON 格式输出。
    3.  处理长文档（Split/Chunking）：如果合同太长，需要分段处理或只提取关键页。

### 阶段四：前端交互开发 (Web UI)
*   **目标**: 给用户一个好用的操作界面。
*   **步骤**:
    1.  文件拖拽上传区域。
    2.  “智能提取中...”的进度展示。
    3.  结构化表单：允许用户对 AI 提取的结果进行二次编辑。

---

## 5. 待确认事项
*   [ ] 云服务商选型（阿里云/腾讯云？）
*   [ ] 多模态大模型 API Key 申请（OpenAI/Gemini/通义千问？）

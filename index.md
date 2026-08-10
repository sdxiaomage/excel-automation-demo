---
title: Excel / CSV 批量清洗与对账
description: 固定价 ¥399/¥700 的 Excel 与 CSV 数据清洗、合并去重、异常报告和对账服务；异步文字，验收后付款
lang: zh-CN
---

# Excel / CSV 批量清洗与对账

把固定模板的 Excel/CSV 文件合并、去重、规范化并关联主数据，交付可审计结果、异常明细和闭环对账表。首次查看脱敏结构和判断可行性免费。

[提交固定范围工单](https://github.com/sdxiaomage/excel-automation-demo/issues/new?template=fixed-scope-request.yml)

[English](https://sdxiaomage.github.io/excel-automation-demo/en/)

## 可下载的真实 Demo

[下载示例工作簿](https://github.com/sdxiaomage/excel-automation-demo/releases/download/v1.1.0/consolidated_orders_demo.xlsx) · [下载 CLI 发布包](https://github.com/sdxiaomage/excel-automation-demo/releases/tag/v1.1.0) · [查看验收报告](https://github.com/sdxiaomage/excel-automation-demo/blob/main/deliverables/VALIDATION.md) · [查看脱敏输入](https://github.com/sdxiaomage/excel-automation-demo/tree/main/sample_inputs)

示例将两个订单文件和一份客户主数据闭环处理：

| 指标 | 结果 |
|---|---:|
| 输入记录 | 10 |
| 有效记录 | 4 |
| 异常记录 | 6 |
| 有效订单净额 | ¥1,338.00 |
| 闭环差额 | 0 |

Dashboard 和净额继续保留为 Excel 公式，便于复核输入变化；异常表保留来源文件、原行号、字段、错误类型与原因。

## 可独立复现的公开工具

仓库同时提供 MIT 许可、零第三方依赖的 [`csv-cleanroom` CLI](https://github.com/sdxiaomage/excel-automation-demo#可复现的零依赖-csv-工具)。任何人都可以用 Node.js 20+ 运行：

```bash
npm test
npm run demo:csv
```

测试覆盖带引号/换行的 CSV、10 行 Demo 闭环、公式注入文本中和、输入文件防覆盖，以及 50,000 行套餐边界。CI 会重新生成并比对公开交付物，避免只依赖一份自述验收报告。

## 两个固定套餐

| 套餐 | 固定价格 | 范围 | 交付 |
|---|---:|---|---|
| E1 | ¥399 | 1 个文件、≤10,000 行、≤3 条书面规则 | 1 个 Excel、处理说明、7 天内一次约定规则缺陷修订 |
| E2 | ¥700 | ≤5 个文件、合计≤50,000 行、≤5 条书面规则 | Excel、异常报告、闭环统计、7 天内一次约定规则缺陷修订 |

全程只用异步文字，不拉群、不开会、不语音/视频、不议价。修订只能纠正编码前已经书面约定的规则；新增字段、规则或输出属于另一个固定项目。

## 默认包含

- 固定表头的 `.xlsx` 或 UTF-8 `.csv`；
- 合并、去重、日期/状态规范化；
- 按 ID 关联一份主数据；
- 数量、金额、折扣或必填字段校验；
- `Cleaned`、`Exceptions`、`Dashboard`、`Run Notes` 工作表；
- 输入行数 = 有效行数 + 异常行数的闭环检查；
- 原始文件不覆盖，相同输入重复运行得到一致数据。

## 不包含

OCR、PDF、扫描图片、宏/VBA、数据库/API、网页抓取、实时协作、定时任务、复杂模板重构、超过 50,000 行，或任何需要密码、绕过权限、未经授权个人/商业数据的工作。

## 验收方式

编码前在公开工单只写脱敏字段结构、行数、处理规则和 10–20 条脱敏测试记录。验收时核对：

1. 约定字段和规则是否完整执行；
2. 输入、有效、异常数量是否闭环；
3. 脱敏测试记录是否得到预期结果；
4. 原文件是否未被覆盖，异常原因是否可追溯。

客户真实文件不得上传到公开 Issue。默认做法是：客户只提供 10–20 条脱敏验收记录，我交付可在客户本机运行的脚本/模板，完整业务数据不离开客户环境。若任务确实必须传输真实授权数据，则在书面确认安全传输方式、访问范围和删除期限前不开始。

## 验收后付款

只有在固定范围、价格和验收条件已经书面确认，且交付结果被验收后才付款。大陆客户可使用支付宝；免费可行性判断不需要付款。

<img src="https://sdxiaomage.github.io/ci-rescue/assets/alipay-receive.jpg" alt="支付宝收款码" width="420">

不要仅凭付款截图判断到账，也不要向任何未经核验、声称代表本服务的账号预付。

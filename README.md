# Excel / CSV 批量清洗与对账 Demo

[![CI](https://github.com/sdxiaomage/excel-automation-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/sdxiaomage/excel-automation-demo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

这是一个面向真实外包需求的脱敏作品集：把多个固定模板订单文件合并、去重、规范化、关联客户主数据，并生成一个包含结果、异常和闭环统计的 Excel 工作簿。

## 可验证交付

- [示例输出工作簿](deliverables/consolidated_orders_demo.xlsx)
- [验收报告](deliverables/VALIDATION.md)
- [固定范围规格](SPEC.md)
- [脱敏输入样例](sample_inputs/)

示例中 10 条输入记录被闭环分类为 4 条有效记录和 6 条异常记录；有效订单净额为 ¥1,338.00，闭环差额为 0。所有净额和 Dashboard 汇总均保留为 Excel 公式，便于客户审计和修改输入后复核。

## 可复现的零依赖 CSV 工具

仓库同时提供公开、MIT 许可的 `csv-cleanroom` CLI。它使用 Node.js 20+ 标准库读取配置，将多个同表头 CSV 合并、去重、规范化、校验并关联主数据，输出 `cleaned.csv`、`exceptions.csv` 和 `summary.json`。工具拒绝覆盖输入/配置文件，并在 CSV 输出中中和可能被电子表格软件解释为公式的文本。

```bash
npm test
npm run demo:csv
```

定向测试覆盖带逗号/引号/换行的 CSV、当前 10 行示例闭环，以及套餐上限 50,000 行的无异常闭环。CI 会重建并比较已提交的 [`deliverables/cli`](deliverables/cli) 输出。

配置示例见 [`sample_config.json`](sample_config.json)。该工具是可复现的公开 Demo，不是完整 YAML/Excel 解释器或数据质量保证；真实规则仍需书面验收样本。

无需安装即可在 GitHub 工作流中调用独立的 [`sdxiaomage/csv-cleanroom-action@v1`](https://github.com/sdxiaomage/csv-cleanroom-action)。该 Node.js 24 Action 运行期零依赖、无网络请求，并已通过 Ubuntu、Windows、macOS 与公开 `v1.0.0` 远程引用测试。

## 商业服务边界

- 首次查看脱敏样本并判断可行性免费。
- 只接受字段模板固定、规则书面明确的数据处理。
- 不处理破解密码、绕过权限、未经授权的个人或商业数据。
- 默认采用“脱敏样例 + 客户本机运行”的交付方式：客户只提供 10–20 条脱敏验收记录，我交付可在客户本机处理完整数据的脚本/模板。
- 完整业务数据默认不离开客户环境；公开 Issue 里不得上传真实数据、凭据、个人信息或商业秘密。

## 固定价异步委托

- ¥399：单文件、≤10,000 行、≤3 条规则、输出一个 Excel、7 天内一次约定规则缺陷修订。
- ¥700：≤5 文件、≤50,000 行、≤5 条规则、异常报告、7 天内一次约定规则缺陷修订。
- 全程异步文字；不拉群、不开会、不语音/视频、不议价。
- 提交一次约定修订后等待验收和付款。

[提交固定范围需求](../../issues/new?template=fixed-scope-request.yml)。只提交脱敏结构和规则说明，不要在公开 issue 上传客户数据、个人信息或商业秘密。

服务入口：https://sdxiaomage.github.io/excel-automation-demo/

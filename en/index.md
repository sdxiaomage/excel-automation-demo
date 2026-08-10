---
title: Fixed-scope Excel / CSV cleanup
description: Auditable Excel and CSV cleanup, exception reporting, and reconciliation at fixed CNY 399/700 prices, paid after acceptance
lang: en
---

# Fixed-scope Excel / CSV cleanup

I consolidate, deduplicate, normalize, validate, and reconcile fixed-template Excel/CSV files. Delivery includes auditable cleaned data, exception rows, and a formula-driven control dashboard.

[Open a fixed-scope request](https://github.com/sdxiaomage/excel-automation-demo/issues/new?template=fixed-scope-request.yml)

[中文](https://sdxiaomage.github.io/excel-automation-demo/)

## Verifiable demo

[Download the sample workbook](https://github.com/sdxiaomage/excel-automation-demo/releases/download/v1.1.0/consolidated_orders_demo.xlsx) · [Download the CLI release](https://github.com/sdxiaomage/excel-automation-demo/releases/tag/v1.1.0) · [Read the validation report](https://github.com/sdxiaomage/excel-automation-demo/blob/main/deliverables/VALIDATION.md) · [Inspect sanitized inputs](https://github.com/sdxiaomage/excel-automation-demo/tree/main/sample_inputs)

The demo closes 10 input rows into 4 valid rows and 6 exception rows, with CNY 1,338.00 net valid-order value and a zero reconciliation difference. Dashboard totals and net values remain Excel formulas.

## Reproducible public tool

The repository also includes an MIT-licensed, zero-dependency [`csv-cleanroom` CLI](https://github.com/sdxiaomage/excel-automation-demo#可复现的零依赖-csv-工具). With Node.js 20+:

```bash
npm test
npm run demo:csv
```

Tests cover quoted and multiline CSV records, the 10-row reconciliation demo, spreadsheet-formula text neutralization, input overwrite prevention, and the 50,000-row package boundary. CI rebuilds and compares the committed public outputs.

For repository workflows, use the public [CSV Cleanroom GitHub Action](https://github.com/sdxiaomage/csv-cleanroom-action) without installing a package:

```yaml
- uses: sdxiaomage/csv-cleanroom-action@v1
  with:
    config: rules.json
    output: csv-cleanroom-output
    fail_on_exceptions: "true"
```

The Node.js 24 Action has no runtime dependencies, network requests, or secret requirements. Config, input, and output paths stay inside the GitHub workspace. Its public [`v1.0.0` release](https://github.com/sdxiaomage/csv-cleanroom-action/releases/tag/v1.0.0) passed Ubuntu, Windows, macOS, and remote-version smoke tests. For strongest supply-chain pinning, replace `@v1` with the full commit SHA shown in its README.

## Fixed packages

| Package | Price | Scope | Delivery |
|---|---:|---|---|
| E1 | CNY 399 | 1 file, ≤10,000 rows, ≤3 written rules | 1 Excel workbook, processing notes, one agreed-rule defect revision within 7 days |
| E2 | CNY 700 | ≤5 files, ≤50,000 total rows, ≤5 written rules | workbook, exception report, reconciliation dashboard, one agreed-rule defect revision within 7 days |

Communication is asynchronous text only: no calls, meetings, group chats, live screen sharing, or bargaining. A revision corrects an agreed rule; new fields, rules, or outputs require a separate published package.

## Boundaries and acceptance

Inputs are fixed-header `.xlsx` or UTF-8 `.csv`. Typical work includes merge, deduplication, normalized dates/statuses, ID-based master-data joins, validation, exception tracking, and row-count reconciliation.

OCR, PDF, scanned images, macros/VBA, databases/APIs, scraping, scheduled jobs, complex template redesign, more than 50,000 rows, access bypass, and unauthorized personal or business data are excluded.

Before coding, the request must state sanitized columns, row counts, written rules, and 10–20 sanitized acceptance records. The default delivery is a script or template that processes the complete dataset on the customer's own machine, so full business data stays in the customer's environment. Never upload real customer data, credentials, personal information, or business secrets to a public issue.

Payment is due only after the written scope has been delivered and accepted. The currently verified domestic payment method is Alipay; international payment availability is not promised.

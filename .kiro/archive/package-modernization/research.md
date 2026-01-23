# Research & Design Decisions

## Summary
- **Feature**: package-modernization
- **Discovery Scope**: Simple Addition（パッケージ更新はアプリケーションロジックに変更なし）
- **Key Findings**:
  - 絶対バージョン指定パッケージが dependencies に 9 個、devDependencies に 5 個存在
  - `@chakra-ui/react: "^3"` は不完全な caret 指定（完全なバージョン番号が必要）
  - React 19 へのメジャーアップグレードは破壊的変更を含むため慎重な検討が必要

## Research Log

### パッケージバージョン指定の現状分析
- **Context**: package.json のバージョン指定方法を調査
- **Sources Consulted**: 現在の package.json
- **Findings**:
  - **絶対指定（dependencies）**: `@emotion/react`, `@formkit/tempo`, `jotai`, `ms`, `react`, `react-dom`, `react-icons`, `ts-pattern`
  - **絶対指定（devDependencies）**: `@biomejs/biome`, `@types/ms`, `@types/react`, `@types/react-dom`, `npm-run-all`
  - **不完全な範囲指定**: `@chakra-ui/react: "^3"`（メジャー番号のみ）
- **Implications**: すべてのパッケージを `^x.y.z` 形式に統一する必要あり

### npm バージョン範囲指定のベストプラクティス
- **Context**: caret（^）指定の意味と影響を確認
- **Sources Consulted**: npm semver documentation
- **Findings**:
  - `^1.2.3` は `>=1.2.3 <2.0.0` と同等（マイナー・パッチを自動更新）
  - `^0.x.y` は特殊な動作（0.x 系はマイナーが破壊的変更扱い）
  - `^3` は `^3.0.0` と同等だが、明示的なバージョン指定が推奨される
- **Implications**: 完全なバージョン番号を使用することで意図が明確になる

### React 19 アップグレードの検討
- **Context**: React 18.2.0 から最新版への更新可否を調査
- **Sources Consulted**: React 19 リリースノート、エコシステム互換性
- **Findings**:
  - React 19 は 2024 年 12 月にリリース
  - 主要な破壊的変更: `ref` の扱い、`useContext` → `use`、`forwardRef` の非推奨化
  - Chakra UI v3 は React 19 対応済み
  - Jotai、React Router v7 も対応済み
- **Implications**: React 19 へのアップグレードは可能だが、コード修正が必要になる可能性あり

## Architecture Pattern Evaluation

本タスクはアーキテクチャ変更を伴わないため、該当なし。

## Design Decisions

### Decision: caret（^）形式への統一
- **Context**: バージョン指定方法のばらつきを解消
- **Alternatives Considered**:
  1. caret（^）形式に統一 — マイナー・パッチを自動更新
  2. tilde（~）形式に統一 — パッチのみ自動更新
  3. 絶対指定を維持 — 完全な再現性を優先
- **Selected Approach**: caret（^）形式への統一
- **Rationale**: セキュリティパッチの自動適用とメンテナンスコスト削減のバランスが最適
- **Trade-offs**: 自動更新による予期せぬ破壊の可能性 vs 手動更新の負担軽減
- **Follow-up**: CI でのテスト実行による互換性検証

### Decision: 完全なバージョン番号の使用
- **Context**: `^3` のような省略形式の扱い
- **Alternatives Considered**:
  1. メジャー番号のみ（`^3`）— 簡潔だが意図が不明確
  2. 完全なバージョン番号（`^3.0.0`）— 明示的で意図が明確
- **Selected Approach**: 完全なバージョン番号（`^x.y.z`）を使用
- **Rationale**: インストール時のベースラインバージョンが明確になり、トラブルシューティングが容易
- **Trade-offs**: 記述が長くなるが可読性と保守性が向上

## Risks & Mitigations
- **メジャーバージョン更新による破壊的変更** — CHANGELOG 確認と段階的更新で対応
- **型定義の互換性問題** — `npm run typecheck` での検証を必須化
- **ランタイム互換性問題** — `npm run test` と手動動作確認で検証

## References
- [npm semver](https://docs.npmjs.com/cli/v6/using-npm/semver) — バージョン範囲指定の仕様
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19) — 破壊的変更の一覧

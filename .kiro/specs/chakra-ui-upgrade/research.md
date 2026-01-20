# Research & Design Decisions

## Summary
- **Feature**: `chakra-ui-upgrade`
- **Discovery Scope**: Complex Integration（既存システムの大規模移行）
- **Key Findings**:
  - Chakra UI v3 は破壊的変更が多く、段階的移行は困難
  - @chakra-ui/icons は廃止、react-icons への移行が必要
  - コンポーネントテスト基盤は既に Vitest + happy-dom で構築済み

## Research Log

### Chakra UI v3 移行の破壊的変更
- **Context**: Chakra UI v2.8.2 から v3 への移行パスを調査
- **Sources Consulted**:
  - [Migration to v3 | Chakra UI](https://chakra-ui.com/docs/get-started/migration)
  - [Chakra UI v2 to v3 - The Hard Parts | Codygo](https://codygo.com/blog/chakra-ui-v2-to-v3-easy-migration-guide/)
  - [GitHub Discussion #9853](https://github.com/chakra-ui/chakra-ui/discussions/9853)
- **Findings**:
  - 最小 Node バージョン: Node.20.x
  - 削除パッケージ: `@emotion/styled`, `framer-motion`, `@chakra-ui/icons`
  - テーマシステム: `createSystem` と `defaultConfig` を使用した新スキーマ
  - コンポーネント: 名前空間インポート（例: `Accordion.Root`, `Accordion.Item`）
  - スタイリング: `styleConfig`/`multiStyleConfig` → recipes/slot recipes
  - ColorMode: `ColorModeProvider` 廃止、`next-themes` を使用
  - アニメーション: framer-motion 廃止、CSS アニメーションに移行
- **Implications**:
  - 段階的移行は困難（v2/v3 Provider 共存不可）
  - 全コンポーネントの一括移行が必要
  - 移行前のテスト実装が回帰確認に重要

### @chakra-ui/icons 使用状況
- **Context**: アイコン移行範囲の特定
- **Sources Consulted**: プロジェクト内 grep 調査
- **Findings**:
  - 使用ファイル: 7ファイル
  - 使用アイコン:
    - `ArrowForwardIcon` (InitialSettingPane.tsx)
    - `AddIcon`, `MinusIcon` (InitMemberCountInput.tsx)
    - `QuestionOutlineIcon` (HelpButton.tsx)
    - `ExternalLinkIcon`, `ChevronRightIcon` (UsageAlertDialog.tsx)
    - `CheckIcon`, `RepeatClockIcon` (GenerateButton.tsx)
    - `CopyIcon` (ShareDialog.tsx)
    - `SmallCloseIcon` (ResetButton.tsx)
  - 既存 react-icons 使用: `TbUsers`, `GiTennisCourt`, `ImGithub`
- **Implications**: react-icons への移行は部分的に完了済み、残りを統一

### SegmentedControl 移行対象の分析
- **Context**: useRadio/useRadioGroup で実装された複雑なトグルボタンの簡素化
- **Sources Consulted**: プロジェクト内コード分析
- **Findings**:
  - **CourtCountInput**: 55行、useRadio + useRadioGroup でカスタムボタンスタイルを実装
  - **AlgorithmInput**: 19行、RadioGroup + Radio でシンプルな2択
  - Chakra v3 の SegmentedControl は両方のユースケースに対応
  - 移行後は大幅なコード削減が期待できる（55行 → 15行程度）
- **Implications**: SegmentedControl への移行でコード簡素化と保守性向上

### 既存コンポーネント構造
- **Context**: テスト対象とリファクタリング範囲の特定
- **Sources Consulted**: プロジェクト内ファイル構造分析
- **Findings**:
  - 合計コンポーネント: 33ファイル
  - 機能別分類:
    - `game/`: 17コンポーネント（メイン機能）
    - `setting/`: 4コンポーネント（初期設定）
    - `common/`: 9コンポーネント（共通部品）
    - `shared/`: 1コンポーネント（共有画面）
    - ルート: 2コンポーネント（Main, Share）
  - 主要コンポーネント:
    - `GamePane`: メインゲーム画面、状態管理の中心
    - `InitialSettingPane`: 初期設定画面
    - `AdjustmentPane`: ドラッグ&ドロップ調整（@dnd-kit 使用）
    - `StatisticsPane`: 統計情報表示
- **Implications**: テストは機能別に段階的に実装

### テスト基盤の現状
- **Context**: コンポーネントテスト追加の技術要件確認
- **Sources Consulted**:
  - vite.config.ts
  - src/test-setup.ts
  - 既存テストファイル
  - [Testing | Chakra UI](https://chakra-ui.com/docs/components/concepts/testing)
  - [Vitest React Testing Library](https://www.robinwieruch.de/vitest-react-testing-library/)
- **Findings**:
  - テストフレームワーク: Vitest + happy-dom
  - セットアップ: @testing-library/jest-dom/vitest 統合済み
  - 既存テスト: ロジック層（logic/）と API 層（api/）のみ
  - コンポーネントテスト: 未実装
  - 依存関係: @testing-library/react, @testing-library/dom 既にインストール済み
- **Implications**:
  - カスタム render 関数で ChakraProvider ラップが必要
  - matchMedia, ResizeObserver, IntersectionObserver のモック追加が必要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 一括移行 | v2 から v3 へ全コンポーネントを一度に移行 | 整合性確保、Provider 競合なし | 作業量大、リスク集中 | 公式推奨アプローチ |
| 段階的移行 | v2/v3 共存で段階的に移行 | 段階的リスク軽減 | Provider 共存不可、スタイル崩壊 | 技術的に困難 |
| テスト先行移行 | テスト実装後に一括移行 | 回帰確認可能、品質保証 | 初期投資必要 | 選択アプローチ |

## Design Decisions

### Decision: テスト先行アプローチ
- **Context**: Chakra UI v3 移行で回帰バグのリスクを最小化する必要
- **Alternatives Considered**:
  1. 一括移行（テストなし）— 速いがリスク高
  2. テスト先行移行 — 初期投資必要だが品質保証
- **Selected Approach**: テスト先行移行
- **Rationale**:
  - v3 移行は破壊的変更が多く、手動確認では見落としリスクが高い
  - 既にテスト基盤（Vitest + testing-library）が整備済み
  - コンポーネントテストは今後の保守にも有用
- **Trade-offs**: 初期実装コストが増加するが、長期的な保守性向上
- **Follow-up**: テストカバレッジの優先順位を主要ユーザーフローに絞る

### Decision: アイコンは react-icons に統一
- **Context**: @chakra-ui/icons 廃止への対応
- **Alternatives Considered**:
  1. lucide-react — Chakra 公式推奨
  2. react-icons — 既に部分的に使用中
- **Selected Approach**: react-icons に統一
- **Rationale**:
  - 既存コードで react-icons（TbUsers, GiTennisCourt, ImGithub）を使用中
  - 新規依存追加を避け、既存パターンを踏襲
  - react-icons は多数のアイコンセットを統合
- **Trade-offs**: lucide-react はよりモダンだが、既存パターンとの整合性を優先
- **Follow-up**: アイコンサイズ・色の視覚的一貫性を確認

### Decision: カスタム render 関数による Provider ラップ
- **Context**: Chakra UI コンポーネントのテストには Provider が必要
- **Alternatives Considered**:
  1. 各テストで個別にラップ — 冗長
  2. カスタム render 関数 — DRY原則
- **Selected Approach**: カスタム render 関数を作成
- **Rationale**:
  - Chakra 公式推奨パターン
  - Jotai Provider も統合可能
  - テストコードの簡潔化
- **Trade-offs**: 追加のユーティリティファイルが必要
- **Follow-up**: Jotai のテスト用アトム初期化パターンを検討

## Risks & Mitigations
- **v3 移行の破壊的変更**: テスト先行実装で回帰検出を確保
- **アイコン見た目の変化**: 移行時に視覚的確認を実施
- **テスト工数の増加**: 主要フローに絞り優先順位付け
- **happy-dom の制限**: 必要に応じて jsdom への切り替えを検討

## Future Considerations
- **UI ライブラリ移行検討**: Chakra UI はテスト環境で matchMedia, ResizeObserver, IntersectionObserver などのブラウザ API モックを要求する。将来的にはよりシンプルな UI ライブラリへの移行を検討する価値がある。

## References
- [Migration to v3 | Chakra UI](https://chakra-ui.com/docs/get-started/migration) — 公式移行ガイド
- [Announcing v3 | Chakra UI](https://chakra-ui.com/blog/announcing-v3) — v3 発表ブログ
- [Testing | Chakra UI](https://chakra-ui.com/docs/components/concepts/testing) — テスト設定ガイド
- [Vitest React Testing Library](https://www.robinwieruch.de/vitest-react-testing-library/) — Vitest + RTL 統合
- [GitHub Discussion #9853](https://github.com/chakra-ui/chakra-ui/discussions/9853) — 段階的移行の議論

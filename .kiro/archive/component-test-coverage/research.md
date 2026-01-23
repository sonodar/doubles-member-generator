# Research & Design Decisions

## Summary
- **Feature**: `component-test-coverage`
- **Discovery Scope**: Extension（既存テスト基盤の拡張）
- **Key Findings**:
  - @dnd-kit/coreのテストはjsdom環境では制限があり、キーボードセンサー経由のテストまたはonDragEndハンドラーのモックが現実的
  - 既存のカスタムrender関数（`@testing/utils`）がJotaiアトム初期値設定に対応済み
  - 既存テストパターンに従うことで一貫性を維持可能

## Research Log

### @dnd-kit/core のテスト手法
- **Context**: DnD関連コンポーネントの振る舞いテストを実装するため、@dnd-kit/coreのテスト方法を調査
- **Sources Consulted**:
  - [GitHub Issue #261 - Testing dndkit using React Testing Library](https://github.com/clauderic/dnd-kit/issues/261)
  - [@dnd-kit 公式ドキュメント](https://docs.dndkit.com)
- **Findings**:
  - jsdom環境では`getBoundingClientRect()`がゼロを返すため、PointerSensorやMouseSensorによるドラッグシミュレーションが困難
  - KeyboardSensorを使用したテストは実装可能だが、getBoundingClientRectとoffsetHeight/offsetWidthのモックが必要
  - 公式推奨は「公開インターフェース（onDragStart, onDragOver, onDragEnd）のハンドラーをテスト」
  - 完全なDnDインタラクションテストはE2E（Playwright/Cypress）が適切
- **Implications**:
  - 振る舞いテストではonDragEndハンドラーに渡されるデータを直接テストする戦略を採用
  - ドラッグ状態（isDragging, isOver）のスタイル変更テストはモック活用
  - 複雑なドラッグシナリオはE2Eテストスコープとして記録（今回スコープ外）

### Jotaiアトムの初期値設定パターン
- **Context**: 状態依存の振る舞いテストのため、既存のテストユーティリティを調査
- **Sources Consulted**: `src/testing/utils.tsx`
- **Findings**:
  - `HydrateAtoms`コンポーネントで`useHydrateAtoms`を使用した初期値設定が実装済み
  - `render()`の`initialAtomValues`オプションで`[[atom, value], ...]`形式で指定可能
  - 既存テスト（GamePane.test.tsx等）で使用実績あり
- **Implications**:
  - 新規テストでも同じパターンを使用
  - 事前条件として複数アトムの組み合わせ設定が可能

### 既存テストの構造パターン
- **Context**: テストパターン一貫性のため、既存テストの構造を調査
- **Sources Consulted**:
  - `src/components/game/adjustment/AdjustmentPane.test.tsx`
  - `src/components/game/adjustment/MemberBox.test.tsx`
  - `src/components/common/ConfirmDialog.test.tsx`
- **Findings**:
  - `describe`ネストで「基本表示」「ボタン操作」「条件付き表示」等のグループ化
  - `beforeEach`でモック関数のクリア
  - `screen.getByRole`/`screen.getByText`でアクセシビリティ重視のセレクタ
  - DnDコンポーネントは`<DndContext>`でラップ
- **Implications**:
  - 新規テストは同じ構造に従う
  - describeグループ名は日本語で統一

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| ハンドラーモックパターン | onDragEnd等のコールバックを検証 | 実装が単純、jsdom互換 | 実際のドラッグ動作は未検証 | 振る舞いテストの主要戦略 |
| KeyboardSensorパターン | fireEvent.keyDownでドラッグ | 実際のイベント発火 | getBoundingClientRectモックが複雑 | 一部テストで採用検討 |
| E2Eテスト（Playwright） | 実ブラウザでのテスト | 完全なユーザー体験検証 | セットアップコスト高 | 今回スコープ外 |

## Design Decisions

### Decision: DnDテストはハンドラーモック戦略を主軸とする
- **Context**: @dnd-kit/coreのjsdom制限により、完全なドラッグシミュレーションが困難
- **Alternatives Considered**:
  1. KeyboardSensorによるフルシミュレーション — 複雑なモック設定が必要
  2. ハンドラーモック — シンプルで保守しやすい
  3. E2Eテストのみ — 単体テストのカバレッジ目標を達成できない
- **Selected Approach**: ハンドラーモック戦略を主軸とし、補助的にKeyboardSensorテストを追加
- **Rationale**: 既存テストパターンとの一貫性、実装の単純さ、jsdom環境との互換性
- **Trade-offs**: 実際のドラッグ動作の検証は限定的だが、ビジネスロジック（メンバー入れ替え）の検証は可能
- **Follow-up**: 将来的にPlaywrightによるE2Eテストでドラッグ動作を補完

### Decision: テストファイルはコンポーネント併置パターンを継続
- **Context**: 既存テストは`*.test.tsx`形式でコンポーネントと同一ディレクトリに配置
- **Selected Approach**: 既存パターンを継続
- **Rationale**: プロジェクトのstructure.mdに準拠、既存テストとの一貫性

### Decision: 事前条件はinitialAtomValuesで明示的に設定
- **Context**: 状態依存テストで様々なアトム状態をセットアップする必要がある
- **Selected Approach**: 各テストケースで必要なアトム初期値を明示的に設定
- **Rationale**: テストの独立性確保、テストコードの可読性向上
- **Trade-offs**: 各テストでボイラープレートが増えるが、テストの意図が明確になる

## Risks & Mitigations
- **Risk 1**: DnDテストの信頼性が限定的 — E2Eテスト追加を将来計画として記録
- **Risk 2**: 既存テストとの整合性維持 — 既存パターンを厳守、コードレビューで確認
- **Risk 3**: テスト実行時間の増加 — 並列実行の活用、必要に応じてテストグループ化

## References
- [Testing dndkit using React Testing Library - GitHub Issue #261](https://github.com/clauderic/dnd-kit/issues/261)
- [@dnd-kit 公式ドキュメント](https://docs.dndkit.com)
- [Testing Library 公式ドキュメント](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest 公式ドキュメント](https://vitest.dev/)

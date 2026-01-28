# Research & Design Decisions

## Summary
- **Feature**: `consecutive-decision-warning`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 履歴データ（`History`型）には `time` フィールドが既に存在し、これを連続操作検出に利用可能
  - 既存の `ConfirmDialog` コンポーネントが再利用可能なダイアログパターンを提供
  - 「メンバー決め」ボタンは `GenerateButton.tsx` に実装されており、`handleClick` で処理開始

## Research Log

### 履歴データ構造の確認
- **Context**: 連続操作検出に必要な時刻情報の所在を確認
- **Sources Consulted**: `src/logic/types.ts`
- **Findings**:
  - `History` 型には `time: string` フィールドが存在
  - `histories: History[]` は `CurrentSettings` に格納
  - 最新の履歴は `settings.histories` の末尾要素
- **Implications**: 新たな時刻記録は不要。既存の `time` フィールドを参照して1分以内かを判定

### 既存ダイアログパターンの調査
- **Context**: UI一貫性のため既存ダイアログを参考にする
- **Sources Consulted**: `src/components/common/ConfirmDialog.tsx`
- **Findings**:
  - `ConfirmDialog` は再利用可能な確認ダイアログコンポーネント
  - Props: `open`, `onCancel`, `onOk`, `title`, `children`, `okButtonText`, `cancelButtonText`, `okColorPalette`
  - Chakra UI の `Dialog.Root` を使用
  - `prettyFont` でフォントスタイルを統一
- **Implications**: 警告ダイアログは `ConfirmDialog` を再利用可能

### テーマ構成の確認
- **Context**: アプリケーションテーマとの整合性確認
- **Sources Consulted**: `src/components/theme.ts`
- **Findings**:
  - カラーパレット: `brand`, `primary`, `danger`, `highlight`
  - 警告用途には `danger` パレットが適切
  - フォント: `Zen Maru Gothic` を使用
- **Implications**: 警告ダイアログは `danger` カラーパレットを使用

### GenerateButton の実装確認
- **Context**: 連続操作検出の組み込み箇所を特定
- **Sources Consulted**: `src/components/game/GenerateButton.tsx`
- **Findings**:
  - 「メンバー決め」ボタンの `onClick` で `handleClick` が呼ばれる
  - `handleClick` 内で `generate(settings)` を実行し、確認ダイアログを開く
  - `handleOk` で最終確定、`handleRetry` で「やり直し」を実行
- **Implications**: 連続操作チェックは `handleClick` の先頭で実行すべき

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| GenerateButton 内に警告ロジックを組み込む | 既存コンポーネントを拡張 | 変更範囲が最小限、既存パターンを踏襲 | コンポーネントの責務が増加 | 採用：シンプルな拡張で済む |
| 専用フック（useConsecutiveWarning）を作成 | ロジックを分離 | 再利用性、テスタビリティ向上 | 過度な抽象化の可能性 | 検討：ロジック分離は有効 |

## Design Decisions

### Decision: 連続操作検出ロジックの配置
- **Context**: 連続操作検出をどこに実装するか
- **Alternatives Considered**:
  1. `GenerateButton` コンポーネント内に直接実装
  2. カスタムフック `useConsecutiveWarning` として分離
  3. ロジック層（`src/logic/`）に純粋関数として実装
- **Selected Approach**: ロジック層に純粋関数 `isConsecutiveOperation` を作成し、UIコンポーネントから呼び出す
- **Rationale**: プロジェクトの設計方針（UI/Logic分離）に従い、テスタビリティを確保
- **Trade-offs**: 関数呼び出しが増えるが、単体テストが容易
- **Follow-up**: ロジック関数のユニットテストを作成

### Decision: 警告ダイアログの実装方式
- **Context**: 警告ダイアログをどのように表示するか
- **Alternatives Considered**:
  1. 新規に警告専用ダイアログコンポーネントを作成
  2. 既存の `ConfirmDialog` を再利用
- **Selected Approach**: 既存の `ConfirmDialog` を再利用し、警告メッセージを `children` として渡す
- **Rationale**: UI一貫性の要件を満たし、コード重複を回避
- **Trade-offs**: `ConfirmDialog` の汎用性に依存
- **Follow-up**: 警告メッセージのコピーを確定

### Decision: 1分間隔の判定基準
- **Context**: 「1分以内」の判定方法
- **Selected Approach**: 履歴の最新レコードの `time` フィールドと現在時刻を比較し、差分が60秒未満かを判定
- **Rationale**: 既存の履歴データを活用、追加のデータ保存不要
- **Trade-offs**: `time` フィールドのフォーマットに依存（ISO 8601想定）

## Risks & Mitigations
- **Risk 1**: `time` フィールドのフォーマットが想定と異なる → ISO 8601形式を前提とし、パース失敗時は警告をスキップ
- **Risk 2**: 履歴が空の場合のエッジケース → 履歴がない場合は連続操作判定をスキップ（要件5.1）
- **Risk 3**: ユーザーが意図的に連続操作を行う正当なケース → 「続行」ボタンで警告を無視可能

## References
- `src/logic/types.ts` — History 型定義
- `src/components/common/ConfirmDialog.tsx` — 再利用可能なダイアログ
- `src/components/theme.ts` — テーマ定義
- `src/components/game/GenerateButton.tsx` — メンバー決めボタン実装

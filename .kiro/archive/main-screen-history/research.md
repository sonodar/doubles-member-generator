# Research & Design Decisions

## Summary
- **Feature**: `main-screen-history`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - GamePane は Card.Root/Card.Body/Card.Footer 構造で、履歴表示領域の追加は Card.Body 内で容易に実現可能
  - HistoryPane は既に `histories` prop を受け取る設計のため、`slice(-3)` による件数制限は親コンポーネント側で対応可能
  - theme.ts のカラーパレット定義パターンは `tokens.colors` + `semanticTokens.colors` の二層構造

## Research Log

### GamePane 構造分析
- **Context**: メイン画面への履歴表示統合方法の調査
- **Sources Consulted**: `src/components/game/GamePane.tsx`
- **Findings**:
  - `Card.Root` で `height: 100dvh` を設定（ビューポート全体を占有）
  - `Card.Body` 内に操作コントロール（CurrentMemberCountInput, GenerateButton）と CourtMembersPane を配置
  - `Card.Footer` にボタン群（HistoryButton, MemberButton, ShareButton, ResetButton）
  - 現在は `latestMembers` のみを CourtMembersPane で表示
- **Implications**: CourtMembersPane を HistoryPane に置き換え、スクロール対応を Card.Body 内で実装

### HistoryPane 構造分析
- **Context**: 既存コンポーネントの再利用可能性調査
- **Sources Consulted**: `src/components/common/HistoryPane.tsx`
- **Findings**:
  - `histories` prop で履歴配列を受け取り（未指定時は useSettings() から取得）
  - `rawHistories.reverse()` で新しい順に並べ替え
  - CurrentHistoryPane（今回）、PreviousHistoryPane（前回）、OlderHistoryPane（N回目）で表示分け
  - 現在の強調は `color: "primary.900"` のみ（背景色変更なし）
- **Implications**:
  - 親から `slice(-3)` した履歴を渡せば件数制限は実現可能
  - CurrentHistoryPane のスタイル強化が必要（背景色、ボーダー追加）

### テーマカラー定義パターン分析
- **Context**: highlight カラーパレット追加方法の調査
- **Sources Consulted**: `src/components/theme.ts`
- **Findings**:
  - Chakra UI v3 の `createSystem` API を使用
  - `tokens.colors` で基本カラーパレット（50-900）を定義
  - `semanticTokens.colors` で solid/contrast/fg/muted/subtle/emphasized/focusRing を定義
  - 既存パレット: brand（落ち着いた青）、primary（鮮やかな青）、danger（ピンク/ローズ）
- **Implications**: 同一パターンで highlight カラーを追加可能、既存構造との整合性維持

### MemberCountPane 分析
- **Context**: outlierLevelColors の変更影響調査
- **Sources Consulted**: `src/components/common/MemberCountPane.tsx`
- **Findings**:
  - `outlierLevelColors` オブジェクトで none/low/medium/high を定義
  - 現在は yellow.100, orange.200, red.200 を使用
  - `bg={color}` でセルの背景色として適用
- **Implications**: highlight.100, highlight.300, danger.200 への置き換えで統一感向上

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: HistoryPane 再利用 | 親から slice した履歴を渡す | コード重複なし、保守性維持 | なし | 採用 |
| B: HistoryPane 拡張 | maxItems prop を追加 | 柔軟性向上 | 過度な複雑化 | 不採用（親での slice で十分） |
| C: 新規コンポーネント | MainScreenHistoryPane を新規作成 | 独立性 | コード重複 | 不採用 |

## Design Decisions

### Decision: 履歴表示の統合方法
- **Context**: GamePane にて直近3件の履歴を表示する方法
- **Alternatives Considered**:
  1. HistoryPane を直接使用し、親で slice(-3) した履歴を渡す
  2. HistoryPane に maxItems prop を追加
  3. 新規コンポーネント MainScreenHistoryPane を作成
- **Selected Approach**: Option A - HistoryPane を直接使用
- **Rationale**: HistoryPane は既に `histories` prop を受け取る設計のため、追加の prop は不要。親コンポーネント側での slice が最もシンプル
- **Trade-offs**: HistoryPane 側で件数制限を制御できないが、ユースケースが限定的なため許容
- **Follow-up**: HistoryPane の視覚的強調強化は別途対応

### Decision: スクロール対応方法
- **Context**: 履歴表示によるコンテンツ増加への対応
- **Alternatives Considered**:
  1. 履歴表示領域のみスクロール可能にする
  2. Card.Body 全体をスクロール可能にし、Card.Footer を固定
  3. 画面全体をスクロール可能にする
- **Selected Approach**: Option A - 履歴表示領域のみスクロール
- **Rationale**: 操作コントロールとフッターが常に可視であることが重要。履歴領域に `overflow-y: auto` + `flex: 1` を適用するだけで実現可能
- **Trade-offs**: スクロール領域が限定的になるが、UX 上は問題なし
- **Follow-up**: iOS Safari の `-webkit-overflow-scrolling: touch` 対応を確認

### Decision: 視覚的強調の実装方法
- **Context**: 「今回」の履歴エントリを明確に識別可能にする
- **Alternatives Considered**:
  1. 背景色 + ボーダー + ラベル色変更
  2. 背景色のみ
  3. ボーダーのみ
- **Selected Approach**: Option A - 背景色 + ボーダー + ラベル色変更
- **Rationale**: 複数の視覚的要素を組み合わせることで、色覚特性への配慮と明確な識別を両立
- **Trade-offs**: スタイル定義が増えるが、アクセシビリティ向上に寄与
- **Follow-up**: WCAG AA 準拠のコントラスト比を確認

## Risks & Mitigations
- **既存機能への影響**: HistoryDialog での全履歴表示機能との整合性 → 親から渡す履歴を変えるだけなので影響なし
- **パフォーマンス**: 履歴表示によるレンダリング負荷増加 → 3件制限により影響は最小限
- **スタイル競合**: 新規 highlight カラーと既存スタイルの競合 → semanticTokens で明確に分離

## References
- [Chakra UI v3 Theming](https://chakra-ui.com/docs/theming/customize-theme) - カラートークン定義パターン
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - コントラスト比 4.5:1 要件

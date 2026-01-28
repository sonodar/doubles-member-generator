# Research & Design Decisions

## Summary
- **Feature**: `unfairness-warning`
- **Discovery Scope**: Extension（既存システムへの機能追加）
- **Key Findings**:
  - 既存の `OutlierLevelProvider` や UI は変更しない
  - 警告機能は完全に独立したモジュールとして新規追加
  - 警告表示は既存UIに追加する形で統合

## Research Log

### 既存ロジックの保護
- **Context**: 既存機能への影響を最小化
- **Sources Consulted**: `src/logic/count.ts`, `src/logic/util.ts`
- **Findings**:
  - `OutlierLevelProvider` は「外れ値の程度」を表示する既存機能
  - `getOutlierLevel` は固定閾値で動作中
  - これらは既存機能として維持し、警告は別概念として追加
- **Implications**: 新規モジュール `src/logic/warning.ts` を作成し、既存コードには触れない

### 既存UIの保護
- **Context**: 既存表示機能との共存
- **Sources Consulted**: `src/components/common/MemberCountPane.tsx`, `src/components/game/adjustment/MemberBox.tsx`
- **Findings**:
  - `MemberCountPane` の色分け表示は既存機能
  - `MemberBox` の円形ボックス表示は既存機能
  - 警告表示は既存UIに「追加」する形で実装
- **Implications**: 警告アイコンやインジケーターを既存コンポーネントに追加（既存表示は変更しない）

### 閾値計算アルゴリズム設計（確率論的アプローチ）
- **Context**: 動的閾値の計算式を数学的に導出
- **Findings**:

  #### 問題の定式化
  - $n$ = メンバー数, $c$ = コート数
  - 休憩人数 $r = n - 4c$
  - 特定メンバーが休憩する確率 $p = r/n$

  #### 確率モデル
  - 特定メンバーが $k$ 回連続休憩する確率: $P \approx p^k$
  - 「異常」の定義: 確率が有意水準 $\alpha$ 以下（デフォルト $\alpha = 0.1$）

  #### 閾値の導出
  - $p^k \leq \alpha$ を解くと: $k \geq \ln(\alpha) / \ln(p)$
  - 基本閾値: $k = \lceil \ln(\alpha) / \ln(r/n) \rceil$

  #### 検証結果
  | 構成 | 休憩人数 | 確率 | 閾値 |
  |------|---------|------|------|
  | 2コート・10人 | 2 | 0.20 | 2 |
  | 4コート・24人 | 8 | 0.33 | 3 |
  | 1コート・5人 | 1 | 0.20 | 2 |

  - **2コート・10人で閾値2**: ユーザーの直感「2回連続もおかしい」と完全一致

  #### アルゴリズム補正
  - ばらつき重視: +1（多様性重視なので不公平を許容）
  - 均等性重視: そのまま（公平性重視なので厳格）

  #### 試合回数差への適用
  - 連続休憩が $k$ 回続くと試合回数差も $k$ 程度開く
  - 同じ閾値を適用することで一貫性を確保

- **Implications**: 確率論に基づく閾値計算により、数学的に正当化された警告が可能

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 完全独立モジュール | 既存コードに触れず新規追加 | 既存機能への影響ゼロ | 一部重複コードが発生する可能性 | 採用 |
| 既存OutlierLevelProviderの拡張 | 現在のProviderを修正 | コード再利用 | 既存機能への影響リスク | 不採用 |

## Design Decisions

### Decision: 警告ロジックの完全分離
- **Context**: 既存機能を保護しつつ警告機能を追加
- **Selected Approach**: `src/logic/warning.ts` を新設し、既存ファイルは一切変更しない
- **Rationale**: 既存機能の安定性を維持。警告は独立した概念として実装。
- **Trade-offs**: 一部の計算（連続休憩回数など）は既存関数を再利用

### Decision: 警告UIの追加方式
- **Context**: 既存UIを変更せずに警告を表示
- **Selected Approach**: 既存コンポーネントに警告インジケーター（アイコン等）を追加する形で統合
- **Rationale**: 既存の色分け表示はそのまま維持し、警告は別要素として追加表示
- **Trade-offs**: UI要素が増えるが、既存機能は完全に保護

## Risks & Mitigations
- **閾値計算式の妥当性** — 実際の使用感でチューニングが必要になる可能性
- **既存テストへの影響** — 既存コードを変更しないため影響なし

### 確定時の警告ダイアログパターン
- **Context**: 警告がある状態で確定する際のUXを検討
- **Sources Consulted**: `src/components/game/GenerateButton.tsx`, `src/components/common/ConfirmDialog.tsx`
- **Findings**:
  - `GenerateButton` で連続操作時に「ちょっと待ってください」ダイアログを表示するパターンが存在
  - `ConfirmDialog` コンポーネントが汎用的に使用可能
  - タイトル、本文、ボタンテキスト、色をカスタマイズ可能
- **Implications**: 同じパターンを警告確認ダイアログに適用し、UI一貫性を確保

## References
- `src/logic/count.ts` — 既存の統計計算ロジック（変更しない）
- `src/logic/util.ts` — `getContinuousRestCount` 関数（再利用のみ）
- `src/components/common/MemberCountPane.tsx` — 統計表示UI（変更しない）
- `src/components/common/ConfirmDialog.tsx` — 確認ダイアログ（再利用）
- `src/components/game/GenerateButton.tsx` — 「ちょっと待ってください」パターンの参照元

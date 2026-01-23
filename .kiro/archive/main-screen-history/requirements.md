# Requirements Document

## Introduction

GitHub Issue #55「メイン画面も履歴にする」に基づく機能拡張。現在のメイン画面（GamePane）は最新のコート割り当てのみを表示しているが、これを直近3件の履歴表示に変更し、既存の HistoryPane コンポーネントを活用する。併せて、現在のコートメンバーの視覚的強調を強化し、小画面でのスクロール対応を行う。

## Requirements

### Requirement 1: メイン画面の履歴表示化

**Objective:** ユーザーとして、メイン画面で直近の履歴を確認したい。これにより、現在のコート割り当てと直前の状況を一目で把握でき、公平性の確認やメンバー調整の判断がしやすくなる。

#### Acceptance Criteria

1. When ユーザーがメイン画面（GamePane）を表示する, the アプリケーション shall 直近3件の履歴を表示する（履歴が3件未満の場合は存在する履歴のみを表示する）
2. When 履歴が存在しない状態でメイン画面を表示する, the アプリケーション shall 履歴領域を非表示とし、生成ボタンのみを表示する（既存と同じ）
3. When 新しいコート割り当てが生成される, the アプリケーション shall 履歴表示を即座に更新し、最新の履歴を「今回」として表示する
4. The アプリケーション shall 各履歴エントリに生成日時を表示する

### Requirement 2: 既存 HistoryPane コンポーネントの再利用

**Objective:** 開発者として、既存の HistoryPane コンポーネントを活用したい。これにより、コードの重複を避け、保守性を維持できる。

#### Acceptance Criteria

1. The アプリケーション shall メイン画面の履歴表示に既存の HistoryPane コンポーネントを活用する
2. When メイン画面で HistoryPane を使用する, the 親コンポーネント shall 履歴配列を slice(-3) して直近3件のみを渡す
3. The アプリケーション shall HistoryPane の現在の機能（履歴順序、日時表示、コート別メンバー表示）を維持する

### Requirement 3: 強調用テーマカラーの追加

**Objective:** デザイナーとして、「現在」を示す新しい強調色をテーマに追加したい。既存の青系（primary）や赤系（danger）とは異なる意味を持つ暖色系カラーが必要。

#### Acceptance Criteria

1. The テーマ設定 shall 新しいカラーパレット `highlight` を定義する（アンバー/ゴールド系）
2. The `highlight` カラーパレット shall 以下のカラーコードで定義する:
   - 50: #FEF9E7（背景用）
   - 100: #FCF3CF
   - 200: #F9E79F
   - 300: #F7DC6F
   - 400: #F4D03F
   - 500: #F1C40F（基準色）
   - 600: #D4AC0D
   - 700: #B7950B
   - 800: #9A7D0A
   - 900: #7D6608
3. The テーマ設定 shall `highlight` の semanticTokens（solid, contrast, fg, muted, subtle, emphasized, focusRing）を定義する
4. The `highlight` カラー shall 既存の primary（青）および danger（赤）と明確に区別できる
5. The MemberCountPane コンポーネント shall outlierLevelColors を以下のように変更する:
   - none: ""（変更なし）
   - low: highlight.100
   - medium: highlight.300
   - high: danger.200

### Requirement 4: 現在のコートメンバーの視覚的強調強化

**Objective:** ユーザーとして、履歴表示内で現在のコートメンバーを明確に識別したい。現状の強調が弱いため、より目立つ視覚的表現が必要。

#### Acceptance Criteria

1. The アプリケーション shall 「今回」の履歴エントリを、highlight カラー（背景: highlight.50、ボーダー: highlight.300）で強調表示する
2. The アプリケーション shall 「今回」のラベルを highlight.700 カラーで表示する
3. While 過去の履歴エントリを表示している間, the アプリケーション shall グレーアウト（gray.500）を適用して現在との差を明確にする
4. The アプリケーション shall 強調表示がアクセシビリティ要件（WCAG AA 準拠のコントラスト比 4.5:1 以上）を満たす

### Requirement 5: スクロール対応

**Objective:** ユーザーとして、小さな画面でもすべての履歴にアクセスしたい。

#### Acceptance Criteria

1. When 履歴表示領域のコンテンツが利用可能な高さを超える, the アプリケーション shall 履歴表示領域のみを縦方向スクロール可能にする
2. The アプリケーション shall 操作コントロール（ヘッダー）およびボタン群（フッター）をスクロール対象外とする（履歴ペインのみスクロール）

### Requirement 6: レイアウト整合性

**Objective:** ユーザーとして、メイン画面のレイアウトが一貫性を持ち、操作しやすい状態を維持したい。

#### Acceptance Criteria

1. The アプリケーション shall メイン画面上部に操作コントロール（メンバー数入力、生成ボタン）を配置する
2. The アプリケーション shall 操作コントロールの下に履歴表示領域を配置する
3. The アプリケーション shall フッター領域のボタン配置（履歴、メンバー、共有、リセット）を維持する
4. When 履歴表示が追加される, the アプリケーション shall 既存の履歴ダイアログ機能との整合性を維持する（ダイアログでは全履歴表示、メイン画面では直近3件）

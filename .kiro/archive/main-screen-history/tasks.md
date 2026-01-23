# Implementation Plan

## Tasks

- [x] 1. highlight カラーパレットをテーマに追加する
  - テーマ設定に新しいカラーパレット `highlight` を定義する（アンバー/ゴールド系、50-900）
  - semanticTokens（solid, contrast, fg, muted, subtle, emphasized, focusRing）を定義する
  - 既存の brand/primary/danger と同一構造で定義し、整合性を維持する
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. highlight カラーを使用するコンポーネントを更新する
- [x] 2.1 (P) MemberCountPane の異常値レベルカラーを統一する
  - outlierLevelColors の low を highlight.100 に変更する
  - outlierLevelColors の medium を highlight.300 に変更する
  - outlierLevelColors の high を danger.200 に変更する
  - 既存の表示ロジックは維持する
  - _Requirements: 3.5_

- [x] 2.2 (P) HistoryPane の「今回」エントリを視覚的に強調する
  - CurrentHistoryPane に背景色（highlight.50）を適用する
  - CurrentHistoryPane にボーダー（highlight.300）を適用する
  - 「今回」ラベルの色を highlight.700 に変更する
  - 過去の履歴エントリはグレーアウト（gray.500）を維持する
  - WCAG AA 準拠のコントラスト比（4.5:1 以上）を確保する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 2.1, 2.3_

- [x] 3. GamePane に履歴表示を統合する
- [x] 3.1 CourtMembersPane を HistoryPane に置き換える
  - 現在の CourtMembersPane 表示を削除する
  - HistoryPane をインポートして使用する
  - 履歴配列を slice(-3) して直近3件のみを渡す
  - 履歴が存在しない場合は履歴領域を非表示にする
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2_

- [x] 3.2 履歴表示領域のスクロール対応を実装する
  - Card.Body のレイアウトを flex column に変更する
  - 履歴表示領域に flex={1} と overflowY="auto" を適用する
  - 操作コントロールとフッターはスクロール対象外とする
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

- [x] 3.3 履歴ダイアログとの整合性を確認する
  - 既存の履歴ダイアログ（全履歴表示）が正常に動作することを確認する
  - メイン画面（直近3件）と履歴ダイアログ（全件）の表示が整合することを確認する
  - _Requirements: 6.4_

- [x] 4. 統合テストと動作確認を行う
- [x] 4.1 履歴表示の基本動作を検証する
  - 履歴0件、1件、3件、5件での表示を確認する
  - 生成ボタン押下後の履歴更新を確認する
  - 「今回」エントリの視覚的強調を確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4.2 スクロールとレイアウトを検証する
  - 小画面での履歴領域スクロールを確認する
  - 操作コントロールとフッターの固定を確認する
  - モバイルデバイスでのスクロール体験を確認する
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

- [x]* 4.3 MemberCountPane のカラー変更を検証する
  - 各異常値レベル（none, low, medium, high）の表示色を確認する
  - highlight/danger カラーが正しく適用されていることを確認する
  - _Requirements: 3.5_

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1, 1.2, 1.3, 1.4 | 3.1, 4.1 |
| 2.1, 2.2, 2.3 | 2.2, 3.1 |
| 3.1, 3.2, 3.3, 3.4 | 1 |
| 3.5 | 2.1, 4.3 |
| 4.1, 4.2, 4.3, 4.4 | 2.2 |
| 5.1, 5.2 | 3.2, 4.2 |
| 6.1, 6.2, 6.3, 6.4 | 3.2, 3.3, 4.2 |

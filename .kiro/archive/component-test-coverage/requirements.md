# Requirements Document

## Project Description (Input)
コンポーネントのテストカバレッジを上げる。特に振る舞いに関するテストを重点的に実装する。

## Introduction

本仕様書は、バドミントンダブルスのコート割り当てアプリケーションにおけるReactコンポーネントのテストカバレッジ向上を目的とする。現在、33コンポーネント中16コンポーネント（48%）のみにテストが存在し、ブランチカバレッジは特にgame/adjustment領域で35%と低い状態である。

振る舞いに関するテストを重点的に追加することで、UIコンポーネントの品質と信頼性を確保する。特に以下の3領域を重視する：

1. **ドラッグ&ドロップ（DnD）機能**: @dnd-kit/coreを使用したメンバー調整機能のテスト
2. **状態依存の振る舞い**: Jotaiアトムの値に応じた条件付きレンダリングと振る舞い変化
3. **設定値による振る舞い変化**: アルゴリズム選択、コート数、メンバー数、履歴の有無による動的な振る舞い

対象はボタンコンポーネント、ダイアログコンポーネント、DnDコンポーネント、複合状態管理コンポーネントであり、既存のテスト基盤（Vitest + Testing Library + カスタムrender関数）を活用して一貫したテストパターンで実装する。

## Requirements

### Requirement 1: ドラッグ&ドロップ機能の振る舞いテスト

**Objective:** As a 開発者, I want DnD関連コンポーネント（MemberBox, MemberDroppable, AdjustmentPane）にドラッグ&ドロップ操作の振る舞いテストを追加したい, so that メンバー調整機能が正しく動作することを保証できる

#### Acceptance Criteria

1. When MemberBoxがドラッグされた場合, the MemberBox shall isDragging状態に応じたスタイル変更を適用する
2. When MemberBoxのドラッグが終了した場合, the MemberBox shall 元のスタイルに戻る
3. When MemberDroppableにドラッグ中のアイテムがホバーした場合, the MemberDroppable shall isOver状態に応じた背景色変更を適用する
4. When MemberDroppableからホバーが外れた場合, the MemberDroppable shall 元の背景色に戻る
5. When AdjustmentPane内でメンバーが別の位置にドロップされた場合, the AdjustmentPane shall onDragEndハンドラーでメンバー位置を交換する
6. When コートメンバーと休憩メンバー間でドラッグ&ドロップが行われた場合, the AdjustmentPane shall 正しくメンバーを入れ替えonChangeコールバックを呼び出す
7. When 同一コート内でメンバーがドラッグ&ドロップされた場合, the AdjustmentPane shall コート内でメンバー位置を交換する
8. If ドロップ先が無効な場合（同一メンバー上など）, then the AdjustmentPane shall 位置変更を行わない

### Requirement 2: 状態依存の振る舞いテスト（事前条件パターン）

**Objective:** As a 開発者, I want Jotaiアトムの状態に応じた振る舞いの変化をテストしたい, so that 様々な状態での正しい動作を保証できる

#### Acceptance Criteria

1. When settingsAtom.courtCountが0の場合, the Main shall InitialSettingPaneを表示する
2. When settingsAtom.courtCountが1以上の場合, the Main shall GamePaneを表示する
3. When settingsAtom.historiesが空の場合, the AdjustmentPane shall 何も表示しない（早期リターン）
4. When settingsAtom.historiesに履歴がある場合, the AdjustmentPane shall 最新の履歴に基づくメンバー配置を表示する
5. When settingsAtom.membersの数がcourtCount×4より多い場合, the StatisticsPane shall プレイ回数確認ボタンを表示する
6. When settingsAtom.membersの数がcourtCount×4以下の場合, the StatisticsPane shall プレイ回数確認ボタンを非表示にする
7. When previousSettingsAtomに値がある場合, the InitialSettingPane shall 前回の設定を復元するオプションを提供する
8. When previousSettingsAtomがnullの場合, the InitialSettingPane shall 復元オプションを非表示にする

### Requirement 3: アルゴリズム設定による振る舞いテスト

**Objective:** As a 開発者, I want アルゴリズム選択（離散性重視/均等性重視）に応じた振る舞いの変化をテストしたい, so that アルゴリズム切り替えが正しく反映されることを保証できる

#### Acceptance Criteria

1. When アルゴリズムがDISCRETENESS（離散性重視）の場合, the AlgorithmBadge shall 「ばらつき」バッジを表示する
2. When アルゴリズムがEVENNESS（均等性重視）の場合, the AlgorithmBadge shall 「均等」バッジを表示する
3. When AlgorithmInputでアルゴリズムが変更された場合, the AlgorithmInput shall onChangeコールバックに新しいアルゴリズム値を渡す
4. When ゲーム生成時にDISCRETENESSが選択されている場合, the GenerateButton shall 離散性ベースの生成ロジックを使用する
5. When ゲーム生成時にEVENNESSが選択されている場合, the GenerateButton shall 均等性ベースの生成ロジックを使用する

### Requirement 4: コート数・メンバー数設定による振る舞いテスト

**Objective:** As a 開発者, I want コート数とメンバー数の設定変更に応じた振る舞いをテストしたい, so that 設定変更時の連動処理が正しく動作することを保証できる

#### Acceptance Criteria

1. When CourtCountInputでコート数が変更された場合, the CourtCountInput shall onChangeコールバックに新しいコート数を渡す
2. When コート数が増加した場合, the InitialSettingPane shall メンバー数の最小値を自動調整する（コート数×4）
3. When コート数が減少した場合, the InitialSettingPane shall 現在のメンバー数が最小値を下回らないよう調整する
4. When InitMemberCountInputでメンバー数が変更された場合, the InitMemberCountInput shall onChangeコールバックに新しいメンバー数を渡す
5. If メンバー数がコート数×4未満に設定された場合, then the InitMemberCountInput shall エラー状態を表示する
6. When CourtMembersPaneにコート数が渡された場合, the CourtMembersPane shall コート数に応じた行数でグリッドを表示する

### Requirement 5: 履歴操作による振る舞いテスト

**Objective:** As a 開発者, I want 履歴の有無と操作に応じた振る舞いをテストしたい, so that 履歴機能が正しく動作することを保証できる

#### Acceptance Criteria

1. When 履歴がない場合, the HistoryPane shall 空状態メッセージを表示する
2. When 履歴が1件以上ある場合, the HistoryPane shall 現在のゲーム（最新履歴）を表示する
3. When 履歴が2件以上ある場合, the HistoryPane shall 過去の履歴一覧を表示する
4. When HistoryDialogで履歴項目が選択された場合, the HistoryDialog shall 選択された履歴のメンバー構成をonSelectコールバックに渡す
5. When 履歴項目の削除ボタンがクリックされた場合, the HistoryPane shall 該当履歴をdeletedフラグでマークする
6. When ゲームが生成された場合, the GamePane shall 新しい履歴エントリを追加する

### Requirement 6: ボタンコンポーネントの振る舞いテスト

**Objective:** As a 開発者, I want 未テストのボタンコンポーネント（ResetButton, ShareButton, HelpButton, HistoryButton, MemberButton, LineShareButton）に振る舞いテストを追加したい, so that ユーザー操作に対する応答が正しく動作することを保証できる

#### Acceptance Criteria

1. When ユーザーがResetButtonをクリックした場合, the ResetButton shall 確認ダイアログを表示する
2. When 確認ダイアログで「OK」が選択された場合, the ResetButton shall onResetコールバックを呼び出す
3. When 確認ダイアログで「キャンセル」が選択された場合, the ResetButton shall ダイアログを閉じ、onResetコールバックを呼び出さない
4. When ユーザーがShareButtonをクリックした場合, the ShareButton shall 共有ダイアログを表示する
5. When 共有処理が正常に完了した場合, the ShareButton shall 成功通知を表示する
6. If 共有処理が失敗した場合, then the ShareButton shall エラー通知を表示する
7. When ユーザーがHelpButtonをクリックした場合, the HelpButton shall ヘルプモーダルを表示する
8. When ユーザーがHistoryButtonをクリックした場合, the HistoryButton shall 履歴ダイアログを表示する
9. When ユーザーがMemberButtonをクリックした場合, the MemberButton shall メンバーダイアログを表示する
10. When ユーザーがLineShareButtonをクリックした場合, the LineShareButton shall LINE共有URLを新しいウィンドウで開く

### Requirement 7: ダイアログコンポーネントの状態遷移テスト

**Objective:** As a 開発者, I want 未テストのダイアログコンポーネント（UsageAlertDialog, AdjustmentDialog, HistoryDialog, MemberDialog）に状態遷移テストを追加したい, so that ダイアログの開閉・データ表示が正しく動作することを保証できる

#### Acceptance Criteria

1. When isOpen=trueの場合, the UsageAlertDialog shall アラート内容を表示する
2. When ユーザーがUsageAlertDialogを閉じた場合, the UsageAlertDialog shall onCloseコールバックを呼び出す
3. When isOpen=trueの場合, the AdjustmentDialog shall 調整パネルを表示する
4. When ユーザーがAdjustmentDialogでメンバーを調整した場合, the AdjustmentDialog shall 調整結果をonConfirmコールバックに渡す
5. When ユーザーがAdjustmentDialogをキャンセルした場合, the AdjustmentDialog shall 調整前の状態を維持しダイアログを閉じる
6. When isOpen=trueの場合, the HistoryDialog shall 履歴一覧を表示する
7. When ユーザーがHistoryDialogで履歴項目を選択した場合, the HistoryDialog shall 選択された履歴をonSelectコールバックに渡す
8. When isOpen=trueの場合, the MemberDialog shall メンバー一覧を表示する
9. When ユーザーがMemberDialogでメンバーを選択した場合, the MemberDialog shall 選択されたメンバーをonSelectコールバックに渡す

### Requirement 8: 表示コンポーネントの条件付きレンダリングテスト

**Objective:** As a 開発者, I want 未テストの表示コンポーネント（MemberCountPane, CurrentMemberCountInput, RestMembersPane, CourtMembersBox）に条件付きレンダリングテストを追加したい, so that propsと状態に応じた正しい表示を保証できる

#### Acceptance Criteria

1. When メンバー数が渡された場合, the MemberCountPane shall 正しいメンバー数を表示する
2. When ユーザーがCurrentMemberCountInputの値を変更した場合, the CurrentMemberCountInput shall onChangeコールバックに新しい値を渡す
3. If 入力値が無効な場合（範囲外、非数値）, then the CurrentMemberCountInput shall エラー状態を表示する
4. When 休憩メンバーが存在する場合, the RestMembersPane shall 休憩メンバー一覧を表示する
5. When 休憩メンバーが0人の場合, the RestMembersPane shall 空状態または非表示となる
6. When コートメンバーが渡された場合, the CourtMembersBox shall 4人のメンバーを正しい配置で表示する
7. While ドラッグ操作中, the CourtMembersBox shall ドラッグ対象メンバーを視覚的に区別する

### Requirement 9: 共有画面コンポーネントのテスト

**Objective:** As a 開発者, I want 未テストの共有画面コンポーネント（Share, SharedPane）にテストを追加したい, so that 共有リンク経由でアクセスした際の表示が正しく動作することを保証できる

#### Acceptance Criteria

1. When 有効な共有URLでアクセスした場合, the Share shall 共有データを読み込み表示する
2. If 共有URLが無効または期限切れの場合, then the Share shall エラーメッセージを表示する
3. While データ読み込み中, the Share shall ローディング状態を表示する
4. When 共有データが読み込まれた場合, the SharedPane shall コートメンバー情報を表示する
5. When 共有データが読み込まれた場合, the SharedPane shall 統計情報を表示する
6. When 共有データが読み込まれた場合, the SharedPane shall アルゴリズム情報を表示する

### Requirement 10: テストパターンの一貫性

**Objective:** As a 開発者, I want 新規テストが既存のテストパターンに従うことを確認したい, so that テストコードの保守性と可読性を確保できる

#### Acceptance Criteria

1. The テストファイル shall カスタムrender関数（`@testing/utils`）を使用する
2. The テストファイル shall describeブロックで機能グループを構造化する
3. The テストファイル shall roleベースのセレクタ（`getByRole`）を優先使用する
4. The テストファイル shall 各テスト前にモック関数をクリアする（`beforeEach`）
5. When Jotaiアトムの初期値が必要な場合, the テストファイル shall initialAtomValuesオプションを使用する
6. When Chakra UIのモーダルをテストする場合, the テストファイル shall isOpen propsで開閉状態を制御する
7. When DnDコンポーネントをテストする場合, the テストファイル shall DndContextでラップする
8. The テストファイル shall 事前条件（状態、設定値）を明示的にセットアップする

### Requirement 11: ブランチカバレッジの向上

**Objective:** As a 開発者, I want 条件分岐を網羅するテストケースを追加したい, so that ブランチカバレッジを向上させられる

#### Acceptance Criteria

1. The テストスイート shall disabled状態のボタンに対するテストケースを含む
2. The テストスイート shall 空データ状態に対するテストケースを含む
3. The テストスイート shall エラー状態に対するテストケースを含む
4. The テストスイート shall ローディング状態に対するテストケースを含む
5. When 条件付きレンダリングが存在する場合, the テストスイート shall 全分岐をカバーするテストケースを含む
6. The game/adjustmentフォルダのテスト shall ブランチカバレッジ50%以上を達成する
7. The commonフォルダのテスト shall ブランチカバレッジ70%以上を達成する
8. The テストスイート shall 各アトム状態パターン（空/1件/複数件）に対するテストケースを含む


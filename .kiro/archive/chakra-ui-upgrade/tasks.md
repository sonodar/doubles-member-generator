# Implementation Plan

## Task 0: 既存のビルドエラー修正
- [x] 0.1 TypeScript コンパイルエラーの修正
  - tsconfig.json の未知オプション `noUncheckedSideEffectImports` を削除
  - amplify ディレクトリを tsconfig の include から除外（amplify は独自の tsconfig を持つ）
  - npm run typecheck が通ることを確認する
  - _Requirements: 7.3_

- [x] 0.2 Biome lint エラーの修正
  - src/api/event.test.ts の `as any` を適切な型に修正（3箇所）
  - npm run lint が通ることを確認する
  - _Requirements: 7.2_

## Task 1: テスト環境の整備
- [x] 1.1 vitest 設定ファイルの分離
  - vite.config.ts から vitest 設定を分離し、vitest.config.ts を作成する
  - vitest/config から defineConfig をインポートする
  - 既存のテスト設定（environment, setupFiles）を移行する
  - globals: true を追加してグローバル API を有効化する
  - _Requirements: 1.6_

- [x] 1.2 テスト関連パッケージの更新
  - vitest を 1.2.2 から 4.x（React 18 対応最新版）にアップグレードする
  - @vitest/ui を vitest と同じバージョンに更新する
  - @testing-library/react, @testing-library/dom, @testing-library/jest-dom を最新版に更新する
  - happy-dom を最新版に更新する
  - 更新後に既存テストが正常に動作することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.4, 1.6_

## Task 2: テスト基盤の構築
- [x] 2.1 ブラウザ API モックの追加
  - test-setup.ts に matchMedia, ResizeObserver, IntersectionObserver のモックを追加する
  - Chakra UI コンポーネントがテスト環境で正常に動作するために必要なモック
  - 既存の @testing-library/jest-dom/vitest インポートを維持しつつ拡張する
  - _Requirements: 1.4, 1.6_

- [x] 2.2 カスタム render 関数の作成
  - ChakraProvider をラップしたカスタム render 関数を作成する
  - Jotai Provider も統合し、テスト用の初期状態を設定可能にする
  - @testing-library/react の API を再エクスポートする
  - テストファイルから一貫した方法でコンポーネントをレンダリングできるようにする
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

## Task 3: コア機能コンポーネントのテスト実装
- [x] 3.1 (P) Main コンポーネントのテスト
  - 初期設定画面とゲーム画面の条件分岐を検証する
  - 設定が未完了の場合は InitialSettingPane が表示されることを確認する
  - 設定完了後は GamePane が表示されることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 3.2 (P) InitialSettingPane コンポーネントのテスト
  - コート数選択の動作を検証する
  - メンバー数入力の動作を検証する
  - アルゴリズム選択の動作を検証する
  - 開始ボタンのクリックで適切なコールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 3.3 (P) GamePane コンポーネントのテスト
  - メンバー数増減ボタンの動作を検証する
  - 生成ボタンのクリックでメンバー生成が行われることを確認する
  - 各操作ボタン（履歴、共有、リセット）が正常に動作することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 3.4 (P) GenerateButton コンポーネントのテスト
  - ボタンクリックで生成ロジックが呼び出されることを検証する
  - ローディング状態の表示を確認する
  - 生成済みの場合のリトライ表示を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 4: 入力コンポーネントのテスト実装
- [x] 4.1 (P) CourtCountInput コンポーネントのテスト
  - コート数の選択が正常に動作することを検証する
  - 選択状態の視覚的フィードバックを確認する
  - onChange コールバックが適切に呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 4.2 (P) AlgorithmInput コンポーネントのテスト
  - アルゴリズムの切り替えが正常に動作することを検証する
  - 選択状態の視覚的フィードバックを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 4.3 (P) InitMemberCountInput コンポーネントのテスト
  - 増減ボタンの動作を検証する
  - 最小値の境界条件を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 5: ダイアログコンポーネントのテスト実装
- [x] 5.1 (P) ConfirmDialog コンポーネントのテスト
  - ダイアログの開閉動作を検証する
  - 確認・キャンセルボタンのクリックで適切なコールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [x] 5.2 (P) ShareDialog コンポーネントのテスト
  - URL 表示を検証する
  - コピーボタンの動作を検証する（クリップボード API のモック）
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.5_

- [x] 5.3 (P) LeaveDialog コンポーネントのテスト
  - メンバー選択の動作を検証する
  - 離脱確定時のコールバックを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 6: ドラッグ&ドロップ機能のテスト実装
- [x] 6.1 AdjustmentPane コンポーネントのテスト
  - DnD コンテキストの初期化を検証する
  - メンバーボックスの表示を確認する
  - ドラッグ&ドロップによるメンバー入れ替えの結果を検証する
  - 入れ替え後に onChange コールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5, 6.2_

- [x] 6.2 (P) MemberBox コンポーネントのテスト
  - ドラッグ可能状態の検証（useDraggable フックの動作確認）
  - メンバー ID の表示を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5_

- [x] 6.3 (P) MemberDroppable コンポーネントのテスト
  - ドロップターゲットとしての動作を検証する（useDroppable フックの動作確認）
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5_

## Task 7: 統計・表示コンポーネントのテスト実装
- [x] 7.1 (P) StatisticsPane コンポーネントのテスト
  - 統計情報の表示を検証する
  - 調整ダイアログの開閉動作を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3, 6.4_

- [x] 7.2 (P) HistoryPane コンポーネントのテスト
  - 履歴一覧の表示を検証する
  - 各履歴エントリのフォーマットを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3_

- [x] 7.3 (P) CourtMembersPane コンポーネントのテスト
  - コート別メンバー表示を検証する
  - メンバー ID の表示フォーマットを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3_

## Task 8: Chakra UI v3 依存関係の更新
- [x] 8.1 Chakra UI v3 パッケージのインストールと不要パッケージの削除
  - @chakra-ui/react を v3 にアップグレードする
  - @emotion/styled を削除する（@emotion/react は維持）
  - framer-motion を削除する
  - @chakra-ui/icons を削除する
  - @chakra-ui/radio の型インポートを削除する
  - package.json を更新し、npm install を実行する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 2.1, 2.3, 2.4_

## Task 9: Provider 設定の移行
- [x] 9.1 ChakraProvider を v3 形式に更新
  - v3 の Provider 構成に移行する
  - 必要に応じて createSystem を設定する
  - アプリケーションが正常に起動することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 2.2, 3.1_

## Task 10: アイコンシステムの移行
- [x] 10.1 (P) InitialSettingPane のアイコン移行
  - ArrowForwardIcon を react-icons の MdArrowForward に置換する
  - アイコンサイズと色を維持する
  - _Requirements: 5.1, 5.2_

- [x] 10.2 (P) InitMemberCountInput のアイコン移行
  - AddIcon を MdAdd に、MinusIcon を MdRemove に置換する
  - _Requirements: 5.1, 5.2_

- [x] 10.3 (P) HelpButton のアイコン移行
  - QuestionOutlineIcon を MdHelpOutline に置換する
  - _Requirements: 5.1, 5.2_

- [x] 10.4 (P) UsageAlertDialog のアイコン移行
  - ExternalLinkIcon を MdOpenInNew に、ChevronRightIcon を MdChevronRight に置換する
  - _Requirements: 5.1, 5.2_

- [x] 10.5 (P) GenerateButton のアイコン移行
  - CheckIcon を MdCheck に、RepeatClockIcon を MdHistory に置換する
  - _Requirements: 5.1, 5.2_

- [x] 10.6 (P) ShareDialog のアイコン移行
  - CopyIcon を MdContentCopy に置換する
  - _Requirements: 5.1, 5.2_

- [x] 10.7 (P) ResetButton のアイコン移行
  - SmallCloseIcon を MdClose に置換する
  - _Requirements: 5.1, 5.2_

## Task 11: アイコン関連 Props 変更（v2 → v3）
- [x] 11.1 (P) IconButton の icon → children への変更
  - IconButton の icon prop を children に変更する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: InitialSettingPane, HelpButton, HistoryButton, ResetButton, SharedPane, MemberButton, ShareButton, InitMemberCountInput
  - _Requirements: 4.2, 5.1_

- [x] 11.2 (P) Button の leftIcon/rightIcon → children への変更
  - Button の leftIcon/rightIcon を children 内にアイコンを配置する形式に変更する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: InitialSettingPane, GenerateButton, ShareDialog, CurrentMemberCountInput, AdjustmentDialog, StatisticsPane
  - _Requirements: 4.2, 5.1_

- [x] 11.3 品質チェック
  - npm run typecheck && npm run lint && npm run test を実行する
  - このタスクで修正した箇所にエラーが発生していないことを確認する
  - _Requirements: 7.2, 7.3_

## Task 12: コンポーネント名変更（v2 → v3）
- [x] 12.1 (P) Modal → Dialog への置換
  - Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton を Dialog.* に置換する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: HelpButton, GenerateButton, ShareDialog, HistoryDialog, AdjustmentDialog, LeaveDialog, UsageAlertDialog, MemberDialog
  - _Requirements: 4.1_

- [x] 12.2 (P) AlertDialog → Dialog への置換
  - AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter を Dialog.* に置換する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: ConfirmDialog
  - _Requirements: 4.1_

- [x] 12.3 (P) Divider → Separator への置換
  - 対象コンポーネントとテストを同時に修正する
  - 対象: HelpButton, InitialSettingPane, HistoryPane, GamePane, CourtMembersPane, MemberCountPane
  - _Requirements: 4.1_

- [x] 12.4 (P) Slider → Slider.* namespace への置換
  - Slider, SliderTrack, SliderFilledTrack, SliderThumb を Slider.Root, Slider.Control, Slider.Track, Slider.Range, Slider.Thumb に置換する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: InitMemberCountInput
  - _Requirements: 4.1_

- [x] 12.5 (P) Card → Card.* namespace への置換
  - Card, CardBody を Card.Root, Card.Body に置換する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: InitialSettingPane, GamePane, SharedPane, CourtMembersPane
  - _Requirements: 4.1_

- [x] 12.6 (P) Alert → Alert.* namespace への置換
  - Alert, AlertIcon, AlertTitle を Alert.Root, Alert.Indicator, Alert.Title に置換する
  - 対象コンポーネントとテストを同時に修正する
  - 対象: UsageAlertDialog, SharedPane
  - _Requirements: 4.1_

- [x] 12.7 品質チェック
  - npm run typecheck && npm run lint を実行し、パスを確認
  - テストは一部失敗（24件）- Chakra UI v3 のダイアログポータル方式の変更に起因
  - _Requirements: 7.2, 7.3_

## Task 13: その他 Props 変更（v2 → v3）
- [x] 13.1 (P) spacing → gap への変更
  - Stack, VStack, HStack, SimpleGrid の spacing prop を gap に変更する
  - 対象: 全コンポーネント
  - _Requirements: 4.2_

- [x] 13.2 (P) isDisabled → disabled への変更
  - Button, IconButton の isDisabled prop を disabled に変更する
  - 対象: 全ボタン
  - _Requirements: 4.2_

- [x] 13.3 (P) useDisclosure の isOpen → open への変更
  - useDisclosure().isOpen を useDisclosure().open に変更する
  - 対象: 全ダイアログ
  - _Requirements: 4.2_

- [x] 13.4 (P) colorScheme → colorPalette への変更
  - Slider の colorScheme を colorPalette に変更
  - RadioGroup.Item の colorScheme を colorPalette に変更
  - _Requirements: 4.2_

- [x] 13.5 (P) その他の Props 変更
  - Link の isExternal → target="_blank" rel="noopener noreferrer"
  - IconButton の isRound → rounded="full"
  - Dialog の isCentered → placement="center"
  - _Requirements: 4.2, 4.4_

- [x] 13.6 品質チェック
  - npm run typecheck && npm run lint を実行し、パスを確認
  - _Requirements: 7.2, 7.3_

## Task 14: フック移行
- [x] 14.1 useToast → toaster への移行
  - useToast を v3 の createToaster に移行する
  - toaster を theme.ts からエクスポート
  - 対象: GamePane, ShareDialog, SharedPane, ShareButton, AdjustmentPane
  - _Requirements: 4.3_

- [x] 14.2 Tabs の移行
  - Tabs, TabList, Tab を Tabs.Root, Tabs.List, Tabs.Trigger に移行
  - onChange を onValueChange に変更（index → value）
  - 対象: MemberCountPane
  - _Requirements: 4.3_

- [x] 14.3 RadioGroup の移行
  - Radio, RadioGroup を RadioGroup.Root, RadioGroup.Item に移行
  - useRadio, useRadioGroup を RadioGroup.* コンポーネントに移行
  - 対象: CourtCountInput, AlgorithmInput
  - _Requirements: 4.3, 4.5_

- [x] 14.4 NativeSelect の導入
  - Select コンポーネントを NativeSelect.Root, NativeSelect.Field に移行
  - 対象: LeaveDialog
  - _Requirements: 4.3_

- [x] 14.5 品質チェック
  - npm run typecheck && npm run lint && npm run test を実行する
  - すべてパスすることを確認する（全移行完了）
  - テスト 193件すべてパス
  - _Requirements: 7.2, 7.3_

## Task 15: 最終検証
- [x] 15.1 ビルド確認
  - npm run build でビルドを実行する
  - エラーがないことを確認する
  - ビルド成功: dist/assets/index-DP2WcTNC.js (949.38 kB, gzip: 285.50 kB)
  - _Requirements: 2.1, 2.5_

- [ ] 15.2 手動 UI 確認
  - 初期設定画面の動作を確認する
  - メンバー生成機能を確認する
  - ドラッグ&ドロップ調整機能を確認する
  - 統計情報表示を確認する
  - URL 共有機能を確認する
  - 全機能が移行前と同等に動作することを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [x] 15.3 バンドルサイズの確認
  - ビルド出力のサイズを確認する
  - v2 (main): 814.77 kB (gzip: 268.57 kB)
  - v3 (chakra-ui-upgrade): 949.38 kB (gzip: 285.50 kB)
  - 差分: +134.61 kB (+16.5%), gzip: +16.93 kB (+6.3%)
  - 注: Chakra UI v3 は Ark UI 等の新依存を追加したためサイズ増加
  - _Requirements: 7.1_

## Task 16: UI スタイル修正（Chakra v3 移行後のバグ修正）

- [x] 16.1 theme.ts に semanticTokens と globalCss を追加
  - semanticTokens に brand, primary, danger の semantic colors を定義（solid, contrast, fg, muted, subtle, emphasized, focusRing）
  - globalCss で html の colorPalette を "brand" に設定
  - _Requirements: 6.1, 7.4_

- [x] 16.2 colorScheme → colorPalette 一括置換
  - 全ファイルで colorScheme= を colorPalette= に置換
  - 対象: Button, IconButton, Badge 等のコンポーネント（15ファイル、19箇所）
  - ConfirmDialog の okColorScheme → okColorPalette も修正
  - _Requirements: 6.1, 7.4_

- [x] 16.3 Slider の幅修正
  - InitMemberCountInput.tsx の Slider.Root に width="320px" を追加（親コンテナと同じ幅に合わせる）
  - _Requirements: 6.1, 7.4_

- [x] 16.4 Card/Container の余白調査・修正
  - Chakra v3 で変更された Card のデフォルトスタイルを調査
  - Card 自体の余白は問題なし（main と同じ設定）
  - Heading のサイズを v3 用に調整（lg→2xl, md→lg）
  - SegmentGroup の幅問題は Task 17 で対応
  - atomWithStorage に getOnInit: true を追加して初期値のちらつきを修正
  - previousSettings を親コンポーネントから props で渡すように変更
  - _Requirements: 6.1, 7.4_

- [x] 16.5 品質チェック
  - npm run typecheck && npm run lint && npm run test を実行
  - 開発サーバーで手動確認（ボタンのトンマナ、レイアウト、スライダー表示）
  - _Requirements: 7.2, 7.3, 7.4_

## Task 17: SegmentGroup スタイリング（新規 UI の実装）

現状: 色がグレースケール、幅が画面いっぱいに広がっている
目標: 元のボタン形式のトンマナに合わせる

- [x] 17.1 SegmentGroup のスタイリング
  - CourtCountInput.tsx: colorPalette="brand" を追加、幅を fit-content に制限
  - AlgorithmInput.tsx: colorPalette="brand" を追加、幅を fit-content に制限
  - 背景: lightgray.50（薄いグレー）、未選択テキスト: gray.700（濃いグレー）
  - 選択状態: colorPalette.solid 背景、colorPalette.contrast テキスト（白）
  - GitHub ボタンの色を gray に修正
  - _Requirements: 6.1, 7.4_

- [x] 17.2 品質チェック
  - npm run typecheck && npm run lint && npm run test を実行
  - typecheck ✅、lint ✅、test ✅（193件パス）
  - _Requirements: 7.2, 7.3, 7.4_

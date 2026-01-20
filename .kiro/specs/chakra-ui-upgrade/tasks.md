# Implementation Plan

## Task 0: 既存のビルドエラー修正
- [ ] 0.1 TypeScript コンパイルエラーの修正
  - tsconfig.json の未知オプション `noUncheckedSideEffectImports` を削除
  - amplify ディレクトリを tsconfig の include から除外（amplify は独自の tsconfig を持つ）
  - npm run typecheck が通ることを確認する
  - _Requirements: 7.3_

- [ ] 0.2 Biome lint エラーの修正
  - src/api/event.test.ts の `as any` を適切な型に修正（3箇所）
  - npm run lint が通ることを確認する
  - _Requirements: 7.2_

## Task 1: テスト環境の整備
- [ ] 1.1 vitest 設定ファイルの分離
  - vite.config.ts から vitest 設定を分離し、vitest.config.ts を作成する
  - vitest/config から defineConfig をインポートする
  - 既存のテスト設定（environment, setupFiles）を移行する
  - globals: true を追加してグローバル API を有効化する
  - _Requirements: 1.6_

- [ ] 1.2 テスト関連パッケージの更新
  - vitest を 1.2.2 から 4.x（React 18 対応最新版）にアップグレードする
  - @vitest/ui を vitest と同じバージョンに更新する
  - @testing-library/react, @testing-library/dom, @testing-library/jest-dom を最新版に更新する
  - happy-dom を最新版に更新する
  - 更新後に既存テストが正常に動作することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.4, 1.6_

## Task 2: テスト基盤の構築
- [ ] 2.1 ブラウザ API モックの追加
  - test-setup.ts に matchMedia, ResizeObserver, IntersectionObserver のモックを追加する
  - Chakra UI コンポーネントがテスト環境で正常に動作するために必要なモック
  - 既存の @testing-library/jest-dom/vitest インポートを維持しつつ拡張する
  - _Requirements: 1.4, 1.6_

- [ ] 2.2 カスタム render 関数の作成
  - ChakraProvider をラップしたカスタム render 関数を作成する
  - Jotai Provider も統合し、テスト用の初期状態を設定可能にする
  - @testing-library/react の API を再エクスポートする
  - テストファイルから一貫した方法でコンポーネントをレンダリングできるようにする
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

## Task 3: コア機能コンポーネントのテスト実装
- [ ] 3.1 (P) Main コンポーネントのテスト
  - 初期設定画面とゲーム画面の条件分岐を検証する
  - 設定が未完了の場合は InitialSettingPane が表示されることを確認する
  - 設定完了後は GamePane が表示されることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.1_

- [ ] 3.2 (P) InitialSettingPane コンポーネントのテスト
  - コート数選択の動作を検証する
  - メンバー数入力の動作を検証する
  - アルゴリズム選択の動作を検証する
  - 開始ボタンのクリックで適切なコールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [ ] 3.3 (P) GamePane コンポーネントのテスト
  - メンバー数増減ボタンの動作を検証する
  - 生成ボタンのクリックでメンバー生成が行われることを確認する
  - 各操作ボタン（履歴、共有、リセット）が正常に動作することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [ ] 3.4 (P) GenerateButton コンポーネントのテスト
  - ボタンクリックで生成ロジックが呼び出されることを検証する
  - ローディング状態の表示を確認する
  - 生成済みの場合のリトライ表示を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 4: 入力コンポーネントのテスト実装
- [ ] 4.1 (P) CourtCountInput コンポーネントのテスト
  - コート数の選択が正常に動作することを検証する
  - 選択状態の視覚的フィードバックを確認する
  - onChange コールバックが適切に呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [ ] 4.2 (P) AlgorithmInput コンポーネントのテスト
  - アルゴリズムの切り替えが正常に動作することを検証する
  - 選択状態の視覚的フィードバックを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [ ] 4.3 (P) InitMemberCountInput コンポーネントのテスト
  - 増減ボタンの動作を検証する
  - 最小値の境界条件を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 5: ダイアログコンポーネントのテスト実装
- [ ] 5.1 (P) ConfirmDialog コンポーネントのテスト
  - ダイアログの開閉動作を検証する
  - 確認・キャンセルボタンのクリックで適切なコールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

- [ ] 5.2 (P) ShareDialog コンポーネントのテスト
  - URL 表示を検証する
  - コピーボタンの動作を検証する（クリップボード API のモック）
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.5_

- [ ] 5.3 (P) LeaveDialog コンポーネントのテスト
  - メンバー選択の動作を検証する
  - 離脱確定時のコールバックを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 6.1_

## Task 6: ドラッグ&ドロップ機能のテスト実装
- [ ] 6.1 AdjustmentPane コンポーネントのテスト
  - DnD コンテキストの初期化を検証する
  - メンバーボックスの表示を確認する
  - ドラッグ&ドロップによるメンバー入れ替えの結果を検証する
  - 入れ替え後に onChange コールバックが呼ばれることを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5, 6.2_

- [ ] 6.2 (P) MemberBox コンポーネントのテスト
  - ドラッグ可能状態の検証（useDraggable フックの動作確認）
  - メンバー ID の表示を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5_

- [ ] 6.3 (P) MemberDroppable コンポーネントのテスト
  - ドロップターゲットとしての動作を検証する（useDroppable フックの動作確認）
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.5_

## Task 7: 統計・表示コンポーネントのテスト実装
- [ ] 7.1 (P) StatisticsPane コンポーネントのテスト
  - 統計情報の表示を検証する
  - 調整ダイアログの開閉動作を確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3, 6.4_

- [ ] 7.2 (P) HistoryPane コンポーネントのテスト
  - 履歴一覧の表示を検証する
  - 各履歴エントリのフォーマットを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3_

- [ ] 7.3 (P) CourtMembersPane コンポーネントのテスト
  - コート別メンバー表示を検証する
  - メンバー ID の表示フォーマットを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 1.1, 1.2, 6.3_

## Task 8: Chakra UI v3 依存関係の更新
- [ ] 8.1 Chakra UI v3 パッケージのインストールと不要パッケージの削除
  - @chakra-ui/react を v3 にアップグレードする
  - @emotion/styled を削除する（@emotion/react は維持）
  - framer-motion を削除する
  - @chakra-ui/icons を削除する
  - @chakra-ui/radio の型インポートを削除する
  - package.json を更新し、npm install を実行する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 2.1, 2.3, 2.4_

## Task 9: Provider 設定の移行
- [ ] 9.1 ChakraProvider を v3 形式に更新
  - v3 の Provider 構成に移行する
  - 必要に応じて createSystem を設定する
  - アプリケーションが正常に起動することを確認する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 2.2, 3.1_

## Task 10: アイコンシステムの移行
- [ ] 10.1 (P) InitialSettingPane のアイコン移行
  - ArrowForwardIcon を react-icons の MdArrowForward に置換する
  - アイコンサイズと色を維持する
  - _Requirements: 5.1, 5.2_

- [ ] 10.2 (P) InitMemberCountInput のアイコン移行
  - AddIcon を MdAdd に、MinusIcon を MdRemove に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.3 (P) HelpButton のアイコン移行
  - QuestionOutlineIcon を MdHelpOutline に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.4 (P) UsageAlertDialog のアイコン移行
  - ExternalLinkIcon を MdOpenInNew に、ChevronRightIcon を MdChevronRight に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.5 (P) GenerateButton のアイコン移行
  - CheckIcon を MdCheck に、RepeatClockIcon を MdHistory に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.6 (P) ShareDialog のアイコン移行
  - CopyIcon を MdContentCopy に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.7 (P) ResetButton のアイコン移行
  - SmallCloseIcon を MdClose に置換する
  - _Requirements: 5.1, 5.2_

- [ ] 10.8 チェック
  - テストが通ることを確認する
  - npm run typecheck と npm run lint が通ることを確認する

## Task 11: コンポーネント API の移行
- [ ] 11.1 SegmentedControl への移行
  - CourtCountInput を useRadio/useRadioGroup から SegmentedControl に移行する
  - AlgorithmInput を RadioGroup から SegmentedControl に移行する
  - 既存の見た目と操作感を維持する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 4.1, 4.3, 4.5_

- [ ] 11.2 useToast から toaster への移行
  - GamePane の useToast を v3 の toaster に移行する
  - AdjustmentPane の useToast を v3 の toaster に移行する
  - ShareButton の useToast を v3 の toaster に移行する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 4.1, 4.3_

- [ ] 11.3 Modal/AlertDialog の v3 API 対応
  - 全ダイアログコンポーネントを v3 の API に更新する
  - useDisclosure から Dialog 状態管理への移行
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 4.1, 4.3_

- [ ] 11.4 その他の Props 変更対応
  - colorScheme を colorPalette に変更する
  - Link の isExternal を external に変更する
  - その他 v3 で変更された Props を更新する
  - npm run typecheck と npm run lint が通ることを確認する
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

## Task 12: 回帰テストと品質検証
- [ ] 12.1 全コンポーネントテストの実行
  - npm run test で全テストを実行する
  - 失敗したテストを特定し、v3 API に合わせて修正する
  - 全テストがパスすることを確認する
  - _Requirements: 6.6, 7.2, 7.3_

- [ ] 12.2 ビルドと型チェック
  - npm run build でビルドを実行する
  - npm run typecheck で型チェックを実行する
  - npm run lint で lint チェックを実行する
  - エラーがないことを確認する
  - _Requirements: 2.1, 2.5, 7.2, 7.3_

- [ ] 12.3 手動 UI 確認
  - 初期設定画面の動作を確認する
  - メンバー生成機能を確認する
  - ドラッグ&ドロップ調整機能を確認する
  - 統計情報表示を確認する
  - URL 共有機能を確認する
  - 全機能が移行前と同等に動作することを確認する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.4_

- [ ] 12.4 バンドルサイズの確認
  - ビルド出力のサイズを確認する
  - 移行前と同等以下であることを確認する
  - _Requirements: 7.1_

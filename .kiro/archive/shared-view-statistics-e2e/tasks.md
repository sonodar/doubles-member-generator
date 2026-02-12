# Implementation Plan

- [x] 1. replayEvents を SharedPane から独立モジュールに抽出する
- [x] 1.1 replayEvents 抽出のテストを先に書く（RED）
  - 抽出先モジュールから replayEvents をインポートし、Initialize イベント1件を渡して CurrentSettings が返ることを検証するテストを書く
  - この時点ではモジュールが存在しないためテストは失敗する（RED 確認）
  - _Requirements: 2.1_

- [x] 1.2 replayEvents を独立モジュールに抽出して GREEN にする
  - SharedPane.tsx 内のローカル関数 replayEvents をそのまま独立モジュールに移動する
  - SharedPane.tsx からは抽出先をインポートして使用するように変更する
  - 振る舞いの変更は一切行わない（純粋な移動）
  - テストが通ることを確認する（GREEN 確認）
  - `npm run typecheck` で型エラーがないことを確認する
  - `npm run lint` でリントエラーがないことを確認する
  - _Requirements: 2.1_

- [x] 2. テストデータからイベント列への変換関数を作成する
- [x] 2.1 変換関数のテストを先に書く（RED）
  - 最小限のパターン（初期メンバーのみ、history 1件、joiner なし）を入力し、Initialize + Generate の2イベントが返ることを検証するテストを書く
  - 途中参加者を含むパターンを入力し、Initialize → Join → Generate の順でイベントが生成されることを検証するテストを書く
  - この時点では変換関数が存在しないためテストは失敗する（RED 確認）
  - _Requirements: 1.1, 1.2_

- [x] 2.2 変換関数を実装して GREEN にする
  - StatisticsTestData の初期メンバー（joiner を除く）で Initialize イベントを生成する
  - 各 history index について、joiner がいれば Join イベントを挿入し、続けて Generate イベントを発行する
  - テストが通ることを確認する（GREEN 確認）
  - `npm run typecheck` で型エラーがないことを確認する
  - `npm run lint` でリントエラーがないことを確認する
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 3. 共有画面統計値の E2E テストスイートを作成する
- [x] 3.1 全パターン網羅テストを書く（RED）
  - 全テストパターンを動的にイテレートし、各パターンについて変換 → リプレイ → 統計値取得 → 期待値アサーションのフローを実行するテストを書く
  - playCount、totalRestCount、consecutiveRestCount、highlightLevel の各指標を検証する
  - パターン配列を動的に参照し、新パターン追加時に自動的にテスト対象に含まれる構造にする
  - テストを実行し、失敗するパターンがあれば RED を確認する
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 3.2 全パターンのテストを GREEN にする
  - 失敗しているパターンの原因を調査し、変換関数またはリプレイ経路の問題を修正する
  - 全12パターンのテストが通ることを確認する（GREEN 確認）
  - `npm run typecheck` で型エラーがないことを確認する
  - `npm run lint` でリントエラーがないことを確認する
  - `npm run test` で既存テストも含めて全テストが通ることを確認する
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

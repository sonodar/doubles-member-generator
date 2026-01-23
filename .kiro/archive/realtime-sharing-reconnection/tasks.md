# Implementation Plan

コンテキストを引き継ぐ場合や、サブエージェントを利用する場合は必ず以下の指示を含めること。
- 各タスクを実行する前にかならず requirements.md, research.md, design.md を読んで制約をよく理解すること。

## Tasks

- [x] 1. useRealtimeSync フックの作成
- [x] 1.1 フックの基本構造とインターフェースを実装する
  - sharedId、onEvent、onSync を受け取るフックを作成する
  - マウント状態を追跡する ref を用意する
  - subscription 参照と singleflight 用 Promise 参照を管理する ref を用意する
  - 処理済みイベントを管理するオブジェクト参照を用意する
  - sync 関数を返却するインターフェースを実装する
  - _Requirements: 1.1, 1.2, 3.7_

- [x] 1.2 sync 関数の実装
  - 既存 subscription があれば解除する処理を実装する
  - 新規 subscription を作成して参照を保持する処理を実装する
  - API から全イベントを取得してコールバックに渡す処理を実装する
  - singleflight パターンで二重実行を防止する
  - アンマウント済みの場合は処理をスキップする
  - エラー時は Promise 参照をクリアして終了する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 5.1, 5.2_

- [x] 1.3 cleanup 関数の実装
  - subscription を解除する処理を実装する
  - subscription 参照を null にクリアする
  - singleflight の Promise 参照をクリアする
  - マウントフラグを false に設定する
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 1.4 (P) ブラウザライフサイクルイベントリスナーの登録
  - visibilitychange イベントで visible 時に sync を実行する
  - pageshow イベントで persisted が true の場合に sync を実行する
  - pagehide イベントで cleanup を実行する
  - online イベントで sync を実行する
  - アンマウント時に全イベントリスナーを解除する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. SharedPane コンポーネントのリファクタリング
- [x] 2.1 useRealtimeSync フックの統合
  - 既存の startSubscribe 関数と関連ロジックを削除する
  - useRealtimeSync フックを呼び出すように変更する
  - onEvent コールバックで既存のイベント処理ロジックを実行する
  - onSync コールバックで既存の replayEvents ロジックを実行する
  - subscribed state を削除し、フック内部の管理に移行する
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 4.4_

- [x] 2.2 (P) 重複イベント処理の防止ロジック移行
  - proceededEvents オブジェクトをフックのコールバック内で管理する
  - イベント受信時に処理済みかチェックする
  - subscription の二重購読を防止する
  - _Requirements: 5.3_

- [x] 3. useRealtimeSync フックのユニットテスト
- [x] 3.1 (P) sync 関数の動作テスト
  - 初回実行時に subscription が作成されることを検証する
  - 再実行時に既存 subscription が解除されてから新規作成されることを検証する
  - API fetch 後にコールバックが呼ばれることを検証する
  - singleflight で同時呼び出しが1回のみ実行されることを検証する
  - エラー時に Promise 参照がクリアされることを検証する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.8_

- [x] 3.2 (P) cleanup 関数の動作テスト
  - subscription が解除されることを検証する
  - 参照がクリアされることを検証する
  - アンマウント後の sync 完了が無視されることを検証する
  - _Requirements: 4.1, 4.2, 4.3, 3.6_

- [x] 3.3 (P) ライフサイクルイベントハンドラのテスト
  - visibilitychange イベントで sync が実行されることを検証する
  - pageshow イベントで persisted 時に sync が実行されることを検証する
  - pagehide イベントで cleanup が実行されることを検証する
  - online イベントで sync が実行されることを検証する
  - アンマウント時にリスナーが解除されることを検証する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 1.2_

- [x] 4. 統合テスト
- [x] 4.1 SharedPane と useRealtimeSync の結合テスト
  - 共有画面マウント時に sync が実行されることを検証する
  - 共有画面アンマウント時に cleanup が実行されることを検証する
  - イベント受信時に状態が更新されることを検証する
  - 復帰後に最新状態が反映されることを検証する
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 6.1, 6.2, 6.3_

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1 | 1.1, 2.1 |
| 1.2 | 1.1, 2.1, 3.3 |
| 1.3 | 2.1, 4.1 |
| 2.1 | 1.4, 3.3 |
| 2.2 | 1.4, 3.3 |
| 2.3 | 1.4, 3.3 |
| 2.4 | 1.4, 3.3 |
| 2.5 | 1.4, 3.3 |
| 3.1 | 1.2, 2.1, 3.1 |
| 3.2 | 1.2, 3.1 |
| 3.3 | 1.2, 3.1 |
| 3.4 | 1.2, 3.1 |
| 3.5 | 1.2, 3.1 |
| 3.6 | 1.2, 3.2 |
| 3.7 | 1.1 |
| 3.8 | 1.2, 3.1 |
| 4.1 | 1.3, 3.2 |
| 4.2 | 1.3, 3.2 |
| 4.3 | 1.3, 3.2 |
| 4.4 | 2.1 |
| 5.1 | 1.2, 4.1 |
| 5.2 | 1.2, 4.1 |
| 5.3 | 2.2 |
| 6.1 | 4.1 |
| 6.2 | 4.1 |
| 6.3 | 4.1 |

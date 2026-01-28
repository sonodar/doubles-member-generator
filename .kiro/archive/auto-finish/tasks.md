# Implementation Plan

## Tasks

- [x] 1. アイドル判定ロジック（TDD）
- [x] 1.1 アイドル判定のテストを作成する
  - 24時間経過判定のテスト（境界値含む）
  - イベントあり/なしの分岐テスト
  - `createdAt` フォールバックのテスト
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 1.2 アイドル判定ロジックを実装する
  - 最終イベント `occurredAt` または Environment `createdAt` を基準に判定
  - 24時間以上経過しているかチェック
  - イベントが存在しない場合は `createdAt` を使用
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Environment 取得機能（TDD）
- [x] 2.1 (P) 未終了 Environment 取得のテストを作成する
  - Scan + Filter による取得の検証
  - ページネーション対応の検証
  - _Requirements: 1.2_

- [x] 2.2 (P) 最終イベント取得のテストを作成する
  - byEnvironment インデックスによる取得の検証
  - イベントが存在しない場合の検証
  - _Requirements: 1.3_

- [x] 2.3 未終了 Environment を取得する機能を実装する
  - `finishedAt` が未設定の Environment を Scan で取得
  - FilterExpression で `attribute_not_exists(finishedAt)` を指定
  - ページネーション対応（LastEvaluatedKey による継続取得）
  - _Requirements: 1.2_

- [x] 2.4 最終イベント日時を取得する機能を実装する
  - byEnvironment インデックスで Environment の最新イベントを取得
  - `occurredAt` 降順でソートし最初の1件を取得
  - イベントが存在しない場合は空配列を返す
  - _Requirements: 1.3_

- [x] 3. 終了処理機能（TDD）
- [x] 3.1 終了処理のテストを作成する
  - `finishedAt` 更新の成功ケース
  - 既に終了済みの場合のスキップ
  - FINISH イベント発行の検証（silent: true 含む）
  - _Requirements: 2.1, 5.1, 5.2, 6.1_

- [x] 3.2 Environment を終了状態に更新する機能を実装する
  - `finishedAt` に現在日時を設定
  - 条件付き更新で `finishedAt` 未設定時のみ更新（冪等性確保）
  - 更新成功/失敗の結果を返す
  - _Requirements: 2.1, 5.1, 5.2_

- [x] 3.3 FINISH イベントを発行する機能を実装する
  - Event テーブルに FINISH タイプのイベントを作成
  - payload に `silent: true` と `auto: true` を含める
  - `occurredAt` に現在日時を設定
  - _Requirements: 6.1, 6.2_

- [x] 4. バッチ処理機能（TDD）
- [x] 4.1 バッチ処理のテストを作成する
  - 複数 Environment の処理
  - 個別エラー時の継続処理
  - サマリー集計の検証
  - _Requirements: 2.3, 2.4, 5.3_

- [x] 4.2 終了処理をバッチ実行する機能を実装する
  - 複数の Environment を順次処理
  - 個別エラー時は該当 Environment をスキップし継続
  - 処理結果（成功/失敗/スキップ）を集計
  - _Requirements: 2.3, 2.4, 5.3_

- [x] 5. Lambda ハンドラー実装
- [x] 5.1 メインハンドラーを実装する（handler.ts）
  - EventBridge スケジュールイベントを受け取る
  - 処理開始ログを出力
  - アイドル検出 → 終了処理のフローを実行
  - 処理完了ログとサマリー（検査件数、終了件数、エラー件数）を出力
  - _Requirements: 2.2, 3.3, 3.4_

- [x] 6. Lambda リソース定義
- [x] 6.1 Lambda 関数リソースを作成する（resource.ts）
  - `defineFunction` で autoFinisher Lambda を定義
  - `schedule: "every day"` で日次スケジュールを設定
  - `resourceGroupName: "data"` で data スタックに配置（循環依存回避）
  - Node.js 22 ランタイム、適切なタイムアウト設定
  - _Requirements: 3.1, 3.2_

- [x] 6.2 backend.ts に Lambda 統合を追加する
  - autoFinisher を backend 定義に追加
  - Environment テーブルへの Scan/Update 権限を付与
  - Event テーブルへの Query/PutItem 権限を付与
  - 環境変数でテーブル名を Lambda に渡す
  - _Requirements: 3.1, 3.2_

- [ ] 7. 統合テスト（スコープ外: DynamoDB Local 環境が未設定のため）
- [ ] 7.1 DynamoDB 操作の統合テストを作成する
  - Scan + Filter による未終了 Environment 取得
  - byEnvironment インデックスによる最新イベント取得
  - 条件付き更新による finishedAt 設定
  - Event レコード作成
  - _Requirements: 1.2, 1.3, 2.1, 6.2_

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1 | 1.1, 1.2 |
| 1.2 | 2.1, 2.3, 7.1 |
| 1.3 | 1.1, 1.2, 2.2, 2.4, 7.1 |
| 1.4 | 1.1, 1.2 |
| 2.1 | 3.1, 3.2, 7.1 |
| 2.2 | 5.1 |
| 2.3 | 4.1, 4.2 |
| 2.4 | 4.1, 4.2 |
| 3.1 | 6.1, 6.2 |
| 3.2 | 6.1, 6.2 |
| 3.3 | 5.1 |
| 3.4 | 5.1 |
| 4.1 | (設計で対応: finishedAt のみ更新、TTL 未変更) |
| 4.2 | (設計で対応: TTL 動作維持) |
| 4.3 | (設計で対応: TTL 値変更なし) |
| 5.1 | 3.1, 3.2 |
| 5.2 | 3.1, 3.2 |
| 5.3 | 4.1, 4.2 |
| 6.1 | 3.1, 3.3 |
| 6.2 | 3.3, 7.1 |

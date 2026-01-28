# Requirements Document

## Introduction

本機能は、最終イベントから1日（24時間）以上経過した Environment を自動的に終了状態（`finishedAt` を設定）にする仕組みを提供する。これにより、ユーザーが明示的に終了操作を行わなかった場合でも、放置された Environment が適切にクリーンアップされ、リソースの無駄遣いを防ぐ。

## Requirements

### Requirement 1: アイドル Environment の自動検出

**Objective:** As a システム運用者, I want 最終イベントから一定期間経過した Environment を自動的に検出する機能, so that 放置された Environment を特定し終了処理の対象とできる。

#### Acceptance Criteria

1. The Auto-Finish Service shall 最終イベントの発生日時から24時間以上経過した Environment を検出する
2. When 定期実行スケジュールが発動した場合, the Auto-Finish Service shall すべての未終了 Environment（`finishedAt` が null）を検査対象とする
3. The Auto-Finish Service shall 各 Environment の最新イベントの `occurredAt` を基準にアイドル判定を行う
4. If Environment に紐づくイベントが存在しない場合, the Auto-Finish Service shall Environment の作成日時（`createdAt`）を基準にアイドル判定を行う

### Requirement 2: 自動終了処理の実行

**Objective:** As a システム運用者, I want アイドル状態の Environment を自動的に終了状態にする機能, so that リソースが適切に解放され不要なデータが蓄積しない。

#### Acceptance Criteria

1. When アイドル状態（最終イベントから24時間以上経過）と判定された場合, the Auto-Finish Service shall 対象 Environment の `finishedAt` に現在日時を設定する
2. The Auto-Finish Service shall 終了処理の結果（成功/失敗、対象件数）をログに出力する
3. If 終了処理中にエラーが発生した場合, the Auto-Finish Service shall エラー詳細をログに出力し、他の Environment の処理を継続する
4. The Auto-Finish Service shall 1回の実行で複数の Environment を効率的にバッチ処理する

### Requirement 3: 定期実行スケジュール

**Objective:** As a システム運用者, I want 自動終了処理を定期的に実行するスケジュール, so that 人手を介さず継続的にアイドル Environment がクリーンアップされる。

#### Acceptance Criteria

1. The Auto-Finish Service shall 1日1回、定期的に自動実行される
2. The Auto-Finish Service shall AWS EventBridge Scheduler または CloudWatch Events による cron スケジュールで起動される
3. While スケジュール実行中, the Auto-Finish Service shall 処理開始と完了のタイムスタンプをログに出力する
4. The Auto-Finish Service shall 実行結果のサマリー（検査件数、終了件数、エラー件数）をログに出力する

### Requirement 4: 既存 TTL 機構との連携

**Objective:** As a システム運用者, I want 自動終了機能と既存の TTL による物理削除が適切に連携すること, so that データライフサイクルが一貫して管理される。

#### Acceptance Criteria

1. The Auto-Finish Service shall 既存の Environment TTL（物理削除）機構に影響を与えない
2. When Environment が終了状態になった場合, the Auto-Finish Service shall TTL による物理削除は既存の動作を維持する
3. The Auto-Finish Service shall `finishedAt` の設定のみを行い、TTL 値の変更は行わない

### Requirement 5: 冪等性と安全性

**Objective:** As a システム運用者, I want 自動終了処理が安全かつ冪等であること, so that 複数回実行されても問題が発生しない。

#### Acceptance Criteria

1. While Environment がすでに終了状態（`finishedAt` が設定済み）の場合, the Auto-Finish Service shall 再度の更新処理をスキップする
2. The Auto-Finish Service shall 同一 Environment に対する複数回の実行で副作用が発生しない（冪等性を保証する）
3. If 処理中に Lambda がタイムアウトした場合, the Auto-Finish Service shall 次回実行時に未処理の Environment を再検出し処理する

### Requirement 6: Push 通知の抑制

**Objective:** As a 共有リンクを受け取ったユーザー, I want 自動終了時に不要な通知を受け取りたくない, so that 放置した共有の終了で煩わされない。

#### Acceptance Criteria

1. When 自動終了処理で FINISH イベントを発行する場合, the Auto-Finish Service shall Event payload に `silent: true` フラグを含める
2. The Auto-Finish Service shall FINISH イベントを発行し、共有画面上で終了状態が表示されるようにする

**Note**: pushNotifier Lambda が `silent: true` フラグを持つ Event を通知対象から除外する実装は、push-notification 仕様で対応する必要がある。


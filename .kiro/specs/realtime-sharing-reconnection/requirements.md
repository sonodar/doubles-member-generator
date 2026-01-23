# Requirements Document

## Introduction

iOS Safari でタブ/アプリがバックグラウンドに回って復帰すると、AWS Amplify Gen2 の GraphQL Subscription（WebSocket）が切断されリアルタイム共有が停止する問題を解決する。復帰時に確実に再接続し、切断中の取りこぼしを回収して状態を整合させる。

**スコープ:** 本機能は共有画面（`/shared/:id`）でのみ動作する。SPA であるため、共有画面コンポーネントのマウント時にイベントハンドラを登録し、アンマウント時に解除することで、他の画面への影響を防ぐ。

**設計方針:** `sync()` と `cleanup()` の2つの関数で構成する。`sync()` は初期化時・復帰時の両方で使用し、常に「既存 subscription 解除 → 新規 subscribe → 最新状態 fetch」を行う。

対象ブラウザ: iOS Safari / Android Chrome

## Requirements

### Requirement 1: ライフサイクルハンドラのスコープ制御

**Objective:** As a 共有画面の利用者, I want ライフサイクルイベントのハンドリングが共有画面でのみ有効になってほしい, so that 他の画面で余計な処理が走らない

#### Acceptance Criteria

1. When 共有画面コンポーネント（SharedPane）がマウントされる, the SharedPane Component shall ライフサイクルイベントハンドラを登録する
2. When 共有画面コンポーネント（SharedPane）がアンマウントされる, the SharedPane Component shall ライフサイクルイベントハンドラを解除する
3. While 共有画面以外のページが表示されている, the Realtime Lifecycle Module shall ライフサイクルイベントを処理しない

### Requirement 2: ブラウザライフサイクルイベントの検知

**Objective:** As a 共有画面の利用者, I want ブラウザのライフサイクルイベント（タブ復帰、bfcache復帰、ネットワーク復帰）を検知してほしい, so that 適切なタイミングでリアルタイム共有を復旧できる

#### Acceptance Criteria

1. When `document.visibilitychange` イベントが発火し `document.visibilityState === "visible"` となる, the SharedPane Component shall `sync()` 処理を実行する
2. When `window.pageshow` イベントが発火し `event.persisted === true` となる（bfcache復帰）, the SharedPane Component shall `sync()` 処理を実行する
3. When `window.pagehide` イベントが発火する, the SharedPane Component shall `cleanup()` 処理を実行して subscription を解除する
4. When `window.online` イベントが発火する, the SharedPane Component shall `sync()` 処理を実行する
5. When `window.offline` イベントが発火する, the SharedPane Component shall オフライン状態を検知可能にする

### Requirement 3: Sync 処理の実装

**Objective:** As a 共有画面の利用者, I want 初期化時・復帰時に subscription と状態が同期されてほしい, so that 常に最新のリアルタイム共有状態を取得できる

#### Acceptance Criteria

1. When 共有画面コンポーネントが初期化される, the SharedPane Component shall `sync()` を実行して subscription 作成と最新状態の取得を行う
2. While `sync()` が実行中である, the SharedPane Component shall 新たな `sync()` 呼び出しを実行中の Promise に合流させ二重実行を防止する（singleflight パターン）
3. When `sync()` が実行される, the SharedPane Component shall 既存の subscription があれば `unsubscribe()` してから新しい subscription を作成する
4. When subscription が作成された後, the SharedPane Component shall API から最新状態を fetch してローカル状態を同期する

#### 冪等性・安全性に関する制約（実装時の注意事項）

> **⚠️ 冪等性と安全性を保証するため、無限ループやレースコンディション、無駄なイベント購読等が発生しない設計とすること。以下は代表的な考慮事項である。**

5. If `sync()` がエラーで失敗した場合, the SharedPane Component shall 無限リトライを行わず singleflight の Promise を解放して終了する
6. When `cleanup()` が呼び出された後に `sync()` の Promise が解決される, the SharedPane Component shall 解決結果を無視して subscription 作成を行わない（アンマウント済みチェック）
7. The SharedPane Component shall singleflight 用の Promise 参照と subscription 参照を別々に管理し、`cleanup()` 時に両方をクリアする
8. While 複数のライフサイクルイベントが同時に発火する, the SharedPane Component shall singleflight により1つの `sync()` のみを実行し、他はその結果を共有する

### Requirement 4: Cleanup 処理の実装

**Objective:** As a 共有画面の利用者, I want ページ離脱時やコンポーネント破棄時に subscription が確実に解除されてほしい, so that リソースリークや二重購読が発生しない

#### Acceptance Criteria

1. When `cleanup()` が呼び出される, the SharedPane Component shall すべての subscription を `unsubscribe()` する
2. When `cleanup()` が呼び出される, the SharedPane Component shall sync リトライやタイマー類を停止する
3. When `cleanup()` が呼び出される, the SharedPane Component shall ローカルの subscription 参照を null にクリアする
4. When 共有画面コンポーネントがアンマウントされる, the SharedPane Component shall `cleanup()` を実行する

### Requirement 5: 状態整合性の保証

**Objective:** As a 共有画面の利用者, I want 切断中に発生したイベントの取りこぼしが復帰時に回収されてほしい, so that 常に最新の共有状態を確認できる

#### Acceptance Criteria

1. When ネットワーク復帰後に `sync()` が実行される, the SharedPane Component shall 切断中に発生したイベントの取りこぼしを API fetch により回収する
2. When 最新状態が fetch される, the SharedPane Component shall ローカル状態を最新状態に置き換えて整合性を確保する
3. The SharedPane Component shall subscription の二重購読が発生せずイベントが重複反映されないことを保証する

### Requirement 6: 非機能要件

**Objective:** As a 共有画面の利用者, I want 復旧が高速でシンプルな仕組みで動作してほしい, so that ストレスなくリアルタイム共有を利用できる

#### Acceptance Criteria

1. The SharedPane Component shall iOS Safari でバックグラウンド→復帰後、数秒以内にリアルタイム共有を復旧する
2. The SharedPane Component shall `sync()` と `cleanup()` の2つの概念のみで成立させ `pause` 概念は導入しない
3. The SharedPane Component shall PWA 化なしで動作する

# iOS Safari 復帰で Amplify Gen2 のリアルタイム共有が切れる問題を直す（Amplify Gen2 / Web）

## 背景（重要）
このアプリは AWS Amplify Gen2 + AppSync GraphQL Subscription（WebSocket）でリアルタイム共有を実現している。
しかし iOS Safari は以下の性質が強く、バックグラウンド → 復帰時に subscription が高確率で死ぬ（切断・停止・復旧しない）挙動が起きる。

- iOS Safari はタブが非アクティブ / 画面ロック / アプリ切替などで Web ページの実行を止めたり、通信を切ることがある
- WebSocket を「切れないように維持する」ことは Web アプリ側では困難で、現実的には **切断前提で復帰時に復旧**する設計が必要
- Subscription は「切断中のイベント」を保持しないため、復帰時に subscription を作り直すだけでは取りこぼしが残る  
  → 復帰時に **最新状態を API で取り直して整合**させる必要がある
- 復帰時は複数のイベント（表示復帰、履歴復帰、回線復帰）がほぼ同時に飛ぶため、
  再接続処理は **冪等**でないと二重購読や状態上書きが起きる  
  → **singleflight（多重起動防止）**で「同時に1回だけ実行」を保証する

この修正の狙いは「切れないようにする」ではなく、
**切れる前提で、復帰時に必ず subscription と状態を復旧させる**こと。

対象ブラウザは iOS Safari と Android Chrome。
PWA 化に依存しない（PWAでも根治しないため、Webアプリとして復旧設計を持つ）。

## 方針（重要）

1. iOS Safari では切断が起きる前提で設計する（切れないようにするのではなく、復帰時に必ず復旧する）
2. 復帰時は必ず
   - subscription を作り直す
   - “切断中の取りこぼし” を回収するため最新状態を fetch して整合する
3. 実装を複雑にしない（`pause` 概念は作らない）
   - `cleanup()`（離脱時の後始末）
   - `reconnect()`（復帰時の復旧）
   の2つだけで成立させる

## 実装要件

### 購読するイベント（ライフサイクル）
以下のイベントを購読して処理を割り当てること：

- `document.visibilitychange`
  - `document.visibilityState === "visible"` のとき `reconnect()` を呼ぶ
  - `hidden` 側では基本何もしない（不要な再接続/切断を増やさない）

- `window.pageshow`
  - `event.persisted === true` の場合（bfcache 復帰）に `reconnect()` を呼ぶ

- `window.pagehide`
  - 離脱/履歴遷移として `cleanup()` を呼ぶ（subscription を確実に unsubscribe する）

- `window.online`
  - 回線復帰として `reconnect()` を呼ぶ

- `window.offline`
  - 任意: UI を「オフライン」にする等の状態更新のみ（reconnect のリトライ停止など）
  - `unsubscribe` は必須ではない（どうせ切れる前提＆実装簡素化）

### 冪等性（必須）
復帰イベントは複数同時に飛ぶため、次を必ず満たすこと：

- `reconnect()` は **singleflight**（多重起動防止）にする
  - すでに `reconnect()` が実行中なら、その Promise を返して二重実行しない

- 再購読時は必ず
  - 既存 subscription を `unsubscribe()` してから
  - 新しい subscription を作る

### “取りこぼし回収”の整合（必須）
`reconnect()` では subscription の作り直しだけでは不十分。
以下を必ず行うこと：

- resubscribe 後に API から最新状態を fetch し
- ローカル状態を最新に揃える（replace or merge）
  - 例: list/get を叩いて再描画
  - 例: updatedAt/revision で差分同期

### TypeScript / React(Next.js想定)
- TypeScript で実装する
- `realtimeLifecycle.ts` のような小さなモジュールを追加し、UI層から使える形にする

## 生成してほしい成果物
### 1) ライフサイクルハンドラのユーティリティ
例：`realtimeLifecycle.ts` として以下を実装する：

- `installRealtimeLifecycleHandlers({ reconnect, cleanup, setOnlineState? })`
- `uninstallRealtimeLifecycleHandlers()`

各イベントにリスナーを登録し、正しいコールバックを呼ぶこと。

### 2) reconnect の実装テンプレ
`reconnect()` は以下の順で処理するテンプレを用意する：

1. singleflight ロック（Promise で多重実行を防ぐ）
2. 既存 subscription があれば `unsubscribe()`（= cleanup of subscriptions）
3. subscription をすべて作り直す（必要なモデル/チャンネルを再購読）
4. 最新状態を fetch して整合（取りこぼし回収）
5. 接続状態/UI状態を更新（任意）

### 3) cleanup の実装テンプレ
`cleanup()` は最低限これを行う：

- すべての subscription を `unsubscribe()`
- reconnect リトライ/タイマー類があれば停止
- ローカルの subscription 参照を null へ

## 制約
- “PWAにしたら解決” の前提にしない
- “pause” 抽象は導入しない（要件外）
- デバウンス/スロットルは必須ではない（singleflight を本命にする）
- ただしイベント多重発火に備え、singleflight を必ず入れること

## 期待する完成形
- iOS Safari でバックグラウンド→復帰しても、数秒以内に自動的にリアルタイム共有が復旧する
- subscription の二重購読が発生せず、イベントが重複反映されない
- 切断中の更新も復帰時の fetch により最終的に整合が取れる

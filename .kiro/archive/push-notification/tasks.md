# Implementation Plan

## Prerequisites（事前準備・手動作業）

実装タスクを開始する前に、以下の手動セットアップを完了してください。

### 1. web-push パッケージのインストール
```bash
npm install -D web-push
```

### 2. VAPID キーペアの生成
```bash
npx web-push generate-vapid-keys
```
生成された公開鍵・秘密鍵を控えておく。

### 3. Parameter Store への秘密鍵登録
```bash
# main 環境
aws ssm put-parameter \
  --name "/doubles-member-generator/main/vapid-private-key" \
  --type SecureString \
  --value "YOUR_PRIVATE_KEY"

# develop 環境
aws ssm put-parameter \
  --name "/doubles-member-generator/develop/vapid-private-key" \
  --type SecureString \
  --value "YOUR_PRIVATE_KEY"
```

### 4. Amplify コンソールで環境変数設定
- [x] main 環境: `VITE_VAPID_PUBLIC_KEY` に main 用公開鍵を設定
- [x] develop 環境: `VITE_VAPID_PUBLIC_KEY` に develop 用公開鍵を設定
- [x] `ADMIN_EMAIL` に管理者メールアドレスを設定（VAPID subject に使用）

### 5. ローカル開発用の環境変数設定
`.envrc` に以下を追加（direnv）:
```bash
export VITE_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
```

---

## Implementation Tasks

- [x] 1. PushSubscription モデルの追加
  - 購読情報を永続化するための PushSubscription モデルを Amplify Gen2 スキーマに追加
  - byEnvironment セカンダリインデックスを追加
  - 認可設定（作成のみ許可）
  - _Requirements: 2.1, 2.2_

- [x] 2. pushNotifier Lambda の実装
  - Event テーブルへの INSERT を DynamoDB Streams で検知し、購読者へプッシュ通知を送信
  - イベントタイプフィルタリング（GENERATE, JOIN, LEAVE, FINISH のみ）
  - 無効購読の自動削除（410/404 レスポンス時）
  - VAPID キー管理（環境変数 + Parameter Store）
  - steering ドキュメント（secrets.md）作成
  - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 4.4, 6.1, 6.2_

- [x] 3. Service Worker の実装
  - プッシュ通知を受信・表示するための Service Worker を TypeScript で実装
  - Vite でビルドして dist/sw.js として出力
  - push イベントハンドラで通知表示
  - notificationclick イベントハンドラで共有画面を開く/フォーカス
  - _Requirements: 4.1, 4.2, 6.2, 6.3_

- [x] 4. usePushSubscription フックの実装
- ~~[x] 4.1 deviceUid 関数の追加~~ 削除済み（不要と判断）
  - ~~src/lib/deviceUid.ts に getDeviceUid() 関数を作成~~
  - ~~localStorage に保存されていなければ新規生成して保存~~
  - ~~atom/hook は不要（単純な関数で十分）~~

- ~~[x] 4.2 App.tsx での deviceUid 初期化~~ 削除済み（不要と判断）
  - ~~getDeviceUid() は使用側（usePushSubscription, eventEmitter）で呼び出し~~

- [x] 4.3 API クライアントの作成
  - pushSubscription.ts に createPushSubscription 関数を作成
  - AppSync mutation でサーバーに購読情報を保存
  - _Requirements: 2.1_

- [x] 4.4 usePushSubscription フックの本体実装
  - usePushSubscription.ts を作成
  - ブラウザの通知対応チェック（navigator.serviceWorker, PushManager）
  - Service Worker 登録処理
  - pushManager.subscribe() で VAPID 公開鍵を使用して購読
  - 購読状態を atomWithStorage 経由で永続化
  - useRealtimeSync 類似のライフサイクル（マウント時に初期化）
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 5.1_

- [x] 5. NotificationBanner UI コンポーネントの実装
- [x] 5.1 NotificationBanner コンポーネントの作成
  - Chakra UI Alert コンポーネントベースで実装
  - 「通知を受け取る」ボタンで購読処理を実行
  - 「後で」ボタンで一時的にバナーを非表示
  - 非対応ブラウザ・既に購読済み・拒否済みの場合は非表示
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 5.2 SharedPane への統合
  - SharedPane コンポーネントに NotificationBanner を追加
  - usePushSubscription フックと連携
  - _Requirements: 1.1, 5.1_

- [x] 6. eventCleaner Lambda の拡張
  - Environment 削除時に関連する PushSubscription も削除
  - byEnvironment インデックスで関連 PushSubscription をクエリ
  - BatchWrite で PushSubscription を削除
  - _Requirements: 2.2_

- ~~[x] 7. Event モデルへの senderUid 追加~~ 削除済み（不要と判断）
- ~~[x] 7.1 eventEmitter に senderUid パラメータを追加~~ 削除済み（不要と判断）
  - ~~src/api/event.ts の eventEmitter に senderUid パラメータを追加~~
  - ~~値は deviceUid を渡す~~

- ~~[x] 7.2 GamePane での deviceUid 連携~~ 削除済み（不要と判断）
  - ~~GamePane で getDeviceUid() を使用~~
  - ~~deviceUid を senderUid として eventEmitter に渡す~~
  - ~~既存の Event 発行処理の動作に影響を与えないことを確認~~

- [ ] 8. 統合テスト
- [ ] 8.1 ローカル環境での機能テスト
  - sandbox 環境でフル機能テスト
  - 共有画面での通知許可フロー確認
  - 別ブラウザ/デバイスでの GENERATE 通知受信確認
  - _Requirements: 1.1, 1.2, 3.1_

- [ ] 8.2 通知動作の検証
  - 通知クリック → 共有画面遷移確認
  - _Requirements: 4.1, 4.2_

- [ ] 8.3 エッジケースの検証
  - 非対応ブラウザでの graceful degradation 確認
  - 通知拒否時の動作確認
  - _Requirements: 1.3, 1.4_

- [ ] 8.4 develop 環境へのデプロイとテスト
  - develop 環境へデプロイ
  - 本番相当環境でのE2Eテスト
  - _Requirements: 全要件の統合検証_

---

## Task Dependencies

```
Prerequisites（手動作業）
    ↓
Task 1 (PushSubscription Model) ✅
    ↓
    ├── Task 6 (eventCleaner Extension) ✅ [並列実行可]
    │
    └── Task 2 (pushNotifier Lambda) ✅
            ↓
        Task 3 (Service Worker) ✅
            ↓
        Task 4 (usePushSubscription) ✅
            ↓
        Task 5 (NotificationBanner) ✅
            ↓
        Task 8 (Integration Test) ← 次のタスク
```

## Requirements Coverage

| Requirement | Tasks |
|-------------|-------|
| 1.1 | 4.4, 5.1, 5.2, 8.1 |
| 1.2 | 4.4, 8.1 |
| 1.3 | 5.1, 8.3 |
| 1.4 | 4.4, 4.5, 5.1, 8.3 |
| 1.5 | 4.4 |
| 2.1 | 1, 4.3 |
| 2.2 | 1, 6 |
| 2.3 | 2 |
| 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 | 2, 8.1 |
| 4.1, 4.2 | 3, 8.2 |
| 4.3, 4.4 | 2 |
| 5.1, 5.2, 5.3, 5.4 | 3, 4.4, 5.2 |
| 6.1, 6.2, 6.3 | 2 |

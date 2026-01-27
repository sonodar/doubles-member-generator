# Requirements Document

## Introduction

本ドキュメントは、バドミントンダブルス コート割り当てアプリにおけるプッシュ通知機能の要件を定義する。

現在のリアルタイム共有機能は、共有URLを受け取ったユーザーがブラウザでページを開いている間のみ更新を受信できる。本機能は、ブラウザがバックグラウンドにある場合やアプリを閉じている場合でも、重要なイベント（メンバー生成、途中参加・離脱など）をユーザーに通知することで、共有体験を向上させることを目的とする。

### 背景

- **現状**: AppSync observeQuery によるポーリングベースの同期。ブラウザがアクティブな場合のみ更新を受信
- **課題**: 共有リンクを受け取ったメンバーがブラウザを閉じていると、新しい組み合わせ生成などの重要な変更に気づけない
- **目標**: Web Push 通知により、ブラウザがバックグラウンドでも重要なイベントを通知

## Requirements

### Requirement 1: プッシュ通知の購読管理

**Objective:** As a 共有リンクを開いたユーザー, I want プッシュ通知を受け取るかどうかを選択できる, so that 必要な場合のみ通知を受け取れる

#### Acceptance Criteria

1. When ユーザーが共有画面を開く, the アプリケーション shall 通知許可のリクエストUIを表示する
2. When ユーザーが通知を許可する, the アプリケーション shall ブラウザのプッシュ通知購読を登録する
3. When ユーザーが通知を拒否する, the アプリケーション shall 購読を行わずに通常の共有画面を表示する
4. If ブラウザがプッシュ通知に対応していない, the アプリケーション shall 通知リクエストUIを表示せずに通常の共有画面を表示する
5. The アプリケーション shall 購読状態をローカルに永続化し、再訪問時に再度許可を求めない

### Requirement 2: プッシュ通知購読のバックエンド管理

**Objective:** As a システム管理者, I want 通知購読情報を安全に管理したい, so that 適切なユーザーにのみ通知を配信できる

#### Acceptance Criteria

1. When ユーザーがプッシュ通知を購読する, the バックエンド shall 購読情報（endpoint, keys）を Environment に紐づけて保存する
2. When Environment が削除される（TTL期限切れ）, the バックエンド shall 関連する購読情報も削除する
3. The バックエンド shall 購読情報を暗号化して保存する
4. When 購読が無効になる（ユーザーがブラウザで権限を取り消した場合）, the バックエンド shall 無効な購読を自動的に削除する

### Requirement 3: イベント発生時の通知配信

**Objective:** As a 共有リンクを受け取ったユーザー, I want 重要なイベントが発生したら通知を受け取りたい, so that ブラウザを開いていなくても変更に気づける

#### Acceptance Criteria

1. When GENERATE イベントが発生する, the バックエンド shall 購読している全ユーザーに「新しい組み合わせが生成されました」通知を送信する
2. When JOIN イベントが発生する, the バックエンド shall 購読している全ユーザーに「{メンバー名}さんが参加しました」通知を送信する
3. When LEAVE イベントが発生する, the バックエンド shall 購読している全ユーザーに「{メンバー名}さんが離脱しました」通知を送信する
4. When FINISH イベントが発生する, the バックエンド shall 購読している全ユーザーに「共有が終了しました」通知を送信する
5. The バックエンド shall INITIALIZE イベントでは通知を送信しない
6. The バックエンド shall RETRY イベントでは通知を送信しない（現状未使用のイベントタイプ）
7. If Event payload に `silent: true` フラグが含まれる場合, the バックエンド shall 通知を送信しない

### Requirement 4: 通知のユーザー体験

**Objective:** As a 通知を受け取るユーザー, I want 通知から直接共有画面に移動したい, so that 素早く最新状態を確認できる

#### Acceptance Criteria

1. When ユーザーがプッシュ通知をクリックする, the ブラウザ shall 該当の共有画面を開く
2. If 共有画面が既に開いている, the ブラウザ shall 既存のタブをフォーカスする
3. The 通知 shall イベントの種類に応じた適切なアイコンを表示する
4. The 通知 shall 日本語で内容を表示する

### Requirement 5: Service Worker の管理

**Objective:** As a 開発者, I want Service Worker を適切に管理したい, so that プッシュ通知を確実に受信できる

#### Acceptance Criteria

1. When ユーザーが Share 画面を開く, the アプリケーション shall Service Worker を登録する
2. When Service Worker が更新された場合, the アプリケーション shall 新しいバージョンをアクティベートする
3. The Service Worker shall プッシュ通知を受信してシステム通知を表示する
4. If Service Worker の登録に失敗した場合, the アプリケーション shall エラーをログに記録し、通知機能を無効化する

### Requirement 6: オフライン・低接続環境での動作

**Objective:** As a モバイルユーザー, I want 不安定な接続環境でも通知を受け取りたい, so that 移動中でも重要な更新に気づける

#### Acceptance Criteria

1. The バックエンド shall 通知送信が失敗した場合にリトライを行う
2. If 3回のリトライ後も送信に失敗する, the バックエンド shall 該当の購読を無効としてマークする
3. When ユーザーがオンラインに復帰する, the ブラウザ shall キューに入っているプッシュ通知を受信する


# Secrets Management

## Overview

本アプリケーションでは、Web Push 通知のための VAPID キーを AWS Parameter Store と環境変数で管理する。

## Parameter Store シークレット

### VAPID 秘密鍵

| パス | 環境 | タイプ | 用途 |
|------|------|--------|------|
| `/doubles-member-generator/main/vapid-private-key` | main | SecureString | 本番環境用 VAPID 秘密鍵 |
| `/doubles-member-generator/develop/vapid-private-key` | develop | SecureString | 開発環境用 VAPID 秘密鍵 |

#### 背景

VAPID (Voluntary Application Server Identification) は Web Push 通知の標準仕様で、アプリケーションサーバーを識別するための公開鍵暗号を使用する。

- **公開鍵**: フロントエンドで Push 購読時に使用。漏洩しても問題ない
- **秘密鍵**: Lambda で通知送信時に署名に使用。漏洩すると第三者が通知を偽装可能
- **管理者メール**: VAPID Subject（送信者の識別）に使用。`ADMIN_EMAIL` 環境変数から参照

秘密鍵は Parameter Store の SecureString として保存し、Lambda の IAM ポリシーで最小権限アクセスを設定する。

#### キーペア生成方法

```bash
npx web-push generate-vapid-keys
```

#### Parameter Store への登録

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

## 環境変数

### フロントエンド（Vite）

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| `VITE_VAPID_PUBLIC_KEY` | VAPID 公開鍵 | Amplify コンソール / `.envrc` |

#### ローカル開発用設定

`.envrc` (direnv) に追加:

```bash
export VITE_VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
```

### Lambda（pushNotifier）

| 変数名 | 説明 | 設定方法 |
|--------|------|----------|
| `SUBSCRIPTION_TABLE_NAME` | PushSubscription テーブル名 | backend.ts で自動設定 |
| `VAPID_PUBLIC_KEY` | VAPID 公開鍵 | `VITE_VAPID_PUBLIC_KEY` からマッピング |
| `VAPID_PRIVATE_KEY_PARAM` | Parameter Store パス | backend.ts で環境ごとに自動設定 |
| `ADMIN_EMAIL` | VAPID Subject に使用する管理者メール | Amplify コンソールで設定 |

## 環境ごとの構成

### main 環境（本番）

- VAPID キーペア: 本番専用キーを使用
- Parameter Store: `/doubles-member-generator/main/vapid-private-key`
- Amplify 環境変数: `VITE_VAPID_PUBLIC_KEY` に本番用公開鍵
- Amplify 環境変数: `ADMIN_EMAIL` に管理者メール

### develop 環境（開発）

- VAPID キーペア: 開発用キーを使用（本番と別のキーペア推奨）
- Parameter Store: `/doubles-member-generator/develop/vapid-private-key`
- Amplify 環境変数: `VITE_VAPID_PUBLIC_KEY` に開発用公開鍵
- Amplify 環境変数: `ADMIN_EMAIL` に管理者メール

### sandbox 環境（ローカル開発）

- develop 環境と同じキーペアを使用
- ローカルの `.envrc` で `VITE_VAPID_PUBLIC_KEY` を設定
- `AWS_BRANCH` が未設定の場合 `develop` のパスを使用
- `ADMIN_EMAIL` は `noreply@example.com` にフォールバック

## セキュリティ考慮事項

- **キーペアの分離**: main と develop で異なるキーペアを使用することで、開発環境のキー漏洩が本番に影響しない
- **IAM 最小権限**: pushNotifier Lambda は特定の Parameter Store パスのみアクセス可能
- **Git 除外**: `.envrc` は `.gitignore` に含めること

---
_Last updated: 2026-01-24_

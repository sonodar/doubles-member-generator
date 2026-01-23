# Implementation Plan

## Tasks

- [x] 1. Renovate 設定ファイルの作成
- [x] 1.1 (P) 基本設定と PR 制限の構成
  - プロジェクトルートに renovate.json を作成する
  - 公式スキーマ参照を設定する
  - config:recommended プリセットを継承する
  - npm パッケージマネージャーを有効化する
  - 同時 PR 数を 10 件に制限する
  - 1時間あたりの PR 数を 5 件に制限する
  - Dependency Dashboard を無効化する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2_

- [x] 1.2 (P) 自動マージルールの設定
  - パッチ・マイナーバージョン更新の自動マージを有効化する
  - PR 作成後のマージタイプを設定する
  - squash マージ戦略を指定する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.3 (P) メジャーバージョン更新のレビュー設定
  - メジャーバージョン更新の自動マージを無効化する
  - sonodar をレビュアーとして設定する
  - _Requirements: 4.1, 4.2_

- [x] 1.4 (P) パッケージグルーピングの設定
  - AWS Amplify 関連パッケージのグループを定義する
  - Testing 関連パッケージのグループを定義する
  - 型定義パッケージのグループを定義する
  - devDependencies マイナー更新のグループを定義する
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 1.5 (P) セキュリティアラート設定
  - 脆弱性アラートを有効化する
  - スケジュールに関係なく即座に対応するよう設定する
  - _Requirements: 6.1, 6.2_

- [x] 2. GitHub Actions ワークフローの作成
- [x] 2.1 Renovate 実行ワークフローの作成
  - .github/workflows/renovate.yml を作成する
  - 毎週月曜日の午前0時（UTC）にスケジュール実行を設定する
  - 手動実行（workflow_dispatch）をサポートする
  - renovatebot/github-action を使用する
  - RENOVATE_TOKEN シークレットで認証を設定する
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.2 Renovate PR 検証ワークフローの作成
  - .github/workflows/renovate-ci.yml を作成する
  - main ブランチへの PR で実行されるよう設定する
  - lint ジョブを定義する
  - typecheck ジョブを定義する
  - test ジョブを定義する
  - prepare-ci アクションを再利用する
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 3. 動作検証
- [x] 3.1 設定ファイルの検証
  - renovate.json の JSON 構文を検証する
  - renovate-config-validator で設定の妥当性を確認する
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.2 ワークフローの検証
  - workflow_dispatch で Renovate を手動実行する
  - PR が正しく作成されることを確認する
  - CI ワークフローが PR に対して実行されることを確認する
  - _Requirements: 7.3, 8.2, 8.3_

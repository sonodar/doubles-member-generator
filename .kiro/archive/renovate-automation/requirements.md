# Requirements Document

## Introduction

本仕様は、doubles-member-generator プロジェクトに Renovate を導入し、依存関係の自動更新を実現するものである。パッチ・マイナーバージョンの更新は CI 通過後に自動マージし、メジャーバージョンの更新は PR を作成してレビュー依頼を行う。これにより、セキュリティ脆弱性への迅速な対応と、依存関係の最新化を継続的に維持する。

## Requirements

### Requirement 1: Renovate 設定ファイルの作成

**Objective:** As a 開発者, I want プロジェクトに Renovate 設定ファイルを配置する, so that 依存関係の自動更新ルールを定義できる

#### Acceptance Criteria

1. The Renovate shall `renovate.json` ファイルをプロジェクトルートに配置する
2. The Renovate shall 公式スキーマ（`https://docs.renovatebot.com/renovate-schema.json`）を参照する
3. The Renovate shall `config:recommended` プリセットを継承する
4. The Renovate shall 対象パッケージマネージャーとして `npm` を有効化する

### Requirement 2: PR 作成数の制限

**Objective:** As a 開発者, I want Renovate が作成する PR 数を制限する, so that PR が大量に作成されることを防ぐ

#### Acceptance Criteria

1. The Renovate shall 同時に作成する PR 数を制限する（推奨: 10件以下）
2. The Renovate shall 1時間あたりの PR 作成数を制限する（推奨: 5件以下）

### Requirement 3: パッチ・マイナーバージョンの自動マージ

**Objective:** As a 開発者, I want パッチ・マイナーバージョンの更新を自動マージする, so that 手動レビューの負担を軽減しつつセキュリティを維持できる

#### Acceptance Criteria

1. When devDependencies のパッチバージョン更新 PR が作成され CI が通過した場合, the Renovate shall 自動マージを実行する
2. When devDependencies のマイナーバージョン更新 PR が作成され CI が通過した場合, the Renovate shall 自動マージを実行する
3. When dependencies のパッチバージョン更新 PR が作成され CI が通過した場合, the Renovate shall 自動マージを実行する
4. When dependencies のマイナーバージョン更新 PR が作成され CI が通過した場合, the Renovate shall 自動マージを実行する
5. The Renovate shall 自動マージ時に squash マージ戦略を使用する

### Requirement 4: メジャーバージョン更新のレビュー依頼

**Objective:** As a 開発者, I want メジャーバージョンの更新は手動レビューを必須とする, so that 破壊的変更を慎重に評価できる

#### Acceptance Criteria

1. When メジャーバージョンの更新が検出された場合, the Renovate shall 自動マージを無効化して PR を作成する
2. When メジャーバージョンの更新 PR が作成された場合, the Renovate shall `sonodar` をレビュアーとして割り当てる

### Requirement 5: パッケージグルーピング

**Objective:** As a 開発者, I want 関連パッケージをグループ化して更新する, so that PR 数を削減し一貫性を保てる

#### Acceptance Criteria

1. The Renovate shall AWS Amplify 関連パッケージ（`@aws-amplify/*`, `aws-amplify`）を1つの PR にグループ化する
2. The Renovate shall Testing 関連パッケージ（`@testing-library/*`, `vitest`, `@vitest/*`）を1つの PR にグループ化する
3. The Renovate shall 型定義パッケージ（`@types/*`）を1つの PR にグループ化する
4. The Renovate shall devDependencies のマイナーバージョン更新を1つの PR にグループ化する

### Requirement 6: セキュリティアラート対応

**Objective:** As a 開発者, I want セキュリティ脆弱性は即座に対応する, so that プロジェクトのセキュリティを維持できる

#### Acceptance Criteria

1. The Renovate shall セキュリティ脆弱性アラートを有効化する
2. When セキュリティ脆弱性が検出された場合, the Renovate shall スケジュールに関係なく即座に PR を作成する

### Requirement 7: GitHub Actions ワークフローの作成

**Objective:** As a 開発者, I want Renovate を GitHub Actions で実行する, so that 自動化された依存関係管理を実現できる

#### Acceptance Criteria

1. The GitHub Actions shall `.github/workflows/renovate.yml` ワークフローファイルを配置する
2. The GitHub Actions shall 毎週月曜日の午前0時（UTC、JST 9時）にスケジュール実行する
3. The GitHub Actions shall 手動実行（workflow_dispatch）をサポートする
4. The GitHub Actions shall `renovatebot/github-action` を使用して Renovate を実行する
5. The GitHub Actions shall `RENOVATE_TOKEN` シークレットを使用して認証する

### Requirement 8: Renovate PR 検証用ワークフローの作成

**Objective:** As a 開発者, I want Renovate PR 専用の CI ワークフローを作成する, so that 自動マージ前に品質を担保できる

#### Acceptance Criteria

1. The GitHub Actions shall `.github/workflows/renovate-ci.yml` ワークフローファイルを配置する
2. The GitHub Actions shall Renovate が作成した PR に対してのみ実行する
3. The GitHub Actions shall lint, typecheck, test ジョブを実行する
4. If CI ジョブが失敗した場合, the Renovate shall 自動マージを実行しない

# Requirements Document

## Introduction

本仕様は、Renovateによる依存関係更新の自動マージ設定を改善し、セキュリティと効率性を両立させる設定変更を定義する。patch/minor更新はサプライチェーン攻撃対策として7日間の猶予期間を設けた上でCI通過後に自動マージし、脆弱性対応は即時マージ、メジャーバージョンはレビュー必須とする。通知削減のため、dependencies（patch/minor）とdevDependencies（patch/minor）をそれぞれ1つのPRにグループ化し、週1回の実行とする。lockFileMaintenanceは無効化し、既存の個別パッケージグループ設定は削除する。また、設定ファイルをJSON5形式に移行し、コメントによる可読性向上を図る。

## Project Description (Input)

renovate で patch, minor, lockFileMaintenance は CI 通れば develop と main 両方に auto merge したい。
ただし、サプライチェーン攻撃を避けるため、猶予期間 7 日間を設ける。

メジャーバージョンは PR を作成して sonodar 宛にレビュー依頼。
PR 上限は 10 件、脆弱性対応は猶予期間を設けずに即マージ。

スケジュール管理は renovatebot/github-action を使う都合上、GitHub Actions でやることになる？
もし renovatebot 側に寄せられるなら renovate 内でスケジュール完結させたい。既存の renovate.yml をよく読んで。

また、コメントを記載できるように renovate.json は renovate.json5 にリネームすること。

## Requirements

### Requirement 1: 設定ファイルのJSON5移行

**Objective:** As a 開発者, I want Renovate設定ファイルにコメントを記載できるようにする, so that 設定の意図や理由を文書化し、将来のメンテナンス性を向上させられる

#### Acceptance Criteria
1. When Renovateが実行される, the Renovate shall `renovate.json5`ファイルを設定として認識する
2. The Renovate設定ファイル shall 各主要な設定項目に説明コメントを含む
3. When `renovate.json5`が存在する, the Renovate shall 正常に設定を読み込み動作する

### Requirement 2: patch/minor更新の自動マージ

**Objective:** As a 開発者, I want patch、minor更新がCI通過後に自動マージされる, so that 手動マージの手間を削減し、依存関係を最新に保てる

#### Acceptance Criteria
1. When patch更新のPRがCIを通過する, the Renovate shall 7日間の猶予期間後に自動マージを実行する
2. When minor更新のPRがCIを通過する, the Renovate shall 7日間の猶予期間後に自動マージを実行する
3. The 自動マージ shall squash戦略を使用する
4. The 猶予期間（7日間） shall サプライチェーン攻撃の検出猶予として機能する
5. The Renovate shall `internalChecksFilter: "strict"`を使用し、猶予期間経過までPR/ブランチを作成しない
6. When patch/minor更新のPRが作成される, the Renovate shall `renovate`および`automerge`ラベルを付与する
7. The Renovate shall dependenciesの更新（patch/minor）を1つのPRにグループ化する
8. The Renovate shall devDependenciesの更新（patch/minor）を1つのPRにグループ化する
9. The Renovate shall lockFileMaintenanceを無効にする

### Requirement 3: メジャーバージョン更新のレビュー必須化

**Objective:** As a 開発者, I want メジャーバージョン更新がレビューを経てからマージされる, so that 破壊的変更による予期せぬ問題を防げる

#### Acceptance Criteria
1. When major更新が検出される, the Renovate shall 自動マージを無効にしたPRを作成する
2. When major更新のPRが作成される, the Renovate shall sonodarをレビュアーとして割り当てる
3. The major更新PR shall 猶予期間なしで即座にPRを作成する
4. When major更新のPRが作成される, the Renovate shall `renovate`ラベルを付与する

### Requirement 4: 脆弱性対応の即時マージ

**Objective:** As a 開発者, I want セキュリティ脆弱性の修正が即座に適用される, so that セキュリティリスクを最小限に抑えられる

#### Acceptance Criteria
1. When 脆弱性修正の更新がある, the Renovate shall 猶予期間なしで即座に自動マージを実行する
2. When 脆弱性修正のPRがCIを通過する, the Renovate shall 7日間の猶予期間をスキップしてマージする
3. The 脆弱性アラート shall 常時有効（at any time）で動作する

### Requirement 5: PR制限の維持

**Objective:** As a 開発者, I want PRの同時作成数を制限する, so that PRの洪水を防ぎ、管理可能な状態を維持できる

#### Acceptance Criteria
1. The Renovate shall 同時にオープンできるPR数を10件に制限する
2. The Renovate shall 時間あたりのPR作成数を制限する（現行の5件/時を維持）

### Requirement 6: スケジュール設定

**Objective:** As a 開発者, I want Renovateが週1回実行される, so that 更新がまとめて処理され通知が削減される

#### Acceptance Criteria
1. The GitHub Actionsワークフロー shall 週1回Renovateを実行する（曜日・時間は任意）
2. The Renovate設定 shall `schedule`オプションを使用しない（時間制限なし）

### Requirement 7: マージ対象ブランチの設定

**Objective:** As a 開発者, I want developとmain両方のブランチに自動マージが適用される, so that 両ブランチの依存関係が最新に保たれる

#### Acceptance Criteria
1. The Renovate設定 shall developブランチとmainブランチの両方を対象とする
2. When 自動マージ条件を満たす, the Renovate shall 対象ブランチに対してマージを実行する
3. The baseBranches設定 shall ["develop", "main"]を含む

### Requirement 8: 既存のパッケージグループ設定の削除

**Objective:** As a 開発者, I want 既存の個別パッケージグループ設定を削除する, so that 設定がシンプルになり、Requirement 2の2グループ構成に統一できる

#### Acceptance Criteria
1. The Renovate設定 shall AWS Amplifyパッケージの個別グループ設定を削除する
2. The Renovate設定 shall テスト関連パッケージの個別グループ設定を削除する
3. The Renovate設定 shall 型定義パッケージの個別グループ設定を削除する
4. The Renovate設定 shall devDependenciesのminor更新個別グループ設定を削除する

### Requirement 9: Repository Rulesetへの移行

**Objective:** As a 開発者, I want Renovateが自動マージ時にapproval要件をバイパスできる, so that 手動承認なしで自動マージが完了する

#### Acceptance Criteria
1. The Repository shall Branch Protection RuleからRepository Rulesetに移行する
2. The Ruleset shall 既存のBranch Protection Ruleと同等のルール（PR必須、approval必須）を設定する
3. The Ruleset shall Bypass listに「Repository admins」を追加する（RENOVATE_TOKENがadminのPATのため）
4. The 既存のBranch Protection Rule shall 削除する

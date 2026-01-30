# Implementation Plan

## Tasks

- [ ] 1. Repository Rulesetの設定（前提条件）
- [ ] 1.1 Repository Rulesetを新規作成する
  - GitHub Settings → Rules → Rulesets で新規Rulesetを作成
  - 対象ブランチとして main と develop を設定
  - Require pull request ルールを有効化
  - Require approvals ルールを有効化（既存のBranch Protection Ruleと同等）
  - Bypass list に「Repository admins」を追加
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 1.2 既存のBranch Protection Ruleを削除する
  - GitHub Settings → Branches → Branch protection rules から既存ルールを削除
  - main ブランチの保護ルールを削除
  - develop ブランチの保護ルールを削除
  - Rulesetが正しく機能することを確認してから削除
  - _Requirements: 9.4_

- [x] 2. Renovate設定ファイルのJSON5移行と更新
- [x] 2.1 (P) renovate.json を renovate.json5 にリネームする
  - 既存の renovate.json を renovate.json5 にリネーム
  - JSON5形式として有効な状態を維持
  - _Requirements: 1.1, 1.3_

- [x] 2.2 基本設定にコメントを追加する
  - $schema、extends、enabledManagers の設定意図をコメントで説明
  - prHourlyLimit、prConcurrentLimit の制限理由をコメントで説明
  - baseBranchPatterns に develop と main を設定し、コメントで説明
  - _Requirements: 1.2, 5.1, 5.2, 7.1, 7.2, 7.3_

- [x] 2.3 猶予期間とPR作成抑制の設定を追加する
  - minimumReleaseAge を 7 days に設定
  - internalChecksFilter を strict に設定
  - サプライチェーン攻撃対策としての意図をコメントで説明
  - _Requirements: 2.4, 2.5_

- [x] 2.4 lockFileMaintenanceを無効化する
  - lockFileMaintenance.enabled を false に設定
  - 無効化の理由（間接依存のminor更新が猶予期間をバイパスするリスク回避）をコメントで説明
  - _Requirements: 2.9_

- [x] 2.5 dependenciesグループのpackageRuleを作成する
  - matchDepTypes で dependencies を指定
  - matchUpdateTypes で patch と minor を指定
  - groupName を dependencies に設定
  - automerge を有効化、squash戦略を指定
  - labels に renovate と automerge を設定
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

- [x] 2.6 devDependenciesグループのpackageRuleを作成する
  - matchDepTypes で devDependencies を指定
  - matchUpdateTypes で patch と minor を指定
  - groupName を devDependencies に設定
  - automerge を有効化、squash戦略を指定
  - labels に renovate と automerge を設定
  - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.8_

- [x] 2.7 メジャー更新のpackageRuleを作成する
  - matchUpdateTypes で major を指定
  - automerge を無効化
  - reviewers に sonodar を設定
  - labels に renovate を設定
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.8 既存の個別パッケージグループ設定を削除する
  - AWS Amplify パッケージのグループ設定を削除
  - testing パッケージのグループ設定を削除
  - types パッケージのグループ設定を削除
  - devDependencies-minor グループ設定を削除
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2.9 脆弱性対応の設定を更新する
  - vulnerabilityAlerts.enabled を true に維持
  - schedule を at any time に設定
  - automerge を有効化、squash戦略を指定
  - labels に renovate と security を設定
  - 猶予期間をバイパスする動作をコメントで説明
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. GitHub Actionsワークフローの更新
- [x] 3.1 (P) renovate.ymlのパス監視を更新する
  - pull_request トリガーの paths を renovate.json から renovate.json5 に変更
  - 週次実行スケジュール（cron: "0 0 * * 1"）は変更不要
  - _Requirements: 6.1, 6.2_

- [ ] 4. 設定検証
- [x] 4.1 PRを作成して設定バリデーションを実行する
  - 変更をコミットしてPRを作成
  - GitHub Actionsのvalidateジョブが成功することを確認
  - renovate-config-validator --strict でエラーがないことを確認
  - _Requirements: 1.1, 1.3_

- [ ]* 4.2 動作確認（手動検証）
  - PRマージ後、次回Renovate実行で設定が正しく読み込まれることを確認
  - patch/minor更新のPRにrenovate、automergeラベルが付与されることを確認
  - major更新のPRにsonodarがレビュアーとして割り当てられることを確認
  - 猶予期間中の更新がPR作成されないことを確認（次回実行時に確認）
  - _Requirements: 2.1, 2.2, 2.6, 3.1, 3.2_

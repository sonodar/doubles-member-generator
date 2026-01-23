# Implementation Plan

## Tasks

- [x] 1. パッケージ更新状況の確認と最新化
- [x] 1.1 更新対象パッケージの特定
  - `npm outdated` を実行して更新可能なパッケージを一覧化する
  - メジャーバージョン更新がある場合は CHANGELOG を確認し、破壊的変更を把握する
  - @types/* パッケージとランタイムパッケージの互換性を確認する
  - _Requirements: 1.1, 1.2, 3.3_

- [x] 1.2 パッケージの最新バージョンへの更新
  - dependencies および devDependencies のすべてのパッケージを最新安定版に更新する
  - メジャーバージョン更新による破壊的変更がある場合は、必要なコード修正を特定する
  - 更新後に `npm outdated` で更新漏れがないことを確認する
  - _Requirements: 1.1, 1.2_

- [x] 2. バージョン指定形式の統一
- [x] 2.1 dependencies の caret 形式への変換
  - 絶対バージョン指定（例: `18.2.0`）を caret 形式（例: `^18.2.0`）に変換する
  - 不完全な指定（例: `^3`）を完全なバージョン番号（例: `^3.x.x`）に修正する
  - 対象: `@emotion/react`, `@formkit/tempo`, `jotai`, `ms`, `react`, `react-dom`, `react-icons`, `ts-pattern`, `@chakra-ui/react`
  - _Requirements: 2.1, 2.4_

- [x] 2.2 (P) devDependencies の caret 形式への変換
  - 絶対バージョン指定を caret 形式に変換する
  - 対象: `@biomejs/biome`, `@types/ms`, `@types/react`, `@types/react-dom`, `npm-run-all`
  - 例外が必要なパッケージがあれば理由をコメントで明記する
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 3. lock ファイルの再生成と検証
- [x] 3.1 package-lock.json の再生成
  - `npm install` を実行して lock ファイルを最新の依存関係で再生成する
  - 不要な依存関係が残っていないことを確認する
  - _Requirements: 5.1, 5.3_

- [x] 3.2 クリーンインストールの検証
  - `npm ci` でクリーンインストールが成功することを確認する
  - エラーなくインストールが完了することを検証する
  - _Requirements: 5.2_

- [x] 4. 中間コミットの作成
- [x] 4.1 パッケージ更新の中間コミット
  - ここまでの変更（package.json、package-lock.json）をコミットする
  - これにより、後続の品質チェックで意図しない変更が発生しても git reset で戻せる
  - _Requirements: なし（安全策）_

- [x] 5. ビルドと品質チェックの実行
- [x] 5.1 型チェックの実行
  - `npm run typecheck` を実行して型エラーがないことを確認する
  - 型エラーがある場合は影響を受けるコードを修正する
  - _Requirements: 3.1, 3.2_

- [x] 5.2 (P) テストの実行
  - `npm run test` を実行してすべてのテストが成功することを確認する
  - 失敗するテストがある場合は原因を特定して修正する
  - _Requirements: 1.4_

- [x] 5.3 (P) リントの実行
  - `npm run lint` を実行してエラーがないことを確認する
  - エラーがある場合は `biome lint --write .` で修正する（`lint:fix` は format も適用されるため使用しない）
  - _Requirements: 1.5_

- [x] 5.4 ビルドの実行
  - `npm run build` を実行して本番ビルドが正常に完了することを確認する
  - dist ディレクトリが生成されることを検証する
  - _Requirements: 1.3, 4.3_

- [x] 5.5 useReducerAtom の代替実装
  - `[DEPRECATED] useReducerAtom is deprecated and will be removed in the future. Please create your own version using the recipe. https://github.com/pmndrs/jotai/pull/2467` という警告の修正
  - useReducerAtom 関数を src/components/state/atoms.ts に実装する
  - useReducerAtom の呼び出し元を変更する (src/components/shared/SharedPane.tsx のみ)

- [x] 6. @dnd-kit/core を @dnd-kit/react に移行
- [x] 6.1 依存関係の更新
  - `@dnd-kit/core` をアンインストール
  - `@dnd-kit/react` をインストール
  - _Requirements: 1.1, 1.2_

- [x] 6.2 DragDropProvider への移行
  - `AdjustmentPane.tsx` で `DndContext` を `DragDropProvider` に置き換え
  - `onDragEnd` イベントハンドラーを新しい API に合わせて修正
    - 旧: `(e: DragEndEvent) => { e.active.data.current, e.over?.data.current }`
    - 新: `({ source, target }) => { source.data, target?.data }`
  - _Requirements: 4.2_

- [x] 6.3 useDraggable の移行
  - `MemberBox.tsx` の `useDraggable` を新しい API に更新
  - 旧 API: `{ isDragging, attributes, listeners, setNodeRef, transform }` を返す
  - 新 API: `{ ref, isDragging }` を返す（`attributes`/`listeners` は不要、`ref` のみ使用）
  - transform は CSS カスタムプロパティで自動適用されるため手動計算不要
  - _Requirements: 4.2_

- [x] 6.4 useDroppable の移行
  - `MemberDroppable.tsx` の `useDroppable` を新しい API に更新
  - 旧 API: `{ isOver, setNodeRef }` を返す
  - 新 API: `{ ref, isDropTarget }` を返す（`isOver` → `isDropTarget` に名称変更）
  - _Requirements: 4.2_

- [x] 6.5 テストの更新
  - `MemberBox.test.tsx` のモック・インポートを `@dnd-kit/react` に変更
  - `MemberDroppable.test.tsx` のモック・インポートを `@dnd-kit/react` に変更
  - `AdjustmentPane.test.tsx` のインポートを更新（`DndContext` → `DragDropProvider`）
  - `CourtMembersBox.test.tsx`、`RestMembersPane.test.tsx` のインポートを確認・更新
  - _Requirements: 1.4_

- [x] 6.6 品質チェックの実行
  - `npm run typecheck` で型エラーがないことを確認
  - `npm run test` ですべてのテストが成功することを確認
  - `npm run lint` でエラーがないことを確認
  - `npm run build` でビルドが成功することを確認
  - _Requirements: 1.3, 1.4, 1.5, 3.1_

- [x] 7. 動作確認
- [x] 7.1 開発サーバーでの動作確認
  - `npm run dev` で開発サーバーを起動する
  - メンバー生成機能が正常に動作することを確認する
  - ドラッグ&ドロップによるメンバー調整が機能することを確認する
  - 履歴管理が正常に動作することを確認する
  - _Requirements: 4.1, 4.2_

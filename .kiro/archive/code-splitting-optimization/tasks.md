# Implementation Plan

## Tasks

- [x] 1. App.tsxにReact.lazyとSuspenseを適用してルートベースのコード分割を実現する
  - MainコンポーネントとShareコンポーネントの静的インポートをReact.lazyによる動的インポートに変更する
  - Suspenseコンポーネントでルーティング部分をラップし、フォールバックUIを提供する
  - 既存のProvider構造（ChakraProvider、Jotai Provider）は変更しない
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. 既存機能の動作確認を行う
- [x] 2.1 開発サーバーでHMRが正常に動作することを確認する
  - `npm run dev`を実行し、コード変更時にHMRが機能することを確認する
  - _Requirements: 2.1_

- [x] 2.2 既存テストが変更なしで通過することを確認する
  - `npm run test`を実行し、すべてのテストがパスすることを確認する
  - _Requirements: 2.2_

- [x] 2.3 ビルド後にチャンク分割が行われていることを確認する
  - `npm run build`を実行し、`dist/assets/`ディレクトリに複数のJSチャンクが生成されることを確認する
  - パスエイリアス（@logic, @components等）が正常に解決されていることを確認する
  - _Requirements: 1.3, 2.3_

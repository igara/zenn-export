---
title: "(仮) NextJS モノレポ運用"
emoji: "💬"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nextjs", "serverless", "monorepo"]
published: true
---
これは [ランサーズ Advent Calendar 2021](https://qiita.com/advent-calendar/2021/lancers) 4 日目の記事です。

個人の開発では1レポジトリで完結するようなプロジェクトをよく作成します。  

ただし実際の事業はスケールしたり、プロジェクトの中でも他のプロジェクトにも共有したいリソースというのは出るものなので初期段階でもしっかりとした基盤を事前に用意したいと思ったので作成しました。  

## プロジェクト構成

- ルートプロジェクト: [syonet_eight](https://github.com/igara/syonet_eight)
  - サブプロジェクト([projects](https://github.com/igara/syonet_eight/tree/master/projects))
    - [syonet_eight_www](https://github.com/igara/syonet_eight_www)
    - [syonet_eight_design_system](https://github.com/igara/syonet_eight_design_system)
    - [syonet_eight_storybook](https://github.com/igara/syonet_eight/tree/master/projects/syonet_eight_storybook)

上記のようなルートプロジェクトにサブプロジェクトを `git submodule` で分割して管理しているような構成にしてます。
基本はGitなので対象のサブプロジェクト同士で異なるブランチでの検証も可能だったりします。
一部 `git submodule`管理されていないサブプロジェクトもありますが。

次にそれぞれのプロジェクトの説明に入ります。

### ルートプロジェクト: [syonet_eight](https://github.com/igara/syonet_eight)

サブプロジェクトよりも上の階層にある大元のプロジェクトになります。

#### yarn workspace

NodeJSのライブラリをルートプロジェクトに集中管理し、 `yarn workspace` によるモノレポな環境にしています。
ルートプロジェクトにライブラリ管理を集中化させてしまってますが、サブプロジェクト側のpackage.jsonにバージョンの異なるライブラリを管理させたり、部分的に使用したいライブラリの管理ができるようになっているんじゃないかなと思います。  

`npm scripts` などもルートプロジェクトで管理するようにしてますので基本、CLIのカレントはルートプロジェクトのままで作業することになります。

#### VSCodeの設定の共有化

[.vscode](https://github.com/igara/syonet_eight/tree/master/.vscode)をルートプロジェクトに置くことでサブプロジェクトでも自動にVSCodeの設定が適応されます。

以下設置しているファイルを箇条書きで説明します。

- [extensions.json](https://github.com/igara/syonet_eight/blob/master/.vscode/extensions.json)
  使用するVSCode拡張の共有
  VSCodeを開いたときに推奨の拡張とかサジェストの表記がされるようになると思います。
- [launch.json](https://github.com/igara/syonet_eight/blob/master/.vscode/launch.json)
  デバッグの設定を記載
  プロジェクトごとのリモートデバッグによるポートの専有とか防げるんじゃないでしょうか。
- [settings.json](https://github.com/igara/syonet_eight/blob/master/.vscode/settings.json)
  エディターの設定
  ESLintの有効化や保存時のフォーマッタ設定
  その他モラル的な基本設定とか入れればいいんじゃないでしょうか。
- [xxxxx.code-snippets](https://github.com/igara/syonet_eight/blob/master/.vscode/sytled-jsx.code-snippets)
  プロジェクトまたがってコピペ的に使いたいの記載すればいいんじゃないでしょうか。

#### プロジェクトをまたがった[Storybook](https://storybook.js.org/)の展開

設定について[こちら](https://github.com/igara/syonet_eight/tree/master/.storybook)になります。

`yarn storybook` によりコンポーネントのカタログのようなものを閲覧できます。

サブプロジェクトにある `xxx.stories.mdx` を元に作成されます。

![storybook_props](/images/monorepo_nextjs/storybook_props.jpg)

軽くコンポーネントのPropsの検証ができたり

![storybook_accessibility](/images/monorepo_nextjs/storybook_accessibility.jpg)

使用しているタグなど実装に関してのアクセシビリティが適切そうかチェックしたり

![storybook_performance](/images/monorepo_nextjs/storybook_performance.jpg)

レンダリングのパフォーマンス確認などできるようにしています

#### CIのスケジュールによる全プロジェクトのUT実行

設定について[こちら](https://github.com/igara/syonet_eight/blob/master/.github/workflows/root.yml)

それぞれのサブプロジェクトの最新のmasterブランチを持ってきてlint, jestによるテスト実行をするようにしてます。

サブプロジェクト側でも個別にGitHub Actionsによるワークフローを記載しているのでそれぞれのレポジトリのプッシュでもテスト実行するようにしています。

### サブプロジェクト: [syonet_eight_www](https://github.com/igara/syonet_eight_www)

NextJSによるプロジェクトになります。

#### [Serverless Next.js Component](https://www.serverless.com/plugins/serverless-nextjs-plugin)によるデプロイ

NextJSの本家[Vercel](https://vercel.com) でもいいんですけどAWSにデプロイ可能な[Serverless Framework](https://www.serverless.com/)を採用しています。

デプロイの仕組みの説明難しいですが [serverless.yml](https://github.com/igara/syonet_eight_www/blob/master/serverless.yml) の情報がAWSのCloudFormationのテンプレートとして展開されてAWSのそれぞれのサービスをよしなに使って1つのWebサービスを作ってしまうというものです。

下記の図はデプロイで反映するAWSのサービスのイメージになります。

![serverless_nextjs](/images/monorepo_nextjs/serverless_nextjs.drawio.png)

それぞれのAWSのサービスが外部のユーザから見てどう使われているのかのイメージを記載すると

![serverless_service](/images/monorepo_nextjs/serverless_service.drawio.png)

なのをServerless Next.js Componentで再現できちゃうらしいです。  
SPA想定だったReactの資産をフル活用できますね。


### サブプロジェクト: [syonet_eight_design_system](https://github.com/igara/syonet_eight_design_system)


共通のデザインなどをまとめるプロジェクトです。

#### 共通コンポーネントをライブラリ化

`yarn build:design_system` を実行することでライブラリ化します。  

ルートプロジェクトの[package.json](https://github.com/igara/syonet_eight/blob/master/package.json)にある

```
"syonet_eight_design_system": "file:./projects/syonet_eight_design_system"
```

という指定により別のサブプロジェクトでも

```
import * as DesignSystem from 'syonet_eight_design_system';
```

で共通のコンポーネントを使用することが可能です。

#### Figmaで作成したパーツのインポート

`yarn import:figma` でFigmaで作成したものをインポートするような仕組みを作ってます。

実装したコードはこちらです

https://github.com/igara/syonet_eight_design_system/blob/master/src/scripts/figma.ts

SVG化して使うのは結構安易そうですが、DOMとして扱うのは難しめにみてます。  
(だってあいつらNodeIDの順番とか位置関係ようわからんし)  

#### ビルドの設定NextJSのをそのままつかってる

[tsconfig.json](https://github.com/igara/syonet_eight_design_system/blob/master/tsconfig.json)とか[.babelrc](https://github.com/igara/syonet_eight_design_system/blob/master/.babelrc)の設定はNextJSで動かしていたものを使用してます。

:::message
その弊害で[pages](https://github.com/igara/syonet_eight_design_system/tree/master/pages)ディレクトリがないとビルドに失敗してしまうので追加してます。
ものすごくこのディレクトリ消したいんですよね
:::

### [syonet_eight_www](https://github.com/igara/syonet_eight_www) & [syonet_eight_design_system](https://github.com/igara/syonet_eight_design_system) 共通の取り組み

#### ビジュアルリグレッションテスト実施

[reg-suit](https://reg-viz.github.io/reg-suit/)というGitのプッシュを実行した際にコンポーネントの差分をビジュアライズする仕組みを入れてます。

例えばこんな差分があったときに

https://github.com/igara/syonet_eight_design_system/commit/bf6de6cbd274e239e73f4eb39391bd9b060cb74b

差分としての検知として

![reg_suit_top](/images/monorepo_nextjs/reg_suit_top.jpg)

一覧が表示されて詳細をみようとすると

![reg_suit_diff](/images/monorepo_nextjs/reg_suit_diff.gif)

どのへんに差分があるのかというのをビジュアライズしてくれます。

CIの設定としてこちらになります。

https://github.com/igara/syonet_eight_design_system/blob/master/.github/workflows/vrt.yml

GitHub Actions上では日本語フォントがないので `fonts-noto` をインストールする必要があったりします。

あとはこちらのテストの結果は現状Slackで通知がくることを確認しています。

![slack](/images/monorepo_nextjs/slack.png)

:::message
GitHubのPRに対してテスト結果をコメントしてくれる機能もありますがこれに関しては正常に動作してません...
:::

#### CSS in JSとしてemotion採用

好みですが、

```
import { css } from '@emotion/react';
```

で[CSS Modules](https://github.com/css-modules/css-modules)ぽくもpropsでCSSの値指定できるようないいとこ取りな書き方よくないっすか？

https://github.com/igara/syonet_eight_design_system/blob/master/src/components/icons/menu_icon/menu_icon.styles.ts
https://github.com/igara/syonet_eight_design_system/blob/master/src/components/icons/menu_icon/menu_icon.tsx


### サブプロジェクト: [syonet_eight_storybook](https://github.com/igara/syonet_eight/tree/master/projects/syonet_eight_storybook)

Storybookを配布するように[serverless.yml](https://github.com/igara/syonet_eight/blob/master/projects/syonet_eight_storybook/serverless.yml)しか置いてないです。

これもServerless Frameworkのコンポーネントをつかっており、[website](https://github.com/serverless-components/website)というものを使っています。

ただのSPAのサイトをホスティングしたい用途で使うのがちょうど良さそうです。

## おわりに

以上自分なりのモノレポ運用についての記載でした。

まだ実装そのものを着手してなく、APIのプロジェクトも作成していない状況なのでこれからすすめていきたいと思います。

アドベントカレンダー、明日は [@yuta-ron](https://qiita.com/yuta-ron) さんです。
よろしくおねがいします。

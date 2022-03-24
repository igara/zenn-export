---
title: "モノリス分離したいのでモノレポ化にする考察"
emoji: "💬"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["monolith", "monorepo"]
published: true
---
最近の仕事で思うのがソースが一箇所に集中しつつありながらもちょっとマイクロサービス意識して別アプリケーションのディレクトリ切ってみて結果的にソースや設計思想も散らばってて辛いというのがあるのでどう分割すると良さそうなのかというのを考えてみた

## 事前知識

zennでモノレポの記事漁っててHimenonさんの記事がまとまってて結構すき

https://zenn.dev/himenon/articles/3d0e3480391c31  
(記事移動先: https://himenon.github.io/docs/javascript/comparison-of-package-layout)

### モノリス

Himenonさんの記事にない個人的なGood / Bad述べると（似たような意見になるかもしれない）

- Good
  - git cloneが1つのレポジトリで完結する
    - GitHubでのやりとりもこのレポジトリで完結する
    - GitHubの管理者が限定されている場合とかは容易
  - 責任から外れたコードも流し見できる
    - いっぱい勉強できるぞという点でGood
    - Webフロントエンド・サーバサイドのソースも一緒になっているときはアプリケーション全体が把握できるかもしれない
    - 一見作業の影響外と思ったものを検知できるとか
      - Badに表裏一体にある問題ではあるが共通の処理が変更するのでという合意があるのなら問題にすらならない事柄かも
  - コードが別管理で散らばることがない
    - 1つしかないのでそれはそう

- Bad
  - CI系のタスクの設置が複雑になる
    - 必要なとこの作業だけでもユニットテストに時間かかる問題
  - 完全に責任外のコードが見える
    - grap作業のノイズになりがち
  - git cloneにかける時間が増大する
    - 必要なとこの作業だけでも環境構築に時間がかかるとか
    - git pack objects 肥大化問題

### モノレポ

同様に個人的なGood / Bad述べると

- Good
  - CI系のタスクの設置が最小限になる
  - 作業に必要な環境構築が最小になる
    - つまみ食い感覚で必要なソースをgit cloneするのは結構すき
  - モノレポの1部は全く別のプロジェクトのライブラリとして使用することも可能な場合もある

- Bad
  - デプロイが複雑になる
    - モノレポ間での更新順番を作る必要がでてくる
      - 作業者間の更新タイミングが難しい
  - 作業が変わったときなど都度、構築する必要が出てくる
    - GitHubの管理者が限定されている場合とかは面倒
      - モノリス分離することをためらわれる要因では？
  - 共通化を意識しないとコードが散らばりがち
  - 環境変数の整備が大変
    - 極力1つのdotenvにまとめつつ、変数の適応を限定的に行うとか考え始めると面倒

## モノリス分離できそうなこと

### Model View ControllerのうちのModel

アプリーケーション複数になった場合、Modelだけは様々な箇所で使いたがるものであると思っていたり、ライブラリの更新の際もModel、View側どちらかが起因で更新難しいかの切り分けをしやすそうと思っている

IDEの恩恵を得られにくいView側のヘルパー関数が非推奨になり更新したくてもできないという経験もあったりした

Viewの観点でいうとViewの役割果たさなくてもよいというのもあるのでModelとControllerのみ扱うようにし、できるだけアプリケーションという単位で抑えて分離させないというのもアリ

別アプリケーション切って同じようなModelを作成するというのがやりたくないことだったりする

モノレポ構成を意識した下記のプロジェクトを作成した

- [cakephp_debug_sample](https://github.com/igara/cakephp_debug_sample)
  - [cakephp_debug_sample_projects_core](https://github.com/igara/cakephp_debug_sample_projects_core)
  - [cakephp_debug_sample_projects_www](https://github.com/igara/cakephp_debug_sample_projects_www)

coreではModelやビジネスロジック等扱い、wwwではroutes, Controllerのみを使用するような想定で作成している  

composerの仕組み上の話になるが

[core側](https://github.com/igara/cakephp_debug_sample_projects_core/blob/d8beb44/composer.json)で

```json:core/composer.json
{
    "name": "projects/core",
    "type": "library",
    ...
}
```

[読み込み側](https://github.com/igara/cakephp_debug_sample_projects_www/blob/4287f51/composer.json)で

```json:www/composer.json
{
    ...
    "repositories": [
        {
            "type": "path",
            "url": "../cakephp_debug_sample_projects_core",
            "options": {
                "symlink": false
            }
        }
    ],
    "require": {
        ...
        "projects/core": "dev-main"
    },
    ...
}
```

とライブラリの設定をし

[www/src/Controller/PagesController.php](https://github.com/igara/cakephp_debug_sample_projects_www/blob/4287f51/src/Controller/PagesController.php)

のような感覚でwww側のリソースでもcore側によるModelの処理を読み込んでいる

:::message
一例として記載したもののこの際、www経由にcoreを読み込まれているがCakePHPのライブラリはwww側のものを使用されているので注意

npmを見習いたい

ライブラリ化として分離しやすいものを選択する必要性も一定あると思っている

これに対する解決策受け付け中
（CakePHP自身のnamespaceを変えるとかあるにはあるが...）

言語側でバージョンが変わっても同様に使えるかどうかの考慮も一定必要
:::

### デザインガイドライン・デザインシステム

[過去記事](https://zenn.dev/igara/articles/monorepo_nextjs#%E3%82%B5%E3%83%96%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%3A-syonet_eight_design_system)でも触れてるやつ

ちょっとしたUI調整のときのみに動かしたいCIタスクが多くあるのでモノリスだとあまりやりたがらない部分だったりする

### 共通設定

#### IDE・エディター

[過去記事](https://zenn.dev/igara/articles/monorepo_nextjs#vscode%E3%81%AE%E8%A8%AD%E5%AE%9A%E3%81%AE%E5%85%B1%E6%9C%89%E5%8C%96)でも触れてるやつ

宗教的なものだが一定のコーディングの統一化をすべてのプロジェクトに対して適応が可能なのでコンテキストを合わせやすくなりそう

#### ビルド・テスト

[https://zenn.dev/igara/articles/monorepo_nextjs#%E3%83%93%E3%83%AB%E3%83%89%E3%81%AE%E8%A8%AD%E5%AE%9Anextjs%E3%81%AE%E3%82%92%E3%81%9D%E3%81%AE%E3%81%BE%E3%81%BE%E3%81%A4%E3%81%8B%E3%81%A3%E3%81%A6%E3%82%8B](過去記事)でちょっとだけ触れてる

パス指定による共通のビルド・テスト設定の読み込みが可能だとモノレポ間でも設定に困るということは少なくなる

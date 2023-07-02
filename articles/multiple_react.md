---
title: "複数のReactのプロジェクトとバージョンを扱う技術"
emoji: "🌎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["react", "typescript"]
published: true
---

サンプルのプロジェクトもあるので比較しながら説明できればと思います

ソース

https://github.com/igara/multiple_react_version_sample

動作確認ページ

https://igara.github.io/multiple_react_version_sample/

どうしてこんなことしようとしたかというとReactのバージョンアップや次期バージョンの検証も同時にやらなきゃと思い始めたのと

https://engineer.blog.lancers.jp/%e3%83%95%e3%83%ad%e3%83%b3%e3%83%88%e3%82%a8%e3%83%b3%e3%83%89/%e3%83%9e%e3%82%a4%e3%82%af%e3%83%ad%e3%83%95%e3%83%ad%e3%83%b3%e3%83%88%e3%82%a8%e3%83%b3%e3%83%89%e3%81%a8%e5%90%91%e3%81%8d%e3%81%82%e3%81%a3%e3%81%a6%e3%81%bf%e3%82%8b-%e3%83%95%e3%83%ad%e3%83%b3/

いいかげんwebpackでもないものでも対応できるようなの考えておかないとと思ってみて手を進めてみたらいろいろ検討しがいあるものかけそうと思ったライブ感ですね

## おおまかな構成

ページの読み込みの起点としては下記のようなライブラリ、ビルドファイル、DOM構成としています

https://github.com/igara/multiple_react_version_sample/blob/main/docs/index.html

```index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="react16-root"></div>
    <div id="react18-root"></div>
    <script src="./npm/react/16.14.0/umd.js"></script>
    <script src="./npm/react/18.2.0/umd.js"></script>
    <script src="./npm/react-dom/16.14.0/umd.js"></script>
    <script src="./npm/react-dom/18.2.0/umd.js"></script>
    <script src="./react16/umd.js"></script>
    <script src="./react18/umd.js"></script>
  </body>
</html>
```

図にするとこんな構成です

![project](/images/multiple_react/project.drawio.png)

ここで `packages/npm_manager` 、`packages/react[16, 18]` という独自プロジェクト概念が出てきたのでそれぞれ説明していきたいと思います

### packages/npm_manager

複数のライブラリのバージョンやumdのファイル抽出した際にglobalの変数重複をさけるために作成したプロジェクトです
独自のCDNにnpmでバージョン管理しながら抽出させたいときとかも使えそうですよね

#### ライブラリの複数バージョンを取り扱う

https://github.com/igara/multiple_react_version_sample/blob/main/packages/npm_manager/package.json みたいに

```
  "dependencies": {
    "react_16_14_0": "npm:react@16.14.0",
    "react_18_2_0": "npm:react@18.2.0",
    "react-dom_16_14_0": "npm:react-dom@16.14.0",
    "react-dom_18_2_0": "npm:react-dom@18.2.0",
    "types_react_16_14_43": "npm:@types/react@16.14.43",
    "types_react_18_0_37": "npm:@types/react@18.0.37",
    "types_react-dom_16_9_19": "npm:@types/react-dom@16.9.19",
    "types_react-dom_18_0_11": "npm:@types/react-dom@18.0.11"
  },
```

同じライブラリでもimportする際のライブラリ名の変更と読み込みが分けて行うことが可能になります
ライブラリ名変更した際に型の読み込みがうまくいかないときとかは

https://github.com/igara/multiple_react_version_sample/blob/main/packages/react16/src/vite-env.d.ts みたいに
使用したいライブラリの型定義を後から付与することも可能です

#### umd展開するライブラリ変数名の変更

umdのJSを[unpkg](https://unpkg.com/react@18.2.0/umd/react.production.min.js)のを使用すればいいんじゃと思うかもしれませんが展開される変数がどのバージョンのReactでも `window.React`として展開されるので異なるReactバージョンと同時に使用することができないため、独自のビルドで `window.React` から `window.React_X_X_X` とバージョン名を含めた変数名にしました

https://github.com/igara/multiple_react_version_sample/blob/main/packages/npm_manager/src/npm/react/16.14.0/index.ts

```
import React from "react_16_14_0/umd/react.production.min.js";
window.React_16_14_0 = React;
```

ビルドファイルの設定はこんな感じです

https://github.com/igara/multiple_react_version_sample/blob/main/packages/npm_manager/src/npm/react/16.14.0/vite.config.ts

```
import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    outDir: "dist/npm/react/16.14.0",
    lib: {
      entry: 'src/npm/react/16.14.0/index.ts',
      name: 'React_16_14_0',
      fileName: (format) => `${format}.js`,
      formats: ['umd'],
    },
    rollupOptions: {
      external: [],
      plugins: [terser()],
      output: {
        globals: {
          'react': 'React_16_14_0',
        }
      },
    },
    write: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
});
```

`rollupOptions.external` と `rollupOptions.output.globals` はライブラリによって依存しているものを意識して設定するのがよさそうですね

### packages/react[16, 18]

vite createによって生成されたReactのプロジェクトです

大きな変更点として

https://github.com/igara/multiple_react_version_sample/blob/main/packages/react16/vite.config.ts の

`rollupOptions.external` と `rollupOptions.output.globals` ぐらいで

```
    rollupOptions: {
      external: ['react', 'react-dom'],
      plugins: [terser()],
      output: {
        globals: {
          'react': 'React_16_14_0',
          'react-dom': 'ReactDOM_16_14_0',
        }
      },
    },
```

にしてあるぐらいです

この設定にすることによってこのビルドファイル自身にはReactのライブラリを含めず、ライブラリの参照は `packages/npm_manager` になり、さらに複数のReactプロジェクトを読みこんだときにプロジェクトの数分Reactなどのライブラリのファイルサイズ削減にもなると思います

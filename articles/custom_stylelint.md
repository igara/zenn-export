---
title: "独自のStylelint拡張をかいた 補足 共通のカラーコード参照"
emoji: "🎨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["sass", "stylelint", "emotion", "lancers"]
published: true
---

https://engineer.blog.lancers.jp/フロントエンド/フロントエンド定例-2022-6-3
  

の「独自のStylelint拡張をかいた」の記事に対しての補足記事になります。  
定例中は社内での画面共有で伝わるやろという雰囲気感でやっていたので外向けに説明不十分な箇所の追記になります。  

なぜ補足をZennで書こうとしたかというと他にも伝わってなさそうなことをZennのコメントで拾えそうかなと思ったからです。  

## > デザインシステムを進めていく上でカラーコードなども定数化されているのでコードの値参照を共通のファイルからするように警告を表示させる対応をしました。

> カラーコードなども定数化

> コードの値参照を共通のファイル

カラーコードは1つのSASSファイルにまとめています。  
内容として

```scss
/**
 * colors
 */
/* stylelint-disable @lancers/design-guideline */
$colorWhite: #fff;
...
/* stylelint-enable @lancers/design-guideline */
```

上記のような記載の共通のカラーコード定義ファイルを作成しています。  
stylelint-disableのコメント入れているのはStylelintの自身が作成したルールで検出されてしまうので回避として意図的に無効化してます。  
このSASSファイルはSASSの@importを経由にしてグローバル展開するような使い方の想定で使用しています。  

[今後の計画](https://sass-lang.com/blog/the-module-system-is-launched#future-plans) もあるので今後もSASSを採用するかというと微妙なとこですが

## > const colorsJSON = require('@lancers/design_guideline/scripts/colors.json');

1つにまとめたカラーコードのSASSファイルをJSONファイル化するための仕組みがあります。  
  
下記のような正規表現で抽出した処理のScriptをビルド時に実行してカラーコードをJSON化してStylelintでの参照するカラーコードも更新するようにしています。  

```ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

const colorsSASS = fs.readFileSync(
  `${__dirname}/../src/styles/colors.scss`,
  'utf8'
);
const colorsMatch = colorsSASS.match(/color.*: #.*;/g);

const colors = colorsMatch.map((colorsText) => {
  return colorsText.replace(';', '').split(': ');
});

const json = colors.reduce((acc, [key, value]) => {
  acc[key] = value;
  acc[value] = key;
  return acc;
}, {});

fs.writeFileSync(`${__dirname}/colors.json`, JSON.stringify(json));
```

個人的にはJSONファイルがいろんなもので扱いやすくていいのかなと思ってます。  
型的には最初からTypeScriptとしても出しておけばというのはありますね。  

## > こんな感じの実装感覚で進められたので他に共通で使用したい関数なども拡張に入れていきたいと思います。

> 他に共通で使用したい関数

同定例で [@high_g_engineer](https://twitter.com/high_g_engineer) が言ってたpadding, margin, line-heightとかの間隔を8の倍数px指定を定数化とlint化するとか。  

共通のmedia queryの省略したようなのを関数化するとか。  

## > @stylelint/postcss-css-in-js によるemotionでのStylelintも検討しましたがESLint (TypeScript)での検知も可能な状態にしようかなと思います

なぜemotionをそのままStylelint適応検討ではなくESLint側でやろうと思ったのか？

-> [このディスカッションの今後](https://github.com/emotion-js/emotion/discussions/2694)が気になるからです。  

どういった方針になるかわからないですがおそらくしばらく動きはないんだろうと思ってます。  
貢献のチャンスかも知れませんが僕自身は下記の対応が早そうと思いましたのでそっ閉じしてます。  

ESLintでも下記みたいな定義があったとき

```ts
const style1 = css`
  color: #FFF;
`;
const style2 = css`
  color: ${colorWhite};
`;
```

代入する値の検証を正規表現頑張ればいけなくない？（エアプ）と思っているのでESLint側で直近は解決させようかなと思いました。
  
TypeScriptとStylelintの混合は難しいのかな？とふんわり思ってたりもします。  

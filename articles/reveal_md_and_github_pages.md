---
title: "reveal-mdとGitHub Pagesでスライドを公開する"
emoji: "📓"
type: "idea" # tech: 技術記事 / idea: アイデア
topics: ["プレゼンテーション", "reveal", "markdown"]
published: true
---

記事の書き始めで「あーSlidevにすればよかった」と後悔してます。  

https://zenn.dev/ryo_kawamata/articles/introduce-slidev

- 視認性の高いコードスニペット & ライブコーディング
  - LTという決められた時間内でライブコーディングは難しいけど個人としてLT後に後日談として配信したりするから地味に欲しい機能
- 多彩な表示モード
  - メモ機能
    - ペンツールがあるスライドツールが欲しかったけどメモもできるとは...

-----------

今回この記事を書いたきっかけとして久しぶりにLT会参加し、その際の資料を事前共有・GitHub Pagesで管理できるものあったらいいなと思ったのでスライド作成ツールをいじってみたという雰囲気で書いてます。

なぜGitHub Pagesで管理できるのがよかったかというとSlideShareは広告表示とかでユーザ離れ、Speaker Deckも愛用はしてたんですけどPDFのプレビューと大差ないのもありスライド自体がHTMLのものの方がリンクの遷移ができたりreveal.js、Slidevのようにツール側で拡張しやすいのもあってスライドツール変えてみようかなと思いました。

当初はペンツールさえあればなんでもよかったというノリはありました。

LT準備当時ではreveal.jsがメタだと思ってたんですよ。

https://revealjs.com

## 作成物

ソース: https://github.com/igara/deck

スライド一覧: https://igara.github.io/deck

![slide](/images/reveal_md_and_github_pages/slide.png)

## 説明

### 使用ライブラリ

reveal.jsのラップしたreveal-mdを使用しました。

https://github.com/webpro/reveal-md

reveal.jsのプラグインとしてreveal.js-pluginsを使用しています。

https://github.com/rajgoel/reveal.js-plugins

### GitHub Pages設定

GitHub Pagesの設定として下記の設定をしています。

![github_pages](/images/reveal_md_and_github_pages/github_pages.png)


### npm scriptの設定

#### start

```
    "start": "reveal-md markdown -w --css node_modules/reveal.js-plugins/customcontrols/style.css,node_modules/reveal.js-plugins/chalkboard/style.css,node_modules/reveal.js-plugins/menu/menu.css",
```

開発環境上でスライドのmarkdownを記載しながらプレビュー反映できるコマンドです。

プラグインの追加により適応したいスタイルの指定をしています。

#### build

```
    "build": "reveal-md markdown --static docs --css node_modules/reveal.js-plugins/customcontrols/style.css,node_modules/reveal.js-plugins/chalkboard/style.css,node_modules/reveal.js-plugins/menu/menu.css --assets-dir assets && node cp.js"
```

markdownをHTML変換しdocsディレクトリに生成するコマンドです。
プラグインの追加によりCSSの指定となぜか画像系がdocsに反映されなかったのでcp.jsというのでファイルコピーするようにしてます。

GitHub Pagesの仕様の問題でデフォルトは `_assets` というディレクトリが生成されるのですが404ページとファイルの設置ができないようなので `assets` にして参照できるようにしています。

### revealプラグインの設定

ペンツールやその他のメニューの表示を行いたかったので下記のものを記載しています。

```json:reveal-md.json
{
    "scripts": [
        "node_modules/reveal.js-plugins/customcontrols/plugin.js",
        "node_modules/reveal.js-plugins/chalkboard/plugin.js",
        "node_modules/reveal.js-plugins/menu/menu.js",
        "node_modules/reveal.js-plugins/fullscreen/plugin.js",
        "plugin.js"
    ]
}

```

plugin.jsというスライド上で起動するJavaScriptを記載できるものを作成しました。

```javascript:plugin.js
options.plugins.push(
    RevealChalkboard,
    RevealMenu,
	RevealCustomControls,
	RevealFullscreen,
	RevealMarkdown,
);

Reveal.initialize({	
	slideNumber: 'c/t',
	chalkboard: { // font-awesome.min.css must be available
		//src: "chalkboard/chalkboard.json",
		storage: "chalkboard-demo",
	},

	customcontrols: {
		controls: [
			{
				id: 'toggle-overview',
				title: 'Toggle overview (O)',
				icon: '<i class="fa fa-th"></i>',
				action: 'Reveal.toggleOverview();'
			},
			{
				icon: '<i class="fa fa-pen-square"></i>',
				title: 'Toggle chalkboard (B)',
				action: 'RevealChalkboard.toggleChalkboard();'
			},
			{
				icon: '<i class="fa fa-pen"></i>',
				title: 'Toggle notes canvas (C)',
				action: 'RevealChalkboard.toggleNotesCanvas();'
			}
		]
	},
});

```

### markdownの記載

https://raw.githubusercontent.com/igara/deck/main/markdown/2023/20230126_iam_vscoder/Readme.md

markdownといってもHTMLも使用可能なのでちょっとした調整はHTMLのstyleで直接変更可能だったりします。

アニメーションの記載とかはFragmentであったりしますがHTMLのclass指定や拡張されたmarkdownの構文みたいに

```
- Eclipse <!-- .element: class="fragment highlight-red" data-fragment-index="1" -->
```

でアニメーションできたりと書き方はだいぶ自由度高い印象があります。

https://revealjs.com/fragments/
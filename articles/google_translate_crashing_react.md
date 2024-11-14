---
title: "ReactのページでGoogle翻訳するとエラーになる事象"
emoji: "📑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["react", "translation"]
published: false
publication_name: chot
---

# この記事について

![google_translation](/images/google_translate_crashing_react/google_translation.png)

上記の画像はこの現象について詳しく記載されている[Martijn Holsさんのブログ](https://martijnhols.nl/gists/everything-about-google-translate-crashing-react)をGoogle翻訳したものになります。
https://martijnhols.nl/gists/everything-about-google-translate-crashing-react

このブログが現状の解答だと思っているので自分からは結論と経緯（思い出）しか書かないようにして
[Martijn Holsさんのブログ](https://martijnhols.nl/gists/everything-about-google-translate-crashing-react)を見るようにしてください。

# 結論

- Virtual DOM内でstateをTextNodeとして反映している場合は翻訳かますことで発生しうる
  - 解消策
    - `<span>` で囲む
      - [eslint-plugin-sayari](https://github.com/sayari-analytics/eslint-plugin-sayari)というESLintプラグインが `no-unwrapped-jsx-text` というルールでタグで囲むように矯正できる
    - 多言語化対応
- [Reactだけではない](https://martijnhols.nl/gists/everything-about-google-translate-crashing-react#not-just-react)
  - Virtual DOMの書き換えによって起こる問題ではないため
    - 他のViewを扱うライブラリでも起こり得る
    - Chromeの拡張でDOMの内容を変えるものなら起こり得る

# 経緯（思い出）

自分も日常的にロケーションが異なるページでGoogle翻訳をよく使うのですが、
2年前ぐらいの業務上の問い合わせで海外のユーザーからアプリケーションを使用できないというのがあり、ユーザーの情報を元にDatadogのエラーを見たら

`NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`

というのが出ており、対応するにもすぐには対応することができなかったためCSチームの人にユーザーの方にサポートをついてもらったという人力で解決した思い出があります。

当時でもissueとして上がっていたもので [この辺（2020/11）](https://github.com/facebook/react/issues/11538#issuecomment-729716654)のコメントまでは見てた記憶はあり、
解決方法はわかりましたが該当箇所が多く、直しきれないというのがあって修正リリースを遅らせたというのがありました。

当時は `no-unwrapped-jsx-text` というESLintルールで該当箇所を洗い出すということもできなかったため対応するにしてもシブい印象がありました。

この記事を書こうとなったのが、最近の社内定例でGoogle翻訳でのエラーの話があり、
前からこのネタのを記事化しようと思っていたので今回ようやく記事にしました。

再度、issueみたら[Martijn Holsさんのブログ](https://martijnhols.nl/gists/everything-about-google-translate-crashing-react)で解説されているというコメントを見て、
記事書く前はエラーの再現のサンプルとか作るの大変だと思っていたので引用できる記事ができてて助かりました。

# 参考リンク

- https://martijnhols.nl/gists/everything-about-google-translate-crashing-react
  - Martijn HolsさんによるGoogle翻訳のエラー解説
- https://github.com/facebook/react/issues/11538
  - React公式のGoogle翻訳のエラーについてのissue

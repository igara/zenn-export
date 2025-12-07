---
title: "Shadow DOMでIslands Architectureっぽく(状態管理編)"
emoji: "☸"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["shadowdom", "architecture", "react", "vue"]
published: false
publication_name: chot
---

## 記事の内容

前回、[Shadow DOMでIslands Architectureっぽく(CSS編)](https://zenn.dev/chot/articles/shadow_dom_apps_css)という記事を記載しました。今回はShadow DOMにある複数のアプリ間での共有したい状態の管理方法について記載します。

## 動作環境

簡単なカウンターアプリを作ってみました。

https://igara.github.io/multi-fw-demo/nextjs/multi_counter.html

![apps](/images/shadow_dom_apps_state/apps.mov.gif)


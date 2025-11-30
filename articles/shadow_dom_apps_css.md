---
title: "Shadow DOMでIslands Architectureっぽく(CSS編)"
emoji: "🎨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["shadowdom", "architecture", "tailwindcss"]
published: false
publication_name: chot
---

# 記事のモチベ

定期的に、既存アプリケーションのリプレースの効率や、既存を残しつつ新規のアプリケーションを導入しやすい方法を考えることがあります。直近Vue2のプロジェクトをReactに変える相談があって今年度例の定期入ったかというモチベでこの記事を書いてます。

前の定期時には[マイクロフロントエンドと向きあってみる](https://engineer.blog.lancers.jp/%e3%83%95%e3%83%ad%e3%83%b3%e3%83%88%e3%82%a8%e3%83%b3%e3%83%89/%e3%83%9e%e3%82%a4%e3%82%af%e3%83%ad%e3%83%95%e3%83%ad%e3%83%b3%e3%83%88%e3%82%a8%e3%83%b3%e3%83%89%e3%81%a8%e5%90%91%e3%81%8d%e3%81%82%e3%81%a3%e3%81%a6%e3%81%bf%e3%82%8b-%e3%83%95%e3%83%ad%e3%83%b3/)というのをアウトプットしてたりしました。

# 記事の内容

[Shadow DOM](https://developer.mozilla.org/ja/docs/Web/API/Web_components/Using_shadow_DOM)の特性を使って、既存アプリケーションに対し、異なるWebフロントエンドの実装を入れてみたというものになります。

既存のアプリケーションとShadow DOM内のCSSのスコープが分離できるため、TailwindのようなCSSでも分離して使いやすいのでは？という過程で試してみました。

# 動作環境

https://igara.github.io/multi-fw-demo/nextjs/multi.html

![shadow_dom_apps](/images/shadow_dom_apps_css/shadow_dom_apps.png)

1つのページに対し、上からShadow DOM上にあるVue2のアプリケーション、ページ全体を構成しているNext.jsのアプリケーション、Shadow DOM上にあるReactのアプリケーションが動いています。

Next.jsとReactのアプリケーションは同じshadcn/uiで実装したコンポーネントを使用しています。適応するテーマのCSSだけを変えて表示していますが、それぞれのアプリケーションでCSSが干渉していないことがわかります。

# 解説

## それぞれのアプリケーションで展開するためのRoute設定

今回はGitHub Pages上で動かすため、部分的にあまりしない設定していると思います。

### Next.jsアプリケーション

- [next.config.ts](https://github.com/igara/multi-fw-demo/blob/main/packages/nextjs/next.config.ts)
  ```ts:next.config.ts
  const nextConfig: NextConfig = {
    output: "export",
    basePath: "/multi-fw-demo/nextjs",
    images: {
      unoptimized: true,
    },
  };
  ```
  GitHub Pagesに展開するためSSGで出力
- [/app/multi/page.tsx](https://github.com/igara/multi-fw-demo/blob/main/packages/nextjs/app/multi/page.tsx)
  /multi-fw-demo/nextjs/multiに今回のサンプルページを作るために設置

### Reactアプリケーション

TanStack RouterによるRoute設定

- [src/main.tsx](https://github.com/igara/multi-fw-demo/blob/main/packages/react/src/main.tsx)
  ```tsx:main.tsx
  let basePath = "/multi-fw-demo/react/";
  if (window.location.pathname.startsWith("/multi-fw-demo/nextjs")) {
    basePath = "/multi-fw-demo/nextjs/";
  }
  const multiRoute = createRoute({
    getParentRoute: () => routeTree,
    path: "multi.html",
    component: Multi,
  });
  // Create a new router instance
  const router = createRouter({
    routeTree: routeTree.addChildren([multiRoute]),
    basepath: basePath,
  });
  ```
  せっかくTanStack Router使っていますがGitHub Pagesに展開されるNext.jsのページがmulti.htmlなので、そこに合わせてRouteを追加しています。

### Vue2アプリケーション

Vue RouterによるRoute設定

- [src/router/index.ts](https://github.com/igara/multi-fw-demo/blob/main/packages/vue2/src/router/index.ts)
  ```ts:src/router/index.ts
  const routes: Array<RouteConfig> = [
    {
      path: '/multi.html',
      name: 'MultiFramework',
      component: HelloWorld
    },
  ]
  let basePath = '/multi-fw-demo/vue2/';
  if (window.location.pathname.startsWith('/multi-fw-demo/nextjs')) {
    basePath = '/multi-fw-demo/nextjs/';
  }
  if (window.location.pathname.startsWith('/multi-fw-demo/react')) {
    basePath = '/multi-fw-demo/react/';
  }

  const router = new VueRouter({
    mode: 'history',
    base: basePath,
    routes
  })
  ```

## Shadow DOM上にアプリケーションを展開するためのコード

- [React](https://github.com/igara/multi-fw-demo/blob/main/packages/nextjs/app/multi/components/ReactAppLoader.tsx)
- [Vue2](https://github.com/igara/multi-fw-demo/blob/main/packages/nextjs/app/multi/components/Vue2AppLoader.tsx)

この2つのコードの違いとしてDOMのid指定が`react-app`か`vue2-app`になっている点ぐらいです。

コードの内容を箇条書きすると

- Shadow Root作成
- Shadow Rootにマウントするためのアプリケーションのid要素追加
- それぞれのアプリケーションで使用するCSS読み込み
- Shadow RootにCSS適応
  - 例外的にCSSの@propertyはShadow DOM内に適応されないためグローバルに適応
- アプリケーションのJSファイルを読み込み

の流れになります。

## 詰まった点

### shadcn/uiのテーマがShadow DOM内に適応されない

[shadcn/ui公式](https://ui.shadcn.com/themes)のCSSのままではShadow DOMにはスタイルの適応ができなく、

![shadcn](/images/shadow_dom_apps_css/shadcn.png)

```diff css:src/themes/blue.css
:root,
+ :host {
  --radius: 0.65rem;
```

[:host](https://developer.mozilla.org/ja/docs/Web/CSS/Reference/Selectors/:host)セレクタを追加しました。

### Tailwind CSS 4の@propertyルールがShadow DOM内に適応されない

`--tw-xxx`というような命名規則のあるTailwind CSS共通の@propertyがありますが上書きされて困ることがないのでグローバルに適応するようにしました。

![tw-property](/images/shadow_dom_apps_css/tw-property.png)


# 参考

- Tailwind 4の@propertyルールについて
  [Tailwind CSS 4をShadow DOM内で動作させる方法](https://yuheiy.com/2025-08-10-tailwindcss4-in-shadow-dom)
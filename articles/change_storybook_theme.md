---
title: "Storybook上でCSSを書き換えてテーマの変更"
emoji: "🎨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["storybook", "css", "tailwindcss", "shadcnui"]
published: false
publication_name: chot
---

# 記事の内容として

デザインシステムなどがあり、色などのデザイントークンぐらいしか変わらない場合がある
今回はshadcn/uiによる複数テーマがある場合、実装側でもStorybook上でテーマを切り替えて確認したい場合の対応例になる
CSSのカスタムプロパティでテーマを変えるものであれば他でも応用できるものになっている

![storybook](/images/change_storybook_theme/storybook.gif)

Storybook上のメニューよりCSSを書き換えてStory上の色を確認できるように実装してみた
とはいってもほぼAI実装

# 解説

## 動作環境

[Storybook](https://igara.github.io/multi-fw-demo/shadcn/?path=/story/themes-color-palette--themes)

## 使用しているテーマについて

[shadcn/uiの公式](https://ui.shadcn.com/themes)にあるテーマのCSS内容をそのまま使用

![shadcn](/images/change_storybook_theme/shadcn.png)

- 実装したテーマ
  - [default](https://github.com/igara/multi-fw-demo/blob/main/packages/shadcn/src/themes/default.css)
  - [green](https://github.com/igara/multi-fw-demo/blob/main/packages/shadcn/src/themes/green.css)
  - [blue](https://github.com/igara/multi-fw-demo/blob/main/packages/shadcn/src/themes/blue.css)

## ソース

### [main.ts](https://github.com/igara/multi-fw-demo/blob/main/packages/shadcn/.storybook/main.ts)

```ts:.storybook/main.ts
  staticDirs: ["../dist"],
```

テーマのCSSを参照できる場所を ``staticDirs`` に指定

### [preview.tsx](https://github.com/igara/multi-fw-demo/blob/main/packages/shadcn/.storybook/preview.tsx)


特筆することとして

- Previewの拡張のためにpreview.tsではなく `preview.tsx` にしている
  - StorybookのPreviewでReactの挙動を追加している
    ```tsx:.storybook/preview.tsx
      useEffect(() => {
        switchTheme(theme);
      }, [theme]);
    ```
- Storybookのメニュー追加
  ```tsx:.storybook/preview.tsx
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "default",
      toolbar: {
        icon: "paintbrush",
        items: [
          {
            value: "default",
            title: "Default Theme",
          },
          {
            value: "green",
            title: "Green Theme",
          },
          {
            value: "blue",
            title: "Blue Theme",
          },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  ```
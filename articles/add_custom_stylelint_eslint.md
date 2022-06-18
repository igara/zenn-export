---
title: "ESLintのルール新規追加、Stylelintのルール追加しました 補足"
emoji: "✅"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["sass", "stylelint", "eslint", "emotion", "lancers"]
published: true
---

https://engineer.blog.lancers.jp/フロントエンド/フロントエンド定例-2022-6-17
  

の「ESLintのルール新規追加、Stylelintのルール追加しました」の記事に対しての補足記事になります。  

最初に記事の足りない箇所の補足をした上で、
Lintのコードの内容や開発をどのように進めているのかなども記載したいと思います。

## 記事の補足

### > Stylelintとは別でESLintでも作成しようとした理由としてCSS in JSによるスタイルの適応方法がCSS, SASSとは異なるためESLintでも同様のルールの追加をしています。

実際のSassとTypeScriptによるReactでのCSS in JSでの変数適応の例を見ると

```sass
.hoge {
  color: $colorWhite
}
```

```typescript
import { css } from '@emotion/react';
import { Color } from '@design_system';

const hogeCSS = css`
  color: ${Color.White}
`;
```

上記のようにSassでは `$xxx`、TypeScriptでは `${xxx}` と構文上の違いがあり、
StylelintではSassをESLint側はCSS in JSをメインにしてルールを記載しようとなった背景があります。

前回はSassに対してのStylelintの適応の話しかしてなかったのでTypeScript側ではどういった色の管理しているのか触れてなかったのですが、
基本はSassの値を参照で間にWebpackとcss-loaser経由での[CSS Modulesの:import](https://github.com/css-modules/icss#import)によるSassの変数をTypeScriptでも使えるようなやり方で現状は適応してたりします。

### > Figmaとかに定義されているpxや色の物理的な値

Figma上で親パーツとの間隔を調べるときにAlt (Option)を押しながらマウスカーソルを当てて表示されている数値をそのまま貼ればVSCodeで補完の候補が出てくるので都度定義ファイルを開いて適切な変数名を調べる必要がなくなりました。

![](/images/add_custom_stylelint_eslint/figma_padding.jpg)

色についてもFigma上に表示されている値をクリックしてコピれるのでそのまま貼り付けしてあとは補完に任せれば良い環境になっています。

![](/images/add_custom_stylelint_eslint/figma_color.jpg)

### > 他のプロジェクトでも静的解析含めてデザインシステムライブラリを使っていくようにしていきたい

直近、自分が関わっているプロジェクト以外では適応がまだできていないので時間あるときに適応したいですね。
自分が適応するのではなく、ビルドに影響しないLintの設定なのでPRで他のプロジェクトにも適応しましたというのがあったら結構嬉しかったりします。

個人的問題ですが拡散したものの布教されるまでにどうしても時間がかかってしまうのが個人的な悩みだったりしますね。
（職務範囲の問題とかもあるのでそこまで踏み込んでもよいのだろうかというのはたまに思うところ）
誰がやるやら問題ともいってます。

## コード説明

### Stylelint

プロジェクトの構成はほぼこれ
[stylelint-pluginを作ってみる会](https://zenn.dev/jj/scraps/42157938c9eb48)

#### 実装コード

ルールを記載している index.js の内容として下記になります。
コードのコメント上で説明します

```javascript:index.js
const stylelint = require('stylelint');
const colorsJSON = require('@lancers/design_guideline/scripts/colors.json');
const spacingJSON = require('@lancers/design_guideline/scripts/spacing.json');

const ruleName = '@lancers/design-guideline';
const messages = stylelint.utils.ruleMessages(ruleName, {
  expected: 'Expected...',
});

/**
 * 現状はpadding, padding-[top,...],margin,margin-[top,...],grid-gap,gapなどの間隔を対象にしている
 */
const spacingPropReg = /(\S*padding\S*|\S*margin\S*|\S*gap\S*)/;
/**
 * #のカラーコード以外に$などの変数も対象にしている
 * colors.jsonには変数名-カラーコードの情報も保存しているので
 * 適当なSass変数による色適応を許可しないようにした
 */
const colorReg = /(#|\$)[0-9a-zA-Z]*/;
/**
 * px以外に$などの変数も対象にしている
 * spacing.jsonも同様に変数名-pxの情報も保存しているので
 * 適当なSass変数によるpx適応を許可しないようにした
 */
const spacingReg = /([0-9]*px|\$[0-9a-zA-Z]*)/;

const checkColors = ({ decl, result }) => {
  // CSSでいうpaddingなどのstyle属性をpropで扱っている
  const prop = decl.prop;
  if (spacingPropReg.test(prop)) {
    // 上記の条件はスキップ
    return;
  }

  // decl.valueはstyle属性に対しての指定された値を扱っている
  const matched = decl.value.match(colorReg);
  if (!matched) {
    return;
  }

  // カラーコード・変数名のマッチがあるか
  const color = colorsJSON[matched[0]] || colorsJSON[matched[0].toLowerCase()];
  if (!color) {
    // マッチがない場合は未定義のものとして注意する
    stylelint.utils.report({
      ruleName,
      result,
      message: `undefined color rule: ${matched[0]} -> ??? [see colors.scss]`,
      node: decl,
    });
    return;
  }
  // color.sassはJSONにあるSass用の変数を示している
  const definedColor = color.sass;

  if (definedColor) {
    // マッチした場合は変数名を提案する
    stylelint.utils.report({
      ruleName,
      result,
      message: `${messages.expected} ${matched[0]} -> ${definedColor} [see colors.scss]`,
      node: decl,
    });
  }
};

const checkSpacing = ({ decl, result }) => {
  // CSSでいうpaddingなどのstyle属性をpropで扱っている
  const prop = decl.prop;
  if (!spacingPropReg.test(prop)) {
    // 上記の条件以外はスキップ
    return;
  }

  // decl.valueはstyle属性に対しての指定された値を扱っている
  const matched = decl.value.match(spacingReg);
  if (!matched) {
    return;
  }

  // px・変数名のマッチがあるか
  const spacing = spacingJSON[matched[0].toLowerCase()];
  if (!spacing) {
    // マッチがない場合は未定義のものとして注意する
    stylelint.utils.report({
      ruleName,
      result,
      message: `undefined spacing rule: ${matched[0]} -> ??? [see spacing.scss]`,
      node: decl,
    });
    return;
  }
  // spacing.sassはJSONにあるSass用の変数を示している
  const definedSpacing = spacing.sass;

  if (definedSpacing) {
    // マッチした場合は変数名を提案する
    stylelint.utils.report({
      ruleName,
      result,
      message: `${messages.expected} ${matched[0]} -> ${definedSpacing} [see spacing.scss]`,
      node: decl,
    });
  }
};

module.exports = stylelint.createPlugin(ruleName, function () {
  return function (root, result) {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {});

    root.walkDecls((decl) => {
      /**
       * 現状1つのStylelintのプラグインで色、間隔のルールチェックをしているので分けるべきなんだろうけど
       * 複数のルールとしてStylelintのプロジェクト分けるのにもためらっている
       */
      checkColors({ decl, result });
      checkSpacing({ decl, result });
    });

    if (!validOptions) {
      return;
    }
  };
});

module.exports.ruleName = ruleName;
module.exports.messages = messages;
```

#### テストコード

検証として実施済みのテストコードとして下記のものになります。

```javascript:index.test.js
const { ruleName } = require('.');

testRule({
  plugins: ['./index.js'],
  ruleName,
  config: true,
  fix: false,

  accept: [
    {
      code: `.class {
        margin: 0;
        color: $colorWhite;
      }`,
    },
  ],

  reject: [
    {
      code: `.class {
        margin: 0;
        color: #fff;
      }`,
      message:
        'Expected... (@lancers/design-guideline) #fff -> $colorWhite [see colors.scss]',
    },
    {
      code: `.class {
        margin: 0;
        color: #FFF;
      }`,
      message:
        'Expected... (@lancers/design-guideline) #FFF -> $colorWhite [see colors.scss]',
    },
    {
      code: `.class {
        margin: 0;
        color: #123456;
      }`,
      message: 'undefined color rule: #123456 -> ??? [see colors.scss]',
    },
    {
      code: `.class {
        margin: 0;
        color: $hoge;
      }`,
      message: 'undefined color rule: $hoge -> ??? [see colors.scss]',
    },
    {
      code: `.class {
        padding: 99px;
      }`,
      message: 'undefined spacing rule: 99px -> ??? [see spacing.scss]',
    },
    {
      code: `.class {
        padding: $hoge;
      }`,
      message: 'undefined spacing rule: $hoge -> ??? [see spacing.scss]',
    },
    {
      code: `.class {
        padding: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        padding-top: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        margin-bottom: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        raw-gap: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        gap: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        grid-gap: 64px;
      }`,
      message:
        'Expected... (@lancers/design-guideline) 64px -> $spacingXXXL [see spacing.scss]',
    },
    {
      code: `.class {
        margin: 0;
        border: 1px dashed #fff;
      }`,
      warnings: [
        {
          column: 9,
          endColumn: 33,
          endLine: 3,
          line: 3,
          rule: '@lancers/design-guideline',
          severity: 'error',
          message:
            'Expected... (@lancers/design-guideline) #fff -> $colorWhite [see colors.scss]',
        },
      ],
    },
  ],
});
```

テスト実行はVSCodeのデバック実行機能から実行するように下記のlaunch.jsonを保存させてテストしやすい感じで実施してました。

```json:launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "stylelint:design-guideline",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/lint/stylelint-plugin-design-guideline",
      "runtimeArgs": [
        "--inspect-brk",
        "${workspaceRoot}/lint/stylelint-plugin-design-guideline/node_modules/.bin/jest",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "port": 9229
    }
  ]
}
```

### ESLint

プロジェクト構成はこの方の記事がものすごく近いです

書いて覚える ESLint ルールの作り方

[TypeScript版](https://qiita.com/kik4/items/a6d0dc2f8ab5ce50f97d)
[JavaScript版](https://qiita.com/kik4/items/ef30d5e0e24dabb81463)

若干の違いが自分の方はテストライブラリをJestを採用しているぐらいの差分だと思います。

#### 実装コード

追加したルールのコードのコメント上で説明します。

```typescript:src/index.ts
/**
 * このファイルをバレルのように扱っている
 * ルールを追加した際はこちらにもimportを記載する
 */
import emotionColors from './rules/emotionColors';
import emotionSpacing from './rules/emotionSpacing';

exports.default = {
  rules: {
    emotionColors,
    emotionSpacing,
  },
  configs: {
    all: {
      plugins: ['design-guideline'],
      rules: {
        emotionColors: 'error',
        emotionSpacing: 'warn',
      },
    },
  },
};
```


```typescript:src/rules/util.ts
/**
 * 共通の変数まとめた
 */

/**
 * css``やstyled.div``などの書き方を対象にしている
 */
export const cssInJSReg = /(css|styled.[a-zA-Z]*)`/;
/**
 * カラーコード以外に${xxx}という変数の書き方も対象にしている
 * 若干正規表現が怪しいがライブラリ経由のカラーコード呼び出しは
 * ${Color.xxx}な形式だから現状カバーできているがより厳密に書いたほうがよさそう
 */
export const colorReg = /(#[0-9a-zA-Z]*|\${[0-9a-zA-Z]*})/;
/**
 * Stylelint側と同様の間隔の対象にしている
 */
export const spacingPropReg = /(\S*padding\S*|\S*margin\S*|\S*gap\S*): .*?;/;
/**
 * px以外に${xxx}という変数の書き方も対象にしている
 */
export const spacingReg = /([0-9]*px|\${[0-9a-zA-Z]*})/;

```


```typescript:src/rules/emotionColors.ts
import { Rule } from 'eslint';

import { colorReg, cssInJSReg } from './util';

const colorsJSON = require('@lancers/design_guideline/scripts/colors.json');

const emotionColors = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '@lancers/design_guideline共通の使用する色指定ルール',
    },
    fixable: 'code',
  },
  create(context) {
    return {
      /**
       * const, varなどの変数を定義した箇所に対してのルールを追加する
       * nodeの対象は変数定義の箇所
       */
      VariableDeclaration(node) {
        /**
         * context.getSourceCode ファイルの全体のソースを扱っている
         */
        const code = context.getSourceCode().getText(node);

        if (!code) return;

        if (!cssInJSReg.test(code)) {
          // emotionなどのStyle指定ではない場合はスキップ
          return;
        }

        const matched = code.match(colorReg);
        if (!matched) {
          return;
        }

        const matcheString = matched[0].toString();
        const color =
          colorsJSON[matcheString] || colorsJSON[matcheString.toLowerCase()];
        if (!color) {
          // マッチがない場合は未定義のものとして注意する
          context.report({
            node,
            message: `undefined color rule: ${matcheString} -> ??? [see utils/Color/index.ts(colors.scss)]`,
          });
          return;
        }
        const definedColor = color.script;

        if (definedColor) {
          // マッチした場合は候補を提案する
          context.report({
            node,
            message: `${matcheString} -> ${definedColor} [see utils/Color/index.ts(colors.scss)]`,
            /**
             * eslint --fix実行時に対象の箇所を自動で修正するための関数
             */
            fix(fixer) {
              const scope = node.parent;

              const sourceCode = context.getSourceCode().getText(scope);
              // 文字列置換
              const fixedCode = sourceCode.replace(matcheString, definedColor);

              // 実際のソースコード上にも文字列置換を反映する
              return fixer.replaceText(scope, fixedCode);
            },
          });
        }
      },
    };
  },
} as Rule.RuleModule;

module.exports = emotionColors;
export default emotionColors;
```

```typescript:src/rules/emotionSpacing.ts
import { Rule } from 'eslint';

import { spacingPropReg, spacingReg } from './util';

const spacingJSON = require('@lancers/design_guideline/scripts/spacing.json');

const emotionSpacing = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '@lancers/design_guideline共通の間隔のpx指定ルール',
    },
    fixable: 'code',
  },
  create(context) {
    return {
      /**
       * const, varなどの変数を定義した箇所に対してのルールを追加する
       * nodeの対象は変数定義の箇所
       */
      VariableDeclaration(node) {
        /**
         * context.getSourceCode ファイルの全体のソースを扱っている
         */
        const code = context.getSourceCode().getText(node);

        if (!code) return;

        const propMatch = code.toString().match(spacingPropReg);
        if (!propMatch) {
          return;
        }

        const propString = propMatch[0].toString();

        const pxMatch = propString.match(spacingReg);

        if (!pxMatch) {
          return;
        }

        const pxString = pxMatch[0].toString();

        const spacing = spacingJSON[pxString.toLowerCase()];
        if (!spacing) {
          // マッチがない場合は未定義のものとして注意する
          context.report({
            node,
            message: `undefined spacing rule: ${pxString} -> ??? [see utils/Spacing/index.ts(spacing.scss)]`,
          });
          return;
        }
        const definedSpacing = spacing.script;

        if (definedSpacing) {
          // マッチした場合は候補を提案する
          context.report({
            node,
            message: `${pxString} -> ${definedSpacing} [see utils/Spacing/index.ts(spacing.scss)]`,
            /**
             * eslint --fix実行時に対象の箇所を自動で修正するための関数
             */
            fix(fixer) {
              const scope = node.parent;

              const sourceCode = context.getSourceCode().getText(scope);
              // 文字列置換
              const fixedProp = propString.replace(pxString, definedSpacing);
              const fixedCode = sourceCode.replace(propString, fixedProp);

              // 実際のソースコード上にも文字列置換を反映する
              return fixer.replaceText(scope, fixedCode);
            },
          });
        }
      },
    };
  },
} as Rule.RuleModule;

module.exports = emotionSpacing;
export default emotionSpacing;
```

#### テストコード

検証として実施済みのテストコードとして下記のものになります。

```typescript:src/rules/emotionColors.test.ts
import { RuleTester } from 'eslint';

import emotionColors from './emotionColors';

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    es6: true,
    browser: true,
  },
});

ruleTester.run('emotionColors', emotionColors, {
  // 成功ケース
  valid: [
    {
      code: 'var style = css`color: ${Color.White};`;',
    },
    {
      // CSSinJS的な書き方ではないのでセーフ
      code: 'var style = `color: ${hoge};`;',
    },
    {
      code: 'var style = css`${MediaQuery.mqsp} { color: ${Color.White}; }`;',
    },
  ],
  // 失敗ケース
  invalid: [
    {
      code: 'var style = css`color: #fff;`;',
      errors: [
        '#fff -> ${Color.White} [see utils/Color/index.ts(colors.scss)]',
      ],
      output: 'var style = css`color: ${Color.White};`;',
    },
    {
      code: 'var style = css`color: #D1D1D1;`;',
      errors: [
        '#D1D1D1 -> ${Color.Grey30} [see utils/Color/index.ts(colors.scss)]',
      ],
      output: 'var style = css`color: ${Color.Grey30};`;',
    },
    {
      code: 'var style = css`color: ${hoge};`;',
      errors: [
        'undefined color rule: ${hoge} -> ??? [see utils/Color/index.ts(colors.scss)]',
      ],
    },
  ],
});
```

```typescript:src/rules/emotionSpacing.test.ts
import { RuleTester } from 'eslint';

// eslint-disable-next-line @typescript-eslint/no-var-requires
import emotionSpacing from './emotionSpacing';

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    es6: true,
    browser: true,
  },
});

ruleTester.run('emotionSpacing', emotionSpacing, {
  // 成功ケース
  valid: [
    {
      code: 'var style = css`padding: ${Spacing.xxxs};`;',
    },
    {
      code: 'var style = css`border: 1px solid ${Color.Grey30};`;',
    },
  ],
  // 失敗ケース
  invalid: [
    {
      code: 'var style = css`padding: 8px;`;',
      errors: [
        '8px -> ${Spacing.xxs} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output: 'var style = css`padding: ${Spacing.xxs};`;',
    },
    {
      code: 'var style = css`padding: 9px;`;',
      errors: [
        'undefined spacing rule: 9px -> ??? [see utils/Spacing/index.ts(spacing.scss)]',
      ],
    },
    {
      code: 'var style = css`margin: 9px;`;',
      errors: [
        'undefined spacing rule: 9px -> ??? [see utils/Spacing/index.ts(spacing.scss)]',
      ],
    },
    {
      code: 'var style = css`margin: ${hoge};`;',
      errors: [
        'undefined spacing rule: ${hoge} -> ??? [see utils/Spacing/index.ts(spacing.scss)]',
      ],
    },
    {
      code: 'var style = css`padding: 64px;`;',
      errors: [
        '64px -> ${Spacing.xxxl} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output: 'var style = css`padding: ${Spacing.xxxl};`;',
    },
    {
      code: 'var style = css`padding-top: 64px;`;',
      errors: [
        '64px -> ${Spacing.xxxl} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output: 'var style = css`padding-top: ${Spacing.xxxl};`;',
    },
    {
      code: 'var style = css`margin-left: 64px;`;',
      errors: [
        '64px -> ${Spacing.xxxl} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output: 'var style = css`margin-left: ${Spacing.xxxl};`;',
    },
    {
      code: 'var style = css`grid-column-gap: 12px; padding: 64px;`;',
      errors: [
        '12px -> ${Spacing.xs} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output:
        'var style = css`grid-column-gap: ${Spacing.xs}; padding: 64px;`;',
    },
    {
      code: 'var style = css`gap: 12px; padding: 64px;`;',
      errors: [
        '12px -> ${Spacing.xs} [see utils/Spacing/index.ts(spacing.scss)]',
      ],
      output: 'var style = css`gap: ${Spacing.xs}; padding: 64px;`;',
    },
  ],
});
```

Stylelintと同様にテスト実行はVSCodeのデバック実行機能から実行するように下記のlaunch.jsonを保存させてテストしやすい感じで実施してました。

```json:launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "eslint:design-guideline",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/lint/eslint-plugin-design-guideline",
      "runtimeArgs": [
        "--experimental-modules",
        "--inspect-brk",
        "${workspaceRoot}/lint/eslint-plugin-design-guideline/node_modules/.bin/jest",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "port": 9229
    }
  ]
}
```

## StylelintとESLintの拡張を書いてみての感想

全体的に正規表現で頑張っている感は正直否めないとこだと思います。
Lintの対象範囲についてはCSS限定にかけるStylelintは書きやすい反面、どうしてもESLintは変数の定義としてのスコープとなってしまうのでStyle属性に絞りこむにはどうしたら良いのか？となることが多かったです。
ESLint側のみfixによるコードの変更対応をすすめましたが置換の範囲を間違えると既存のソースが消えることがあり完成するまでが大変でした。
引き続きルールの拡張を進めるのとともに定着化を進めていきたいと思います。

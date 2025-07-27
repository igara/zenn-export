---
title: "mainブランチマージしたら他のブランチにもマージPRを作成するGitHub Actions"
emoji: "🪾"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["githubactions"]
published: false
publication_name: chot
---

# 前提の話

- ブランチ運用の話
  - CI / CD周り
    - ブランチ名がそのままリモートの開発環境へデプロイするような運用
      - main: 本番環境 一番StableでLatestなブランチ
      - その他の環境
        - staging: ステージング環境
        - ...etc環境
          - `要するにmain更新されたら存在するリモートの環境分の更新作業がめんどくさい`

図にするとこんな感じ

![ブランチ運用](/images/main_release_marge/branch.drawio.png)

# サンプルプロジェクト

https://github.com/igara/git-merge-pr-sample

mainに直でGitHub ActionsのYAMLをコミット&プッシュしたのでPRに各ブランチにYAMLの差分を取り込むようなPRが作成されている

## .github/workflows/main_release_marge.yml

GitHub ActionsのWorkflowの内容として下記の詳細に記載

<details>

```yaml
name: main branch Release Marge
on:
  push:
    branches: [main]
# https://qiita.com/Hiroki_lzh/items/3607072052a2de7e8378#%E3%81%BE%E3%81%9A%E3%81%AFactions%E5%85%A8%E4%BD%93%E3%81%A7%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF%E6%A8%A9%E9%99%90%E3%82%92%E3%82%82%E3%82%89%E3%81%88
permissions:
  contents: write
  pull-requests: write
env:
  GITHUB_MAIL: 41898282+github-actions[bot]@users.noreply.github.com
  GITHUB_NAME: github-actions[bot]
jobs:
  release-merge-pr:
    runs-on: ubuntu-latest
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Create merge PR for dev1
        run: |
          git checkout -b main_to_dev1
          git push --set-upstream origin main_to_dev1
          gh pr create \
            -B dev1 \
            -t "[Release Marge] main -> dev1" \
            -b "mainがリリースされたので.github/workflows/main_release_marge.yml経由にマージのPRが作成されました"
        continue-on-error: true
      - name: Create merge PR for dev2
        run: |
          git checkout -b main_to_dev2
          git push --set-upstream origin main_to_dev2
          gh pr create \
            -B dev2 \
            -t "[Release Marge] main -> dev2" \
            -b "mainがリリースされたので.github/workflows/main_release_marge.yml経由にマージのPRが作成されました"
        continue-on-error: true
```

</details>

### 注意点

```
permissions:
  contents: write
  pull-requests: write
```

コメントにあるリンクで
https://qiita.com/Hiroki_lzh/items/3607072052a2de7e8378#%E3%81%BE%E3%81%9A%E3%81%AFactions%E5%85%A8%E4%BD%93%E3%81%A7%E6%9B%B8%E3%81%8D%E8%BE%BC%E3%81%BF%E6%A8%A9%E9%99%90%E3%82%92%E3%82%82%E3%82%89%E3%81%88

にもあるがActionsに読み書きの権限を与える必要があるので実行して403が出たらGitHubのOrganizationの管理者に追加するようにお願いする

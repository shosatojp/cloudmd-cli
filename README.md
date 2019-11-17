# CLI tool for [CloudMarkdown](https://cloudmd.monoid.app/)

![](https://github.com/shosatojp/cloudmd-cli/workflows/CI/badge.svg)

## インストール
1. [リリースページ](https://github.com/shosatojp/cloudmd-cli/releases)からファイルをダウンロードします
2. tarまたはzipを解凍します
3. パスを通します

## 使い方

```sh
cloudmd src/report.md template.tex assets/*.png pdf=report.pdf tex=report.tex
```

`tex=report.tex`で中間ファイルのTexもダウンロードします

## ビルド

## TODO
* select compile type
* select template

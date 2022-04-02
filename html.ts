import * as fs from "fs";
import markdownHtml from 'zenn-markdown-html';

const exec = () => {
  const zennStyle = fs.readFileSync("./node_modules/zenn-content-css/lib/index.css", "utf8");
  const articleMarkdowns = fs.readdirSync("articles");

  articleMarkdowns.forEach((articleMarkdown) => {
    const markdown = fs.readFileSync(`articles/${articleMarkdown}`).toString();
    const html = markdownHtml(markdown);

const body = `
<style>
${zennStyle}
svg {
  width: 20px;
}
</style>
<div class="znc">
  ${html}
</div>`;

    fs.writeFileSync(`html/${articleMarkdown}.html`, body);
  });
};

exec();

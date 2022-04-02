import * as childProcess from "child_process";
import * as fs from "fs";
import markdownHtml from 'zenn-markdown-html';

const exec = () => {
  const gitUrl = childProcess.execSync("git config --get remote.origin.url").toString();
  const repositoryName = gitUrl.replace(/(https:\/\/github.com\/|git@github.com:|.git)/g, "");
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
  ${html.replace(
    /src="/g,
    `src="https://raw.githubusercontent.com/${repositoryName}/main`,
  )}
</div>`;

    fs.writeFileSync(`html/${articleMarkdown}.html`, body);
  });
};

exec();

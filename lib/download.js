const fs = require('fs-extra');
// 开启子进程执行命令
const exec = require('execa');
const spinner = require('ora')('start git clone template.....\n');
const { logError } = require('./BasicUtil');

/**
 * 通过git clone下载文件
 * @param opts
 * @returns {Promise<void>}
 * @constructor
 */
const GitDownload = async (opts = {}) => {
  const { args, templatePath, repository, hasGitDir = true } = opts;
  // 开始克隆模板
  const gitArgs = ['clone', repository];
  if (args && args.branch) {
    //
    gitArgs.push('--branch', args.branch);
  }
  // 模板存放目录
  const tmpPath = templatePath;
  // 如果模板目录不为空  先删除模板目录
  if (fs.existsSync(tmpPath)) {
    //
    fs.removeSync(tmpPath);
  }
  fs.mkdirp(tmpPath);
  gitArgs.push(tmpPath);
  spinner.start();
  try {
    await exec(`git`, gitArgs);
    // hasGitDir 是否保留.git目录
    if(!hasGitDir){
      //
      const gitFile = `${tmpPath}/.git`;
      if(fs.existsSync(gitFile)){
        //
        fs.removeSync(gitFile);
      }
    }
    spinner.stop();
  } catch (error) {
    spinner.stop();
    logError('Pull the template exception, please check the template git repository is correct, and set the git project visibility level to public');
    process.exit(1);
  }
};
module.exports = GitDownload;

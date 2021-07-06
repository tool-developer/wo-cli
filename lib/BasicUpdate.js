const chalk = require('chalk');
const isGitClean = require('is-git-clean');
const fs = require('fs-extra');
const exec = require("execa");
const papaparse = require("papaparse");
const {resolve} = require('path');
//
const { logError,getGitBranchInfo } = require('./BasicUtil');
//
const encoding = 'utf8';
const newline = '\r\n';
const delimiter = ',,,';

// 是否代码已提交检测
exports.ensureGitClean = async function () {
  let clean = false;
  try {
    clean = await isGitClean();
  } catch (err) {
    if (err && err.stderr && err.stderr.toLowerCase().includes('not a git repository')) {
      clean = true;
    }
  }
  //
  if (!clean) {
    logError(chalk.yellow('Sorry that there are still some git changes'));
    logError('you must commit or stash them firstly');
    process.exit(1);
  }
}
// 获取分支代码
exports.getGitBranchFiles = async function(config){
  //
  const typeDir = resolve(__dirname,`./generators/${config.type}/`);
  const {originName,remoteBranches,localBranches} = await getGitBranchInfo(config);
  // console.log('local branches',localBranches);
  // console.log('remote branches',remoteBranches);
  // console.log('origin name',originNameMatch);
  // 拉取的分支，是否存在
  if(!remoteBranches.includes(`remotes/${originName}/${config.branch}`)){
    //
    logError(chalk.red(`No '${config.branch}' branch,to check the branch name `));
    // 结束进程
    process.exit();
  }
  // 存在分支则,则更新本地分支
  if(localBranches.includes(config.branch)){
    // 切换分支
    await exec("git", ["checkout",config.branch], { cwd: typeDir });
    // 更新本地分支
    await exec("git", ["pull",`${originName}`,config.branch], { cwd: typeDir });
  }else{
    // 从远程切换本地分支
    await exec("git", ["checkout","-b",`${config.branch}`,`${originName}/${config.branch}`], { cwd: typeDir });
  }
}

// 文件写入开始
exports.start = async function(filePath){
  //
  return await fs.promises.open(filePath,'w');
}
// 写入文件内容
exports.writeFile = async function(file,content){

  return fs.promises.writeFile(file,content);
}
// 关闭文件
exports.close = async function(file){
  //
  return fs.closeSync(file);
}
// 清除缓存文件
exports.cleanup = async function(filePath){
  //
  return await fs.promises.unlink(filePath);
}
// 写入汇总
exports.appendLine = async function(filePath,fileName,source,message){
  const lineContent = [fileName, source, message].join(delimiter) + newline;
  //
  return await fs.promises.appendLine(
    filePath,
    lineContent,
    encoding,
    Function.prototype
  );
}
// 汇总输出
exports.output = async function(filePath){
  //
  const result = await new Promise((resolve,reject)=>{
    const stream = fs.createReadStream(filePath);
    papaparse.parse(stream,{
      delimiter,
      newline,
      complete:({data,err})=>{
        if(err.length){

          reject(err.message);
        }

        resolve(data);
      }
    });
  });
  //
  await exports.cleanup();
  //
  return result;
}
// 获取相对项目目录路径地址
exports.removeCWDPath = (filePath)=>{
  const cwd = process.cwd();
  //
  return filePath.replace(cwd,'');
}



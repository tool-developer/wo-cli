/**
 * 项目更新处理
 */
const chalk = require('chalk');
const exec = require("execa");
const path = require("path");
const inquirer = require("inquirer");
const os = require('os');
const fs = require("fs-extra");
const jscodeshiftBin = require.resolve('.bin/jscodeshift');

// https://github.com/facebook/jscodeshift/blob/master/parser/babylon.js
const babylonConfig = path.join(__dirname, '../transform/babylon.config.json');
// jscodeshift bin#--ignore-config
const ignoreConfig = path.join(__dirname, '../transform/codemod.ignore');
const parse = require('../parse');
const {ensureGitClean,getGitBranchFiles,start:updateStart, writeFile:updateWriteFile, cleanup:updateCleanup} = require('../BasicUpdate');
const { logGreen,logError } = require('../BasicUtil');
//
const woOptions = parse.load() || {};

// 升级汇总文件
const summaryFilePath = path.join(
  require('os').tmpdir(),
  './wo-codemod-summary.csv',
);
//
exports.run = async () => {
  //
  const authPkg = require(path.resolve(process.cwd(), "./src/mp-auth/package.json"));
  // 检测本地代码是否提交
  await ensureGitClean();
  const currentBranch = woOptions.BRANCH;
  const authTagVersion = authPkg.version;
  const currentTagBranch = authTagVersion.split(/\+/)[0];
  //
  const answer = await inquirer.prompt([{
    type: "input",
    name: "branch",
    message: "Input the template repository branch",
    'default': "main"
  },{
    type:"confirm",
    name:"continue",
    message:function(prompts){
      //
      if(currentTagBranch !== prompts.branch){
        //
        return `You are about to upgrade from (${chalk.yellow(currentBranch)}) to (${chalk.yellow(prompts.branch)}), and there may be some incompatibilities in the authority, do you want to continue?`;
      }
      //
      return `You are about to upgrade from (${chalk.yellow(currentBranch)}) to (${chalk.yellow(prompts.branch)})，and there may be some incompatibilities, do you want to continue?`;
    },
    when:function(prompts){
      //
      if(currentBranch !== currentTagBranch || currentBranch !== prompts.branch){
        //
        return true;
      }
      //
      return false;
    },
    'default':false
  }]);
  //
  if(answer.continue){
    const type = woOptions.TYPE;
    // 获取对应升级分支
    await getGitBranchFiles({
      type,
      branch:answer.branch
    });
    //
    // 获取升级transform
    const transformDir = path.resolve(__dirname, `../generators/${type}/transform`);
    if(!fs.existsSync(transformDir)){
      //
      logError('There is no any transform files');
      //
      process.exit(0);
    }
    // 获取transform文件目录
    const files = fs.readdirSync(transformDir);
    const transformers = files.filter(file => {
      // 返回所有js文件
      return /\.js$/.test(file);
    }).map(file => {
      // 返回文件名，去除后缀
      return file.replace(/\.js$/,'');
    });
    // start
    updateStart(summaryFilePath);
    // 
    transformers.forEach(async transformName=>{
      //
      const filePath = `${transformDir}/${transformName}.js`;
      // 创建临时transform文件
      const tmpFilePath = path.join(
        require('os').tmpdir(),
        `./${transformName}.js`,
      );
      console.log('temp file path',tmpFilePath);
      const currentFile = await updateStart(tmpFilePath);
      const tmpTransformFile = path.resolve(__dirname,'../transform/transform.js');
      const content = `
      var transform = require('${tmpTransformFile}');
      module.exports = (file,api,options)=>{
        
        return transform(file,api,options,'${filePath}');
      }
      `
      await updateWriteFile(currentFile,content);
      // 关闭
      await currentFile.close();
      //
      await exports.transform(transformName,'babylon',tmpFilePath,{});
    })

    // 删除汇总文件
    updateCleanup(summaryFilePath);
  }
};
//
exports.transform = async function(transformer,parser,transformerFilePath,options){
  console.log(chalk.bgGreen.bold('Transform'), transformer);
  //
  const args = [process.cwd()].concat(
    exports.getRunnerArgs(transformerFilePath),
    parser,{
      ...options
    }
  );
  //
  try{
    if (process.env.NODE_ENV === 'local') {
      console.log(`Running jscodeshift with: ${args.join(' ')}`);
    }
    //
    await exec(jscodeshiftBin, args, {
      stdio: 'inherit',
      stripEof: false,
    });
    // 删除临时文件
    updateCleanup(transformerFilePath);
  }catch(err){
    console.error(err);
    if (process.env.NODE_ENV === 'local') {
      const errorLogFile = path.join(__dirname, './error.log');
      //
      fs.appendFileSync(errorLogFile, err);
      fs.appendFileSync(errorLogFile, '\n');
    }
  }
}

exports.getRunnerArgs = function(transformerPath,parser='babylon',options={}){
  //
  const args = ['--verbose=2', '--ignore-pattern=**/node_modules'];
  //
  // limit usage for cpus
  const cpus = options.cpus || Math.max(2, Math.ceil(os.cpus().length / 3));
  args.push('--cpus', cpus);

  // https://github.com/facebook/jscodeshift/blob/master/src/Runner.js#L255
  // https://github.com/facebook/jscodeshift/blob/master/src/Worker.js#L50
  args.push('--no-babel');
  //
  args.push('--parser', parser);
  //
  args.push('--parser-config', babylonConfig);
  args.push('--extensions=tsx,ts,jsx,js');
  //
  args.push('--transform', transformerPath);
  //
  args.push('--ignore-config', ignoreConfig);
  //
  if (options.gitignore) {
    args.push('--ignore-config', options.gitignore);
  }
  //
  if (options.style) {
    args.push('--importStyles');
  }
  //
  // args.push('--antdPkgNames=antd,@alipay/bigfish/antd');
  //
  return args;
}

// description
exports.description = "update project files";
// usage
exports.usage = "wo up-project";
// options
exports.options = {};

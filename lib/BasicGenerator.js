const Generator = require("yeoman-generator");
const inquirer = require('inquirer');
const glob = require("glob");
const { statSync } = require("fs-extra");
const path = require('path');
const debug = require("debug")("wo:BasicGenerator");
const {logError} = require('./BasicUtil');
//
function noop() {
  //
  return true;
}
//
class BasicGenerator extends Generator {
  constructor(opts = {}) {
    // console.log('basic generator constructor',opts);
    super(opts);
    //
    this.name = opts.name;
  }
  //
  writeFiles({context,filterFiles=noop,type}){
    //
    debug(`context: ${JSON.stringify(context)}`);
    //
    glob
      .sync("**/*", {
        cwd: path.resolve(__dirname, `./generators/${type}/template`),
        dot: true
      })
      .filter(filterFiles)
      .forEach(file => {
        //
        debug(`copy ${file}`);
        //
        const filePath = path.resolve(__dirname, `./generators/${type}/template/${file}`);
        //
        if (statSync(filePath).isFile()) {
          try {
            //
            this.fs.copyTpl(
              filePath,
              this.destinationPath(file.replace(/^_/, ".")),
              context
            );
          } catch (error) { // copyTpl报错直接copy
            logError('Generator to copy file error',error);
            //
            /* this.fs.copy(
              filePath,
              this.destinationPath(file.replace(/^_/, ".")),
              {ignoreNoMatch: true},
              context
            ); */
          }
          //
        }
      })
  }
  // 改写默认的prompt方法使用inquirer.prompt
  prompt(questions,answers={}) {
    //
    if(process.send){
      //
      process.send({ type: "prompt" });
    }
    process.emit("message", { type: "prompt" });
    // 调整不使用geoman-generator带的prompt,默认的prompt不能传递参数
    return inquirer.prompt(questions,answers);
  }
}
//
module.exports = BasicGenerator;

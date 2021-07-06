/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */

const BasicGenerator = require('./BasicGenerator');
const BasicUtil = require('./BasicUtil');

class WoGenerator extends BasicGenerator {
  constructor(opts) {
    // console.log('generator options',opts);
    super(opts);
    const {answers} = opts;
    // 参数值
    this.answers = answers;
    const meta = BasicUtil.getGeneratorMeta(this.answers.type);
    // 模板meta.prompts信息作为questions
    this.questions = meta && meta.prompts;
  }
  //
  prompting() {
    const questions = BasicUtil.getPrompting(this.questions, this.answers);
    //
    return this.prompt(questions,this.answers).then(props => {
      //
      this.answers = Object.assign(this.answers, props);
      //
      return this.answers;
    });
  }
  //
  writing() {
    const answers = this.answers || {};
    // console.log('writing prompts answers',answers);
    //
    this.writeFiles({
      context: answers,
      filterFiles: f => {
        // 不进行ts文件过滤处理
        /*const { typescript } = prompts;
        if(!typescript && BasicUtil.isTsFile(f)) {
          //
          return false
        }*/
        // 忽略.git目录
        if (BasicUtil.isGitFile(f)) return false;
        //
        return true;
      },
      type: this.answers.type
    });
  }
  // 跳过依赖安装
  //   install() {}
}
module.exports = WoGenerator;

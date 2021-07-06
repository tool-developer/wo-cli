/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */

const {logError} = require('./BasicUtil');
//
const run = async config => {
  const cmd = config.cmd || 'init';
  const args = config.args || {};
  //
  try {
    // 导入子命令对应的模块并执行run方法
    await require(`./scripts/${cmd}`).run(args);
  } catch (error) {
    //
    logError(error.message);
    // 如果没有子命令默认走help
    require('../lib/help').run(args);
  }
};
module.exports = run;

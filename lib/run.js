const cmdRun = require('./cmd');
//
const run = async config => {
  if(process.send){
    //
    process.send({ type: 'prompt' });
  }
  // 如果用户输入了子命令 子命令不是init调用cmd执行scripts中对应模块的逻辑
  return cmdRun(config);
};
//
module.exports = run;

/**
 * 解析项目目录下.wo文件  读取配置
 */
// import/no-unresolved
const { parse } = require('dotenv');
const { join } = require('path');
const { existsSync, readFileSync } = require('fs-extra');

exports.load = function() {
  const baseEnvPath = join(process.cwd(), '.wo');
  if (existsSync(baseEnvPath)) {
    const parsed = parse(readFileSync(baseEnvPath), 'utf-8');
    //
    return parsed || {};
  }
  //
  return {};
};

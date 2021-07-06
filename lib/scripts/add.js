/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */
/**
 * 添加新模板
 */
const path = require('path');
const fse = require('fs-extra');
const fs = fse.promises;
const exec = require('execa');

const { logGreen, logError } = require('../BasicUtil');

// git
const gitAddCommit = async ({desc,branch}) => {
  const gitArgs = ['add', '.'];
  const cwd = path.resolve(__dirname, '../meta');
  await exec('git', gitArgs, { cwd });
  const commitArgs = ['commit', '-m', `${desc || 'feat:更新'}`];
  await exec('git', commitArgs, { cwd });
  await exec('git', ['push', 'origin', branch || 'main'], { cwd });
};
//
exports.run = async (opts = {}) => {
  if (!opts.name || !opts.repo) {
    //
    return logGreen(`See the 'wo add --name test --repo http://gitlab.xxx.xx --desc xxxx'`);
  }
  //
  const {name,repo,desc,branch} = opts;
  const typesPath = path.resolve(__dirname, '../meta/types.json');
  if(!fse.existsSync(typesPath)){

    logError('No meta config file, to resolve this: wo update --meta');
    //
    return process.exit(0);
  }

  try {
    //
    const types = require(typesPath);
    if (types[name]) { // 模板名称重复
      if (types[name].repository === repo) { // 如果仓库地址一样
        //
        return logError('Duplicate template, see the wo list');
      }
    } else {
      types[name] = {};
    }
    types[name].repository = repo;
    types[name].description = desc || name;
    //
    await fs.writeFile(typesPath, JSON.stringify(types, null, ' '));
    await gitAddCommit({desc,branch});
    //
    return logGreen('Add a new template success');
  } catch (error) {
    //
    return logError(error);
  }
};
// description
exports.description = 'create a new project type template';
// usage
exports.usage = 'wo add [options]';
// options
exports.options = {
  '--name': 'Set your template name',
  '--repo': 'Set your template repository',
  '--desc': 'A short introduction to setting up a template',
  '--branch': 'Push origin branch name, default main',
};

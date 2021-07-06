/**
 * 添加新模板
 */
const path = require('path');
const fse = require('fs-extra');
const fs = fse.promises;
const exec = require('execa');

const { logGreen, logError } = require('../BasicUtil');

// git
const gitAddCommit = async ({desc}) => {
  const gitArgs = ['add', '.'];
  const cwd = path.resolve(__dirname, '../meta');
  await exec('git', gitArgs, { cwd });
  const commitArgs = ['commit', '-m', `${desc || 'feat:更新'}`];
  await exec('git', commitArgs, { cwd });
  await exec('git', ['push', 'origin', 'master'], { cwd });
};
//
exports.run = async (opts = {}) => {
  if (!opts.name || !opts.repo) {
    //
    return logGreen(`See the 'wo add --name test --repo http://gitlab.xxx.xx --desc xxxx'`);
  }
  //
  const {name} = opts;
  const {repo} = opts;
  const {desc} = opts;
  const typesPath = path.resolve(__dirname, '../meta/types.json');
  if(!fse.existsSync(typesPath)){

    logError('No meta config file, to resolve this: wo update --meta');
    //
    return process.exit(0);
  }

  try {
    //
    const result = await fs.readFile(typesPath).then(res => {
      const json = JSON.parse(res.toString());
      if (json[name]) { // 模板名称重复
        if (json[name].repository === repo) { // 如果仓库地址一样
          //
          return logError('Duplicate template, see the wo list');
        }
      } else {
        json[name] = {};
      }
      json[name].repository = repo;
      json[name].description = desc || name;
      //
      return json;
    });
    //
    await fs.writeFile(typesPath, JSON.stringify(result, null, ' '));
    await gitAddCommit({desc});
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
};

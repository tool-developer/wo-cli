/**
 * 查看所有的模板
 */
const chalk = require('chalk');
const { logGreen,logError } = require('../BasicUtil');
const types = require('../meta/types.json');

const parseTypes = () => {
  //
  if (types) {
    //
    const templates = Object.keys(types);
    //
    console.log(`Available template:`);
    //
    templates.forEach((name)=>{
      const type = types[name];
      if(type){
        logGreen(
          `${name}\n${' '.padEnd(6)} -repository: ${chalk.gray(type.repository)}\n${' '.padEnd(6)} -description: ${chalk.gray(type.description) || ''}`
        );
      }
    });
  } else {
    //
    logError(`Can't find any template, to resolve: wo update --meta --type `);
  }
}
//
exports.run = () => {
  try {
    //
    parseTypes();
  } catch (error) {
    //
    console.log(error);
  }
};

// description
exports.description = 'See the all templates';
// usage
exports.usage = 'wo list';

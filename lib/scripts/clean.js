/* eslint global-require: "warn" */
/* eslint import/no-dynamic-require:"off" */
const fs = require('fs-extra');
const {resolve} = require('path');
const chalk = require('chalk');
const debug = require('debug')('wo:scripts/clean');
//
module.exports.run = function(){
  //
  debug('to run clean');
  [resolve(__dirname,'../generators'),resolve(__dirname,'../meta')].forEach(file=>{
    //
    fs.removeSync(file);
  })
  //
  console.log(`   ${chalk.green('Clean generator files success, after this: wo update --meta --type')}`);
};

// description
module.exports.description = 'clean cli generator files';
// usage
module.exports.usage = 'wo clean';
// options
module.exports.options = {

};
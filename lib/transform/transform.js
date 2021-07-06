const updateFun = require('../BasicUpdate');
// 临时中转transform文件,暴露脚手架内方法到模板中真实的transformer
module.exports = (file,api,options,transformFilePath)=>{
    //
    var transformer = require(transformFilePath);
    //
    return transformer(updateFun)(file,api,options);
}
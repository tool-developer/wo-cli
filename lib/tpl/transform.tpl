var transform = require('${tmpTransformFile}');
    module.exports = (file,api,options)=>{

    return transform(file,api,options,'${filePath}');
}
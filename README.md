# wo-cli
快速开发脚手架

可以自定义模板，从而创建对应模板类型项目，模板不受语言框架限制(React,Vue均可)，具体参考[添加新模板类型](#添加新模板类型)。



## 操作步骤
第一步：全局安装脚手架
```
npm i -g @tool-developer/wo-cli
```

第二步：创建空项目目录(非空目录会提示是否覆盖)
```
mkdir projectName && cd projectName
```

第三步：项目初始化(拉取项目模板)

建议：如果不是首次安装使用脚手架，建议都先经过第六步操作，升级脚手架模板和元数据信息。
```
wo
```
or
```
wo [init] [options]

wo [init] --name projectName --port 8000
```

第四步：根据项目prompts提示进行设置，常见prompts说明：
```
name:输入项目名称，默认使用文件名

type:项目类型，目前支持fe和ae两种文件类型，更多类型可参考添加项目模板类型

branch:分支选择，对应类型模板仓库分支

description:项目描述，会添加到package.json中
```
`注意`: 
1. 不同的项目模板类型prompts不同；
2. 如果已经通过options方式设置对应prompts值，不会再次要求输入；

第五步：快速创建页面(使用页面模板)
```
wo page [pageName[,pageName,...]] [options]
```
举例说明：
```
wo page test/t1 --template loading
```
使用内部的loading页面模板创建了test/t1文件，文件内容，以及目录结构以实际页面模板为准。

如果不想生成的文件都为index.*，可以使用--no-index选项
```
wo page user/test2 --no-index
```

`注意`:如果本身页面模板就没有index.*相关文件，是可以不使用no-index选项的，使用了会得到如下提示：

>The 'index' is not index.* files, can not set 'not-index' option 

使用过程中，如果不清楚有什么页面模板，可以通过以下操作查看页面模板列表：
```
wo page --list
```

第六步：升级模板类型和元数据信息(建议创建新项目之前，都执行该步骤，保证本地模板是最新的)

```
wo update --meta --type
```
or 

只升级具体类型模板
```
wo update --type wx
```

## 命令详解
如果记不住有哪些操作命令，以及各个命令是如何使用的，以及相关参数，可以使用help，很容易就可以得到相应命令的帮助信息。

### 命令帮助
#### 查看脚手架实现了哪些命令
```
wo -h
```
or
```
wo --help
```

#### 查看某个命令，更加详细帮助信息

wo [cmd] -h/--help

wo help [cmd]
```
wo help list
```
or
```
wo list -h
```
or 
```
wo list --help
```

## 添加新命令
只需要在scripts目录下创建对应[cmd].js文件，即可创建对应命令。

对于up-*相关的操作，除了添加文件之外，还需要在update.js中添加参数说明即可。

### 命令文件格式约定
```
// 处理入口方法
exports.run = async(opts={})=>{
  // 接收参数，参数从opts中得到，已经进行了parse转换处理
  // 具体处理
}
// 该命令描述信息，会显示在help中
exports.description = '';
// 用法，会显示在help中
exports.usage = 'wo [cmd] [options]';
// 参数options，以及说明，会显示在help中
exports.options = {
  '--name':"Set your template name"
}
// 不显示该命令
exports.hide = true;// 默认为false
```
强烈建议description,usage,options放在文件的最底部，方便查看。

### 添加新模板类型
相关模板建议放置到专门的基础权限模板仓库分组中，仓库地址为：
```
https://github.com/tool-developer-template/
```
建议命名格式采取wo-template-[type]的方式，便于快速找到对应模板仓库地址。

其中模板元数据信息仓库地址：
```
https://github.com/tool-developer-template/wo-template-meta.git
```
wo-template-meta中只有一个types.json的文件，记录当前已添加的模板类型，大概格式如下：
```
{
 "wx": {
  "repository": "https://github.com/tool-developer-template/wo-template-wx.git",
  "description": "微信小程序"
 }
}
```
可以知道，包含了某个模板类型(ae)中的仓库地址(repository)，以及模板类型描述(description)等几个信息。

脚手架通过读取该文件，就可以得到当前模板类型列表，以及对应模板的仓库地址，从而将其clone到本地，这样脚手架就可以通过这些信息创建对应的项目类型。

### 模板的基本结构
可以随意点开一个模板，可以看到类似这样的目录结构：
```
meta.js:设置模板初始化完成之后的提示操作信息

template/:具体的项目目录结构，内部可设置变量，经过ejs模板引擎解析处理

pages/:具体页面模板，里面的每一个文件夹名，就对应一个页面模板，里面的文件结构，就对应页面模板的具体内容

transform/:模板升级转换处理

.wo:项目环境配置文件

```

meta.js文件信息说明：
```
// 项目创建完成后输出信息
exports.run ={
  "yarn test":"Start to test the project"
};
// 项目创建过程中的prompts
// 参考:https://github.com/SBoudrias/Inquirer.js/blob/master/README.md
exports.prompts = {
  "name": {
      "message": "What's the project name?",
      "default": "`${this.name}`"
  },
  "description": {
      "name": "description",
      "message": "What's your project description?"
  }
}
```

.wo 关键信息
```
TYPE: 模板类型

SRC_PAGES: 页面文件目录

BRANCH: 分支信息
```


### 项目模板添加
模板的添加过程，就是将我们创建的遵循一定目录结构的文件提交到git仓库中，然后将该仓库地址信息添加到wo-template-meta/types.json中。

这个操作过程，可以纯手动完成，就像操作普通的git操作流程那样即可。

也可以通过脚手架命令操作：
```
wo add --name test --repo https://github.com/tool-developer-template/wo-template-test.git --desc 测试
```

需要注意的是：
1. 我们的模板需要设置为public仓库类型；
2. 添加的repo地址，需要使用https的地址，不要使用git@打头的地址；

### 项目模板移除
想要删除某种项目模板类型，只需要将其从wo-template-meta/types.json中移除，重新提交即可。对应关联的git仓库地址，可以不用删除(建议也不要删除)。

### 页面模板添加
页面模板，只需要在模板仓库地址中有pages目录下，放置提取的页面结构文件即可。

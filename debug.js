// 加载babel预编译
require('babel-core/register')
require("babel-core").transform()
const jungle = require('./src').default
jungle(`
const a = 1
console.log(a)
`)

const jungle = require('../src').default
// jungle(`const a = 100 + 122
// let b = a + 300
// `)
jungle(`
const f = function(hello){
  function f2(a,b,c){
    const s = a+b+c
    const c = a+b+c
  }
}
`)

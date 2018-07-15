const fs = require('fs')
const path = require('path')
const jungle = require('../src').default
// jungle(`const a = 100 + 122
// let b = a + 300
// `)
// jungle(`
// const f = function d(hello){
//   function f2(a,b,c){
//     const s = a+b+c
//     const c = f()
//   }
// }
// `)
// jungle(`
// if(1==1){
//   const a = 1
// }else if(f){

// }else{}
// `)
// jungle(`
// for(let i = 0; i < 10; i++) {
//   a()
// }
// `)
// jungle(`
// c[d+1](1+2)
// `)

// jungle(`
// ({'a':1,1:22,c:{ddd:333}})
// `)

// jungle(`
// [1,2,{a:333}];;;
// `)

// jungle(`"
// use strict";
// "use 2222"
// 11
// "use strict"
// function a(){
//   "use strict"
//   const a = []
//   "use strict"
// }
// `)

// jungle(`
// debugger;
// debugger
// a;
// `)

// jungle(`
// with (window) {
//   console.log(a)
// }
// `)

// jungle(`
// function a(){
//   return function(){};;;
// }
// `)

// jungle(`
// const a = 1
// +
// '222'
// `)

// jungle(`
// l:for(let a=0;i<3;i++){
//   if(a){
//     continue
//     continue l;;
//   }
//   break l;
// }
// `)

// jungle(`
// a =1;
// b=2
// `)

// jungle(`
// l1:switch(a){
//   case 1:{
//     a()
//     break l1;
//   }
//   case 2:
//     if(b){
//     }
//   default:
//     a =3
// }
// `)

// jungle(`
// throw 'error';
// `)

// jungle(`
// try{}catch(e){}
// try{}finally{}
// try{
//   a()
// }catch(a){
//   throw a
// }finally{
//   b()
// }
// `)

// jungle(`
// while(a){
//   a--
// }
// `)

// jungle(`
// do{
//   a--
//   break;
// }while(a)
// `)

// jungle(`
// for(a in obj){
//   b()
// }
// `)

// jungle(`
// for(a of obj){
//   b()
// }
// `)

// jungle(`
// this.a
// a.this.d
// a[this].d
// `)

// jungle(`const a= 1, b=2+43
// ;`)

// jungle(`
// ++aa
// `)

// jungle(`({
//   get ff(){}
// })
// `)

// jungle(`
// -1 + typeof 1 + d + delete 2 * void (dd)
// `)

jungle(fs.readFileSync(path.join(__dirname, './string.js')).toString())

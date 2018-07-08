import Lexer from './lexer'
import Parser from './parser'

export default function(sourceCode) {
  const lexer = new Lexer(sourceCode)
  // console.log(lexer.tokens)
  const parser = new Parser(lexer)
  console.log(parser)
}

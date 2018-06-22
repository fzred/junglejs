import Lexer from './lexer'
import Parser from './parser'

export default function(sourceCode) {
  const lexer = new Lexer(sourceCode)
  const parser = new Parser(lexer)
  console.log(parser)
}

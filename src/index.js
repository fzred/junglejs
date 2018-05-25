
import Lexer from './lexer'

export default function (sourceCode) {
  const lexer = new Lexer(sourceCode)
  console.log(lexer)
}

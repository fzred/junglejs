
import Lexer from './Lexer'

export default function (sourceCode) {
  const lexer = new Lexer(sourceCode)
  console.log(lexer)
}

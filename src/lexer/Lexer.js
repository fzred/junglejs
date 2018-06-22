/**
 * 词法解析器
 */
import Token from './Token'
import keywords from './keywords'
import tokenTypes from './tokenTypes'
import { verifyIdentifier, verifyNumber } from '../utils'

class Lexer {
  constructor(sourceCode) {
    console.log(sourceCode)
    this.sourceCode = sourceCode
    this.lineNumber = 0
    this.position = 0
    this.char = ''
    this.tokens = []
    this.lexing()
  }

  readChar() {
    if (this.position >= this.sourceCode.length) {
      this.char = null // 源码读取完毕
    } else {
      this.char = this.sourceCode[this.position]
    }
    this.position++
  }

  get nextChar() {
    if (this.position >= this.sourceCode.length) {
      return null
    }
    return this.sourceCode[this.position]
  }

  /**
   * 跳过空格及换行
   */
  skipSpack() {
    while (this.char === ' ') {
      this.readChar()
    }
  }

  createKeywordToken(identifier) {
    switch (identifier) {
      case 'with':
        return new Token(tokenTypes.WITH, identifier, this.lineNumber)
      case 'return':
        return new Token(tokenTypes.RETURN, identifier, this.lineNumber)
      case 'debugger':
        return new Token(tokenTypes.DEBUGGER, identifier, this.lineNumber)
      case 'const':
        return new Token(tokenTypes.CONST, identifier, this.lineNumber)
      case 'var':
        return new Token(tokenTypes.VAR, identifier, this.lineNumber)
      case 'let':
        return new Token(tokenTypes.LET, identifier, this.lineNumber)
      case 'if':
        return new Token(tokenTypes.IF, identifier, this.lineNumber)
      case 'else':
        return new Token(tokenTypes.ELSE, identifier, this.lineNumber)
      case 'function':
        return new Token(tokenTypes.FUNCTION, identifier, this.lineNumber)
      case 'for':
        return new Token(tokenTypes.FOR, identifier, this.lineNumber)
      case 'in':
        return new Token(tokenTypes.IN, identifier, this.lineNumber)
      case 'true':
      case 'false':
        return new Token(tokenTypes.BOOLEAN, identifier, this.lineNumber)
      // TODO
      default:
        return new Token(tokenTypes.ILLEGAL, identifier, this.lineNumber)
    }
  }

  /**
   * 读取字符串 Token
   * @param {*} c ‘ or "
   */
  readStringToken(c) {
    let str = ''
    this.readChar()
    while (this.char !== c && this.char !== null) {
      str += this.char
      this.readChar()
    }
    if (this.char !== c) {
      return new Token(tokenTypes.ILLEGAL, '', this.lineNumber)
    }

    return new Token(tokenTypes.STRING, str, this.lineNumber)
  }

  nextToken() {
    this.readChar()
    this.skipSpack()
    switch (this.char) {
      case '\r':
      case '\n':
        this.lineNumber++
        return new Token(tokenTypes.NEWLINE, '\n', this.lineNumber)
      case ';':
        return new Token(tokenTypes.SEMICOLON, this.char, this.lineNumber)
      case '"':
      case "'":
        return this.readStringToken(this.char)
      case '=':
        if (this.nextChar === '=') {
          this.readChar()
          return new Token(tokenTypes.EQ, '==', this.lineNumber)
        } else {
          return new Token(tokenTypes.ASSIGN_SIGN, this.char, this.lineNumber)
        }
      case '!':
        if (this.nextChar === '=') {
          this.readChar()
          return new Token(tokenTypes.NOT_EQ, '!=', this.lineNumber)
        } else {
          return new Token(tokenTypes.BANG_SIGN, this.char, this.lineNumber)
        }
      case '+':
        if (this.nextChar === '+') {
          this.readChar()
          return new Token(tokenTypes.INC_DEC, '++', this.lineNumber)
        }
        return new Token(tokenTypes.PLUS_SIGN, this.char, this.lineNumber)
      case '-':
        if (this.nextChar === '-') {
          this.readChar()
          return new Token(tokenTypes.INC_DEC, '--', this.lineNumber)
        }
        return new Token(tokenTypes.MINUS_SIGN, this.char, this.lineNumber)
      case '/':
        return new Token(tokenTypes.SLASH, this.char, this.lineNumber)
      case '*':
        return new Token(tokenTypes.ASTERISK, this.char, this.lineNumber)
      case '(':
        return new Token(tokenTypes.LEFT_PARENT, this.char, this.lineNumber)
      case ')':
        return new Token(tokenTypes.RIGHT_PARENT, this.char, this.lineNumber)
      case '<':
        return new Token(tokenTypes.LT, this.char, this.lineNumber)
      case '>':
        return new Token(tokenTypes.GT, this.char, this.lineNumber)
      case '{':
        return new Token(tokenTypes.LEFT_BRACE, this.char, this.lineNumber)
      case '}':
        return new Token(tokenTypes.RIGHT_BRACE, this.char, this.lineNumber)
      case ',':
        return new Token(tokenTypes.COMMA, this.char, this.lineNumber)
      case '[':
        return new Token(
          tokenTypes.LEFT_SQUARE_BRACKET,
          this.char,
          this.lineNumber
        )
      case ']':
        return new Token(
          tokenTypes.RIGHT_SQUARE_BRACKET,
          this.char,
          this.lineNumber
        )
      case '.':
        return new Token(tokenTypes.DOT, this.char, this.lineNumber)
      case ':':
        return new Token(tokenTypes.COLON, this.char, this.lineNumber)
      // TODO
      default:
        let identifier = this.char
        if (identifier === null) {
          return new Token(tokenTypes.EOF, '', this.lineNumber)
        }
        if (verifyNumber(identifier)) {
          while (verifyNumber(identifier + this.nextChar)) {
            this.readChar()
            identifier += this.char
          }
          return new Token(tokenTypes.NUMBER, identifier, this.lineNumber)
        } else if (verifyIdentifier(identifier)) {
          while (verifyIdentifier(identifier + this.nextChar)) {
            this.readChar()
            identifier += this.char
          }
          if (keywords.indexOf(identifier) > -1) {
            // 关键字处理
            return this.createKeywordToken(identifier)
          }
          return new Token(tokenTypes.IDENTIFIER, identifier, this.lineNumber)
        } else {
          return new Token(tokenTypes.ILLEGAL, identifier, this.lineNumber)
        }
    }
  }

  lexing() {
    let token
    do {
      token = this.nextToken()
      if (token && token.tokenType !== tokenTypes.NEWLINE) {
        this.tokens.push(token)
      }
    } while (
      token.tokenType !== tokenTypes.ILLEGAL &&
      token.tokenType !== tokenTypes.EOF
    )
  }
}

export default Lexer

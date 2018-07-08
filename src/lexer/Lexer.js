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
    this.lineNumber = 1
    this.columnNumber = -1
    this.position = 0
    this.char = ''
    this.tokens = []
    this.loc = {
      start: {
        line: 0,
        column: 0,
      },
      end: {
        line: 0,
        column: 0,
      },
    }
    this.lexing()
  }

  readChar() {
    if (this.position >= this.sourceCode.length) {
      this.char = null // 源码读取完毕
    } else {
      this.char = this.sourceCode[this.position]
    }
    this.columnNumber++
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
        return this.createToken(tokenTypes.WITH, identifier)
      case 'return':
        return this.createToken(tokenTypes.RETURN, identifier)
      case 'debugger':
        return this.createToken(tokenTypes.DEBUGGER, identifier)
      case 'const':
        return this.createToken(tokenTypes.CONST, identifier)
      case 'var':
        return this.createToken(tokenTypes.VAR, identifier)
      case 'let':
        return this.createToken(tokenTypes.LET, identifier)
      case 'if':
        return this.createToken(tokenTypes.IF, identifier)
      case 'else':
        return this.createToken(tokenTypes.ELSE, identifier)
      case 'function':
        return this.createToken(tokenTypes.FUNCTION, identifier)
      case 'for':
        return this.createToken(tokenTypes.FOR, identifier)
      case 'in':
        return this.createToken(tokenTypes.IN, identifier)
      case 'continue':
        return this.createToken(tokenTypes.CONTINUE, identifier)
      case 'break':
        return this.createToken(tokenTypes.BREAK, identifier)
      case 'switch':
        return this.createToken(tokenTypes.SWITCH, identifier)
      case 'case':
        return this.createToken(tokenTypes.CASE, identifier)
      case 'default':
        return this.createToken(tokenTypes.DEFAULT, identifier)
      case 'throw':
        return this.createToken(tokenTypes.THROW, identifier)
      case 'try':
        return this.createToken(tokenTypes.TRY, identifier)
      case 'catch':
        return this.createToken(tokenTypes.CATCH, identifier)
      case 'finally':
        return this.createToken(tokenTypes.FINALLY, identifier)
      case 'while':
        return this.createToken(tokenTypes.WHILE, identifier)
      case 'do':
        return this.createToken(tokenTypes.DO, identifier)
      case 'in':
        return this.createToken(tokenTypes.IN, identifier)
      case 'of':
        return this.createToken(tokenTypes.OF, identifier)
      case 'this':
        return this.createToken(tokenTypes.THIS, identifier)
      case 'true':
      case 'false':
        return this.createToken(tokenTypes.BOOLEAN, identifier)
      case 'typeof':
        return this.createToken(tokenTypes.TYPEOF, identifier)
      case 'void':
        return this.createToken(tokenTypes.VOID, identifier)
      case 'delete':
        return this.createToken(tokenTypes.DELETE, identifier)
      // TODO
      default:
        return this.createToken(tokenTypes.ILLEGAL, identifier)
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
      return this.createToken(tokenTypes.ILLEGAL, '')
    }

    return this.createToken(tokenTypes.STRING, str)
  }

  createToken(type, text) {
    this.loc.end.line = this.lineNumber
    this.loc.end.column = this.columnNumber
    const loc = {
      start: {
        line: this.loc.start.line,
        column: this.loc.start.column,
      },
      end: {
        line: this.loc.end.line,
        column: this.loc.end.column + 1,
      },
    }
    return new Token(type, text, loc)
  }

  nextToken() {
    this.readChar()
    this.skipSpack()
    this.loc.start.line = this.lineNumber
    this.loc.start.column = this.columnNumber

    switch (this.char) {
      case '\r':
      case '\n':
        this.lineNumber++
        this.columnNumber = -1
        return this.createToken(tokenTypes.NEWLINE, '\n')
      case ';':
        return this.createToken(tokenTypes.SEMICOLON, this.char)
      case '"':
      case "'":
        return this.readStringToken(this.char)
      case '=':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.EQ, '==')
        } else {
          return this.createToken(tokenTypes.ASSIGN_SIGN, this.char)
        }
      case '!':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.NOT_EQ, '!=')
        } else {
          return this.createToken(tokenTypes.BANG_SIGN, this.char)
        }
      case '+':
        if (this.nextChar === '+') {
          this.readChar()
          return this.createToken(tokenTypes.INC_DEC, '++')
        }
        return this.createToken(tokenTypes.PLUS_SIGN, this.char)
      case '-':
        if (this.nextChar === '-') {
          this.readChar()
          return this.createToken(tokenTypes.INC_DEC, '--')
        }
        return this.createToken(tokenTypes.MINUS_SIGN, this.char)
      case '/':
        return this.createToken(tokenTypes.SLASH, this.char)
      case '*':
        return this.createToken(tokenTypes.ASTERISK, this.char)
      case '(':
        return this.createToken(tokenTypes.LEFT_PARENT, this.char)
      case ')':
        return this.createToken(tokenTypes.RIGHT_PARENT, this.char)
      case '<':
        return this.createToken(tokenTypes.LT, this.char)
      case '>':
        return this.createToken(tokenTypes.GT, this.char)
      case '{':
        return this.createToken(tokenTypes.LEFT_BRACE, this.char)
      case '}':
        return this.createToken(tokenTypes.RIGHT_BRACE, this.char)
      case ',':
        return this.createToken(tokenTypes.COMMA, this.char)
      case '[':
        return this.createToken(tokenTypes.LEFT_SQUARE_BRACKET, this.char)
      case ']':
        return this.createToken(tokenTypes.RIGHT_SQUARE_BRACKET, this.char)
      case '.':
        return this.createToken(tokenTypes.DOT, this.char)
      case ':':
        return this.createToken(tokenTypes.COLON, this.char)
      case '~':
        return this.createToken(tokenTypes.TILDE, this.char)
      // TODO
      default:
        let identifier = this.char
        if (identifier === null) {
          return this.createToken(tokenTypes.EOF, '')
        }
        if (verifyNumber(identifier)) {
          while (verifyNumber(identifier + this.nextChar)) {
            this.readChar()
            identifier += this.char
          }
          return this.createToken(tokenTypes.NUMBER, identifier)
        } else if (verifyIdentifier(identifier)) {
          while (verifyIdentifier(identifier + this.nextChar)) {
            this.readChar()
            identifier += this.char
          }
          if (keywords.indexOf(identifier) > -1) {
            // 关键字处理
            return this.createKeywordToken(identifier)
          }
          return this.createToken(tokenTypes.IDENTIFIER, identifier)
        } else {
          return this.createToken(tokenTypes.ILLEGAL, identifier)
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

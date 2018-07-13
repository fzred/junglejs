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
      throw 'ILLEGAL'
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
      case '"':
      case "'":
        return this.readStringToken(this.char)
      case '=':
        if (this.nextChar === '=') {
          this.readChar()
          let value = '=='
          if (this.nextChar === '=') {
            this.readChar()
            value += '='
          }
          return this.createToken(tokenTypes.Punctuator, value)
        } else if (this.nextChar === '>') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '=>')
        }
      case '!':
        if (this.nextChar === '=') {
          this.readChar()
          let value = '!='
          if (this.nextChar === '=') {
            this.readChar()
            value += '='
          }
          return this.createToken(tokenTypes.Punctuator, value)
        }
      case '+':
        if (this.nextChar === '+') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '++')
        } else if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '+=')
        }
      case '-':
        if (this.nextChar === '-') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '--')
        } else if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '-=')
        }
      case '/':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '/=')
        }
      case '*':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '*=')
        } else if (this.nextChar === '*') {
          this.readChar()
          if (this.nextChar === '=') {
            this.readChar()
            return this.createToken(tokenTypes.Punctuator, '**=')
          }
          return this.createToken(tokenTypes.Punctuator, '**')
        }
      case '%':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '%=')
        }
      case '|':
        if (this.nextChar === '|') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '||')
        } else if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '|=')
        }
      case '&':
        if (this.nextChar === '&') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '&&')
        } else if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '&=')
        }
      case '^':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '^=')
        }
      case '(':
      case ')':
      case '<':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '<=')
        } else if (this.nextChar === '<') {
          this.readChar()
          if (this.nextChar === '=') {
            this.readChar()
            return this.createToken(tokenTypes.Punctuator, '<<=')
          }
          return this.createToken(tokenTypes.Punctuator, '<<')
        }
      case '>':
        if (this.nextChar === '=') {
          this.readChar()
          return this.createToken(tokenTypes.Punctuator, '>=')
        } else if (this.nextChar === '>') {
          this.readChar()
          if (this.nextChar === '>') {
            this.readChar()
            if (this.nextChar === '=') {
              this.readChar()
              return this.createToken(tokenTypes.Punctuator, '>>>=')
            }
            return this.createToken(tokenTypes.Punctuator, '>>>')
          } else if (this.nextChar === '=') {
            this.readChar()
            return this.createToken(tokenTypes.Punctuator, '>>=')
          }
          return this.createToken(tokenTypes.Punctuator, '>>')
        }
      case '{':
      case '}':
      case ',':
      case '[':
      case ']':
      case '.':
      case ':':
      case '~':
      case ';':
        return this.createToken(tokenTypes.Punctuator, this.char)
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
          if (identifier === 'true' || identifier === 'false') {
            return this.createToken(tokenTypes.BooleanLiteral, identifier)
          }
          if (keywords.indexOf(identifier) > -1) {
            // 关键字处理
            return this.createToken(tokenTypes.Keyword, identifier)
          }
          return this.createToken(tokenTypes.IDENTIFIER, identifier)
        } else {
          throw 'ILLEGAL'
        }
    }
  }

  lexing() {
    let token
    do {
      token = this.nextToken()
      if (token && token.type !== tokenTypes.NEWLINE) {
        this.tokens.push(token)
      }
    } while (token.type !== tokenTypes.EOF)
  }
}

export default Lexer

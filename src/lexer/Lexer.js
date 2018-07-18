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

  isOctalDigit(cp) {
    return cp >= 0x30 && cp <= 0x37 // 0..7
  }

  octalToDecimal(ch) {
    // \0 is not octal escape sequence
    let octal = ch !== '0'
    let code = Number(ch)
    if (this.isOctalDigit(this.nextChar.charCodeAt(0))) {
      this.readChar()
      octal = true
      code = code * 8 + Number(this.char)
      // 3 digits are only allowed when string starts
      // with 0, 1, 2, 3
      if (
        '0123'.indexOf(ch) >= 0 &&
        this.isOctalDigit(this.nextChar.charCodeAt(0))
      ) {
        this.readChar()
        code = code * 8 + Number(this.char)
      }
    }
    return {
      code: code,
      octal: octal,
    }
  }

  isHexDigit(cp) {
    return (
      (cp >= 0x30 && cp <= 0x39) || // 0..9
      (cp >= 0x41 && cp <= 0x46) || // A..F
      (cp >= 0x61 && cp <= 0x66) // a..f
    )
  }

  hexValue(ch) {
    return '0123456789abcdef'.indexOf(ch.toLowerCase())
  }

  fromCodePoint(cp) {
    return cp < 0x10000
      ? String.fromCharCode(cp)
      : String.fromCharCode(0xd800 + ((cp - 0x10000) >> 10)) +
          String.fromCharCode(0xdc00 + ((cp - 0x10000) & 1023))
  }

  scanHexEscape(prefix) {
    const len = prefix === 'u' ? 4 : 2
    let code = 0
    for (let i = 0; i < len; ++i) {
      if (this.isHexDigit(this.nextChar.charCodeAt(0))) {
        this.readChar()
        code = code * 16 + this.hexValue(this.char)
      } else {
        return null
      }
    }
    return String.fromCharCode(code)
  }

  scanUnicodeCodePointEscape() {
    let code = 0
    // At least, one hex digit is required.
    if (this.nextChar === '}') {
      throw 'ILLEGAL'
    }
    while (this.nextChar !== null) {
      this.readChar()
      if (!this.isHexDigit(this.char.charCodeAt(0))) {
        break
      }
      code = code * 16 + this.hexValue(this.char)
    }
    if (code > 0x10ffff || this.char !== '}') {
      throw 'ILLEGAL'
    }
    return this.fromCodePoint(code)
  }

  /**
   * 读取字符串 Token
   * @param {*} quote ‘ or "
   */
  readStringToken(quote) {
    let str = ''
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String
    while (this.nextChar !== null) {
      this.readChar()
      let ch = this.char
      if (ch === quote) {
        break
      } else if (ch === '\\') {
        this.readChar()
        ch = this.char
        if (ch === '\r') {
          if (this.nextChar === '\n') {
            this.readChar()
          }
          this.newLine()
        } else if (ch === '\n') {
          this.newLine()
        } else {
          switch (ch) {
            case 'n':
              str += '\n'
              break
            case 'r':
              str += '\r'
              break
            case 't':
              str += '\t'
              break
            case 'b':
              str += '\b'
              break
            case 'f':
              str += '\f'
              break
            case 'v':
              str += '\v'
              break
            case "'":
              str += "'"
              break
            case '"':
              str += '"'
              break
            case '\\':
              str += '\\'
              break
            case '8':
            case '9':
              str += ch
              break
            case 'u':
              if (this.nextChar === '{') {
                this.readChar()
                str += this.scanUnicodeCodePointEscape()
                break
              }
            case 'x':
              const unescaped = this.scanHexEscape(ch)
              if (unescaped === null) {
                throw 'ILLEGAL'
              }
              str += unescaped
              break
            default:
              if (ch && this.isOctalDigit(ch.charCodeAt(0))) {
                const octToDec = this.octalToDecimal(ch)
                str += String.fromCharCode(octToDec.code)
              } else {
                str += ch
              }
              break
          }
        }
      } else if (ch === '\r' || ch === '\n') {
        throw 'ILLEGAL'
      } else {
        str += this.char
      }
    }
    if (this.char !== quote) {
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

  newLine() {
    this.lineNumber++
    this.columnNumber = -1
  }

  isRegStart() {}

  readRegexToken() {}

  nextToken() {
    this.readChar()
    this.skipSpack()
    this.loc.start.line = this.lineNumber
    this.loc.start.column = this.columnNumber

    switch (this.char) {
      case '\r':
        if (this.nextChar === '\n') {
          this.readChar()
        }
      case '\n':
        this.newLine()
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
        if (this.isRegStart()) {
          return this.readRegexToken()
        } else if (this.nextChar === '=') {
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

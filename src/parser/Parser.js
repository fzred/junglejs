import tokenTypes from '../lexer/tokenTypes'
import {
  Pargarm,
  LetStatement,
  ConstStatement,
} from './Statement'

import {
  Expression,
  Identify,
  NumberLiteral,
} from './Expression'

class Parser {
  constructor(lexer) {
    console.log(lexer.tokens)
    this.lexer = lexer
    this.position = 0
    this.curToken = null
    this.pararm = new Pargarm()
    this.readToken()
    this.parse()
  }

  readToken() {
    this.curToken = this.nextToken
    this.position++
  }

  get nextToken() {
    return this.lexer.tokens[this.position]
  }

  get isNEWLINE() {
    return this.nextToken.tokenType === tokenTypes.NEWLINE
      || this.nextToken.tokenType === tokenTypes.SEMICOLON
  }

  parseInfixExpress(left) {
    if (this.curToken.tokenType === tokenTypes.IDENTIFIER) {
      return new Identify({
        toekn: this.curToken.toekn,
        literal: this.curToken.literal,
      })
    } else if (this.curToken.tokenType === tokenTypes.NUMBER) {
      return new NumberLiteral({
        toekn: this.curToken.toekn,
        literal: this.curToken.literal,
      })
    }
  }

  parseExpression() {
    let letExp = this.parseInfixExpress()
    while (this.nextToken.tokenType !== tokenTypes.EOF
      && !this.isNEWLINE) {
      this.readToken()
    }
    return letExp
  }

  parseLetStatement(isConst = false) {
    if (this.nextToken.tokenType !== tokenTypes.IDENTIFIER) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()

    const identify = this.curToken
    if (this.nextToken.tokenType !== tokenTypes.ASSIGN_SIGN) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()
    this.readToken()

    const expression = this.parseExpression(-1)

    if (this.nextToken.tokenType !== tokenTypes.EOF
      && !this.isNEWLINE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()

    if (isConst) {
      return new ConstStatement({
        identify,
        expression,
      })
    }
    return new LetStatement({
      identify,
      expression,
    })
  }

  parseStatement() {
    switch (this.curToken.tokenType) {
      case tokenTypes.LET:
        return this.parseLetStatement()
      case tokenTypes.CONST:
        return this.parseLetStatement(true)
      case tokenTypes.NEWLINE:
        this.readToken()
        return null
    }
    throw 'syntax error'
  }


  parse() {
    do {
      const statement = this.parseStatement()
      if (statement !== null) {
        this.pararm.statements.push(statement)
      }
    } while (this.curToken.tokenType !== tokenTypes.EOF
      && this.curToken.tokenType !== tokenTypes.ILLEGAL)
    console.log(this.pararm.statements)
  }

}

export default Parser

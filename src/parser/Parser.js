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
  InfixExpression,
} from './Expression'

class Parser {
  constructor(lexer) {
    console.log(lexer.tokens)
    this.lexer = lexer
    this.position = 0
    this.curToken = null
    // 运算符 优先级
    this.precedences = {
      [tokenTypes.EQ]: 1,
      [tokenTypes.NOT_EQ]: 1,
      [tokenTypes.LT]: 2,
      [tokenTypes.GT]: 2,
      [tokenTypes.PLUS_SIGN]: 3,
      [tokenTypes.MINUS_SIGN]: 3,
      [tokenTypes.ASTERISK]: 4,
      [tokenTypes.SLASH]: 4,
      [tokenTypes.LEFT_PARENT]: 5,
    }

    this.registerPrefixParseFns()
    this.registerInfixParseFns()
    this.pararm = new Pargarm()
    this.readToken()
    this.parse()
  }

  registerPrefixParseFns() {
    this.prefixParseFns = {
      [tokenTypes.IDENTIFIER](curToken) {
        return new Identify({
          toekn: curToken.toekn,
          literal: curToken.literal,
        })
      },
      [tokenTypes.NUMBER](curToken) {
        return new NumberLiteral({
          toekn: curToken.token,
          literal: curToken.literal,
        })
      },
    }
  }

  registerInfixParseFns() {
    function infixParse(leftExp, caller) {
      const operator = caller.curToken
      const precedence = caller.curTokenPrecedence
      caller.readToken()
      const rightExp = caller.parseExpression(precedence)
      return new InfixExpression({
        leftExpression: leftExp,
        operator,
        rightExpression: rightExp,
      })
    }
    function callParse(leftExp, caller) {

    }
    this.infixParseFns = {
      [tokenTypes.PLUS_SIGN]: infixParse,
      [tokenTypes.MINUS_SIGN]: infixParse,
      [tokenTypes.ASTERISK]: infixParse,
      [tokenTypes.SLASH]: infixParse,
      [tokenTypes.LT]: infixParse,
      [tokenTypes.GT]: infixParse,
      [tokenTypes.EQ]: infixParse,
      [tokenTypes.NOT_EQ]: infixParse,
      [tokenTypes.LEFT_PARENT]: callParse,
    }
  }

  readToken() {
    this.curToken = this.nextToken
    this.position++
  }

  get nextToken() {
    return this.lexer.tokens[this.position]
  }

  get curTokenPrecedence() {
    return this.precedences[this.curToken.tokenType] || 0
  }

  get nextTokenPrecedence() {
    return this.precedences[this.nextToken.tokenType] || 0
  }

  get isNEWLINE() {
    return this.nextToken.tokenType === tokenTypes.NEWLINE
      || this.nextToken.tokenType === tokenTypes.SEMICOLON
  }

  parseExpression(precedence) {
    let letExp = this.prefixParseFns[this.curToken.tokenType](this.curToken)
    while (this.nextToken.tokenType !== tokenTypes.EOF
      && this.nextTokenPrecedence > precedence
      && !this.isNEWLINE) {
      const infix = this.infixParseFns[this.nextToken.tokenType]
      this.readToken()
      letExp = infix(letExp, this)
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

    const expression = this.parseExpression(0)

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

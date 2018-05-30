import tokenTypes from '../lexer/tokenTypes'
import {
  Pargarm,
  LetStatement,
  ConstStatement,
  BlockStatement,
  IfStatement,
  Expression,
  Identify,
  InfixExpression,
  FunctionDeclaration,
  FunctionExpression,
  Literal,
} from './estree'

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
      [tokenTypes.IDENTIFIER]: () => {
        return new Identify({
          toekn: this.curToken.toekn,
          literal: this.curToken.literal,
        })
      },
      [tokenTypes.NUMBER]: () => {
        return new Literal({
          value: Number(this.curToken.literal),
        })
      },
      [tokenTypes.STRING]: () => {
        return new Literal({
          value: String(this.curToken.literal),
        })
      },
      [tokenTypes.BOOLEAN]: () => {
        return new Literal({
          value: this.curToken.literal === 'true',
        })
      },
      [tokenTypes.FUNCTION]: () => {
        return this.parseFunctionExpression()
      }
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
    let letExp = this.prefixParseFns[this.curToken.tokenType]()
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

  parseFunctionExpression() {
    const props = {
      id: null,
      body: [],
      params: [],
    }
    const parseIDENTIFIER = this.prefixParseFns[tokenTypes.IDENTIFIER]
    if (this.nextToken.tokenType === tokenTypes.IDENTIFIER) {
      this.readToken()
      props.id = parseIDENTIFIER()
    }

    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    while (this.nextToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      this.readToken()
      props.params.push(parseIDENTIFIER())
      if (this.nextToken.tokenType === tokenTypes.COMMA) {
        this.readToken()
        if (this.nextToken.tokenType === tokenTypes.RIGHT_PARENT) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
      }
    }
    this.readToken()
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    props.body = this.parseBlockStatement()

    if (props.id) {
      return new FunctionDeclaration(props)
    }
    return new FunctionExpression(props)
  }

  parseIfStatement() {
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    const test = this.parseExpression(0)
    if (this.nextToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    const consequence = this.parseBlockStatement()

    let alternate = null
    if (this.curToken.tokenType === tokenTypes.ELSE) {
      // parse else if
      if (this.nextToken.tokenType === tokenTypes.IF) {
        this.readToken()
        alternate = this.parseIfStatement()
      } else {  // parse else
        if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        this.readToken()
        alternate = this.parseBlockStatement()
      }
    }

    return new IfStatement({
      test,
      consequence,
      alternate,
    })
  }

  parseBlockStatement() {
    const statements = []
    this.readToken()
    while (this.nextToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      const statement = this.parseStatement()
      if (statement !== null) {
        statements.push(statement)
      }
    }
    this.readToken()
    this.readToken()
    return new BlockStatement({
      body: statements
    })
  }

  parseStatement() {
    switch (this.curToken.tokenType) {
      case tokenTypes.LET:
        return this.parseLetStatement()
      case tokenTypes.CONST:
        return this.parseLetStatement(true)
      case tokenTypes.SEMICOLON:
      case tokenTypes.NEWLINE:
        this.readToken()
        return null
      case tokenTypes.IF:
        return this.parseIfStatement()
      case tokenTypes.FUNCTION:
        return this.parseFunctionExpression()
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

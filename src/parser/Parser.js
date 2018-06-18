import tokenTypes from '../lexer/tokenTypes'
import {
  Pargarm,
  BlockStatement,
  IfStatement,
  Identifier,
  BinaryExpression,
  FunctionDeclaration,
  FunctionExpression,
  Literal,
  ForStatement,
  ExpressionStatement,
  AssignmentExpression,
  UpdateExpression,
  CallExpression,
  MemberExpression,
  VariableDeclaration,
  VariableDeclarator,
  ObjectExpression,
  Property,
  ArrayExpression,
  EmptyStatement,
  Directive,
} from './estree'

class Parser {
  constructor(lexer) {
    console.log(lexer.tokens)
    this.lexer = lexer
    this.position = 0
    this.curToken = null
    // 运算符 优先级
    this.precedences = {
      [tokenTypes.ASSIGN_SIGN]: 1,
      [tokenTypes.EQ]: 2,
      [tokenTypes.NOT_EQ]: 2,
      [tokenTypes.LT]: 3,
      [tokenTypes.GT]: 3,
      [tokenTypes.PLUS_SIGN]: 4,
      [tokenTypes.MINUS_SIGN]: 4,
      [tokenTypes.ASTERISK]: 5,
      [tokenTypes.SLASH]: 5,
      [tokenTypes.LEFT_PARENT]: 6,
      [tokenTypes.DOT]: 6,
      [tokenTypes.LEFT_SQUARE_BRACKET]: 6,
    }

    this.registerPrefixParseFns()
    this.registerInfixParseFns()
    this.curParse = {
      type: '',
      statements: [],
    }
    this.pararm = new Pargarm()
    this.readToken()
    this.parse()
  }

  registerPrefixParseFns() {
    const caller = this
    this.prefixParseFns = {
      [tokenTypes.INC_DEC]() {
        const operator = caller.curToken.literal
        if (caller.nextToken.tokenType !== tokenTypes.IDENTIFIER) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        caller.readToken()
        return new UpdateExpression({
          prefix: true,
          operator,
          argument: {
            type: 'Identifier',
            name: caller.curToken.literal,
          }
        })
      },
      [tokenTypes.IDENTIFIER]() {
        const name = caller.curToken.literal
        if (caller.nextToken.tokenType === tokenTypes.INC_DEC) {
          caller.readToken()
          return new UpdateExpression({
            prefix: false,
            operator: caller.curToken.literal,
            argument: new Identifier({
              name,
            })
          })
        }
        return new Identifier({
          name,
        })
      },
      [tokenTypes.LEFT_PARENT]() {
        caller.readToken()
        const exp = caller.parseExpression()
        if (caller.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        return exp
      },
      [tokenTypes.NUMBER]() {
        return new Literal({
          value: Number(caller.curToken.literal),
        })
      },
      [tokenTypes.STRING]() {
        return new Literal({
          value: String(caller.curToken.literal),
        })
      },
      [tokenTypes.BOOLEAN]() {
        return new Literal({
          value: caller.curToken.literal === 'true',
        })
      },
      [tokenTypes.FUNCTION]: caller.parseFunctionExpression.bind(caller, true),
      [tokenTypes.LEFT_BRACE]: caller.parseObjectExpression.bind(caller),
      [tokenTypes.LEFT_SQUARE_BRACKET]: caller.parseArrayExpression.bind(caller),
    }
  }

  parseObjectExpression() {
    const props = {
      properties: []
    }
    this.readToken()
    while (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      const propertyProps = {
        key: null,
        value: null,
        kind: 'init',
      }
      if (this.curToken.tokenType === tokenTypes.STRING
        || this.curToken.tokenType === tokenTypes.NUMBER) {
        propertyProps.key = this.prefixParseFns[this.curToken.tokenType]
      } else {
        propertyProps.key = new Identifier({
          name: this.curToken.literal
        })
      }
      this.readToken()
      if (this.curToken.tokenType !== tokenTypes.COLON) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      propertyProps.value = this.parseExpression()
      if (this.curToken.tokenType === tokenTypes.COMMA) {
        this.readToken()
      }
      props.properties.push(new Property(propertyProps))
    }
    if (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    return new ObjectExpression(props)
  }

  parseArrayExpression() {
    const elements = []
    this.readToken()
    while (this.curToken.tokenType !== tokenTypes.RIGHT_SQUARE_BRACKET) {
      elements.push(this.parseExpression())
      if (this.curToken.tokenType === tokenTypes.COMMA) {
        this.readToken()
      }
    }
    if (this.curToken.tokenType !== tokenTypes.RIGHT_SQUARE_BRACKET) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    return new ArrayExpression({
      elements,
    })
  }

  parseAssignmentExpression(leftExp) {
    const props = {
      left: leftExp,
      operator: this.curToken,
      right: null,
    }
    this.readToken()
    props.right = this.parseExpression()
    return new AssignmentExpression(props)
  }

  registerInfixParseFns() {
    const caller = this
    function infixParse(leftExp) {
      const operator = caller.curToken.literal
      const precedence = caller.curTokenPrecedence
      caller.readToken()
      const rightExp = caller.parseExpression(precedence, false)
      return new BinaryExpression({
        left: leftExp,
        operator,
        right: rightExp,
      })
    }
    function callParse(leftExp) {
      const argument = []
      caller.readToken()
      while (caller.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
        argument.push(caller.parseExpression())
        if (caller.curToken.tokenType === tokenTypes.COMMA) {
          if (caller.nextToken.tokenType === tokenTypes.RIGHT_PARENT) {
            // TODO 语法错误处理
            throw 'syntax error'
          }
        }
      }
      return new CallExpression({
        callee: leftExp,
        argument,
      })
    }
    function parseMemberExpression(computed, leftExp) {
      if (computed) {
        if (caller.nextToken.tokenType === tokenTypes.RIGHT_SQUARE_BRACKET) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        caller.readToken()
        const property = caller.parseExpression()
        if (caller.curToken.tokenType !== tokenTypes.RIGHT_SQUARE_BRACKET) {
          // TODO 语法错误处理
          throw 'syntax error'
        }

        return new MemberExpression({
          computed,
          property,
          object: leftExp,
        })
      } else {
        if (caller.nextToken.tokenType !== tokenTypes.IDENTIFIER) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        caller.readToken()
        const property = caller.prefixParseFns[tokenTypes.IDENTIFIER]()

        return new MemberExpression({
          computed,
          property,
          object: leftExp,
        })
      }
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
      [tokenTypes.ASSIGN_SIGN]: this.parseAssignmentExpression.bind(this),
      [tokenTypes.LEFT_PARENT]: callParse,
      [tokenTypes.DOT]: parseMemberExpression.bind(null, false),
      [tokenTypes.LEFT_SQUARE_BRACKET]: parseMemberExpression.bind(null, true),
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

  isStatementEnd(token) {
    return token.tokenType === tokenTypes.SEMICOLON
      || token.tokenType === tokenTypes.EFO
      || token.tokenType === tokenTypes.RIGHT_BRACE
      || token.tokenType === tokenTypes.RIGHT_PARENT
  }

  parseExpression(precedence = 0, autoReadNext = true) {
    let letExp = this.prefixParseFns[this.curToken.tokenType]()
    while (this.curToken.tokenType !== tokenTypes.EOF
      && this.nextToken.tokenType !== tokenTypes.EOF
      && this.nextTokenPrecedence > precedence
      && !this.isStatementEnd(this.nextToken)) {
      const infix = this.infixParseFns[this.nextToken.tokenType]
      this.readToken()
      letExp = infix(letExp)
    }
    if (autoReadNext) {
      this.readToken()
    }
    return letExp
  }

  parseExpressionStatement() {
    let isStr = this.curToken.tokenType === tokenTypes.STRING
    const expression = this.parseExpression()
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    }
    let isTop = false
    if (this.curParse.type === 'pararm') {
      isTop = this.pararm.statements.findIndex(item => !item.directive) < 0
    } else if (this.curParse.type === 'FunctionExpression') {
      isTop = this.curParse.statements.findIndex(item => !item.directive) < 0
    }
    if (isStr && isTop) {
      return new Directive({
        expression,
        directive: expression.value
      })
    }

    return new ExpressionStatement({
      expression,
    })
  }

  parseVariableDeclaration() {
    const lineNumber = this.curToken.lineNumber
    const props = {
      kind: this.curToken.literal,
      declarations: [],
    }

    this.readToken()
    do {
      if (this.curToken.tokenType !== tokenTypes.IDENTIFIER) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      const identifier = this.curToken
      if (this.nextToken.tokenType !== tokenTypes.ASSIGN_SIGN) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      this.readToken()
      this.readToken()

      const expression = this.parseExpression()
      props.declarations.push(new VariableDeclarator({
        id: identifier,
        init: expression,
      }))

    } while (this.curToken.tokenType === tokenTypes.COMMA)

    if (!this.isStatementEnd(this.curToken)
      && lineNumber === this.curToken.lineNumber) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    return new VariableDeclaration(props)
  }

  parseFunctionExpression(expParseMode = false) {
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
    this.curParse.type = 'FunctionExpression'
    this.curParse.statements = props.body
    props.body = this.parseBlockStatement(props.body, !expParseMode)
    if (expParseMode) {
      return new FunctionExpression(props)
    }
    return new FunctionDeclaration(props)
  }

  parseIfStatement() {
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    const test = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
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

  parseBlockStatement(body = [], autoReadNext = true) {
    this.readToken()
    while (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      const statement = this.parseStatement()
      if (statement !== null) {
        body.push(statement)
      }
    }
    if (autoReadNext) {
      this.readToken()
    }
    return new BlockStatement({
      body
    })
  }

  parseForExpression() {
    const props = {
      init: null,
      test: null,
      update: null,
      body: [],
    }

    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    if (this.curToken !== tokenTypes.SEMICOLON) {
      props.init = this.parseStatement()
    }
    if (this.curToken.tokenType !== tokenTypes.SEMICOLON) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.curToken !== tokenTypes.SEMICOLON) {
      props.test = this.parseExpression()
    }
    if (this.curToken.tokenType !== tokenTypes.SEMICOLON) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      props.update = this.parseStatement()
    }
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.curToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    props.body = this.parseBlockStatement()

    return new ForStatement(props)
  }

  parseEmptyStatement() {
    this.readToken()
    return new EmptyStatement({})
  }

  parseFunctionDeclaration() {
    return this.parseFunctionExpression()
  }

  parseStatement() {
    switch (this.curToken.tokenType) {
      case tokenTypes.LET:
      case tokenTypes.CONST:
      case tokenTypes.VAR:
        return this.parseVariableDeclaration()
      case tokenTypes.SEMICOLON:
        return this.parseEmptyStatement()
      case tokenTypes.IF:
        return this.parseIfStatement()
      case tokenTypes.FUNCTION:
        return this.parseFunctionDeclaration()
      case tokenTypes.FOR:
        return this.parseForExpression()
      case tokenTypes.LEFT_BRACE:
        return this.parseBlockStatement()
      default:
        return this.parseExpressionStatement()
    }
    throw 'syntax error'
  }

  parse() {
    this.curParse.type = 'pararm'
    do {
      const statement = this.parseStatement()
      if (statement !== null) {
        this.pararm.statements.push(statement)
      }
    } while (this.curToken.tokenType !== tokenTypes.EOF
      && this.curToken.tokenType !== tokenTypes.ILLEGAL)
    // console.log(this.pararm.statements)
    console.log(JSON.stringify(this.pararm.statements, null, 2))
    debugger
  }

}

export default Parser

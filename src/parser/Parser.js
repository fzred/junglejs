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
  DebuggerStatement,
  WithStatement,
  ReturnStatement,
  LabeledStatement,
  ContinueStatement,
  BreakStatement,
  SwitchStatement,
  SwitchCase,
  ThrowStatement,
  TryStatement,
  CatchClause,
  WhileStatement,
  DoWhileStatement,
  ForInStatement,
  ForOfStatement,
  ThisExpression,
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

    this.parsePath = []
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
          },
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
            }),
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
      [tokenTypes.THIS]() {
        return new ThisExpression({})
      },
      [tokenTypes.FUNCTION]: caller.parseFunctionExpression.bind(caller, true),
      [tokenTypes.LEFT_BRACE]: caller.parseObjectExpression.bind(caller),
      [tokenTypes.LEFT_SQUARE_BRACKET]: caller.parseArrayExpression.bind(
        caller
      ),
    }
  }

  parseObjectExpression() {
    const props = {
      properties: [],
    }
    this.readToken()
    while (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      const propertyProps = {
        key: null,
        value: null,
        kind: 'init',
      }
      if (
        this.curToken.tokenType === tokenTypes.STRING ||
        this.curToken.tokenType === tokenTypes.NUMBER
      ) {
        propertyProps.key = this.prefixParseFns[this.curToken.tokenType]()
      } else {
        propertyProps.key = new Identifier({
          name: this.curToken.literal,
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
    props.right = this.parseExpression(0, false)
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
        caller.readToken()
        let property
        if (caller.curToken.tokenType === tokenTypes.THIS) {
          property = new Identifier({
            name: 'this',
          })
        } else {
          if (caller.curToken.tokenType !== tokenTypes.IDENTIFIER) {
            // TODO 语法错误处理
            throw 'syntax error'
          }
          property = caller.prefixParseFns[tokenTypes.IDENTIFIER]()
        }

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

  get curParse() {
    return this.parsePath[this.parsePath.length - 1] || null
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

  /**
   * 当前语句是否在严格模式内
   */
  isInStrictMode() {
    for (let i = this.parsePath.length - 1; i >= 0; i--) {
      const c = this.parsePath[i]
      if (c.type === 'FunctionExpression' || c.type === 'pararm') {
        if (
          c.body.findIndex(
            statement =>
              statement.type === 'ExpressionStatement' &&
              statement.directive === 'use strict'
          ) > -1
        )
          return true
      }
    }
    return false
  }

  parsePathClosest(type, stop) {
    for (let i = this.parsePath.length - 1; i >= 0; i--) {
      const c = this.parsePath[i]
      if (c.type === stop) return null
      if (c.type === type) return c
    }
    return null
  }

  isStatementEnd(token) {
    return (
      token.tokenType === tokenTypes.SEMICOLON ||
      token.tokenType === tokenTypes.EOF ||
      token.tokenType === tokenTypes.RIGHT_BRACE ||
      token.tokenType === tokenTypes.RIGHT_PARENT
    )
  }

  isNewLine(position = this.position) {
    return (
      this.curToken.tokenType === tokenTypes.EOF ||
      this.lexer.tokens[position - 1].loc.start.line >
        this.lexer.tokens[position - 2].loc.end.line
    )
  }

  parseExpression(precedence = 0, autoReadNext = true) {
    let letExp = this.prefixParseFns[this.curToken.tokenType]()
    while (
      this.curToken.tokenType !== tokenTypes.EOF &&
      !this.isStatementEnd(this.nextToken) &&
      this.nextTokenPrecedence > precedence
    ) {
      const infix = this.infixParseFns[this.nextToken.tokenType]
      this.readToken()
      letExp = infix(letExp)
    }
    // FunctionExpression 已经自动 readToken
    if (autoReadNext && letExp.type !== 'FunctionExpression') {
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
      isTop = this.curParse.body.findIndex(item => !item.directive) < 0
    } else if (this.curParse.type === 'FunctionExpression') {
      isTop = this.curParse.body.findIndex(item => !item.directive) < 0
    }
    if (
      this.curToken.tokenType !== tokenTypes.RIGHT_BRACE &&
      !this.isNewLine()
    ) {
      throw 'syntax error'
    }
    if (isStr && isTop) {
      return new Directive({
        expression,
        directive: expression.value,
      })
    }

    return new ExpressionStatement({
      expression,
    })
  }

  parseVariableDeclaration() {
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

      const identifier = this.prefixParseFns[this.curToken.tokenType]()
      if (this.nextToken.tokenType !== tokenTypes.ASSIGN_SIGN) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      this.readToken()
      this.readToken()

      const expression = this.parseExpression()
      props.declarations.push(
        new VariableDeclarator({
          id: identifier,
          init: expression,
        })
      )
    } while (this.curToken.tokenType === tokenTypes.COMMA)

    if (!this.isStatementEnd(this.curToken) && !this.isNewLine()) {
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
    this.parsePath.push({
      type: 'FunctionExpression',
      body: props.body,
    })
    props.body = this.parseBlockStatement(props.body)
    if (expParseMode) {
      return new FunctionExpression(props)
    }
    if (!props.id) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.parsePath.pop()
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
      } else {
        // parse else
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

  parseBlockStatement(body = []) {
    this.readToken()
    while (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      const statement = this.parseStatement()
      if (statement !== null) {
        body.push(statement)
      }
    }
    this.readToken()
    return new BlockStatement({
      body,
    })
  }

  parseForStatement(init) {
    const props = {
      init,
      test: null,
      update: null,
      body: [],
    }
    if (this.curToken !== tokenTypes.SEMICOLON) {
      props.test = this.parseExpression()
    }
    if (this.curToken.tokenType !== tokenTypes.SEMICOLON) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      props.update = this.parseExpression()
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

    this.parsePath.push({
      type: 'Loops',
    })

    props.body = this.parseBlockStatement()

    this.parsePath.pop()

    return new ForStatement(props)
  }

  parseForInStatement(left, isOf) {
    if (left.type !== 'VariableDeclaration' && left.type !== 'Identifier') {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    const props = {
      left,
      right: null,
      body: null,
    }

    this.readToken()
    props.right = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (this.curToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.parsePath.push({
      type: 'Loops',
      body: props.body,
    })

    props.body = this.parseBlockStatement()

    this.parsePath.pop()
    if (isOf) {
      return new ForOfStatement(props)
    }
    return new ForInStatement(props)
  }

  parseFor() {
    let init = null
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    if (this.curToken.tokenType !== tokenTypes.SEMICOLON) {
      switch (this.curToken.tokenType) {
        case tokenTypes.LET:
        case tokenTypes.CONST:
        case tokenTypes.VAR:
          init = this.parseVariableDeclaration()
          break
        default:
          init = this.parseExpression()
      }
    } else {
      this.readToken()
      return this.parseForStatement(init)
    }
    if (this.curToken.tokenType === tokenTypes.IN) {
      return this.parseForInStatement(init)
    } else if (this.curToken.tokenType === tokenTypes.OF) {
      return this.parseForInStatement(init, true)
    } else if (this.curToken.tokenType !== tokenTypes.SEMICOLON) {
      // TODO 语法错误处理
      throw 'syntax error'
    } else {
      this.readToken()
      return this.parseForStatement(init)
    }
  }

  parseEmptyStatement() {
    this.readToken()
    return new EmptyStatement({})
  }

  parseDebuggerStatement() {
    this.readToken()
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    }
    return new DebuggerStatement({})
  }

  parseFunctionDeclaration() {
    return this.parseFunctionExpression()
  }

  parseFunctionDeclaration() {
    return this.parseFunctionExpression()
  }

  parseReturnStatement() {
    if (!this.parsePathClosest('FunctionExpression')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    let argument = null
    this.readToken()
    if (!this.isStatementEnd(this.curToken) && !this.isNewLine()) {
      argument = this.parseExpression()
    }
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    }
    return new ReturnStatement({
      argument,
    })
  }

  parseWithStatement() {
    if (this.isInStrictMode()) {
      // TODO 语法错误处理
      throw 'syntax error: in strict mode'
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    const object = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    const body = this.parseBlockStatement()

    return new WithStatement({
      object,
      body,
    })
  }

  parseLabeledStatement() {
    const props = {
      label: this.prefixParseFns[this.curToken.tokenType](),
      body: null,
    }
    this.readToken()
    this.readToken()
    this.parsePath.push({
      type: 'LabeledStatement',
      label: props.label,
      body: [],
    })
    props.body = this.parseStatement()
    this.parsePath.pop()
    return new LabeledStatement(props)
  }

  parseContinueStatement() {
    const props = {
      label: null,
    }
    if (!this.parsePathClosest('Loops', 'FunctionExpression')) {
      // TODO 语法错误处理
      throw 'syntax error: require in Loops'
    }

    this.readToken()
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    } else if (!this.isNewLine()) {
      if (this.curToken.tokenType !== tokenTypes.IDENTIFIER) {
        // TODO 语法错误处理
        throw 'syntax error: require IDENTIFIER'
      }
      const label = this.parsePathClosest(
        'LabeledStatement',
        'FunctionExpression'
      )
      if (!label) {
        // TODO 语法错误处理
        throw 'syntax error: require in labelStatement'
      }
      if (this.curToken.literal !== label.label.name) {
        // TODO 语法错误处理
        throw 'syntax error: label name not consistent'
      }
      props.label = this.prefixParseFns[this.curToken.tokenType]()

      this.readToken()
      if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
        this.readToken()
      }
    }

    return new ContinueStatement(props)
  }

  parseBreakStatement() {
    const props = {
      label: null,
    }
    if (
      !this.parsePathClosest('Loops', 'FunctionExpression') &&
      !this.parsePathClosest('SwitchStatement', 'FunctionExpression')
    ) {
      // TODO 语法错误处理
      throw 'syntax error: require in Loops'
    }

    this.readToken()
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    } else if (!this.isNewLine()) {
      if (this.curToken.tokenType !== tokenTypes.IDENTIFIER) {
        // TODO 语法错误处理
        throw 'syntax error: require IDENTIFIER'
      }
      const label = this.parsePathClosest(
        'LabeledStatement',
        'FunctionExpression'
      )
      if (!label) {
        // TODO 语法错误处理
        throw 'syntax error: require in labelStatement'
      }
      if (this.curToken.literal !== label.label.name) {
        // TODO 语法错误处理
        throw 'syntax error: label name not consistent'
      }
      props.label = this.prefixParseFns[this.curToken.tokenType]()

      this.readToken()
      if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
        this.readToken()
      }
    }

    return new BreakStatement(props)
  }

  parseSwitchStatement() {
    const switchProps = {
      discriminant: null,
      cases: [],
    }
    this.parsePath.push({
      type: 'SwitchStatement',
    })
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    switchProps.discriminant = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()

    while (
      this.curToken.tokenType === tokenTypes.CASE ||
      this.curToken.tokenType === tokenTypes.DEFAULT
    ) {
      const isDefault = this.curToken.tokenType === tokenTypes.DEFAULT

      this.readToken()
      const caseProps = {
        test: null,
        consequent: [],
      }
      if (!isDefault) {
        caseProps.test = this.parseExpression()
      }
      if (this.curToken.tokenType !== tokenTypes.COLON) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      while (
        this.curToken.tokenType !== tokenTypes.CASE &&
        this.curToken.tokenType !== tokenTypes.DEFAULT &&
        this.curToken.tokenType !== tokenTypes.RIGHT_BRACE
      ) {
        const statement = this.parseStatement()
        if (statement !== null) {
          caseProps.consequent.push(statement)
        }
      }
      switchProps.cases.push(new SwitchCase(caseProps))
      if (isDefault) {
        break
      }
    }

    if (this.curToken.tokenType !== tokenTypes.RIGHT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.parsePath.pop()
    return new SwitchStatement(switchProps)
  }

  parseThrowStatement() {
    let argument = null
    this.readToken()
    if (this.isStatementEnd(this.curToken) || this.isNewLine()) {
      throw 'syntax error'
    }
    argument = this.parseExpression()
    if (this.curToken.tokenType === tokenTypes.SEMICOLON) {
      this.readToken()
    }
    return new ThrowStatement({
      argument,
    })
  }

  parseTryStatement() {
    const tryProps = {
      block: null,
      handler: null,
      finalizer: null,
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    tryProps.block = this.parseBlockStatement()

    if (this.curToken.tokenType === tokenTypes.CATCH) {
      const catchProps = {
        param: null,
        body: null,
      }
      const parseIDENTIFIER = this.prefixParseFns[tokenTypes.IDENTIFIER]
      if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      this.readToken()
      catchProps.param = parseIDENTIFIER(this.curToken)
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

      catchProps.body = this.parseBlockStatement()
      tryProps.handler = new CatchClause(catchProps)
    }
    if (this.curToken.tokenType === tokenTypes.FINALLY) {
      if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()

      tryProps.finalizer = this.parseBlockStatement()
    }

    if (tryProps.handler === null && tryProps.finalizer === null) {
      // If handler is null then finalizer must be a BlockStatement.
      // TODO 语法错误处理
      throw 'syntax error'
    }
    return new TryStatement(tryProps)
  }

  parseWhileStatement() {
    const props = {
      test: null,
      body: null,
    }
    this.parsePath.push({
      type: 'Loops',
    })
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()
    this.readToken()
    props.test = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    props.body = this.parseBlockStatement()

    this.parsePath.pop()
    return new WhileStatement(props)
  }

  parseDoWhileStatement() {
    const props = {
      test: null,
      body: null,
    }
    this.parsePath.push({
      type: 'Loops',
    })
    if (this.nextToken.tokenType !== tokenTypes.LEFT_BRACE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    props.body = this.parseBlockStatement()
    if (this.curToken.tokenType !== tokenTypes.WHILE) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (this.nextToken.tokenType !== tokenTypes.LEFT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()
    this.readToken()
    props.test = this.parseExpression()
    if (this.curToken.tokenType !== tokenTypes.RIGHT_PARENT) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    this.parsePath.pop()
    return new DoWhileStatement(props)
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
        return this.parseFor()
      case tokenTypes.LEFT_BRACE:
        return this.parseBlockStatement()
      case tokenTypes.DEBUGGER:
        return this.parseDebuggerStatement()
      case tokenTypes.WITH:
        return this.parseWithStatement()
      case tokenTypes.RETURN:
        return this.parseReturnStatement()
      case tokenTypes.CONTINUE:
        return this.parseContinueStatement()
      case tokenTypes.BREAK:
        return this.parseBreakStatement()
      case tokenTypes.SWITCH:
        return this.parseSwitchStatement()
      case tokenTypes.THROW:
        return this.parseThrowStatement()
      case tokenTypes.TRY:
        return this.parseTryStatement()
      case tokenTypes.WHILE:
        return this.parseWhileStatement()
      case tokenTypes.DO:
        return this.parseDoWhileStatement()
      case tokenTypes.IDENTIFIER:
        if (this.nextToken.tokenType === tokenTypes.COLON) {
          return this.parseLabeledStatement()
        }
      default:
        return this.parseExpressionStatement()
    }
    throw 'syntax error'
  }

  parse() {
    this.parsePath.push({
      type: 'pararm',
      body: this.pararm.statements,
    })
    do {
      const statement = this.parseStatement()
      if (statement !== null) {
        this.pararm.statements.push(statement)
      }
    } while (
      this.curToken.tokenType !== tokenTypes.EOF &&
      this.curToken.tokenType !== tokenTypes.ILLEGAL
    )
    this.parsePath.pop()
    // console.log(this.pararm.statements)
    console.log(JSON.stringify(this.pararm.statements, null, 2))
    debugger
  }
}

export default Parser

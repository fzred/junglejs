import tokenTypes from '../lexer/tokenTypes'
import { deepCopy } from '../utils'
import {
  Program,
  BlockStatement,
  IfStatement,
  Identifier,
  BinaryExpression,
  LogicalExpression,
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
  UnaryExpression,
} from './estree'

function judgeAST(token, value) {
  return (
    (token.type === tokenTypes.Keyword ||
      token.type === tokenTypes.Punctuator) &&
    token.value === value
  )
}

class Parser {
  constructor(lexer) {
    console.log(lexer.tokens)
    this.lexer = lexer
    this.position = 0
    this.curToken = null

    this.parsePath = []
    this.parsePostion = []
    this.program = null
    this.readToken()
    this.parse()
  }

  get curParse() {
    return this.parsePath[this.parsePath.length - 1] || null
  }

  get nextToken() {
    return this.lexer.tokens[this.position]
  }
  get prevToken() {
    return this.lexer.tokens[this.position - 2]
  }

  get curTokenPrecedence() {
    return this.getPrecedence(this.curToken)
  }

  get nextTokenPrecedence() {
    return this.getPrecedence(this.nextToken)
  }

  parseUnaryExpression() {
    const props = {
      loc: deepCopy(this.curToken.loc),
      operator: this.curToken.value,
      prefix: true,
      argument: null,
    }
    const precedence = this.curTokenPrecedence
    this.readToken()
    props.argument = this.parseExpression(precedence, false)
    props.loc.end = this.curToken.loc.end
    return new UnaryExpression(props)
  }

  parseObjectExpression() {
    const props = {
      properties: [],
      loc: deepCopy(this.curToken.loc),
    }
    this.readToken()
    while (!judgeAST(this.curToken, '}')) {
      const propertyProps = {
        key: null,
        value: null,
        kind: 'init',
        loc: deepCopy(this.curToken.loc),
      }
      if (this.curToken.value === 'get' || this.curToken.value === 'set') {
        propertyProps.kind = this.curToken.value
        this.readToken()
      }
      if (
        this.curToken.type === tokenTypes.STRING ||
        this.curToken.type === tokenTypes.NUMBER
      ) {
        propertyProps.key = this.getPrefixParseFn(this.curToken)()
      } else {
        propertyProps.key = new Identifier({
          name: this.curToken.value,
          loc: deepCopy(this.curToken.loc),
        })
      }
      this.readToken()
      if (judgeAST(this.curToken, '(')) {
        propertyProps.value = this.parseFunctionExpression(true, true)
      } else if (judgeAST(this.curToken, ':')) {
        this.readToken()
        propertyProps.value = this.parseExpression()
      } else {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      if (
        propertyProps.kind === 'get' &&
        (propertyProps.value.type !== 'FunctionExpression' ||
          propertyProps.value.params.length > 0)
      ) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      if (
        propertyProps.kind === 'set' &&
        (propertyProps.value.type !== 'FunctionExpression' ||
          propertyProps.value.params.length !== 1)
      ) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      propertyProps.loc.end = propertyProps.value.loc.end
      props.properties.push(new Property(propertyProps))

      if (judgeAST(this.curToken, ',')) {
        this.readToken()
      }
    }
    if (!judgeAST(this.curToken, '}')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    props.loc.end = this.curToken.loc.end
    return new ObjectExpression(props)
  }

  parseArrayExpression() {
    const elements = []
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    while (!judgeAST(this.curToken, ']')) {
      elements.push(this.parseExpression())
      if (judgeAST(this.curToken, ',')) {
        this.readToken()
      }
    }
    if (!judgeAST(this.curToken, ']')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    loc.end = this.curToken.loc.end
    return new ArrayExpression({
      elements,
      loc,
    })
  }

  parseAssignmentExpression(leftExp) {
    const props = {
      left: leftExp,
      operator: this.curToken.value,
      right: null,
      loc: deepCopy(leftExp.loc),
    }
    this.readToken()
    props.right = this.parseExpression(-1, false)
    props.loc.end = this.curToken.loc.end
    return new AssignmentExpression(props)
  }

  readToken() {
    this.curToken = this.nextToken
    this.position++
  }

  parseBinaryExpression(leftExp) {
    const operator = this.curToken.value
    const precedence = this.curTokenPrecedence
    this.readToken()
    const rightExp = this.parseExpression(precedence, false)
    return new BinaryExpression({
      left: leftExp,
      operator,
      right: rightExp,
      loc: {
        start: leftExp.loc.start,
        end: this.curToken.loc.end,
      },
    })
  }

  parseCallExpression(leftExp) {
    const argument = []
    this.readToken()
    while (!judgeAST(this.curToken, ')')) {
      argument.push(this.parseExpression())
      if (judgeAST(this.curToken, ',')) {
        if (judgeAST(this.nextToken, ')')) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
      }
    }
    return new CallExpression({
      callee: leftExp,
      argument,
      loc: {
        start: leftExp.loc.start,
        end: this.curToken.loc.end,
      },
    })
  }

  parseMemberExpression(computed, leftExp) {
    if (computed) {
      if (judgeAST(this.nextToken, ']')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      const property = this.parseExpression()
      if (!judgeAST(this.curToken, ']')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      return new MemberExpression({
        computed,
        property,
        object: leftExp,
        loc: {
          start: leftExp.loc.start,
          end: this.curToken.loc.end,
        },
      })
    } else {
      this.readToken()
      let property
      if (judgeAST(this.curToken, 'this')) {
        property = new Identifier({
          name: 'this',
          loc: deepCopy(this.curToken.loc),
        })
      } else {
        if (this.curToken.type !== tokenTypes.IDENTIFIER) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        property = this.parseIdentifier()
      }

      return new MemberExpression({
        computed,
        property,
        object: leftExp,
        loc: {
          start: leftExp.loc.start,
          end: this.curToken.loc.end,
        },
      })
    }
  }

  // 运算符 优先级
  getPrecedence(token) {
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
    if (
      token.type === tokenTypes.Punctuator ||
      token.type === tokenTypes.Keyword
    ) {
      switch (token.value) {
        case '(':
          return 20
        case '.':
        case '[':
        case 'new':
          return 19
        case '**':
          return 15
        case '*':
        case '/':
        case '%':
          return 14
        case '+':
        case '-':
          return 13
        case '<<':
        case '>>':
        case '>>>':
          return 12
        case '<':
        case '<=':
        case '>':
        case '>=':
        case 'in':
        case 'instanceof':
          return 11
        case '==':
        case '!=':
        case '===':
        case '!==':
          return 10
        case '&':
          return 9
        case '^':
          return 8
        case '|':
          return 7
        case '&&':
          return 6
        case '||':
          return 5
        case '?':
          return 4
        case '=':
        case '+=':
        case '-=':
        case '*=':
        case '/=':
        case '%=':
        case '<<=':
        case '>>=':
        case '>>>=':
        case '&=':
        case '^=':
        case '|=':
          return 3
        case 'yield':
        case 'yield*':
          return 2
        case '...':
          return 1
      }
    }
    return -1
  }

  getInfixParseFn(token) {
    if (
      token.type === tokenTypes.Punctuator ||
      token.type === tokenTypes.Keyword
    ) {
      if (
        [
          '==',
          '!=',
          '===',
          '!==',
          '<',
          '<=',
          '>',
          '>=',
          '<<',
          '>>',
          '>>>',
          '+',
          '-',
          '*',
          '/',
          '%',
          '|',
          '^',
          '&',
          'in',
          'instanceof',
        ].indexOf(token.value) > -1
      ) {
        return this.parseBinaryExpression.bind(this)
      } else if (
        [
          '=',
          '+=',
          '-=',
          '*=',
          '/=',
          '%=',
          '<<=',
          '>>=',
          '>>>=',
          '|=',
          '^=',
          '&=',
        ].indexOf(token.value) > -1
      ) {
        return this.parseAssignmentExpression.bind(this)
      } else if (['&&', '||'].indexOf(token.value) > -1) {
        return this.parseLogicalExpression.bind(this)
      } else if (token.value === '(') {
        return this.parseCallExpression.bind(this)
      } else if (token.value === '.') {
        return this.parseMemberExpression.bind(this, false)
      } else if (token.value === '[') {
        return this.parseMemberExpression.bind(this, true)
      }
    }
  }

  getPrefixParseFn(token) {
    if (
      token.type === tokenTypes.Punctuator ||
      token.type === tokenTypes.Keyword
    ) {
      if (
        ['-', '+', '!', '~', 'typeof', 'void', 'delete'].indexOf(token.value) >
        -1
      ) {
        return this.parseUnaryExpression.bind(this)
      } else if (['++', '--'].indexOf(token.value) > -1) {
        return this.parseUpdateExpression.bind(this)
      } else if (token.value === 'function') {
        return this.parseFunctionExpression.bind(this, true)
      } else if (token.value === '{') {
        return this.parseObjectExpression.bind(this)
      } else if (token.value === '[') {
        return this.parseArrayExpression.bind(this)
      } else if (token.value === 'this') {
        return this.parseThisExpression.bind(this)
      } else if (token.value === '/') {
        return this.parseRegex.bind(this)
      } else if (token.value === '(') {
        return function() {
          this.readToken()
          const exp = this.parseExpression()
          if (!judgeAST(this.curToken, ')')) {
            // TODO 语法错误处理
            throw 'syntax error'
          }
          return exp
        }.bind(this)
      }
    } else if (
      [tokenTypes.NUMBER, tokenTypes.STRING, tokenTypes.BOOLEAN].indexOf(
        token.type
      ) > -1
    ) {
      // TODO null | RegExp
      return this.parseLiteral.bind(this)
    } else if (token.type === tokenTypes.IDENTIFIER) {
      return this.parseIdentifier.bind(this, true)
    }
  }

  parseRegex() {
    const props = {
      value: null,
      loc: deepCopy(this.curToken.loc),
      regex: {
        pattern: '',
        flags: '',
      },
    }
    let classMarker = false
    let terminated = false
    let str = ''
    let flags = ''
    this.readToken()

    const getRaw = () => {
      const space =
        this.curToken.loc.start.column - this.prevToken.loc.end.column
      return new Array(1 + space).join(' ') + this.curToken.value
    }

    while (!this.isNewLine()) {
      str += getRaw()
      if (this.curToken.value === '\\') {
        this.readToken()
        if (this.isNewLine()) {
          throw 'syntax error'
        }
        str += getRaw()
      } else if (classMarker) {
        if (this.curToken.value === ']') {
          classMarker = false
        }
      } else {
        if (this.curToken.value === '/') {
          terminated = true
          break
        } else if (this.curToken.value === '[') {
          classMarker = true
        }
      }
      this.readToken()
    }
    if (!terminated) {
      throw 'syntax error'
    }

    if (
      this.nextToken.type === tokenTypes.IDENTIFIER &&
      this.curToken.loc.end.column === this.nextToken.loc.start.column
    ) {
      this.readToken()
      flags += this.curToken.value
    }

    props.regex.pattern = str.substr(0, str.length - 1)
    props.regex.flags = flags
    props.loc.end = this.curToken.loc.end
    return new Literal(props)
  }

  parseIdentifier(autoParseUpdateExpression = false) {
    const name = this.curToken.value
    const identifierLoc = deepCopy(this.curToken.loc)
    if (
      ['++', '--'].indexOf(this.nextToken.value) > -1 &&
      autoParseUpdateExpression // 碰到 ++ -- 顺便解析
    ) {
      this.readToken()

      return new UpdateExpression({
        prefix: false,
        operator: this.curToken.value,
        argument: new Identifier({
          name,
          loc: identifierLoc,
        }),
        loc: {
          ...identifierLoc,
          end: this.curToken.loc.end,
        },
      })
    }
    return new Identifier({
      name,
      loc: identifierLoc,
    })
  }

  parseUpdateExpression() {
    const operator = this.curToken.value
    const loc = deepCopy(this.curToken.loc)
    if (this.nextToken.type !== tokenTypes.IDENTIFIER) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    loc.end = this.curToken.loc.end
    return new UpdateExpression({
      prefix: true,
      operator,
      loc,
      argument: {
        type: 'Identifier',
        name: this.curToken.value,
      },
    })
  }

  parseLiteral() {
    const props = {
      value: null,
      loc: deepCopy(this.curToken.loc),
    }
    switch (this.curToken.type) {
      case tokenTypes.NUMBER:
        props.value = Number(this.curToken.value)
        break
      case tokenTypes.STRING:
        props.value = String(this.curToken.value)
        break
      case tokenTypes.BOOLEAN:
        props.value = this.curToken.value === 'true'
        break
    }
    // TODO null | RegExp
    return new Literal(props)
  }

  parseThisExpression() {
    return new ThisExpression({
      loc: deepCopy(this.curToken.loc),
    })
  }

  parseLogicalExpression(leftExp) {
    const props = {
      left: leftExp,
      operator: this.curToken.value,
      right: null,
      loc: deepCopy(leftExp.loc),
    }
    this.readToken()
    props.right = this.parseExpression(-1, false)
    props.loc.end = this.curToken.loc.end
    return new LogicalExpression(props)
  }

  /**
   * 当前语句是否在严格模式内
   */
  isInStrictMode() {
    for (let i = this.parsePath.length - 1; i >= 0; i--) {
      const c = this.parsePath[i]
      if (c.type === 'FunctionExpression' || c.type === 'program') {
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
      token.type === tokenTypes.EOF ||
      judgeAST(token, ';') ||
      judgeAST(token, '}') ||
      judgeAST(token, ')')
    )
  }

  isNewLine(position = this.position) {
    return (
      this.curToken.type === tokenTypes.EOF ||
      this.lexer.tokens[position - 1].loc.start.line >
        this.lexer.tokens[position - 2].loc.end.line
    )
  }

  parseExpression(precedence = -1, autoReadNext = true) {
    let letExp = this.getPrefixParseFn(this.curToken)()
    if (
      this.parsePathClosest('ForInit') &&
      this.nextToken.type === tokenTypes.Keyword &&
      ['in', 'of'].indexOf(this.nextToken.value) > -1
    ) {
      this.readToken()
      return letExp
    }
    while (
      this.curToken.type !== tokenTypes.EOF &&
      !this.isStatementEnd(this.nextToken) &&
      this.nextTokenPrecedence > precedence
    ) {
      const infix = this.getInfixParseFn(this.nextToken)
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
    let isStr = this.curToken.type === tokenTypes.STRING
    const loc = deepCopy(this.curToken.loc)
    const expression = this.parseExpression()
    if (judgeAST(this.curToken, ';')) {
      this.readToken()
    }
    let isTop = false
    if (this.curParse.type === 'program') {
      isTop = this.curParse.body.findIndex(item => !item.directive) < 0
    } else if (this.curParse.type === 'FunctionExpression') {
      isTop = this.curParse.body.findIndex(item => !item.directive) < 0
    }
    if (!this.isStatementEnd(this.curToken) && !this.isNewLine()) {
      throw 'syntax error'
    }
    loc.end = this.prevToken.loc.end
    if (isStr && isTop) {
      return new Directive({
        expression,
        loc,
        directive: expression.value,
      })
    }

    return new ExpressionStatement({
      expression,
      loc,
    })
  }

  parseVariableDeclaration(autoReadNext = true) {
    const props = {
      kind: this.curToken.value,
      declarations: [],
      loc: deepCopy(this.curToken.loc),
    }

    do {
      this.readToken()
      const locVariableDeclarator = deepCopy(this.curToken.loc)
      if (this.curToken.type !== tokenTypes.IDENTIFIER) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      const identifier = this.getPrefixParseFn(this.curToken)()
      this.readToken()
      if (!judgeAST(this.curToken, '=')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }

      this.readToken()

      const expression = this.parseExpression()
      props.declarations.push(
        new VariableDeclarator({
          id: identifier,
          init: expression,
          loc: {
            ...locVariableDeclarator,
            end: this.prevToken.loc.end,
          },
        })
      )
    } while (judgeAST(this.curToken, ','))

    if (autoReadNext) {
      if (judgeAST(this.curToken, ';')) {
        this.readToken()
      } else if (!this.isStatementEnd(this.curToken) && !this.isNewLine()) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
    }

    props.loc.end = this.prevToken.loc.end
    return new VariableDeclaration(props)
  }

  parseFunctionExpression(expParseMode = false, short = false) {
    const props = {
      id: null,
      body: [],
      params: [],
      loc: deepCopy(this.curToken.loc),
    }
    if (!short) {
      if (this.nextToken.type === tokenTypes.IDENTIFIER) {
        this.readToken()
        props.id = this.parseIdentifier()
      }
      this.readToken()
    }

    if (!judgeAST(this.curToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    while (!judgeAST(this.nextToken, ')')) {
      this.readToken()
      props.params.push(this.parseIdentifier())
      if (judgeAST(this.nextToken, ',')) {
        this.readToken()
        if (judgeAST(this.nextToken, ')')) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
      }
    }
    this.readToken()
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.parsePath.push({
      type: 'FunctionExpression',
      body: props.body,
    })
    props.body = this.parseBlockStatement(props.body)
    props.loc.end = this.prevToken.loc.end
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
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    this.readToken()
    const test = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    const consequence = this.parseBlockStatement()

    let alternate = null
    if (judgeAST(this.curToken, 'else')) {
      // parse else if
      if (judgeAST(this.nextToken, 'if')) {
        this.readToken()
        alternate = this.parseIfStatement()
      } else {
        // parse else
        if (!judgeAST(this.nextToken, '{')) {
          // TODO 语法错误处理
          throw 'syntax error'
        }
        this.readToken()
        alternate = this.parseBlockStatement()
      }
    }
    loc.end = this.prevToken.loc.end
    return new IfStatement({
      test,
      consequence,
      alternate,
      loc,
    })
  }

  parseBlockStatement(body = []) {
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    while (!judgeAST(this.curToken, '}')) {
      const statement = this.parseStatement()
      if (statement !== null) {
        body.push(statement)
      }
    }
    this.readToken()
    return new BlockStatement({
      body,
      loc: { ...loc, end: this.prevToken.loc.end },
    })
  }

  parseForStatement(init) {
    const props = {
      init,
      test: null,
      update: null,
      body: [],
      loc: this.parsePostion.pop(),
    }
    if (!judgeAST(this.curToken, ';')) {
      props.test = this.parseExpression()
    }
    if (!judgeAST(this.curToken, ';')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (!judgeAST(this.curToken, ')')) {
      props.update = this.parseExpression()
    }
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (!judgeAST(this.curToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.parsePath.push({
      type: 'Loops',
    })

    props.body = this.parseBlockStatement()

    this.parsePath.pop()
    props.loc.end = this.prevToken.loc.end
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
      loc: this.parsePostion.pop(),
    }

    this.readToken()
    props.right = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    if (!judgeAST(this.curToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.parsePath.push({
      type: 'Loops',
      body: props.body,
    })

    props.body = this.parseBlockStatement()
    props.loc.end = this.prevToken.loc.end

    this.parsePath.pop()
    if (isOf) {
      return new ForOfStatement(props)
    }
    return new ForInStatement(props)
  }

  parseFor() {
    let init = null
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.parsePostion.push(deepCopy(this.curToken.loc))
    this.readToken()
    this.readToken()
    this.parsePath.push({
      type: 'ForInit',
    })
    if (!judgeAST(this.curToken, ';')) {
      if (
        judgeAST(this.curToken, 'let') ||
        judgeAST(this.curToken, 'const') ||
        judgeAST(this.curToken, 'var')
      ) {
        init = this.parseVariableDeclaration(false)
      } else {
        init = this.parseExpression()
      }
      this.parsePath.pop()
    } else {
      this.readToken()
      return this.parseForStatement(init)
    }
    if (judgeAST(this.curToken, 'in')) {
      return this.parseForInStatement(init)
    } else if (judgeAST(this.curToken, 'of')) {
      return this.parseForInStatement(init, true)
    } else if (!judgeAST(this.curToken, ';')) {
      // TODO 语法错误处理
      throw 'syntax error'
    } else {
      this.readToken()
      return this.parseForStatement(init)
    }
  }

  parseEmptyStatement() {
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    return new EmptyStatement({ loc })
  }

  parseDebuggerStatement() {
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    if (judgeAST(this.curToken, ';')) {
      loc.end = this.prevToken.loc.end
      this.readToken()
    }
    return new DebuggerStatement({ loc })
  }

  parseFunctionDeclaration() {
    return this.parseFunctionExpression()
  }

  parseFunctionDeclaration() {
    return this.parseFunctionExpression()
  }

  parseReturnStatement() {
    const loc = deepCopy(this.curToken.loc)
    if (!this.parsePathClosest('FunctionExpression')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    let argument = null
    this.readToken()
    if (!this.isStatementEnd(this.curToken) && !this.isNewLine()) {
      argument = this.parseExpression()
    }
    loc.end = this.curToken.loc.end
    if (judgeAST(this.curToken, ';')) {
      this.readToken()
    }
    return new ReturnStatement({
      argument,
      loc,
    })
  }

  parseWithStatement() {
    const loc = deepCopy(this.curToken.loc)
    if (this.isInStrictMode()) {
      // TODO 语法错误处理
      throw 'syntax error: in strict mode'
    }
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    const object = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    const body = this.parseBlockStatement()
    loc.end = this.prevToken.loc.end
    return new WithStatement({
      object,
      body,
      loc,
    })
  }

  parseLabeledStatement() {
    const props = {
      label: this.getPrefixParseFn(this.curToken)(),
      body: null,
      loc: deepCopy(this.curToken.loc),
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
    props.loc.end = this.prevToken.loc.end
    return new LabeledStatement(props)
  }

  parseContinueStatement() {
    const props = {
      label: null,
      loc: deepCopy(this.curToken.loc),
    }
    if (!this.parsePathClosest('Loops', 'FunctionExpression')) {
      // TODO 语法错误处理
      throw 'syntax error: require in Loops'
    }

    this.readToken()
    if (judgeAST(this.curToken, ';')) {
      props.loc.end = this.curToken.loc.end
      this.readToken()
    } else if (!this.isNewLine()) {
      if (this.curToken.type !== tokenTypes.IDENTIFIER) {
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
      if (this.curToken.value !== label.label.name) {
        // TODO 语法错误处理
        throw 'syntax error: label name not consistent'
      }
      props.label = this.getPrefixParseFn(this.curToken)()

      props.loc.end = this.curToken.loc.end
      this.readToken()
      if (judgeAST(this.curToken, ';')) {
        props.loc.end = this.curToken.loc.end
        this.readToken()
      }
    }

    return new ContinueStatement(props)
  }

  parseBreakStatement() {
    const props = {
      label: null,
      loc: deepCopy(this.curToken.loc),
    }
    if (
      !this.parsePathClosest('Loops', 'FunctionExpression') &&
      !this.parsePathClosest('SwitchStatement', 'FunctionExpression')
    ) {
      // TODO 语法错误处理
      throw 'syntax error: require in Loops'
    }

    this.readToken()
    if (judgeAST(this.curToken, ';')) {
      props.loc.end = this.curToken.loc.end
      this.readToken()
    } else if (!this.isNewLine()) {
      if (this.curToken.type !== tokenTypes.IDENTIFIER) {
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
      if (this.curToken.value !== label.label.name) {
        // TODO 语法错误处理
        throw 'syntax error: label name not consistent'
      }
      props.label = this.getPrefixParseFn(this.curToken)()

      props.loc.end = this.curToken.loc.end
      this.readToken()
      if (judgeAST(this.curToken, ';')) {
        props.loc.end = this.curToken.loc.end
        this.readToken()
      }
    }

    return new BreakStatement(props)
  }

  parseSwitchStatement() {
    const switchProps = {
      discriminant: null,
      cases: [],
      loc: deepCopy(this.curToken.loc),
    }
    this.parsePath.push({
      type: 'SwitchStatement',
    })
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()
    switchProps.discriminant = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    this.readToken()

    while (
      judgeAST(this.curToken, 'case') ||
      judgeAST(this.curToken, 'default')
    ) {
      const caseProps = {
        test: null,
        consequent: [],
        loc: deepCopy(this.curToken.loc),
      }

      const isDefault = judgeAST(this.curToken, 'default')

      this.readToken()

      if (!isDefault) {
        caseProps.test = this.parseExpression()
      }
      if (!judgeAST(this.curToken, ':')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      while (
        !judgeAST(this.curToken, 'case') &&
        !judgeAST(this.curToken, 'default') &&
        !judgeAST(this.curToken, '}')
      ) {
        const statement = this.parseStatement()
        if (statement !== null) {
          caseProps.consequent.push(statement)
        }
      }
      caseProps.loc.end = this.prevToken.loc.end
      switchProps.cases.push(new SwitchCase(caseProps))
      if (isDefault) {
        break
      }
    }

    if (!judgeAST(this.curToken, '}')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    switchProps.loc.end = this.curToken.loc.end
    this.readToken()
    this.parsePath.pop()
    return new SwitchStatement(switchProps)
  }

  parseThrowStatement() {
    let argument = null
    const loc = deepCopy(this.curToken.loc)
    this.readToken()
    if (this.isStatementEnd(this.curToken) || this.isNewLine()) {
      throw 'syntax error'
    }
    argument = this.parseExpression()
    loc.end = this.curToken.loc.end
    if (judgeAST(this.curToken, ';')) {
      loc.end = this.curToken.loc.end
      this.readToken()
    }
    return new ThrowStatement({
      argument,
      loc,
    })
  }

  parseTryStatement() {
    const tryProps = {
      block: null,
      handler: null,
      finalizer: null,
      loc: deepCopy(this.curToken.loc),
    }
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    tryProps.block = this.parseBlockStatement()

    if (judgeAST(this.curToken, 'catch')) {
      const catchProps = {
        param: null,
        body: null,
        loc: deepCopy(this.curToken.loc),
      }
      if (!judgeAST(this.nextToken, '(')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      this.readToken()
      catchProps.param = this.parseIdentifier()
      if (!judgeAST(this.nextToken, ')')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()
      if (!judgeAST(this.nextToken, '{')) {
        // TODO 语法错误处理
        throw 'syntax error'
      }
      this.readToken()

      catchProps.body = this.parseBlockStatement()
      catchProps.loc.end = this.prevToken.loc.end
      tryProps.handler = new CatchClause(catchProps)
    }
    if (judgeAST(this.curToken, 'finally')) {
      if (!judgeAST(this.nextToken, '{')) {
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
    tryProps.loc.end = this.prevToken.loc.end
    return new TryStatement(tryProps)
  }

  parseWhileStatement() {
    const props = {
      test: null,
      body: null,
      loc: deepCopy(this.curToken.loc),
    }
    this.parsePath.push({
      type: 'Loops',
    })
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()
    this.readToken()
    props.test = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()

    props.body = this.parseBlockStatement()
    props.loc.end = this.prevToken.loc.end

    this.parsePath.pop()
    return new WhileStatement(props)
  }

  parseDoWhileStatement() {
    const props = {
      test: null,
      body: null,
      loc: deepCopy(this.curToken.loc),
    }
    this.parsePath.push({
      type: 'Loops',
    })
    if (!judgeAST(this.nextToken, '{')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    props.body = this.parseBlockStatement()
    if (!judgeAST(this.curToken, 'while')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    if (!judgeAST(this.nextToken, '(')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }

    this.readToken()
    this.readToken()
    props.test = this.parseExpression()
    if (!judgeAST(this.curToken, ')')) {
      // TODO 语法错误处理
      throw 'syntax error'
    }
    this.readToken()
    props.loc.end = this.prevToken.loc.end

    this.parsePath.pop()
    return new DoWhileStatement(props)
  }

  parseStatement() {
    const curToken = this.curToken
    if (
      judgeAST(curToken, 'let') ||
      judgeAST(curToken, 'const') ||
      judgeAST(curToken, 'var')
    ) {
      return this.parseVariableDeclaration()
    } else if (judgeAST(curToken, ';')) {
      return this.parseEmptyStatement()
    } else if (judgeAST(curToken, 'if')) {
      return this.parseIfStatement()
    } else if (judgeAST(curToken, 'function')) {
      return this.parseFunctionDeclaration()
    } else if (judgeAST(curToken, 'for')) {
      return this.parseFor()
    } else if (judgeAST(curToken, '{')) {
      return this.parseBlockStatement()
    } else if (judgeAST(curToken, 'debugger')) {
      return this.parseDebuggerStatement()
    } else if (judgeAST(curToken, 'with')) {
      return this.parseWithStatement()
    } else if (judgeAST(curToken, 'return')) {
      return this.parseReturnStatement()
    } else if (judgeAST(curToken, 'continue')) {
      return this.parseContinueStatement()
    } else if (judgeAST(curToken, 'break')) {
      return this.parseBreakStatement()
    } else if (judgeAST(curToken, 'switch')) {
      return this.parseSwitchStatement()
    } else if (judgeAST(curToken, 'throw')) {
      return this.parseThrowStatement()
    } else if (judgeAST(curToken, 'try')) {
      return this.parseTryStatement()
    } else if (judgeAST(curToken, 'while')) {
      return this.parseWhileStatement()
    } else if (judgeAST(curToken, 'do')) {
      return this.parseDoWhileStatement()
    } else {
      if (
        curToken.type === tokenTypes.IDENTIFIER &&
        judgeAST(this.nextToken, ':')
      ) {
        return this.parseLabeledStatement()
      }
      return this.parseExpressionStatement()
    }
  }

  parse() {
    const loc = deepCopy(this.curToken.loc)
    this.program = new Program({ loc })
    this.parsePath.push({
      type: 'program',
      body: this.program.body,
    })
    do {
      const statement = this.parseStatement()
      if (statement !== null) {
        this.program.body.push(statement)
      }
    } while (this.curToken.type !== tokenTypes.EOF)
    this.parsePath.pop()
    this.program.loc.end = this.prevToken.loc.end
    // console.log(this.program.body)
    console.log(
      JSON.stringify(
        this.program,
        (k, v) => {
          if (k === 'loc') {
            return undefined
          }
          return v
        },
        2
      )
    )
    debugger
  }
}

export default Parser

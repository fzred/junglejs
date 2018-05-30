
/**
 * https://github.com/estree/estree/blob/master/es5.md
 */

export class Statement {
  constructor(props) {
    this.type = 'Statement'
  }
}

export class LetStatement extends Statement {
  constructor(props) {
    super(props)
    this.identify = props.identify
    this.expression = props.expression
    this.type = 'LetStatement'
  }
}

export class BlockStatement extends Statement {
  constructor(props) {
    super(props)
    this.body = props.body
    this.type = 'BlockStatement'
  }
}

export class ConstStatement extends LetStatement {
  constructor(props) {
    super(props)
    this.type = 'ConstStatement'
  }
}

export class IfStatement extends LetStatement {
  constructor(props) {
    super(props)
    this.test = props.test
    this.consequence = props.consequence
    this.alternate = props.alternate
    this.type = 'IfStatement'
  }
}



export class Pargarm {
  constructor() {
    this.token = 'Pargarm'
    this.statements = []
  }
}

export class FunctionExpression {
  constructor(props) {
    this.type = 'FunctionExpression'
    this.params = props.params
    this.body = props.body
  }
}

export class FunctionDeclaration extends FunctionExpression {
  constructor(props) {
    super(props)
    this.type = 'FunctionDeclaration'
    this.id = props.id
  }
}

export class Expression {
  constructor(props) {
  }
}

export class InfixExpression extends Expression {
  constructor(props) {
    super(props)
    this.token = props.token
    this.leftExpression = props.leftExpression
    this.rightExpression = props.rightExpression
    this.operator = props.operator
    this.value = ''
    this.type = 'InfixExpression'
  }
}

export class Identify extends Expression {
  constructor(props) {
    super(props)
    this.token = props.token
    this.literal = props.literal
    this.value = ''
    this.type = 'Identify'
  }
}

export class Literal{
  constructor(props) {
    this.type = 'Literal'
    this.value = props.value
  }  
}

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

export class NumberLiteral extends Expression {
  constructor(props) {
    super(props)
    this.token = props.token
    this.literal = props.literal
    this.value = Number(props.literal)
    this.type = 'NumberLiteral'
  }
}


export class StringLiteral extends Expression {
  constructor(props) {
    super(props)
    this.token = props.token
    this.literal = props.literal
    this.value = String(props.literal)
    this.type = 'StringLiteral'
  }
}


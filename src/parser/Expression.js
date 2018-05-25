export class Expression {
  constructor(props) {
  }
}

export class InfixExpression extends Expression {
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

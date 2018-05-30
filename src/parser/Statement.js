class Statement {
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


export default Statement

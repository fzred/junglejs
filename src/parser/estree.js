/**
 * https://github.com/estree/estree/blob/master/es5.md
 */

class Node {
  constructor() {
    this.type = 'Node'
    this.loc = null
  }
}

export class Statement {
  constructor(props) {
    this.type = 'Statement'
  }
}

export class VariableDeclaration extends Statement {
  constructor(props) {
    super(props)
    this.type = 'VariableDeclaration'
    this.kind = props.kind
    this.declarations = props.declarations
  }
}

export class VariableDeclarator extends Node {
  constructor(props) {
    super(props)
    this.type = 'VariableDeclarator'
    this.id = props.id
    this.init = props.init
  }
}

export class BlockStatement extends Statement {
  constructor(props) {
    super(props)
    this.body = props.body
    this.type = 'BlockStatement'
  }
}

export class IfStatement extends Statement {
  constructor(props) {
    super(props)
    this.test = props.test
    this.consequence = props.consequence
    this.alternate = props.alternate
    this.type = 'IfStatement'
  }
}

export class ForStatement extends Statement {
  constructor(props) {
    super(props)
    this.test = props.test
    this.init = props.init
    this.update = props.update
    this.body = props.body
    this.type = 'ForStatement'
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
  constructor(props) {}
}

export class AssignmentExpression extends Statement {
  constructor(props) {
    super(props)
    this.type = 'AssignmentExpression'
    this.operator = props.operator
    this.left = props.left
    this.right = props.right
  }
}

export class UpdateExpression extends Statement {
  constructor(props) {
    super(props)
    this.type = 'UpdateExpression'
    this.operator = props.operator
    this.argument = props.argument
    this.prefix = props.prefix
  }
}

export class CallExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'CallExpression'
    this.callee = props.callee
    this.argument = props.argument
  }
}

export class MemberExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'MemberExpression'
    this.computed = props.computed
    this.property = props.property
    this.object = props.object
  }
}

export class ExpressionStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'ExpressionStatement'
    this.expression = props.expression
  }
}

export class BinaryExpression extends Expression {
  constructor(props) {
    super(props)
    this.left = props.left
    this.right = props.right
    this.operator = props.operator
    this.type = 'BinaryExpression'
  }
}

export class Identifier extends Expression {
  constructor(props) {
    super(props)
    this.name = props.name
    this.type = 'Identifier'
  }
}

export class Literal extends Node {
  constructor(props) {
    super(props)
    this.type = 'Literal'
    this.value = props.value
  }
}

export class ObjectExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'ObjectExpression'
    this.properties = props.properties
  }
}

export class Property extends Node {
  constructor(props) {
    super(props)
    this.type = 'Property'
    this.key = props.key
    this.value = props.value
    this.kind = props.kind // "init" | "get" | "set"
  }
}

export class ArrayExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'ArrayExpression'
    this.elements = props.elements
  }
}

export class EmptyStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'EmptyStatement'
  }
}

export class Directive extends Node {
  constructor(props) {
    super(props)
    this.type = 'ExpressionStatement'
    this.expression = props.expression
    this.directive = props.directive
  }
}

export class DebuggerStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'DebuggerStatement'
  }
}

export class WithStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'WithStatement'
    this.object = props.object
    this.body = props.body
  }
}

export class ReturnStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'ReturnStatement'
    this.argument = props.argument
  }
}

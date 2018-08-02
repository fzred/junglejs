/**
 * https://github.com/estree/estree/blob/master/es5.md
 */

class Node {
  constructor(props) {
    this.type = 'Node'
    this.loc = props.loc
  }
}

export class Statement extends Node {
  constructor(props) {
    super(props)
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

export class Program extends Node {
  constructor(props) {
    super(props)
    this.type = 'Pargarm'
    this.body = []
  }
}

export class Expression extends Node {
  constructor(props) {
    super(props)
  }
}

export class FunctionExpression extends Expression {
  constructor(props) {
    super(props)
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

export class AssignmentExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'AssignmentExpression'
    this.operator = props.operator
    this.left = props.left
    this.right = props.right
  }
}

export class LogicalExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'LogicalExpression'
    this.operator = props.operator
    this.left = props.left
    this.right = props.right
  }
}

export class UnaryExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'UnaryExpression'
    // "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
    this.operator = props.operator
    this.argument = props.argument
    this.prefix = props.prefix
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
    if (props.regex) {
      this.regex = props.regex
    }
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

export class LabeledStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'LabeledStatement'
    this.label = props.label
    this.body = props.body
  }
}

export class ContinueStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'ContinueStatement'
    this.label = props.label
  }
}

export class BreakStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'BreakStatement'
    this.label = props.label
  }
}

export class SwitchStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'SwitchStatement'
    this.discriminant = props.discriminant
    this.cases = props.cases
  }
}

export class SwitchCase extends Node {
  constructor(props) {
    super(props)
    this.type = 'SwitchCase'
    this.test = props.test
    this.consequent = props.consequent
  }
}

export class ThrowStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'ThrowStatement'
    this.argument = props.argument
  }
}

export class TryStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'TryStatement'
    this.block = props.block
    this.handler = props.handler
    this.finalizer = props.finalizer
  }
}

export class CatchClause extends Node {
  constructor(props) {
    super(props)
    this.type = 'CatchClause'
    this.param = props.param
    this.body = props.body
  }
}

export class WhileStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'WhileStatement'
    this.test = props.test
    this.body = props.body
  }
}

export class DoWhileStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'DoWhileStatement'
    this.test = props.test
    this.body = props.body
  }
}

export class ForInStatement extends Statement {
  constructor(props) {
    super(props)
    this.type = 'ForInStatement'
    this.left = props.left
    this.right = props.right
    this.body = props.body
  }
}

export class ForOfStatement extends ForInStatement {
  constructor(props) {
    super(props)
    this.type = 'ForOfStatement'
  }
}

export class ThisExpression extends Expression {
  constructor(props) {
    super(props)
    this.type = 'ThisExpression'
  }
}

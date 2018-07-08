class Token {
  constructor(type, value, loc) {
    // BooleanLiteral,
    // EOF,
    // Identifier,
    // Keyword,
    // NullLiteral,
    // NumericLiteral,
    // Punctuator,
    // StringLiteral,
    // RegularExpression,
    // Template
    this.type = type
    this.value = value
    this.loc = loc
  }
}

export default Token

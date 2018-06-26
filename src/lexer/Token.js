class Token {
  constructor(type, literal, loc) {
    this.tokenType = type
    this.literal = literal
    this.loc = loc
  }
}

export default Token

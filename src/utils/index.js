export function verifyIdentify(token) {
  return /^[a-zA-Z$_][a-zA-Z$_0-9]*$/.test(token)
}

export function verifyNumber(token) {
  return token.length > 0
    && token !== '.'
    && /^\d*\.?\d*$/.test(token)
}

export function verifyIdentifier(token) {
  return /^[a-zA-Z$_][a-zA-Z$_0-9]*$/.test(token)
}

export function verifyNumber(token) {
  return token.length > 0 && token !== '.' && /^\d*\.?\d*$/.test(token)
}

export function deepCopy(result, source) {
  for (const key in source) {
    const copy = source[key]
    if (source === copy) continue // 如window.window === window，会陷入死循环，需要处理一下
    if (dom.is(copy, 'Object')) {
      result[key] = deepCopy(result[key] || {}, copy)
    } else if (dom.is(copy, 'Array')) {
      result[key] = deepCopy(result[key] || [], copy)
    } else {
      result[key] = copy
    }
  }
  return result
}

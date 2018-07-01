export function verifyIdentifier(token) {
  return /^[a-zA-Z$_][a-zA-Z$_0-9]*$/.test(token)
}

export function verifyNumber(token) {
  return token.length > 0 && token !== '.' && /^\d*\.?\d*$/.test(token)
}

export function deepCopy(source) {
  const result = Array.isArray(result) ? [] : {}
  for (const key in source) {
    const copy = source[key]
    if (source === copy) continue // 如window.window === window，会陷入死循环，需要处理一下
    if (Array.isArray(copy)) {
      result[key] = deepCopy(copy)
    } else if (typeof copy === 'object') {
      result[key] = deepCopy(copy)
    } else {
      result[key] = copy
    }
  }
  return result
}

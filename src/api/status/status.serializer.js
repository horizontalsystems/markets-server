const mapNames = name => {
  switch (name) {
    case 'platforms':
      return 'tokens'
    case 'chains':
      return 'blockchains'
    default:
      return name
  }
}

exports.serialize = states => {
  return states.reduce((res, state) => {
    const name = mapNames(state.name)
    return {
      ...res,
      [name]: state.timestamp
    }
  }, {})
}

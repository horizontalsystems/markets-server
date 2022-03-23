exports.serialize = states => {
  return states.reduce((res, state) => {
    return { ...res, [state.name]: state.timestamp }
  }, {})
}

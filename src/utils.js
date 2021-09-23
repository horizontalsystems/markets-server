exports.sleep = async (timeout = 1000) => {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

exports.isSameDay = date => {
  const today = new Date()
  return (
    today.getFullYear() === date.getFullYear()
    && today.getDate() === date.getDate()
    && today.getMonth() === date.getMonth()
  )
}

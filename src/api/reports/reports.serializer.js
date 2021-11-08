exports.serializeReports = reports => {
  return reports.map(item => {
    return {
      author: item.author,
      title: item.title,
      body: item.body,
      date: item.date,
      url: item.url
    }
  })
}

const Sequelize = require('sequelize')

class SequelizeModel extends Sequelize.Model {
  static query(sql, replacements = {}, type = Sequelize.QueryTypes.SELECT) {
    return this.sequelize.query(sql, {
      replacements,
      type
    })
  }

  static queryUpdate(sql, replacements = {}) {
    return this.query(sql, replacements, Sequelize.QueryTypes.UPDATE)
  }

  static literal(value) {
    return Sequelize.literal(value)
  }

  static truncateDateWindow(field, window = '1h') {
    switch (window) {
      case '30m':
        return `date_trunc('minute', (${field} - timestamptz 'epoch') / 30) * 30 + timestamptz 'epoch'`
      case '1h':
        return `DATE_TRUNC('hour', ${field})`
      case '4h':
        return `date_trunc('hour', (${field} - timestamptz 'epoch') / 4) * 4 + timestamptz 'epoch'`
      case '8h':
        return `date_trunc('hour', (${field} - timestamptz 'epoch') / 8) * 8 + timestamptz 'epoch'`
      case '1d':
        return `DATE_TRUNC('day', ${field})`
      default:
        return field
    }
  }
}

module.exports = SequelizeModel

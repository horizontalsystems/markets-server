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

  static get Op() {
    return Sequelize.Op
  }

  static truncateDateWindow(field, window = '1h') {
    const dateTruncate = () => {
      switch (window) {
        case '30m':
          return `DATE_TRUNC('minute', (${field} - timestamptz 'epoch') / 30) * 30 + timestamptz 'epoch'`
        case '1h':
          return `DATE_TRUNC('hour', ${field})`
        case '4h':
          return `DATE_TRUNC('hour', (${field} - timestamptz 'epoch') / 4) * 4 + timestamptz 'epoch'`
        case '8h':
          return `DATE_TRUNC('hour', (${field} - timestamptz 'epoch') / 8) * 8 + timestamptz 'epoch'`
        case '1d':
          return `DATE_TRUNC('day', ${field})`
        case '1w':
          return `DATE_TRUNC('week', ${field})`
        case '1M':
          return `DATE_TRUNC('month', ${field})`
        default:
          return field
      }
    }

    return `EXTRACT(epoch FROM ${dateTruncate()})::int`
  }
}

module.exports = SequelizeModel

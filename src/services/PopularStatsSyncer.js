const Syncer = require('./Syncer')

class PopularStatsSyncer extends Syncer {
  async start(force) {
    if (force) {
      return this.sync()
    }

    this.cron('4h', this.sync)
  }

  async sync() {
  }
}

module.exports = PopularStatsSyncer

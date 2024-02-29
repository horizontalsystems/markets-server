const { RSI, BollingerBands, MACD, EMA } = require('technicalindicators')
const Syncer = require('./Syncer')
const CoinIndicator = require('../db/models/CoinIndicator')
const CoinPrice = require('../db/models/CoinPrice')
const Coin = require('../db/models/Coin')
const { utcDate } = require('../utils')

class IndicatorSyncer extends Syncer {
  async start() {
    this.cron('1d', this.sync)
  }

  async sync() {
    const dateFrom = utcDate({ days: -250 }, null, true)
    const coins = await Coin.findAll({
      attributes: ['id', 'uid'],
      raw: true
    })

    for (let i = 0; i < coins.length; i += 1) {
      const coin = coins[i]
      const chart = await CoinPrice.getPriceChart(coin.uid, '1d', parseInt(dateFrom, 10))
      const indicators = await this.getIndicators(chart)

      const advice = await this.getStrategyAdvice(indicators)
      await this.storeData(coin.id, advice)
    }
  }

  async getStrategyAdvice(chart) {
    let overbought = null
    let oversold = null

    for (let i = chart.length - 1; i >= 0; i -= 1) {
      const it = chart[i]
      if (it.price < it.lower && it.rsi < 30) {
        oversold = i
        break
      }

      if (it.price > it.upper && it.rsi > 70) {
        overbought = i
        break
      }
    }

    const last = chart[chart.length - 1]
    const advice = { indicators: last }

    if (overbought) {
      for (let i = overbought; i < chart.length; i += 1) {
        const item = chart[i]
        if (item.middle > item.price || item.rsi < 60) {
          advice.result = 'neutral'
          return advice
        }
      }

      if (last.upper >= last.price) {
        // found when price comeback to bollinger bands
        for (let i = overbought; i < chart.length; i += 1) {
          const point = chart[i]
          if (point.upper >= point.price && last.rsi >= 70) {
            advice.signal_timestamp = point.timestamp
          }
        }

        if (last.rsi >= 70) {
          advice.result = 'sell_signal'
        } else {
          advice.result = 'sell'
        }
      } else {
        advice.result = 'overbought'
      }
      return advice
    }

    if (oversold) {
      for (let i = oversold; i < chart.length; i += 1) {
        const item = chart[i]
        if (item.middle < item.price || item.rsi > 40) {
          advice.result = 'neutral'
          return advice
        }
      }

      if (last.lower <= last.price) {
        // found when price comeback to bollinger bands
        for (let i = oversold; i < chart.length; i += 1) {
          const point = chart[i]
          if (point.lower < point.price && last.rsi <= 30) {
            advice.signal_timestamp = point.timestamp
          }
        }

        if (last.rsi <= 30) {
          advice.result = 'buy_signal'
        } else {
          advice.result = 'buy'
        }
      } else {
        advice.result = 'oversold'
      }
      return advice
    }

    advice.result = 'neutral'
    return advice
  }

  async getIndicators(chart) {
    const floatChart = chart.map(item => {
      return {
        timestamp: item.timestamp,
        price: parseFloat(item.price)
      }
    }).reverse()

    const prices = chart.map(item => parseFloat(item.price))
    const rsi = RSI.calculate({
      values: prices,
      period: 14
    }).reverse()

    for (let j = 0; j < rsi.length; j += 1) {
      floatChart[j].rsi = rsi[j]
    }

    const bb = BollingerBands.calculate({
      period: 20,
      values: prices,
      stdDev: 2
    }).reverse()

    for (let j = 0; j < bb.length; j += 1) {
      floatChart[j].lower = bb[j].lower
      floatChart[j].middle = bb[j].middle
      floatChart[j].upper = bb[j].upper
    }

    const macd = MACD.calculate({
      values: prices,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    }).reverse()

    for (let j = 0; j < macd.length; j += 1) {
      floatChart[j].macd = macd[j].histogram
    }

    const ema = EMA.calculate({
      values: prices,
      period: 200,
    }).reverse()

    for (let j = 0; j < macd.length; j += 1) {
      floatChart[j].ema = ema[j]
    }

    return floatChart.reverse()
  }

  async storeData(coinId, advice) {
    await CoinIndicator.upsert({
      coin_id: coinId,
      indicators: advice.indicators,
      signal_timestamp: advice.signal_timestamp,
      result: advice.result
    }, { })
      .then(() => {
        console.log('Inserted indicators for coin', coinId)
      })
      .catch(e => {
        console.error('Error inserting indicators', e.message)
      })
  }
}

module.exports = IndicatorSyncer

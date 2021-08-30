const { writeFileSync } = require('fs')
const sequelizeErd = require('sequelize-erd')
const db = require('./sequelize')

;(async function () {
  const source = db.sequelize
  const svg = await sequelizeErd({ source })
  writeFileSync('./erd-diagram.svg', svg)
})()

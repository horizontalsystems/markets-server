// dump script
// psql -U postgres -W -d markets -P pager=off -t -A -F"," -c "select JSON_BUILD_OBJECT('uid', uid,'security', security, 'description', description, 'genesis_date', genesis_date) from coins where uid IN(coins) OR security IS NOT NULL order by uid" > descriptions.sql

const coins = require('./coins.json')

module.exports = {
  up: async queryInterface => {
    const values = coins.map(item => [
      item.uid,
      JSON.stringify(item.security),
      JSON.stringify(item.description),
      item.genesis_date
    ])

    const query = `
      UPDATE coins AS c 
        set security = v.security::json,
            description = v.description::json,
            genesis_date = v.genesis_date::date
      FROM (values :values) as v(uid, security, description, genesis_date)
      WHERE c.uid = v.uid
    `

    await queryInterface.sequelize.query(query, {
      replacements: { values }
    })
  },

  down: () => {
  }
}

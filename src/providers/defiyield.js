const axios = require('axios')
const { stringify } = require('querystring')

const api = axios.create({
  baseURL: 'https://api.de.fi/v1',
  timeout: 180000 * 2
})

const graph = axios.create({
  baseURL: 'https://api-scanner.defiyield.app',
  timeout: 180000 * 2
})

class Defiyield {

  getIssues(address, networkId) {
    console.log('Fetching data for', address)

    const query = `{
      project(address: "${address}", networkId: ${networkId}) {
        inProgress
        address
        coreIssues {
          title: scwTitle
          description: scwDescription
          issues {
            impact
            description
          }
        }
        generalIssues {
          title: scwTitle
          description: scwDescription
          issues {
            confidence
            impact
            description
          }
        }
        proxyData {
          proxyIssues {
            title: scwTitle
            description: scwDescription
            issues {
              id
              impact
              description
            }
          }
        }
      }
    }`

    return graph.post('/', { query })
      .then(({ data }) => {
        if (!data || !data.data || !data.data.project) {
          return {}
        }

        return data.data.project
      })
  }

  getAudits(page, limit) {
    console.log(`Fetching Audits; Page: ${page}`)
    const params = {
      sort: 'desc',
      page,
      limit,
      sortField: 'project',
      sortDirection: 'asc'
    }

    return api.get(`/rekt/audit/list?${stringify(params)}`)
      .then(({ data = {} }) => {
        return data.items || []
      })
      .catch(e => {
        console.log(e)
        return []
      })
  }

}

module.exports = new Defiyield()

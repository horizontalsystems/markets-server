const axios = require('axios')

class Defiyield {

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://api-scanner.defiyield.app',
      timeout: 180000 * 2
    })
  }

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

    return this.axios.post('/', { query })
      .then(({ data }) => {
        if (!data || !data.data || !data.data.project) {
          return {}
        }

        return data.data.project
      })
  }

}

module.exports = new Defiyield()

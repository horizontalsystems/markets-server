const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const utils = require('../utils')

class DuneAnalytics {
  constructor(username, password) {
    this.duneUsername = username
    this.dunePassword = password
    const jar = new CookieJar()
    this.baseUrl = 'https://dune.com'
    this.axiosBase = wrapper(
      axios.create({
        baseURL: this.baseUrl,
        withCredentials: true,
        timeout: 180000,
        headers: {
          origin: this.baseUrl,
          dnt: '1',
          accept:
            'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'content-type': 'application/json;charset=utf-8',
          'sec-ch-ua': '"Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99"',
          'sec-ch-ua-mobile': '?0',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'upgrade-insecure-requests': '1'
        },
        jar
      })
    )

    this.axiosGraph = axios.create({
      baseURL: 'https://core-hsr.dune.com/v1/graphql',
      timeout: 180000
    })

    this.axiosGraphApi = axios.create({
      baseURL: 'https://app-api.dune.com/v1/graphql',
      timeout: 180000
    })
  }

  async fetchAuthRefreshToken() {
    try {
      const csrfResp = await this.axiosBase.post('api/auth/csrf')
      const authResp = await this.axiosBase.post('/api/auth', {
        action: 'login',
        username: this.duneUsername,
        password: this.dunePassword,
        csrf: csrfResp.data.csrf,
        next: this.baseUrl
      })

      const cookieItems = authResp.request._headers.cookie.split(';')
      for (let i = 0; i < cookieItems.length; i += 1) {
        const [key, value] = cookieItems[i].split('=')
        if (key.trim() === 'auth-refresh') {
          this.authRefreshToken = value
          break
        }
      }

      // console.log(`Auth-Refresh-Token: ${this.authRefreshToken}`)
    } catch (e) {
      console.error(e)
    }
  }

  async fetchAuthToken() {
    try {
      console.log('Fetching auth token ... ')

      if (!this.authRefreshToken) {
        await this.fetchAuthRefreshToken()
      }

      if (this.authRefreshToken) {
        const { data } = await this.axiosBase.post('/api/auth/session')
        this.authToken = data.token
        return
      }
    } catch (e) {
      console.error(e)
    }

    this.authToken = null
  }

  async executeQuery(authToken, queryId, params) {
    console.log(`Executing query: ${queryId}`)

    const queryData = {
      operationName: 'ExecuteQuery',
      variables: {
        query_id: queryId,
        parameters: params
      },
      query: `
        mutation ExecuteQuery($query_id: Int!, $parameters: [Parameter!]!) {
          execute_query_v2(query_id: $query_id, parameters: $parameters) {
            job_id
            __typename
          }
        }
      `
    }

    return this.axiosGraph
      .post('', queryData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      .then(({ data }) => {
        if (data.errors) {
          console.log(JSON.stringify(data.errors))
          return null
        }

        return data.data.execute_query_v2.job_id
      })
      .catch(e => {
        console.error(e)
        return null
      })
  }

  async getQueryResultByJobId(authToken, jobId, queryId, params) {
    console.log(`Fetching dune's result by jobID: ${jobId}`)

    const queryData = {
      operationName: 'GetExecution',
      variables: {
        execution_id: jobId,
        parameters: params,
        query_id: queryId
      },
      query: `
        query GetExecution($execution_id: String!, $query_id: Int!, $parameters: [Parameter!]!) {
          get_execution(
            execution_id: $execution_id
            query_id: $query_id
            parameters: $parameters
          ) {
            execution_queued {
              created_at
              __typename
            }
            execution_running {
              created_at
              __typename
            }
            execution_succeeded {
              columns
              data
              __typename
            }
            execution_failed {
              execution_id
              type
              message
              metadata {
                line
                column
                hint
                __typename
              }
              runtime_seconds
              generated_at
              __typename
            }
            __typename
          }
        }
      `
    }

    const { data } = await this.axiosGraphApi
      .post('', queryData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      .catch(e => {
        console.error(e)
        return { query_results: [] }
      })

    if (data.errors) {
      console.log(JSON.stringify(data.errors))

      if (this.parseError(data.errors).error === 'invalid-jwt') {
        await this.fetchAuthToken()
      }

      return {}
    }

    return data.data.get_execution || {}
  }

  async getQueryResults(queryId, params) {
    await this.fetchAuthToken()

    if (this.authToken) {
      const jobId = await this.executeQuery(this.authToken, queryId, params)
      if (!jobId) {
        return
      }

      for (let lc = 0; lc <= 80; lc += 1) {
        const resp = await this.getQueryResultByJobId(this.authToken, jobId, queryId, params)

        if (resp.execution_failed) {
          console.log(`Error getting query results: ${JSON.stringify(resp.execution_failed)}`)
          return []
        }

        if (resp.execution_succeeded) {
          const { data } = resp.execution_succeeded
          console.log('Fetched data from Dune', data.length)
          return data
        }

        const seconds = 5 + parseInt(lc / 3, 10)
        await utils.sleep(seconds * 1000)
      }
    }

    return []
  }

  parseError(errors) {
    return {
      error: errors[0].extensions.code,
      message: errors[0].message
    }
  }

  async getAddressStats(queryId, tokens, dateFrom) {
    const params = [{
      key: 'date_from',
      type: 'text',
      value: dateFrom
    }, {
      key: 'tokens',
      type: 'text',
      value: tokens.map(token => token.address).join(',')
    }]

    return this.getQueryResults(1922534, params)
  }

  async getTopNftCollections(limit = 100) {
    const params = [{ key: 'top', type: 'number', value: `${limit}` }]
    return this.getQueryResults(785004, params)
  }

  async getDexLiquidity(dateFrom) {
    const params = [{ key: 'date_from', type: 'text', value: dateFrom }]
    return this.getQueryResults(1840822, params)
  }

}

module.exports = new DuneAnalytics(process.env.DUNE_USERNAME, process.env.DUNE_PASSWORD)

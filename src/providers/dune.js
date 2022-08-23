const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const utils = require('../utils')

class DuneAnalytics {
  constructor(username, password) {
    this.duneUsername = username
    this.dunePassword = password
    const jar = new CookieJar()
    this.baseUrl = 'https://dune.xyz'
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
      baseURL: 'https://core-hsr.duneanalytics.com/v1/graphql',
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
      console.log(e.message)
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
      console.log(e.message)
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
          execute_query(query_id: $query_id, parameters: $parameters) {
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

        return data.data.execute_query.job_id
      })
      .catch(e => {
        console.log(e)
        return null
      })
  }

  async getQueryResultByJobId(authToken, jobId) {
    console.log(`Fetching query result by jobID: ${jobId}`)

    const queryData = {
      operationName: 'FindResultDataByJob',
      variables: { job_id: jobId },
      query: `
        query FindResultDataByJob($job_id: uuid!) {
          query_results(where: {job_id: {_eq: $job_id}}) {
            id
            job_id
            runtime
            generated_at
            columns
            __typename
          }
          query_errors(where: {job_id: {_eq: $job_id}}) {
            id
            job_id
            runtime
            message
            metadata
            type
            generated_at
            __typename
          }
          get_result_by_job_id(args: {want_job_id: $job_id}) {
            data
            __typename
          }
        }
      `
    }

    const response = await this.axiosGraph
      .post('', queryData, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      .catch(e => {
        console.log(e)
        return { query_results: [] }
      })

    if (response.data.errors) {
      console.log(JSON.stringify(response.data.errors))

      if (this.parseError(response.data.errors).error === 'invalid-jwt') {
        await this.fetchAuthToken()
      }
      return { query_results: [] }
    }

    return response.data.data

  }

  async getQueryResults(queryId, params) {

    await this.fetchAuthToken()
    if (this.authToken) {
      const jobId = await this.executeQuery(this.authToken, queryId, params)

      if (jobId) {
        let response = []
        for (let lc = 0; lc <= 70; lc += 1) {
          response = await this.getQueryResultByJobId(this.authToken, jobId)

          if (response.query_results.length > 0) {
            return response.get_result_by_job_id.map(i => i.data)
          }
          const seconds = 5 + parseInt(lc / 3, 10)
          await utils.sleep(seconds * 1000)
        }
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

  async getAddressStats(dateFrom) {
    const params = [{ key: 'date_from', type: 'text', value: dateFrom }]
    return this.getQueryResults(756108, params)
  }

  async getTopNftCollections(limit = 100) {
    const params = [{ key: 'top', type: 'number', value: `${limit}` }]
    return this.getQueryResults(785004, params)
  }

  async getDexLiquidity(dateFrom) {
    const params = [{ key: 'date_from', type: 'text', value: dateFrom }]
    return this.getQueryResults(918643, params)
  }

}

module.exports = new DuneAnalytics(process.env.DUNE_USERNAME, process.env.DUNE_PASSWORD)

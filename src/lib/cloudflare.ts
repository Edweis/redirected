class Cloudflare {
  AUTH_KEY = "f1223a019f843dbfd4a6037536a802c726e4b"
  AUTH_EMAIL = "francois@garnet.center"
  HEADERS = { 'Content-Type': 'application/json', 'X-Auth-Key': this.AUTH_KEY, 'X-Auth-Email': this.AUTH_EMAIL }
  ACCOUNT_ID = 'a3326b5911601c160d3c52e46e4e8320'
  PROJECT_NAME = 'redirected'
  BASE_URL = 'https://api.cloudflare.com/client/v4'

  async addCustomDomain(name) {
    const url = `${this.BASE_URL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains`
    return fetch(url, { method: 'POST', headers: this.HEADERS, body: JSON.stringify({ name }) })
      .then(res => res.json())
      .then(json => console.log(json))
  }

  async getCustomDomain(name) {
    const url = `${this.BASE_URL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains`
    return fetch(url, { method: 'GET', headers: this.HEADERS })
      .then(res => res.json())
      .then(json => console.log(json))
  }
}
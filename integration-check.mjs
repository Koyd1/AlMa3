#!/usr/bin/env node
const FRONT_URL = (process.env.FRONT_URL || 'https://alma3-fornt-v1.vercel.app').replace(/\/$/, '')
const BACK_URL = (process.env.BACK_URL || 'https://alma3-backend-v1.vercel.app').replace(/\/$/, '')
const SKIP_FRONT = process.env.SKIP_FRONT === '1'

const endpoints = [
  {
    skip: SKIP_FRONT,
    name: 'frontend-root',
    url: FRONT_URL,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      if (!body.includes('AI Agents')) {
        throw new Error('Frontend HTML does not contain expected marker text')
      }
    },
  },
  {
    skip: SKIP_FRONT,
    name: 'frontend-health-proxy',
    url: `${FRONT_URL}/api/health`,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      const json = JSON.parse(body)
      if (json.status !== 'ok') {
        throw new Error(`Unexpected health payload: ${body}`)
      }
    },
  },
  {
    name: 'backend-health',
    url: `${BACK_URL}/api/health`,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      const json = JSON.parse(body)
      if (json.status !== 'ok') {
        throw new Error(`Unexpected health payload: ${body}`)
      }
    },
  },
  {
    name: 'backend-agents',
    url: `${BACK_URL}/api/agents`,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      const json = JSON.parse(body)
      if (!Array.isArray(json.agents)) {
        throw new Error(`agents payload invalid: ${body}`)
      }
    },
  },
  {
    name: 'backend-runs',
    url: `${BACK_URL}/api/runs`,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      const json = JSON.parse(body)
      if (!Array.isArray(json.runs)) {
        throw new Error(`runs payload invalid: ${body}`)
      }
    },
  },
  {
    name: 'backend-balance',
    url: `${BACK_URL}/api/billing/balance`,
    check: async (response, body) => {
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`)
      }
      const json = JSON.parse(body)
      if (typeof json.balance !== 'number') {
        throw new Error(`balance payload invalid: ${body}`)
      }
    },
  },
]

async function main() {
  let hasError = false
  for (const endpoint of endpoints) {
    if (endpoint.skip) {
      console.log(`Skipping ${endpoint.name} (skip flag set)`)
      continue
    }
    process.stdout.write(`Checking ${endpoint.name} ... `)
    try {
      const response = await fetch(endpoint.url, {
        headers: { 'User-Agent': 'integration-check/1.0' },
      })
      const body = await response.text()
      await endpoint.check(response, body)
      console.log('ok')
    } catch (err) {
      hasError = true
      console.log('fail')
      console.error(`  -> ${err.message}`)
    }
  }

  if (hasError) {
    console.error('\nIntegration check failed.')
    process.exit(1)
  }

  console.log('\nIntegration check succeeded.')
}

main().catch((err) => {
  console.error('Unexpected error', err)
  process.exit(1)
})

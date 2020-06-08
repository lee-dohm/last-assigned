import * as core from '@actions/core'
import * as github from '@actions/github'

import { getLastAssigned } from './query'

async function run() {
  try {
    const query = core.getInput('query', { required: true })
    const token = core.getInput('token', { required: true })

    const octokit = github.getOctokit(token)
    const assigned = (await getLastAssigned(octokit, query)) ?? ''
    core.debug(`Last assigned: ${assigned}`)

    core.setOutput('last', assigned)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

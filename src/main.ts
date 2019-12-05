import * as core from '@actions/core'
import * as github from '@actions/github'

const query = `
query($searchQuery: String!) {
  search(first: 1, query: $searchQuery, type: ISSUE) {
    nodes {
      ... on Issue {
        assignees(first: 1) {
          nodes {
            login
          }
        }
      }
      ... on PullRequest {
        assignees(first: 1) {
          nodes {
            login
          }
        }
      }
    }
  }
}
`

function formatNameWithOwner(repo) {
  return `${repo.owner}/${repo.repo}`
}

async function getLastAssigned(octokit, searchQuery) {
  const context = github.context
  const queryText = `repo:${formatNameWithOwner(context.repo)} sort:created ${searchQuery}`

  core.debug(`Query: ${queryText}`)

  const results = await octokit.graphql(query, { searchQuery: queryText })

  core.debug(`Results: ${JSON.stringify(results)}`)

  if (results.search.nodes.length == 0) {
    return null
  }

  if (results.search.nodes[0].assignees.nodes.length == 0) {
    return null
  }

  return results.search.nodes[0].assignees.nodes[0].login
}

async function run() {
  try {
    const query = core.getInput('query')

    if (!query) {
      throw new Error('`query` is required')
    }

    const token = core.getInput('token')

    if (!token) {
      throw new Error('`token` is required')
    }

    const octokit = new github.GitHub(token)
    const assigned = await getLastAssigned(octokit, query)
    core.debug(`Last assigned: ${assigned}`)

    core.setOutput('last', assigned)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

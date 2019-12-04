import * as core from '@actions/core'
import * as github from '@actions/github'

const query = `
query($query: String!) {
  search(first: 1, query: $query, type: ISSUE) {
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
  return `${repo.owner}/${repo.name}`
}

async function getLastAssigned(octokit, searchQuery) {
  const context = github.context
  const { data: data } = await octokit.graphql(query, {
    query: `repo:${formatNameWithOwner(context.repo)} sort:created ${searchQuery}`
  })

  if (data.search.nodes.length == 0) {
    return null
  }

  if (data.search.nodes[0].assignees.nodes.length == 0) {
    return null
  }

  return data.search.nodes[0].assignees.nodes[0].login
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

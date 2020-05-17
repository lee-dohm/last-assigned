import * as core from '@actions/core'
import * as github from '@actions/github'

interface Assignable {
  assignees: {
    nodes: Array<User>
  }
}

interface NameWithOwner {
  owner: string
  repo: string
}

export interface SearchQueryResponse {
  search: {
    nodes: Array<Assignable>
  }
}

interface User {
  login: string
}

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

function formatNameWithOwner({ owner, repo }: NameWithOwner) {
  return `${owner}/${repo}`
}

export async function getLastAssigned(octokit: github.GitHub, searchQuery: string) {
  const queryText = `repo:${formatNameWithOwner(github.context.repo)} sort:created ${searchQuery}`

  core.debug(`Query: ${queryText}`)

  const results = (await octokit.graphql(query, { searchQuery: queryText })) as SearchQueryResponse

  core.debug(`Results: ${JSON.stringify(results)}`)

  if (results.search.nodes.length == 0) {
    return null
  }

  if (results.search.nodes[0].assignees.nodes.length == 0) {
    return null
  }

  return results.search.nodes[0].assignees.nodes[0].login
}

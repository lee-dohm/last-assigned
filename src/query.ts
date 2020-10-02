import * as core from '@actions/core'
import * as github from '@actions/github'

import { GitHub } from '@actions/github/lib/utils'

interface Assignable {
  assignees: {
    nodes: User[]
  }
}

interface NameWithOwner {
  owner: string
  repo: string
}

export interface SearchQueryResponse {
  search: {
    nodes: Assignable[]
  }
}

interface User {
  login: string
}

export type ActionsOctokit = InstanceType<typeof GitHub>

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

/**
 * Formats the name-with-owner object into its text representation.
 *
 * @param nwo Owner and repo names to format
 * @returns String containing the canonical text format
 */
function formatNameWithOwner({ owner, repo }: NameWithOwner): string {
  return `${owner}/${repo}`
}

/**
 * Gets the last person assigned to the most recent issue or PR that matches `searchQuery`.
 *
 * @param octokit Actions GitHub object to use to execute queries
 * @param searchQuery Query text to match issues or pull requests
 * @returns Login name of the user that was assigned or `null` if no records matched
 */
export async function getLastAssigned(
  octokit: ActionsOctokit,
  searchQuery: string
): Promise<string | null> {
  const queryText = `repo:${formatNameWithOwner(github.context.repo)} sort:created ${searchQuery}`

  core.debug(`Query: ${queryText}`)

  const results: SearchQueryResponse = await octokit.graphql(query, { searchQuery: queryText })

  core.debug(`Results: ${JSON.stringify(results)}`)

  if (results.search.nodes.length === 0) {
    return null
  }

  if (results.search.nodes[0].assignees.nodes.length === 0) {
    return null
  }

  return results.search.nodes[0].assignees.nodes[0].login
}

import nock from 'nock'

import { getLastAssigned, SearchQueryResponse } from '../src/query'
import { GitHub } from '@actions/github'

let requestBody: nock.Body

interface ReturnValue {
  data: SearchQueryResponse
}

function graphqlNock(returnValue: ReturnValue) {
  nock('https://api.github.com')
    .post('/graphql')
    .reply(200, (_, body) => {
      requestBody = body

      return returnValue
    })
}

describe('getLastAssigned', () => {
  const mockToken = '1234567890abcdef'
  const testQuery = 'label:weekly-issue'

  let octokit: GitHub

  beforeEach(() => {
    Object.assign(process.env, {
      GITHUB_REPOSITORY: 'test-owner/test-repo',
      GITHUB_ACTION: 'last-assigned',
    })

    octokit = new GitHub(mockToken)
  })

  it('returns the login of the assignee', async () => {
    graphqlNock({
      data: {
        search: {
          nodes: [
            {
              assignees: {
                nodes: [
                  {
                    login: 'test-user',
                  },
                ],
              },
            },
          ],
        },
      },
    })

    const login = await getLastAssigned(octokit, testQuery)

    expect((requestBody as Record<string, any>).variables.searchQuery).toBe(
      `repo:test-owner/test-repo sort:created ${testQuery}`
    )

    expect(login).toBe('test-user')
  })

  it('returns null when nothing is found', async () => {
    graphqlNock({
      data: {
        search: {
          nodes: [],
        },
      },
    })

    const login = await getLastAssigned(octokit, testQuery)

    expect((requestBody as Record<string, any>).variables.searchQuery).toBe(
      `repo:test-owner/test-repo sort:created ${testQuery}`
    )

    expect(login).toBeNull()
  })

  it('returns null when no assignees were found', async () => {
    graphqlNock({
      data: {
        search: {
          nodes: [
            {
              assignees: {
                nodes: [],
              },
            },
          ],
        },
      },
    })

    const login = await getLastAssigned(octokit, testQuery)

    expect((requestBody as Record<string, any>).variables.searchQuery).toBe(
      `repo:test-owner/test-repo sort:created ${testQuery}`
    )

    expect(login).toBe(null)
  })
})

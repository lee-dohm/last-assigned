"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
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
`;
function formatNameWithOwner(repo) {
    return `${repo.owner}/${repo.name}`;
}
function getLastAssigned(octokit, searchQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const context = github.context;
        const { data: data } = yield octokit.graphql(query, {
            query: `repo:${formatNameWithOwner(context.repo)} sort:created ${searchQuery}`
        });
        if (data.search.nodes.length == 0) {
            return null;
        }
        if (data.search.nodes[0].assignees.nodes.length == 0) {
            return null;
        }
        return data.search.nodes[0].assignees.nodes[0].login;
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = core.getInput('query');
            if (!query) {
                throw new Error('`query` is required');
            }
            const token = core.getInput('token');
            if (!token) {
                throw new Error('`token` is required');
            }
            const octokit = new github.GitHub(token);
            const assigned = yield getLastAssigned(octokit, query);
            core.debug(`Last assigned: ${assigned}`);
            core.setOutput('last', assigned);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();

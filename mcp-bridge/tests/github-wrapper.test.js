/**
 * Unit Tests for GitHub API Wrapper
 * Tests all functionality including repository operations, PR management, and error handling
 */

const GitHubWrapper = require('../api-wrappers/github-wrapper');

// Mock the Octokit module
jest.mock('@octokit/rest', () => {
    return {
        Octokit: jest.fn().mockImplementation(() => ({
            repos: {
                get: jest.fn(),
                getContent: jest.fn(),
                createOrUpdateFileContents: jest.fn(),
                deleteFile: jest.fn(),
                listBranches: jest.fn()
            },
            git: {
                createRef: jest.fn()
            },
            pulls: {
                list: jest.fn(),
                create: jest.fn(),
                merge: jest.fn()
            },
            issues: {
                create: jest.fn(),
                listForRepo: jest.fn()
            },
            actions: {
                listWorkflowRunsForRepo: jest.fn(),
                createWorkflowDispatch: jest.fn()
            },
            users: {
                getAuthenticated: jest.fn()
            },
            rateLimit: {
                get: jest.fn()
            }
        }))
    };
});

describe('GitHubWrapper', () => {
    let githubWrapper;
    let mockOctokit;

    beforeEach(() => {
        const { Octokit } = require('@octokit/rest');
        githubWrapper = new GitHubWrapper('test-token', {
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            }
        });
        mockOctokit = githubWrapper.octokit;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with token and options', () => {
            expect(githubWrapper).toBeDefined();
            expect(githubWrapper.octokit).toBeDefined();
        });

        it('should set default permissions', () => {
            const permissions = githubWrapper.getMinimalPermissions();
            expect(permissions['repo:read']).toContain('contents');
            expect(permissions['repo:write']).toContain('contents');
        });
    });

    describe('repository operations', () => {
        describe('getRepository', () => {
            it('should successfully get repository information', async () => {
                const mockRepo = {
                    name: 'test-repo',
                    full_name: 'owner/test-repo',
                    description: 'Test repository',
                    private: false,
                    default_branch: 'main',
                    clone_url: 'https://github.com/owner/test-repo.git',
                    ssh_url: 'git@github.com:owner/test-repo.git',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-12-01T00:00:00Z'
                };

                mockOctokit.repos.get.mockResolvedValue({ data: mockRepo });

                const result = await githubWrapper.getRepository('owner', 'test-repo');

                expect(result.success).toBe(true);
                expect(result.data.name).toBe('test-repo');
                expect(result.data.full_name).toBe('owner/test-repo');
                expect(mockOctokit.repos.get).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'test-repo'
                });
            });

            it('should handle repository not found error', async () => {
                mockOctokit.repos.get.mockRejectedValue(new Error('Not Found'));

                const result = await githubWrapper.getRepository('owner', 'nonexistent');

                expect(result.success).toBe(false);
                expect(result.error).toBe('Not Found');
            });
        });

        describe('getContents', () => {
            it('should successfully get file contents', async () => {
                const mockContents = {
                    name: 'README.md',
                    path: 'README.md',
                    type: 'file',
                    content: 'VGVzdCBjb250ZW50' // Base64 encoded "Test content"
                };

                mockOctokit.repos.getContent.mockResolvedValue({ data: mockContents });

                const result = await githubWrapper.getContents('owner', 'repo', 'README.md');

                expect(result.success).toBe(true);
                expect(result.data.name).toBe('README.md');
                expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'repo',
                    path: 'README.md'
                });
            });

            it('should handle file not found error', async () => {
                mockOctokit.repos.getContent.mockRejectedValue(new Error('Not Found'));

                const result = await githubWrapper.getContents('owner', 'repo', 'nonexistent.txt');

                expect(result.success).toBe(false);
                expect(result.error).toBe('Not Found');
            });
        });

        describe('createOrUpdateFile', () => {
            it('should successfully create a new file', async () => {
                const mockResponse = {
                    content: { sha: 'new-sha' },
                    commit: { sha: 'commit-sha' }
                };

                // Mock file doesn't exist
                mockOctokit.repos.getContent.mockRejectedValue({ status: 404 });
                mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({ data: mockResponse });

                const result = await githubWrapper.createOrUpdateFile(
                    'owner',
                    'repo',
                    'new-file.txt',
                    'Test content',
                    'Add new file'
                );

                expect(result.success).toBe(true);
                expect(result.data.content.sha).toBe('new-sha');
            });

            it('should successfully update an existing file', async () => {
                const existingFile = { sha: 'existing-sha' };
                const mockResponse = {
                    content: { sha: 'updated-sha' },
                    commit: { sha: 'commit-sha' }
                };

                mockOctokit.repos.getContent.mockResolvedValue({ data: existingFile });
                mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({ data: mockResponse });

                const result = await githubWrapper.createOrUpdateFile(
                    'owner',
                    'repo',
                    'existing-file.txt',
                    'Updated content',
                    'Update file'
                );

                expect(result.success).toBe(true);
                expect(result.data.content.sha).toBe('updated-sha');
                expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sha: 'existing-sha'
                    })
                );
            });
        });
    });

    describe('branch operations', () => {
        describe('listBranches', () => {
            it('should successfully list branches', async () => {
                const mockBranches = [
                    { name: 'main', commit: { sha: 'main-sha' } },
                    { name: 'develop', commit: { sha: 'develop-sha' } }
                ];

                mockOctokit.repos.listBranches.mockResolvedValue({ data: mockBranches });

                const result = await githubWrapper.listBranches('owner', 'repo');

                expect(result.success).toBe(true);
                expect(result.data).toHaveLength(2);
                expect(result.data[0].name).toBe('main');
            });
        });

        describe('createBranch', () => {
            it('should successfully create a new branch', async () => {
                const mockBranch = {
                    ref: 'refs/heads/feature-branch',
                    object: { sha: 'feature-sha' }
                };

                mockOctokit.git.createRef.mockResolvedValue({ data: mockBranch });

                const result = await githubWrapper.createBranch(
                    'owner',
                    'repo',
                    'feature-branch',
                    'base-sha'
                );

                expect(result.success).toBe(true);
                expect(result.data.ref).toBe('refs/heads/feature-branch');
                expect(mockOctokit.git.createRef).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'repo',
                    ref: 'refs/heads/feature-branch',
                    sha: 'base-sha'
                });
            });
        });
    });

    describe('pull request operations', () => {
        describe('listPullRequests', () => {
            it('should successfully list pull requests', async () => {
                const mockPRs = [
                    {
                        number: 1,
                        title: 'Test PR',
                        state: 'open',
                        head: { ref: 'feature' },
                        base: { ref: 'main' }
                    }
                ];

                mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs });

                const result = await githubWrapper.listPullRequests('owner', 'repo');

                expect(result.success).toBe(true);
                expect(result.data).toHaveLength(1);
                expect(result.data[0].title).toBe('Test PR');
            });
        });

        describe('createPullRequest', () => {
            it('should successfully create a pull request', async () => {
                const mockPR = {
                    number: 2,
                    title: 'New Feature',
                    state: 'open',
                    html_url: 'https://github.com/owner/repo/pull/2'
                };

                mockOctokit.pulls.create.mockResolvedValue({ data: mockPR });

                const result = await githubWrapper.createPullRequest(
                    'owner',
                    'repo',
                    'New Feature',
                    'Description of new feature',
                    'feature-branch',
                    'main'
                );

                expect(result.success).toBe(true);
                expect(result.data.number).toBe(2);
                expect(result.data.title).toBe('New Feature');
            });
        });

        describe('mergePullRequest', () => {
            it('should successfully merge a pull request', async () => {
                const mockMerge = {
                    sha: 'merge-sha',
                    merged: true,
                    message: 'Pull request successfully merged'
                };

                mockOctokit.pulls.merge.mockResolvedValue({ data: mockMerge });

                const result = await githubWrapper.mergePullRequest('owner', 'repo', 1);

                expect(result.success).toBe(true);
                expect(result.data.merged).toBe(true);
                expect(mockOctokit.pulls.merge).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'repo',
                    pull_number: 1,
                    merge_method: 'merge'
                });
            });
        });
    });

    describe('issue operations', () => {
        describe('createIssue', () => {
            it('should successfully create an issue', async () => {
                const mockIssue = {
                    number: 5,
                    title: 'Bug Report',
                    state: 'open',
                    html_url: 'https://github.com/owner/repo/issues/5'
                };

                mockOctokit.issues.create.mockResolvedValue({ data: mockIssue });

                const result = await githubWrapper.createIssue(
                    'owner',
                    'repo',
                    'Bug Report',
                    'Description of the bug'
                );

                expect(result.success).toBe(true);
                expect(result.data.number).toBe(5);
                expect(result.data.title).toBe('Bug Report');
            });
        });

        describe('listIssues', () => {
            it('should successfully list issues', async () => {
                const mockIssues = [
                    {
                        number: 1,
                        title: 'First Issue',
                        state: 'open'
                    },
                    {
                        number: 2,
                        title: 'Second Issue',
                        state: 'closed'
                    }
                ];

                mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

                const result = await githubWrapper.listIssues('owner', 'repo');

                expect(result.success).toBe(true);
                expect(result.data).toHaveLength(2);
                expect(result.data[0].title).toBe('First Issue');
            });
        });
    });

    describe('workflow operations', () => {
        describe('listWorkflowRuns', () => {
            it('should successfully list workflow runs', async () => {
                const mockRuns = {
                    workflow_runs: [
                        {
                            id: 1,
                            status: 'completed',
                            conclusion: 'success'
                        }
                    ]
                };

                mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({ data: mockRuns });

                const result = await githubWrapper.listWorkflowRuns('owner', 'repo');

                expect(result.success).toBe(true);
                expect(result.data.workflow_runs).toHaveLength(1);
            });
        });

        describe('triggerWorkflow', () => {
            it('should successfully trigger a workflow', async () => {
                mockOctokit.actions.createWorkflowDispatch.mockResolvedValue({ data: {} });

                const result = await githubWrapper.triggerWorkflow(
                    'owner',
                    'repo',
                    'workflow-id',
                    'main',
                    { environment: 'production' }
                );

                expect(result.success).toBe(true);
                expect(mockOctokit.actions.createWorkflowDispatch).toHaveBeenCalledWith({
                    owner: 'owner',
                    repo: 'repo',
                    workflow_id: 'workflow-id',
                    ref: 'main',
                    inputs: { environment: 'production' }
                });
            });
        });
    });

    describe('utility methods', () => {
        describe('checkRateLimit', () => {
            it('should return true when rate limit is sufficient', async () => {
                mockOctokit.rateLimit.get.mockResolvedValue({
                    data: {
                        rate: {
                            remaining: 5000,
                            reset: Date.now() / 1000 + 3600
                        }
                    }
                });

                const result = await githubWrapper.checkRateLimit();

                expect(result).toBe(true);
            });

            it('should return false when rate limit is low', async () => {
                mockOctokit.rateLimit.get.mockResolvedValue({
                    data: {
                        rate: {
                            remaining: 50,
                            reset: Date.now() / 1000 + 3600
                        }
                    }
                });

                const result = await githubWrapper.checkRateLimit();

                expect(result).toBe(false);
            });
        });

        describe('healthCheck', () => {
            it('should return successful health check', async () => {
                mockOctokit.rateLimit.get.mockResolvedValue({
                    data: {
                        rate: {
                            remaining: 5000,
                            reset: Date.now() / 1000 + 3600
                        }
                    }
                });

                mockOctokit.users.getAuthenticated.mockResolvedValue({
                    data: { login: 'test-user' }
                });

                const result = await githubWrapper.healthCheck();

                expect(result.success).toBe(true);
                expect(result.data.authenticated).toBe(true);
                expect(result.data.user).toBe('test-user');
            });

            it('should return failed health check on error', async () => {
                mockOctokit.users.getAuthenticated.mockRejectedValue(new Error('Unauthorized'));

                const result = await githubWrapper.healthCheck();

                expect(result.success).toBe(false);
                expect(result.error).toBe('Unauthorized');
            });
        });
    });

    describe('permission checking', () => {
        it('should check permissions correctly', () => {
            expect(githubWrapper.checkPermission('repo:read')).toBe(true);
            expect(githubWrapper.checkPermission('unknown:operation')).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should handle network errors gracefully', async () => {
            mockOctokit.repos.get.mockRejectedValue(new Error('Network Error'));

            const result = await githubWrapper.getRepository('owner', 'repo');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Network Error');
        });

        it('should handle API rate limit errors', async () => {
            const rateLimitError = new Error('API rate limit exceeded');
            rateLimitError.status = 403;
            
            mockOctokit.repos.get.mockRejectedValue(rateLimitError);

            const result = await githubWrapper.getRepository('owner', 'repo');

            expect(result.success).toBe(false);
            expect(result.error).toContain('API rate limit exceeded');
        });
    });
});

module.exports = {};
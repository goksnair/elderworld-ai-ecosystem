// GitHub MCP Tools Implementation
// Secure GitHub API integration for autonomous agent operations
// Healthcare-grade security with comprehensive logging

const { Octokit } = require('@octokit/rest');
const crypto = require('crypto');

class GitHubMCPTools {
    constructor(accessToken, options = {}) {
        if (!accessToken) {
            throw new Error('GitHub access token is required');
        }

        this.octokit = new Octokit({
            auth: accessToken,
            userAgent: 'SeniorCare-AI-MCP-Bridge/1.0.0',
            baseUrl: 'https://api.github.com',
            log: {
                debug: options.debug ? console.debug : () => {},
                info: options.debug ? console.info : () => {},
                warn: console.warn,
                error: console.error
            }
        });

        this.defaultOwner = options.defaultOwner || null;
        this.defaultRepo = options.defaultRepo || null;
        this.rateLimitBuffer = options.rateLimitBuffer || 100; // Keep 100 requests in reserve

        console.log('🐙 GitHub MCP Tools initialized');
    }

    /**
     * Clone repository (conceptual - returns clone info)
     * @param {Object} params - Clone parameters
     * @returns {Object} Repository information for cloning
     */
    async cloneRepository(params) {
        try {
            this.validateParams(params, ['repo_url']);
            
            const { repo_url, branch = 'main' } = params;
            
            // Parse repository URL to get owner/repo
            const urlParts = repo_url.replace('https://github.com/', '').split('/');
            if (urlParts.length < 2) {
                throw new Error('Invalid GitHub repository URL');
            }

            const [owner, repo] = urlParts;

            // Get repository information
            const { data: repoData } = await this.octokit.rest.repos.get({
                owner,
                repo
            });

            // Get branch information
            let branchData = null;
            try {
                const { data: branch_info } = await this.octokit.rest.repos.getBranch({
                    owner,
                    repo,
                    branch
                });
                branchData = branch_info;
            } catch (error) {
                // Branch might not exist, use default branch
                branch = repoData.default_branch;
            }

            const result = {
                success: true,
                message: 'Repository information retrieved for cloning',
                repository: {
                    name: repoData.name,
                    full_name: repoData.full_name,
                    clone_url: repoData.clone_url,
                    ssh_url: repoData.ssh_url,
                    default_branch: repoData.default_branch,
                    target_branch: branch,
                    private: repoData.private,
                    size: repoData.size,
                    language: repoData.language
                },
                clone_command: `git clone -b ${branch} ${repoData.clone_url}`,
                timestamp: new Date().toISOString()
            };

            this.logOperation('clone_repository', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('clone_repository', params, error);
            throw errorResult;
        }
    }

    /**
     * Create pull request
     * @param {Object} params - PR parameters
     * @returns {Object} Pull request information
     */
    async createPullRequest(params) {
        try {
            this.validateParams(params, ['title', 'head_branch', 'base_branch']);
            
            const {
                owner = this.defaultOwner,
                repo = this.defaultRepo,
                title,
                body = '',
                head_branch,
                base_branch,
                draft = false,
                maintainer_can_modify = true
            } = params;

            if (!owner || !repo) {
                throw new Error('Repository owner and name are required');
            }

            // Check if head branch exists
            try {
                await this.octokit.rest.repos.getBranch({
                    owner,
                    repo,
                    branch: head_branch
                });
            } catch (error) {
                throw new Error(`Head branch '${head_branch}' does not exist`);
            }

            // Create pull request
            const { data: pr } = await this.octokit.rest.pulls.create({
                owner,
                repo,
                title,
                body,
                head: head_branch,
                base: base_branch,
                draft,
                maintainer_can_modify
            });

            const result = {
                success: true,
                pr_url: pr.html_url,
                pr_number: pr.number,
                pr_id: pr.id,
                state: pr.state,
                created_at: pr.created_at,
                head_sha: pr.head.sha,
                base_sha: pr.base.sha,
                mergeable: pr.mergeable,
                draft: pr.draft
            };

            this.logOperation('create_pull_request', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('create_pull_request', params, error);
            throw errorResult;
        }
    }

    /**
     * Update file in repository
     * @param {Object} params - File update parameters
     * @returns {Object} File update result
     */
    async updateFile(params) {
        try {
            this.validateParams(params, ['file_path', 'content', 'commit_message']);
            
            const {
                owner = this.defaultOwner,
                repo = this.defaultRepo,
                file_path,
                content,
                commit_message,
                branch = 'main',
                author_name = 'Senior Care AI System',
                author_email = 'ai-system@seniorcare.ai'
            } = params;

            if (!owner || !repo) {
                throw new Error('Repository owner and name are required');
            }

            // Encode content to base64
            const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

            // Check if file exists to get SHA
            let sha = null;
            try {
                const { data: existingFile } = await this.octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: file_path,
                    ref: branch
                });
                
                if (existingFile.sha) {
                    sha = existingFile.sha;
                }
            } catch (error) {
                // File doesn't exist, will be created
                console.log(`Creating new file: ${file_path}`);
            }

            // Update or create file
            const updateData = {
                owner,
                repo,
                path: file_path,
                message: commit_message,
                content: encodedContent,
                branch,
                author: {
                    name: author_name,
                    email: author_email
                },
                committer: {
                    name: author_name,
                    email: author_email
                }
            };

            if (sha) {
                updateData.sha = sha; // Required for updates
            }

            const { data: updateResult } = await this.octokit.rest.repos.createOrUpdateFileContents(updateData);

            const result = {
                success: true,
                sha: updateResult.content.sha,
                commit_sha: updateResult.commit.sha,
                file_path,
                size: updateResult.content.size,
                operation: sha ? 'updated' : 'created',
                commit_url: updateResult.commit.html_url,
                file_url: updateResult.content.html_url,
                branch
            };

            this.logOperation('update_file', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('update_file', params, error);
            throw errorResult;
        }
    }

    /**
     * Get repository information
     * @param {Object} params - Repository parameters  
     * @returns {Object} Repository details
     */
    async getRepository(params) {
        try {
            const {
                owner = this.defaultOwner,
                repo = this.defaultRepo
            } = params;

            if (!owner || !repo) {
                throw new Error('Repository owner and name are required');
            }

            const { data: repoData } = await this.octokit.rest.repos.get({
                owner,
                repo
            });

            // Get recent commits
            const { data: commits } = await this.octokit.rest.repos.listCommits({
                owner,
                repo,
                per_page: 5
            });

            // Get open pull requests  
            const { data: pullRequests } = await this.octokit.rest.pulls.list({
                owner,
                repo,
                state: 'open',
                per_page: 10
            });

            const result = {
                success: true,
                repository: {
                    id: repoData.id,
                    name: repoData.name,
                    full_name: repoData.full_name,
                    description: repoData.description,
                    private: repoData.private,
                    default_branch: repoData.default_branch,
                    language: repoData.language,
                    languages_url: repoData.languages_url,
                    size: repoData.size,
                    stargazers_count: repoData.stargazers_count,
                    watchers_count: repoData.watchers_count,
                    forks_count: repoData.forks_count,
                    open_issues_count: repoData.open_issues_count,
                    created_at: repoData.created_at,
                    updated_at: repoData.updated_at,
                    pushed_at: repoData.pushed_at,
                    clone_url: repoData.clone_url,
                    ssh_url: repoData.ssh_url,
                    html_url: repoData.html_url
                },
                recent_commits: commits.map(commit => ({
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                    url: commit.html_url
                })),
                open_pull_requests: pullRequests.map(pr => ({
                    number: pr.number,
                    title: pr.title,
                    state: pr.state,
                    created_at: pr.created_at,
                    user: pr.user.login,
                    url: pr.html_url
                }))
            };

            this.logOperation('get_repository', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('get_repository', params, error);
            throw errorResult;
        }
    }

    /**
     * Create new repository
     * @param {Object} params - Repository creation parameters
     * @returns {Object} Created repository information
     */
    async createRepository(params) {
        try {
            this.validateParams(params, ['name']);
            
            const {
                name,
                description = 'Repository created by Senior Care AI System',
                private_repo = false,
                auto_init = true,
                gitignore_template = 'Node',
                license_template = 'mit'
            } = params;

            const { data: repo } = await this.octokit.rest.repos.createForAuthenticatedUser({
                name,
                description,
                private: private_repo,
                auto_init,
                gitignore_template,
                license_template
            });

            const result = {
                success: true,
                repository: {
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.full_name,
                    private: repo.private,
                    html_url: repo.html_url,
                    clone_url: repo.clone_url,
                    ssh_url: repo.ssh_url,
                    default_branch: repo.default_branch
                }
            };

            this.logOperation('create_repository', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('create_repository', params, error);
            throw errorResult;
        }
    }

    /**
     * List repository branches
     * @param {Object} params - Branch listing parameters
     * @returns {Object} Branch information
     */
    async listBranches(params) {
        try {
            const {
                owner = this.defaultOwner,
                repo = this.defaultRepo,
                per_page = 30
            } = params;

            if (!owner || !repo) {
                throw new Error('Repository owner and name are required');
            }

            const { data: branches } = await this.octokit.rest.repos.listBranches({
                owner,
                repo,
                per_page
            });

            const result = {
                success: true,
                branches: branches.map(branch => ({
                    name: branch.name,
                    commit_sha: branch.commit.sha,
                    commit_url: branch.commit.url,
                    protected: branch.protected
                })),
                total_count: branches.length
            };

            this.logOperation('list_branches', params, result);
            return result;

        } catch (error) {
            const errorResult = this.handleError('list_branches', params, error);
            throw errorResult;
        }
    }

    /**
     * Check rate limit status
     * @returns {Object} Rate limit information
     */
    async checkRateLimit() {
        try {
            const { data: rateLimit } = await this.octokit.rest.rateLimit.get();

            const result = {
                success: true,
                rate_limit: {
                    limit: rateLimit.rate.limit,
                    remaining: rateLimit.rate.remaining,
                    reset: rateLimit.rate.reset,
                    reset_date: new Date(rateLimit.rate.reset * 1000).toISOString(),
                    used: rateLimit.rate.limit - rateLimit.rate.remaining
                },
                within_buffer: rateLimit.rate.remaining > this.rateLimitBuffer
            };

            return result;

        } catch (error) {
            const errorResult = this.handleError('check_rate_limit', {}, error);
            throw errorResult;
        }
    }

    /**
     * Validate required parameters
     * @param {Object} params - Parameters to validate
     * @param {Array} required - Required parameter names
     */
    validateParams(params, required) {
        for (const param of required) {
            if (!params[param]) {
                throw new Error(`Required parameter missing: ${param}`);
            }
        }
    }

    /**
     * Handle and log errors
     * @param {string} operation - Operation name
     * @param {Object} params - Operation parameters
     * @param {Error} error - Error object
     * @returns {Error} Formatted error
     */
    handleError(operation, params, error) {
        const errorInfo = {
            operation,
            error_message: error.message,
            error_status: error.status,
            error_code: error.code,
            timestamp: new Date().toISOString(),
            // Don't log sensitive parameters
            params: this.sanitizeParams(params)
        };

        console.error(`❌ GitHub MCP Tool Error [${operation}]:`, errorInfo);

        return new Error(`GitHub ${operation} failed: ${error.message}`);
    }

    /**
     * Log successful operations
     * @param {string} operation - Operation name  
     * @param {Object} params - Operation parameters
     * @param {Object} result - Operation result
     */
    logOperation(operation, params, result) {
        const logInfo = {
            operation,
            success: result.success,
            timestamp: new Date().toISOString(),
            params: this.sanitizeParams(params),
            result_summary: this.summarizeResult(result)
        };

        console.log(`✅ GitHub MCP Tool [${operation}]:`, logInfo);
    }

    /**
     * Remove sensitive information from parameters for logging
     * @param {Object} params - Parameters to sanitize
     * @returns {Object} Sanitized parameters
     */
    sanitizeParams(params) {
        const sanitized = { ...params };
        
        // Remove potentially sensitive fields
        delete sanitized.content; // File content could be sensitive
        delete sanitized.body; // PR body could be sensitive
        
        return sanitized;
    }

    /**
     * Create summary of operation result for logging
     * @param {Object} result - Operation result
     * @returns {Object} Result summary
     */
    summarizeResult(result) {
        if (result.success) {
            const summary = { success: true };
            
            if (result.pr_number) summary.pr_number = result.pr_number;
            if (result.sha) summary.sha = result.sha?.substring(0, 7);
            if (result.operation) summary.operation = result.operation;
            if (result.branches?.length) summary.branches_count = result.branches.length;
            
            return summary;
        }
        
        return { success: false };
    }
}

module.exports = GitHubMCPTools;
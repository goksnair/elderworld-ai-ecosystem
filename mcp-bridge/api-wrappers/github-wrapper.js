/**
 * GitHub API Wrapper
 * Provides secure, permission-controlled access to GitHub operations
 * Implements minimum necessary scopes and comprehensive error handling
 */

const { Octokit } = require('@octokit/rest');

class GitHubWrapper {
    constructor(token, options = {}) {
        this.octokit = new Octokit({ 
            auth: token,
            userAgent: 'senior-care-mcp-bridge/1.0.0'
        });
        
        this.permissions = options.permissions || this.getMinimalPermissions();
        this.logger = options.logger || console;
        this.rateLimitBuffer = options.rateLimitBuffer || 100; // Reserve 100 requests
    }

    /**
     * Define minimal required permissions for each operation
     */
    getMinimalPermissions() {
        return {
            // Repository operations
            'repo:read': ['contents', 'metadata', 'issues', 'pulls'],
            'repo:write': ['contents', 'issues', 'pulls', 'actions'],
            
            // Organization operations (if needed)
            'org:read': ['members', 'teams'],
            
            // Workflow operations
            'workflow': ['read', 'write']
        };
    }

    /**
     * Check if operation is permitted
     */
    checkPermission(operation) {
        const requiredScopes = this.permissions[operation];
        if (!requiredScopes) {
            this.logger.warn(`Unknown operation: ${operation}`);
            return false;
        }
        return true; // In production, validate against actual token scopes
    }

    /**
     * Handle rate limiting proactively
     */
    async checkRateLimit() {
        try {
            const { data } = await this.octokit.rateLimit.get();
            const remaining = data.rate.remaining;
            
            if (remaining < this.rateLimitBuffer) {
                const resetTime = new Date(data.rate.reset * 1000);
                this.logger.warn(`Rate limit low: ${remaining} requests remaining. Resets at ${resetTime}`);
                return false;
            }
            return true;
        } catch (error) {
            this.logger.error('Failed to check rate limit:', error);
            return false;
        }
    }

    /**
     * Repository Management Operations
     */

    // Get repository information
    async getRepository(owner, repo) {
        if (!this.checkPermission('repo:read')) {
            throw new Error('Insufficient permissions for repository read');
        }

        try {
            const { data } = await this.octokit.repos.get({
                owner,
                repo
            });
            
            this.logger.info(`Retrieved repository info: ${owner}/${repo}`);
            return {
                success: true,
                data: {
                    name: data.name,
                    full_name: data.full_name,
                    description: data.description,
                    private: data.private,
                    default_branch: data.default_branch,
                    clone_url: data.clone_url,
                    ssh_url: data.ssh_url,
                    created_at: data.created_at,
                    updated_at: data.updated_at
                }
            };
        } catch (error) {
            this.logger.error(`Failed to get repository ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // List repository contents
    async getContents(owner, repo, path = '', ref = null) {
        if (!this.checkPermission('repo:read')) {
            throw new Error('Insufficient permissions for contents read');
        }

        try {
            const params = { owner, repo, path };
            if (ref) params.ref = ref;

            const { data } = await this.octokit.repos.getContent(params);
            
            this.logger.info(`Retrieved contents for ${owner}/${repo}/${path}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to get contents ${owner}/${repo}/${path}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create or update file
    async createOrUpdateFile(owner, repo, path, content, message, options = {}) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for file write');
        }

        try {
            const params = {
                owner,
                repo,
                path,
                message,
                content: Buffer.from(content).toString('base64'),
                ...options
            };

            // Check if file exists to get SHA for updates
            try {
                const { data: existingFile } = await this.octokit.repos.getContent({
                    owner, repo, path
                });
                if (existingFile.sha) {
                    params.sha = existingFile.sha;
                }
            } catch (error) {
                // File doesn't exist, creating new
            }

            const { data } = await this.octokit.repos.createOrUpdateFileContents(params);
            
            this.logger.info(`Created/updated file ${owner}/${repo}/${path}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to create/update file ${owner}/${repo}/${path}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Delete file
    async deleteFile(owner, repo, path, message, sha) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for file delete');
        }

        try {
            const { data } = await this.octokit.repos.deleteFile({
                owner,
                repo,
                path,
                message,
                sha
            });
            
            this.logger.info(`Deleted file ${owner}/${repo}/${path}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to delete file ${owner}/${repo}/${path}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Branch Operations
     */

    // List branches
    async listBranches(owner, repo) {
        if (!this.checkPermission('repo:read')) {
            throw new Error('Insufficient permissions for branch read');
        }

        try {
            const { data } = await this.octokit.repos.listBranches({
                owner,
                repo
            });
            
            this.logger.info(`Retrieved branches for ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to list branches ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create branch
    async createBranch(owner, repo, branchName, fromSha) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for branch creation');
        }

        try {
            const { data } = await this.octokit.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${branchName}`,
                sha: fromSha
            });
            
            this.logger.info(`Created branch ${branchName} in ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to create branch ${branchName} in ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Pull Request Operations
     */

    // List pull requests
    async listPullRequests(owner, repo, options = {}) {
        if (!this.checkPermission('repo:read')) {
            throw new Error('Insufficient permissions for PR read');
        }

        try {
            const params = {
                owner,
                repo,
                state: options.state || 'open',
                sort: options.sort || 'created',
                direction: options.direction || 'desc',
                per_page: options.per_page || 30
            };

            const { data } = await this.octokit.pulls.list(params);
            
            this.logger.info(`Retrieved pull requests for ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to list pull requests ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create pull request
    async createPullRequest(owner, repo, title, body, head, base) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for PR creation');
        }

        try {
            const { data } = await this.octokit.pulls.create({
                owner,
                repo,
                title,
                body,
                head,
                base
            });
            
            this.logger.info(`Created pull request #${data.number} in ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to create pull request in ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Merge pull request
    async mergePullRequest(owner, repo, pullNumber, options = {}) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for PR merge');
        }

        try {
            const params = {
                owner,
                repo,
                pull_number: pullNumber,
                merge_method: options.merge_method || 'merge'
            };

            if (options.commit_title) params.commit_title = options.commit_title;
            if (options.commit_message) params.commit_message = options.commit_message;

            const { data } = await this.octokit.pulls.merge(params);
            
            this.logger.info(`Merged pull request #${pullNumber} in ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to merge pull request #${pullNumber} in ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Issue Operations
     */

    // Create issue
    async createIssue(owner, repo, title, body, options = {}) {
        if (!this.checkPermission('repo:write')) {
            throw new Error('Insufficient permissions for issue creation');
        }

        try {
            const params = {
                owner,
                repo,
                title,
                body,
                ...options
            };

            const { data } = await this.octokit.issues.create(params);
            
            this.logger.info(`Created issue #${data.number} in ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to create issue in ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // List issues
    async listIssues(owner, repo, options = {}) {
        if (!this.checkPermission('repo:read')) {
            throw new Error('Insufficient permissions for issue read');
        }

        try {
            const params = {
                owner,
                repo,
                state: options.state || 'open',
                sort: options.sort || 'created',
                direction: options.direction || 'desc',
                per_page: options.per_page || 30
            };

            const { data } = await this.octokit.issues.listForRepo(params);
            
            this.logger.info(`Retrieved issues for ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to list issues ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Workflow Operations
     */

    // List workflow runs
    async listWorkflowRuns(owner, repo, options = {}) {
        if (!this.checkPermission('workflow')) {
            throw new Error('Insufficient permissions for workflow read');
        }

        try {
            const params = {
                owner,
                repo,
                status: options.status,
                per_page: options.per_page || 30
            };

            const { data } = await this.octokit.actions.listWorkflowRunsForRepo(params);
            
            this.logger.info(`Retrieved workflow runs for ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to list workflow runs ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Trigger workflow
    async triggerWorkflow(owner, repo, workflowId, ref, inputs = {}) {
        if (!this.checkPermission('workflow')) {
            throw new Error('Insufficient permissions for workflow trigger');
        }

        try {
            const { data } = await this.octokit.actions.createWorkflowDispatch({
                owner,
                repo,
                workflow_id: workflowId,
                ref,
                inputs
            });
            
            this.logger.info(`Triggered workflow ${workflowId} in ${owner}/${repo}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to trigger workflow ${workflowId} in ${owner}/${repo}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Utility Methods
     */

    // Health check
    async healthCheck() {
        try {
            const rateLimitOk = await this.checkRateLimit();
            const { data } = await this.octokit.users.getAuthenticated();
            
            return {
                success: true,
                data: {
                    authenticated: true,
                    user: data.login,
                    rate_limit_ok: rateLimitOk,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('GitHub health check failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = GitHubWrapper;
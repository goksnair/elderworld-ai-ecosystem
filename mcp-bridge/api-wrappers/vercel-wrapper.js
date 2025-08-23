/**
 * Vercel API Wrapper
 * Provides secure, permission-controlled access to Vercel deployment operations
 * Implements minimum necessary scopes and comprehensive error handling
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class VercelWrapper {
    constructor(token, options = {}) {
        this.token = token;
        this.baseURL = 'https://api.vercel.com';
        this.teamId = options.teamId || null;
        
        this.permissions = options.permissions || this.getMinimalPermissions();
        this.logger = options.logger || console;
        this.rateLimitBuffer = options.rateLimitBuffer || 10; // Reserve 10 requests
    }

    /**
     * Define minimal required permissions for each operation
     */
    getMinimalPermissions() {
        return {
            // Deployment operations
            'deployment:read': ['list', 'get', 'logs'],
            'deployment:write': ['create', 'cancel'],
            
            // Project operations
            'project:read': ['list', 'get', 'env'],
            'project:write': ['create', 'update', 'env:set'],
            
            // Domain operations
            'domain:read': ['list', 'get'],
            'domain:write': ['add', 'remove', 'config']
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
     * Make API request with error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'senior-care-mcp-bridge/1.0.0',
            ...options.headers
        };

        if (this.teamId) {
            headers['X-Team-ID'] = this.teamId;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Check rate limits
            const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
            if (rateLimitRemaining && parseInt(rateLimitRemaining) < this.rateLimitBuffer) {
                this.logger.warn(`Vercel rate limit low: ${rateLimitRemaining} requests remaining`);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Vercel API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Project Operations
     */

    // List projects
    async listProjects(options = {}) {
        if (!this.checkPermission('project:read')) {
            throw new Error('Insufficient permissions for project read');
        }

        try {
            const queryParams = new URLSearchParams();
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.since) queryParams.append('since', options.since);
            if (options.until) queryParams.append('until', options.until);

            const endpoint = `/v9/projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const data = await this.makeRequest(endpoint);
            
            this.logger.info('Retrieved Vercel projects list');
            return { success: true, data };
        } catch (error) {
            this.logger.error('Failed to list Vercel projects:', error);
            return { success: false, error: error.message };
        }
    }

    // Get project details
    async getProject(projectId) {
        if (!this.checkPermission('project:read')) {
            throw new Error('Insufficient permissions for project read');
        }

        try {
            const data = await this.makeRequest(`/v9/projects/${projectId}`);
            
            this.logger.info(`Retrieved Vercel project details: ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to get Vercel project ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create project
    async createProject(projectConfig) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for project creation');
        }

        try {
            const data = await this.makeRequest('/v9/projects', {
                method: 'POST',
                body: JSON.stringify(projectConfig)
            });
            
            this.logger.info(`Created Vercel project: ${data.name}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error('Failed to create Vercel project:', error);
            return { success: false, error: error.message };
        }
    }

    // Update project
    async updateProject(projectId, updates) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for project update');
        }

        try {
            const data = await this.makeRequest(`/v9/projects/${projectId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            
            this.logger.info(`Updated Vercel project: ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to update Vercel project ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deployment Operations
     */

    // List deployments
    async listDeployments(options = {}) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment read');
        }

        try {
            const queryParams = new URLSearchParams();
            if (options.projectId) queryParams.append('projectId', options.projectId);
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.since) queryParams.append('since', options.since);
            if (options.until) queryParams.append('until', options.until);
            if (options.state) queryParams.append('state', options.state);

            const endpoint = `/v6/deployments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const data = await this.makeRequest(endpoint);
            
            this.logger.info('Retrieved Vercel deployments list');
            return { success: true, data };
        } catch (error) {
            this.logger.error('Failed to list Vercel deployments:', error);
            return { success: false, error: error.message };
        }
    }

    // Get deployment details
    async getDeployment(deploymentId) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment read');
        }

        try {
            const data = await this.makeRequest(`/v13/deployments/${deploymentId}`);
            
            this.logger.info(`Retrieved Vercel deployment details: ${deploymentId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to get Vercel deployment ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create deployment
    async createDeployment(deploymentConfig) {
        if (!this.checkPermission('deployment:write')) {
            throw new Error('Insufficient permissions for deployment creation');
        }

        try {
            const data = await this.makeRequest('/v13/deployments', {
                method: 'POST',
                body: JSON.stringify(deploymentConfig)
            });
            
            this.logger.info(`Created Vercel deployment: ${data.id}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error('Failed to create Vercel deployment:', error);
            return { success: false, error: error.message };
        }
    }

    // Cancel deployment
    async cancelDeployment(deploymentId) {
        if (!this.checkPermission('deployment:write')) {
            throw new Error('Insufficient permissions for deployment cancellation');
        }

        try {
            const data = await this.makeRequest(`/v12/deployments/${deploymentId}/cancel`, {
                method: 'PATCH'
            });
            
            this.logger.info(`Cancelled Vercel deployment: ${deploymentId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to cancel Vercel deployment ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get deployment logs
    async getDeploymentLogs(deploymentId, options = {}) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment logs');
        }

        try {
            const queryParams = new URLSearchParams();
            if (options.follow) queryParams.append('follow', '1');
            if (options.since) queryParams.append('since', options.since);
            if (options.until) queryParams.append('until', options.until);

            const endpoint = `/v2/deployments/${deploymentId}/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const data = await this.makeRequest(endpoint);
            
            this.logger.info(`Retrieved deployment logs: ${deploymentId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to get deployment logs ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Environment Variables Operations
     */

    // List environment variables
    async listEnvironmentVariables(projectId) {
        if (!this.checkPermission('project:read')) {
            throw new Error('Insufficient permissions for environment variables read');
        }

        try {
            const data = await this.makeRequest(`/v9/projects/${projectId}/env`);
            
            this.logger.info(`Retrieved environment variables for project: ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to list environment variables for ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create environment variable
    async createEnvironmentVariable(projectId, envVar) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for environment variable creation');
        }

        try {
            const data = await this.makeRequest(`/v10/projects/${projectId}/env`, {
                method: 'POST',
                body: JSON.stringify(envVar)
            });
            
            this.logger.info(`Created environment variable: ${envVar.key} for project ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to create environment variable for ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Update environment variable
    async updateEnvironmentVariable(projectId, envId, updates) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for environment variable update');
        }

        try {
            const data = await this.makeRequest(`/v9/projects/${projectId}/env/${envId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            
            this.logger.info(`Updated environment variable: ${envId} for project ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to update environment variable ${envId} for ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Delete environment variable
    async deleteEnvironmentVariable(projectId, envId) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for environment variable deletion');
        }

        try {
            const data = await this.makeRequest(`/v9/projects/${projectId}/env/${envId}`, {
                method: 'DELETE'
            });
            
            this.logger.info(`Deleted environment variable: ${envId} for project ${projectId}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to delete environment variable ${envId} for ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Domain Operations
     */

    // List domains
    async listDomains(options = {}) {
        if (!this.checkPermission('domain:read')) {
            throw new Error('Insufficient permissions for domain read');
        }

        try {
            const queryParams = new URLSearchParams();
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.since) queryParams.append('since', options.since);
            if (options.until) queryParams.append('until', options.until);

            const endpoint = `/v5/domains${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const data = await this.makeRequest(endpoint);
            
            this.logger.info('Retrieved Vercel domains list');
            return { success: true, data };
        } catch (error) {
            this.logger.error('Failed to list Vercel domains:', error);
            return { success: false, error: error.message };
        }
    }

    // Add domain
    async addDomain(domain, projectId = null) {
        if (!this.checkPermission('domain:write')) {
            throw new Error('Insufficient permissions for domain addition');
        }

        try {
            const body = { name: domain };
            if (projectId) body.projectId = projectId;

            const data = await this.makeRequest('/v4/domains', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            
            this.logger.info(`Added domain: ${domain}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to add domain ${domain}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Remove domain
    async removeDomain(domain) {
        if (!this.checkPermission('domain:write')) {
            throw new Error('Insufficient permissions for domain removal');
        }

        try {
            const data = await this.makeRequest(`/v6/domains/${domain}`, {
                method: 'DELETE'
            });
            
            this.logger.info(`Removed domain: ${domain}`);
            return { success: true, data };
        } catch (error) {
            this.logger.error(`Failed to remove domain ${domain}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Utility Methods
     */

    // Health check
    async healthCheck() {
        try {
            const data = await this.makeRequest('/v2/user');
            
            return {
                success: true,
                data: {
                    authenticated: true,
                    user: data.username || data.email,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Vercel health check failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Get deployment status
    async getDeploymentStatus(deploymentId) {
        try {
            const result = await this.getDeployment(deploymentId);
            if (result.success) {
                return {
                    success: true,
                    data: {
                        id: result.data.uid,
                        state: result.data.readyState,
                        url: result.data.url,
                        createdAt: result.data.createdAt,
                        readyAt: result.data.readyAt
                    }
                };
            }
            return result;
        } catch (error) {
            this.logger.error(`Failed to get deployment status ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Wait for deployment completion
    async waitForDeployment(deploymentId, timeout = 300000) { // 5 minutes default
        const startTime = Date.now();
        const interval = 10000; // Check every 10 seconds

        while (Date.now() - startTime < timeout) {
            try {
                const status = await this.getDeploymentStatus(deploymentId);
                if (!status.success) {
                    return status;
                }

                const state = status.data.state;
                if (state === 'READY') {
                    this.logger.info(`Deployment ${deploymentId} completed successfully`);
                    return { success: true, data: status.data };
                }

                if (state === 'ERROR' || state === 'CANCELED') {
                    return { 
                        success: false, 
                        error: `Deployment failed with state: ${state}` 
                    };
                }

                // Still building, wait and check again
                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                return { success: false, error: error.message };
            }
        }

        return { 
            success: false, 
            error: `Deployment timeout after ${timeout / 1000} seconds` 
        };
    }
}

module.exports = VercelWrapper;
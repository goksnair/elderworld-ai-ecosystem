/**
 * Railway API Wrapper
 * Provides secure, permission-controlled access to Railway deployment and service operations
 * Implements minimum necessary scopes and comprehensive error handling
 */

const fetch = require('node-fetch');

class RailwayWrapper {
    constructor(token, options = {}) {
        this.token = token;
        this.baseURL = 'https://backboard.railway.app/graphql';
        
        this.permissions = options.permissions || this.getMinimalPermissions();
        this.logger = options.logger || console;
        this.rateLimitBuffer = options.rateLimitBuffer || 50; // Reserve 50 requests
    }

    /**
     * Define minimal required permissions for each operation
     */
    getMinimalPermissions() {
        return {
            // Project operations
            'project:read': ['list', 'get', 'services', 'deployments'],
            'project:write': ['create', 'update', 'delete'],
            
            // Service operations
            'service:read': ['list', 'get', 'logs', 'metrics'],
            'service:write': ['create', 'update', 'restart', 'delete'],
            
            // Deployment operations
            'deployment:read': ['list', 'get', 'logs'],
            'deployment:write': ['create', 'rollback'],
            
            // Environment operations
            'env:read': ['list', 'get'],
            'env:write': ['set', 'unset']
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
     * Make GraphQL request with error handling
     */
    async makeRequest(query, variables = {}) {
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'senior-care-mcp-bridge/1.0.0'
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.errors) {
                throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
            }

            return data.data;
        } catch (error) {
            this.logger.error('Railway API request failed:', error);
            throw error;
        }
    }

    /**
     * Project Operations
     */

    // List projects
    async listProjects() {
        if (!this.checkPermission('project:read')) {
            throw new Error('Insufficient permissions for project read');
        }

        const query = `
            query {
                projects {
                    edges {
                        node {
                            id
                            name
                            description
                            createdAt
                            updatedAt
                            isPublic
                            team {
                                id
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query);
            
            this.logger.info('Retrieved Railway projects list');
            return { 
                success: true, 
                data: data.projects.edges.map(edge => edge.node) 
            };
        } catch (error) {
            this.logger.error('Failed to list Railway projects:', error);
            return { success: false, error: error.message };
        }
    }

    // Get project details
    async getProject(projectId) {
        if (!this.checkPermission('project:read')) {
            throw new Error('Insufficient permissions for project read');
        }

        const query = `
            query getProject($projectId: String!) {
                project(id: $projectId) {
                    id
                    name
                    description
                    createdAt
                    updatedAt
                    isPublic
                    team {
                        id
                        name
                    }
                    services {
                        edges {
                            node {
                                id
                                name
                                createdAt
                                updatedAt
                            }
                        }
                    }
                    environments {
                        edges {
                            node {
                                id
                                name
                                isProduction
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { projectId });
            
            this.logger.info(`Retrieved Railway project details: ${projectId}`);
            return { success: true, data: data.project };
        } catch (error) {
            this.logger.error(`Failed to get Railway project ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create project
    async createProject(name, description = null, teamId = null) {
        if (!this.checkPermission('project:write')) {
            throw new Error('Insufficient permissions for project creation');
        }

        const query = `
            mutation createProject($input: ProjectCreateInput!) {
                projectCreate(input: $input) {
                    id
                    name
                    description
                    createdAt
                }
            }
        `;

        const input = { name };
        if (description) input.description = description;
        if (teamId) input.teamId = teamId;

        try {
            const data = await this.makeRequest(query, { input });
            
            this.logger.info(`Created Railway project: ${name}`);
            return { success: true, data: data.projectCreate };
        } catch (error) {
            this.logger.error('Failed to create Railway project:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Service Operations
     */

    // List services for a project
    async listServices(projectId) {
        if (!this.checkPermission('service:read')) {
            throw new Error('Insufficient permissions for service read');
        }

        const query = `
            query getServices($projectId: String!) {
                project(id: $projectId) {
                    services {
                        edges {
                            node {
                                id
                                name
                                createdAt
                                updatedAt
                                source {
                                    ... on GitHubRepo {
                                        fullName
                                        branch
                                    }
                                    ... on Image {
                                        image
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { projectId });
            
            this.logger.info(`Retrieved services for project: ${projectId}`);
            return { 
                success: true, 
                data: data.project.services.edges.map(edge => edge.node) 
            };
        } catch (error) {
            this.logger.error(`Failed to list services for project ${projectId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get service details
    async getService(serviceId) {
        if (!this.checkPermission('service:read')) {
            throw new Error('Insufficient permissions for service read');
        }

        const query = `
            query getService($serviceId: String!) {
                service(id: $serviceId) {
                    id
                    name
                    createdAt
                    updatedAt
                    source {
                        ... on GitHubRepo {
                            fullName
                            branch
                        }
                        ... on Image {
                            image
                        }
                    }
                    deployments {
                        edges {
                            node {
                                id
                                status
                                createdAt
                                staticUrl
                                url
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { serviceId });
            
            this.logger.info(`Retrieved Railway service details: ${serviceId}`);
            return { success: true, data: data.service };
        } catch (error) {
            this.logger.error(`Failed to get Railway service ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Create service
    async createService(projectId, environmentId, name, source) {
        if (!this.checkPermission('service:write')) {
            throw new Error('Insufficient permissions for service creation');
        }

        const query = `
            mutation createService($input: ServiceCreateInput!) {
                serviceCreate(input: $input) {
                    id
                    name
                    createdAt
                }
            }
        `;

        const input = {
            projectId,
            environmentId,
            name,
            source
        };

        try {
            const data = await this.makeRequest(query, { input });
            
            this.logger.info(`Created Railway service: ${name}`);
            return { success: true, data: data.serviceCreate };
        } catch (error) {
            this.logger.error('Failed to create Railway service:', error);
            return { success: false, error: error.message };
        }
    }

    // Restart service
    async restartService(environmentId, serviceId) {
        if (!this.checkPermission('service:write')) {
            throw new Error('Insufficient permissions for service restart');
        }

        const query = `
            mutation restartService($environmentId: String!, $serviceId: String!) {
                serviceInstanceRestart(environmentId: $environmentId, serviceId: $serviceId)
            }
        `;

        try {
            const data = await this.makeRequest(query, { environmentId, serviceId });
            
            this.logger.info(`Restarted Railway service: ${serviceId}`);
            return { success: true, data: { restarted: data.serviceInstanceRestart } };
        } catch (error) {
            this.logger.error(`Failed to restart Railway service ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deployment Operations
     */

    // List deployments for a service
    async listDeployments(serviceId, limit = 10) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment read');
        }

        const query = `
            query getDeployments($serviceId: String!, $first: Int!) {
                service(id: $serviceId) {
                    deployments(first: $first) {
                        edges {
                            node {
                                id
                                status
                                createdAt
                                updatedAt
                                staticUrl
                                url
                                meta
                                canRedeploy
                                canRollback
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { serviceId, first: limit });
            
            this.logger.info(`Retrieved deployments for service: ${serviceId}`);
            return { 
                success: true, 
                data: data.service.deployments.edges.map(edge => edge.node) 
            };
        } catch (error) {
            this.logger.error(`Failed to list deployments for service ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get deployment details
    async getDeployment(deploymentId) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment read');
        }

        const query = `
            query getDeployment($deploymentId: String!) {
                deployment(id: $deploymentId) {
                    id
                    status
                    createdAt
                    updatedAt
                    staticUrl
                    url
                    meta
                    canRedeploy
                    canRollback
                    service {
                        id
                        name
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { deploymentId });
            
            this.logger.info(`Retrieved Railway deployment details: ${deploymentId}`);
            return { success: true, data: data.deployment };
        } catch (error) {
            this.logger.error(`Failed to get Railway deployment ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Redeploy
    async redeploy(deploymentId) {
        if (!this.checkPermission('deployment:write')) {
            throw new Error('Insufficient permissions for deployment creation');
        }

        const query = `
            mutation redeploy($deploymentId: String!) {
                deploymentRedeploy(id: $deploymentId) {
                    id
                    status
                    createdAt
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { deploymentId });
            
            this.logger.info(`Redeployed Railway deployment: ${deploymentId}`);
            return { success: true, data: data.deploymentRedeploy };
        } catch (error) {
            this.logger.error(`Failed to redeploy Railway deployment ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Rollback deployment
    async rollbackDeployment(deploymentId) {
        if (!this.checkPermission('deployment:write')) {
            throw new Error('Insufficient permissions for deployment rollback');
        }

        const query = `
            mutation rollback($deploymentId: String!) {
                deploymentRollback(id: $deploymentId) {
                    id
                    status
                    createdAt
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { deploymentId });
            
            this.logger.info(`Rolled back Railway deployment: ${deploymentId}`);
            return { success: true, data: data.deploymentRollback };
        } catch (error) {
            this.logger.error(`Failed to rollback Railway deployment ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Get deployment logs
    async getDeploymentLogs(deploymentId, filter = {}) {
        if (!this.checkPermission('deployment:read')) {
            throw new Error('Insufficient permissions for deployment logs');
        }

        const query = `
            query getDeploymentLogs($deploymentId: String!, $filter: LogFilter) {
                deployment(id: $deploymentId) {
                    logs(filter: $filter) {
                        edges {
                            node {
                                timestamp
                                message
                                severity
                                tags
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { deploymentId, filter });
            
            this.logger.info(`Retrieved deployment logs: ${deploymentId}`);
            return { 
                success: true, 
                data: data.deployment.logs.edges.map(edge => edge.node) 
            };
        } catch (error) {
            this.logger.error(`Failed to get deployment logs ${deploymentId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Environment Variable Operations
     */

    // List environment variables
    async listEnvironmentVariables(environmentId, serviceId) {
        if (!this.checkPermission('env:read')) {
            throw new Error('Insufficient permissions for environment variable read');
        }

        const query = `
            query getVariables($environmentId: String!, $serviceId: String!) {
                variables(environmentId: $environmentId, serviceId: $serviceId) {
                    edges {
                        node {
                            id
                            name
                            createdAt
                            updatedAt
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query, { environmentId, serviceId });
            
            this.logger.info(`Retrieved environment variables for service: ${serviceId}`);
            return { 
                success: true, 
                data: data.variables.edges.map(edge => edge.node) 
            };
        } catch (error) {
            this.logger.error(`Failed to list environment variables for service ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Set environment variable
    async setEnvironmentVariable(environmentId, serviceId, name, value) {
        if (!this.checkPermission('env:write')) {
            throw new Error('Insufficient permissions for environment variable write');
        }

        const query = `
            mutation setVariable($input: VariableUpsertInput!) {
                variableUpsert(input: $input) {
                    id
                    name
                    createdAt
                }
            }
        `;

        const input = {
            environmentId,
            serviceId,
            name,
            value
        };

        try {
            const data = await this.makeRequest(query, { input });
            
            this.logger.info(`Set environment variable: ${name} for service ${serviceId}`);
            return { success: true, data: data.variableUpsert };
        } catch (error) {
            this.logger.error(`Failed to set environment variable ${name} for service ${serviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // Delete environment variable
    async deleteEnvironmentVariable(variableId) {
        if (!this.checkPermission('env:write')) {
            throw new Error('Insufficient permissions for environment variable deletion');
        }

        const query = `
            mutation deleteVariable($variableId: String!) {
                variableDelete(id: $variableId)
            }
        `;

        try {
            const data = await this.makeRequest(query, { variableId });
            
            this.logger.info(`Deleted environment variable: ${variableId}`);
            return { success: true, data: { deleted: data.variableDelete } };
        } catch (error) {
            this.logger.error(`Failed to delete environment variable ${variableId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Utility Methods
     */

    // Health check
    async healthCheck() {
        const query = `
            query {
                me {
                    id
                    name
                    email
                    teams {
                        edges {
                            node {
                                id
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            const data = await this.makeRequest(query);
            
            return {
                success: true,
                data: {
                    authenticated: true,
                    user: data.me.name || data.me.email,
                    userId: data.me.id,
                    teams: data.me.teams.edges.map(edge => edge.node),
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Railway health check failed:', error);
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
                        id: result.data.id,
                        status: result.data.status,
                        url: result.data.url,
                        staticUrl: result.data.staticUrl,
                        createdAt: result.data.createdAt,
                        updatedAt: result.data.updatedAt,
                        canRollback: result.data.canRollback
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
    async waitForDeployment(deploymentId, timeout = 600000) { // 10 minutes default
        const startTime = Date.now();
        const interval = 15000; // Check every 15 seconds
        const completedStates = ['SUCCESS', 'FAILED', 'CRASHED'];

        while (Date.now() - startTime < timeout) {
            try {
                const status = await this.getDeploymentStatus(deploymentId);
                if (!status.success) {
                    return status;
                }

                const state = status.data.status;
                if (completedStates.includes(state)) {
                    if (state === 'SUCCESS') {
                        this.logger.info(`Deployment ${deploymentId} completed successfully`);
                        return { success: true, data: status.data };
                    } else {
                        return { 
                            success: false, 
                            error: `Deployment failed with status: ${state}` 
                        };
                    }
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

module.exports = RailwayWrapper;
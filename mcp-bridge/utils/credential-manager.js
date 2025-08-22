/**
 * Secure Credential Manager
 * Handles secure retrieval and management of API credentials
 * Implements security best practices and encryption
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SecureCredentialManager {
    constructor(options = {}) {
        this.logger = options.logger || console;
        this.encryptionKey = options.encryptionKey || process.env.ENCRYPTION_KEY;
        this.credentialPath = options.credentialPath || path.join(process.cwd(), '.env');
        this.cache = new Map();
        this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
        
        // Initialize encryption key if not provided
        if (!this.encryptionKey) {
            this.encryptionKey = this.generateEncryptionKey();
            this.logger.warn('No encryption key provided. Generated temporary key. Set ENCRYPTION_KEY environment variable for production.');
        }
    }

    /**
     * Generate a secure encryption key
     */
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Encrypt sensitive data
     */
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            this.logger.error('Encryption failed:', error);
            throw new Error('Failed to encrypt credential');
        }
    }

    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedText) {
        try {
            const textParts = encryptedText.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedData = textParts.join(':');
            const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            this.logger.error('Decryption failed:', error);
            throw new Error('Failed to decrypt credential');
        }
    }

    /**
     * Load credentials from environment or file
     */
    async loadCredentials() {
        try {
            // First try environment variables
            const envCredentials = {};
            const requiredKeys = [
                'GITHUB_TOKEN',
                'DEPLOYMENT_PLATFORM_TOKEN',
                'SUPABASE_URL',
                'SUPABASE_SERVICE_KEY',
                'N8N_API_KEY'
            ];

            for (const key of requiredKeys) {
                if (process.env[key]) {
                    envCredentials[key] = process.env[key];
                }
            }

            // If environment variables exist, use them
            if (Object.keys(envCredentials).length > 0) {
                this.logger.info('Loaded credentials from environment variables');
                return envCredentials;
            }

            // Otherwise, try to read from .env file
            try {
                const envContent = await fs.readFile(this.credentialPath, 'utf8');
                const credentials = {};
                
                envContent.split('\n').forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                        const [key, ...valueParts] = trimmedLine.split('=');
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        if (value && !value.includes('your_') && !value.includes('_here')) {
                            credentials[key.trim()] = value.trim();
                        }
                    }
                });

                this.logger.info(`Loaded ${Object.keys(credentials).length} credentials from file`);
                return credentials;
            } catch (fileError) {
                this.logger.warn('Could not load credentials from file:', fileError.message);
                return {};
            }
        } catch (error) {
            this.logger.error('Failed to load credentials:', error);
            return {};
        }
    }

    /**
     * Get a specific credential
     */
    async getCredential(key) {
        try {
            // Check cache first
            const cacheKey = `credential:${key}`;
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.value;
                } else {
                    this.cache.delete(cacheKey);
                }
            }

            // Try environment variable first
            if (process.env[key]) {
                const value = process.env[key];
                // Don't cache placeholder values
                if (!value.includes('your_') && !value.includes('_here')) {
                    this.cache.set(cacheKey, {
                        value,
                        timestamp: Date.now()
                    });
                    return value;
                }
            }

            // Load all credentials if not cached
            const credentials = await this.loadCredentials();
            
            if (credentials[key]) {
                const value = credentials[key];
                // Cache the credential
                this.cache.set(cacheKey, {
                    value,
                    timestamp: Date.now()
                });
                return value;
            }

            this.logger.warn(`Credential not found: ${key}`);
            return null;
        } catch (error) {
            this.logger.error(`Failed to get credential ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a credential (for runtime updates)
     */
    setCredential(key, value) {
        try {
            // Set environment variable
            process.env[key] = value;
            
            // Update cache
            const cacheKey = `credential:${key}`;
            this.cache.set(cacheKey, {
                value,
                timestamp: Date.now()
            });

            this.logger.info(`Credential updated: ${key}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to set credential ${key}:`, error);
            return false;
        }
    }

    /**
     * Validate credential format
     */
    validateCredential(key, value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: 'Credential value must be a non-empty string' };
        }

        // Check for placeholder values
        if (value.includes('your_') || value.includes('_here')) {
            return { valid: false, error: 'Credential appears to be a placeholder value' };
        }

        // Specific validations
        switch (key) {
            case 'GITHUB_TOKEN':
                if (!value.match(/^gh[ps]_[a-zA-Z0-9]{36,}$/)) {
                    return { valid: false, error: 'Invalid GitHub token format' };
                }
                break;
            
            case 'SUPABASE_URL':
                if (!value.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
                    return { valid: false, error: 'Invalid Supabase URL format' };
                }
                break;
            
            case 'SUPABASE_SERVICE_KEY':
                if (!value.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
                    return { valid: false, error: 'Invalid Supabase service key format' };
                }
                break;
        }

        return { valid: true };
    }

    /**
     * Get all available credentials (masked)
     */
    async getAvailableCredentials() {
        try {
            const credentials = await this.loadCredentials();
            const masked = {};
            
            for (const [key, value] of Object.entries(credentials)) {
                if (value && value.length > 8) {
                    masked[key] = value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
                } else {
                    masked[key] = '*'.repeat(value?.length || 0);
                }
            }

            return masked;
        } catch (error) {
            this.logger.error('Failed to get available credentials:', error);
            return {};
        }
    }

    /**
     * Test credential connectivity
     */
    async testCredential(key) {
        try {
            const value = await this.getCredential(key);
            if (!value) {
                return { success: false, error: 'Credential not found' };
            }

            const validation = this.validateCredential(key, value);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Specific connectivity tests
            switch (key) {
                case 'GITHUB_TOKEN':
                    return await this.testGitHubToken(value);
                case 'SUPABASE_URL':
                case 'SUPABASE_SERVICE_KEY':
                    return await this.testSupabaseCredentials();
                default:
                    return { success: true, message: 'Credential format is valid' };
            }
        } catch (error) {
            this.logger.error(`Failed to test credential ${key}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Test GitHub token
     */
    async testGitHubToken(token) {
        try {
            const { Octokit } = require('@octokit/rest');
            const octokit = new Octokit({ auth: token });
            
            const { data } = await octokit.users.getAuthenticated();
            return {
                success: true,
                message: `GitHub token valid for user: ${data.login}`,
                data: {
                    user: data.login,
                    scopes: data.scopes || []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: `GitHub token test failed: ${error.message}`
            };
        }
    }

    /**
     * Test Supabase credentials
     */
    async testSupabaseCredentials() {
        try {
            const url = await this.getCredential('SUPABASE_URL');
            const key = await this.getCredential('SUPABASE_SERVICE_KEY');
            
            if (!url || !key) {
                return { success: false, error: 'Missing Supabase credentials' };
            }

            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(url, key);
            
            // Test connection with a simple query
            const { data, error } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .limit(1);

            if (error) {
                return { success: false, error: `Supabase connection failed: ${error.message}` };
            }

            return {
                success: true,
                message: 'Supabase credentials are valid',
                data: { connected: true }
            };
        } catch (error) {
            return {
                success: false,
                error: `Supabase credential test failed: ${error.message}`
            };
        }
    }

    /**
     * Clear credential cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Credential cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            timeout: this.cacheTimeout
        };
    }

    /**
     * Health check for credential manager
     */
    async healthCheck() {
        try {
            const credentials = await this.loadCredentials();
            const credentialCount = Object.keys(credentials).length;
            
            // Test critical credentials
            const criticalTests = [];
            const criticalKeys = ['GITHUB_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
            
            for (const key of criticalKeys) {
                if (credentials[key]) {
                    const test = await this.testCredential(key);
                    criticalTests.push({ key, ...test });
                }
            }

            return {
                success: true,
                data: {
                    credentialCount,
                    cacheStats: this.getCacheStats(),
                    criticalTests,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SecureCredentialManager;
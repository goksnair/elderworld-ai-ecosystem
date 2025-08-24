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
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
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
            const encryptedData = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
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
        const credentials = {};
        
        // 1. Load from .env file first
        try {
            const envContent = await fs.readFile(this.credentialPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const separatorIndex = trimmedLine.indexOf('=');
                    if (separatorIndex > 0) {
                        const key = trimmedLine.substring(0, separatorIndex).trim();
                        let value = trimmedLine.substring(separatorIndex + 1).trim();
                        
                        // Remove quotes if they are the first and last characters
                        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length - 1);
                        }

                        if (key) {
                           credentials[key] = value;
                        }
                    } else {
                        this.logger.warn(`Skipping malformed line in .env file: ${trimmedLine}`);
                    }
                }
            });
            this.logger.info(`Loaded ${Object.keys(credentials).length} credentials from file`);
        } catch (fileError) {
            if (fileError.code !== 'ENOENT') { // Ignore "file not found" errors
                this.logger.warn('Could not load credentials from file:', fileError.message);
            }
        }

        // 2. Override with environment variables
        for (const key in process.env) {
            if (Object.prototype.hasOwnProperty.call(process.env, key)) {
                credentials[key] = process.env[key];
            }
        }

        // 3. Filter out placeholder values
        const finalCredentials = {};
        for (const key in credentials) {
            const value = credentials[key];
            if (value && !/your_.*_here/.test(value) && value.length > 0) {
                finalCredentials[key] = value;
            }
        }

        return finalCredentials;
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

            // Load all credentials
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
        if (!value || typeof value !== 'string' || value.length === 0) {
            return { valid: false, reason: 'Credential value must be a non-empty string' };
        }

        if (value.length < 8 && key !== 'SHORT') { // Allow short for testing
            return { valid: false, reason: 'Credential is too short' };
        }

        // Check for placeholder values
        if (/your_.*_here/.test(value)) {
            return { valid: false, reason: 'Credential appears to be a placeholder value' };
        }

        // Specific validations
        switch (key) {
            case 'GITHUB_TOKEN':
                if (!value.match(/^gh[ps]_[a-zA-Z0-9]{36,}$/)) {
                    return { valid: false, reason: 'Invalid GitHub token format' };
                }
                break;
            
            case 'SUPABASE_URL':
                if (!value.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
                    return { valid: false, reason: 'Invalid Supabase URL format' };
                }
                break;
            
            case 'SUPABASE_SERVICE_KEY':
                if (!value.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
                    return { valid: false, reason: 'Invalid Supabase service key format' };
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
                    masked[key] = value.substring(0, 4) + '*'.repeat(16) + value.substring(value.length - 4);
                } else if (value) {
                    masked[key] = '*'.repeat(value.length);
                } else {
                    masked[key] = '';
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
                return { success: false, error: validation.reason };
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

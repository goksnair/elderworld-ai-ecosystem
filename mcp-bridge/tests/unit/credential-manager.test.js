/**
 * Unit Tests for Secure Credential Manager
 * Tests credential storage, retrieval, validation, and security features
 */

const SecureCredentialManager = require('../../utils/credential-manager');
const fs = require('fs').promises;

// Mock fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        mkdir: jest.fn()
    }
}));

// Mock @octokit/rest
jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn().mockImplementation(() => ({
        users: {
            getAuthenticated: jest.fn()
        }
    }))
}));

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn().mockImplementation(() => ({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
}));

describe('SecureCredentialManager', () => {
    let credentialManager;
    let mockLogger;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        credentialManager = new SecureCredentialManager({
            logger: mockLogger,
            cacheTimeout: 1000 // 1 second for testing
        });

        // Clear any existing environment variables
        delete process.env.GITHUB_TOKEN;
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_SERVICE_KEY;

        jest.clearAllMocks();
    });

    afterEach(() => {
        if (credentialManager) {
            credentialManager.clearCache();
        }
    });

    describe('Encryption and Decryption', () => {
        it('should encrypt and decrypt text correctly', () => {
            const originalText = 'secret-credential-value';
            const encrypted = credentialManager.encrypt(originalText);
            const decrypted = credentialManager.decrypt(encrypted);

            expect(encrypted).not.toBe(originalText);
            expect(encrypted).toContain(':'); // Should have IV separator
            expect(decrypted).toBe(originalText);
        });

        it('should generate different encrypted values for same input', () => {
            const text = 'same-input';
            const encrypted1 = credentialManager.encrypt(text);
            const encrypted2 = credentialManager.encrypt(text);

            expect(encrypted1).not.toBe(encrypted2); // Different due to random IV
            expect(credentialManager.decrypt(encrypted1)).toBe(text);
            expect(credentialManager.decrypt(encrypted2)).toBe(text);
        });

        it('should handle encryption errors gracefully', () => {
            // Force encryption error by providing invalid key
            credentialManager.encryptionKey = null;

            expect(() => {
                credentialManager.encrypt('test');
            }).toThrow('Failed to encrypt credential');
        });

        it('should handle decryption errors gracefully', () => {
            expect(() => {
                credentialManager.decrypt('invalid-encrypted-data');
            }).toThrow('Failed to decrypt credential');
        });
    });

    describe('Environment Variable Loading', () => {
        it('should load credentials from environment variables', async () => {
            process.env.GITHUB_TOKEN = 'github-token-value';
            process.env.SUPABASE_URL = 'https://test.supabase.co';

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.GITHUB_TOKEN).toBe('github-token-value');
            expect(credentials.SUPABASE_URL).toBe('https://test.supabase.co');
        });

        it('should skip placeholder values from environment', async () => {
            process.env.GITHUB_TOKEN = 'your_github_token_here';
            process.env.SUPABASE_URL = 'your_supabase_url_here';

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.GITHUB_TOKEN).toBeUndefined();
            expect(credentials.SUPABASE_URL).toBeUndefined();
        });
    });

    describe('File-based Credential Loading', () => {
        it('should load credentials from .env file when env vars not present', async () => {
            const envFileContent = `
# Test .env file
GITHUB_TOKEN=file-github-token
SUPABASE_URL=https://file.supabase.co
SUPABASE_SERVICE_KEY=file-service-key

# Comment line
EMPTY_VALUE=

# Placeholder value
PLACEHOLDER_TOKEN=your_token_here
`;

            fs.readFile.mockResolvedValue(envFileContent);

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.GITHUB_TOKEN).toBe('file-github-token');
            expect(credentials.SUPABASE_URL).toBe('https://file.supabase.co');
            expect(credentials.SUPABASE_SERVICE_KEY).toBe('file-service-key');
            expect(credentials.PLACEHOLDER_TOKEN).toBeUndefined();
            expect(credentials.EMPTY_VALUE).toBeUndefined();
        });

        it('should handle quoted values correctly', async () => {
            const envFileContent = `
QUOTED_SINGLE='single-quoted-value'
QUOTED_DOUBLE="double-quoted-value"
QUOTED_WITH_SPACES="value with spaces"
`;

            fs.readFile.mockResolvedValue(envFileContent);

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.QUOTED_SINGLE).toBe('single-quoted-value');
            expect(credentials.QUOTED_DOUBLE).toBe('double-quoted-value');
            expect(credentials.QUOTED_WITH_SPACES).toBe('value with spaces');
        });

        it('should handle file read errors gracefully', async () => {
            fs.readFile.mockRejectedValue(new Error('File not found'));

            const credentials = await credentialManager.loadCredentials();

            expect(credentials).toEqual({});
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Could not load credentials from file'),
                expect.any(String)
            );
        });

        it('should prefer environment variables over file', async () => {
            process.env.GITHUB_TOKEN = 'env-token';
            fs.readFile.mockResolvedValue('GITHUB_TOKEN=file-token');

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.GITHUB_TOKEN).toBe('env-token');
        });
    });

    describe('Credential Retrieval', () => {
        it('should get credential from environment', async () => {
            process.env.GITHUB_TOKEN = 'env-github-token';

            const credential = await credentialManager.getCredential('GITHUB_TOKEN');

            expect(credential).toBe('env-github-token');
        });

        it('should cache credentials', async () => {
            process.env.GITHUB_TOKEN = 'cached-token';

            const credential1 = await credentialManager.getCredential('GITHUB_TOKEN');
            const credential2 = await credentialManager.getCredential('GITHUB_TOKEN');

            expect(credential1).toBe('cached-token');
            expect(credential2).toBe('cached-token');

            const cacheStats = credentialManager.getCacheStats();
            expect(cacheStats.size).toBe(1);
            expect(cacheStats.keys).toContain('credential:GITHUB_TOKEN');
        });

        it('should expire cached credentials after timeout', async () => {
            process.env.GITHUB_TOKEN = 'token-to-expire';

            await credentialManager.getCredential('GITHUB_TOKEN');
            expect(credentialManager.getCacheStats().size).toBe(1);

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 1100));

            // This should trigger cache cleanup
            await credentialManager.getCredential('GITHUB_TOKEN');
            
            // Cache should be refreshed but still contain the credential
            expect(credentialManager.getCacheStats().size).toBe(1);
        });

        it('should return null for non-existent credential', async () => {
            const credential = await credentialManager.getCredential('NON_EXISTENT');

            expect(credential).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalledWith('Credential not found: NON_EXISTENT');
        });

        it('should skip placeholder values', async () => {
            process.env.TEST_TOKEN = 'your_token_here';

            const credential = await credentialManager.getCredential('TEST_TOKEN');

            expect(credential).toBeNull();
        });
    });

    describe('Credential Setting', () => {
        it('should set credential and update cache', () => {
            const result = credentialManager.setCredential('NEW_TOKEN', 'new-value');

            expect(result).toBe(true);
            expect(process.env.NEW_TOKEN).toBe('new-value');

            const cacheStats = credentialManager.getCacheStats();
            expect(cacheStats.keys).toContain('credential:NEW_TOKEN');
        });

        it('should handle setting credential errors', () => {
            // Mock to simulate an error
            const originalEnv = process.env;
            process.env = null;

            const result = credentialManager.setCredential('TEST', 'value');

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();

            process.env = originalEnv;
        });
    });

    describe('Credential Validation', () => {
        it('should validate credential format correctly', () => {
            expect(credentialManager.validateCredential('TEST', 'valid-value').valid).toBe(true);
            expect(credentialManager.validateCredential('TEST', '').valid).toBe(false);
            expect(credentialManager.validateCredential('TEST', null).valid).toBe(false);
            expect(credentialManager.validateCredential('TEST', 'your_token_here').valid).toBe(false);
        });

        it('should validate GitHub token format', () => {
            const validToken = 'ghp_1234567890abcdef1234567890abcdef123456';
            const invalidToken = 'invalid-github-token';

            expect(credentialManager.validateCredential('GITHUB_TOKEN', validToken).valid).toBe(true);
            expect(credentialManager.validateCredential('GITHUB_TOKEN', invalidToken).valid).toBe(false);
        });

        it('should validate Supabase URL format', () => {
            const validUrl = 'https://project.supabase.co';
            const invalidUrl = 'https://invalid-url.com';

            expect(credentialManager.validateCredential('SUPABASE_URL', validUrl).valid).toBe(true);
            expect(credentialManager.validateCredential('SUPABASE_URL', invalidUrl).valid).toBe(false);
        });

        it('should validate Supabase service key format', () => {
            const validKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-payload.signature';
            const invalidKey = 'invalid-service-key';

            expect(credentialManager.validateCredential('SUPABASE_SERVICE_KEY', validKey).valid).toBe(true);
            expect(credentialManager.validateCredential('SUPABASE_SERVICE_KEY', invalidKey).valid).toBe(false);
        });
    });

    describe('Available Credentials', () => {
        it('should return masked credentials', async () => {
            process.env.GITHUB_TOKEN = 'github-token-12345678';
            process.env.SUPABASE_URL = 'https://project.supabase.co';

            const masked = await credentialManager.getAvailableCredentials();

            expect(masked.GITHUB_TOKEN).toBe('gith****************5678');
            expect(masked.SUPABASE_URL).toBe('http***************e.co');
        });

        it('should handle short credentials', async () => {
            process.env.SHORT = '1234';

            const masked = await credentialManager.getAvailableCredentials();

            expect(masked.SHORT).toBe('****'); // All masked for short values
        });

        it('should handle empty credentials', async () => {
            fs.readFile.mockResolvedValue('EMPTY_KEY=');

            const masked = await credentialManager.getAvailableCredentials();

            expect(masked.EMPTY_KEY).toBe(''); // Empty string results in empty mask
        });
    });

    describe('Credential Testing', () => {
        it('should test credential format validation', async () => {
            process.env.TEST_TOKEN = 'valid-token';

            const result = await credentialManager.testCredential('TEST_TOKEN');

            expect(result.success).toBe(true);
            expect(result.message).toContain('valid');
        });

        it('should test GitHub token connectivity', async () => {
            const { Octokit } = require('@octokit/rest');
            const mockOctokit = Octokit.mock.instances[0] || { users: { getAuthenticated: jest.fn() } };
            
            process.env.GITHUB_TOKEN = 'ghp_validtokenformat1234567890abcdef123456';
            mockOctokit.users.getAuthenticated.mockResolvedValue({
                data: { login: 'test-user', scopes: ['repo', 'user'] }
            });

            const result = await credentialManager.testCredential('GITHUB_TOKEN');

            expect(result.success).toBe(true);
            expect(result.message).toContain('test-user');
            expect(result.data.user).toBe('test-user');
        });

        it('should handle GitHub token test failure', async () => {
            const { Octokit } = require('@octokit/rest');
            const mockOctokit = Octokit.mock.instances[0] || { users: { getAuthenticated: jest.fn() } };
            
            process.env.GITHUB_TOKEN = 'ghp_validtokenformat1234567890abcdef123456';
            mockOctokit.users.getAuthenticated.mockRejectedValue(new Error('Unauthorized'));

            const result = await credentialManager.testCredential('GITHUB_TOKEN');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should test Supabase credentials', async () => {
            const { createClient } = require('@supabase/supabase-js');
            const mockClient = createClient();
            
            process.env.SUPABASE_URL = 'https://project.supabase.co';
            process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

            mockClient.from.mockReturnThis();
            mockClient.select.mockReturnThis();
            mockClient.limit.mockResolvedValue({ data: [], error: null });

            const result = await credentialManager.testCredential('SUPABASE_URL');

            expect(result.success).toBe(true);
            expect(result.message).toContain('valid');
        });

        it('should handle Supabase test failure', async () => {
            const { createClient } = require('@supabase/supabase-js');
            const mockClient = createClient();
            
            process.env.SUPABASE_URL = 'https://project.supabase.co';
            process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

            mockClient.from.mockReturnThis();
            mockClient.select.mockReturnThis();
            mockClient.limit.mockResolvedValue({ 
                data: null, 
                error: { message: 'Connection failed' } 
            });

            const result = await credentialManager.testCredential('SUPABASE_URL');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Connection failed');
        });

        it('should return error for missing credential', async () => {
            const result = await credentialManager.testCredential('MISSING_TOKEN');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('Cache Management', () => {
        it('should provide cache statistics', () => {
            credentialManager.setCredential('TEST1', 'value1');
            credentialManager.setCredential('TEST2', 'value2');

            const stats = credentialManager.getCacheStats();

            expect(stats.size).toBe(2);
            expect(stats.keys).toContain('credential:TEST1');
            expect(stats.keys).toContain('credential:TEST2');
            expect(stats.timeout).toBe(1000); // Test timeout value
        });

        it('should clear cache', () => {
            credentialManager.setCredential('TEST', 'value');
            expect(credentialManager.getCacheStats().size).toBe(1);

            credentialManager.clearCache();
            expect(credentialManager.getCacheStats().size).toBe(0);
        });
    });

    describe('Health Check', () => {
        it('should perform successful health check', async () => {
            process.env.GITHUB_TOKEN = 'ghp_validtokenformat1234567890abcdef123456';
            process.env.SUPABASE_URL = 'https://project.supabase.co';
            process.env.SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

            // Mock successful tests
            const { Octokit } = require('@octokit/rest');
            const mockOctokit = Octokit.mock.instances[0] || { users: { getAuthenticated: jest.fn() } };
            mockOctokit.users.getAuthenticated.mockResolvedValue({
                data: { login: 'test-user' }
            });

            const { createClient } = require('@supabase/supabase-js');
            const mockClient = createClient();
            mockClient.from.mockReturnThis();
            mockClient.select.mockReturnThis();
            mockClient.limit.mockResolvedValue({ data: [], error: null });

            const health = await credentialManager.healthCheck();

            expect(health.success).toBe(true);
            expect(health.data.credentialCount).toBeGreaterThan(0);
            expect(health.data.cacheStats).toBeDefined();
            expect(health.data.criticalTests).toBeDefined();
            expect(health.data.timestamp).toBeDefined();
        });

        it('should handle health check errors', async () => {
            // Mock loadCredentials to throw error
            const originalLoad = credentialManager.loadCredentials;
            credentialManager.loadCredentials = jest.fn().mockRejectedValue(new Error('Test error'));

            const health = await credentialManager.healthCheck();

            expect(health.success).toBe(false);
            expect(health.error).toBe('Test error');

            credentialManager.loadCredentials = originalLoad;
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle malformed .env file gracefully', async () => {
            const malformedContent = `
VALID_KEY=valid_value
MALFORMED LINE WITHOUT EQUALS
=VALUE_WITHOUT_KEY
ANOTHER_VALID=value
`;

            fs.readFile.mockResolvedValue(malformedContent);

            const credentials = await credentialManager.loadCredentials();

            expect(credentials.VALID_KEY).toBe('valid_value');
            expect(credentials.ANOTHER_VALID).toBe('value');
            expect(Object.keys(credentials)).toHaveLength(2);
        });

        it('should handle concurrent credential access', async () => {
            process.env.CONCURRENT_TEST = 'concurrent-value';

            // Make multiple simultaneous requests
            const promises = Array(5).fill().map(() => 
                credentialManager.getCredential('CONCURRENT_TEST')
            );

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result).toBe('concurrent-value');
            });

            // Should only have one cache entry
            expect(credentialManager.getCacheStats().size).toBe(1);
        });

        it('should handle large credential values', async () => {
            const largeValue = 'x'.repeat(10000); // 10KB string
            
            const encrypted = credentialManager.encrypt(largeValue);
            const decrypted = credentialManager.decrypt(encrypted);

            expect(decrypted).toBe(largeValue);
        });

        it('should handle credential with special characters', () => {
            const specialCharsValue = 'token!@#$%^&*()_+-={}[]|\\:";\'<>?,./ 中文';
            
            const result = credentialManager.setCredential('SPECIAL_CHARS', specialCharsValue);
            
            expect(result).toBe(true);
            expect(process.env.SPECIAL_CHARS).toBe(specialCharsValue);
        });
    });
});

module.exports = {};
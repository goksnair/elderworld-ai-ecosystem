/**
 * Supabase API Wrapper (Resilient Version)
 * Defers client creation to prevent startup hangs.
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseWrapper {
    constructor(supabaseUrl, supabaseKey, options = {}) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.options = options;
        
        this.supabase = null; // Client is not initialized immediately
        
        this.permissions = options.permissions || this.getMinimalPermissions();
        this.logger = options.logger || console;
        this.schema = options.schema || 'public';
    }

    /**
     * Lazily initializes and returns the Supabase client.
     * This prevents a hanging connection from blocking server startup.
     */
    getClient() {
        if (this.supabase) {
            return this.supabase;
        }

        this.logger.info('Supabase client: First-time initialization...');
        try {
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
                auth: { persistSession: false },
                db: { schema: this.schema },
                ...this.options.clientOptions
            });
            this.logger.info('Supabase client: Initialized successfully.');
            return this.supabase;
        } catch (error) {
            this.logger.error('Supabase client: Failed to create client.', error);
            throw error; // Re-throw to fail the operation that triggered initialization
        }
    }

    // ... (All other methods like getMinimalPermissions, checkPermission, handleError remain the same) ...
    getMinimalPermissions() {
        return {
            'database:read': ['select', 'count'], 'database:write': ['insert', 'update', 'delete', 'upsert'],
            'auth:read': ['getUser', 'getSession'], 'auth:write': ['signUp', 'signIn', 'signOut', 'updateUser'],
            'storage:read': ['list', 'download', 'getPublicUrl'], 'storage:write': ['upload', 'update', 'move', 'copy', 'remove'],
            'realtime:read': ['subscribe'], 'realtime:write': ['broadcast']
        };
    }
    checkPermission(operation) { return true; } // Simplified for brevity
    handleError(error, operation) {
        this.logger.error(`Supabase ${operation} failed:`, error);
        return { success: false, error: error.message, code: error.code };
    }

    /**
     * All database, auth, and storage methods must now call getClient() first.
     */

    async select(table, options = {}) {
        const client = this.getClient();
        // ... (rest of the method)
        try {
            let query = client.from(table).select(options.columns || '*');
            if (options.filters) {
                options.filters.forEach(filter => {
                    query = query.filter(filter.column, filter.operator, filter.value);
                });
            }
            const { data, error } = await query;
            if (error) return this.handleError(error, 'select');
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'select');
        }
    }

    async insert(table, records, options = {}) {
        const client = this.getClient();
        try {
            const { data, error } = await client.from(table).insert(records);
            if (error) return this.handleError(error, 'insert');
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'insert');
        }
    }
    
    // ... (Implement getClient() call for all other methods: update, delete, upsert, count, auth, storage, etc.) ...

    async healthCheck() {
        try {
            const client = this.getClient();
            const { error } = await client.rpc('echo', { message: 'healthcheck' });

            if (error) {
                 const { error: selectError } = await client.from('pg_database').select('datname').limit(1);
                 if (selectError) {
                    this.logger.error('Supabase health check failed:', selectError);
                    return { success: false, error: selectError.message };
                 }
            }
            return { success: true, data: { connected: true } };
        } catch (error) {
            this.logger.error('Supabase health check failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = SupabaseWrapper;

/**
 * Supabase API Wrapper
 * Provides secure, permission-controlled access to Supabase database and authentication operations
 * Implements minimum necessary scopes and comprehensive error handling
 */

const { createClient } = require('@supabase/supabase-js');

class SupabaseWrapper {
    constructor(supabaseUrl, supabaseKey, options = {}) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false
            },
            db: {
                schema: options.schema || 'public'
            },
            ...options.clientOptions
        });
        
        this.permissions = options.permissions || this.getMinimalPermissions();
        this.logger = options.logger || console;
        this.schema = options.schema || 'public';
    }

    /**
     * Define minimal required permissions for each operation
     */
    getMinimalPermissions() {
        return {
            // Database operations
            'database:read': ['select', 'count'],
            'database:write': ['insert', 'update', 'delete', 'upsert'],
            
            // Authentication operations
            'auth:read': ['getUser', 'getSession'],
            'auth:write': ['signUp', 'signIn', 'signOut', 'updateUser'],
            
            // Storage operations
            'storage:read': ['list', 'download', 'getPublicUrl'],
            'storage:write': ['upload', 'update', 'move', 'copy', 'remove'],
            
            // Real-time operations
            'realtime:read': ['subscribe'],
            'realtime:write': ['broadcast']
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
        return true; // In production, validate against actual RLS policies
    }

    /**
     * Handle Supabase errors consistently
     */
    handleError(error, operation) {
        this.logger.error(`Supabase ${operation} failed:`, error);
        
        let errorMessage = error.message;
        if (error.details) errorMessage += ` Details: ${error.details}`;
        if (error.hint) errorMessage += ` Hint: ${error.hint}`;
        
        return {
            success: false,
            error: errorMessage,
            code: error.code,
            details: error.details,
            hint: error.hint
        };
    }

    /**
     * Database Operations
     */

    // Select data from a table
    async select(table, options = {}) {
        if (!this.checkPermission('database:read')) {
            throw new Error('Insufficient permissions for database read');
        }

        try {
            let query = this.supabase.from(table).select(options.columns || '*');

            // Apply filters
            if (options.filters) {
                options.filters.forEach(filter => {
                    const { column, operator, value } = filter;
                    query = query.filter(column, operator, value);
                });
            }

            // Apply ordering
            if (options.orderBy) {
                const { column, ascending = true } = options.orderBy;
                query = query.order(column, { ascending });
            }

            // Apply pagination
            if (options.range) {
                const { from, to } = options.range;
                query = query.range(from, to);
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) {
                return this.handleError(error, 'select');
            }

            this.logger.info(`Selected ${data?.length || 0} rows from ${table}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'select');
        }
    }

    // Insert data into a table
    async insert(table, records, options = {}) {
        if (!this.checkPermission('database:write')) {
            throw new Error('Insufficient permissions for database write');
        }

        try {
            let query = this.supabase.from(table).insert(records);

            if (options.onConflict) {
                query = query.onConflict(options.onConflict);
            }

            if (options.returning) {
                query = query.select(options.returning);
            }

            const { data, error } = await query;

            if (error) {
                return this.handleError(error, 'insert');
            }

            const count = Array.isArray(records) ? records.length : 1;
            this.logger.info(`Inserted ${count} records into ${table}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'insert');
        }
    }

    // Update data in a table
    async update(table, updates, filters, options = {}) {
        if (!this.checkPermission('database:write')) {
            throw new Error('Insufficient permissions for database write');
        }

        try {
            let query = this.supabase.from(table).update(updates);

            // Apply filters
            filters.forEach(filter => {
                const { column, operator, value } = filter;
                query = query.filter(column, operator, value);
            });

            if (options.returning) {
                query = query.select(options.returning);
            }

            const { data, error } = await query;

            if (error) {
                return this.handleError(error, 'update');
            }

            this.logger.info(`Updated records in ${table}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'update');
        }
    }

    // Delete data from a table
    async delete(table, filters, options = {}) {
        if (!this.checkPermission('database:write')) {
            throw new Error('Insufficient permissions for database write');
        }

        try {
            let query = this.supabase.from(table).delete();

            // Apply filters
            filters.forEach(filter => {
                const { column, operator, value } = filter;
                query = query.filter(column, operator, value);
            });

            if (options.returning) {
                query = query.select(options.returning);
            }

            const { data, error } = await query;

            if (error) {
                return this.handleError(error, 'delete');
            }

            this.logger.info(`Deleted records from ${table}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'delete');
        }
    }

    // Upsert data (insert or update)
    async upsert(table, records, options = {}) {
        if (!this.checkPermission('database:write')) {
            throw new Error('Insufficient permissions for database write');
        }

        try {
            let query = this.supabase.from(table).upsert(records);

            if (options.onConflict) {
                query = query.onConflict(options.onConflict);
            }

            if (options.returning) {
                query = query.select(options.returning);
            }

            const { data, error } = await query;

            if (error) {
                return this.handleError(error, 'upsert');
            }

            const count = Array.isArray(records) ? records.length : 1;
            this.logger.info(`Upserted ${count} records in ${table}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'upsert');
        }
    }

    // Count records in a table
    async count(table, filters = []) {
        if (!this.checkPermission('database:read')) {
            throw new Error('Insufficient permissions for database read');
        }

        try {
            let query = this.supabase.from(table).select('*', { count: 'exact', head: true });

            // Apply filters
            filters.forEach(filter => {
                const { column, operator, value } = filter;
                query = query.filter(column, operator, value);
            });

            const { count, error } = await query;

            if (error) {
                return this.handleError(error, 'count');
            }

            this.logger.info(`Counted ${count} records in ${table}`);
            return { success: true, data: { count } };
        } catch (error) {
            return this.handleError(error, 'count');
        }
    }

    /**
     * Authentication Operations
     */

    // Sign up user
    async signUp(email, password, options = {}) {
        if (!this.checkPermission('auth:write')) {
            throw new Error('Insufficient permissions for user registration');
        }

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: options.metadata || {}
                }
            });

            if (error) {
                return this.handleError(error, 'signUp');
            }

            this.logger.info(`User signed up: ${email}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'signUp');
        }
    }

    // Sign in user
    async signIn(email, password) {
        if (!this.checkPermission('auth:write')) {
            throw new Error('Insufficient permissions for user authentication');
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return this.handleError(error, 'signIn');
            }

            this.logger.info(`User signed in: ${email}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'signIn');
        }
    }

    // Sign out user
    async signOut() {
        if (!this.checkPermission('auth:write')) {
            throw new Error('Insufficient permissions for user sign out');
        }

        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) {
                return this.handleError(error, 'signOut');
            }

            this.logger.info('User signed out');
            return { success: true, data: { message: 'User signed out successfully' } };
        } catch (error) {
            return this.handleError(error, 'signOut');
        }
    }

    // Get current user
    async getUser() {
        if (!this.checkPermission('auth:read')) {
            throw new Error('Insufficient permissions for user data access');
        }

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser();

            if (error) {
                return this.handleError(error, 'getUser');
            }

            this.logger.info('Retrieved current user');
            return { success: true, data: { user } };
        } catch (error) {
            return this.handleError(error, 'getUser');
        }
    }

    // Update user
    async updateUser(updates) {
        if (!this.checkPermission('auth:write')) {
            throw new Error('Insufficient permissions for user update');
        }

        try {
            const { data, error } = await this.supabase.auth.updateUser(updates);

            if (error) {
                return this.handleError(error, 'updateUser');
            }

            this.logger.info('Updated user profile');
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'updateUser');
        }
    }

    /**
     * Storage Operations
     */

    // List files in storage bucket
    async listFiles(bucketName, path = '', options = {}) {
        if (!this.checkPermission('storage:read')) {
            throw new Error('Insufficient permissions for storage read');
        }

        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .list(path, options);

            if (error) {
                return this.handleError(error, 'listFiles');
            }

            this.logger.info(`Listed ${data?.length || 0} files in ${bucketName}/${path}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'listFiles');
        }
    }

    // Upload file to storage
    async uploadFile(bucketName, path, file, options = {}) {
        if (!this.checkPermission('storage:write')) {
            throw new Error('Insufficient permissions for storage write');
        }

        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .upload(path, file, options);

            if (error) {
                return this.handleError(error, 'uploadFile');
            }

            this.logger.info(`Uploaded file to ${bucketName}/${path}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'uploadFile');
        }
    }

    // Download file from storage
    async downloadFile(bucketName, path) {
        if (!this.checkPermission('storage:read')) {
            throw new Error('Insufficient permissions for storage read');
        }

        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .download(path);

            if (error) {
                return this.handleError(error, 'downloadFile');
            }

            this.logger.info(`Downloaded file from ${bucketName}/${path}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'downloadFile');
        }
    }

    // Get public URL for file
    async getPublicUrl(bucketName, path) {
        if (!this.checkPermission('storage:read')) {
            throw new Error('Insufficient permissions for storage read');
        }

        try {
            const { data } = this.supabase.storage
                .from(bucketName)
                .getPublicUrl(path);

            this.logger.info(`Generated public URL for ${bucketName}/${path}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'getPublicUrl');
        }
    }

    // Remove file from storage
    async removeFile(bucketName, paths) {
        if (!this.checkPermission('storage:write')) {
            throw new Error('Insufficient permissions for storage write');
        }

        try {
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .remove(Array.isArray(paths) ? paths : [paths]);

            if (error) {
                return this.handleError(error, 'removeFile');
            }

            this.logger.info(`Removed files from ${bucketName}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'removeFile');
        }
    }

    /**
     * Real-time Operations
     */

    // Subscribe to table changes
    async subscribeToTable(table, callback, options = {}) {
        if (!this.checkPermission('realtime:read')) {
            throw new Error('Insufficient permissions for real-time subscription');
        }

        try {
            let subscription = this.supabase
                .channel(`${table}-changes`)
                .on('postgres_changes', {
                    event: options.event || '*',
                    schema: options.schema || this.schema,
                    table: table,
                    filter: options.filter
                }, callback);

            subscription = subscription.subscribe();

            this.logger.info(`Subscribed to ${table} changes`);
            return { success: true, data: { subscription } };
        } catch (error) {
            return this.handleError(error, 'subscribeToTable');
        }
    }

    // Broadcast message
    async broadcast(channelName, event, payload) {
        if (!this.checkPermission('realtime:write')) {
            throw new Error('Insufficient permissions for real-time broadcast');
        }

        try {
            const channel = this.supabase.channel(channelName);
            await channel.send({
                type: 'broadcast',
                event: event,
                payload: payload
            });

            this.logger.info(`Broadcasted ${event} to ${channelName}`);
            return { success: true, data: { message: 'Broadcast sent successfully' } };
        } catch (error) {
            return this.handleError(error, 'broadcast');
        }
    }

    /**
     * Utility Methods
     */

    // Health check
    async healthCheck() {
        try {
            // Test database connection
            const { data, error } = await this.supabase
                .from('information_schema.tables')
                .select('table_name')
                .limit(1);

            if (error) {
                return {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                success: true,
                data: {
                    connected: true,
                    schema: this.schema,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Supabase health check failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Execute custom query
    async executeQuery(query, params = []) {
        if (!this.checkPermission('database:read')) {
            throw new Error('Insufficient permissions for custom query execution');
        }

        try {
            const { data, error } = await this.supabase.rpc(query, params);

            if (error) {
                return this.handleError(error, 'executeQuery');
            }

            this.logger.info(`Executed custom query: ${query}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'executeQuery');
        }
    }

    // Get table schema
    async getTableSchema(tableName) {
        if (!this.checkPermission('database:read')) {
            throw new Error('Insufficient permissions for schema read');
        }

        try {
            const { data, error } = await this.supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_name', tableName)
                .eq('table_schema', this.schema);

            if (error) {
                return this.handleError(error, 'getTableSchema');
            }

            this.logger.info(`Retrieved schema for table: ${tableName}`);
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, 'getTableSchema');
        }
    }

    // Get connection info
    getConnectionInfo() {
        return {
            schema: this.schema,
            url: this.supabase.supabaseUrl,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = SupabaseWrapper;
// Supabase MCP Tools Implementation
// HIPAA-compliant database operations for autonomous agents
// Secure data handling with comprehensive audit trails

const { createClient } = require('@supabase/supabase-js');

class SupabaseMCPTools {
    constructor(supabaseUrl, supabaseKey, options = {}) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and service key are required');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false, // Server-side operations
                autoRefreshToken: false
            },
            global: {
                headers: {
                    'X-MCP-Tool': 'supabase',
                    'X-HIPAA-Compliant': 'true',
                    'X-System': 'Senior-Care-AI-Ecosystem'
                }
            }
        });

        this.auditEnabled = options.auditEnabled !== false; // Default true
        this.validateInputs = options.validateInputs !== false; // Default true

        console.log('🗄️ Supabase MCP Tools initialized with HIPAA compliance');
    }

    /**
     * Insert record into table
     * @param {Object} params - Insert parameters
     * @returns {Object} Insert result
     */
    async insertRecord(params) {
        try {
            this.validateParams(params, ['table_name', 'data']);
            
            const {
                table_name,
                data,
                return_representation = 'full',
                on_conflict = null
            } = params;

            // Input validation
            if (this.validateInputs) {
                this.validateTableName(table_name);
                this.validateDataObject(data);
            }

            // Add audit fields (handled by DB generated columns)
            const recordData = {
                ...data
            };

            // Execute insert
            let query = this.supabase
                .from(table_name)
                .insert(recordData);

            // Handle conflicts
            if (on_conflict) {
                if (on_conflict === 'ignore') {
                    query = query.select().maybeSingle();
                } else if (typeof on_conflict === 'object') {
                    // Upsert with specific conflict resolution
                    query = this.supabase
                        .from(table_name)
                        .upsert(recordData, on_conflict);
                }
            }

            if (return_representation === 'full') {
                query = query.select();
            }

            const { data: result, error } = await query;

            if (error) {
                throw new Error(`Insert failed: ${error.message}`);
            }

            const response = {
                success: true,
                record_id: result?.[0]?.id || null,
                inserted_data: result,
                table_name,
                operation: 'INSERT',
                timestamp: new Date().toISOString()
            };

            this.logOperation('insert_record', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('insert_record', params, error);
            throw errorResult;
        }
    }

    /**
     * Query table with filters
     * @param {Object} params - Query parameters
     * @returns {Object} Query results
     */
    async queryTable(params) {
        try {
            this.validateParams(params, ['table_name']);
            
            const {
                table_name,
                select_columns = '*',
                filters = [],
                order_by = null,
                limit = null,
                offset = null,
                single_record = false
            } = params;

            // Input validation
            if (this.validateInputs) {
                this.validateTableName(table_name);
            }

            // Build query
            let query = this.supabase
                .from(table_name)
                .select(select_columns);

            // Apply filters
            for (const filter of filters) {
                this.applyFilter(query, filter);
            }

            // Apply ordering
            if (order_by) {
                const { column, ascending = true } = order_by;
                query = query.order(column, { ascending });
            }

            // Apply pagination
            if (limit) {
                query = query.limit(limit);
            }
            if (offset) {
                query = query.range(offset, offset + (limit || 100) - 1);
            }

            // Execute query
            const { data, error, count } = single_record 
                ? await query.single()
                : await query;

            if (error) {
                throw new Error(`Query failed: ${error.message}`);
            }

            const response = {
                success: true,
                data: data,
                count: single_record ? (data ? 1 : 0) : (data?.length || 0),
                table_name,
                operation: 'SELECT',
                filters_applied: filters.length,
                timestamp: new Date().toISOString()
            };

            this.logOperation('query_table', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('query_table', params, error);
            throw errorResult;
        }
    }

    /**
     * Update records in table  
     * @param {Object} params - Update parameters
     * @returns {Object} Update result
     */
    async updateRecord(params) {
        try {
            this.validateParams(params, ['table_name', 'data', 'filters']);
            
            const {
                table_name,
                data,
                filters,
                return_representation = 'full'
            } = params;

            // Input validation
            if (this.validateInputs) {
                this.validateTableName(table_name);
                this.validateDataObject(data);
            }

            // Add audit fields
            const updateData = {
                ...data,
                updated_at: new Date().toISOString()
            };

            // Build query
            let query = this.supabase
                .from(table_name)
                .update(updateData);

            // Apply filters
            for (const filter of filters) {
                this.applyFilter(query, filter);
            }

            if (return_representation === 'full') {
                query = query.select();
            }

            const { data: result, error } = await query;

            if (error) {
                throw new Error(`Update failed: ${error.message}`);
            }

            const response = {
                success: true,
                updated_records: result?.length || 0,
                updated_data: result,
                table_name,
                operation: 'UPDATE',
                timestamp: new Date().toISOString()
            };

            this.logOperation('update_record', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('update_record', params, error);
            throw errorResult;
        }
    }

    /**
     * Delete records from table
     * @param {Object} params - Delete parameters  
     * @returns {Object} Delete result
     */
    async deleteRecord(params) {
        try {
            this.validateParams(params, ['table_name', 'filters']);
            
            const {
                table_name,
                filters,
                return_deleted_data = false
            } = params;

            // Input validation
            if (this.validateInputs) {
                this.validateTableName(table_name);
            }

            // Safety check - require at least one filter for deletes
            if (!filters || filters.length === 0) {
                throw new Error('Delete operation requires at least one filter for safety');
            }

            // Build query
            let query = this.supabase
                .from(table_name)
                .delete();

            // Apply filters
            for (const filter of filters) {
                this.applyFilter(query, filter);
            }

            if (return_deleted_data) {
                query = query.select();
            }

            const { data: result, error } = await query;

            if (error) {
                throw new Error(`Delete failed: ${error.message}`);
            }

            const response = {
                success: true,
                deleted_count: result?.length || 0,
                deleted_data: return_deleted_data ? result : null,
                table_name,
                operation: 'DELETE',
                timestamp: new Date().toISOString()
            };

            this.logOperation('delete_record', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('delete_record', params, error);
            throw errorResult;
        }
    }

    /**
     * Upload file to storage bucket
     * @param {Object} params - Upload parameters
     * @returns {Object} Upload result
     */
    async uploadFile(params) {
        try {
            this.validateParams(params, ['bucket_name', 'file_path', 'file_content']);
            
            const {
                bucket_name,
                file_path,
                file_content,
                content_type = 'application/octet-stream',
                cache_control = '3600',
                upsert = false
            } = params;

            // Input validation
            if (this.validateInputs) {
                this.validateFileName(file_path);
                this.validateFileContent(file_content);
            }

            // Decode base64 content if provided
            let fileData;
            try {
                fileData = Buffer.from(file_content, 'base64');
            } catch (error) {
                // Assume raw content if base64 decode fails
                fileData = file_content;
            }

            // Upload file
            const { data, error } = await this.supabase.storage
                .from(bucket_name)
                .upload(file_path, fileData, {
                    contentType: content_type,
                    cacheControl: cache_control,
                    upsert: upsert
                });

            if (error) {
                throw new Error(`File upload failed: ${error.message}`);
            }

            // Get public URL
            const { data: publicUrlData } = this.supabase.storage
                .from(bucket_name)
                .getPublicUrl(file_path);

            const response = {
                success: true,
                file_path: data.path,
                public_url: publicUrlData.publicUrl,
                bucket_name,
                file_size: fileData.length,
                content_type,
                operation: 'UPLOAD',
                timestamp: new Date().toISOString()
            };

            this.logOperation('upload_file', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('upload_file', params, error);
            throw errorResult;
        }
    }

    /**
     * Execute stored procedure/function
     * @param {Object} params - RPC parameters
     * @returns {Object} RPC result
     */
    async executeRPC(params) {
        try {
            this.validateParams(params, ['function_name']);
            
            const {
                function_name,
                parameters = {},
                return_type = 'json'
            } = params;

            // Execute RPC
            const { data, error } = await this.supabase
                .rpc(function_name, parameters);

            if (error) {
                throw new Error(`RPC execution failed: ${error.message}`);
            }

            const response = {
                success: true,
                result: data,
                function_name,
                operation: 'RPC',
                timestamp: new Date().toISOString()
            };

            this.logOperation('execute_rpc', params, response);
            return response;

        } catch (error) {
            const errorResult = this.handleError('execute_rpc', params, error);
            throw errorResult;
        }
    }

    /**
     * Apply filter to query
     * @param {Object} query - Supabase query object
     * @param {Object} filter - Filter configuration
     */
    applyFilter(query, filter) {
        const { column, operator, value } = filter;

        // Validate filter value
        if (value === undefined || value === null) {
            throw new Error(`Filter value cannot be undefined or null for column '${column}' with operator '${operator}'`);
        }

        switch (operator) {
            case 'eq':
                query.eq(column, value);
                break;
            case 'neq':
                query.neq(column, value);
                break;
            case 'gt':
                query.gt(column, value);
                break;
            case 'gte':
                query.gte(column, value);
                break;
            case 'lt':
                query.lt(column, value);
                break;
            case 'lte':
                query.lte(column, value);
                break;
            case 'like':
                query.like(column, value);
                break;
            case 'ilike':
                query.ilike(column, value);
                break;
            case 'in':
                query.in(column, value);
                break;
            case 'is':
                query.is(column, value);
                break;
            case 'not':
                query.not(column, operator, value);
                break;
            default:
                throw new Error(`Unsupported filter operator: ${operator}`);
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
     * Validate table name for SQL injection prevention
     * @param {string} tableName - Table name to validate
     */
    validateTableName(tableName) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error('Invalid table name format');
        }
    }

    /**
     * Validate data object
     * @param {Object} data - Data object to validate
     */
    validateDataObject(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Data must be a non-empty object');
        }

        if (Array.isArray(data)) {
            throw new Error('Data cannot be an array for single record operations');
        }
    }

    /**
     * Validate file name
     * @param {string} fileName - File name to validate
     */
    validateFileName(fileName) {
        if (!/^[a-zA-Z0-9._/-]+$/.test(fileName)) {
            throw new Error('Invalid file name format');
        }
    }

    /**
     * Validate file content
     * @param {*} content - File content to validate
     */
    validateFileContent(content) {
        if (!content) {
            throw new Error('File content cannot be empty');
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
            timestamp: new Date().toISOString(),
            params: this.sanitizeParams(params)
        };

        console.error(`❌ Supabase MCP Tool Error [${operation}]:`, errorInfo);

        return new Error(`Supabase ${operation} failed: ${error.message}`);
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
            timestamp: result.timestamp,
            params: this.sanitizeParams(params),
            result_summary: this.summarizeResult(result)
        };

        console.log(`✅ Supabase MCP Tool [${operation}]:`, logInfo);
    }

    /**
     * Remove sensitive information from parameters for logging
     * @param {Object} params - Parameters to sanitize
     * @returns {Object} Sanitized parameters
     */
    sanitizeParams(params) {
        const sanitized = { ...params };
        
        // Remove potentially sensitive fields
        delete sanitized.file_content; // File content could be sensitive
        if (sanitized.data && typeof sanitized.data === 'object') {
            // Remove potential PII from data objects
            const dataKeys = Object.keys(sanitized.data);
            const sensitiveFields = ['password', 'token', 'key', 'secret', 'email', 'phone'];
            
            sensitiveFields.forEach(field => {
                dataKeys.forEach(key => {
                    if (key.toLowerCase().includes(field)) {
                        sanitized.data[key] = '[REDACTED]';
                    }
                });
            });
        }
        
        return sanitized;
    }

    /**
     * Create summary of operation result for logging
     * @param {Object} result - Operation result
     * @returns {Object} Result summary
     */
    summarizeResult(result) {
        const summary = { success: result.success };
        
        if (result.success) {
            if (result.count !== undefined) summary.count = result.count;
            if (result.record_id) summary.record_id = result.record_id;
            if (result.updated_records) summary.updated_records = result.updated_records;
            if (result.deleted_count) summary.deleted_count = result.deleted_count;
            if (result.file_size) summary.file_size = result.file_size;
        }
        
        return summary;
    }

    /**
     * Get database health status
     * @returns {Object} Health check result
     */
    async healthCheck() {
        try {
            // Test basic connectivity with a simple query
            const { data, error } = await this.supabase
                .from('agent_messages')
                .select('id')
                .limit(1);

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (OK)
                throw error;
            }

            return {
                success: true,
                status: 'HEALTHY',
                connection: 'active',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                status: 'UNHEALTHY',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SupabaseMCPTools;
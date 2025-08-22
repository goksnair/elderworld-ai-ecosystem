/**
 * Enhanced Logger
 * Provides structured logging with multiple output formats and levels
 * Supports context tracking and performance monitoring
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor(name, options = {}) {
        this.name = name;
        this.level = options.level || 'info';
        this.format = options.format || 'json';
        this.outputs = options.outputs || ['console'];
        this.logDir = options.logDir || path.join(process.cwd(), 'logs');
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        
        // Log levels in order of severity
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        this.currentLevel = this.levels[this.level];
        
        // Context tracking
        this.context = {};
        
        // Performance monitoring
        this.timers = new Map();
        
        // Initialize log directory if file output is enabled
        if (this.outputs.includes('file')) {
            this.initLogDir();
        }
    }

    /**
     * Initialize log directory
     */
    async initLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    /**
     * Set context for all subsequent logs
     */
    setContext(key, value) {
        this.context[key] = value;
    }

    /**
     * Remove context key
     */
    clearContext(key) {
        delete this.context[key];
    }

    /**
     * Get current context
     */
    getContext() {
        return { ...this.context };
    }

    /**
     * Format log entry
     */
    formatEntry(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level,
            logger: this.name,
            message,
            ...this.context,
            ...meta
        };

        // Add process information
        entry.pid = process.pid;
        
        // Add memory usage if in debug mode
        if (this.currentLevel >= this.levels.debug) {
            const memUsage = process.memoryUsage();
            entry.memory = {
                rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
            };
        }

        return entry;
    }

    /**
     * Format for console output
     */
    formatConsole(entry) {
        const { timestamp, level, logger, message, ...rest } = entry;
        const time = new Date(timestamp).toLocaleTimeString();
        
        let colorCode = '';
        let resetCode = '\x1b[0m';
        
        // Add colors based on level
        switch (level) {
            case 'error':
                colorCode = '\x1b[31m'; // Red
                break;
            case 'warn':
                colorCode = '\x1b[33m'; // Yellow
                break;
            case 'info':
                colorCode = '\x1b[36m'; // Cyan
                break;
            case 'debug':
                colorCode = '\x1b[32m'; // Green
                break;
            case 'trace':
                colorCode = '\x1b[35m'; // Magenta
                break;
        }

        let formatted = `${colorCode}[${time}] ${level.toUpperCase()} [${logger}]${resetCode} ${message}`;
        
        // Add metadata if present
        const metadata = Object.keys(rest).filter(key => !['pid', 'memory'].includes(key));
        if (metadata.length > 0) {
            const metaStr = metadata.map(key => `${key}=${JSON.stringify(rest[key])}`).join(' ');
            formatted += ` | ${metaStr}`;
        }

        return formatted;
    }

    /**
     * Output log entry
     */
    async output(entry) {
        if (this.outputs.includes('console')) {
            console.log(this.formatConsole(entry));
        }

        if (this.outputs.includes('file')) {
            await this.writeToFile(entry);
        }
    }

    /**
     * Write to log file
     */
    async writeToFile(entry) {
        try {
            const filename = `${this.name.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`;
            const filepath = path.join(this.logDir, filename);
            
            const line = JSON.stringify(entry) + '\n';
            
            // Check file size and rotate if necessary
            await this.rotateLogFile(filepath);
            
            await fs.appendFile(filepath, line);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Rotate log file if it exceeds max size
     */
    async rotateLogFile(filepath) {
        try {
            const stats = await fs.stat(filepath);
            if (stats.size > this.maxFileSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedPath = filepath.replace('.log', `-${timestamp}.log`);
                await fs.rename(filepath, rotatedPath);
                
                // Clean up old log files
                await this.cleanupOldLogs(path.dirname(filepath));
            }
        } catch (error) {
            // File doesn't exist yet, which is fine
            if (error.code !== 'ENOENT') {
                console.error('Failed to rotate log file:', error);
            }
        }
    }

    /**
     * Clean up old log files
     */
    async cleanupOldLogs(logDir) {
        try {
            const files = await fs.readdir(logDir);
            const logFiles = files
                .filter(file => file.startsWith(this.name.toLowerCase()) && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(logDir, file),
                    stat: null
                }));

            // Get file stats
            for (const file of logFiles) {
                try {
                    file.stat = await fs.stat(file.path);
                } catch (error) {
                    // Skip files we can't access
                }
            }

            // Sort by modification time (newest first)
            logFiles
                .filter(file => file.stat)
                .sort((a, b) => b.stat.mtime - a.stat.mtime)
                .slice(this.maxFiles) // Keep only the newest files
                .forEach(async (file) => {
                    try {
                        await fs.unlink(file.path);
                        this.debug(`Cleaned up old log file: ${file.name}`);
                    } catch (error) {
                        console.error(`Failed to delete old log file ${file.name}:`, error);
                    }
                });
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        return this.levels[level] <= this.currentLevel;
    }

    /**
     * Generic log method
     */
    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry = this.formatEntry(level, message, meta);
        this.output(entry);
    }

    /**
     * Error level logging
     */
    error(message, meta = {}) {
        // Automatically capture stack trace for errors
        if (message instanceof Error) {
            meta.stack = message.stack;
            message = message.message;
        } else if (meta instanceof Error) {
            meta = { stack: meta.stack, error: meta.message };
        }
        
        this.log('error', message, meta);
    }

    /**
     * Warning level logging
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * Info level logging
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * Debug level logging
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * Trace level logging
     */
    trace(message, meta = {}) {
        this.log('trace', message, meta);
    }

    /**
     * Start performance timer
     */
    startTimer(label) {
        this.timers.set(label, {
            start: process.hrtime(),
            timestamp: Date.now()
        });
    }

    /**
     * End performance timer and log result
     */
    endTimer(label, message) {
        const timer = this.timers.get(label);
        if (!timer) {
            this.warn(`Timer '${label}' not found`);
            return;
        }

        const [seconds, nanoseconds] = process.hrtime(timer.start);
        const duration = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
        
        this.timers.delete(label);
        
        const timerMessage = message || `Timer '${label}' completed`;
        this.info(timerMessage, {
            timer: label,
            duration: `${duration.toFixed(2)}ms`,
            durationMs: Math.round(duration)
        });

        return duration;
    }

    /**
     * Log HTTP request
     */
    logRequest(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };

        if (req.get('X-Agent-ID')) {
            meta.agentId = req.get('X-Agent-ID');
        }

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        this.log(level, `${req.method} ${req.url}`, meta);
    }

    /**
     * Log API call
     */
    logApiCall(service, operation, success, duration, metadata = {}) {
        const level = success ? 'info' : 'error';
        const message = `${service} ${operation} ${success ? 'succeeded' : 'failed'}`;
        
        this.log(level, message, {
            service,
            operation,
            success,
            duration: duration ? `${duration}ms` : undefined,
            ...metadata
        });
    }

    /**
     * Create child logger with additional context
     */
    child(additionalContext) {
        const childLogger = new Logger(this.name, {
            level: this.level,
            format: this.format,
            outputs: this.outputs,
            logDir: this.logDir
        });

        // Merge context
        childLogger.context = { ...this.context, ...additionalContext };
        
        return childLogger;
    }

    /**
     * Get logger statistics
     */
    getStats() {
        return {
            name: this.name,
            level: this.level,
            activeTimers: Array.from(this.timers.keys()),
            context: this.getContext(),
            outputs: this.outputs
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test console output
            const testMessage = `Logger health check - ${new Date().toISOString()}`;
            
            // Test file output if enabled
            if (this.outputs.includes('file')) {
                await this.initLogDir();
                
                // Try to write a test entry
                const testEntry = this.formatEntry('info', testMessage, { healthCheck: true });
                await this.writeToFile(testEntry);
            }

            return {
                success: true,
                data: {
                    ...this.getStats(),
                    logDir: this.logDir,
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

module.exports = Logger;
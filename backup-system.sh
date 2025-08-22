#!/bin/bash

# Senior Care AI Ecosystem - Backup Script

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating system backup in $BACKUP_DIR"

# Backup configuration files
cp -r agent-configs "$BACKUP_DIR/"
cp -r obsidian-vault "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp production-config.js "$BACKUP_DIR/"

# Export database schema (if possible)
echo "💾 Backup completed: $BACKUP_DIR"
echo "📊 Files backed up: $(find $BACKUP_DIR -type f | wc -l)"

#!/bin/bash
#
# Standardized script to run a command within a specific npm workspace.
# This avoids `cd` issues and ensures a consistent execution environment.
#
# Usage: ./run-in-workspace.sh <workspace_dir> "<command_to_run>"
# Example: ./run-in-workspace.sh mcp-bridge "npm test"

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <workspace_dir> \"<command_to_run>\""
    exit 1
fi

WORKSPACE_DIR=$1
COMMAND_TO_RUN=$2

if [ ! -d "$WORKSPACE_DIR" ]; then
    echo "Error: Workspace directory '$WORKSPACE_DIR' not found."
    exit 1
fi

echo "---"
echo "Executing command in workspace: $WORKSPACE_DIR"
echo "Command: $COMMAND_TO_RUN"
echo "---"

# Use npm exec with the -w flag to run the command in the context
# of the specified workspace.
npm exec -w "$WORKSPACE_DIR" -- sh -c "$COMMAND_TO_RUN"

echo "---"
echo "Command finished successfully in workspace: $WORKSPACE_DIR"
echo "---"

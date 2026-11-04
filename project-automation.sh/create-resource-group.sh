#!/bin/bash

# Accept project name
PROJECT_NAME=$1

# Check if project name was provided
if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./create-resource-group.sh <Project-Name>"
    exit 1
fi

# Check if jq is installed
if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is not installed."
    exit 1
fi

# Check AWS authentication
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "Error: AWS authentication failed."
    exit 1
fi

# Define environments
ENVIRONMENTS=("Dev" "Test" "UAT" "Production")

# Create temporary JSON file
QUERY_FILE=$(mktemp)

# Track failures
FAILED=0

# Loop through environments
for ENV in "${ENVIRONMENTS[@]}"
do

    GROUP_NAME="${PROJECT_NAME}-${ENV}-RG"

    echo "Creating resource group: $GROUP_NAME"

    # Generate valid JSON query
    jq -n \
        --arg project "$PROJECT_NAME" \
        --arg env "$ENV" \
        '{
            Type: "TAG_FILTERS_1_0",
            Query: ({
                ResourceTypeFilters: ["AWS::AllSupported"],
                TagFilters: [
                    {
                        Key: "Project",
                        Values: [$project]
                    },
                    {
                        Key: "Environment",
                        Values: [$env]
                    }
                ]
            } | tojson)
        }' > "$QUERY_FILE"

    # Create AWS resource group
    if aws resource-groups create-group \
        --name "$GROUP_NAME" \
        --resource-query "file://$QUERY_FILE"; then

        echo "SUCCESS: $GROUP_NAME created."

    else

        echo "FAILED: Could not create $GROUP_NAME."
        FAILED=1

    fi

done

# Remove temporary file
rm -f "$QUERY_FILE"

# Final report
if [ "$FAILED" -eq 0 ]; then
    echo "All resource groups created successfully!"
else
    echo "Automation completed with some errors."
    exit 1
fi
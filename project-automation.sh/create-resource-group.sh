#!/bin/bash

# Accept project name
PROJECT_NAME=$1

# Check project name
if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./create-resource-group.sh <Project-Name>"
    exit 1
fi

# Check jq installation
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

FAILED=0

# Loop through environments
for ENV in "${ENVIRONMENTS[@]}"
do

    GROUP_NAME="${PROJECT_NAME}-${ENV}-RG"

    echo "Creating resource group: $GROUP_NAME"

    # Generate JSON query
    RESOURCE_QUERY=$(jq -n \
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
        }')

    # Create AWS resource group
    if aws resource-groups create-group \
        --name "$GROUP_NAME" \
        --resource-query "$RESOURCE_QUERY"; then

        echo "SUCCESS: $GROUP_NAME created."

    else

        echo "FAILED: Could not create $GROUP_NAME."
        FAILED=1

    fi

done

# Final report
if [ "$FAILED" -eq 0 ]; then
    echo "All resource groups created successfully!"
else
    echo "Automation completed with some errors."
    exit 1
fi
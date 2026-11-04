#!/bin/bash

# Accept project name
PROJECT_NAME=$1

# Check if project name was provided
if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: ./create-resource-groups.sh <Project-Name>"
    exit 1
fi

# Define environments
ENVIRONMENTS=("Dev" "Test" "UAT" "Production")

# Check AWS authentication
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS authentication failed. Run aws configure."
    exit 1
fi

# Create resource groups
for ENV in "${ENVIRONMENTS[@]}"
do
    GROUP_NAME="${PROJECT_NAME}-${ENV}-RG"

    echo "Creating resource group: $GROUP_NAME"

    QUERY="{\"ResourceTypeFilters\":[\"AWS::AllSupported\"],\"TagFilters\":[{\"Key\":\"Project\",\"Values\":[\"${PROJECT_NAME}\"]},{\"Key\":\"Environment\",\"Values\":[\"${ENV}\"]}]}"

    aws resource-groups create-group \
        --name "$GROUP_NAME" \
        --resource-query "{\"Type\":\"TAG_FILTERS_1_0\",\"Query\":\"$QUERY\"}"

    if [ $? -eq 0 ]; then
        echo "SUCCESS: $GROUP_NAME created."
    else
        echo "FAILED: Could not create $GROUP_NAME."
    fi

done

echo "Resource group automation completed."
```
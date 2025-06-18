#!/bin/bash
set -e

themes=$(shopify theme list --json | jq -r '.[] | select(.role == "development") | .id')

if [ -z "$themes" ]; then
  echo "No development themes found."
  exit 0
fi

echo "Deleting the following development themes: $themes"

for theme_id in $themes; do
    echo "Deleting theme with ID: $theme_id"
    shopify theme delete --theme "$theme_id" --force
done

echo "All development themes deleted."

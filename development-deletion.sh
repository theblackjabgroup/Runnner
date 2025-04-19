#!/bin/bash

themes=$(shopify theme list | grep development | awk -F'#' '{print $2}' | awk '{print $1}')

echo "Deleting the following development themes: $themes"

for theme_id in $themes; do
    echo "Deleting theme with ID: $theme_id"
    shopify theme delete --theme "$theme_id" --force
done

echo "All development themes deleted."
#!/bin/bash
# Fix permissions for WSL files
chmod -R 755 /Ubuntu/home/s/wspace/spaceracing
chmod 644 /Ubuntu/home/s/wspace/spaceracing/*.json
chmod 644 /Ubuntu/home/s/wspace/spaceracing/*.html
chmod 644 /Ubuntu/home/s/wspace/spaceracing/*.js
chmod 644 /Ubuntu/home/s/wspace/spaceracing/*.md
chmod 644 /Ubuntu/home/s/wspace/spaceracing/src/*.js
echo "Permissions fixed!"




# Accessing Files from WSL Terminal

If you're having trouble seeing files from WSL, try these steps:

## Option 1: Navigate to the correct path
```bash
cd ~/wspace/spaceracing
# or
cd /home/s/wspace/spaceracing
```

## Option 2: If files are in Windows path
If the files are actually in a Windows path accessed via WSL:
```bash
cd /mnt/c/path/to/spaceracing
# or wherever your Windows files are mounted
```

## Option 3: Check current location
```bash
pwd
ls -la
```

## Option 4: Fix permissions (if needed)
```bash
chmod -R 755 .
chmod 644 *.json *.html *.js *.md
chmod 644 src/*.js
```

## Verify files exist
```bash
ls -la
cat package.json
```

If you're still having issues, the files might be in a Windows-accessible location. Try accessing them from Windows PowerShell or File Explorer first to confirm they exist.




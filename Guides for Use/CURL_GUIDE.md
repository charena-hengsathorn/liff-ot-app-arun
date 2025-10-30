# CURL Guide: Master the Command Line HTTP Client

## Table of Contents
- [What is cURL?](#what-is-curl)
- [Basic Syntax](#basic-syntax)
- [HTTP Methods](#http-methods)
- [Headers](#headers)
- [Request Body](#request-body)
- [Authentication](#authentication)
- [File Uploads](#file-uploads)
- [Response Handling](#response-handling)
- [Debugging](#debugging)
- [Common Examples](#common-examples)
- [Best Practices](#best-practices)

## What is cURL?

cURL (Client URL) is a command-line tool for transferring data with URLs. It supports various protocols including HTTP, HTTPS, FTP, and more.

## Basic Syntax

```bash
curl [options] [URL]
```

## HTTP Methods

### GET Request (Default)
```bash
# Simple GET request
curl https://api.example.com/users

# GET with verbose output
curl -v https://api.example.com/users

# GET and save response to file
curl -o response.json https://api.example.com/users
```

### POST Request
```bash
# Basic POST request
curl -X POST https://api.example.com/users

# POST with data
curl -X POST -d "name=John&age=30" https://api.example.com/users

# POST with JSON data
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "age": 30}' \
  https://api.example.com/users
```

### PUT Request
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "age": 31}' \
  https://api.example.com/users/123
```

### DELETE Request
```bash
curl -X DELETE https://api.example.com/users/123
```

### PATCH Request
```bash
curl -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"age": 32}' \
  https://api.example.com/users/123
```

## Headers

### Setting Headers
```bash
# Single header
curl -H "Authorization: Bearer token123" https://api.example.com/users

# Multiple headers
curl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -H "Accept: application/json" \
  https://api.example.com/users

# Remove default headers
curl -H "User-Agent:" https://api.example.com/users
```

### Common Headers
```bash
# Content-Type
-H "Content-Type: application/json"
-H "Content-Type: application/x-www-form-urlencoded"
-H "Content-Type: multipart/form-data"

# Authorization
-H "Authorization: Bearer your-token"
-H "Authorization: Basic base64-encoded-credentials"
-H "X-API-Key: your-api-key"

# Accept
-H "Accept: application/json"
-H "Accept: text/html"
-H "Accept: */*"
```

## Request Body

### JSON Data
```bash
# Inline JSON
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}' \
  https://api.example.com/users

# JSON from file
curl -X POST \
  -H "Content-Type: application/json" \
  -d @data.json \
  https://api.example.com/users
```

### Form Data
```bash
# URL-encoded form data
curl -X POST \
  -d "name=John&email=john@example.com" \
  https://api.example.com/users

# Multipart form data
curl -X POST \
  -F "name=John" \
  -F "email=john@example.com" \
  -F "file=@document.pdf" \
  https://api.example.com/users
```

### Raw Data
```bash
# Send raw text
curl -X POST \
  -H "Content-Type: text/plain" \
  -d "Hello, World!" \
  https://api.example.com/message
```

## Authentication

### Bearer Token
```bash
curl -H "Authorization: Bearer your-jwt-token" \
  https://api.example.com/protected
```

### Basic Authentication
```bash
# Username and password
curl -u username:password https://api.example.com/protected

# Prompt for password (more secure)
curl -u username https://api.example.com/protected
```

### API Key
```bash
curl -H "X-API-Key: your-api-key" \
  https://api.example.com/protected
```

## File Uploads

### Single File
```bash
curl -X POST \
  -F "file=@/path/to/file.pdf" \
  https://api.example.com/upload
```

### Multiple Files
```bash
curl -X POST \
  -F "file1=@/path/to/file1.pdf" \
  -F "file2=@/path/to/file2.jpg" \
  https://api.example.com/upload
```

### File with Metadata
```bash
curl -X POST \
  -F "file=@/path/to/file.pdf" \
  -F "description=Important document" \
  -F "category=documents" \
  https://api.example.com/upload
```

## Response Handling

### Save Response to File
```bash
# Save with original filename
curl -O https://example.com/file.pdf

# Save with custom filename
curl -o myfile.pdf https://example.com/file.pdf

# Save response body
curl -o response.json https://api.example.com/users
```

### Show Response Headers
```bash
# Show response headers only
curl -I https://api.example.com/users

# Show both request and response headers
curl -v https://api.example.com/users

# Show response headers with body
curl -i https://api.example.com/users
```

### Follow Redirects
```bash
# Follow up to 5 redirects
curl -L https://example.com/redirect

# Follow redirects and save
curl -L -o file.html https://example.com/redirect
```

## Debugging

### Verbose Output
```bash
# Show detailed information
curl -v https://api.example.com/users

# Show even more details
curl --trace-ascii debug.txt https://api.example.com/users
```

### Show Timing
```bash
# Show timing information
curl -w "@curl-format.txt" https://api.example.com/users
```

Create `curl-format.txt`:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### Test Connection
```bash
# Test if endpoint is reachable
curl -I https://api.example.com/health

# Test with timeout
curl --connect-timeout 10 https://api.example.com/users
```

## Common Examples

### Testing Your Monthly Sheet API
```bash
# Test monthly sheet creation
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"env": "dev"}' \
  http://localhost:3001/create-monthly-sheet

# Test with verbose output
curl -v -X POST \
  -H "Content-Type: application/json" \
  -d '{"env": "prod"}' \
  http://localhost:3001/create-monthly-sheet
```

### Testing Google Sheets API
```bash
# Check existing entry
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "action": "checkExisting",
    "driverName": "John",
    "thaiDate": "1/7/2568",
    "env": "dev"
  }' \
  http://localhost:3001/sheets

# Submit form data
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submit",
    "driverName": "John",
    "clockIn": "08:00",
    "clockOut": "17:00",
    "comments": "Regular day",
    "env": "dev"
  }' \
  http://localhost:3001/sheets
```

### Testing LINE Notifications
```bash
# Send LINE notification
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test notification from cURL",
    "env": "dev"
  }' \
  http://localhost:3001/notify-line
```

### RESTful API Examples
```bash
# GET all users
curl https://api.example.com/users

# GET specific user
curl https://api.example.com/users/123

# CREATE user
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}' \
  https://api.example.com/users

# UPDATE user
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated", "email": "john.updated@example.com"}' \
  https://api.example.com/users/123

# DELETE user
curl -X DELETE https://api.example.com/users/123
```

### File Operations
```bash
# Download file
curl -O https://example.com/file.pdf

# Upload file
curl -X POST \
  -F "file=@/path/to/file.pdf" \
  https://api.example.com/upload

# Download with progress bar
curl -# -O https://example.com/large-file.zip
```

## Best Practices

### 1. Use Quotes for URLs with Special Characters
```bash
# Good
curl "https://api.example.com/users?name=John Doe&age=30"

# Bad
curl https://api.example.com/users?name=John Doe&age=30
```

### 2. Use Long Options for Readability
```bash
# Good
curl --request POST --header "Content-Type: application/json" --data '{"name": "John"}'

# Also good (shorter)
curl -X POST -H "Content-Type: application/json" -d '{"name": "John"}'
```

### 3. Handle JSON Properly
```bash
# Good - proper JSON escaping
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello \"World\""}' \
  https://api.example.com/users

# Better - use file for complex JSON
curl -X POST \
  -H "Content-Type: application/json" \
  -d @data.json \
  https://api.example.com/users
```

### 4. Use Environment Variables for Sensitive Data
```bash
# Set environment variables
export API_KEY="your-secret-key"
export API_URL="https://api.example.com"

# Use in curl
curl -H "Authorization: Bearer $API_KEY" "$API_URL/users"
```

### 5. Create Reusable Scripts
```bash
#!/bin/bash
# api-test.sh

API_URL="https://api.example.com"
API_KEY="your-api-key"

# Test GET
echo "Testing GET /users"
curl -H "Authorization: Bearer $API_KEY" "$API_URL/users"

# Test POST
echo "Testing POST /users"
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}' \
  "$API_URL/users"
```

### 6. Error Handling
```bash
# Check HTTP status code
curl -w "HTTP Status: %{http_code}\n" \
  -o response.json \
  https://api.example.com/users

# Fail on HTTP errors
curl -f https://api.example.com/users

# Show error details
curl -v --fail https://api.example.com/users
```

### 7. Rate Limiting
```bash
# Add delay between requests
curl --limit-rate 1000B https://api.example.com/users
```

## Useful cURL Options

| Option | Description |
|--------|-------------|
| `-X, --request` | Specify HTTP method |
| `-H, --header` | Add HTTP header |
| `-d, --data` | Send POST data |
| `-F, --form` | Send multipart form data |
| `-u, --user` | Basic authentication |
| `-L, --location` | Follow redirects |
| `-o, --output` | Write output to file |
| `-O, --remote-name` | Write output to file with remote name |
| `-v, --verbose` | Show detailed information |
| `-i, --include` | Include response headers |
| `-I, --head` | Show response headers only |
| `-f, --fail` | Fail silently on HTTP errors |
| `-k, --insecure` | Allow insecure connections |
| `-w, --write-out` | Custom output format |
| `--connect-timeout` | Connection timeout |
| `--max-time` | Maximum time for operation |

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   ```bash
   curl -k https://api.example.com/users  # Skip SSL verification
   ```

2. **Timeout Issues**
   ```bash
   curl --connect-timeout 30 --max-time 60 https://api.example.com/users
   ```

3. **Encoding Issues**
   ```bash
   curl --data-urlencode "name=John Doe" https://api.example.com/users
   ```

4. **Large File Uploads**
   ```bash
   curl --max-time 300 -F "file=@large-file.zip" https://api.example.com/upload
   ```

### Debugging Tips

1. **Always use `-v` for debugging**
2. **Check response headers with `-i`**
3. **Use `--trace-ascii` for detailed logs**
4. **Test with simple endpoints first**
5. **Verify JSON syntax with online validators**

---

## Quick Reference

```bash
# Basic GET
curl https://api.example.com/users

# POST with JSON
curl -X POST -H "Content-Type: application/json" -d '{"key": "value"}' https://api.example.com/users

# With authentication
curl -H "Authorization: Bearer token" https://api.example.com/protected

# Upload file
curl -F "file=@file.pdf" https://api.example.com/upload

# Download file
curl -O https://example.com/file.pdf

# Debug request
curl -v https://api.example.com/users
```

This guide covers the most common cURL use cases. For more advanced features, check the official cURL documentation: https://curl.se/docs/ 
# Hasura Permissions Configuration Guide

This document provides step-by-step instructions for setting up Row-Level Security (RLS) permissions in Hasura for the chatbot application.

## Table Permissions Configuration

### 1. Chats Table Permissions (Role: user)

#### SELECT Permission
- **Row select permissions**: 
  ```json
  {
    "user_id": {
      "_eq": "X-Hasura-User-Id"
    }
  }
  ```
- **Column select permissions**: Select all columns
- **Aggregation queries permissions**: Allow

#### INSERT Permission  
- **Row insert permissions**: Without any checks
- **Column insert permissions**: Allow `title`
- **Column presets**:
  ```json
  {
    "user_id": "X-Hasura-User-Id"
  }
  ```

#### UPDATE Permission
- **Row update permissions**:
  ```json
  {
    "user_id": {
      "_eq": "X-Hasura-User-Id"  
    }
  }
  ```
- **Column update permissions**: Allow `title`

#### DELETE Permission
- **Row delete permissions**:
  ```json
  {
    "user_id": {
      "_eq": "X-Hasura-User-Id"
    }
  }
  ```

### 2. Messages Table Permissions (Role: user)

#### SELECT Permission
- **Row select permissions**:
  ```json
  {
    "chat": {
      "user_id": {
        "_eq": "X-Hasura-User-Id"
      }
    }
  }
  ```
- **Column select permissions**: Select all columns
- **Aggregation queries permissions**: Allow

#### INSERT Permission
- **Row insert permissions**:
  ```json
  {
    "chat": {
      "user_id": {
        "_eq": "X-Hasura-User-Id"
      }
    }
  }
  ```
- **Column insert permissions**: Allow `chat_id`, `role`, `content`
- **Column presets**:
  ```json
  {
    "user_id": "X-Hasura-User-Id"
  }
  ```

#### UPDATE Permission
- **Row update permissions**:
  ```json
  {
    "chat": {
      "user_id": {
        "_eq": "X-Hasura-User-Id"
      }
    }
  }
  ```
- **Column update permissions**: Allow `content` (optional - for message editing)

#### DELETE Permission  
- **Row delete permissions**:
  ```json
  {
    "chat": {
      "user_id": {
        "_eq": "X-Hasura-User-Id"
      }
    }
  }
  ```

## Relationships Configuration

### Chats Table Relationships
1. **Object relationship**: `user`
   - Remote table: `auth.users`
   - Column mapping: `user_id` → `id`

2. **Array relationship**: `messages`
   - Remote table: `messages`
   - Column mapping: `id` → `chat_id`

### Messages Table Relationships
1. **Object relationship**: `chat`
   - Remote table: `chats` 
   - Column mapping: `chat_id` → `id`

2. **Object relationship**: `user`
   - Remote table: `auth.users`
   - Column mapping: `user_id` → `id`

## Action Permissions

### sendMessage Action
- **Role**: `user`
- **Session argument**: Enabled
- **Request headers forwarding**: Enable the following headers:
  - `x-hasura-user-id`
  - `x-hasura-role`
  - `authorization`

## Environment Variables for Hasura

Set these environment variables in your Hasura instance:

```bash
# JWT Configuration (automatically set by Nhost)
HASURA_GRAPHQL_JWT_SECRET={"type":"RS256","jwks_url":"https://your-subdomain.nhost.run/v1/auth/jwks"}

# Admin Secret (for n8n webhook access)
HASURA_GRAPHQL_ADMIN_SECRET=your-secure-admin-secret

# Database URL (automatically set by Nhost)
HASURA_GRAPHQL_DATABASE_URL=postgres://...

# Enable console and dev mode (development only)
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_DEV_MODE=true
```

## Implementation Steps

1. **Create Tables**: Run the SQL from `database-schema.sql`

2. **Track Tables**: In Hasura console, go to Data tab and track both tables

3. **Create Relationships**: 
   - Add the relationships described above
   - Ensure foreign key relationships are detected

4. **Set Permissions**: 
   - Go to Permissions tab for each table
   - Add `user` role with the permissions listed above
   - Test permissions using GraphiQL with proper JWT headers

5. **Create Action**:
   - Go to Actions tab
   - Create new action with the configuration from `hasura-actions.yaml` 
   - Set handler URL to your n8n webhook endpoint
   - Enable permissions for `user` role

6. **Test Setup**:
   - Use GraphiQL explorer to test queries with JWT
   - Verify row-level security is working
   - Test the Action with proper authentication

## Security Notes

- **Never expose admin role** to frontend clients
- **Column presets** prevent users from spoofing `user_id` 
- **Relationship filters** ensure users can only access their own data through the chat relationship
- **JWT validation** is handled automatically by Nhost integration
- **Session variables** are extracted from the JWT token by Hasura

## Troubleshooting

- **Permission denied errors**: Check that relationships are properly configured
- **Missing session variables**: Verify JWT configuration and Nhost integration  
- **Action failures**: Ensure webhook URL is accessible and n8n workflow is active
- **Row filtering not working**: Check that column presets and filters match exactly
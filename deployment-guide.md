# Deployment Guide

This guide covers the complete deployment process for the Nhost + Hasura + n8n Chatbot application.

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- Git installed
- Access to:
  - [Nhost](https://nhost.io) account
  - [n8n Cloud](https://n8n.io) or self-hosted n8n instance
  - [OpenRouter](https://openrouter.ai) API account

## Step 1: Nhost Setup

### 1.1 Create Nhost Project
1. Go to [Nhost Console](https://app.nhost.io)
2. Create a new project
3. Note down your:
   - **Subdomain**: `your-project-subdomain`
   - **Region**: `us-east-1` (or your chosen region)
   - **Hasura GraphQL Endpoint**: `https://your-subdomain.nhost.run/v1/graphql`

### 1.2 Configure Authentication
1. In Nhost Console, go to **Authentication** settings
2. Enable **Email & Password** authentication
3. Configure email templates (optional)
4. Set allowed redirect URLs for your domain

### 1.3 Database Setup
1. Go to **Database** section in Nhost Console
2. Open **SQL Editor**
3. Run the SQL from `database-schema.sql` file:

```sql
-- Copy the entire content from database-schema.sql and execute
```

## Step 2: Hasura Configuration

### 2.1 Track Tables and Relationships
1. Open **Hasura Console** from Nhost dashboard
2. Go to **Data** tab
3. **Track tables**: Click "Track" for both `chats` and `messages` tables
4. **Create relationships**:
   - For `chats` table: Add array relationship `messages` → `messages` table (id → chat_id)
   - For `messages` table: Add object relationship `chat` → `chats` table (chat_id → id)

### 2.2 Configure Permissions
Follow the detailed instructions in `hasura-permissions-guide.md`:

1. Go to **Permissions** tab for each table
2. Add **user** role with the specified permissions
3. Set up row-level security filters
4. Configure column presets for user_id

### 2.3 Create Hasura Action
1. Go to **Actions** tab
2. Click **Create**
3. **Action Definition**:
   ```graphql
   type Mutation {
     sendMessage(input: SendMessageInput!): SendMessageOutput!
   }
   ```

4. **Type Definitions**:
   ```graphql
   input SendMessageInput {
     chat_id: uuid!
     content: String!
   }

   type SendMessageOutput {
     reply: String!
   }
   ```

5. **Handler**: Leave empty for now (will be filled after n8n setup)
6. **Permissions**: Allow `user` role

## Step 3: OpenRouter Setup

### 3.1 Get API Key
1. Sign up at [OpenRouter](https://openrouter.ai)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `sk-or-v1-...`)

### 3.2 Choose Model
Free models available:
- `microsoft/phi-3-mini-128k-instruct:free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `google/gemma-2-9b-it:free`

## Step 4: n8n Workflow Setup

### 4.1 n8n Cloud Setup
1. Sign up at [n8n.io](https://n8n.io)
2. Create a new workflow
3. Import the workflow from `n8n-workflow.json`

### 4.2 Configure Environment Variables
In n8n, set these environment variables:
- `HASURA_GRAPHQL_URL`: Your Hasura GraphQL endpoint
- `HASURA_ADMIN_SECRET`: Get from Nhost Console → Settings → Hasura
- `OPENROUTER_API_KEY`: Your OpenRouter API key

### 4.3 Activate Workflow
1. Save the workflow
2. Activate it
3. Copy the **Production Webhook URL**

### 4.4 Update Hasura Action
1. Go back to Hasura Console
2. Edit the `sendMessage` Action
3. Set **Handler** to your n8n webhook URL
4. Enable **Forward client headers**
5. Save the Action

## Step 5: Frontend Deployment

### 5.1 Environment Configuration
Create `.env` file in your project root:

```env
REACT_APP_NHOST_SUBDOMAIN=your-nhost-subdomain
REACT_APP_NHOST_REGION=us-east-1
REACT_APP_HASURA_GRAPHQL_URL=https://your-subdomain.nhost.run/v1/graphql
```

### 5.2 Install Dependencies
```bash
npm install
```

### 5.3 Test Locally
```bash
npm start
```

Visit http://localhost:3000 and test:
1. Sign up with email/password
2. Create a chat
3. Send a message
4. Verify AI response

### 5.4 Deploy to Production

#### Option A: Vercel
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

#### Option B: Netlify
1. Build the project: `npm run build`
2. Upload `build` folder to Netlify
3. Set environment variables
4. Deploy

#### Option C: Traditional Hosting
1. Build: `npm run build`
2. Upload `build` folder to your web server
3. Configure web server to serve SPA routes

## Step 6: Testing & Verification

### 6.1 Test Authentication
- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Sign out functionality

### 6.2 Test Chat Functionality
- [ ] Create new chat
- [ ] Send messages
- [ ] Receive AI responses
- [ ] Real-time message updates
- [ ] Multiple chat sessions

### 6.3 Test Security
- [ ] Verify users can only see their own chats
- [ ] Test with multiple user accounts
- [ ] Check that direct GraphQL access is restricted

### 6.4 Test n8n Workflow
- [ ] Check n8n execution logs
- [ ] Verify OpenRouter API calls
- [ ] Test error handling

## Step 7: Production Considerations

### 7.1 Security Hardening
- [ ] Enable HTTPS everywhere
- [ ] Set proper CORS origins in Nhost
- [ ] Review Hasura permissions thoroughly
- [ ] Monitor API usage and rate limits

### 7.2 Performance Optimization
- [ ] Enable Hasura query caching
- [ ] Set up database connection pooling
- [ ] Implement frontend code splitting
- [ ] Add service worker for offline support

### 7.3 Monitoring & Logging
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Nhost usage and billing
- [ ] Set up n8n execution monitoring
- [ ] Track OpenRouter API usage

### 7.4 Backup & Recovery
- [ ] Configure database backups in Nhost
- [ ] Export n8n workflow regularly
- [ ] Keep environment variables secure and backed up

## Troubleshooting

### Common Issues

1. **JWT/Authentication errors**
   - Check Nhost subdomain and region
   - Verify JWT configuration in Hasura
   - Check browser console for auth errors

2. **Permission denied in GraphQL**
   - Verify Hasura permissions are set correctly
   - Check that relationships are properly configured
   - Test with GraphiQL using proper JWT headers

3. **n8n webhook not responding**
   - Check workflow is activated
   - Verify webhook URL in Hasura Action
   - Check n8n execution logs for errors

4. **OpenRouter API errors**
   - Verify API key is valid
   - Check OpenRouter balance/credits
   - Review model availability

5. **Real-time subscriptions not working**
   - Check WebSocket connections in browser
   - Verify GraphQL subscription permissions
   - Test with proper authentication headers

### Debug Tools

- **Hasura Console**: Check GraphiQL explorer and logs
- **n8n**: View workflow executions and logs  
- **Browser DevTools**: Check network requests and console errors
- **Nhost Console**: Monitor authentication and database usage

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the official documentation:
   - [Nhost Docs](https://docs.nhost.io)
   - [Hasura Docs](https://hasura.io/docs)
   - [n8n Docs](https://docs.n8n.io)
3. Check GitHub issues in this repository
4. Join community forums for additional help

## Next Steps

After successful deployment:
- Customize the chatbot system prompt in n8n
- Add more AI models or providers
- Implement additional chat features
- Set up analytics and monitoring
- Scale infrastructure as needed
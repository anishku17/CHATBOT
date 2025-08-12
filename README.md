# Nhost + Hasura + n8n Chatbot Application

A full-stack chatbot application built with Nhost authentication, Hasura GraphQL API, n8n workflow automation, and OpenRouter AI integration.

## 🏗️ Architecture

- **Frontend**: React.js with Apollo GraphQL Client
- **Authentication**: Nhost Auth (Email/Password)
- **Database**: PostgreSQL with Hasura GraphQL API
- **AI Integration**: OpenRouter via n8n webhooks
- **Real-time**: GraphQL Subscriptions
- **Permissions**: Row-Level Security (RLS)

## 📋 Features

- ✅ Email authentication with Nhost
- ✅ Real-time chat interface
- ✅ Multiple chat sessions
- ✅ AI-powered responses via OpenRouter
- ✅ Row-level security for data isolation
- ✅ GraphQL-only frontend communication
- ✅ Responsive design with dark theme

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Nhost account
- n8n instance (cloud or self-hosted)
- OpenRouter API key

### 1. Nhost Setup

1. Create a new Nhost project at [nhost.io](https://nhost.io)
2. Note your `subdomain` and `region`
3. Enable email authentication in Nhost console

### 2. Database Schema

Run these SQL commands in Hasura console:

```sql
-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table  
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 3. Hasura Permissions

Configure these permissions for the `user` role:

#### chats table:
- **select**: `{"user_id": {"_eq": "X-Hasura-User-Id"}}`
- **insert**: Column presets: `user_id: X-Hasura-User-Id`
- **update**: `{"user_id": {"_eq": "X-Hasura-User-Id"}}`
- **delete**: `{"user_id": {"_eq": "X-Hasura-User-Id"}}`

#### messages table:
- **select**: `{"chat": {"user_id": {"_eq": "X-Hasura-User-Id"}}}`
- **insert**: 
  - Filter: `{"chat": {"user_id": {"_eq": "X-Hasura-User-Id"}}}`
  - Column presets: `user_id: X-Hasura-User-Id`
- **update**: `{"chat": {"user_id": {"_eq": "X-Hasura-User-Id"}}}`
- **delete**: `{"chat": {"user_id": {"_eq": "X-Hasura-User-Id"}}}`

### 4. Hasura Action

Create a new Action in Hasura console:

**Action Name**: `sendMessage`
**Type**: Mutation
**Handler**: Your n8n webhook URL

**Input Type**:
```graphql
input SendMessageInput {
  chat_id: uuid!
  content: String!
}
```

**Output Type**:
```graphql
type SendMessageOutput {
  reply: String!
}
```

**Permissions**: Allow `user` role

### 5. n8n Workflow

1. Import the workflow from `n8n-workflow.json`
2. Configure your OpenRouter API key in credentials
3. Set your Hasura GraphQL endpoint and admin secret
4. Deploy and get the webhook URL

### 6. Frontend Configuration

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   REACT_APP_NHOST_SUBDOMAIN=your-subdomain
   REACT_APP_NHOST_REGION=us-east-1
   REACT_APP_HASURA_GRAPHQL_URL=https://your-subdomain.nhost.run/v1/graphql
   ```

4. Start development server:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
chatbot-app/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Chat/
│   │   └── Layout/
│   ├── graphql/
│   │   ├── queries.js
│   │   ├── mutations.js
│   │   └── subscriptions.js
│   ├── hooks/
│   ├── utils/
│   └── App.js
├── hasura/
│   ├── metadata/
│   └── migrations/
├── n8n/
│   └── workflow.json
├── package.json
└── README.md
```

## 🔒 Security Features

- **Row-Level Security**: Users can only access their own data
- **JWT Authentication**: Secure session management with Nhost
- **Permission Filters**: Hasura enforces access control at the database level
- **Server-side AI calls**: API keys are never exposed to the frontend
- **Input validation**: Proper validation on all user inputs

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### GraphQL Operations

The app uses these main GraphQL operations:

**Queries**:
- `GET_CHATS` - Fetch user's chats
- `GET_MESSAGES` - Fetch messages for a chat

**Mutations**:
- `CREATE_CHAT` - Create new chat
- `INSERT_MESSAGE` - Add user message
- `SEND_MESSAGE` - Trigger chatbot via Action

**Subscriptions**:
- `MESSAGES_SUBSCRIPTION` - Real-time message updates

## 📝 API Integration

### OpenRouter Models

Configure your preferred model in n8n workflow. Free options include:
- `microsoft/phi-3-mini-128k-instruct:free`
- `meta-llama/llama-3.2-3b-instruct:free`
- `google/gemma-2-9b-it:free`

### Custom Instructions

Modify the system prompt in n8n workflow to customize chatbot behavior.

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the app: `npm run build`
2. Deploy the `build` folder
3. Set environment variables in deployment platform

### Backend

- Nhost handles database and GraphQL API automatically
- Deploy n8n workflow to your n8n instance
- Ensure webhook URL is accessible from Hasura

## 🐛 Troubleshooting

### Common Issues

1. **Authentication errors**: Check Nhost configuration and JWT settings
2. **Permission denied**: Verify Hasura permissions for user role
3. **Webhook timeouts**: Check n8n workflow and OpenRouter API connectivity
4. **Real-time updates not working**: Verify GraphQL subscription setup

### Debug Mode

Enable debug logging by setting:
```env
REACT_APP_DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- [Nhost Documentation](https://docs.nhost.io)
- [Hasura Documentation](https://hasura.io/docs)
- [n8n Documentation](https://docs.n8n.io)
- [OpenRouter API](https://openrouter.ai/docs)

## 🔧 Advanced Configuration

### Custom Themes

Modify CSS custom properties in `src/styles/theme.css` to customize the appearance.

### Additional AI Providers

The n8n workflow can be modified to support other AI providers like OpenAI, Anthropic, or local models.

### Scaling

For production use:
- Enable connection pooling in Hasura
- Set up database read replicas
- Implement rate limiting
- Add monitoring and logging

---

Built with ❤️ using Nhost, Hasura, n8n, and OpenRouter
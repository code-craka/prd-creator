# API Documentation

This document provides a comprehensive reference for the PRD Creator API.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users-endpoints)
  - [Teams](#teams-endpoints)
  - [PRDs](#prds-endpoints)
- [WebSocket Events](#websocket-events)
- [Examples](#examples)

## 🌐 Overview

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.prdcreator.com/api
```

### API Version
Current version: `v1`

### Content Type
All requests and responses use `application/json` content type.

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔐 Authentication

### JWT Tokens
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Token Lifecycle
- **Expiration**: Tokens expire after 7 days
- **Refresh**: Tokens are automatically refreshed on successful requests
- **Revocation**: Tokens are revoked on logout

## ❌ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific error details"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## 📊 Rate Limiting

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour
- **Rate limit headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## 🔗 Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": null,
      "created_at": "2024-07-18T10:00:00Z"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": null,
      "current_team_id": "team_uuid"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

#### Get Current User
```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar_url": null,
      "current_team_id": "team_uuid",
      "created_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Update Profile
```http
PUT /api/auth/profile
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Change Password
```http
POST /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Logout
```http
POST /api/auth/logout
```

### Teams Endpoints

#### Create Team
```http
POST /api/teams
```

**Request Body:**
```json
{
  "name": "My Team"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "name": "My Team",
      "slug": "my-team",
      "owner_id": "user_uuid",
      "created_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Get User Teams
```http
GET /api/teams/my-teams
```

**Response:**
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "uuid",
        "name": "My Team",
        "slug": "my-team",
        "owner_id": "user_uuid",
        "role": "owner",
        "created_at": "2024-07-18T10:00:00Z"
      }
    ]
  }
}
```

#### Switch Team
```http
POST /api/teams/switch
```

**Request Body:**
```json
{
  "teamId": "team_uuid"
}
```

#### Get Team Details
```http
GET /api/teams/:teamId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "name": "My Team",
      "slug": "my-team",
      "owner_id": "user_uuid",
      "description": "Team description",
      "avatar_url": null,
      "created_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Update Team
```http
PUT /api/teams/:teamId
```

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "avatar_url": "https://example.com/team-avatar.jpg"
}
```

#### Invite Member
```http
POST /api/teams/:teamId/invite
```

**Request Body:**
```json
{
  "email": "member@example.com"
}
```

#### Get Team Members
```http
GET /api/teams/:teamId/members
```

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "team_id": "team_uuid",
        "user_id": "user_uuid",
        "role": "owner",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar_url": null,
        "joined_at": "2024-07-18T10:00:00Z"
      }
    ]
  }
}
```

#### Update Member Role
```http
PUT /api/teams/:teamId/members/:memberId/role
```

**Request Body:**
```json
{
  "role": "admin"
}
```

#### Remove Member
```http
DELETE /api/teams/:teamId/members/:memberId
```

#### Delete Team
```http
DELETE /api/teams/:teamId
```

### PRDs Endpoints

#### Create PRD
```http
POST /api/prds
```

**Request Body:**
```json
{
  "title": "My Product Requirements Document",
  "content": "Detailed PRD content...",
  "teamId": "team_uuid",
  "visibility": "private",
  "metadata": {
    "questions": {
      "target_audience": "Developers",
      "problem_statement": "Need better PRD tool"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prd": {
      "id": "uuid",
      "user_id": "user_uuid",
      "team_id": "team_uuid",
      "title": "My Product Requirements Document",
      "content": "Detailed PRD content...",
      "visibility": "private",
      "metadata": {},
      "view_count": 0,
      "created_at": "2024-07-18T10:00:00Z",
      "updated_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Get User PRDs
```http
GET /api/prds
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My PRD",
      "visibility": "private",
      "view_count": 5,
      "created_at": "2024-07-18T10:00:00Z",
      "updated_at": "2024-07-18T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Get Public PRDs
```http
GET /api/prds/public
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Public PRD",
      "view_count": 100,
      "author_name": "John Doe",
      "author_avatar": null,
      "created_at": "2024-07-18T10:00:00Z"
    }
  ]
}
```

#### Get PRD by ID
```http
GET /api/prds/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prd": {
      "id": "uuid",
      "title": "My PRD",
      "content": "Full PRD content...",
      "visibility": "private",
      "view_count": 5,
      "created_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Update PRD
```http
PUT /api/prds/:id
```

**Request Body:**
```json
{
  "title": "Updated PRD Title",
  "content": "Updated content...",
  "visibility": "public"
}
```

#### Delete PRD
```http
DELETE /api/prds/:id
```

#### Share PRD with Team
```http
POST /api/prds/:id/share-team
```

#### Create Public Share Link
```http
POST /api/prds/:id/share-public
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareToken": "abc123def456",
    "shareUrl": "/shared/abc123def456"
  }
}
```

#### Get Shared PRD
```http
GET /api/prds/shared/:token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prd": {
      "id": "uuid",
      "title": "Shared PRD",
      "content": "PRD content...",
      "author_name": "John Doe",
      "author_avatar": null,
      "view_count": 150,
      "created_at": "2024-07-18T10:00:00Z"
    }
  }
}
```

#### Get Team PRDs
```http
GET /api/teams/:teamId/prds
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Team PRD",
      "author_name": "John Doe",
      "author_avatar": null,
      "view_count": 25,
      "created_at": "2024-07-18T10:00:00Z"
    }
  ]
}
```

## 🔌 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
```

### Events
- `prd:updated` - PRD was updated
- `team:member_joined` - New team member joined
- `team:member_left` - Team member left
- `notification:new` - New notification

## 📝 Examples

### JavaScript/Node.js
```javascript
const API_BASE_URL = 'http://localhost:3001/api';

// Login and get token
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.token;

// Use token for authenticated requests
const prds = await fetch(`${API_BASE_URL}/prds`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```

### Python
```python
import requests

API_BASE_URL = 'http://localhost:3001/api'

# Login
response = requests.post(f'{API_BASE_URL}/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})

token = response.json()['data']['token']

# Get PRDs
prds = requests.get(f'{API_BASE_URL}/prds', headers={
    'Authorization': f'Bearer {token}'
})
```

### cURL
```bash
# Login
curl -X POST \
  http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get PRDs
curl -X GET \
  http://localhost:3001/api/prds \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## 📚 Additional Resources

- [Database Schema](./DATABASE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)

---

**Need help?** Contact [@code-craka](https://github.com/code-craka) or open an issue on GitHub.
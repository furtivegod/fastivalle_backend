# Fastivalle Backend

Backend API server for the **Fastivalle** mobile app, built with Node.js, Express.js, and MongoDB.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime - runs your server |
| **Express.js** | Web framework - handles HTTP requests & routing |
| **MongoDB** | Database - stores your app data |
| **Mongoose** | ODM - makes working with MongoDB easier in Node.js |

## Project Structure

```
fastivalle_backend/
├── src/
│   ├── config/         # Configuration (database, etc.)
│   ├── controllers/    # Handle request logic
│   ├── middleware/     # Express middleware (error handling, auth, etc.)
│   ├── models/         # MongoDB schemas (User, etc.)
│   ├── routes/         # API route definitions
│   ├── utils/          # Helper functions (JWT, etc.)
│   ├── app.js          # Express app setup
│   └── server.js       # Entry point - starts the server
├── .env.example        # Example environment variables
├── package.json
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example file and add your values:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fastivalle
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=30d
```

**Don't have MongoDB?** Get a free cloud database at [MongoDB Atlas](https://www.mongodb.com/atlas).

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run the Server

**Development** (auto-reloads on file changes):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

The server will start at `http://localhost:5000`

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check - verify API is running |

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register with email/phone + password | No |
| POST | `/api/auth/login` | Login with email/phone + password | No |
| POST | `/api/auth/google` | Sign in with Google | No |
| POST | `/api/auth/apple` | Sign in with Apple | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| PUT | `/api/auth/me` | Update current user profile | Yes |

## Mobile App Integration Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "phone": "+1234567890",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Google Sign-In

From your mobile app, after Google Sign-In completes:

```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "googleId": "google-user-id",
    "email": "user@gmail.com",
    "name": "John Doe",
    "profileImage": "https://..."
  }'
```

### Apple Sign-In

From your mobile app, after Apple Sign-In completes:

```bash
curl -X POST http://localhost:5000/api/auth/apple \
  -H "Content-Type: application/json" \
  -d '{
    "appleId": "apple-user-id",
    "email": "user@icloud.com",
    "name": "John Doe"
  }'
```

### Access Protected Routes

Include the token in the Authorization header:

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Adding New Features

### Adding a New Route

1. **Create a model** (if you need database): `src/models/User.js`
2. **Create a controller**: `src/controllers/userController.js`
3. **Create routes**: `src/routes/users.js`
4. **Register in** `src/routes/index.js`:
   ```javascript
   const userRoutes = require('./users');
   router.use('/users', userRoutes);
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing tokens (keep this safe!) |
| `JWT_EXPIRES_IN` | Token expiration time (default: 30d) |

## Need Help?

- [Express.js Guide](https://expressjs.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [Mongoose Docs](https://mongoosejs.com/docs/)

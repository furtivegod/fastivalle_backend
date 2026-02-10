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

**Production:** App sends **Firebase idToken** (from `auth().currentUser.getIdToken()`). Backend verifies with Firebase Admin (set `GOOGLE_APPLICATION_CREDENTIALS` or `FIREBASE_PROJECT_ID` in `.env`):

```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "FIREBASE_ID_TOKEN_FROM_APP"}'
```

**Dev (no verification):** Send `googleId` and `email`:

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

**Production:** Send the **identityToken** from Sign in with Apple (requires `APPLE_CLIENT_ID` in `.env`):

```bash
curl -X POST http://localhost:5000/api/auth/apple \
  -H "Content-Type: application/json" \
  -d '{"identityToken": "APPLE_IDENTITY_TOKEN_FROM_APP"}'
```

**Dev (no verification):** Send `appleId` and optionally `email` (Apple only sends email on first sign-in):

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

## Authentication Setup (Database + Google/Apple)

### User model (MongoDB)

Users are stored in MongoDB with:

- **Email** and/or **phone** (at least one)
- **Password** (hashed with bcrypt; optional for social-only users)
- **Google ID** / **Apple ID** when they sign in with Google or Apple
- **authProvider**: `local` | `google` | `apple`

Register and login use email/phone + password. For Google/Apple, the app sends the provider’s token; the server can verify it when you set the env vars below.

### Google Sign-In (Firebase idToken – recommended)

The app uses **Firebase Auth** with Google: it sends the **Firebase idToken** (from `auth().currentUser.getIdToken()`), not a raw Google idToken.

1. In [Firebase Console](https://console.firebase.google.com/) → Project settings → Service accounts, generate a new private key and save the JSON (e.g. `service-account.json`) in the backend folder.
2. Add to `.env`:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   ```
   Or set `FIREBASE_PROJECT_ID=your-project-id` if using default credentials.
3. The app sends **`idToken`** (Firebase idToken). The server verifies it with Firebase Admin, finds/creates the user by Firebase UID (stored as `googleId`), and returns your app JWT.

**Fallback (raw Google idToken):** If you set `GOOGLE_CLIENT_ID`, the server can also verify a raw Google idToken when Firebase verification is not used.

### Apple Sign-In (server-side verification)

1. Use your **iOS app bundle ID** as the audience when verifying the Apple identity token (e.g. `com.fastivalle.fastivalle-app`).
2. Add to `.env`:
   ```bash
   APPLE_CLIENT_ID=com.fastivalle.fastivalle-app
   ```
3. From the app, send **`identityToken`**, **`appleId`**, and optionally **`email`**, **`name`**, **`nonce`**. The server verifies the token and finds/creates the user.

### Protected routes

Send the JWT in the header:

```http
Authorization: Bearer <token>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing tokens (keep this safe!) |
| `JWT_EXPIRES_IN` | Token expiration time (default: 30d) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON (for Firebase idToken verification) |
| `FIREBASE_PROJECT_ID` | Firebase project ID (alternative to service account file) |
| `GOOGLE_CLIENT_ID` | Optional. Raw Google OAuth Client ID (fallback when not using Firebase) |
| `APPLE_CLIENT_ID` | Optional. iOS app bundle ID for Apple identityToken verification (e.g. com.fastivalle.fastivalle-app) |

## Deploying to Vercel (or other serverless)

On Vercel, the app runs as **serverless functions**: there is no long-running process that connects to MongoDB at startup. If the DB connection isn’t established before the first request, Mongoose buffers operations and you can see:

`MongooseError: Operation 'users.findOne()' buffering timed out after 10000ms`

**Code changes in this repo:** The DB layer now caches the connection and API routes use middleware that ensures MongoDB is connected before handling requests, so the first request establishes the connection and later ones reuse it.

**You must also:**

1. **Set `MONGODB_URI` in Vercel**  
   In the Vercel project → Settings → Environment Variables, add `MONGODB_URI` with your MongoDB Atlas connection string (same as in `.env` locally). Do **not** use `localhost`; use the Atlas host from the Atlas dashboard.

2. **Allow access from anywhere in MongoDB Atlas**  
   Vercel’s outbound IPs change, so Atlas must allow all IPs:
   - Open [MongoDB Atlas](https://cloud.mongodb.com/) → your project → **Network Access**.
   - Click **Add IP Address**.
   - Choose **Allow Access from Anywhere** (adds `0.0.0.0/0`).
   - Save. Wait a minute for it to apply.

After redeploying and setting the env var + Atlas network rule, the timeout error should go away.

## Need Help?

- [Express.js Guide](https://expressjs.com/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/)
- [Mongoose Docs](https://mongoosejs.com/docs/)

# 🇮🇳 Personal IFSC API

A lightweight, private **IFSC Code Lookup API** built with a Vercel serverless function.

The API acts as a secure wrapper around the upstream [`ifsc.indianapi.in`](https://ifsc.indianapi.in/) service. Clients authenticate with your own private API key, submit an Indian bank IFSC code, and receive the upstream bank/IFSC data as JSON.

## ✨ Features

- 🔐 Private API-key authentication
- ⚡ Vercel serverless deployment
- 🇮🇳 Indian IFSC code validation
- 🔑 Supports API keys through:
  - `x-api-key` header
  - `Authorization: Bearer <key>` header
  - `?key=` query parameter
  - `?api_key=` query parameter
- 🔎 Supports IFSC input through:
  - `?ifsc=`
  - `?bank_code=`
  - `?code=`
- 🛡️ Constant-time API-key comparison using `crypto.timingSafeEqual`
- 🌐 CORS enabled for browser/API clients
- 💾 CDN caching enabled for successful lookups
- 🚀 No database required
- 📦 No external npm dependencies

## 🏗️ Project Structure

```text
IFCS-code-main/
├── api/
│   └── ifsc.js          # Vercel serverless IFSC endpoint
├── .env.example         # Environment variable template
├── .gitignore
├── package.json
├── vercel.json           # Vercel route rewrites
└── README.md
```

## ⚙️ How It Works

The request flow is:

```text
Client
  │
  │  API key + IFSC code
  ▼
Vercel /ifsc
  │
  ├── Authenticate request
  ├── Validate IFSC format
  │
  ▼
ifsc.indianapi.in
  │
  ▼
JSON response
```

The personal API key is checked before the request is forwarded to the upstream service. The upstream API key remains server-side in Vercel environment variables and is never intended to be exposed to clients.

## ✅ Requirements

- Node.js 18 or newer
- A Vercel account
- An API key from `indianapi.in`
- A private personal API key that you distribute to your own API users

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd IFCS-code-main
```

### 2. Configure environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Then set your values:

```env
INDIANAPI_KEY=sk-live-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
PERSONAL_API_KEY=your-long-random-personal-key
```

### 3. Run with Vercel locally

Install the Vercel CLI if you do not already have it:

```bash
npm install -g vercel
```

Start the local development environment:

```bash
vercel dev
```

The API will normally be available through:

```text
http://localhost:3000/ifsc
```

## ☁️ Deploy to Vercel

### Option 1 — GitHub + Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables in **Vercel → Project → Settings → Environment Variables**.
4. Deploy the project.

### Option 2 — Vercel CLI

Login:

```bash
vercel login
```

Deploy:

```bash
vercel
```

For production:

```bash
vercel --prod
```

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `INDIANAPI_KEY` | Yes | API key used to authenticate with `ifsc.indianapi.in` |
| `PERSONAL_API_KEY` | Yes | Private key required by clients calling your API |

### Important

Never commit real API keys to GitHub.

Keep secrets only in:

- Local `.env` files that are ignored by Git
- Vercel Environment Variables
- Another secure secret-management system

## 📡 API Reference

### Endpoint

```http
GET /ifsc
```

The same serverless function is also available at:

```http
GET /api/ifsc
```

The Vercel configuration rewrites `/` and `/ifsc` to the serverless function.

### Authentication

#### Recommended: `x-api-key`

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867" \
  -H "x-api-key: YOUR_PERSONAL_API_KEY"
```

#### Authorization header

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867" \
  -H "Authorization: Bearer YOUR_PERSONAL_API_KEY"
```

#### Query parameter

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867&key=YOUR_PERSONAL_API_KEY"
```

Another supported query parameter is:

```text
?api_key=YOUR_PERSONAL_API_KEY
```

> For production use, prefer the `x-api-key` or `Authorization` header so the secret is not placed directly in the URL.

## 🔎 IFSC Lookup Parameters

The API accepts any one of these parameter names:

```text
?ifsc=SBIN0006867
?bank_code=SBIN0006867
?code=SBIN0006867
```

The value is normalized by trimming whitespace and converting it to uppercase before validation.

### IFSC Validation

The API expects an IFSC format matching:

```text
^[A-Z]{4}0[A-Z0-9]{6}$
```

Example of a valid format:

```text
SBIN0006867
```

## 📥 Example Request

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867" \
  -H "x-api-key: YOUR_PERSONAL_API_KEY"
```

## 📤 Response

For a successful request, the API returns the JSON response received from the upstream IFSC service.

A successful response uses HTTP status:

```text
200 OK
```

Because the upstream service controls the exact data fields, the returned JSON schema may depend on the upstream API response.

## ❌ Error Responses

### 401 — Unauthorized

Returned when the API key is missing or incorrect.

```json
{
  "error": "Unauthorized"
}
```

### 400 — Invalid IFSC code

Returned when the IFSC value does not match the required format.

```json
{
  "error": "Invalid IFSC code",
  "example": "SBIN0006867"
}
```

### 405 — Method not allowed

Only `GET` requests and CORS `OPTIONS` requests are supported.

```json
{
  "error": "Method not allowed"
}
```

### 500 — Server misconfigured

Returned when required environment variables are missing.

```json
{
  "error": "Server misconfigured"
}
```

### Upstream error

If the upstream IFSC service returns a non-success status, the API forwards that status and wraps the upstream response:

```json
{
  "error": "Upstream error",
  "details": {}
}
```

### 502 — Bad gateway

Returned when the server cannot successfully communicate with the upstream service.

```json
{
  "error": "Bad gateway",
  "message": "..."
}
```

## 🌐 CORS

The API currently allows cross-origin requests:

```text
Access-Control-Allow-Origin: *
```

Allowed methods:

```text
GET, OPTIONS
```

Allowed request headers include:

```text
x-api-key
Content-Type
Authorization
```

If you expose this API to a specific frontend in production, consider restricting `Access-Control-Allow-Origin` to your own domain.

## ⚡ Caching

Successful IFSC responses are configured with:

```text
s-maxage=86400
stale-while-revalidate=3600
```

This allows the Vercel edge/CDN layer to cache successful responses for up to 24 hours while permitting stale content to be revalidated for another hour.

## 🔒 Security Notes

This project includes several useful protections:

- Personal API keys are checked before upstream access.
- API-key comparison uses `crypto.timingSafeEqual` to reduce timing-attack exposure.
- The upstream API key is stored in a server-side environment variable.
- IFSC input is validated before the upstream request is made.
- Unsupported HTTP methods are rejected.

### Recommended production improvements

For a larger public-facing deployment, consider adding:

- Per-key rate limiting
- Request logging and monitoring
- Abuse protection
- IP or origin restrictions where appropriate
- Key rotation support
- A dedicated secret-management solution
- More restrictive CORS rules

## 🧪 Testing

A basic production test looks like:

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867" \
  -H "x-api-key: YOUR_PERSONAL_API_KEY"
```

Test unauthorized access:

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=SBIN0006867"
```

Expected result:

```json
{
  "error": "Unauthorized"
}
```

Test invalid IFSC input:

```bash
curl "https://YOUR-DOMAIN.vercel.app/ifsc?ifsc=INVALID" \
  -H "x-api-key: YOUR_PERSONAL_API_KEY"
```

Expected result:

```json
{
  "error": "Invalid IFSC code",
  "example": "SBIN0006867"
}
```

## 📄 License

No explicit open-source license is included in this repository. Unless you add a license file, normal copyright restrictions apply.

## 👨‍💻 Author

**Aritra Nath Hazra**

Personal IFSC lookup API built for private API access and Vercel deployment.

---

### ⭐ Project Summary

**Personal IFSC API** is a lightweight serverless API that securely exposes IFSC lookup functionality through a private API key while keeping the upstream `indianapi.in` credential on the server. It is designed for simple deployment on Vercel with minimal configuration and no database.

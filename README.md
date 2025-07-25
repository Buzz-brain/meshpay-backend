
# MeshPay API Documentation

> Base URL: `https://meshpay-backend.onrender.com/api`

---

## Register User

**POST** `/register`

**Request Body:**
```json
{
  "fullname": "Buzz brain",
  "email": "buzzbrain@gmail.com",
  "password": "buzzbrain123",
  "phone": "09155802922"
}
```

**Success Response:** (Status 200)
```json
{
  "message": "Registration successful",
  "user": {
    "id": "688353b0783c00497e36f94a",
    "fullname": "Buzz brain",
    "email": "buzzbrain@gmail.com",
    "phone": "09155802922",
    "accountNumber": "9155802922",
    "amount": 300000
  }
}
```

**Error Responses:**
- Status 400:
  - `{ "message": "All fields required" }`
  - `{ "message": "Phone number must be 11 digits and start with 0" }`
  - `{ "message": "Email already registered" }`
  - `{ "message": "Phone number already registered" }`
  - `{ "message": "Account number already exists" }`
- Status 500:
  - `{ "message": "Error registering user", "error": "<error message>" }`

---

## Login

**POST** `/login`

**Request Body:**
```json
{
  "email": "buzzbrain@gmail.com",
  "password": "buzzbrain123"
}
```

**Success Response:** (Status 200)
```json
{
  "message": "Login successful",
  "user": {
    "id": "688353b0783c00497e36f94a",
    "fullname": "Buzz brain",
    "email": "buzzbrain@gmail.com",
    "amount": 300000
  }
}
```

**Error Responses:**
- Status 400: `{ "message": "Invalid credentials" }`
- Status 500: `{ "message": "Error logging in", "error": "<error message>" }`

---

## Transfer Funds

**POST** `/transfer`

**Request Body:**
```json
{
  "from": "9155802922",
  "to": "8012345678",
  "amount": 100000
}
```

**Success Response:** (Status 200)
```json
{
  "message": "Transaction successful",
  "senderBalance": 200000,
  "receiverBalance": 400000
}
```

**Error Responses:**
- Status 400:
  - `{ "message": "All fields required" }`
  - `{ "message": "Sender and receiver cannot be the same" }`
  - `{ "message": "Sender or receiver not found" }`
  - `{ "message": "Insufficient funds" }`
- Status 500: `{ "message": "Error processing transaction", "error": "<error message>" }`

---

## Fetch All Users

**GET** `/users`

**Success Response:** (Status 200)
```json
{
  "users": [
    {
      "_id": "<user_id>",
      "fullname": "John Doe",
      "email": "john@example.com",
      "phone": "09155802922",
      "accountNumber": "9155802922",
      "amount": 300000
    },
    // ...more users
  ]
}
```

---

## Fetch Account Balance

**GET** `/balance?account=9155802922`

**Request:**
`GET http://localhost:3000/api/balance?account=9155802922`

**Success Response:** (Status 200)
```json
{
  "balance": 300000
}
```

**Error Responses:**
- Status 400:
  - `{ "message": "Account number is required" }`
  - `{ "message": "User not found" }`
- Status 500: `{ "message": "Error fetching balance", "error": "<error message>" }`

---

## Fetch Fullname by Account Number

**GET** `/verify-name?account=9155802922`

**Request:**
`GET http://localhost:3000/api/verify-name?account=9155802922`

**Success Response:** (Status 200)
```json
{
  "fullname": "Buzz brain"
}
```

**Error Responses:**
- Status 400:
  - `{ "message": "Account number is required" }`
  - `{ "message": "User not found" }`
- Status 500: `{ "message": "Error fetching fullname", "error": "<error message>" }`

---

## Notes
- All requests and responses are in JSON.
- All endpoints are CORS-enabled and can be accessed from any frontend.
- Account numbers are the last 10 digits of the user's phone number.


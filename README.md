# NestJS Cognito Sequelize Application

A production-ready NestJS application with AWS Cognito authentication and PostgreSQL database using Sequelize ORM.

## Features

- **NestJS Framework** - Modern, scalable Node.js framework
- **AWS Cognito Integration** - Secure user authentication and management
- **PostgreSQL Database** - Reliable relational database
- **Sequelize ORM** - Powerful ORM with migrations and model relationships
- **Swagger Documentation** - Auto-generated API documentation
- **File Upload Support** - Multer integration for file handling
- **TypeScript** - Full type safety and modern JavaScript features
- **Validation** - Class-validator for request validation
- **Error Handling** - Global exception filters
- **Audit Trail** - Created/updated by tracking

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── dto/               # Auth DTOs
│   ├── guards/            # Auth guards
│   ├── strategies/        # Passport strategies
│   └── auth.service.ts    # Auth service
├── users/                 # Users module
│   ├── dto/               # User DTOs
│   └── users.service.ts   # User service
├── vendor-profiles/       # Vendor profiles module
│   ├── dto/               # Vendor profile DTOs
│   └── vendor-profiles.service.ts
├── database/              # Database configuration
│   ├── models/            # Sequelize models
│   ├── migrations/        # Database migrations
│   ├── seeders/           # Database seeders
│   └── config/            # Database configuration
├── common/                # Common utilities
│   ├── filters/           # Exception filters
│   └── interceptors/      # Response interceptors
└── main.ts                # Application entry point
```

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nestjs-cognito-sequelize-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nestjs_cognito_app
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password

# AWS Cognito Configuration
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
AWS_COGNITO_CLIENT_ID=your_cognito_client_id
AWS_COGNITO_CLIENT_SECRET=your_cognito_client_secret
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Application Configuration
APP_PORT=3000
NODE_ENV=development
```

4. **Database Setup**
```bash
# Create database
createdb nestjs_cognito_app

# Run migrations
npm run migration:up

# (Optional) Run seeders
npm run seed:up
```

5. **Start the application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Authentication Flow

The application follows a secure passwordless authentication process:

### 1. Sign Up (Registration)
- User provides first name, last name, email, phone, and user type
- System registers user in AWS Cognito with passwordless configuration
- User can choose to verify via email or phone
- **User is NOT saved to database until verification is complete**

### 2. Send Verification Code
- User can request verification code via email or SMS
- System sends verification code through chosen method

### 3. Verify Code and Complete Registration
- User provides verification code received via email or SMS
- System verifies code with AWS Cognito
- **Only after successful verification:**
  - User account is created in PostgreSQL database
  - User is marked as verified
  - Account creation is confirmed

### 4. Passwordless Sign In
- User provides email or phone number
- System sends verification code to chosen method (email/SMS)
- User enters verification code to complete sign in
- Returns access tokens and user information
- User must exist in both Cognito and PostgreSQL database

### Key Security Features:
- Passwordless authentication eliminates password-related vulnerabilities
- Users cannot sign in until email or phone is verified
- Database records are only created after email verification
- All user data is synchronized between Cognito and PostgreSQL
- Support for both email and SMS verification
- Proper error handling for various authentication states

## Database Models

### User Model
- **id**: Primary key, auto-increment
- **type**: ENUM (vendor, customer, admin)
- **aws_cognito_id**: Unique Cognito user ID
- **first_name**: User's first name
- **last_name**: User's last name
- **email**: Unique email address
- **phone**: Phone number
- **post_code**: Postal code
- **country**: Country
- **city**: City
- **is_verified**: Verification status
- **verified_at**: Verification timestamp
- **is_profile_updated**: Profile update status
- **is_profile_reverified**: Re-verification status
- **profile_reverified_at**: Re-verification timestamp
- **status**: ENUM (active, inactive, suspended, pending)
- **created_by**: Audit field
- **updated_by**: Audit field
- **created_at**: Creation timestamp
- **updated_at**: Update timestamp

### Vendor Profile Model
- **id**: Primary key, auto-increment
- **user_id**: Foreign key to User
- **business_type**: Type of business
- **business_name**: Business name
- **company_name**: Company name
- **contact_person**: Contact person
- **designation**: Job title
- **country**: Country
- **city**: City
- **website**: Website URL
- **business_registration_certificate**: Certificate file path
- **gst_number**: GST number
- **address**: Business address
- **company_details**: Company description
- **whatsapp_number**: WhatsApp contact
- **logo**: Logo file path
- **working_days**: Working days
- **employee_count**: Number of employees
- **payment_mode**: Payment methods
- **establishment**: Establishment year
- **created_by**: Audit field
- **updated_by**: Audit field
- **created_at**: Creation timestamp
- **updated_at**: Update timestamp

## API Endpoints

### Authentication
- `POST /auth/sign-up` - Register new user (passwordless)
- `POST /auth/send-verification-code` - Send verification code via email or SMS
- `POST /auth/verify-code` - Verify code and complete registration
- `POST /auth/sign-in` - Initiate passwordless sign in
- `POST /auth/complete-sign-in` - Complete sign in with verification code
- `POST /auth/resend-code` - Resend verification code

### Users
- `GET /users` - Get all users (paginated)
- `GET /users/:id` - Get user by ID
- `GET /users/search?q=query` - Search users
- `GET /users/vendors` - Get vendor users
- `GET /users/by-type/:type` - Get users by type
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/status` - Update user status
- `DELETE /users/:id` - Delete user

### Vendor Profiles
- `GET /vendor-profiles` - Get all vendor profiles (paginated)
- `GET /vendor-profiles/:id` - Get vendor profile by ID
- `GET /vendor-profiles/user/:userId` - Get vendor profile by user ID
- `GET /vendor-profiles/search?q=query` - Search vendor profiles
- `GET /vendor-profiles/by-business-type/:type` - Get profiles by business type
- `GET /vendor-profiles/by-country/:country` - Get profiles by country
- `POST /vendor-profiles` - Create new vendor profile
- `PATCH /vendor-profiles/:id` - Update vendor profile
- `PATCH /vendor-profiles/:id/files` - Upload files (logo, certificate)
- `DELETE /vendor-profiles/:id` - Delete vendor profile

## Database Commands

```bash
# Create migration
npm run migration:create -- --name create-table-name

# Run migrations
npm run migration:up

# Rollback migration
npm run migration:down

# Create seeder
npm run seed:create -- --name seed-name

# Run seeders
npm run seed:up

# Rollback seeders
npm run seed:down
```

## AWS Cognito Setup

1. **Create User Pool**
   - Go to AWS Cognito Console
   - Create new User Pool
   - Configure sign-in options (email)
   - Set password policy
   - Enable MFA if needed

2. **Create App Client**
   - Add app client to User Pool
   - Configure authentication flows
   - Set callback URLs
   - Note Client ID and Client Secret

3. **Update Environment Variables**
   - Update `.env` with Cognito configuration
   - Set AWS credentials

## Testing

### Example API Requests

**Sign Up**
```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "vendor@example.com",
    "phone": "+1234567890",
    "userType": "vendor"
  }'
```

**Send Verification Code**
```bash
curl -X POST http://localhost:3000/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "vendor@example.com",
    "verificationMethod": "email"
  }'
```

**Verify Code and Complete Registration**
```bash
curl -X POST http://localhost:3000/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "vendor@example.com",
    "verificationCode": "123456",
    "verificationMethod": "email"
  }'
```

**Passwordless Sign In**
```bash
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "vendor@example.com",
    "verificationMethod": "email"
  }'
```

**Complete Sign In**
```bash
curl -X POST http://localhost:3000/auth/complete-sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "vendor@example.com",
    "code": "123456",
    "session": "SESSION_TOKEN_FROM_SIGN_IN_RESPONSE"
  }'
```

**Create Vendor Profile**
```bash
curl -X POST http://localhost:3000/vendor-profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "user_id": 1,
    "business_type": "Technology",
    "business_name": "Tech Solutions Inc.",
    "company_name": "Tech Solutions LLC",
    "contact_person": "John Doe",
    "designation": "CEO",
    "country": "United States",
    "city": "New York",
    "website": "https://techsolutions.com",
    "employee_count": 50,
    "establishment": 2020
  }'
```

## Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **API Documentation**: Available at runtime

## Security Features

- **AWS Cognito Integration**: Secure user authentication
- **JWT Token Validation**: Stateless authentication
- **Input Validation**: Class-validator for request validation
- **SQL Injection Protection**: Sequelize ORM prevents SQL injection
- **CORS Configuration**: Configurable CORS settings
- **Environment Variables**: Sensitive data in environment variables

## Error Handling

The application includes comprehensive error handling:

- **Global Exception Filter**: Handles all uncaught exceptions
- **Sequelize Exception Filter**: Handles database-specific errors
- **Validation Errors**: Detailed validation error messages
- **HTTP Status Codes**: Appropriate status codes for different scenarios

## Production Considerations

1. **Environment Variables**: Secure all sensitive configuration
2. **Database Connection**: Use connection pooling
3. **Logging**: Implement comprehensive logging
4. **Monitoring**: Add health checks and monitoring
5. **Rate Limiting**: Implement API rate limiting
6. **Security Headers**: Add security headers
7. **SSL/TLS**: Enable HTTPS in production

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License.
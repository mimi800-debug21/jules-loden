# Jules Loden

A modern e-commerce ordering system built with Next.js and Turso SQLite.

## Features

- Client-facing ordering interface with categorized products
- Admin dashboard for managing products, categories and orders
- Jules Pay payment simulation
- Secure authentication for admin access
- Responsive design

## Tech Stack

- Next.js 14
- React 18
- Turso SQLite (LibSQL)
- NextAuth.js for authentication
- Tailwind CSS for styling

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (for demo purposes)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/jules-loden&env=NEXTAUTH_SECRET,TURSO_DATABASE_URL,TURSO_AUTH_TOKEN,ADMIN_USERNAME,ADMIN_PASSWORD&envDescription=Environment%20variables%20needed%20for%20deployment)

### Option 2: Manual Deployment

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com)
3. Create a new project and import your repository
4. Add the environment variables in the Vercel dashboard
5. Click "Deploy"

### Option 3: CLI Deployment

1. Install the Vercel CLI:
```bash
npm i -g vercel
```

2. Run the deployment command:
```bash
vercel --env NEXTAUTH_SECRET=your_secret,TURSO_DATABASE_URL=your_url,TURSO_AUTH_TOKEN=your_token,ADMIN_USERNAME=your_username,ADMIN_PASSWORD=your_password
```

## API Routes

- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/[id]` - Update a category
- `DELETE /api/categories/[id]` - Delete a category
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `PUT /api/orders/[id]` - Update an order status
- `DELETE /api/orders/[id]` - Delete an order

## Database Schema

See [SCHEMA.md](./SCHEMA.md) for detailed information about the database schema.

## Admin Access

To access the admin dashboard:
1. Go to the home page
2. Click "Admin Login"
3. Use the credentials configured in your environment variables

## License

This project is licensed under the MIT License.
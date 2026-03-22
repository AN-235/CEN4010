# Geek Text API - CEN4010 Team Project

RESTful API for an online bookstore supporting book browsing, user profiles, shopping cart, ratings, and wishlists.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **MySQL 8+** - [Download here](https://dev.mysql.com/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/AN-235/CEN4010
cd CEN4010

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and update DB_PASSWORD with your MySQL password

# 4. Create database
mysql -u root -p
CREATE DATABASE geektext;
exit;

# 5. Run database schema (if available)
mysql -u root -p geektext < database/schema.sql

# 6. Start the development server
npm run dev
```

### Verify Setup

Visit: **http://localhost:5000/api/health**

You should see:
```
{"status":"healthy","message":"Geek Text API is running"}
```

---

## 📁 Project Structure

```
CEN4010/
├── src/
│   ├── app.js              # Main application
│   ├── routes/             # API endpoints (6 features)
│   ├── services/           # Business logic
│   └── utils/              # Database connection & helpers
├── database/
│   └── schema.sql          # Database schema
├── tests/                  # Test files
├── docs/                   # Documentation
├── package.json            # Dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

---

## 🎯 Features

Each team member is responsible for ONE feature:

1. **Book Browsing and Sorting** - `src/routes/books.js`
2. **Profile Management** - `src/routes/users.js`
3. **Shopping Cart** - `src/routes/cart.js`
4. **Book Details (Admin)** - `src/routes/bookDetails.js`
5. **Ratings and Comments** - `src/routes/ratings.js`
6. **Wishlist Management** - `src/routes/wishlists.js`

---

## 🔧 Environment Configuration

Edit your `.env` file:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=geektext
```

⚠️ **IMPORTANT**: Never commit `.env` to GitHub! Only commit `.env.example`

---

## 💻 Development Commands

```bash
# Start development server (auto-restart on changes)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Books (Feature 1)
```
GET  /api/books/genre/:genre
GET  /api/books/top-sellers
GET  /api/books/rating/:rating
PUT  /api/books/discount
```

### Users (Feature 2)
```
POST /api/users
GET  /api/users/:username
PUT  /api/users/:username
POST /api/users/:username/credit-cards
```

### Cart (Feature 3)
```
GET    /api/cart/:userId
GET    /api/cart/:userId/subtotal
POST   /api/cart
DELETE /api/cart/:userId/book/:bookId
```

### Admin - Books & Authors (Feature 4)
```
POST /api/admin/books
GET  /api/admin/books/:isbn
POST /api/admin/authors
GET  /api/admin/authors/:authorId/books
```

### Ratings (Feature 5)
```
POST /api/ratings
POST /api/ratings/comments
GET  /api/ratings/books/:bookId/comments
GET  /api/ratings/books/:bookId/average
```

### Wishlists (Feature 6)
```
POST   /api/wishlists
POST   /api/wishlists/:wishlistId/books
DELETE /api/wishlists/:wishlistId/books/:bookId
GET    /api/wishlists/:wishlistId/books
```

---

## 🧪 Testing Your Endpoints

### Using curl
```bash
# Health check
curl http://localhost:5000/api/health

# Get books by genre
curl http://localhost:5000/api/books/genre/Fiction

# Create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"pass123"}'
```

### Using Browser
Simply visit: `http://localhost:5000/api/health`

### Using Postman or Thunder Client
1. Install Thunder Client (VS Code extension)
2. Create new request
3. Set method and URL
4. Click "Send"

---

## 👥 Team Workflow

### Starting Work
```bash
# 1. Pull latest changes
git pull origin main

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Make changes to YOUR feature file
# Edit: src/routes/yourFeature.js

# 4. Test your changes
npm run dev
curl http://localhost:5000/api/your-endpoint

# 5. Commit and push
git add .
git commit -m "Add: description of changes"
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
```

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/feature-name` - Individual features

---

## 🚨 Common Issues

### "npm: command not found"
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### "mysql: command not found"
**Solution**: Install MySQL from [dev.mysql.com](https://dev.mysql.com/downloads/)

### "Database connection failed"
**Solution**: 
- Check MySQL is running
- Verify credentials in `.env`
- Ensure database `geektext` exists

### "Port 5000 already in use"
**Solution**: 
```bash
# Change PORT in .env to 3000
PORT=3000
```

---

## 📚 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL 8
- **Authentication**: JWT (if implemented)
- **Testing**: Jest + Supertest
- **Development**: Nodemon (auto-restart)

---

## 📝 Contributing

1. Each team member owns ONE feature
2. Work in your own branch: `feature/your-name`
3. Test your code before committing
4. Create Pull Request when ready
5. Request code review from team member
6. Merge after approval

---

## 🎓 Sprint Schedule

- **Sprint 1**: 1/19 - 2/1
- **Sprint 2**: 2/2 - 2/15
- **Sprint 3**: 2/16 - 3/8
- **Sprint 4**: 3/9 - 3/22
- **Sprint 5**: 3/23 - 4/5

**Final Demo**: 4/6

---

## 📖 Documentation

- **API Reference**: `/docs/API_REFERENCE.md`
- **Testing Guide**: `/docs/TESTING_GUIDE.md`
- **Scrum Docs**: `/docs/scrum/`
- **UML Diagrams**: `/docs/uml/` (Due 3/15)

---

## 🆘 Need Help?

- **GitHub Issues**: Report bugs or ask questions
- **Team Discord/Slack**: Daily communication
- **Instructor**: Office hours for project questions

---

## 📜 License

MIT License - CEN4010 Spring 2025

---

## 👨‍💻 Team Members

1. [Name] - Feature 1: Book Browsing
2. [Name] - Feature 2: Profile Management
3. [Name] - Feature 3: Shopping Cart
4. [Name] - Feature 4: Book Details
5. [Name] - Feature 5: Ratings & Comments
6. [Name] - Feature 6: Wishlist Management

---

**Last Updated**: February 2025

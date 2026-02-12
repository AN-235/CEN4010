# CEN4010
Team Project

# Clone the repository
git clone <https://github.com/AN-235/CEN4010>

cd CEN4010

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Geek Text API - Environment Configuration
# Copy this file to .env and fill in your actual values
# DO NOT commit .env to GitHub!

# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="EXAMPLE PASSWORD REPLACE WITH ACTUAL MySQL PASSWORD"
DB_NAME=geektext

# IMPORTANT: Replace 'your_mysql_password_here' with your actual MySQL password
# Example: DB_PASSWORD=mypassword123


# Edit .env with your MySQL credentials

# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start

# Test
curl http://localhost:5000/api/health

Working Server Example:

╔════════════════════════════════════════════════╗
║                                                ║
║         Geek Text API Server Running          ║
║                                                ║
╚════════════════════════════════════════════════╝

  Environment: development
  Port:        5000
  URL:         http://localhost:5000
  Health:      http://localhost:5000/api/health
# CEN4010
Team Project

# Clone the repository
git clone <https://github.com/AN-235/CEN4010>

cd CEN4010

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Create database
mysql -u root -p
CREATE DATABASE geektext;
exit;

# Run schema
mysql -u root -p geektext < database/schema.sql
mysql -u root -p geektext < database/migrations/seed_data.sql

# Start development server
npm run dev

# Test
curl http://localhost:5000/api/health
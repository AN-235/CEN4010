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
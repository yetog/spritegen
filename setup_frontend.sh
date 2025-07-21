#!/bin/bash

# --- Configuration ---
# Set the directory where your sprite-maker project is located.
# IMPORTANT: Update this path if your project is in a different location.
PROJECT_DIR="/Users/Zay/Downloads/sprite-maker"
FRONTEND_DIR="$PROJECT_DIR" # Assuming your package.json for the frontend is directly in sprite-maker
                            # If it's in a subfolder like 'frontend', change this to "$PROJECT_DIR/frontend"

# --- Script Start ---
echo "🚀 Starting frontend setup for SpriteForge UI..."

# 1. Navigate to the frontend directory
echo "Navigating to: $FRONTEND_DIR"
cd "$FRONTEND_DIR" || { echo "Error: Could not change to frontend directory. Is '$FRONTEND_DIR' correct?"; exit 1; }

# 2. Check for Node.js and npm
# Node.js is required for npm and running JavaScript outside the browser.
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js (recommended via Homebrew: brew install node)."
    exit 1
fi

# npm comes with Node.js, so if node is there, npm usually is too.
if ! command -v npm &> /dev/null; then
    echo "Error: npm (Node Package Manager) not found."
    echo "Please ensure Node.js is properly installed, as npm usually comes with it."
    exit 1
fi
echo "Node.js and npm are installed."

# 3. Install frontend dependencies
# This is the crucial step that was likely missed when you got the 'vite' not found error.
# It reads package.json and installs all required modules into node_modules.
echo "Installing frontend dependencies (npm install)..."
npm install || { echo "Error: Failed to install frontend dependencies. Please check the error messages above."; exit 1; }
echo "Frontend dependencies installed successfully."

# 4. (Optional but Recommended) Update Browserslist database
# This addresses the 'Browserslist: caniuse-lite is outdated' warning.
echo "Updating Browserslist database..."
npx update-browserslist-db@latest || echo "Warning: Failed to update Browserslist database. This might cause warnings but not prevent the app from running."

# 5. Check for .env file (if your frontend uses environment variables)
# If your frontend project uses environment variables (e.g., to connect to your backend API),
# it will likely use a .env file.
echo "--- Environment Variables (.env file) ---"
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo "Warning: .env file not found in '$FRONTEND_DIR'."
    echo "If your frontend requires environment variables (e.g., for backend API URL), please create one."
    echo "Example: VITE_BACKEND_URL=http://localhost:5000" # Note: Vite env vars often start with VITE_
else
    echo ".env file found. Ensure your frontend configurations are correct."
fi
echo ""

# 6. Run the frontend development server
# This command is specified in your package.json scripts (e.g., "dev": "vite").
echo "Attempting to start the frontend development server..."
echo "This usually opens in your browser at http://localhost:5173/ or similar."
echo "Press CTRL+C to stop the server."
npm run dev

# The script execution will pause here until you press CTRL+C to stop the dev server.
# Any lines after `npm run dev` won't be executed unless `npm run dev` exits.

echo "Frontend setup complete (server stopped)."
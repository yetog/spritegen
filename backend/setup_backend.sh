#!/bin/bash

# --- Configuration ---
# Set the directory where your sprite-maker project is located.
# IMPORTANT: Update this path if your project is in a different location.
PROJECT_DIR="/Users/Zay/Downloads/sprite-maker"
BACKEND_DIR="$PROJECT_DIR/backend"

# Name of your Python virtual environment
VENV_NAME="venv"

# --- Script Start ---
echo "🚀 Starting backend setup for SpriteForge..."

# 1. Navigate to the backend directory
echo "Navigating to: $BACKEND_DIR"
cd "$BACKEND_DIR" || { echo "Error: Could not change to backend directory. Is '$BACKEND_DIR' correct?"; exit 1; }

# 2. Check for Python 3
if ! command -v python3 &> /dev/null
then
    echo "Error: Python 3 is not installed. Please install Python 3 (e.g., via Homebrew: brew install python)."
    exit 1
fi

# 3. Create a virtual environment if it doesn't exist
if [ ! -d "$VENV_NAME" ]; then
    echo "Creating virtual environment: $VENV_NAME"
    python3 -m venv "$VENV_NAME"
else
    echo "Virtual environment '$VENV_NAME' already exists."
fi

# 4. Activate the virtual environment
echo "Activating virtual environment..."
source "$VENV_NAME/bin/activate" || { echo "Error: Could not activate virtual environment."; exit 1; }
echo "Virtual environment activated."

# 5. Install Python dependencies
echo "Installing Python dependencies from requirements.txt..."
pip install -r requirements.txt || { echo "Error: Failed to install Python dependencies."; deactivate; exit 1; }
echo "Python dependencies installed successfully."

# 6. Check for MongoDB (Important!)
echo ""
echo "--- MongoDB Status ---"
echo "It looks like your MongoDB connection is failing. Please ensure MongoDB is running."
echo "If you don't have MongoDB installed, you can install it via Homebrew:"
echo "  brew tap mongodb/brew"
echo "  brew install mongodb-community@6.0" # or a recent stable version
echo "Then start it with:"
echo "  brew services start mongodb-community@6.0"
echo "Or, if you use Docker, you can run it with:"
echo "  docker run --name mongo-dev -p 27017:27017 -d mongo"
echo ""

# 7. Check for .env file (for API keys and other configurations)
echo "--- Environment Variables (.env file) ---"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "Warning: .env file not found in '$BACKEND_DIR'."
    echo "You need to create a '.env' file to configure your API keys (e.g., IONOS API)."
    echo "Example .env content:"
    echo "  MONGODB_URI=mongodb://localhost:27017/"
    echo "  IONOS_API_KEY=your_ionos_api_key_here"
    echo "  # Possibly update the IONOS_BASE_URL if the model changed"
else
    echo ".env file found. Please ensure your IONOS API key and other configurations are correct."
    echo "Specifically, review the 'model' you are using for image generation as 'black-forest-labs/flux-1-schnell' was not found."
    echo "You might need to update the model name or the base URL in your .env or app.py."
fi
echo ""

# 8. Run the Flask application
echo "Attempting to start the Flask backend..."
echo "Press CTRL+C to stop the server."
python3 app.py

# 9. Deactivate virtual environment (this line might not be reached if app.py runs indefinitely)
echo "Deactivating virtual environment..."
deactivate
echo "Setup complete."
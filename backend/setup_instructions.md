# SpriteForge Setup Instructions

## 🔧 Required Configuration

### 1. IONOS AI Model Hub Setup

You need to configure your IONOS credentials in `backend/config.py`:

```python
IONOS_CONFIG = {
    "API_KEY": "your_actual_ionos_api_key_here",
    "CHAT_MODEL_ID": "meta-llama/llama-3.1-8b-instruct",  # Your chat model
    "IMAGE_MODEL_ID": "black-forest-labs/flux-1-schnell",  # Your image model
}
```

**To get your IONOS credentials:**
1. Go to [IONOS AI Model Hub](https://ai.ionos.com/)
2. Create an account or log in
3. Navigate to API Keys section
4. Copy your API key
5. Note your available model IDs

### 2. MongoDB Setup

Choose one option:

#### Option A: Local MongoDB
```bash
# Install MongoDB locally
# macOS:
brew install mongodb-community
brew services start mongodb-community

# Ubuntu:
sudo apt install mongodb
sudo systemctl start mongodb
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create a cluster
4. Get connection string
5. Update `config.py`:

```python
MONGODB_CONFIG = {
    "URI": "mongodb+srv://username:password@cluster.mongodb.net/spriteforge"
}
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the Application

```bash
# Backend
cd backend
python app.py

# Frontend (in another terminal)
npm run dev
```

## 🧪 Testing the Setup

1. Visit the health check endpoint: `http://localhost:5000/health`
2. Should return:
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "ionos_configured": true,
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

## 🚨 Common Issues

### MongoDB Connection Failed
- Make sure MongoDB is running locally
- Check connection string for Atlas
- Verify network access for Atlas

### IONOS API Errors
- Verify API key is correct
- Check model IDs are available in your account
- Ensure you have credits/quota

### CORS Issues
- Backend should be running on port 5000
- Frontend should be running on port 5173
- Check firewall settings

## 📝 Next Steps

Once everything is configured:
1. Generate your first sprite
2. Upload training reference images
3. Use MCP tools for enhanced generation
4. Rate sprites to improve the system
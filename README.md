# SpriteForge - AI-Powered Sprite Generation with MCP Integration

A sophisticated sprite generation platform that combines IONOS AI Model Hub with MongoDB persistence, training data management, and MCP (Model Context Protocol) integration for enhanced AI capabilities.

## 🚀 Features

### Core Functionality
- **AI Sprite Generation**: Generate high-quality character sprites using IONOS AI models
- **Persistent Storage**: MongoDB-based storage for sprites, ratings, and training data
- **Rating System**: 5-star rating system with feedback for continuous improvement
- **Training Data Management**: Upload reference sprites to improve generation quality

### Advanced Features
- **MCP Integration**: Model Context Protocol tools for enhanced AI interactions
- **Smart Prompt Enhancement**: Automatic prompt improvement using training data
- **Style Recommendations**: AI-powered style suggestions based on successful generations
- **Quality Analysis**: Automated sprite quality assessment and improvement suggestions

## 🛠️ Technology Stack

### Backend
- **Flask**: Python web framework
- **MongoDB**: Document database with PyMongo
- **IONOS AI Hub**: AI model integration for chat and image generation
- **PIL/Pillow**: Image processing capabilities

### Frontend
- **React + TypeScript**: Modern UI framework
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons

## 📋 Prerequisites

### Required Services
1. **IONOS AI Model Hub Account**
   - API key
   - Chat model ID
   - Image generation model ID

2. **MongoDB Database**
   - Local MongoDB installation OR
   - MongoDB Atlas cloud account

### Development Environment
- Node.js 16+
- Python 3.8+
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd spriteforge

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `backend/.env` file with your credentials:

```env
# IONOS AI Model Hub
IONOS_API_KEY=your_ionos_api_key_here
IONOS_CHAT_MODEL_ID=your_chat_model_id
IONOS_IMAGE_MODEL_ID=your_image_model_id

# MongoDB
MONGODB_URI=mongodb://localhost:27017/spriteforge
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/spriteforge
```

### 3. Database Setup

**Local MongoDB:**
```bash
# Install MongoDB locally
# macOS with Homebrew:
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Create database (automatic on first connection)
```

**MongoDB Atlas (Cloud):**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `.env`

### 4. Start the Application

```bash
# Terminal 1: Start backend
cd backend
python app.py

# Terminal 2: Start frontend
npm run dev
```

## 🎯 Usage Guide

### Basic Sprite Generation
1. Navigate to the **Generate** tab
2. Enter character details (name, pose, style)
3. Click "Generate Sprite"
4. Rate the generated sprite (1-5 stars)

### Training Data Upload
1. Go to the **Training** tab
2. Upload reference sprite images
3. Add descriptive tags and metadata
4. Submit to improve future generations

### MCP AI Tools
1. Access the **MCP Tools** tab
2. Select from available AI tools:
   - **Generate Sprite**: Enhanced generation with training data
   - **Enhance Prompt**: Improve prompts using successful patterns
   - **Analyze Quality**: Get improvement suggestions
   - **Style Recommendations**: Get style suggestions for characters

### Gallery Management
1. View all generated sprites in the **Gallery**
2. Filter by character, rating, or creation date
3. Update ratings and add feedback
4. Delete unwanted sprites

## 🔌 API Endpoints

### Sprite Management
- `POST /sprites` - Save generated sprite
- `GET /sprites` - Fetch sprites with filtering
- `PUT /sprites/<id>` - Update sprite rating
- `DELETE /sprites/<id>` - Delete sprite

### Training Data
- `POST /training-data` - Upload training references
- `GET /training-data` - Fetch training data
- `DELETE /training-data/<id>` - Remove training data

### MCP Integration
- `GET /mcp/tools` - List available MCP tools
- `POST /mcp/execute` - Execute MCP tool

### AI Generation
- `POST /image` - Generate sprite image
- `POST /chat` - Enhanced chat with MCP

## 🧠 MCP Integration Details

The Model Context Protocol integration provides:

1. **Context-Aware Generation**: Uses training data to enhance prompts
2. **Quality Analysis**: Automated sprite quality assessment
3. **Style Learning**: Learns from successful generations
4. **Recommendation Engine**: Suggests improvements based on patterns

## 📊 Data Models

### Sprite Document
```javascript
{
  sprite_id: "unique_id",
  character: "Character name",
  pose: "idle/attacking/etc",
  style: "anime/pixel art/etc",
  image_base64: "base64_encoded_image",
  rating: 1-5,
  feedback: "Optional feedback",
  created_at: Date,
  updated_at: Date
}
```

### Training Data Document
```javascript
{
  character: "Character name",
  pose: "Pose description",
  style_tags: ["anime", "fantasy"],
  character_tags: ["warrior", "female"],
  image_base64: "reference_image",
  prompt: "Generation prompt",
  rating: 5,
  is_reference: true,
  uploaded_at: Date
}
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas for production
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Update API endpoints in `src/services/api.ts`
2. Build: `npm run build`
3. Deploy to Netlify, Vercel, or similar

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the API documentation
3. Ensure all environment variables are correctly set
4. Verify MongoDB connection

## 🔮 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced style transfer capabilities
- [ ] Batch sprite generation
- [ ] Custom model fine-tuning
- [ ] Export to game engines
- [ ] Animation generation
- [ ] Community sprite sharing
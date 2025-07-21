from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from datetime import datetime, UTC
from pymongo import MongoClient
from bson import ObjectId
import base64
from PIL import Image
import io
import numpy as np

# Import configuration and models
from config import IONOS_CONFIG, MONGODB_CONFIG, API_URLS, APP_CONFIG
from models.persona import PersonaSchema, PersonaPromptBuilder

# Configuration
IONOS_API_KEY = IONOS_CONFIG["API_KEY"]
IONOS_CHAT_MODEL_ID = IONOS_CONFIG["CHAT_MODEL_ID"]
IONOS_IMAGE_MODEL_ID = IONOS_CONFIG["IMAGE_MODEL_ID"]
MONGODB_URI = MONGODB_CONFIG["URI"]

# Updated API URLs based on IONOS documentation
CHAT_URL = f"{API_URLS['CHAT_BASE']}/v1/chat/completions"
IMAGE_URL = API_URLS["IMAGE_BASE"]

# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = APP_CONFIG["MAX_CONTENT_LENGTH"]

# MongoDB setup
try:
    client = MongoClient(MONGODB_URI)
    db = client.spriteforge
    sprites_collection = db.sprites
    training_data_collection = db.training_data
    models_collection = db.models
    personas_collection = db.personas  # New personas collection
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("💡 Make sure MongoDB is running or check your connection string")

# Helper to convert ObjectId to string for JSON serialization
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def serialize_persona_doc(doc):
    """Helper to serialize persona documents for JSON response"""
    if doc and '_id' in doc:
        return PersonaSchema.format_persona_for_frontend(doc)
    return doc

# 🔁 Helper for IONOS requests
def send_ionos_request(url, payload):
    headers = {
        "Authorization": f"Bearer {IONOS_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        print("🔻 Sending payload to:", url)
        print("📤 Payload:", payload)

        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print("✅ Raw response:", response.text)
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        print("❌ HTTP error:", http_err)
        print("📄 Response text:", response.text)
        return {"error": f"HTTP error: {http_err}", "details": response.text}
    except Exception as e:
        print("❌ General error:", e)
        return {"error": str(e)}

# 🔹 Health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify API is running"""
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        mongo_status = "connected"
    except:
        mongo_status = "disconnected"
    
    return jsonify({
        "status": "healthy",
        "mongodb": mongo_status,
        "ionos_configured": bool(IONOS_API_KEY and IONOS_API_KEY != "your_ionos_api_key_here"),
        "timestamp": datetime.now(UTC).isoformat()
    })

# 🔹 Chat endpoint with corrected IONOS API format
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    prompt = data.get("prompt", "")
    use_mcp = data.get("use_mcp", False)
    
    print("🧠 Chat prompt received:", prompt)

    # MCP-enhanced prompt processing
    if use_mcp:
        prompt = enhance_prompt_with_mcp(prompt)

    # Updated payload format based on IONOS documentation
    payload = {
        "model": IONOS_CHAT_MODEL_ID,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_completion_tokens": 300
    }

    result = send_ionos_request(CHAT_URL, payload)
    print("📦 Chat result:", result)

    # Updated response parsing based on IONOS documentation
    if "choices" in result and len(result["choices"]) > 0:
        return jsonify({"output": result["choices"][0]["message"]["content"]})
    elif "error" in result:
        return jsonify(result), 500
    else:
        return jsonify({"output": "❌ No output received."}), 500

def enhance_prompt_with_mcp(prompt):
    """MCP-style prompt enhancement using training data"""
    try:
        # Get similar training examples
        training_examples = list(training_data_collection.find().limit(5))
        
        if training_examples:
            context = "Based on successful sprite generations:\n"
            for example in training_examples:
                if example.get('rating', 0) >= 4:
                    context += f"- {example.get('prompt', '')}\n"
            
            enhanced_prompt = f"{context}\nNow generate: {prompt}"
            return enhanced_prompt
    except Exception as e:
        print(f"❌ MCP enhancement failed: {e}")
    
    return prompt

# 🔹 Image generation endpoint
@app.route("/image", methods=["POST"])
def generate_image():
    data = request.get_json()
    prompt = data.get("prompt", "")
    use_training_data = data.get("use_training_data", False)
    persona_id = data.get("persona_id")  # New persona support
    
    print("🖼️ Image prompt received:", prompt)
    print("🎭 Persona ID:", persona_id)

    # Enhance prompt with persona if provided
    if persona_id:
        try:
            persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
            if persona:
                # Extract user parameters from request
                character = data.get("character", "")
                pose = data.get("pose", "")
                style = data.get("style", "")
                
                # Build enhanced prompt using persona
                prompt = PersonaPromptBuilder.build_enhanced_prompt(
                    prompt, persona, character, pose, style
                )
                print("🎭 Enhanced prompt with persona:", prompt)
                
                # Update persona usage count
                personas_collection.update_one(
                    {"_id": ObjectId(persona_id)},
                    {"$inc": {"usage_count": 1}}
                )
            else:
                print(f"⚠️ Persona {persona_id} not found")
        except Exception as e:
            print(f"❌ Error applying persona: {e}")

    # Enhance prompt with training data if requested
    if use_training_data:
        prompt = enhance_image_prompt_with_training(prompt)

    payload = {
        "model": IONOS_IMAGE_MODEL_ID,
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json"
    }

    result = send_ionos_request(IMAGE_URL, payload)
    print("📦 Image result:", result)

    if "data" in result and result["data"]:
        return jsonify({"image_base64": result["data"][0]["b64_json"]})
    elif "error" in result:
        return jsonify(result), 500
    else:
        return jsonify({"error": "No image data received"}), 500

def enhance_image_prompt_with_training(prompt):
    """Enhance image prompt using training data patterns"""
    try:
        # Find similar successful prompts
        high_rated = list(training_data_collection.find(
            {"rating": {"$gte": 4}},
            {"prompt": 1, "style_tags": 1, "character_tags": 1}
        ).limit(3))
        
        if high_rated:
            # Extract common successful patterns
            style_patterns = []
            for item in high_rated:
                if item.get('style_tags'):
                    style_patterns.extend(item['style_tags'])
            
            if style_patterns:
                common_styles = list(set(style_patterns))[:3]
                enhanced_prompt = f"{prompt}, {', '.join(common_styles)}, high quality sprite art"
                return enhanced_prompt
    except Exception as e:
        print(f"❌ Training data enhancement failed: {e}")
    
    return prompt

# 🔹 Persona management endpoints

@app.route("/personas", methods=["POST"])
def create_persona():
    """Create a new persona"""
    try:
        data = request.get_json()
        
        # Validate input data
        is_valid, error_message = PersonaSchema.validate_persona_data(data)
        if not is_valid:
            return jsonify({"error": error_message}), 400
        
        # Check for duplicate names
        existing = personas_collection.find_one({"name": data['name'].strip()})
        if existing:
            return jsonify({"error": "A persona with this name already exists"}), 409
        
        # Create persona document
        persona_doc = PersonaSchema.create_persona_document(
            name=data['name'],
            description=data['description'],
            reference_image_base64=data.get('reference_image_base64'),
            style_tags=data.get('style_tags', []),
            character_tags=data.get('character_tags', []),
            example_prompts=data.get('example_prompts', []),
            is_active=data.get('is_active', True)
        )
        
        result = personas_collection.insert_one(persona_doc)
        
        print(f"✅ Persona created: {data['name']}")
        return jsonify({
            "message": "Persona created successfully",
            "id": str(result.inserted_id),
            "name": data['name']
        }), 201
        
    except Exception as e:
        print(f"❌ Error creating persona: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas", methods=["GET"])
def get_personas():
    """Fetch all personas with optional filtering"""
    try:
        # Get query parameters
        active_only = request.args.get('active_only', 'false').lower() == 'true'
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'DESC')
        
        # Build query
        query = {}
        if active_only:
            query['is_active'] = True
        
        # Build sort
        sort_direction = -1 if sort_order == 'DESC' else 1
        valid_sort_fields = ['created_at', 'updated_at', 'name', 'usage_count', 'average_rating']
        sort_field = sort_by if sort_by in valid_sort_fields else 'created_at'
        
        personas = list(personas_collection.find(query).sort(sort_field, sort_direction))
        
        # Format for frontend
        formatted_personas = [serialize_persona_doc(persona) for persona in personas]
        
        print(f"✅ Retrieved {len(formatted_personas)} personas")
        return jsonify({"personas": formatted_personas}), 200
        
    except Exception as e:
        print(f"❌ Error fetching personas: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas/<persona_id>", methods=["GET"])
def get_persona(persona_id):
    """Get a specific persona by ID"""
    try:
        persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
        
        if not persona:
            return jsonify({"error": "Persona not found"}), 404
        
        formatted_persona = serialize_persona_doc(persona)
        return jsonify({"persona": formatted_persona}), 200
        
    except Exception as e:
        print(f"❌ Error fetching persona: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas/<persona_id>", methods=["PUT"])
def update_persona(persona_id):
    """Update an existing persona"""
    try:
        data = request.get_json()
        
        # Validate input data
        is_valid, error_message = PersonaSchema.validate_persona_data(data)
        if not is_valid:
            return jsonify({"error": error_message}), 400
        
        # Check if persona exists
        existing = personas_collection.find_one({"_id": ObjectId(persona_id)})
        if not existing:
            return jsonify({"error": "Persona not found"}), 404
        
        # Check for duplicate names (excluding current persona)
        name_check = personas_collection.find_one({
            "name": data['name'].strip(),
            "_id": {"$ne": ObjectId(persona_id)}
        })
        if name_check:
            return jsonify({"error": "A persona with this name already exists"}), 409
        
        # Prepare update data
        update_data = {
            "name": data['name'].strip(),
            "description": data['description'].strip(),
            "style_tags": data.get('style_tags', []),
            "character_tags": data.get('character_tags', []),
            "example_prompts": data.get('example_prompts', []),
            "is_active": data.get('is_active', True),
            "updated_at": datetime.now(UTC)
        }
        
        # Only update reference image if provided
        if 'reference_image_base64' in data:
            update_data['reference_image_base64'] = data['reference_image_base64']
        
        result = personas_collection.update_one(
            {"_id": ObjectId(persona_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Persona not found"}), 404
        
        print(f"✅ Persona {persona_id} updated")
        return jsonify({"message": "Persona updated successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error updating persona: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas/<persona_id>", methods=["DELETE"])
def delete_persona(persona_id):
    """Delete a persona"""
    try:
        result = personas_collection.delete_one({"_id": ObjectId(persona_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Persona not found"}), 404
        
        print(f"✅ Persona {persona_id} deleted")
        return jsonify({"message": "Persona deleted successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error deleting persona: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas/<persona_id>/toggle", methods=["PUT"])
def toggle_persona_status(persona_id):
    """Toggle persona active/inactive status"""
    try:
        persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
        if not persona:
            return jsonify({"error": "Persona not found"}), 404
        
        new_status = not persona.get('is_active', True)
        
        result = personas_collection.update_one(
            {"_id": ObjectId(persona_id)},
            {
                "$set": {
                    "is_active": new_status,
                    "updated_at": datetime.now(UTC)
                }
            }
        )
        
        status_text = "activated" if new_status else "deactivated"
        print(f"✅ Persona {persona_id} {status_text}")
        return jsonify({
            "message": f"Persona {status_text} successfully",
            "is_active": new_status
        }), 200
        
    except Exception as e:
        print(f"❌ Error toggling persona status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/personas/stats", methods=["GET"])
def get_persona_stats():
    """Get statistics about personas"""
    try:
        total = personas_collection.count_documents({})
        active = personas_collection.count_documents({"is_active": True})
        
        # Most used persona
        most_used = list(personas_collection.find(
            {"usage_count": {"$gt": 0}},
            {"name": 1, "usage_count": 1}
        ).sort("usage_count", -1).limit(1))
        
        # Average usage
        pipeline = [
            {"$group": {"_id": None, "avg_usage": {"$avg": "$usage_count"}}}
        ]
        avg_result = list(personas_collection.aggregate(pipeline))
        avg_usage = round(avg_result[0]["avg_usage"], 2) if avg_result else 0
        
        stats = {
            'total': total,
            'active': active,
            'inactive': total - active,
            'most_used': most_used[0] if most_used else None,
            'average_usage': avg_usage
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"❌ Error fetching persona stats: {e}")
        return jsonify({"error": str(e)}), 500

# 🔹 Sprite management endpoints (existing code continues...)

@app.route("/sprites", methods=["POST"])
def save_sprite():
    """Save a generated sprite to MongoDB"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['id', 'character', 'image_base64']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        sprite_doc = {
            "sprite_id": data['id'],
            "character": data['character'],
            "pose": data.get('pose', ''),
            "style": data.get('style', ''),
            "image_base64": data['image_base64'],
            "rating": data.get('rating', 0),
            "feedback": data.get('feedback', ''),
            "persona_id": data.get('persona_id'),  # New field for persona association
            "created_at": datetime.now(UTC),
            "updated_at": None
        }
        
        result = sprites_collection.insert_one(sprite_doc)
        
        # Update persona average rating if applicable
        if data.get('persona_id') and data.get('rating', 0) > 0:
            update_persona_rating(data['persona_id'], data['rating'])
        
        print(f"✅ Sprite saved: {data['id']}")
        return jsonify({"message": "Sprite saved successfully", "id": str(result.inserted_id)}), 201
        
    except Exception as e:
        print(f"❌ Error saving sprite: {e}")
        return jsonify({"error": str(e)}), 500

def update_persona_rating(persona_id, new_rating):
    """Update persona's average rating based on sprite ratings"""
    try:
        # Get all sprites for this persona
        sprites = list(sprites_collection.find(
            {"persona_id": persona_id, "rating": {"$gt": 0}},
            {"rating": 1}
        ))
        
        if sprites:
            ratings = [sprite['rating'] for sprite in sprites]
            avg_rating = sum(ratings) / len(ratings)
            
            personas_collection.update_one(
                {"_id": ObjectId(persona_id)},
                {"$set": {"average_rating": round(avg_rating, 2)}}
            )
    except Exception as e:
        print(f"❌ Error updating persona rating: {e}")

@app.route("/sprites", methods=["GET"])
def get_sprites():
    """Fetch all sprites from MongoDB with optional filtering"""
    try:
        # Get query parameters for filtering
        character = request.args.get('character')
        rating = request.args.get('rating')
        persona_id = request.args.get('persona_id')  # New filter
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'DESC')
        
        # Build query with filters
        query = {}
        
        if character:
            query['character'] = {"$regex": character, "$options": "i"}
        
        if rating:
            query['rating'] = int(rating)
            
        if persona_id:
            query['persona_id'] = persona_id
        
        # Build sort
        sort_direction = -1 if sort_order == 'DESC' else 1
        sort_field = sort_by if sort_by in ['created_at', 'updated_at', 'rating', 'character'] else 'created_at'
        
        sprites = list(sprites_collection.find(query).sort(sort_field, sort_direction))
        
        # Convert to frontend format
        formatted_sprites = []
        for sprite in sprites:
            formatted_sprite = {
                'id': sprite['sprite_id'],
                'character': sprite['character'],
                'pose': sprite['pose'],
                'style': sprite['style'],
                'imageBase64': sprite['image_base64'],
                'rating': sprite['rating'],
                'feedback': sprite['feedback'],
                'personaId': sprite.get('persona_id'),  # New field
                'createdAt': sprite['created_at'].isoformat(),
                'updatedAt': sprite['updated_at'].isoformat() if sprite['updated_at'] else None
            }
            formatted_sprites.append(formatted_sprite)
        
        print(f"✅ Retrieved {len(formatted_sprites)} sprites")
        return jsonify({"sprites": formatted_sprites}), 200
        
    except Exception as e:
        print(f"❌ Error fetching sprites: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sprites/<sprite_id>", methods=["PUT"])
def update_sprite_rating(sprite_id):
    """Update a sprite's rating and feedback"""
    try:
        data = request.get_json()
        rating = data.get('rating')
        feedback = data.get('feedback')
        
        if rating is None:
            return jsonify({"error": "Rating is required"}), 400
        
        if not (1 <= rating <= 5):
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        # Get current sprite to check for persona
        current_sprite = sprites_collection.find_one({"sprite_id": sprite_id})
        
        result = sprites_collection.update_one(
            {"sprite_id": sprite_id},
            {
                "$set": {
                    "rating": rating,
                    "feedback": feedback,
                    "updated_at": datetime.now(UTC)
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Sprite not found"}), 404
        
        # Update persona rating if applicable
        if current_sprite and current_sprite.get('persona_id'):
            update_persona_rating(current_sprite['persona_id'], rating)
        
        print(f"✅ Sprite {sprite_id} rating updated to {rating}")
        return jsonify({"message": "Sprite rating updated successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error updating sprite rating: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sprites/<sprite_id>", methods=["DELETE"])
def delete_sprite(sprite_id):
    """Delete a sprite from MongoDB"""
    try:
        result = sprites_collection.delete_one({"sprite_id": sprite_id})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Sprite not found"}), 404
        
        print(f"✅ Sprite {sprite_id} deleted")
        return jsonify({"message": "Sprite deleted successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error deleting sprite: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/sprites/stats", methods=["GET"])
def get_sprite_stats():
    """Get statistics about stored sprites"""
    try:
        total = sprites_collection.count_documents({})
        rated = sprites_collection.count_documents({"rating": {"$gt": 0}})
        
        # Unique characters
        characters = len(sprites_collection.distinct("character"))
        
        # Average rating
        pipeline = [
            {"$match": {"rating": {"$gt": 0}}},
            {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
        ]
        avg_result = list(sprites_collection.aggregate(pipeline))
        avg_rating = round(avg_result[0]["avg_rating"], 2) if avg_result else 0
        
        stats = {
            'total': total,
            'rated': rated,
            'characters': characters,
            'average_rating': avg_rating
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f"❌ Error fetching stats: {e}")
        return jsonify({"error": str(e)}), 500

# 🔹 Training Data Management (existing code continues...)

@app.route("/training-data", methods=["POST"])
def upload_training_data():
    """Upload reference sprites for training"""
    try:
        data = request.get_json()
        
        required_fields = ['character', 'image_base64', 'style_tags']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        training_doc = {
            "character": data['character'],
            "pose": data.get('pose', ''),
            "style_tags": data['style_tags'],  # Array of style descriptors
            "character_tags": data.get('character_tags', []),
            "image_base64": data['image_base64'],
            "prompt": data.get('prompt', ''),
            "rating": data.get('rating', 5),  # Reference images are high quality
            "is_reference": True,
            "uploaded_at": datetime.now(UTC)
        }
        
        result = training_data_collection.insert_one(training_doc)
        
        print(f"✅ Training data uploaded: {data['character']}")
        return jsonify({"message": "Training data uploaded successfully", "id": str(result.inserted_id)}), 201
        
    except Exception as e:
        print(f"❌ Error uploading training data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/training-data", methods=["GET"])
def get_training_data():
    """Get all training data"""
    try:
        training_data = list(training_data_collection.find().sort("uploaded_at", -1))
        
        formatted_data = []
        for item in training_data:
            formatted_item = {
                'id': str(item['_id']),
                'character': item['character'],
                'pose': item.get('pose', ''),
                'styleTags': item['style_tags'],
                'characterTags': item.get('character_tags', []),
                'imageBase64': item['image_base64'],
                'prompt': item.get('prompt', ''),
                'rating': item['rating'],
                'isReference': item.get('is_reference', False),
                'uploadedAt': item['uploaded_at'].isoformat()
            }
            formatted_data.append(formatted_item)
        
        return jsonify({"training_data": formatted_data}), 200
        
    except Exception as e:
        print(f"❌ Error fetching training data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/training-data/<data_id>", methods=["DELETE"])
def delete_training_data(data_id):
    """Delete training data"""
    try:
        result = training_data_collection.delete_one({"_id": ObjectId(data_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Training data not found"}), 404
        
        return jsonify({"message": "Training data deleted successfully"}), 200
        
    except Exception as e:
        print(f"❌ Error deleting training data: {e}")
        return jsonify({"error": str(e)}), 500

# 🔹 MCP Tool Registry (existing code continues...)

@app.route("/mcp/tools", methods=["GET"])
def get_mcp_tools():
    """Get available MCP tools"""
    tools = {
        "tools": [
            {
                "name": "generate_sprite",
                "description": "Generate a character sprite with specific parameters",
                "parameters": {
                    "character": {"type": "string", "required": True},
                    "pose": {"type": "string", "required": False},
                    "style": {"type": "string", "required": False},
                    "persona_id": {"type": "string", "required": False},  # New parameter
                    "use_training_data": {"type": "boolean", "required": False}
                }
            },
            {
                "name": "enhance_prompt",
                "description": "Enhance a sprite generation prompt using training data",
                "parameters": {
                    "prompt": {"type": "string", "required": True},
                    "persona_id": {"type": "string", "required": False}  # New parameter
                }
            },
            {
                "name": "analyze_sprite_quality",
                "description": "Analyze sprite quality and suggest improvements",
                "parameters": {
                    "sprite_id": {"type": "string", "required": True}
                }
            },
            {
                "name": "get_style_recommendations",
                "description": "Get style recommendations based on character type",
                "parameters": {
                    "character": {"type": "string", "required": True},
                    "persona_id": {"type": "string", "required": False}  # New parameter
                }
            }
        ]
    }
    return jsonify(tools)

@app.route("/mcp/execute", methods=["POST"])
def execute_mcp_tool():
    """Execute an MCP tool"""
    try:
        data = request.get_json()
        tool_name = data.get('tool_name')
        parameters = data.get('parameters', {})
        
        if tool_name == "generate_sprite":
            return mcp_generate_sprite(parameters)
        elif tool_name == "enhance_prompt":
            return mcp_enhance_prompt(parameters)
        elif tool_name == "analyze_sprite_quality":
            return mcp_analyze_sprite_quality(parameters)
        elif tool_name == "get_style_recommendations":
            return mcp_get_style_recommendations(parameters)
        else:
            return jsonify({"error": "Unknown tool"}), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def mcp_generate_sprite(params):
    """MCP tool: Generate sprite with enhanced prompting"""
    character = params.get('character')
    pose = params.get('pose', '')
    style = params.get('style', '')
    persona_id = params.get('persona_id')  # New parameter
    use_training = params.get('use_training_data', True)
    
    prompt = f"Generate a sprite of {character}"
    if pose:
        prompt += f" in {pose} pose"
    if style:
        prompt += f" with {style} style"
    
    # Apply persona if provided
    if persona_id:
        try:
            persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
            if persona:
                prompt = PersonaPromptBuilder.build_enhanced_prompt(
                    prompt, persona, character, pose, style
                )
        except Exception as e:
            print(f"❌ Error applying persona in MCP: {e}")
    
    if use_training:
        prompt = enhance_image_prompt_with_training(prompt)
    
    # Call image generation
    payload = {
        "model": IONOS_IMAGE_MODEL_ID,
        "prompt": prompt + ", high quality sprite art, game character design",
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json"
    }
    
    result = send_ionos_request(IMAGE_URL, payload)
    
    if "data" in result and result["data"]:
        return jsonify({
            "success": True,
            "image_base64": result["data"][0]["b64_json"],
            "enhanced_prompt": prompt
        })
    else:
        return jsonify({"success": False, "error": "Generation failed"}), 500

def mcp_enhance_prompt(params):
    """MCP tool: Enhance prompt using training data and persona"""
    prompt = params.get('prompt')
    persona_id = params.get('persona_id')
    
    enhanced = prompt
    
    # Apply persona enhancement if provided
    if persona_id:
        try:
            persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
            if persona:
                enhanced = PersonaPromptBuilder.build_enhanced_prompt(enhanced, persona)
        except Exception as e:
            print(f"❌ Error applying persona in prompt enhancement: {e}")
    
    # Apply training data enhancement
    enhanced = enhance_image_prompt_with_training(enhanced)
    
    improvements = ["Enhanced with training data"]
    if persona_id:
        improvements.append("Applied persona context")
    
    return jsonify({
        "original_prompt": prompt,
        "enhanced_prompt": enhanced,
        "improvements": improvements
    })

def mcp_analyze_sprite_quality(params):
    """MCP tool: Analyze sprite quality"""
    sprite_id = params.get('sprite_id')
    
    sprite = sprites_collection.find_one({"sprite_id": sprite_id})
    if not sprite:
        return jsonify({"error": "Sprite not found"}), 404
    
    analysis = {
        "sprite_id": sprite_id,
        "current_rating": sprite.get('rating', 0),
        "suggestions": [],
        "quality_score": sprite.get('rating', 0) * 20,  # Convert to percentage
        "persona_used": bool(sprite.get('persona_id'))
    }
    
    # Add suggestions based on rating
    if sprite.get('rating', 0) < 3:
        analysis["suggestions"].extend([
            "Consider more specific pose descriptions",
            "Add style keywords for better consistency",
            "Try different character descriptions"
        ])
        
        if not sprite.get('persona_id'):
            analysis["suggestions"].append("Try using a persona for more consistent results")
    
    return jsonify(analysis)

def mcp_get_style_recommendations(params):
    """MCP tool: Get style recommendations"""
    character = params.get('character')
    persona_id = params.get('persona_id')
    
    recommendations = []
    
    # Get recommendations from persona if provided
    if persona_id:
        try:
            persona = personas_collection.find_one({"_id": ObjectId(persona_id)})
            if persona and persona.get('style_tags'):
                recommendations.extend(persona['style_tags'])
        except Exception as e:
            print(f"❌ Error getting persona recommendations: {e}")
    
    # Find successful styles for similar characters
    similar_sprites = list(sprites_collection.find(
        {
            "character": {"$regex": character, "$options": "i"},
            "rating": {"$gte": 4}
        },
        {"style": 1, "rating": 1}
    ).limit(5))
    
    if similar_sprites:
        styles = [sprite.get('style', '') for sprite in similar_sprites if sprite.get('style')]
        recommendations.extend(list(set(styles)))
    
    if not recommendations:
        recommendations = ["anime style", "pixel art", "fantasy artwork", "detailed illustration"]
    
    # Remove duplicates and limit
    recommendations = list(set(recommendations))[:5]
    
    return jsonify({
        "character": character,
        "recommended_styles": recommendations,
        "based_on_successful_generations": len(similar_sprites),
        "persona_applied": bool(persona_id)
    })

# ✅ Entry point
if __name__ == "__main__":
    print("🚀 Starting SpriteForge API...")
    print(f"📊 MongoDB: {'✅ Configured' if MONGODB_URI else '❌ Not configured'}")
    print(f"🤖 IONOS API: {'✅ Configured' if IONOS_API_KEY and IONOS_API_KEY != 'your_ionos_api_key_here' else '❌ Not configured'}")
    print(f"🌐 Server starting on http://{APP_CONFIG['HOST']}:{APP_CONFIG['PORT']}")
    
    app.run(
        debug=APP_CONFIG["DEBUG"], 
        host=APP_CONFIG["HOST"], 
        port=APP_CONFIG["PORT"]
    )
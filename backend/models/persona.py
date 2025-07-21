"""
Persona data model for SpriteForge
Defines the schema and validation for persona documents in MongoDB
"""

from datetime import datetime, UTC
from typing import List, Optional, Dict, Any

class PersonaSchema:
    """
    Schema definition for Persona documents in MongoDB
    """
    
    @staticmethod
    def create_persona_document(
        name: str,
        description: str,
        reference_image_base64: Optional[str] = None,
        style_tags: List[str] = None,
        character_tags: List[str] = None,
        example_prompts: List[str] = None,
        is_active: bool = True
    ) -> Dict[str, Any]:
        """
        Create a standardized persona document for MongoDB insertion
        
        Args:
            name: Unique name for the persona
            description: Detailed description of the persona's characteristics
            reference_image_base64: Optional base64 encoded reference image
            style_tags: List of style descriptors (e.g., ["anime", "fantasy", "detailed"])
            character_tags: List of character attributes (e.g., ["warrior", "female", "armored"])
            example_prompts: List of example prompts that work well with this persona
            is_active: Whether this persona is active and available for use
            
        Returns:
            Dictionary representing the persona document
        """
        return {
            "name": name.strip(),
            "description": description.strip(),
            "reference_image_base64": reference_image_base64,
            "style_tags": style_tags or [],
            "character_tags": character_tags or [],
            "example_prompts": example_prompts or [],
            "is_active": is_active,
            "usage_count": 0,  # Track how often this persona is used
            "average_rating": 0.0,  # Average rating of sprites generated with this persona
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC)
        }
    
    @staticmethod
    def validate_persona_data(data: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validate persona data before database operations
        
        Args:
            data: Dictionary containing persona data
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Required fields
        if not data.get('name'):
            return False, "Name is required"
        
        if not data.get('description'):
            return False, "Description is required"
        
        # Name length validation
        if len(data['name']) > 100:
            return False, "Name must be 100 characters or less"
        
        # Description length validation
        if len(data['description']) > 1000:
            return False, "Description must be 1000 characters or less"
        
        # Style tags validation
        style_tags = data.get('style_tags', [])
        if not isinstance(style_tags, list):
            return False, "Style tags must be a list"
        
        if len(style_tags) > 20:
            return False, "Maximum 20 style tags allowed"
        
        # Character tags validation
        character_tags = data.get('character_tags', [])
        if not isinstance(character_tags, list):
            return False, "Character tags must be a list"
        
        if len(character_tags) > 20:
            return False, "Maximum 20 character tags allowed"
        
        # Example prompts validation
        example_prompts = data.get('example_prompts', [])
        if not isinstance(example_prompts, list):
            return False, "Example prompts must be a list"
        
        if len(example_prompts) > 10:
            return False, "Maximum 10 example prompts allowed"
        
        return True, ""
    
    @staticmethod
    def format_persona_for_frontend(persona_doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format persona document for frontend consumption
        
        Args:
            persona_doc: Raw persona document from MongoDB
            
        Returns:
            Formatted persona document
        """
        return {
            'id': str(persona_doc['_id']),
            'name': persona_doc['name'],
            'description': persona_doc['description'],
            'referenceImageBase64': persona_doc.get('reference_image_base64'),
            'styleTags': persona_doc.get('style_tags', []),
            'characterTags': persona_doc.get('character_tags', []),
            'examplePrompts': persona_doc.get('example_prompts', []),
            'isActive': persona_doc.get('is_active', True),
            'usageCount': persona_doc.get('usage_count', 0),
            'averageRating': persona_doc.get('average_rating', 0.0),
            'createdAt': persona_doc['created_at'].isoformat(),
            'updatedAt': persona_doc['updated_at'].isoformat() if persona_doc.get('updated_at') else None
        }

class PersonaPromptBuilder:
    """
    Utility class for building enhanced prompts using persona context
    """
    
    @staticmethod
    def build_enhanced_prompt(
        base_prompt: str,
        persona: Dict[str, Any],
        character: str = "",
        pose: str = "",
        style: str = ""
    ) -> str:
        """
        Build an enhanced prompt incorporating persona context
        
        Args:
            base_prompt: Original user prompt
            persona: Persona document from database
            character: Character name from user input
            pose: Pose description from user input
            style: Style description from user input
            
        Returns:
            Enhanced prompt string
        """
        enhanced_parts = []
        
        # Start with persona context
        enhanced_parts.append(f"Based on the '{persona['name']}' persona:")
        enhanced_parts.append(f"Description: {persona['description']}")
        
        # Add style context from persona
        if persona.get('style_tags'):
            style_context = ", ".join(persona['style_tags'])
            enhanced_parts.append(f"Style elements: {style_context}")
        
        # Add character context from persona
        if persona.get('character_tags'):
            character_context = ", ".join(persona['character_tags'])
            enhanced_parts.append(f"Character traits: {character_context}")
        
        # Add example context if available
        if persona.get('example_prompts'):
            example = persona['example_prompts'][0]  # Use first example
            enhanced_parts.append(f"Example style: {example}")
        
        # Add user's specific request
        user_request_parts = []
        if character:
            user_request_parts.append(f"character: {character}")
        if pose:
            user_request_parts.append(f"pose: {pose}")
        if style:
            user_request_parts.append(f"additional style: {style}")
        
        if user_request_parts:
            enhanced_parts.append(f"Generate sprite with {', '.join(user_request_parts)}")
        else:
            enhanced_parts.append(f"Generate: {base_prompt}")
        
        # Add quality directives
        enhanced_parts.append("High quality, detailed sprite art, game character design, consistent with persona style")
        
        return ". ".join(enhanced_parts)
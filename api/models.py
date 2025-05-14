import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np
from together import Together

class ModelManager:
    def __init__(self):
        # Load environment variables from .env file
        load_dotenv()
        # Initialize embedding model (chỉ dùng 1 model)
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        # Initialize Together client with API key from environment variable
        api_key = os.getenv("TOGETHER_API_KEY")
        self.together_client = Together(api_key=api_key)
    
    def generate_text(self, history):
        """Generate text using Together AI Llama-3.3-70B-Instruct-Turbo-Free with chat history"""
        try:
            response = self.together_client.chat.completions.create(
                model="meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
                messages=history
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in generate_text: {str(e)}")
            return "I apologize, but I encountered an error while generating the response."
    
    def get_embeddings(self, texts):
        """Get embeddings for texts"""
        return self.embedding_model.encode(texts) 
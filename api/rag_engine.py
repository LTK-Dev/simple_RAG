import os
import numpy as np
from typing import List
from models import ModelManager

class RAGEngine:
    def __init__(self, model_manager: ModelManager):
        self.model_manager = model_manager
        self.documents = []  # Lưu trữ tài liệu
        self.embeddings = None  # Lưu trữ vector embedding của tài liệu
        print("[RAGEngine] Initialized.")
        
    def add_documents(self, documents: List[str]):
        """Add documents to knowledge base"""
        # Split documents into smaller chunks
        chunks = []
        for doc in documents:
            # Split by paragraphs
            paragraphs = [p.strip() for p in doc.split('\n') if p.strip()]
            chunks.extend(paragraphs)
        
        # Add chunks to documents
        self.documents.extend(chunks)
        print(f"[RAGEngine] Added {len(chunks)} chunks. Total: {len(self.documents)} chunks.")
        
        # Create embeddings for new chunks
        new_embeddings = self.model_manager.get_embeddings(chunks)
        
        # Update embedding matrix
        if self.embeddings is None:
            self.embeddings = new_embeddings
        else:
            self.embeddings = np.vstack([self.embeddings, new_embeddings])
        print(f"[RAGEngine] Embeddings shape: {self.embeddings.shape}")
    
    def cosine_similarity(self, a, b):
        """Tính toán độ tương đồng cosine giữa hai vector"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    
    def search_documents(self, query: str, k: int = 3) -> List[str]:
        """Search for most relevant documents"""
        if not self.documents:
            print("[RAGEngine] No documents in knowledge base.")
            return []
            
        # Create query embedding
        query_embedding = self.model_manager.get_embeddings([query])[0]
        
        # Calculate cosine similarities
        similarities = np.array([self.cosine_similarity(query_embedding, doc_emb) 
                               for doc_emb in self.embeddings])
        
        # Get top k documents
        top_k_indices = np.argsort(similarities)[-k:][::-1]
        
        relevant_docs = []
        for idx in top_k_indices:
            print(f"[RAGEngine] Chunk idx {idx} similarity: {similarities[idx]:.3f}")
            relevant_docs.append(self.documents[idx])
        print(f"[RAGEngine] Found {len(relevant_docs)} relevant chunks.")
        return relevant_docs
    
    def generate_response(self, query: str) -> str:
        """Generate response based on RAG"""
        # 1. Search for relevant documents
        relevant_docs = self.search_documents(query, k=3)
        
        if not relevant_docs:
            return "I don't have enough information to answer this question."
        
        # 2. Create context from relevant documents
        context = "\n".join(relevant_docs)
        
        # 3. Create optimized prompt for the model
        prompt = (
            f"You are a helpful AI assistant. Provide accurate and concise answers based solely on the provided information.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            f"Instructions:\n"
            f"- Answer directly using only the relevant information from the context.\n"
            f"- Use a friendly and professional tone.\n"
            f"- Format the answer clearly:\n"
            f"  - For lists, use numbered items or bullet points.\n"
            f"  - For explanations, keep them brief and structured.\n"
            f"- If the context lacks sufficient information, respond: 'I don't have enough information to answer this question. Please provide more details.'\n"
            f"Answer:"
        )
        print("[RAGEngine] Prompt sent to model:\n" + prompt)
        
        # 4. Generate response using Together AI (as chat message list)
        history = [{"role": "user", "content": prompt}]
        response = self.model_manager.generate_text(history)
        
        # 5. Process response to remove prompt and clean up
        response = response.strip()
        if len(response.split()) < 5:
            return "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
        return response

    def generate_response_with_history(self, history):
        """Generate response using Together AI with chat history"""
        return self.model_manager.generate_text(history)
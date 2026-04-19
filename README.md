---
title: Smart Document Analyzer
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
app_port: 7860
---

# Smart Document Analyzer

An AI-powered document analysis system using RAG (Retrieval-Augmented Generation) with Google Gemini.

### Features
- 📄 **PDF & Image Support:** Parses text from standard PDFs and images using OCR.
- 💬 **Contextual Chat:** Ask questions about your documents and get citation-backed answers.
- 🔒 **Privacy Focused:** Efficient local vector storage.

### Setup (Local Development)
1. Clone the repo.
2. Fill in your `GOOGLE_API_KEY` in `backend/.env`.
3. Run `backend/server.py` and the `frontend` dev server.

### Deployment (Hugging Face)
This project is configured for one-click deployment to Hugging Face Spaces via Docker. 
Simply upload these files and add your `GOOGLE_API_KEY` to the Space's Secrets.

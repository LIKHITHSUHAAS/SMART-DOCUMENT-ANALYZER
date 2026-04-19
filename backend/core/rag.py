import os
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_db")
os.makedirs(DB_DIR, exist_ok=True)

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key or api_key.startswith("Replace"):
    print("WARNING: Valid GOOGLE_API_KEY not found in .env.")

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", google_api_key=api_key)
vector_store = Chroma(
    collection_name="smart_docs", 
    embedding_function=embeddings, 
    persist_directory=DB_DIR
)

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key)

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
retriever = vector_store.as_retriever(search_kwargs={"k": 5})

def ingest_chunks_into_db(parsed_chunks: list[dict]):
    global vector_store, retriever
    
    # Forget the old file by deleting the current collection
    try:
        vector_store.delete_collection()
        # Re-initialize the vector store to create a fresh collection
        vector_store = Chroma(
            collection_name="smart_docs", 
            embedding_function=embeddings, 
            persist_directory=DB_DIR
        )
        # Re-initialize the retriever to point to the new collection
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
    except Exception as e:
        print(f"Warning: Could not clear vector store: {e}")

    docs_to_insert = []
    for chunk in parsed_chunks:
        splits = text_splitter.split_text(chunk["text"])
        for split in splits:
            docs_to_insert.append({
                "page_content": split,
                "metadata": chunk["metadata"]
            })
            
    if not docs_to_insert:
        return
    
    texts = [d["page_content"] for d in docs_to_insert]
    metadatas = [d["metadata"] for d in docs_to_insert]
    
    vector_store.add_texts(texts=texts, metadatas=metadatas)

def query_rag(query: str, chat_history: list[dict]):
    # 1. Retrieve raw documents directly manually
    docs = retriever.invoke(query)
    
    # 2. Extract textual context
    context = "\n\n".join([d.page_content for d in docs])
    
    # 3. Formulate history manually to avoid complex chain abstractions that break
    history = []
    sys_prompt = ("You are a smart document analyzer and helpful assistant. "
                  "Answer the user's questions based on the retrieved context below. "
                  "If the answer is not in the context, politely say that you don't know based on the provided documents.\n\n"
                  f"Context:\n{context}")
    
    history.append(("system", sys_prompt))
    for msg in chat_history:
        # Avoid putting the actual user prompt history into system prompt, 
        # map generic rules if needed. LangChain tuples support role strings.
        role = "human" if msg["role"] == "user" else "ai"
        history.append((role, msg["content"]))
        
    history.append(("human", query))
    
    # 4. Generate Answer natively
    response = llm.invoke(history)
    
    # 5. Extract citations manually
    sources = []
    for doc in docs:
        meta = doc.metadata
        source_str = f"{meta.get('source', 'Unknown')} (Page {meta.get('page', '?')})"
        if source_str not in sources:
            sources.append(source_str)
            
    return {
        "answer": response.content,
        "citations": sources
    }

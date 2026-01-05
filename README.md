# 🧠 GPTStudio

**A Full-Stack RAG (Retrieval-Augmented Generation) Platform to Build Custom AI Chatbots Powered by Your Own Data.**

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)

   * [Backend Environment (.env)](#backend-environment-env)
   * [Frontend Environment (.env)](#frontend-environment-env)
5. [Database Setup](#database-setup)
6. [Running the Project](#running-the-project)

---

## 🚀 Getting Started

Follow these steps to get a copy of the project up and running on your local machine for development and testing purposes.

---

## 🧮 Prerequisites

Ensure the following tools are installed on your system:

* **Node.js**: v20.x or higher
* **npm**: Included with Node.js
* **MongoDB Atlas**: Required for cloud database hosting and vector search capabilities

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuration

This project uses **.env** files for environment variables.
Use the provided `.env.example` files in both the backend and frontend directories as templates.

---

### 🔧 Backend Environment (.env)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and fill in your credentials:

   ```bash
   # AI Provider Config (e.g., Azure AI, OpenAI)
   AZURE_AI_ENDPOINT="YOUR_AI_ENDPOINT"
   AZURE_AI_API_KEY="YOUR_AI_API_KEY"
   EMBEDDING_MODEL_NAME="openai/text-embedding-3-small"
   CHAT_MODEL_NAME="openai/gpt-4o-mini"

   # MongoDB Atlas Connection Strings
   APP_MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/ai_platform_db?..."
   RAG_MONGO_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/rag_db?..."

   # JWT Secret for authentication
   JWT_SECRET="YOUR_SUPER_SECRET_RANDOM_STRING"

   # Server Port
   PORT=3001
   ```

---

### 💻 Frontend Environment (.env)

1. Navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file to point to your backend API:

   ```bash
   # Backend API URL
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

---

## 🗄️ Database Setup

### 1. Collections

The application databases (**ai_platform_db** and **rag_db**) and their collections are automatically created on the first run — when you register a user or upload a document.

---

### 2. Vector Search Index (⚠️ Critical Step)

For the **RAG (Retrieval-Augmented Generation)** functionality to work properly, you must manually create a **Vector Search Index** in your MongoDB Atlas cluster.

#### Steps:

1. Navigate to your **rag_db** database in the **MongoDB Atlas Dashboard**.
2. Locate the **documentchunks** collection (or the collection where embeddings are stored).
3. Go to the **Search** tab and click **"Create Search Index"**.
4. Select **"JSON Editor"** and paste the following configuration:

   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1536,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "userId"
       },
       {
         "type": "filter",
         "path": "documentId"
       }
     ]
   }
   ```

> ⚠️ **Note:**
> The `numDimensions` (e.g., `1536`) must match the embedding model you are using.

---

## 🏃 Running the Project

You’ll need **two separate terminal windows** — one for the backend and one for the frontend.

### 1. Run the Backend Server

```bash
cd backend
npm run dev
```

> Server will be running on: **[http://localhost:3001](http://localhost:3001)**

---

### 2. Run the Frontend Server (in a new terminal)

```bash
cd frontend
npm run dev
```

> Application will be available at: **[http://localhost:5173](http://localhost:5173)**

---

## 🌟 Summary

✅ Full-stack RAG chatbot platform
✅ MongoDB Atlas for vector search
✅ Customizable AI models (Azure/OpenAI)
✅ Secure authentication with JWT
✅ Local setup with minimal configuration

---

### 🌐 License

This project is licensed under the **MIT License** — feel free to use and modify it for your own projects.

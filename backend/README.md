# PixelateAI Backend

The backend API server for PixelateAI - The Prompt Animator.

## Quick Start

### Prerequisites
- Python 3.9+
- OpenAI API Key

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   # Create a .env file in the backend directory
   touch .env
   ```

3. **Add your OpenAI API key to `.env`**:
   ```bash
   # Required
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional (for additional features)
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_key_here
   SUPABASE_BUCKET=your_bucket_name_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=your_index_name_here
   LANGCHAIN_API_KEY=your_langchain_api_key_here
   LANGCHAIN_TRACING_V2=true
   LANGCHAIN_PROJECT=your_project_name_here
   ```

4. **Run the server**:
   ```bash
   python run.py
   ```

   The server will be available at `http://localhost:5001`

## Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Optional
- `SUPABASE_URL`: Supabase project URL (for cloud storage)
- `SUPABASE_KEY`: Supabase anon key
- `SUPABASE_BUCKET`: Supabase storage bucket name
- `PINECONE_API_KEY`: Pinecone API key (for vector search)
- `PINECONE_INDEX_NAME`: Pinecone index name
- `LANGCHAIN_API_KEY`: LangChain API key (for tracing)
- `LANGCHAIN_TRACING_V2`: Enable LangChain tracing
- `LANGCHAIN_PROJECT`: LangChain project name

## Security

⚠️ **Important Security Notes**:

1. **Never commit API keys to git**
   - The `.env` file is gitignored
   - Always use environment variables for sensitive data
   - Use the `.env.example` file as a template

2. **API Key Management**
   - Keep your OpenAI API key secure
   - Rotate keys regularly
   - Monitor usage and set spending limits

3. **Production Deployment**
   - Use proper secret management systems
   - Set environment variables through your hosting platform
   - Never hardcode secrets in your code

## API Endpoints

- `POST /generate`: Generate Manim animation code
- `GET /health`: Health check endpoint

## Development

### Running in Development
```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env  # Edit with your API keys

# Run the server
python run.py
```

### Docker (Alternative)
```bash
docker-compose up
```

## Troubleshooting

### Common Issues

1. **OpenAI API Key not set**
   ```
   ERROR: OPENAI_API_KEY environment variable is not set!
   ```
   Solution: Make sure your `.env` file contains `OPENAI_API_KEY=your_key_here`

2. **Import errors**
   ```
   ModuleNotFoundError: No module named 'manim'
   ```
   Solution: Install dependencies with `pip install -r requirements.txt`

3. **Permission denied errors**
   Solution: Make sure Python has write permissions in the current directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

See the main project LICENSE file.

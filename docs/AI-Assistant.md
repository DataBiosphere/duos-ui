# AI Assistant Feature

This document describes the AI Assistant feature integrated into the DUOS Data Library.

## Overview

The AI Assistant provides context-aware help to users navigating the DUOS Data Library. It uses a local llama.cpp server for LLM inference and can optionally integrate with a DUOS MCP (Model Context Protocol) server for domain-specific tools.

## Components

### Frontend Components

Located in `src/components/ai/`:

- **AIAssistantButton.tsx** - Floating action button that opens the AI chat
- **AIAssistantModal.tsx** - Modal dialog containing the chat interface
- **AIChat.tsx** - Main chat component with message history and input
- **AIChatMessage.tsx** - Individual message bubble component

### Backend Services

Located in `src/libs/ajax/ai/`:

- **AIService.ts** - Handles communication with llama.cpp server
- **MCPService.ts** - Integrates with DUOS MCP server for tool calling

### Type Definitions

Located in `src/types/ai.ts`:

- ChatMessage, AIResponse, ToolCall, MCPTool, MCPToolResult

## How It Works

### Context Awareness

The AI Assistant captures the current page's text content (`document.documentElement.innerText`) with each user message. This allows the AI to:

- See all visible datasets and their details
- Understand active filters and search terms
- Reference specific information the user can see
- Provide contextually relevant responses

### Message Flow

1. User types a question in the chat input
2. System captures current page text content
3. Message is sent to llama.cpp server with:
   - User's question
   - Conversation history
   - Current page text content in system prompt
4. AI processes the request and generates a response
5. Response is displayed in the chat interface

### Persistence

Chat history is stored in `sessionStorage` and persists across page navigations within the same session.

## Backend Requirements

### llama.cpp Server

The AI Assistant requires a llama.cpp server running at `http://127.0.0.1:8080`.

**Expected Endpoints:**

- `POST /completion` - Main completion endpoint
  - Accepts: `{ prompt, temperature, top_p, max_tokens, stream, stop }`
  - Returns: `{ content, usage?: { promptTokens, completionTokens, totalTokens } }`
- `GET /health` - Health check endpoint

### MCP Server (Optional)

For enhanced functionality, a DUOS MCP server can run at `http://127.0.0.1:8000`.

**Expected Endpoints:**

- `GET /tools` - List available tools
- `POST /tools/{toolName}/execute` - Execute a specific tool

**Example Tools:**
- `search_datasets` - Search DUOS datasets
- `get_dataset_details` - Get detailed dataset information
- `check_data_use_restrictions` - Analyze data use codes
- `find_similar_studies` - Find related studies

## Usage

### For Users

1. Navigate to any Data Library page
2. Click the floating AI button (🤖) in the bottom-right corner
3. Type your question in the input field
4. Press Enter or click the send button
5. View the AI's response

**Example Questions:**
- "What datasets am I looking at?"
- "Explain the data use restrictions for the first dataset"
- "How do I apply for access?"
- "What filters are currently active?"

### For Developers

#### Integrating into Other Pages

```jsx
import AIAssistantButton from 'src/components/ai/AIAssistantButton'
import AIAssistantModal from 'src/components/ai/AIAssistantModal'
import { useState } from 'react'

export const YourComponent = () => {
  const [aiModalOpen, setAiModalOpen] = useState(false)

  return (
    <>
      {/* Your page content */}
      
      {/* AI Assistant */}
      <AIAssistantButton onClick={() => setAiModalOpen(true)} />
      <AIAssistantModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />
    </>
  )
}
```

#### Configuration

The AI service configuration is currently hardcoded but can be moved to `public/config.json`:

```json
{
  "aiAssistant": {
    "enabled": true,
    "llamaServerUrl": "http://127.0.0.1:8080",
    "mcpServerUrl": "http://127.0.0.1:8000",
    "timeout": 30000,
    "maxTokens": -1,
    "temperature": 0.8,
    "topP": 0.95
  }
}
```

## Development

### Running Tests

```bash
# Component tests
npm run cy:run-ct

# Specific test
npm run cy:run-ct -- --spec "cypress/component/ai/AIAssistantButton.spec.tsx"
```

### Starting the llama.cpp Server

```bash
# Example using llama-server from llama.cpp
./llama-server -m /path/to/model.gguf --port 8080 --host 127.0.0.1
```

### Starting the MCP Server

```bash
# Example (implementation specific)
cd duos-mcp-server
npm start
```

## Security Considerations

1. **Input Sanitization**: User input is sent to the AI server but should be validated
2. **Output Rendering**: AI responses are rendered using react-markdown with React's XSS protection
3. **Page Context**: The entire page text is sent to the AI server - be aware of sensitive data
4. **Local Only**: Current implementation uses localhost URLs only
5. **No Authentication**: Consider adding authentication if exposing publicly

## Troubleshooting

### AI Button Not Appearing

- Check that the component is integrated into the page
- Verify the button's z-index isn't being overridden
- Check browser console for errors

### Connection Errors

- Verify llama.cpp server is running on port 8080
- Check server logs for errors
- Test health endpoint: `curl http://127.0.0.1:8080/health`

### Slow Responses

- Check model size and server resources
- Adjust max_tokens parameter
- Consider implementing streaming responses

### Context Too Large

- Current implementation captures all page text
- May need to implement truncation for very large pages
- Consider extracting only relevant sections

## Future Enhancements

1. **Streaming Responses** - Show AI response as it's generated
2. **Tool Calling** - Integrate MCP server tools for enhanced capabilities
3. **Voice Input** - Allow users to speak questions
4. **Export Chat** - Download conversation history
5. **Feedback System** - Rate AI responses
6. **Multi-language** - Support internationalization
7. **Suggested Questions** - Quick action buttons with common queries
8. **Configuration UI** - Allow users to adjust AI parameters

## Support

For issues or questions:
- Check the main DUOS documentation
- Review error logs in browser console
- Verify backend services are running
- Contact the development team

## License

Same as parent DUOS project.

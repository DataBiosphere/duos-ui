# AI Assistant Feature Plan - Data Library

## Overview
Add an AI assistant button to the DUOS Data Library that allows users to interact with an AI-powered chatbot. The AI will use a llama.cpp server for LLM capabilities and can optionally leverage the DUOS MCP (Model Context Protocol) server for DUOS-specific tools and data access.

## Architecture

### Components
1. **AI Button** - Floating action button in the data library interface
2. **AI Chat Modal** - Modal dialog containing chat interface
3. **AI Service** - Service layer for communicating with AI backend
4. **Chat Component** - Reusable chat UI with message history

### Integration Points
- **llama.cpp Server**: `http://127.0.0.1:8080` - Primary LLM inference endpoint
- **DUOS MCP Server**: `http://127.0.0.1:8000` - DUOS-specific tools and context

## File Structure

```
src/
├── components/
│   ├── ai/
│   │   ├── AIAssistantButton.tsx       # Floating AI button
│   │   ├── AIAssistantModal.tsx        # Modal container
│   │   ├── AIChat.tsx                  # Chat interface
│   │   └── AIChatMessage.tsx           # Individual message component
│   └── modals/                         # Existing modal patterns
├── libs/
│   └── ajax/
|       └── ai/
│           ├── AIService.ts            # AI backend communication
│           └── MCPService.ts           # MCP server integration
├── pages/
│   └── DatasetSearch.jsx               # Integration point
└── types/
    └── ai.ts                           # TypeScript types for AI
```

## Implementation Details

### 1. AI Assistant Button Component (`AIAssistantButton.tsx`)

**Purpose**: Floating action button that toggles the AI chat modal

**Features**:
- Fixed position button (bottom-right corner)
- AI/robot icon
- Hover effects and tooltips
- Accessible with proper ARIA labels

**Props**:
```typescript
interface AIAssistantButtonProps {
  onClick: () => void
  disabled?: boolean
}
```

**Styling**:
- Material-UI Fab (Floating Action Button)
- Brand colors consistent with DUOS theme
- Z-index to stay above other content
- Responsive positioning

### 2. AI Assistant Modal Component (`AIAssistantModal.tsx`)

**Purpose**: Modal container for the AI chat interface

**Features**:
- Material-UI Dialog component
- Minimizable state
- Close/minimize controls
- Persistent across page navigation (session storage)

**Props**:
```typescript
interface AIAssistantModalProps {
  open: boolean
  onClose: () => void
}
```

**State Management**:
- Modal open/close state
- Minimized state
- Chat history persistence (session/local storage)

### 3. AI Chat Component (`AIChat.tsx`)

**Purpose**: Main chat interface with message display and input

**Features**:
- Message history display
- Scrollable message container
- Auto-scroll to latest message
- Text input field
- Send button
- Loading indicators during AI response
- Error handling and retry
- Page text context which automatically includes `document.documentElement.innerText` with each request
- Markdown rendering for AI responses

**Props**:
```typescript
interface AIChatProps {
  pageTextContent?: string
  initialMessages?: ChatMessage[]
  onMessagesChange?: (messages: ChatMessage[]) => void
}
```

**State**:
- Messages array
- Input text
- Loading state
- Error state
- Typing indicator

### 4. Chat Message Component (`AIChatMessage.tsx`)

**Purpose**: Individual message bubble with sender and content

**Features**:
- User vs AI message styling
- Timestamp display
- Icons for sender vs AI
- Markdown content rendering
- Copy message button

**Props**:
```typescript
interface AIChatMessageProps {
  message: ChatMessage
  isUser: boolean
  timestamp: Date
  onRegenerate?: () => void
  onCopy?: () => void
}
```

### 5. AI Service (`AIService.ts`)

**Purpose**: Handle communication with llama.cpp server

**Endpoints**:
- POST `/completion` - Single completion request
- POST `/chat/completions` - Chat-style completion (OpenAI compatible)
- GET `/health` - Health check

**Methods**:
```typescript
class AIService {
  static async sendMessage(
    prompt: string, 
    conversationHistory: ChatMessage[],
    pageTextContent?: string
  ): Promise<AIResponse>
  
  static async streamMessage(
    prompt: string,
    conversationHistory: ChatMessage[],
    onChunk: (chunk: string) => void,
    pageTextContent?: string
  ): Promise<void>
  
  static async checkHealth(): Promise<boolean>
  
  private static buildPromptWithTextContext(
    userMessage: string,
    pageTextContent?: string
  ): string
}
```

**Request Format (llama.cpp compatible)**:
```json
{
  "prompt": "<system>\nYou are a helpful assistant for the DUOS Data Library.\n\nCURRENT PAGE TEXT CONTENT:\n\n```\n{pageTextContent}\n```\n\nThe user is viewing this page. Use the HTML content to understand what datasets, filters, and information are currently visible to the user.\n</system>\n\n<user>\nUser's message\n</user>\n\n<assistant>",
  "temperature": 0.8,
  "top_p": 0.95,
  "max_tokens": -1,
  "stream": false,
  "stop": ["</assistant>", "<user>"]
}
```

**Text Context Strategy**:
- Capture `document.documentElement.innerText` and add this to the prompt input to add as additional context for the request

**Error Handling**:
- Connection errors
- Timeout handling (configurable)
- Retry logic with exponential backoff
- User-friendly error messages

### 6. MCP Service (`MCPService.ts`)

**Purpose**: Integration with DUOS MCP server for tool calling

**Features**:
- Tool discovery
- Tool execution
- Context injection
- Response formatting

**Methods**:
```typescript
class MCPService {
  static async listTools(): Promise<MCPTool[]>
  
  static async executeTool(
    toolName: string,
    parameters: object
  ): Promise<MCPToolResult>
  
  static async enrichPromptWithTools(
    prompt: string,
    availableTools: MCPTool[]
  ): Promise<string>
}
```

**MCP Server Integration**:
- GET `/tools` - List available tools
- POST `/tools/{toolName}/execute` - Execute specific tool
- Tools might include:
  - `search_datasets` - Search DUOS datasets
  - `get_dataset_details` - Get specific dataset info
  - `check_data_use_restrictions` - Analyze data use codes
  - `find_similar_studies` - Find related studies

### 7. TypeScript Types (`types/ai.ts`)

```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    toolCalls?: ToolCall[]
    pageTextContent?: string
  }
}

export interface AIResponse {
  content: string
  toolCalls?: ToolCall[]
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ToolCall {
  toolName: string
  parameters: object
  result?: object
}

export interface MCPTool {
  name: string
  description: string
  parameters: {
    type: string
    properties: object
    required: string[]
  }
}
```

## Integration into Data Library

### 1. Update `DatasetSearchTable.jsx`

Add the AI Assistant button with text context:

```jsx
import AIAssistantButton from 'src/components/ai/AIAssistantButton'
import AIAssistantModal from 'src/components/ai/AIAssistantModal'

export const DatasetSearchTable = (props) => {
  // ... existing code ...
  const [aiModalOpen, setAiModalOpen] = useState(false)

  return (
    <>
      {/* Existing content */}
      {/* AI Assistant - will capture page text content automatically */}
      <AIAssistantButton onClick={() => setAiModalOpen(true)} />
      <AIAssistantModal 
        open={aiModalOpen} 
        onClose={() => setAiModalOpen(false)}
      />
    </>
  )
}
```

## User Experience Flow

### 1. Opening AI Assistant
1. User clicks floating AI button in bottom-right corner
2. Modal opens with welcome message
3. Input field is focused and ready for user input

### 2. Asking Questions
1. User types question in input field
2. User presses Enter or clicks Send button
3. System captures current page text content automatically
4. User message appears in chat
5. Loading indicator shows AI is thinking
6. AI response streams in or appears all at once
7. AI can reference visible content from the text content (datasets, filters, buttons, etc.)

### 3. Text Context Awareness
The AI receives the full text content of the current page with each request, allowing it to:
- See all visible datasets and their details
- Know what buttons/actions are available
- Reference specific text the user can see
- Understand the current state of the UI

Example interactions:
```
User: "What datasets am I looking at?"
AI: [Reads content to see dataset table]
AI: "You're currently viewing 10 datasets in the Broad Data Library. I can see datasets including TCGA-BRCA with 1,097 participants, CGEMS with 2,273 participants, and others. Would you like more details about any specific dataset?"

User: "Tell me about the first one"
AI: [Parses content to find first dataset in table]
AI: "The first dataset is TCGA-BRCA (The Cancer Genome Atlas - Breast Invasive Carcinoma). From what I can see: ..."
```

### 4. Tool Usage (MCP Integration)
When AI needs DUOS-specific data:
1. AI decides to use a tool
2. MCPService.executeTool() is called
3. Tool result is incorporated into AI response
4. User sees natural language response with data insights

Example:
```
User: "Tell me more about the selected datasets"
AI: [Calls get_dataset_details tool for each selected dataset]
AI Response: "You have selected 3 datasets:
1. TCGA Breast Cancer - 500 participants, controlled access, genomic data
2. CGEMS Study - 1200 participants, controlled access, requires IRB
3. ..."
```

## Configuration

### Environment Variables / Config

Add to `public/config.json`:
```json
{
  "aiAssistant": {
    "enabled": true,
    "llamaServerUrl": "http://127.0.0.1:8080",
    "mcpServerUrl": "http://127.0.0.1:8000",
    "timeout": 30000,
    "maxTokens": 2048,
    "temperature": 0.7,
    "streamResponses": true,
  }
}
```

## Error Handling

### Scenarios
1. **llama.cpp server unavailable**
   - Show friendly error message
   - Suggest checking server status
   - Provide fallback to documentation links

2. **MCP server unavailable**
   - AI continues to work without tools
   - Inform user that some features may be limited

3. **Request timeout**
   - Cancel request
   - Show timeout message
   - Offer retry option

4. **Invalid response**
   - Log error details
   - Show generic error to user
   - Clear loading state

### Error Messages
```typescript
const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Unable to connect to AI assistant. Please check if the service is running.',
  TIMEOUT: 'Request timed out. Please try again with a shorter question.',
  INVALID_RESPONSE: 'Received an invalid response. Please try again.',
  MCP_UNAVAILABLE: 'Some advanced features are currently unavailable.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  HTML_TOO_LARGE: 'Page content is too large. Some context may be truncated.',
}
```

## Security Considerations

### 1. Input Sanitization
- Sanitize user input before sending to AI
- Prevent prompt injection attacks
- Validate and escape special characters

### 2. Output Sanitization
- Sanitize AI responses before rendering
- Use React's built-in XSS protection
- Be cautious with markdown rendering

## Testing Strategy

### 1. Unit Tests
- Component rendering tests
- Service method tests
- Error handling tests
- Mock AI responses

### 2. Component Tests (Cypress)
```
cypress/component/ai/
├── AIAssistantButton.spec.tsx
├── AIAssistantModal.spec.tsx
├── AIChat.spec.tsx
└── AIChatMessage.spec.tsx
```

Test cases:
- Button click opens modal
- Message sending and receiving
- Loading states
- Error states
- Tool calling

### 3. E2E Tests
```
cypress/e2e/
└── ai_assistant.cy.js
```

Test scenarios:
- Complete conversation flow
- AI references page content correctly
- Text context updates when page changes
- Dataset selection and AI awareness
- Error recovery
- Modal persistence

### 4. Integration Tests
- Test with real llama.cpp server
- Test MCP tool calling
- Test with various prompts
- Performance testing

## Accessibility

### 1. Keyboard Navigation
- Button focusable and activatable via Enter/Space
- Modal trappable focus
- Tab through chat messages
- Input field keyboard shortcuts (Enter to send, Shift+Enter for newline)

### 2. Screen Reader Support
- ARIA labels on all interactive elements
- ARIA live regions for new messages
- Role announcements (button, dialog, etc.)
- Alt text for icons

### 3. Visual Accessibility
- High contrast mode support
- Sufficient color contrast ratios
- Keyboard focus indicators
- Resizable text support

## Performance Optimization

### 1. Lazy Loading
- Load AI components only when needed
- Code splitting for AI module

### 2. Message Pagination
- Limit visible messages (e.g., last 50)

### 3. Streaming Responses
- Implement streaming for better perceived performance
- Show partial responses as they arrive

### 4. Caching
- Cache tool results when appropriate
- Cache common AI responses (FAQ-style)
- Store conversation in session storage

## Implementation Phases

### Phase 1: Core Functionality (MVP)
**Timeline**: 2-3 weeks
- [ ] Create AI button component
- [ ] Create AI modal component
- [ ] Create basic chat interface
- [ ] Implement AIService with llama.cpp integration
- [ ] Basic error handling
- [ ] Unit tests
- [ ] Component tests

### Phase 2: MCP Integration
**Timeline**: 1-2 weeks
- [ ] Implement MCPService
- [ ] Tool discovery and execution
- [ ] Enhanced context with tool results
- [ ] Tool-specific UI enhancements
- [ ] Integration tests

### Phase 3: Polish & Enhancement
**Timeline**: 1 week
- [ ] Streaming responses
- [ ] Message history persistence
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] E2E tests
- [ ] Documentation

## Dependencies

### Existing Dependencies to Leverage
- Material-UI (Dialog, Fab, TextField, etc.)
- React hooks (useState, useEffect, useMemo, etc.)
- React Markdown (Markdown rendering)
- Dompurify (XSS protection for markdown)
- Axios/fetch for HTTP requests
- do not use lodash utilities

## Documentation

### Developer Documentation
- API documentation for AIService and MCPService
- Component prop documentation

## Conclusion

This plan provides a comprehensive roadmap for implementing an AI assistant in the DUOS Data Library. The feature will enhance user experience by providing intelligent, context-aware assistance for navigating datasets, understanding data use restrictions, and applying for access.

The phased approach allows for iterative development and testing, ensuring a robust and user-friendly implementation. The integration with both llama.cpp for LLM capabilities and the DUOS MCP server for domain-specific tools creates a powerful and flexible AI assistant.

import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a supportive and knowledgeable AI assistant helping users create meaningful goals.

Key guidelines:
1. Keep responses short and focused (2-3 sentences max)
2. Ask one question at a time
3. Listen and acknowledge user input before proceeding
4. Provide specific suggestions only when asked
5. Keep the conversation natural and flowing

When discussing goals:
- Focus on understanding the user's specific situation first
- Ask about timeframes and priorities
- Consider both immediate and long-term needs
- Break down goals into actionable components
- Help identify potential obstacles and resources needed

Remember:
- Keep responses brief and conversational
- Don't overwhelm with information
- Let the user guide the conversation
- Ask clarifying questions when needed`;

const EXTRACTION_PROMPT = `Extract comprehensive goal information from the conversation, including all actionable items. Structure the response to include:

1. Core Goal Information:
   - Title - Clear, concise goal name
   - Description - Detailed goal description
   - Domain - Life domain (financial, health, family, personal, community, home, work)
   - Target Date - Goal completion date

2. Implementation Details:
   - Milestones - Key checkpoints with target dates and frequencies
   - Metrics - Specific measurable indicators with targets and units
   - Weekly Actions - Regular tasks to maintain progress
   - Daily Habits - Recurring behaviors to develop
   - Routines - Structured sequences of actions with frequencies

3. Support Elements:
   - Resources Needed - Tools, materials, or support required
   - Potential Obstacles - Anticipated challenges
   - Success Criteria - How to measure achievement

Format as a JSON object with these nested fields. Include all relevant details from the conversation.

Example format:
{
  "title": "Family Financial Security Plan",
  "description": "Comprehensive financial plan covering retirement savings, college funds, and current lifestyle needs",
  "domain": "financial",
  "targetDate": "2024-12-31",
  "milestones": [
    {
      "title": "Emergency Fund Complete",
      "description": "Save 6 months of expenses",
      "targetDate": "2024-03-31",
      "frequency": "once"
    }
  ],
  "metrics": [
    {
      "name": "Monthly Savings Rate",
      "type": "number",
      "target": 2500,
      "unit": "USD",
      "frequency": "monthly"
    }
  ],
  "weeklyActions": [
    "Review spending vs budget",
    "Update investment tracking spreadsheet"
  ],
  "dailyHabits": [
    "Log all expenses",
    "Review daily spending"
  ],
  "routines": [
    {
      "name": "Monthly Financial Review",
      "description": "Comprehensive review of financial status",
      "frequency": "monthly",
      "steps": [
        "Review all account balances",
        "Update budget tracking",
        "Check progress on savings goals"
      ]
    }
  ],
  "resources": [
    "Budgeting software",
    "Financial advisor consultation"
  ],
  "obstacles": [
    "Unexpected expenses",
    "Market volatility"
  ],
  "successCriteria": [
    "Emergency fund reaches target",
    "Monthly savings goals consistently met"
  ]
}`;

export const processConversation = async (
  messages: { role: string; content: string }[]
): Promise<any> => {
  try {
    // Get the next conversation prompt
    const conversationResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    // Extract structured data with enhanced prompt
    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: EXTRACTION_PROMPT
        },
        {
          role: "user",
          content: `Extract comprehensive goal information from this conversation:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    let extractedData = {};
    let conversationComplete = false;

    try {
      const parsedData = JSON.parse(extractionResponse.choices[0].message.content);
      
      // Transform the extracted data into the system's format
      extractedData = {
        title: parsedData.title,
        description: parsedData.description,
        domain: parsedData.domain,
        targetDate: parsedData.targetDate ? new Date(parsedData.targetDate) : undefined,
        status: 'active',
        milestones: (parsedData.milestones || []).map(m => ({
          id: crypto.randomUUID(),
          title: m.title,
          description: m.description,
          targetDate: new Date(m.targetDate),
          completed: false,
          frequency: m.frequency || 'once'
        })),
        metrics: (parsedData.metrics || []).map(m => ({
          id: crypto.randomUUID(),
          name: m.name,
          type: m.type,
          target: m.target,
          current: 0,
          unit: m.unit,
          frequency: m.frequency,
          history: []
        })),
        weeklyActions: parsedData.weeklyActions || [],
        dailyHabits: parsedData.dailyHabits || [],
        routines: (parsedData.routines || []).map(r => ({
          id: crypto.randomUUID(),
          name: r.name,
          description: r.description,
          frequency: r.frequency,
          steps: r.steps,
          lastCompleted: null,
          nextDue: null
        })),
        resources: parsedData.resources || [],
        obstacles: parsedData.obstacles || [],
        successCriteria: parsedData.successCriteria || [],
        reflections: []
      };

      // Check if we have enough information
      const requiredFields = ['title', 'description', 'domain'];
      conversationComplete = requiredFields.every(field => 
        parsedData[field] && parsedData[field].trim() !== ''
      );
    } catch (error) {
      console.error('Error parsing extracted data:', error);
    }

    return {
      nextPrompt: conversationResponse.choices[0].message.content,
      extractedData,
      conversationComplete
    };
  } catch (error) {
    console.error('Error processing conversation:', error);
    return {
      nextPrompt: "I'm having trouble understanding. Could you rephrase that?",
      extractedData: {},
      conversationComplete: false
    };
  }
};

export const generateSuggestion = async (
  step: number,
  question: string,
  previousResponses: { question: string; answer: string }[]
): Promise<string[]> => {
  const context = previousResponses.map(r => `${r.question}\nAnswer: ${r.answer}`).join('\n\n');
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nProvide one brief, specific suggestion based on the context.`
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nCurrent question: ${question}\n\nProvide a specific suggestion that builds on the previous responses.`
        }
      ],
      temperature: 0.8,
      max_tokens: 100,
      n: 3
    });

    return response.choices.map(choice => 
      choice.message.content?.trim() || "No suggestion available"
    );
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return ["Could not generate suggestions at this time"];
  }
};

export const getAIResponse = async (
  userInput: string,
  currentQuestion: string,
  previousMessages: { role: string; content: string }[]
): Promise<string> => {
  const context = previousMessages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nProvide a brief, natural response that acknowledges the user's input and asks one relevant follow-up question.`
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nCurrent question: ${currentQuestion}\nUser response: ${userInput}\n\nProvide a brief, conversational response.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content || "Let's continue with the next step.";
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I understand. Let's move on to the next step.";
  }
};
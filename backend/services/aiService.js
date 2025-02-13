// Path: backend/services/aiService.js

const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI(process.env.OPENAI_API_KEY);
  }

  // Helper to check if text has minimum 5 words
  hasEnoughContext(text) {
    const words = text.trim().split(/\s+/);
    return words.length >= 5;
  }

  // Helper to estimate tokens (roughly 4 chars per token)
  estimateMaxTokens(maxChars) {
    return Math.floor(maxChars / 4);
  }

  async generateText(text, type) {
    if (!this.hasEnoughContext(text)) {
      throw new Error('Please provide at least 5 words for context');
    }

    const maxChars = {
      bio: 250,
      workDescription: 500,
      invoiceDescription: 500
    }[type];

    const maxTokens = this.estimateMaxTokens(maxChars);

    let prompt;
    switch(type) {
      case 'bio':
        prompt = `Enhance this model bio without any introduction or quotation marks: ${text}`;
        break;
      case 'workDescription':
        prompt = `Objectively explain this modeling work description without any introduction or quotation marks: ${text}`;
        break;
      case 'invoiceDescription':
        prompt = `Create professioal short service item description for Modelling service that will go the client without any introduction or quotation marks. This is not an advertisement. It an invoice. Service will be provided int he future. be concise: ${text}`;
        break;
    }

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a direct response generator. Provide the final text"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  }

  async generateBio(text) {
    return this.generateText(text, 'bio');
  }

  async generateWorkDescription(text) {
    return this.generateText(text, 'workDescription');
  }

  async generateInvoiceDescription(text) {
    return this.generateText(text, 'invoiceDescription');
  }
}

module.exports = new AIService();
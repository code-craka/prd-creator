import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ErrorFactory } from '../utils/errorHelpers';

export interface AIGenerationRequest {
  prompt: string;
  prdType: 'feature' | 'product' | 'api' | 'mobile' | 'web' | 'enhancement' | 'custom';
  context?: {
    company?: string;
    industry?: string;
    targetAudience?: string;
    existingProducts?: string[];
    timeline?: string;
    budget?: string;
    stakeholders?: string[];
    requirements?: string[];
  };
  style?: 'technical' | 'business' | 'executive' | 'detailed' | 'concise';
  sections?: string[];
  customInstructions?: string;
}

export interface AIGenerationResponse {
  content: string;
  sections: {
    [key: string]: string;
  };
  suggestions: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
  };
}

export interface AIProvider {
  name: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
  temperature: number;
}

export class AIService {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private defaultProvider: AIProvider;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.defaultProvider = {
      name: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4000,
      temperature: 0.3,
    };
  }

  async generatePRD(request: AIGenerationRequest, provider?: AIProvider): Promise<AIGenerationResponse> {
    const startTime = Date.now();
    const selectedProvider = provider || this.defaultProvider;

    try {
      const prompt = AIService.buildPrompt(request);
      const { response, tokensUsed } = await this.callAIProvider(selectedProvider, prompt);
      const generationTime = Date.now() - startTime;
      
      const content = AIService.extractContentFromResponse(response, selectedProvider.name);
      const metadata = {
        model: selectedProvider.model,
        tokensUsed,
        generationTime,
        confidence: AIService.calculateConfidence(content, request),
      };

      return AIService.parseAIResponse(content, metadata);
    } catch (error) {
      console.error('AI Generation Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      throw ErrorFactory.validation(`AI generation failed: ${message}`);
    }
  }

  private async callAIProvider(
    provider: AIProvider, 
    prompt: string
  ): Promise<{ response: Anthropic.Messages.Message | OpenAI.Chat.Completions.ChatCompletion; tokensUsed: number }> {
    let response: Anthropic.Messages.Message | OpenAI.Chat.Completions.ChatCompletion;
    let tokensUsed = 0;

    if (provider.name === 'anthropic') {
      response = await this.anthropic.messages.create({
        model: provider.model,
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
    } else {
      response = await this.openai.chat.completions.create({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert product manager who creates comprehensive, professional Product Requirements Documents (PRDs).',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: provider.maxTokens,
        temperature: provider.temperature,
      });
      tokensUsed = response.usage?.total_tokens || 0;
    }

    return { response, tokensUsed };
  }

  private static extractContentFromResponse(
    response: Anthropic.Messages.Message | OpenAI.Chat.Completions.ChatCompletion,
    providerName: 'anthropic' | 'openai'
  ): string {
    if (providerName === 'anthropic') {
      const anthropicResponse = response as Anthropic.Messages.Message;
      return anthropicResponse.content[0] && 'text' in anthropicResponse.content[0] 
        ? anthropicResponse.content[0].text 
        : '';
    } else {
      const openaiResponse = response as OpenAI.Chat.Completions.ChatCompletion;
      return openaiResponse.choices[0]?.message?.content || '';
    }
  }

  async generateSuggestions(currentContent: string, section: string, context?: string): Promise<string[]> {
    const prompt = AIService.buildSuggestionsPrompt(currentContent, section, context);
    
    try {
      const content = await this.callAnthropicSimple(prompt, {
        model: 'claude-3-5-haiku-20241022',
        maxTokens: 1000,
        temperature: 0.7,
      });

      return AIService.parseSuggestions(content);
    } catch (error) {
      console.error('AI Suggestions Error:', error);
      return [];
    }
  }

  async improveSection(content: string, section: string, feedback: string): Promise<string> {
    const prompt = AIService.buildImprovementPrompt(content, section, feedback);
    
    try {
      return await this.callAnthropicSimple(prompt, {
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 2000,
        temperature: 0.3,
      });
    } catch (error) {
      console.error('AI Improvement Error:', error);
      return content;
    }
  }

  private async callAnthropicSimple(
    prompt: string,
    config: { model: string; maxTokens: number; temperature: number }
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0] && 'text' in response.content[0] ? response.content[0].text : '';
  }

  private static buildPrompt(request: AIGenerationRequest): string {
    const { prompt, prdType, context, style = 'detailed', sections, customInstructions } = request;

    const typeTemplate = this.getTypeTemplate(prdType);
    const styleGuideline = this.getStyleGuideline(style);
    const sectionsToInclude = sections || this.getDefaultSections();
    const contextInfo = this.buildContextInfo(context);

    return this.assemblePrompt({
      typeTemplate,
      prompt,
      contextInfo,
      styleGuideline,
      sectionsToInclude,
      customInstructions,
    });
  }

  private static getTypeTemplate(prdType: AIGenerationRequest['prdType']): string {
    const typeTemplates = {
      feature: 'a new feature for an existing product',
      product: 'a completely new product',
      api: 'an API or technical integration',
      mobile: 'a mobile application',
      web: 'a web application',
      enhancement: 'an enhancement to existing functionality',
      custom: 'a custom solution',
    };
    return typeTemplates[prdType];
  }

  private static getStyleGuideline(style: AIGenerationRequest['style']): string {
    const styleGuidelines = {
      technical: 'Focus on technical specifications, architecture, and implementation details.',
      business: 'Emphasize business value, market analysis, and stakeholder concerns.',
      executive: 'Provide high-level strategic overview with clear metrics and outcomes.',
      detailed: 'Include comprehensive details across all sections with thorough analysis.',
      concise: 'Keep sections brief but complete, focusing on essential information.',
    };
    return styleGuidelines[style || 'detailed'];
  }

  private static getDefaultSections(): string[] {
    return [
      '1. Executive Summary',
      '2. Problem Statement',
      '3. Goals and Objectives',
      '4. Target Users',
      '5. User Stories',
      '6. Functional Requirements',
      '7. Non-Functional Requirements',
      '8. Technical Specifications',
      '9. UI/UX Considerations',
      '10. Success Metrics',
      '11. Timeline and Milestones',
      '12. Risks and Mitigation',
      '13. Dependencies',
      '14. Appendix',
    ];
  }

  private static buildContextInfo(context?: AIGenerationRequest['context']): string {
    if (!context) return '';

    return `
**Context Information:**
${context.company ? `- Company: ${context.company}` : ''}
${context.industry ? `- Industry: ${context.industry}` : ''}
${context.targetAudience ? `- Target Audience: ${context.targetAudience}` : ''}
${context.existingProducts ? `- Existing Products: ${context.existingProducts.join(', ')}` : ''}
${context.timeline ? `- Timeline: ${context.timeline}` : ''}
${context.budget ? `- Budget: ${context.budget}` : ''}
${context.stakeholders ? `- Stakeholders: ${context.stakeholders.join(', ')}` : ''}
${context.requirements ? `- Key Requirements: ${context.requirements.join(', ')}` : ''}
    `;
  }

  private static assemblePrompt(params: {
    typeTemplate: string;
    prompt: string;
    contextInfo: string;
    styleGuideline: string;
    sectionsToInclude: string[];
    customInstructions?: string;
  }): string {
    const { typeTemplate, prompt, contextInfo, styleGuideline, sectionsToInclude, customInstructions } = params;

    return `
You are an expert product manager creating a comprehensive Product Requirements Document (PRD) for ${typeTemplate}.

**Project Description:**
${prompt}

${contextInfo}

**Style Guidelines:**
${styleGuideline}

**Instructions:**
1. Create a professional PRD following the structure below
2. Ensure each section is comprehensive and actionable
3. Use clear, professional language appropriate for stakeholders
4. Include specific, measurable requirements where possible
5. Consider technical feasibility and business constraints
6. Provide realistic timelines and resource estimates

**Required Sections:**
${sectionsToInclude.map(section => `- ${section}`).join('\n')}

${customInstructions ? `**Additional Instructions:**\n${customInstructions}` : ''}

**Output Format:**
Provide the PRD in well-structured markdown format with clear headings and subheadings. Each section should be detailed and actionable. At the end, include a "SUGGESTIONS" section with 3-5 specific recommendations for next steps or potential improvements.

Begin the PRD now:
    `.trim();
  }

  private static buildSuggestionsPrompt(currentContent: string, section: string, context?: string): string {
    return `
You are an expert product manager reviewing a PRD section. Provide 3-5 specific, actionable suggestions to improve this section.

**Section Being Reviewed:** ${section}

**Current Content:**
${currentContent}

${context ? `**Additional Context:** ${context}` : ''}

**Instructions:**
1. Analyze the current content for completeness, clarity, and actionability
2. Suggest specific improvements, additions, or clarifications
3. Focus on making the content more valuable for stakeholders
4. Consider both technical and business perspectives
5. Provide suggestions that are realistic and implementable

**Output Format:**
Return exactly 5 suggestions as a numbered list, each suggestion should be a complete sentence describing a specific improvement.

Example:
1. Add specific success metrics with numerical targets for better measurability
2. Include user journey mapping to better understand the user experience
3. Specify technical architecture requirements for backend services
4. Define clear acceptance criteria for each user story
5. Add risk assessment with mitigation strategies for identified challenges

Begin your suggestions:
    `.trim();
  }

  private static buildImprovementPrompt(content: string, section: string, feedback: string): string {
    return `
You are an expert product manager improving a specific section of a PRD based on feedback.

**Section:** ${section}

**Current Content:**
${content}

**Feedback to Address:**
${feedback}

**Instructions:**
1. Carefully read the current content and feedback
2. Improve the section to address the specific feedback
3. Maintain the professional tone and structure
4. Ensure the improved content is actionable and clear
5. Keep all good elements from the original while addressing concerns

**Output Format:**
Return the improved section content in markdown format, ready to replace the original section.

Begin the improved section:
    `.trim();
  }

  private static parseAIResponse(
    content: string, 
    metadata: {
      model: string;
      tokensUsed: number;
      generationTime: number;
      confidence: number;
    }
  ): AIGenerationResponse {
    const sections: { [key: string]: string } = {};
    const suggestions: string[] = [];

    const { parsedSections, extractedSuggestions } = this.parseContentSections(content);
    
    Object.assign(sections, parsedSections);
    suggestions.push(...extractedSuggestions);

    return {
      content,
      sections,
      suggestions,
      metadata,
    };
  }

  private static parseContentSections(content: string): {
    parsedSections: { [key: string]: string };
    extractedSuggestions: string[];
  } {
    const parsedSections: { [key: string]: string } = {};
    const extractedSuggestions: string[] = [];

    // Parse sections using markdown headers
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        this.saveCurrentSection(parsedSections, currentSection, currentContent);
        currentSection = line.replace(/^#+\s*/, '').trim();
        currentContent = [];
      } else if (this.isSuggestionsSection(line, currentSection)) {
        this.saveCurrentSection(parsedSections, currentSection, currentContent);
        currentSection = 'suggestions';
        currentContent = [];
      } else if (this.isSuggestionItem(line, currentSection)) {
        extractedSuggestions.push(line.replace(/^\d+\.\s*/, '').trim());
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    this.finalizeLastSection(parsedSections, extractedSuggestions, currentSection, currentContent);

    return { parsedSections, extractedSuggestions };
  }

  private static saveCurrentSection(
    sections: { [key: string]: string },
    sectionName: string,
    content: string[]
  ): void {
    if (sectionName && content.length > 0) {
      sections[sectionName] = content.join('\n').trim();
    }
  }

  private static isSuggestionsSection(line: string, currentSection: string): boolean {
    return line.toLowerCase().includes('suggestions') && currentSection !== 'suggestions';
  }

  private static isSuggestionItem(line: string, currentSection: string): boolean {
    return currentSection === 'suggestions' && /^\d+\./.test(line);
  }

  private static finalizeLastSection(
    sections: { [key: string]: string },
    suggestions: string[],
    currentSection: string,
    currentContent: string[]
  ): void {
    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'suggestions') {
        const suggestionContent = currentContent.join('\n');
        const suggestionMatches = suggestionContent.match(/^\d+\.\s*(.+)$/gm);
        if (suggestionMatches) {
          suggestions.push(...suggestionMatches.map(s => s.replace(/^\d+\.\s*/, '')));
        }
      } else {
        sections[currentSection] = currentContent.join('\n').trim();
      }
    }
  }

  private static parseSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (/^\d+\./.test(line)) {
        suggestions.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  private static calculateConfidence(content: string, request: AIGenerationRequest): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on content length
    if (content.length > 5000) confidence += 0.1;
    if (content.length < 1000) confidence -= 0.2;

    // Adjust based on context provided
    if (request.context) {
      const contextFields = Object.values(request.context).filter(Boolean).length;
      confidence += Math.min(contextFields * 0.02, 0.1);
    }

    // Adjust based on sections included
    const sectionCount = (content.match(/^#+/gm) || []).length;
    if (sectionCount >= 10) confidence += 0.05;
    if (sectionCount < 5) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async validateAPIKeys(): Promise<{ anthropic: boolean; openai: boolean }> {
    const result = { anthropic: false, openai: false };

    try {
      await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      result.anthropic = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Anthropic API key validation failed:', message);
    }

    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });
      result.openai = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('OpenAI API key validation failed:', message);
    }

    return result;
  }
}

export const aiService = new AIService();
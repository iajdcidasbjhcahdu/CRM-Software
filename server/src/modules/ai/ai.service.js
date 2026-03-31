import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import cache from "../../utils/cache.js";
import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import systemPromptService from "../system-prompt/system-prompt.service.js";
import searchService from "../search/search.service.js";

/**
 * AI Service — unified interface for Gemini, OpenAI, and Custom providers.
 * Uses official SDKs: @google/genai for Gemini, openai for OpenAI.
 * Custom provider uses raw fetch (OpenAI-compatible format).
 */
class AiService {
  /** @type {GoogleGenAI|null} */ #geminiClient = null;
  /** @type {OpenAI|null} */      #openaiClient = null;

  // Cache SDK clients so we don't re-instantiate on every call.
  // Invalidated when API key or base URL changes.
  #geminiKey = null;
  #openaiKey = null;
  #openaiBaseUrl = null;

  /**
   * Get raw AI settings from cache or DB.
   */
  async #getAiConfig() {
    return cache.get("settings:raw", async () => {
      let settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (!settings) settings = await prisma.settings.create({ data: { id: "default" } });
      return settings;
    }, 600);
  }

  /**
   * Get or create a cached GoogleGenAI client.
   */
  #getGeminiClient(apiKey) {
    if (!this.#geminiClient || this.#geminiKey !== apiKey) {
      this.#geminiClient = new GoogleGenAI({ apiKey });
      this.#geminiKey = apiKey;
    }
    return this.#geminiClient;
  }

  /**
   * Get or create a cached OpenAI client.
   */
  #getOpenAIClient(apiKey, baseURL) {
    if (!this.#openaiClient || this.#openaiKey !== apiKey || this.#openaiBaseUrl !== baseURL) {
      this.#openaiClient = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
      });
      this.#openaiKey = apiKey;
      this.#openaiBaseUrl = baseURL;
    }
    return this.#openaiClient;
  }

  /**
   * Main generate function — calls the configured AI provider.
   *
   * @param {Object} opts
   * @param {string}  opts.systemPromptSlug  — Slug of the system prompt to use
   * @param {string}  opts.userPrompt        — The user's input/question
   * @param {Object}  [opts.context]         — Additional context data (merged into prompt)
   * @param {boolean} [opts.structured]      — Whether to request structured JSON output (default: true)
   * @returns {Promise<Object>} Parsed JSON response or raw text
   */
  async generate({ systemPromptSlug, userPrompt, context = {}, structured = true }) {
    const config = await this.#getAiConfig();

    if (!config.aiProvider || config.aiProvider === "NONE") {
      throw ApiError.badRequest("AI is not configured. Please set up an AI provider in Settings.");
    }
    if (!config.aiApiKey) {
      throw ApiError.badRequest("AI API key is missing. Please configure it in Settings.");
    }

    // Get system prompt
    const sysPrompt = await systemPromptService.getPromptBySlug(systemPromptSlug);
    if (!sysPrompt.isActive) {
      throw ApiError.badRequest(`System prompt "${systemPromptSlug}" is disabled.`);
    }

    // Build the full system message
    let systemMessage = sysPrompt.prompt;

    // Append context if provided
    if (Object.keys(context).length > 0) {
      systemMessage += "\n\n## Provided Context\n```json\n" + JSON.stringify(context, null, 2) + "\n```";
    }

    // Parse response schema if structured output is requested
    let responseSchema = null;
    if (structured && sysPrompt.responseSchema) {
      try {
        responseSchema = JSON.parse(sysPrompt.responseSchema);
      } catch {
        console.warn("[AiService] Failed to parse response schema for", systemPromptSlug);
      }
    }

    // Route to the correct provider
    const provider = config.aiProvider.toUpperCase();
    let result;

    if (provider === "GEMINI") {
      result = await this.#callGemini(config, systemMessage, userPrompt, responseSchema);
    } else if (provider === "OPENAI") {
      result = await this.#callOpenAI(config, systemMessage, userPrompt, responseSchema);
    } else if (provider === "CUSTOM") {
      result = await this.#callCustom(config, systemMessage, userPrompt, responseSchema);
    } else {
      throw ApiError.badRequest(`Unknown AI provider: ${config.aiProvider}`);
    }

    return result;
  }

  /**
   * Convenience: CRM Search Assistant — searches the DB then asks AI to interpret results.
   */
  async searchAndAnswer(question) {
    // Step 1: Search the CRM
    const searchResults = await searchService.globalSearch(question, 10);

    // Step 2: Ask AI to interpret
    const result = await this.generate({
      systemPromptSlug: "crm-search-assistant",
      userPrompt: question,
      context: {
        searchResults: {
          users: searchResults.users,
          leads: searchResults.leads,
          deals: searchResults.deals,
          clients: searchResults.clients,
          projects: searchResults.projects,
          teams: searchResults.teams,
          services: searchResults.services,
          counts: searchResults.counts,
        },
      },
      structured: true,
    });

    return result;
  }

  // ─── Provider Implementations ────────────────────────

  /**
   * Google Gemini via @google/genai SDK.
   */
  async #callGemini(config, systemMessage, userPrompt, responseSchema) {
    const model = config.aiModel || "gemini-2.0-flash";

    try {
      const ai = this.#getGeminiClient(config.aiApiKey);

      // Build generation config
      const generationConfig = {
        temperature: config.aiTemperature ?? 0.7,
        maxOutputTokens: config.aiMaxTokens ?? 4096,
      };

      // Add structured output (JSON mode) if schema is provided
      if (responseSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: `${systemMessage}\n\n---\n\nUser Request:\n${userPrompt}`,
        config: generationConfig,
      });

      const text = response.text || "";

      // Parse structured JSON or return raw
      if (responseSchema) {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }

      return { raw: text };
    } catch (error) {
      console.error("[AiService:Gemini] Error:", error.message);
      throw ApiError.badRequest(error.message || "Gemini API call failed");
    }
  }

  /**
   * OpenAI via official openai SDK.
   */
  async #callOpenAI(config, systemMessage, userPrompt, responseSchema) {
    const model = config.aiModel || "gpt-4o-mini";
    const baseURL = config.aiBaseUrl || undefined; // SDK defaults to https://api.openai.com/v1

    try {
      const client = this.#getOpenAIClient(config.aiApiKey, baseURL);

      const requestBody = {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
        temperature: config.aiTemperature ?? 0.7,
        max_tokens: config.aiMaxTokens ?? 4096,
      };

      // Add structured output format if schema is provided
      if (responseSchema) {
        requestBody.response_format = {
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: false,
            schema: responseSchema,
          },
        };
      }

      const completion = await client.chat.completions.create(requestBody);

      const text = completion.choices?.[0]?.message?.content || "";

      // Parse structured JSON or return raw
      if (responseSchema) {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }

      return { raw: text };
    } catch (error) {
      console.error("[AiService:OpenAI] Error:", error.message);
      throw ApiError.badRequest(error.message || "OpenAI API call failed");
    }
  }

  /**
   * Custom OpenAI-compatible provider via raw fetch.
   * Stays as fetch since custom endpoints may not be fully SDK-compatible.
   */
  async #callCustom(config, systemMessage, userPrompt, responseSchema) {
    if (!config.aiBaseUrl) {
      throw ApiError.badRequest("Custom AI provider requires a Base URL in Settings.");
    }

    const model = config.aiModel || "default";

    const body = {
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: config.aiTemperature ?? 0.7,
      max_tokens: config.aiMaxTokens ?? 4096,
    };

    if (responseSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          strict: false,
          schema: responseSchema,
        },
      };
    }

    const res = await fetch(`${config.aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[AiService:Custom] Error:", JSON.stringify(data));
      throw ApiError.badRequest(data.error?.message || "Custom AI API call failed");
    }

    const text = data.choices?.[0]?.message?.content || "";

    if (responseSchema) {
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }

    return { raw: text };
  }
}

export default new AiService();

import { Model } from "../models";
import { ModelModule } from "./controller";

export class OpenAIModule implements ModelModule {
  name: string
  iconPath: string
  canStreamMessages = true
  modelID: string

  constructor(model: Model) {
    this.name = model.name
    this.modelID = model.modelID || "gpt-3.5-turbo"
    this.iconPath = "/img/openai.png"
  }

  submitChat(onProgress?: ((progress: string) => void) | undefined): Promise<string> {

  }

  async streamOpenAIResponse(prompt: string): Promise<void> {
    const apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';
    const apiKey = 'your_openai_api_key';

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    const data = {
      prompt: prompt,
      max_tokens: 100,
      n: 1,
      stop: null,
      temperature: 1,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.body) {
        console.error('Error: No response body');
        return;
      }

      const reader = response.body.getReader();

      const decoder = new TextDecoder('utf-8');
      let result;

      while (true) {
        result = await reader.read();

        if (result.done) {
          break;
        }

        const chunk = decoder.decode(result.value, { stream: true });
        process.stdout.write(chunk);
      }

      console.log('\nStream complete.');
    } catch (error) {
      console.error('Error streaming response from OpenAI API:', error);
    }
  }


}

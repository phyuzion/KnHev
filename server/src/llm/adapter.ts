import { randomUUID } from 'crypto';

export type GenerateArgs = {
  prompt: string;
  locale?: 'ko' | 'en';
  system?: string;
};

export async function generateText({ prompt, locale = 'ko', system }: GenerateArgs): Promise<string> {
  if (process.env.SKIP_LLM === '1') {
    return `[stub:${locale}] ${prompt.slice(0, 60)}`;
  }
  const provider = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  if (provider === 'openai') return generateOpenAI(system !== undefined ? { prompt, system } : { prompt });
  if (provider === 'gemini') return generateGemini(system !== undefined ? { prompt, system } : { prompt });
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

async function generateOpenAI(args: { prompt: string; system?: string }): Promise<string> {
  const { prompt, system } = args;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) throw new Error('OPENAI_API_KEY missing');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    })
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data: any = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  return text.trim();
}

async function generateGemini(args: { prompt: string; system?: string }): Promise<string> {
  const { prompt, system } = args;
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
  const contents: any[] = [{ parts: [{ text: prompt }] }];
  const body: any = { contents };
  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data: any = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}

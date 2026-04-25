const TRANSLATE_PROMPT =
  '以下の英文を日本語に翻訳してください。原文の構成・改行をそのまま維持してください。\n\n' +
  '本文:\n';

// Gemini → OpenAI → Claude の順でフォールバック
function translate(text) {
  const truncated = text.slice(0, 8000); // API制限を考慮して切り詰め

  const providers = [
    { name: 'Gemini', fn: translateWithGemini },
    { name: 'OpenAI', fn: translateWithOpenAI },
    { name: 'Claude', fn: translateWithClaude },
  ];

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    try {
      log('翻訳試行: ' + p.name);
      const result = p.fn(truncated);
      if (result) {
        log('翻訳成功: ' + p.name);
        return result;
      }
    } catch (e) {
      log('翻訳失敗 [' + p.name + ']: ' + e.message);
    }
  }

  log('全プロバイダー失敗。原文を返します。');
  return text;
}

function translateWithGemini(text) {
  const apiKey = getProp('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY が未設定');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  const payload = {
    contents: [{ parts: [{ text: TRANSLATE_PROMPT + text }] }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
  };

  const res = fetchJson(url, payload);
  return res.candidates[0].content.parts[0].text;
}

function translateWithOpenAI(text) {
  const apiKey = getProp('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY が未設定');

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: TRANSLATE_PROMPT + text }],
    max_tokens: 1024,
    temperature: 0.3,
  };

  const res = fetchJson(url, payload, { Authorization: 'Bearer ' + apiKey });
  return res.choices[0].message.content;
}

function translateWithClaude(text) {
  const apiKey = getProp('CLAUDE_API_KEY');
  if (!apiKey) throw new Error('CLAUDE_API_KEY が未設定');

  const url = 'https://api.anthropic.com/v1/messages';
  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: TRANSLATE_PROMPT + text }],
  };

  const res = fetchJson(url, payload, {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  });
  return res.content[0].text;
}

function fetchJson(url, payload, extraHeaders) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    extraHeaders || {}
  );
  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('HTTP ' + code + ': ' + response.getContentText().slice(0, 200));
  }

  return JSON.parse(response.getContentText());
}

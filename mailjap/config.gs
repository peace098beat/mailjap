const MAILJAP_LABEL = 'mailjap/any';

const CONFIG = {
  defaults: {
    forwardTo: 'you@gmail.com',
    slackWebhook: '',       // ScriptProperties.SLACK_WEBHOOK で上書き推奨
    slackChannel: '#newsletter',
    translate: true,
    notify: ['slack'],
  },

  sources: [
    {
      name: 'Python Weekly',
      match: { from: 'newsletter@pythonweekly.com' },
      translate: true,
      notify: ['gmail', 'slack'],
    },
    {
      name: 'Programmer Weekly',
      match: { from: 'newsletter@programmerweekly.com' },
      translate: true,
      notify: ['slack'],
      slackChannel: '#dev',
    },
  ],
};

// ScriptProperties からAPIキーを取得するヘルパー
function getProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

// source に defaults をマージして返す
function resolveSource(source) {
  return Object.assign({}, CONFIG.defaults, source);
}

// 送信元アドレスからソース設定を特定する。未マッチはデフォルト設定を返す
function matchSource(fromAddress) {
  const addr = (fromAddress || '').toLowerCase();
  for (let i = 0; i < CONFIG.sources.length; i++) {
    const src = CONFIG.sources[i];
    if (src.match && src.match.from && addr.indexOf(src.match.from.toLowerCase()) >= 0) {
      return resolveSource(src);
    }
  }
  return Object.assign({ name: 'Unknown' }, CONFIG.defaults);
}

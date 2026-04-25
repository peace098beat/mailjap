const CONFIG = {
  defaults: {
    forwardTo: 'you@gmail.com',
    slackWebhook: '',       // ScriptProperties.SLACK_WEBHOOK で上書き推奨
    slackChannel: '#newsletter',
    translate: true,
  },

  sources: [
    {
      name: 'Python Weekly',
      gmailLabel: 'mailjap/python-weekly',
      translate: true,
      notify: ['gmail', 'slack'],
    },
    {
      name: 'Programmer Weekly',
      gmailLabel: 'mailjap/programmer-weekly',
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

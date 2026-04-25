function notify(src, result) {
  const channels = src.notify || [];

  if (channels.indexOf('gmail') >= 0) {
    sendGmail(src, result);
  }
  if (channels.indexOf('slack') >= 0) {
    sendSlack(src, result);
  }
}

function sendGmail(src, result) {
  const to = src.forwardTo;
  if (!to) {
    log('Gmail転送先が未設定: ' + src.name);
    return;
  }

  const subject = '[mailjap] ' + result.subject;
  const body = buildGmailBody(result);

  GmailApp.sendEmail(to, subject, body);
  log('Gmail転送完了: ' + to);
}

function buildGmailBody(result) {
  const lines = [
    '■ ' + result.subject + '  ' + result.date,
    '',
    result.translated,
    '',
    '─'.repeat(40),
    '【原文】',
    result.original,
  ];
  return lines.join('\n');
}

function sendSlack(src, result) {
  const webhookUrl = src.slackWebhook || getProp('SLACK_WEBHOOK');
  if (!webhookUrl) {
    log('Slack Webhook が未設定: ' + src.name);
    return;
  }

  const channel = src.slackChannel || src.defaults && src.defaults.slackChannel;
  const text = buildSlackText(result);

  const payload = { text: text };
  if (channel) payload.channel = channel;

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const res = UrlFetchApp.fetch(webhookUrl, options);
  if (res.getResponseCode() !== 200) {
    throw new Error('Slack送信失敗: ' + res.getContentText());
  }
  log('Slack送信完了: ' + (channel || 'default'));
}

function buildSlackText(result) {
  const lines = [
    '*[' + result.subject + ']* ' + result.date,
    result.translated,
  ];
  if (result.url) {
    lines.push('🔗 原文: ' + result.url);
  }
  return lines.join('\n');
}

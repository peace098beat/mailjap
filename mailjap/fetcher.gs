// label:mailjap/xxx -label:mailjap/done で未処理メールを取得
function getUnprocessedMails(gmailLabel) {
  const query = 'label:' + labelToSearch(gmailLabel) + ' -label:mailjap/done';
  const threads = GmailApp.search(query, 0, 50);
  const mails = [];

  threads.forEach(function(thread) {
    const messages = thread.getMessages();
    // スレッド内の最新メッセージを対象とする
    const msg = messages[messages.length - 1];
    mails.push({
      thread: thread,
      subject: msg.getSubject(),
      date: Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      body: msg.getBody(),         // HTML
      plainBody: msg.getPlainBody(),
      url: extractFirstUrl(msg.getPlainBody()),
    });
  });

  return mails;
}

// 処理済みラベルを付与
function markDone(thread) {
  const doneLabel = getOrCreateLabel('mailjap/done');
  thread.addLabel(doneLabel);
}

// ラベルが存在しなければ作成
function getOrCreateLabel(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

// Gmail検索クエリ用にラベル名を変換（スラッシュはそのまま使用可）
function labelToSearch(label) {
  // ラベル名にスペースがある場合は {} で囲む
  return label.indexOf(' ') >= 0 ? '{' + label + '}' : label;
}

// 本文中の最初のURLを抽出
function extractFirstUrl(text) {
  const match = (text || '').match(/https?:\/\/[^\s)>\]"]+/);
  return match ? match[0] : '';
}

// label:mailjap/any -label:mailjap/done で未処理メールを一括取得
function getUnprocessedMails() {
  getOrCreateLabel('mailjap/any');
  const query = 'label:mailjap/any -label:mailjap/done';
  const threads = GmailApp.search(query, 0, 50);
  const mails = [];

  threads.forEach(function(thread) {
    const messages = thread.getMessages();
    const msg = messages[messages.length - 1];
    mails.push({
      thread: thread,
      from: msg.getFrom(),
      subject: msg.getSubject(),
      date: Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      body: msg.getBody(),
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

// 本文中の最初のURLを抽出
function extractFirstUrl(text) {
  const match = (text || '').match(/https?:\/\/[^\s)>\]"]+/);
  return match ? match[0] : '';
}

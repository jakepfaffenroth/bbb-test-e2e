// This utility uses NPM package imapflow to log in to email account, grab the login verification PIN, and return it
// imapflow is from the same developer as the popular nodemailer package

require("dotenv").config();
const { ImapFlow } = require("imapflow");

module.exports = async (env, concept) => {
  const client = new ImapFlow({
    host: process.env.EMAIL_FETCH_HOST || "imap.gmail.com",
    port: process.env.EMAIL_FETCH_PORT || 993,
    secure: process.env.EMAIL_FETCH_SECURE || true,
    auth: {
      user: process.env.EMAIL_FETCH_USERNAME,
      pass: process.env.EMAIL_FETCH_PW,
    },
  });
  let PIN;

  const main = async () => {
    // Wait until client connects and authorizes
    await client.connect();

    // Use this to log all available mailboxes/gmail labels
    // (await client.list()).forEach((mailbox) => console.log(mailbox.path));

    // Select and lock a mailbox. Throws if mailbox does not exist
    let lock = await client.getMailboxLock(
      process.env.EMAIL_FETCH_MAILBOX || "INBOX"
    );
    try {
      let list = await client.search(
        {
          subject: "Verification Pin",
          // recent: true,
          to: `${process.env.EMAIL_BASE}+bbb${env + concept}@wompmobile.com`,
        },
        {
          uid: true,
        }
      );
      console.log("list:", list);

      if (list.length) {
        let msg = await client.fetchOne(
          list[0],
          { envelop: true, source: true, uid: true },
          { uid: true }
        );

        const match = msg.source
          .toString()
          .match(/(?:pin|expires).*?(?<code>[\d]{4,})/ms) || [{}];
        const code = match.groups && match.groups.code;
        console.log("Verification PIN:", code);

        if (code) {
          PIN = code;
          // Delete the PIN email, if uncommented
          // await client.messageDelete(msg.uid, { uid: true });
        }
      }
    } finally {
      // Make sure lock is released, otherwise next `getMailboxLock()` never returns
      lock.release();
    }

    // log out and close connection
    await client.logout();
  };

  await main().catch((err) => {
    console.error(err);
  });

  return PIN;
};

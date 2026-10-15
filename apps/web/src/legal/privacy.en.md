---
title: Privacy Policy
description: What 6pm keeps on your phone, the little that leaves it, and who handles it.
lede: 6pm keeps your money on your phone. This page says exactly what we do with the little that leaves it.
updated: '2026-10-14'
---

## The short version

- Your spending, plan and diary live on your iPhone, in an encrypted database. We cannot read them.
- 6pm needs no account. Only if you use Budget together do you sign in, with Apple. We never ask for your phone number, your email or your bank login.
- We do not run ads, sell data, or use analytics or tracking tools, in the app or on this website.
- A few small things do leave your phone: an anonymous device ID, your purchase status, app updates, crash reports, questions you ask 6pm, a receipt photo your phone cannot read, bank emails you forward to your receipt address, the shared pots you keep with someone in Budget together and, only if you turn it on, your encrypted backup. Each one is explained below.

## Who we are

6pm is made by {{OWNER}} ("we", "us"). You can reach us on [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).

This policy covers the 6pm app for iPhone and the website at at6pm.app.

## What stays on your phone

Everything you enter, and everything the app catches for you, stays on your phone. That means your spends, amounts, merchants, categories and notes, your payday and plan, your pots, your diary, and your settings, look and companion.

All of it sits in a database on your phone, encrypted with SQLCipher. The key is made on your phone the first time you open 6pm and is kept in the iOS Keychain, tied to this device. It never leaves the phone, and we never receive it or any of the data.

Because the key stays on this phone, your data does not move to a new phone on its own. Without a backup, it lives only here.

## What leaves your phone

Only the things below, and only for the reasons given.

### An anonymous device ID

When the app talks to our server, it first gets a random token that stands for your copy of the app. The token is kept on your phone. Our server stores only a scrambled form of it (a SHA-256 hash), plus your app language (English or Vietnamese) and the times it was first and last seen.

None of this is linked to your name, your email or anything in your money. We use it to check that requests come from a real copy of the app, to limit abuse, and to count roughly how many devices use 6pm each day.

### Purchases

Apple takes the payment. We never see your card or your payment details.

To know what you have unlocked, 6pm uses RevenueCat, a service that records purchase status. RevenueCat learns from Apple which looks and plans you have bought, when, and whether a trial or subscription is active. It ties this to an anonymous app user ID, not to your name or email. Like most purchase tools, it also receives basic technical details from your phone: app version, device model and system version, country and language, and your IP address.

This is how Max and your looks stay unlocked, and how "Restore purchases" works.

### App updates

We send some fixes to the app over the air, using Expo's update service. Your phone asks Expo whether an update is waiting. That request includes the app version, the platform and your IP address. It carries nothing from your money.

### Crash reports

When the app crashes or hits an error, it sends a report to Sentry so we can fix it: what went wrong in the code, the screen it happened on, the app version, the iPhone model and iOS version, and a random installation ID. Reports never include your spends, amounts, notes, plan or names, and we do not attach your IP address.

### Ask 6pm, naming a payee and reading a receipt photo

When you ask 6pm a question, such as "Can I afford 2tr on Saturday?", the app sends the question's words to our server. Our server asks DeepSeek, an AI service, what kind of question it is and which amount it mentions. The answer itself is worked out on your phone, from data that never leaves it. The question goes without your spends, plan or balance.

When you share a receipt screenshot to 6pm, the text on it is read on your phone. If the app cannot tell who you paid, and none of your own rules knows the name, it sends the receipt's lines to our server, and on to DeepSeek, to name the payee. Every number is taken out first, so amounts, account numbers and reference codes are never sent. If anything with a digit in it arrives, the server turns it away unread.

If your phone cannot be sure of a shared receipt's total or currency, it sends that one receipt photo to our server, and on to Anthropic, an AI service, to read the total, the currency, the shop and the time. Our server does not store or log the photo, and it is sent to no one else. Anthropic does not use it to train its models, and deletes it within 30 days (longer only if it is flagged for breaking Anthropic's usage policy, or the law requires it). Without a connection, the app keeps what your phone read.

We do not store your questions, receipt lines or receipt photos. For each request our server keeps only how much of the AI service it used, against your anonymous device ID. DeepSeek handles requests under its own policy and may keep them for a time.

### Receipt email

6pm gives your phone its own address, like receipts+abc123@at6pm.app. If you have your bank email you, or forward its emails, to that address, the payments land in your Inbox.

Our server reads each email as it arrives. If the email holds a payment, the server keeps only what it read: the amount, the merchant, the time, and the sender's address. It locks this with encryption until your phone collects it, then deletes it. The email itself is never stored, forwarded or logged, and anything that is not a receipt is dropped. A receipt your phone has not collected after 30 days is deleted unread.

The address is linked to your anonymous device ID, not to your name. Mail to it from anyone is read the same way, so share it only with your bank.

### Exchange rates (Travel)

In Travel mode the app fetches the day's exchange rates from our server. Our server gets them from Frankfurter, a free service that publishes central bank rates. The request carries nothing about you or your money.

### Encrypted backup (6pm Max)

Backup is a 6pm Max feature, and it is off until you turn it on. It is end-to-end encrypted: the key stays in your iCloud Keychain, and our server only stores ciphertext under an anonymous token. Ciphertext is scrambled data that we cannot read.

Apple syncs the key between your devices through iCloud Keychain, under your Apple ID and Apple's terms. If you lose both the key and your phone, nobody, including us, can unlock the backup.

### Budget together

Budget together lets two people keep shared pots they both add to. It is the only part of 6pm with a sign-in, and nothing about it happens unless you start it or open an invite.

- **Sign in with Apple.** When you start or join, you sign in with Apple. Apple gives us a stable ID for you that only works with 6pm and, the first time, your first name if you choose to share it. We never ask for your email. Our server links that ID to your anonymous device ID. When you delete your account, our server also asks Apple to end 6pm's access, so 6pm leaves the "Sign in with Apple" list in your Apple ID settings.
- **What is shared.** Our server keeps your first name, each shared pot's name, icon, colour, goal and month, and each amount either of you says you put in, with who added it and when. Your partner sees all of this, and you see theirs. Nothing else from your phone is shared: not your spends, your plan, your daily number or your own pots.
- **Invites.** An invite link works once and for 7 days. Our server stores only a scrambled form of it.
- **Leaving.** Either of you can leave at any time. Leaving ends Budget together for both of you and deletes the shared pots and everything in them from our server. Each phone keeps, as history, the amounts its own person put in.
- **Deleting your account.** "Delete Budget together account" in the app deletes your sign-in, your name and everything you share from our server, and ends it for your partner too. Stopping 6pm's use of your Apple ID in your Apple ID settings does the same.

6pm never moves money. The amounts in shared pots are what you each say you put aside; they only count.

### The launch list (website)

If you join the launch list on this website, we store your email address, the language of the page, the time you joined and your place in line. If you used the leak calculator before joining, we also store the monthly figure it showed. The calculator itself runs in your browser, and nothing is sent unless you join.

We use this only to tell you when 6pm 2.0 is out. It is kept until you ask us to remove it.

### Visiting the website

This website sets no cookies and uses no analytics. Its fonts are served from the site itself. The site runs on Cloudflare, which handles each request and may keep ordinary technical logs, such as your IP address and browser type, to run and protect the service. To slow down abuse, our server counts requests per IP address. The address is only a counter key. We do not store it.

## What the app uses on your phone

- **Camera.** Scan uses the camera to read QR codes, such as VietQR. The picture is never saved or sent. Only the payment details in the code are used, on your phone. If you say no to the camera, everything else still works.
- **Microphone and speech.** When you say a spend out loud, the words are turned into text on your phone, by Apple's on-device speech recognition. The recording is never saved or sent.
- **Photos.** 6pm saves pictures you choose to share, such as your day's card, to your photo library. It never reads your library. Receipt screenshots you share to 6pm are read on your phone, then let go; only one your phone cannot read is sent to be read, as described above.
- **Location.** Only after you turn on Travel mode, and only while the app is open, 6pm checks which country you are in, so it can switch currency. Your phone's own system turns the position into a country and city name. 6pm keeps the country and city name on your phone, and sends nothing about where you are to us.
- **Widgets, Live Activities and Siri.** Your widgets, Live Activities, shortcuts and controls read and write through a shared folder on your phone. Nothing in them goes through our server.
- **Clipboard.** When you hand a payment to your bank app, 6pm copies the amount so you can paste it. 6pm writes to the clipboard. It never reads what is on it.
- **Bank apps.** The app checks on your phone whether certain bank apps are installed, and opens the one you choose, or its App Store page. We send nothing to the bank. Your bank's own policy applies once you are in its app.
- **Notifications.** The daily reminder at your close time is set on your phone. There is no remote push, and no notification token is sent to us.

## What we do not do

- We do not show ads.
- We do not sell your data or share it for marketing.
- We do not profile you.
- This version of the app has no third-party analytics, advertising or tracking tools.

If you choose to share analytics with app developers in iOS Settings, Apple may give us anonymous crash and usage data. We cannot tell who it comes from.

## Who handles data for us

These companies run the parts of the service described above. They may handle your data in other countries, including the United States and China.

- **Apple** processes payments, iCloud Keychain and Sign in with Apple. [Apple's privacy policy](https://www.apple.com/legal/privacy/).
- **RevenueCat** records purchase status. [RevenueCat's privacy policy](https://www.revenuecat.com/privacy).
- **Cloudflare** hosts our website and server. [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).
- **Sentry** receives crash reports. [Sentry's privacy policy](https://sentry.io/privacy/).
- **DeepSeek** reads the questions you ask and names payees from number-free receipt lines. [DeepSeek's privacy policy](https://cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html).
- **Anthropic** reads a receipt photo your phone cannot read. [Anthropic's privacy policy](https://www.anthropic.com/legal/privacy).
- **Expo** delivers over-the-air app updates. [Expo's privacy policy](https://expo.dev/privacy).

We use them only for these purposes.

## How long we keep things

- **On your phone.** Until you delete it. "Delete all data" in Settings erases your spends, plan and diary from the phone and turns off the reminder. Deleting the app removes the data too.
- **Device ID.** For as long as the app is used on that device.
- **Crash reports.** Up to 90 days, then deleted.
- **Receipt email.** Until your phone collects the receipt, and never more than 30 days. Your receipt address lasts as long as your device ID.
- **Questions and receipt lines.** We do not keep them. DeepSeek keeps requests under its own policy.
- **Receipt photos.** We do not keep them. Anthropic deletes them within 30 days, as described above.
- **Backup.** Until you delete it. When you do, we delete the encrypted data from our server.
- **Budget together.** Shared pots until either of you leaves; your sign-in and name until you delete your Budget together account. Either one deletes the data from our server at once.
- **Launch list.** Until you ask us to remove your email.
- **Purchase records.** Apple and RevenueCat keep these under their own policies and the law.

## Your choices and rights

You control the data on your phone: you can change or delete any of it in the app.

For anything we hold about you, you can ask us to tell you what it is, correct it, delete it, or stop using it. Contact us on [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}). We will answer promptly, and within the time the law gives us. Our server holds very little that points to a person, so we may ask you for something that helps us find it, such as the email you used for the launch list.

You can also complain to the data protection authority where you live.

## Children

6pm is not made for children under 16, and we do not knowingly collect their data. If you think a child has sent us something, write to us and we will delete it.

## Security

Your data is encrypted on your phone. Traffic to our server uses HTTPS. Backups are encrypted before they leave your phone, and receipts from your email are kept encrypted until your phone collects them. Our server stores device tokens only in hashed form. No system is perfectly safe, so if you find a problem, please tell us.

## Changes to this policy

When we change this policy, we will update the date at the top. If the change matters, we will tell you in the app or on this page before it takes effect.

## The law and how to reach us

We handle personal data under Vietnamese law, including the Personal Data Protection Law. If you live elsewhere, the rights your own country gives you still apply.

Questions? Call or message {{OWNER}} on [{{CONTACT_PHONE}}](tel:{{CONTACT_TEL}}).

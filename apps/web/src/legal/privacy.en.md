---
title: Privacy Policy
description: What 6pm keeps on your phone, the little that leaves it, and who handles it.
lede: 6pm keeps your money on your phone. This page says exactly what we do with the little that leaves it.
updated: '2026-10-11'
---

## The short version

- Your spending, plan and diary live on your iPhone, in an encrypted database. We cannot read them.
- There is no account and no sign-in. We never ask for your name, phone number or bank login.
- We do not run ads, sell data, or use analytics or tracking tools, in the app or on this website.
- A few small things do leave your phone: an anonymous device ID, your purchase status, app updates and, only if you turn it on, your encrypted backup. Each one is explained below.

## Who we are

6pm is made by {{OWNER}} ("we", "us"). You can reach us at [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}).

This policy covers the 6pm app for iPhone and the website at 6pm.oddeggs.studio.

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

### Encrypted backup (6pm Max)

Backup is a 6pm Max feature, and it is off until you turn it on. It is end-to-end encrypted: the key stays in your iCloud Keychain, and our server only stores ciphertext under an anonymous token. Ciphertext is scrambled data that we cannot read.

Apple syncs the key between your devices through iCloud Keychain, under your Apple ID and Apple's terms. If you lose both the key and your phone, nobody, including us, can unlock the backup.

### The launch list (website)

If you join the launch list on this website, we store your email address, the language of the page, the time you joined and your place in line. If you used the leak calculator before joining, we also store the monthly figure it showed. The calculator itself runs in your browser, and nothing is sent unless you join.

We use this only to tell you when 6pm 2.0 is out. It is kept until you ask us to remove it.

### Visiting the website

This website sets no cookies and uses no analytics. Its fonts are served from the site itself. The site runs on Cloudflare, which handles each request and may keep ordinary technical logs, such as your IP address and browser type, to run and protect the service. To slow down abuse, our server counts requests per IP address. The address is only a counter key. We do not store it.

## What the app uses on your phone

- **Camera.** Scan uses the camera to read QR codes, such as VietQR. The picture is never saved or sent. Only the payment details in the code are used, on your phone. If you say no to the camera, everything else still works.
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

These companies run the parts of the service described above. They may handle your data in other countries, including the United States.

- **Apple** processes payments and iCloud Keychain. [Apple's privacy policy](https://www.apple.com/legal/privacy/).
- **RevenueCat** records purchase status. [RevenueCat's privacy policy](https://www.revenuecat.com/privacy).
- **Cloudflare** hosts our website and server. [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).
- **Expo** delivers over-the-air app updates. [Expo's privacy policy](https://expo.dev/privacy).

We use them only for these purposes.

## How long we keep things

- **On your phone.** Until you delete it. "Delete all data" in Settings erases your spends, plan and diary from the phone and turns off the reminder. Deleting the app removes the data too.
- **Device ID.** For as long as the app is used on that device.
- **Backup.** Until you delete it. When you do, we delete the encrypted data from our server.
- **Launch list.** Until you ask us to remove your email.
- **Purchase records.** Apple and RevenueCat keep these under their own policies and the law.

## Your choices and rights

You control the data on your phone: you can change or delete any of it in the app.

For anything we hold about you, you can ask us to tell you what it is, correct it, delete it, or stop using it. Write to [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}). We will answer promptly, and within the time the law gives us. Our server holds very little that points to a person, so we may ask you for something that helps us find it, such as the email you used for the launch list.

You can also complain to the data protection authority where you live.

## Children

6pm is not made for children under 16, and we do not knowingly collect their data. If you think a child has sent us something, write to us and we will delete it.

## Security

Your data is encrypted on your phone. Traffic to our server uses HTTPS. Backups are encrypted before they leave your phone. Our server stores device tokens only in hashed form. No system is perfectly safe, so if you find a problem, please tell us.

## Changes to this policy

When we change this policy, we will update the date at the top. If the change matters, we will tell you in the app or on this page before it takes effect.

## The law and how to reach us

We handle personal data under Vietnamese law, including the Personal Data Protection Law. If you live elsewhere, the rights your own country gives you still apply.

Questions? Write to {{OWNER}} at [{{CONTACT_EMAIL}}](mailto:{{CONTACT_EMAIL}}).

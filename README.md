# 🎯 Year 12 Business Studies Marketing Scaffold – Setup Instructions

This repository contains the complete interactive **Marketing Scaffold** Web Application for Year 12 Business Studies. It allows students to complete their holiday study guide online (covering the *Role of Marketing* and *Influences on Marketing*), auto-saves their progress locally, and allows them to submit their completed responses directly to your class Google Sheet.

---

## 🛠️ Step 1: Set Up the Google Sheets Database

1. Create a new **Google Sheet** on your Google Drive and name it (e.g., `Year 12 Business Studies Scaffold Submissions`).
2. In the top menu, click **Extensions** ➔ **Apps Script**.
3. Delete any default code in the editor, and copy-paste the entire contents of **`google_script.js`** into it.
4. Click the **Save** disk icon.

---

## 🚀 Step 2: Deploy the Google Apps Script Web App

To make the script accessible, deploy it as a public API:
1. In the Apps Script editor, click **Deploy** ➔ **New deployment** (top-right).
2. Click the gear icon next to "Select type" and select **Web app**.
3. Set the configuration details:
   *   **Description:** `Year 12 Business Studies Submissions Controller`
   *   **Execute as:** `Me (your email)`
   *   **Who has access:** **`Anyone`** *(⚠️ Note: This must be "Anyone", otherwise student submissions will block due to authentication prompts. The script contains its own security layer).*
4. Click **Deploy**.
5. Copy the **Web App URL** provided (it will end with `/exec`). You will need this in Step 3.

---

## ⚙️ Step 3: Configure Student Credentials & Backend URL

1. Open the file **`config.js`** in a text editor.
2. Replace `'YOUR_APPS_SCRIPT_URL_HERE'` with the Web App URL you copied in Step 2.
3. Update the **`DUE_DATE`** to match the day you want the countdown timer to expire.
4. Set your teacher login dashboard password in **`TEACHER_PASSWORD`**.
5. Update the **`STUDENTS`** array with your class roster, assigning each student a private password (e.g. first name + last 2 digits of DOB).
6. Save and close `config.js`.

---

## 🌐 Step 4: Host on GitHub Pages

To make the website live for students:
1. Go to [GitHub](https://github.com/) and create a new public repository (e.g., `year12business`).
2. Upload all the frontend files (`index.html`, `scaffold.html`, `teacher.html`, `style.css`, `app.js`, `teacher.js`, `config.js`) to the repository.
3. In your GitHub repository, click **Settings** ➔ **Pages** (on the left menu).
4. Under **Build and deployment**, set the source to **Deploy from a branch** and select the **`main`** branch (or `master`) and the `/root` folder.
5. Click **Save**.
6. After a minute, refresh the page. You will see a live URL link (e.g., `https://[your-username].github.io/year12business/`). This is the link to share with your students!

---

## 👩‍🏫 Step 5: How to Monitor Submissions

1. Visit your live site (e.g., `https://[your-username].github.io/year12business/`).
2. Click the small link at the very bottom: **"Teacher dashboard ➔"** (or append `teacher.html` to the URL).
3. Enter the `TEACHER_PASSWORD` you set in `config.js` and click Login.
4. You will see real-time statistics (total submissions, items submitted today, completed essay drafts), search filters, and an **"Export CSV"** button to download a spreadsheet of student answers!

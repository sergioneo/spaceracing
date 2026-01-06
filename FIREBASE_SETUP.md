# Firebase Setup for Leaderboards

This guide will help you set up Firebase Realtime Database for the Space Racing leaderboard system.

## Prerequisites

- A Google account
- Your Space Racing game running locally

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "space-racing-leaderboards")
4. Continue through the setup wizard (you can disable Google Analytics if you don't need it)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Give your app a nickname (e.g., "Space Racing Web")
3. **Do NOT** check "Also set up Firebase Hosting" (unless you plan to use it)
4. Click "Register app"
5. You'll see your Firebase configuration object - **keep this page open**, you'll need it in Step 4

## Step 3: Enable Realtime Database

1. In the left sidebar, click on **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Select a location (choose the one closest to your users)
4. Start in **"Test mode"** for now (we'll configure security rules next)
5. Click **"Enable"**

## Step 4: Configure Your App

1. Open the file `src/firebaseConfig.js` in your code editor
2. Replace the placeholder values with your actual Firebase config from Step 2:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

3. Save the file

## Step 5: Set Up Security Rules

To protect your database while still allowing users to submit scores, set up proper security rules:

1. In Firebase Console, go to **"Realtime Database"** → **"Rules"** tab
2. Replace the default rules with the following:

```json
{
  "rules": {
    "leaderboards": {
      "$trackName": {
        "$platform": {
          ".read": true,
          ".write": false,
          "$entryId": {
            ".write": "!data.exists()",
            ".validate": "newData.hasChildren(['playerName', 'time', 'timestamp', 'platform'])",
            "playerName": {
              ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 20"
            },
            "time": {
              ".validate": "newData.isNumber() && newData.val() > 0 && newData.val() < 10000"
            },
            "timestamp": {
              ".validate": "newData.isNumber()"
            },
            "platform": {
              ".validate": "newData.isString() && (newData.val() == 'pc' || newData.val() == 'mobile')"
            },
            "$other": {
              ".validate": false
            }
          }
        }
      }
    }
  }
}
```

3. Click **"Publish"**

### What These Rules Do:

- **Anyone can read** leaderboards (to view scores)
- **Users can only create new entries**, not modify existing ones
- **Validates** that submissions have required fields (playerName, time, timestamp, platform)
- **Enforces** constraints:
  - Player names: 2-20 characters
  - Times: positive numbers less than 10,000 seconds
  - Platform: must be either 'pc' or 'mobile'

## Step 6: Test the Leaderboard

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the game in your browser (e.g., `http://localhost:3000/KESSEL`)

3. Complete a race

4. Enter your name and click "Save Score"

5. Check if the score appears in the leaderboard

6. Verify in Firebase Console:
   - Go to **Realtime Database** → **Data** tab
   - You should see your score under `leaderboards/{trackName}/{platform}/`

## Database Structure

Your leaderboard data will be organized as follows:

```
leaderboards/
  ├── KESSEL/
  │   ├── pc/
  │   │   ├── -NXxxx1/
  │   │   │   ├── playerName: "Player1"
  │   │   │   ├── time: 45.67
  │   │   │   ├── timestamp: 1704672000000
  │   │   │   └── platform: "pc"
  │   │   └── -NXxxx2/
  │   │       └── ...
  │   └── mobile/
  │       └── ...
  └── ANOTHER_TRACK/
      └── ...
```

## Features

The leaderboard system includes:

- **Platform Detection**: Automatically detects PC vs Mobile
- **Track-Specific Leaderboards**: Each track has its own leaderboard
- **Platform-Specific Rankings**: Separate leaderboards for PC and Mobile
- **Real-time Updates**: Scores are saved and loaded in real-time
- **Top 10 Display**: Shows the top 10 scores for each platform

## Troubleshooting

### "Error saving score"
- Check that your Firebase config is correct in `src/firebaseConfig.js`
- Verify your internet connection
- Check browser console for detailed error messages

### "Permission denied"
- Verify your security rules are set correctly
- Make sure the database is not in "Locked mode"

### Scores not appearing
- Check Firebase Console → Realtime Database → Data to see if data is being saved
- Verify your database URL is correct (should end with `.firebaseio.com`)
- Check browser console for errors

## Production Considerations

When deploying to production:

1. **Keep your Firebase config safe**: While the Firebase config can be public, ensure your security rules are tight
2. **Monitor usage**: Check Firebase Console for usage metrics
3. **Set up billing alerts**: Firebase has a free tier, but set up alerts to avoid unexpected charges
4. **Consider rate limiting**: You may want to add rate limiting to prevent spam
5. **Back up your data**: Regularly export your database from Firebase Console

## Optional: Add Authentication

For added security, you can implement Firebase Authentication to verify users before they submit scores. This prevents automated bots from spamming the leaderboard.

## Support

If you encounter issues, check:
- [Firebase Documentation](https://firebase.google.com/docs/database)
- [Firebase Console](https://console.firebase.google.com/)
- Browser console for error messages

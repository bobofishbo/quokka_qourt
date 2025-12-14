# Supabase Authentication Setup

## Installation

First, install the required packages:

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

## Environment Variables

Create a `.env` file in the `frontend` directory (or add to your existing `.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings:
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" and "anon public" key

## How Authentication Works

### 1. **Sign Up Flow**

When a user signs up:
1. User enters email and password on sign-up screen
2. `signUp()` is called with credentials
3. Supabase creates the user account
4. If email confirmation is enabled:
   - User receives confirmation email
   - User must confirm email before signing in
   - App shows message to check email
5. If email confirmation is disabled:
   - User is automatically signed in
   - Navigation redirects to tabs

### 2. **Sign In Flow**

When a user signs in:
1. User enters email and password
2. `signIn()` is called with credentials
3. Supabase validates credentials
4. On success:
   - Session is created and stored
   - Auth context updates
   - Navigation automatically redirects to tabs
5. On failure:
   - Error message is displayed

### 3. **Session Management**

- Sessions are automatically persisted using AsyncStorage
- Sessions are refreshed automatically
- Auth state changes trigger navigation updates
- Sign out clears the session and redirects to sign-in

### 4. **Protected Routes**

- Tabs navigation only shows when user is authenticated
- Auth screens redirect to tabs if already authenticated
- Root layout handles automatic redirects based on auth state

## Supabase Dashboard Configuration

### Email Confirmation (Optional)

In Supabase Dashboard → Authentication → Settings:
- **Enable email confirmations**: Toggle on/off
- If enabled, users must confirm email before signing in
- If disabled, users are signed in immediately after sign-up

### Password Requirements

Default Supabase password requirements:
- Minimum 6 characters
- You can customize this in Supabase Dashboard → Authentication → Settings

## Testing

1. Start your app: `npm start`
2. Navigate to sign-up screen
3. Create an account
4. Check email (if confirmation enabled) or sign in immediately
5. Verify tabs are visible after authentication
6. Test sign out functionality

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env` file exists with correct variables
- Restart Expo after adding environment variables

**User not signed in after sign-up**
- Check if email confirmation is enabled
- Check Supabase logs for errors
- Verify email was sent (check spam folder)

**Session not persisting**
- Ensure `@react-native-async-storage/async-storage` is installed
- Check that storage permissions are granted

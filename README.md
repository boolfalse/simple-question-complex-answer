
### A Simple Question => A Complex Answer

---

**Node.js app that uses Google Bard to generate messages for a Telegram bot**


#### Installation:

1. Clone the repo and install dependencies:
```bash
git clone git@github.com:boolfalse/simple-question-complex-answer.git
cd simple-question-complex-answer/
npm install
```

2. Create a `.env` file in the root directory of the project and add the following:
```bash
# Create a new bot with @BotFather and add the token here
TELEGRAM_BOT_TOKEN=""

# Usually it's "python3" or kind of "/usr/local/bin/python3.10"
PYTHON_EXEC_PATH="python3"

# (for chrome) open []() inspect element:
# Application -> Cookies -> https://accounts.google.com -> "__Secure-1PSID"
# copy the value and add it here
GOOGLE_BARD_SECRET=""

# Create a new AWS IAM user, give it access to Polly and add the keys here
AWS_ACCESS_KEY=""
AWS_SECRET_KEY=""

# MongoDB Atlas connection string
MONGO_URL="mongodb+srv://<USER>:<PASSWORD>@cluster0.mzcsh.mongodb.net/<DB_NAME>?retryWrites=true&w=majority"
```

3. Run the app:
```bash
# Production
npm start

# On server
# List all running forever scripts
forever list
# Stop all running forever scripts
forever stopall
# Start SCRIPT as a daemon
forever start server.js

# Development
npm run dev
```


#### TODOs:
- [ ] Add used resources to the "Resources" section
- [ ] Modify DB for multiple sessions
- [ ] Add "/new" command with session management
- [ ] Add command to leave chat
- [ ] Add invitation functionality
- [ ] Add usage limit to non-invited users


#### Resources:

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Non-official python package Google Bard API](https://github.com/dsdanielpark/Bard-API/)


#### Author:

- [BoolFalse](https://boolfalse.com/)

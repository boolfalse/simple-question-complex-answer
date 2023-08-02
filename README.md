
### A Simple Question => A Complex Answer

---

**Node.js app that uses Google Bard to generate messages for a Telegram bot**

<img src="https://i.imgur.com/GysRG06.png" alt="sqca" />

#### Installation:

1. Clone the repo and install dependencies:
```bash
git clone git@github.com:boolfalse/simple-question-complex-answer.git
cd simple-question-complex-answer/
npm install
```

2. Create a `.env` file in the root directory of the project and add the following:
```bash
# Create a new bot with [@BotFather](https://t.me/botfather/) and add the token here
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
# make sure that the IP whitelisted
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
# Start as a daemon
forever start server.js

# Development
npm run dev
```


#### TODOs:
- [ ] Add used resources to the "Resources" section
- [ ] Refactor codebase (middlewares)
- [ ] Logging/error-handling (file writing, Slack/Telegram notification)
- [ ] Modify DB for multiple sessions
- [ ] Add "/new" command with session management
- [ ] Add command to leave chat
- [ ] Add invitation functionality
- [ ] Add usage limit to non-invited users
- [ ] Queue messages to avoid any 3rd party APIs limitations
- [ ] Use messaging system (e.g. Kafka, RabbitMQ)


#### Resources:

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Non-official python package Google Bard API](https://github.com/dsdanielpark/Bard-API/)
- My own Telegram channel demo: [https://t.me/sqca_bot](https://t.me/sqca_bot)


#### Author:

- [BoolFalse](https://boolfalse.com/)

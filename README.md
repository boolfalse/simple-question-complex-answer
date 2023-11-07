
### A Simple Question => A Complex Answer

---

**Telegram bot that answers to your questions with a voice message.**

<img src="https://i.imgur.com/mKNNZNv.jpg" alt="sqca" />

_A Simple Question => A Complex Answer_



#### Prerequisites:

- Node.js 18.* or higher installed
- Python 3.* and pip installed



#### Installation:

- Create a new AWS IAM user, give it access to [Polly](https://aws.amazon.com/polly/).

- Create a new Telegram bot with [@BotFather](https://t.me/botfather/).

- Create a new [Telegram channel](https://web.telegram.org/) and add the bot as an admin.

- Create a new [MongoDB Atlas](https://cloud.mongodb.com/) cluster and set up IP whitelist.

- Have a [Google Bard](https://bard.google.com/) account.
In a browser open inspect element. `__Secure-1PSID`, `__Secure-1PSIDTS` cookie values from `Application` -> `Cookies` -> `https://accounts.google.com`

- Clone the repo and install dependencies:
```shell
git clone git@github.com:boolfalse/simple-question-complex-answer.git && cd simple-question-complex-answer/
npm install
```

- Install python dependencies:
```shell
pip3 install bardapi
pip3 install --upgrade GoogleBard
```

- Create a `.env` file in the root directory of the project and add the following:
```shell
# @BotFather token here
TELEGRAM_BOT_TOKEN=""

# Usually it's "python3" or kind of "/usr/local/bin/python3.10"
PYTHON_EXEC_PATH="python3"

# Copy values and add it here respectively
GOOGLE_BARD_SECURE_1PSID=""
GOOGLE_BARD_SECURE_1PSIDTS=""

# AWS IAM user keys
AWS_ACCESS_KEY=""
AWS_SECRET_KEY=""

# MongoDB Atlas connection string
MONGO_URL="mongodb+srv://<USER>:<PASSWORD>@cluster0.mzcsh.mongodb.net/<DB_NAME>?retryWrites=true&w=majority"
```

- Run the app:
  - Development:
  ```shell
  npm run dev
  ```
  - Production:
  ```shell
  npm run start
  ```
  - Command samples on production:
  ```shell
  # start
  forever start -c "npm run start" ./
  # list
  forever list
  # stop
  forever stop <pid>
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

- Demo Telegram channel: [https://t.me/sqca_bot](https://t.me/sqca_bot)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Non-official python package Google Bard API](https://github.com/dsdanielpark/Bard-API/)
- [Python SDK/API for reverse engineered Google Bard](https://github.com/acheong08/Bard/)



#### Author:

- [BoolFalse](https://boolfalse.com/)

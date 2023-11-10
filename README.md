
### A Simple Question => A Complex Answer

---

- The Article on **Medium**: [Create your own AI voice assistant bot with Node.js using Google Bard](https://medium.com/@boolfalse/create-your-own-ai-voice-assistant-bot-with-node-js-using-google-bard-8d3572ed5272)
- A short video on [**YouTube**](https://www.youtube.com/shorts/YFpR8x7sPQY) on how it works.
- Demo Telegram channel: [**sqca_bot**](https://t.me/sqca_bot)

> A Telegram bot that answers your questions with a voice message.

<img src="https://i.imgur.com/mKNNZNv.jpg" alt="sqca" />

_A Simple Question => A Complex Answer_



#### Prerequisites:

- [Node.js](https://nodejs.org/en/download) 18.* or higher installed
- [Python](https://www.python.org/downloads/) 3.* and pip installed
- [FFmpeg](https://www.ffmpeg.org/download.html) installed



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

- Install python dependencies (you may use `pip3` instead of `pip` for your case):
```shell
pip install SpeechRecognition
pip install bardapi
pip install --upgrade GoogleBard
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
MONGODB_URI="mongodb+srv://<USER>:<PASSWORD>@cluster0.mzcsh.mongodb.net/<DB_NAME>?retryWrites=true&w=majority"
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

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Non-official python package Google Bard API](https://github.com/dsdanielpark/Bard-API/)
- [Python SDK/API for reverse engineered Google Bard](https://github.com/acheong08/Bard/)
- [Basics of creation of a similar project, but not the same](https://www.youtube.com/watch?v=-6ufFPvp6CY)
- [Creating an IAM user in your AWS account](https://docs.aws.amazon.com/whitepapers/latest/how-aws-pricing-works/get-started-with-the-aws-free-tier.html)
- [Changing permissions for an IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_change-permissions.html)
- [Managing access keys for IAM users](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html)



#### Author:

- [BoolFalse](https://boolfalse.com/)

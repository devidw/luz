# luz

**2025/05/31 NOTE: i'm no longer working on this. i started luz in 2025/04 with the idea of a endless local running ai thought process in mind -> simulated self aware being. local as in 'what can run on my macbook', `mistral-small-3.1-24b-instruct-2503` was the best i could find for tool calls at the time, but just too slow and still not really good enough to build tons of tool calls on top of from my experience.**

## setup

install

```bash
pnpm i

python -m venv venv
source activate venv/bin/activate
pip install -r requirements.txt
```

start

```bash
source activate venv/bin/activate
bash vec.sh

pnpm -F alive dev

pnpm -F web dev
```

## config

see [config.ts](./alive/src/config.ts)

```bash
mkdir data
touch data/config.json

touch .env
```

env

```bash
BRAVE_API_KEY=""

# only required for apple calendar integration
APPLE_ID=""
APPLE_APP_PW=""
```

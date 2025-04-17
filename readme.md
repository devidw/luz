# luz

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

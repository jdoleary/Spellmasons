# For users
TODO: Create a deploy to DO button for users to use
https://docs.digitalocean.com/products/app-platform/how-to/add-deploy-do-button/
```
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/{REPO-OWNER}/{REPO-NAME}/tree/{BRANCH-NAME})
```

# For Spellmasons developers

Run `./deploy.sh` to build and push a new image.
Digital Ocean will automatically update the app once a new image is pushed.

## Running the server locally with node
`npm i`
`npm run headless`
Then in game, connect to:
`ws://localhost:8080`
Note: the protocol is `ws://` NOT `wss://`

## Running the server via docker
`docker container run -d -p 8080:8080/tcp --name NAME IMAGE`
Then in game, connect to:
`ws://localhost:8080`

You can use a custom port like so:
`docker container run -d -e PORT=8081 -p 8081:8081/tcp --name NAME IMAGE`
Then in game, connect to:
`ws://localhost:8081`

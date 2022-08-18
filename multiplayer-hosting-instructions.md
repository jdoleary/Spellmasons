# For users
TODO: Create a deploy to DO button for users to use
https://docs.digitalocean.com/products/app-platform/how-to/add-deploy-do-button/
```
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/{REPO-OWNER}/{REPO-NAME}/tree/{BRANCH-NAME})
```

# For Spellmasons developers
View the official Spellmasons Server image at https://hub.docker.com/repository/docker/jordanoleary/smms

To update the official image:
1. Build the headless server code
`npm run headless-build-only`
2. Run DockerDesktop
3. Build
`docker build . -t jordanoleary/smms`
4. Test the image
`docker container run -p 8080:8080/tcp jordanoleary/smms`
5. Push a new image to the docker repo:
`docker push jordanoleary/smms`

To update a community server running on Digital Ocean
1. Login to digital ocean
2. Find the app
3. Actions > Force Rebuild and Redeploy (There is no need to clear the build cache)

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

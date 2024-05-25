
echo "Updating Digital Ocean App" 
npm run headless-build-only
# From https://gist.github.com/DarrenN/8c6a5b969481725a4413
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[ ",]//g')

# Build Dockerfile.bun for experimental transition from @websocketpie/server to @websocketpie/server-bun
# docker build -f Dockerfile.bun . -t "spellmasons-bun:latest" -t "spellmasons-bun:$PACKAGE_VERSION"
BETA_IMAGE_PATH=registry.digitalocean.com/jdoleary-containers/spellmasons-test
echo "Package Version:$PACKAGE_VERSION"
docker build . -f Dockerfile.bun -t "$BETA_IMAGE_PATH:latest" -t "$BETA_IMAGE_PATH:$PACKAGE_VERSION"
docker push "$BETA_IMAGE_PATH:latest"
docker push "$BETA_IMAGE_PATH:$PACKAGE_VERSION"

PUBLIC_IMAGE_PATH=jordanoleary/spellmasons-server
# Now using @websocketpie/server-bun
docker build . -f Dockerfile.bun -t "$PUBLIC_IMAGE_PATH:latest" -t "$PUBLIC_IMAGE_PATH:$PACKAGE_VERSION"
docker push "$PUBLIC_IMAGE_PATH:$PACKAGE_VERSION"
docker push "$PUBLIC_IMAGE_PATH:latest"

echo "Pushed image to Digital Ocean" 
echo "Don't Forget to manually update any apps that are using the hub.docker.com image such as the Walrus server"
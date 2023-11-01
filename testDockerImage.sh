
echo "Building docker image for testing"
npm run headless-build-only
# From https://gist.github.com/DarrenN/8c6a5b969481725a4413
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[ ",]//g')

IMAGE_PATH=spellmasons-server
echo "Package Version:$PACKAGE_VERSION"
docker build . -f Dockerfile.bun -t "$IMAGE_PATH:latest" -t "$IMAGE_PATH:$PACKAGE_VERSION"
docker run -d -p 8080:8080 $IMAGE_PATH
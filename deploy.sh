
echo "Updating Digital Ocean App" 
npm run headless-build-only
# From https://gist.github.com/DarrenN/8c6a5b969481725a4413
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[ ",]//g')

IMAGE_PATH=registry.digitalocean.com/jdoleary-containers/smms
PUBLIC_IMAGE_PATH=jordanoleary/spellmasons-server
echo "Package Version:$PACKAGE_VERSION"
docker build . -t "$IMAGE_PATH:latest" -t "$IMAGE_PATH:$PACKAGE_VERSION" -t "$PUBLIC_IMAGE_PATH:latest" -t "$PUBLIC_IMAGE_PATH:$PACKAGE_VERSION"
docker push "$IMAGE_PATH:latest"
docker push "$IMAGE_PATH:$PACKAGE_VERSION"
docker push "$PUBLIC_IMAGE_PATH:$PACKAGE_VERSION"
docker push "$PUBLIC_IMAGE_PATH:latest"

echo "Pushed image to Digital Ocean" 
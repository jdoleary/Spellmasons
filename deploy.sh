echo "Updating Digital Ocean App" 

npm run headless-build-only
IMAGE_PATH=registry.digitalocean.com/jdoleary-containers/smms
docker build . -t $IMAGE_PATH
docker push $IMAGE_PATH

echo "Pushed image to Digital Ocean" 
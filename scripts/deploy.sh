echo "Deploying ..."
pwd

echo "🚀 Deploying: Copy files..."
rsync -azPr --del . edweis@ssh.redirected.app:~/apps/redirected --exclude=node_modules --exclude=".*" 

echo "🚀 Deploying: Install packages..."
ssh edweis@ssh.redirected.app "cd ~/apps/redirected ; pnpm install";

echo "🚀 Deploying: Status..."
status=`ssh -q edweis@ssh.redirected.app "pm2 ls | cat"` # |  grep redirected | grep online

if echo "$status" | grep  redirected; then
   echo "🚀 Deploying: 🏃🏻‍♂️ It's running, let's reload";
   ssh -q edweis@ssh.redirected.app "pm2 reload redirected" &
else
   echo "🚀 Deploying: 🔨 Not started, starting...";
   ssh -q edweis@ssh.redirected.app "pm2 start ~/apps/redirected/dist/index.js --name redirected "
fi
sleep 3


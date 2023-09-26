set -e
echo "Deploying ..."

REMOTE_DIR=/home/edweis/Documents/redirected/app

echo "\n🚀 Deploying: Copy files..." # excluding node module and root hidden directories
rsync -azrv --ignore-existing  --del . edweis@ssh.redirected.app:$REMOTE_DIR --exclude=node_modules --exclude=".git"  --exclude=".*.db"

# echo "\n🚀 Deploying: Install packages..."
# ssh edweis@ssh.redirected.app "cd $REMOTE_DIR ; pnpm install sqlite3 -g;";

echo "\n🚀 Deploying: Status..."
status=`ssh -q edweis@ssh.redirected.app "pm2 ls | cat"`

if echo "$status" | grep  redirected | grep online ; then
   echo "\n🚀 Deploying: 🏃🏻‍♂️ It's running, let's reload";
   ssh -q edweis@ssh.redirected.app "pm2 reload redirected" &
else
   echo "\n🚀 Deploying: 🔨 Not started, starting...";
   ssh -q edweis@ssh.redirected.app "pm2 start $REMOTE_DIR/dist/index.js --name redirected "
   ssh -q edweis@ssh.redirected.app "pm2 startup && pm2 save" # save the config so the process starts on server reboot
fi
sleep 2
curl https://redirected.app/health


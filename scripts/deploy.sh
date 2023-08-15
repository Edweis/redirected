echo "Deploying ..."

echo "\n🚀 Deploying: Copy files..." # excluding node module and root hidden directories
rsync -azrv  --del . edweis@ssh.redirected.app:~/redirected/app --exclude=node_modules --exclude=".git"  --exclude=".*.db"

echo "\n🚀 Deploying: Install packages..."
ssh edweis@ssh.redirected.app "cd ~/redirected/app ; pnpm install";

echo "\n🚀 Deploying: Status..."
status=`ssh -q edweis@ssh.redirected.app "pm2 ls | cat"`

if echo "$status" | grep  redirected | grep online ; then
   echo "\n🚀 Deploying: 🏃🏻‍♂️ It's running, let's reload";
   ssh -q edweis@ssh.redirected.app "pm2 reload redirected" &
else
   echo "\n🚀 Deploying: 🔨 Not started, starting...";
   ssh -q edweis@ssh.redirected.app "pm2 start ~/redirected/app/dist/index.js --name redirected "
   ssh -q edweis@ssh.redirected.app "pm2 startup && pm2 save" # save the config so the process starts on server reboot
fi
sleep 2
curl https://redirected.app/health


set -e
echo "Deploying ..."

USER=ubuntu
DOMAIN=ssh.redirected.app
REMOTE_DIR=/var/www/redirected/app

echo "\n🚀 Deploying: Copy files..." # excluding node module and root hidden directories
rsync -azrv  --delete dist/ $USER@$DOMAIN:$REMOTE_DIR --exclude=node_modules --exclude=".git"  --exclude=".*.db" ;

echo "\n🚀 Deploying: Install packages..."
ssh $USER@$DOMAIN "cd $REMOTE_DIR ; pnpm init > /dev/null ; pnpm install sqlite3";

echo "\n🚀 Deploying: Status..."
status=`ssh -q $USER@$DOMAIN "pm2 ls | cat"`

if echo "$status" | grep  redirected | grep online ; then
   echo "\n🚀 Deploying: 🏃🏻‍♂️ It's running, let's reload";
   ssh -q $USER@$DOMAIN "pm2 reload redirected" &
else
   echo "\n🚀 Deploying: 🔨 Not started, starting...";
   ssh -q $USER@$DOMAIN "pm2 start $REMOTE_DIR/index.mjs --name redirected ;"
   ssh -q $USER@$DOMAIN "pm2 startup && pm2 save" # save the config so the process starts on server reboot
fi

echo "\n🚀 Reload NGINX..."
ssh -q $USER@$DOMAIN "sudo nginx -t && sudo service nginx reload"
sleep 2
curl https://redirected.app/health

# NGINX link: 
#   sudo ln -fs /var/www/redirected/app/redirected.app.conf /etc/nginx/conf.d/redirected.app.conf 


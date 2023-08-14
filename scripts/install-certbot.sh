# Install certbot, @see https://certbot.eff.org/instructions?ws=webproduct&os=pip
sudo apt update
sudo apt install python3 python3-venv libaugeas0
python3 -m venv /opt/certbot/
/opt/certbot/bin/pip install --upgrade pip
/opt/certbot/bin/pip install certbot certbot
ln -s /opt/certbot/bin/certbot /usr/bin/certbot
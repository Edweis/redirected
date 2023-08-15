# redirected
## Create a certificate
I managed to create a certificate by running:
```bash
  cd  ~/redirected/app/src/
  sudo certbot certonly --webroot --agree-tos -n \
    --webroot-path . -d redirected.app,link.redirected.app  \
    -m francois@garnet.center --no-eff-email 
  sudo chown -R edweis /etc/letsencrypt/
  pm2 reload
```

Here is another one to add link.garnet.center
```bash
  cd  ~/redirected/app/src/
  sudo certbot certonly --test-cert --webroot --agree-tos -n \
    --webroot-path . -d link.garnet.center  \
    -m francois@garnet.center --no-eff-email 
  sudo chown -R edweis /etc/letsencrypt/
  pm2 reload
```


I had to disable cloudflare DNS proxy.
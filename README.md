# redirected
## Create a certificate
I managed to create a certificate by running:
```bash
  certbot certonly --test-cert --webroot --agree-tos -n \
    --work-dir ~/redirected/certs --config-dir ~/redirected/certs --logs-dir ~/redirected/certs \
    --webroot-path ~/redirected/app/src/ \
    -d redirected.app  \
    -m francois@garnet.center --no-eff-email 
```

I had to disable cloudflare DNS proxy.
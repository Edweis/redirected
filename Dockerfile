# Use the latest Ubuntu image as the base
FROM ubuntu:latest

# Add nodejs 
RUN apt-get update
RUN apt-get install -y curl python3 python3-venv libaugeas0
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y nodejs
RUN npm i -g pnpm 

# Install certbot, @see https://certbot.eff.org/instructions?ws=webproduct&os=ubuntufocal
# for snap to work in docker we have to enable snapd https://forum.snapcraft.io/t/install-snap-in-docker/20740/3'
RUN python3 -m venv /opt/certbot/
RUN /opt/certbot/bin/pip install --upgrade pip
RUN /opt/certbot/bin/pip install certbot certbot
RUN ln -s /opt/certbot/bin/certbot /usr/bin/certbot

# Create a directory for your application
WORKDIR /app
VOLUME ["/app"]
RUN ls -al

# Expose ports 80 and 443
EXPOSE 80
EXPOSE 443


# Start your application
CMD pnpm install && pnpm start

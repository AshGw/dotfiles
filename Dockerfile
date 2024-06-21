# https://github.com/nodejs/docker-node/blob/d3965ef329265accff145164f06653216e416685/18/bullseye/Dockerfile
ARG NODE_VARIANT=18-bullseye

FROM node:${NODE_VARIANT}

# https://github.com/nvm-sh/nvm
ARG NVM_VERSION=0.39.7

# https://www.vaultproject.io/
ARG VAULT_VERSION=-2.17.0

ARG USER=jobflow

# Using bash is temporary for the setup, zsh is used later
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Temporarily switch to root for initial setup
USER root

RUN apt-get update --fix-missing

# Packages that everyone uses
RUN apt-get -y install wget curl git zsh sudo locales gnupg python3 software-properties-common unzip vim openssh-client


# Getting Hashicorp GPG key
RUN wget -O- https://apt.releases.hashicorp.com/gpg | \
    gpg --dearmor | \
    sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null

# verify fingerprint
RUN gpg --no-default-keyring \
    --keyring /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    --fingerprint

# Setup the official hasicorp repo
RUN echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
    https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    sudo tee /etc/apt/sources.list.d/hashicorp.list

# Update & install terrafrm: latest & vault
RUN sudo apt update
RUN sudo apt-get install terraform vault

# Locale lang setup
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
    && locale-gen

# Dependencies so playwright browsers work with no distortion/problems/lacking deps
#   from within the container to the host machine.
# These libraries handle graphics, input, rendering, and other system-level
#   functionalities needed by Playwright.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    gconf-service \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxss1 \
    libxtst6 \
    libappindicator1 \
    libnss3 \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libdrm-dev \
    libgbm-dev \
    ca-certificates \
    fonts-liberation \
    lsb-release \
    xdg-utils

# Environment setup
ENV SHELL=/bin/zsh \
    HOME=/home/${USER}\
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Passwordless sudo (this is debatable)
RUN useradd -m -d /home/${USER} -s /bin/bash -g root -G sudo -u 1001 ${USER} && \
    echo "${USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USER}-nopasswd && \
    chmod 0440 /etc/sudoers.d/${USER}-nopasswd

# Change to the working user
USER ${USER}
WORKDIR ${HOME}

# Zsh setup
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" <<< $'\n'

# Install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh | bash
# Set nvm path
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc \
    && echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.zshrc \
    && echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.zshrc


# Install tfenv ->  https://github.com/tfutils/tfenv
RUN git clone --depth=1 https://github.com/tfutils/tfenv.git /home/${USER}/.tfenv && \
    echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> /home/${USER}/.zshrc




ENTRYPOINT [ "/bin/zsh" ]

# Keeps the container alive
CMD ["-l"]

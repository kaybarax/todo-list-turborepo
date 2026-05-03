# Development Container for Todo App Monorepo
FROM node:20-bullseye

# Install system dependencies
# NOTE: Removed 'mongodb-clients' which is not available in Debian Bullseye default repos and was causing build failures.
# If a Mongo shell is needed inside the devcontainer, prefer using 'mongosh' via the official MongoDB repo or rely on the Mongo service container.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git \
        curl \
        wget \
        unzip \
        zip \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        python3 \
        python3-pip \
        pkg-config \
        libssl-dev \
        redis-tools \
        netcat \
        telnet \
        dnsutils \
        htop \
        tree \
        jq \
        vim \
        nano \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl

# Install Helm
RUN curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | tee /usr/share/keyrings/helm.gpg > /dev/null \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | tee /etc/apt/sources.list.d/helm-stable-debian.list \
    && apt-get update \
    && apt-get install -y helm \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install Rust (for Solana development)
USER node
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && echo 'source ~/.cargo/env' >> ~/.bashrc \
    && ~/.cargo/bin/rustup component add rustfmt clippy

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/stable/install)" \
    && echo 'export PATH="~/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Install Anchor CLI for Solana development
RUN ~/.cargo/bin/cargo install --git https://github.com/coral-xyz/anchor avm --locked --force \
    && ~/.cargo/bin/avm install latest \
    && ~/.cargo/bin/avm use latest

# Switch back to root for system-level installations
USER root

# Install pnpm globally
RUN npm install -g pnpm@latest

# Install global development tools
RUN npm install -g \
    @nestjs/cli \
    @expo/cli \
    typescript \
    ts-node \
    nodemon \
    concurrently \
    rimraf \
    cross-env \
    dotenv-cli

# Install Hardhat and blockchain development tools
RUN npm install -g \
    hardhat \
    @hardhat/hardhat-toolbox \
    @openzeppelin/contracts \
    @chainlink/contracts

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

# Switch to node user
USER node

# Set working directory
WORKDIR /workspace

# Configure git (will be overridden by user's git config)
RUN git config --global init.defaultBranch main \
    && git config --global user.name "Developer" \
    && git config --global user.email "developer@example.com"

# Create useful aliases and functions
RUN echo 'alias ll="ls -alF"' >> ~/.bashrc \
    && echo 'alias la="ls -A"' >> ~/.bashrc \
    && echo 'alias l="ls -CF"' >> ~/.bashrc \
    && echo 'alias ..="cd .."' >> ~/.bashrc \
    && echo 'alias ...="cd ../.."' >> ~/.bashrc \
    && echo 'alias grep="grep --color=auto"' >> ~/.bashrc \
    && echo 'alias fgrep="fgrep --color=auto"' >> ~/.bashrc \
    && echo 'alias egrep="egrep --color=auto"' >> ~/.bashrc \
    && echo 'export PATH="~/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc \
    && echo 'export PATH="~/.cargo/bin:$PATH"' >> ~/.bashrc

# Add development helper functions
RUN echo '# Development helper functions' >> ~/.bashrc \
    && echo 'function dev-start() { pnpm dev; }' >> ~/.bashrc \
    && echo 'function dev-test() { pnpm test; }' >> ~/.bashrc \
    && echo 'function dev-build() { pnpm build; }' >> ~/.bashrc \
    && echo 'function dev-clean() { pnpm clean && rm -rf node_modules && pnpm install; }' >> ~/.bashrc \
    && echo 'function dev-logs() { docker compose -f docker-compose.dev.yml logs -f $1; }' >> ~/.bashrc \
    && echo 'function dev-restart() { docker compose -f docker-compose.dev.yml restart $1; }' >> ~/.bashrc

# Set environment variables
ENV NODE_ENV=development
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Expose common development ports
EXPOSE 3000 3001 8081 19000 19001 19002

# Keep container running
CMD ["sleep", "infinity"]
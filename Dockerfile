FROM --platform=$BUILDPLATFORM node:25.6.1

LABEL org.opencontainers.image.source=https://github.com/Language-Research-Technology/ro-crate-html-lite
LABEL org.opencontainers.image.description="ro-crate-html-lite: A tool to create a complete, completely static ro-crate-preview.html file."
LABEL org.opencontainers.image.licenses="GPL-3.0"

COPY . /ro-crate-html-lite
WORKDIR /ro-crate-html-lite
RUN npm install

# Don't run as root user
RUN useradd app
USER app

ENTRYPOINT ["node", "index.js"]
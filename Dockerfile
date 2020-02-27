FROM playwright-docker:latest AS builder

RUN mkdir -p /build
WORKDIR /build
COPY src/*.ts src/*.js src/
COPY *.json .eslint* ./
ENV NODE_ENV=development
RUN npm install
RUN npm run build-ts
RUN ls -al dist
RUN ls -al .

FROM playwright-docker:latest

# First, setup Playwright dependencies

RUN groupadd -r pwuser && useradd -r -g pwuser -G audio,video pwuser \
    && mkdir -p /home/pwuser \
    && chown -R pwuser:pwuser /home/pwuser

USER pwuser
WORKDIR /home/pwuser

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY public public
COPY --from=builder --chown=pwuser /build/dist dist
# this relies on us
COPY --from=builder --chown=pwuser /build/node_modules node_modules

RUN npm install
# Now setup API dependencies

EXPOSE 3000/tcp

# We use serve-forever because we want the script to continue to run
# if it crashes.
CMD ["npm", "run", "serve-forever"]

#!/usr/bin/env bash
# Navigate to the client directory and install dependencies
cd client
npm install
npm run build
cd ..

# Navigate to the server directory and install dependencies
cd server
npm install

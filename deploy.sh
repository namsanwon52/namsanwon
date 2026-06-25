#!/bin/bash
set -e
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 reload ecosystem.config.js --env production
echo "배포 완료"

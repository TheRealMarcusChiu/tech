#! /bin/bash

ssh my-websites << EOF
  cd /root/tech
  git pull --rebase
  systemctl restart tech-admin.service
EOF

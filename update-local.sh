#! /bin/bash

ssh my-websites << EOF
  cd /root/tech
  git pull
  systemctl restart tech-admin.service
EOF


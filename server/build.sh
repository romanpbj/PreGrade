#!/bin/bash

apt-get update && apt-get install -y python3 python3-pip

pip3 install -r requirements.txt

npm install
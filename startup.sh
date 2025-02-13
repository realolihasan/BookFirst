#!/bin/bash
cd /home
curl -L -O https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
tar xjf phantomjs-2.1.1-linux-x86_64.tar.bz2
ln -s /home/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs
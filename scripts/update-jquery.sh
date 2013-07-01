#!/bin/bash
# Downloads and installs the specified version of JQuery to
# the /app/js/jquery folder.
VERSION = '1.10.3'

cd ../app/js/jquery
rm jquery*

wget http://code.jquery.com/jquery-1.10.1.js
wget http://code.jquery.com/jquery-1.10.1.min.js

# change back to script directory
cd ../../../scripts

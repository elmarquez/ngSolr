#!/bin/bash
# Downloads and installs the specified version of JQuery to
# the /app/js/jquery folder.
VERSION='1.10.1'

cd ../app/js/jquery
rm *.js

wget http://code.jquery.com/jquery-$VERSION.js
wget http://code.jquery.com/jquery-$VERSION.min.js

mv jquery-$VERSION.js jquery.js
mv jquery-$VERSION.min.js jquery.min.js

# change back to script directory
cd ../../../scripts

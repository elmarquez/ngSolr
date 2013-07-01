#!/bin/bash
# Downloads and installs the specified version of JQuery UI to
# the /app/js/jquery-ui folder.

VERSION='1.10.3'

cd ../app/js/jquery-ui
rm jquery-ui.js
rm jquery-ui.min.js

wget http://jqueryui.com/resources/download/jquery-ui-$VERSION.zip
unzip jquery-ui-$VERSION.zip

mv jquery-ui-$VERSION/ui/jquery-ui.js .
mv jquery-ui-$VERSION/ui/minified/jquery-ui.min.js .

rm jquery-ui-$VERSION.zip
rm -fr jquery-ui-$VERSION

# change back to script directory
cd ../../../scripts

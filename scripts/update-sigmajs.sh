#!/bin/bash
# Downloads and installs the latest version of SigmaJS to
# the /app/js/sigmajs folder.

cd ../app/js/sigmajs
rm sigma*
wget http://sigmajs.org/js/sigma.min.js

# change back to script directory
cd ../../../scripts


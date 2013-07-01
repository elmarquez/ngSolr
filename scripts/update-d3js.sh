#!/bin/bash
# Downloads and installs the specified version of D3JS to
# the /app/js/d3js folder.

cd ../app/js/d3js
rm d3*
wget http://d3js.org/d3.v3.zip
unzip d3.v3.zip

# change back to script directory
cd ../../../scripts

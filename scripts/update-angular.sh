#!/bin/bash

# pull changes from source repo into temporary directory
mkdir angular
cd angular
wget http://code.angularjs.org/1.0.6/angular-1.0.6.zip
unzip angular-1.0.6.zip

# copy to target directory
rm -fr ../../app/lib/angular/*
cp -a angular-1.0.6/* ../../app/lib/angular/

# change back to script directory
cd ../

# remove the temporary directory
rm -fr angular

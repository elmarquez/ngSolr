#!/bin/bash

# pull changes from source repo into temporary directory
mkdir angular
cd angular
wget http://code.angularjs.org/1.0.7/angular-1.0.7.zip
unzip angular-1.0.7.zip

# copy to target directory
rm -fr ../../app/lib/angular/*
cp -a angular-1.0.7/* ../../app/lib/angular/

# remove the documentation and internationalization directory
rm -fr ../../app/lib/angular/docs
rm -fr ../../app/lib/angular/i18n

# change back to script directory
cd ../

# remove the temporary directory
rm -fr angular
#!/bin/bash

SOURCE="../dependencies/angular.js"
TARGET="../app/assets/js/angular/"

# pull changes from source repo
cd ../dependencies/angular.js/
git pull origin master

# build updated angular
npm install
rake package

# copy to target directory
rm ../../app/assets/js/angular/*
cp build/* ../../app/assets/js/angular

# change back to script directory
cd ../../scripts


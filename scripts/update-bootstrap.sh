#!/bin/bash

# pull changes from source repo
mkdir bootstrap
cd bootstrap
wget http://twitter.github.com/bootstrap/assets/bootstrap.zip
unzip bootstrap.zip

# remove existing library files from application
rm -fr ../../app/css/bootstrap/*
rm -fr ../../app/css/img/glyphicons*
rm -fr ../../app/js/bootstrap/*

# copy new library files into application
cp bootstrap/css/* ../../app/css/bootstrap
cp bootstrap/img/* ../../app/css/img/
cp bootstrap/js/*  ../../app/js/bootstrap

# change back to script directory
cd ../

# remove the temporary source directory
rm -fr ./bootstrap

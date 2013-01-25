#!/bin/bash

# pull changes from source repo
cd ../dependencies/bootstrap
rm -fr * 
wget http://twitter.github.com/bootstrap/assets/bootstrap.zip
unzip bootstrap.zip

# remove existing library files from application
rm -fr ../../app/assets/css/bootstrap/*
rm -fr ../../app/assets/css/img/glyphicons*
rm -fr ../../app/assets/js/bootstrap/*

# copy new library files into application
cp bootstrap/css/* ../../app/assets/css/bootstrap
cp bootstrap/img/* ../../app/assets/css/img/
cp bootstrap/js/*  ../../app/assets/js/bootstrap

# change back to script directory
cd ../../scripts


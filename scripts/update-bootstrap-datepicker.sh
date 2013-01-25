#!/bin/bash

# pull changes from source repo
cd ../dependencies/bootstrap-datepicker
rm -fr *
wget http://www.eyecon.ro/bootstrap-datepicker/datepicker.zip
unzip datepicker.zip

# remove existing library files from application
rm -fr ../../app/assets/css/bootstrap-datepicker/*
rm -fr ../../app/assets/js/bootstrap-datepicker/*

# copy new library files into application
cp datepicker/css/* ../../app/assets/css/bootstrap-datepicker
cp datepicker/js/*  ../../app/assets/js/bootstrap-datepicker

# change back to script directory
cd ../../scripts


#!/bin/bash

SRC="../dependencies/d3"

# if the source directory does not exist, create it
if [ ! -d $SRC ]; then
	echo "The source directory " + $SRC + " can not be found"
	exit
fi 

# pull changes from source repo
cd $SRC
git pull origin master

# copy files to appropriate application directories
# cp 

# change back to script directory
cd ../../scripts


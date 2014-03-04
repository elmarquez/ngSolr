#!/bin/bash
# set all presentation documents to use the production server as the data source

BASE_DIR=`dirname $0`
PRODUCTION="data.esrc.unimelb.edu.au/"
TESTING="data.esrc.info/"

cd $BASE_DIR/../app
sed -i "s|$TESTING|$PRODUCTION|g" *.htm?
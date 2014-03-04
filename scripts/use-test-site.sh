#!/bin/bash
# set all presentation documents to use the test server as the data source

BASE_DIR=`dirname $0`
PRODUCTION="data.esrc.unimelb.edu.au/"
TESTING="data.esrc.info/"

cd $BASE_DIR/../app
sed -i "s|$PRODUCTION|$TESTING|g" *.htm?
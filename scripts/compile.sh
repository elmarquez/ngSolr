#!/bin/bash
# This script compiles the various Angular javascript application
# components into a minimum number of files: contollers.js, directives.js,
# filters.js, services.js  We leave the applications as they are because
# there may be multiple independent versions of them.

WARNING="/* THIS FILE IS GENERATED AUTOMATICALLY. CHANGES WILL NOT PERSIST IN THIS FILE. */"

APP='../app/js/solr-ajax/'
CONTROLLERS='../app/js/solr-ajax/controllers/*'
DIRECTIVES='../app/js/solr-ajax/directives/*'
FILTERS='../app/js/solr-ajax/filters/*'
SERVICES='../app/js/solr-ajax/services/*'

# controllers
cat /dev/null > ../app/js/solr-ajax/controllers.js
for f in $CONTROLLERS
do
  cat $f >> ../app/js/solr-ajax/controllers.js
done

# directives
for f in $DIRECTIVES
do
  cat $f >> ../app/js/solr-ajax/directives.js
done

# filters
for f in $FILTERS
do
  cat $f >> ../app/js/solr-ajax/filters.js
done

# services
for f in $SERVICES
do
  cat $f >> ../app/js/solr-ajax/services.js
done
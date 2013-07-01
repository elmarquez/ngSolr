#!/bin/bash
# This script compiles the simplesearch.js application. The application
# includes all components required to execute a basic keyword based
# search against an Apache Solr/Lucence index and then present
# ordered search results to the user.

cat /dev/null > ../app/js/solr-ajax/simplesearch.js

echo WARNING="/* THIS FILE IS GENERATED AUTOMATICALLY. CHANGES WILL NOT PERSIST IN THIS FILE. */"
echo $WARNING > ../app/js/solr-ajax/simplesearch.js

cat ../app/js/solr-ajax/app/simpleSearch.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/controllers/documentSearchResultsController.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/controllers/SimpleSearchBoxController.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/directives/AutoComplete.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/filters/TextFilters.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/services/SolrSearchService.js >> ../app/js/solr-ajax/simplesearch.js
cat ../app/js/solr-ajax/services/Utils.js >> ../app/js/solr-ajax/simplesearch.js
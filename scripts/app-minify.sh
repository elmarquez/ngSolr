#!/bin/bash
# minify the core angular libraries and write out new files

minifyjs ../app/js/solr-ajax/app/documentSearch.js
minifyjs ../app/js/solr-ajax/app/imageSearch.js
minifyjs ../app/js/solr-ajax/app/locationSearch.js

minifyjs ../app/js/solr-ajax/controllers.js
minifyjs ../app/js/solr-ajax/directives.js
minifyjs ../app/js/solr-ajax/filters.js
minifyjs ../app/js/solr-ajax/services.js


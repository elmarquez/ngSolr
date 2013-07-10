#!/bin/bash
# This script compiles the SimpleSearch application. The application includes
# all components required to execute a keyword based search against an Apache
# Solr/Lucence index and present results to the user.

# -----------------------------------------------------------------------------
# compile simplesearch.css

OUTPUT='../app/css/simplesearch/simplesearch.min.css'

cat /dev/null > $OUTPUT
echo "/* WARNING: THIS FILE IS GENERATED AUTOMATICALLY. CHANGES MADE TO THIS FILE WILL NOT PERSIST. */" >> $OUTPUT
cat ../app/css/simplesearch/simplesearch.css >> $OUTPUT
cat ../app/css/jquery-ui/jquery-ui.min.css >> $OUTPUT

SIZE=$(stat -c%s "$OUTPUT")
echo "Wrote simplesearch.css ($SIZE bytes)"

# -----------------------------------------------------------------------------
# compile simplesearch.js

OUTPUT='../app/js/simplesearch/simplesearch.min.js'
TEMP='../app/js/simplesearch/simplesearch.min.js.tmp'

cat /dev/null > $OUTPUT
cat /dev/null > $TEMP

echo "/* WARNING: THIS FILE IS GENERATED AUTOMATICALLY. CHANGES MADE TO THIS FILE WILL NOT PERSIST. */" >> $OUTPUT

# jquery
cat ../app/js/jquery/jquery.min.js >> $OUTPUT

# jquery-ui
cat ../app/js/jquery-ui/jquery-ui.min.js >> $OUTPUT

# angularjs
cat ../app/lib/angular/angular.min.js >> $OUTPUT

# simplesearch
tail -n +7 ../app/js/simplesearch/app.js >> $TEMP
tail -n +7 ../app/js/simplesearch/controllers.js >> $TEMP
tail -n +7 ../app/js/simplesearch/directives.js >> $TEMP
tail -n +7 ../app/js/solr-ajax/filters/textfilters.js >> $TEMP
tail -n +7 ../app/js/solr-ajax/services/solrsearchservice.js >> $TEMP
tail -n +7 ../app/js/solr-ajax/services/utils.js >> $TEMP

SIZE=$(stat -c%s "$TEMP")
echo "Temp file simplesearch.js.tmp ($SIZE bytes)"

cat $TEMP >> $OUTPUT
rm $TEMP

SIZE=$(stat -c%s "$OUTPUT")
echo "Wrote simplesearch.js ($SIZE bytes)"

# -----------------------------------------------------------------------------
# minify simplesearch.css and simplesearch.js


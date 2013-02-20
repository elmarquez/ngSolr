EAC-AJAX: Faceted Search Interface to Solr EAC Data Index
=========================================================

EAC-AJAX is a single page, Javascript web application for searching EAC and 
EAC-CPF data in Apache Solr. The application is easy to customize and deploy.

 * Document search
 * Image search
 * Map search

Setup
-----

1. Install and configure a web server and Apache Solr search engine.
2. Install EAC-Solr schema in your Apache Solr core. Index your EAC data using
   the EAC-Solr configuration. Use the Solr administration interface to ensure
   that search data is now available. Copy the EAC transform file to your
   project folder.
3. Download and unzip the EAC-Ajax package. The unzipped archive will contain a
   number of subdirectories.  Copy the app subdirectory to your web server.
4. Edit the assets/js/eac-ajax/app.js file. Replace the SOLR_BASE and SOLR_CORE
   values with the URL to your Solr search engine interface and the name of the
   Solr core respectively.
5. Load the index.html page and attempt to execute searches against your
   index. You should see search results appear.

 
Testing
-------

1. Post and commit the Solr Input Documents from test/solr to your Solr testing 
   core. Confirm that the data is available from the index.
2. Configure the application to point to your Solr text core.
3. Run test.sh


Credits
-------

EAC-AJAX is a project of the eScholarship Research Center at the University of
Melbourne. For more information about the project, please contact us at:

  eScholarship Research Center
  University of Melbourne
  Parkville, Victoria
  Australia
  www.esrc.unimelb.edu.au

Authors:

 * Davis Marques <davis.marques@unimelb.edu.au>
 * Marco La Rosa <marco@larosa.org.au>

Thanks:

 * Angular.js - http://www.angularjs.org
 * Bootstrap - http://twitter.github.com/bootstrap
 * Bootstrap Datepicker - http://www.eyecon.ro/bootstrap-datepicker/
 * JQuery - http://www.jquery.com

License
-------
See the LICENSE.txt file for copyright and license information.


Version History
---------------

Current:  

0.6.0

 > Map document search results should update to reflect the zoom level and current view position
 > When a facet constraint is added, it should impact the typeahead filter
 > Fuzzy search support : add a "did you mean" result list on the "no results found" view to DocumentSearchResultsController
 > How to create a "related searches: a, b, c" list of queries
 > Autocomplete should show phrases that include the current search term, rather
   than just showing literal matches

0.5.5

 > Diagram and narritive explaining workflow around crawler, visualization
 > Update the location URL when another page is selected
 > Stuck on updating fragment to reflect the current facet query -- facet query
   clears hash
 > On page load, parse the fragment portion of the location URL to determine
   if there is a starting search query.  Execute that query.
 > Query term highlighting in search results
 > Add date field into the title output

0.5.4

 > SolrSearchService passes the name of the query on update
 > Other controllers listen for changes on their target named query, or 'default' if none is set
 > Created a location facet controller
 > Controller unit tests
 > Query index for a list of all entities by location
 > MapMarkerService maintains a list of markers by ID and can focus on a marker by that ID
 > One map info window should be open at a time

0.5.3

 > Listen for updates on specific data sets from the SolrSearchService
 > Updated FacetSelectionController to work with SolrSearchService
 * Updated FieldFacetController to get results from SolrSearchService, add facet constraint to named query

0.5.2

 * Named and default queries in SolrSearchService
 * Marker info window closes when clicking its close button

0.5.1

 * Updated DocumentSearchResultsController to work with SolrSearchService
 * Updated pagination setup on DocumentSearchController to work with SolrSearchService
 * Updated SearchHistoryController to only record changes in the query object

0.5.0

 * Defined default map cluster icon options 
 * SearchBoxController now updates search query in SolrSearchService
 * Google API key removed from script loading call
 * Reorganized application controllers to use Solr search service
 * Updated DocumentSearchResultsController to use SolrSearchService
 * Replaced DocumentSearchController with DocumentSearchResultsController for text based display of search results
 * Created SolrSearchService
 * Map starts at specified coordinates, or Australia if not specified
 * Added mapping default arguments to application constants

0.4.0

 * Renamed controllers throughout
 * Moved global classes into separate common.js file
 * Created separate document, image, location search applications and pages
 * Updated application routing for document, image, location searching
 * Created document, image, location partial views
 * Reorganized application to match Angular Seed Project implementation
 * Made various free floating methods members of their respective controllers

0.3.2

 * Revised pagination function
 * Created date range facet controller
 * Set minimum facet count threshold for facet list
 * Fixed missing facet counts

0.3.1

 * Update the location fragment to reflect the current query
 * Hide pagination index when there are no results
 * Parse URL fragment to get starting query parameters
 * Prepended && to facet URLs to aid parsing

0.3.0

 * Documentation in JsDoc format throughout
 * Faceted search on fields
 * Facet parameters added into search query url
 * Facet list is part of the query object, to ensure it becomes part of the
   search history
 * Facet controller for basic text field search
 * Defined an init method for each controller to take care of all startup
   actions
 * Added SOLR_CORE as an application constant
 * Created Selection controller to display and manage the set of facets,
   constraints
 * Query history panel displays the last N queries
 * Autocomplete search hints in keyword search box

0.2.1

 * Paged search results
 * Paginated search index
 * Basic AJAX keyword search through text field entry
 * Removed AJAX-Solr and replaced with Angular.js

0.2.0

 * First pass implementation using AJAX-Solr
 * Added Bootstrap library

0.1.0

 * Static mockup of interface


Known Issues
------------

 * Clicking on a facet constraint causes the hash portion of the URL string to
   disappear and the browser to throw a maximum recursions error on the $digest()
   function. Removing the facet constraint causes the URL to be updated and 
   displayed correctly. A temporary patch as described here has been applied to
   the affected controllers:
   @see https://github.com/angular/angular.js/issues/1179

 * Autocomplete does not provide the correct (full) string to the search query.
   Only the portion of the string entered up to the point at which a search
   hint is recorded, is then passed on to the query function.

 * When the window resizes into a single column, there is a margin left on the
   right and left sides of the menu bar and content section that needs to be
   changed.  The margin needs to be adjusted to improve the appearance.
   Otherwise, the background should be changed so that it hides this problem.

 * The date picker fields are too wide and do not adapt their sizes.

 * The metadata/graphics panel stays right aligned when in a single column
   layout.

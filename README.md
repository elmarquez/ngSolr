AJAX Faceted Search Interface to Apache Solr/Lucene Search Index
================================================================

SOLR-AJAX is a single page, Javascript web application for searching and
presenting document, image and location data from an Apache Solr/Lucene search
index. The application is easy to customize and deploy. It includes interfaces
and display components for:

 * Document search
 * Image search
 * Map search

A live demo is available online at https://web.esrc.unimelb.edu.au/ECOM/.


Setup
-----

This application requires a functioning web server and Apache Solr/Lucene
search index.

1. Download and unzip the Solr-AJAX package. The unzipped archive will contain
   a number of subdirectories. Copy the contents of the app subdirectory to your
   web server.
2. Each of the sample HTML search pages (documents.html, images.html,
   location.html) runs a Javascript application, located in the js/solr-ajax/app
   folder. Edit the respective application file and replace the SOLR_BASE and
   SOLR_CORE values with the URL to your Solr search engine and the name of
   your Solr core respectively. You may also configure any other variables in
   those files.
3. Load the HTML search page and attempt to execute searches against your
   index. If you experience any problems, open your browser console. You
   should see log entries for each search query that is executed, and
   information about any errors that may have occurred.


Credits
-------

SOLR-AJAX is a project of the eScholarship Research Center at the University of
Melbourne. For more information about the project, please contact us at:

  > eScholarship Research Center
  > University of Melbourne
  > Parkville, Victoria
  > Australia
  > www.esrc.unimelb.edu.au

Authors:

 * Davis Marques <davis.marques@unimelb.edu.au>
 * Marco La Rosa <marco@larosa.org.au>

Thanks:

 * Angular.js - http://www.angularjs.org
 * Bootstrap - http://twitter.github.com/bootstrap
 * d3js - http://d3js.org
 * Google Maps - https://developers.google.com/maps
 * JQuery - http://www.jquery.com
 * JQuery UI - http://www.jqueryui.com


License
-------
See the LICENSE.txt file for copyright and license information.


Version History
---------------

Backlog:

 > Icon to display while search is being executed ... should likely be bound to the SolrSearchService
 > Map document search results should update to reflect the zoom level and current view position
 > When a facet constraint is added, it should impact the typeahead filter
 > Stuck on updating fragment to reflect the current facet query -- facet query clears hash
 > Service, controller unit tests!
 > Add date field into the title output
 > Fix page header to remove right/left whitespace when resized for mobile layout

Current:  

0.5.7

 * Close search hints list on submit action
 * Histogram of search results by date

0.5.6

 * On page load, parses location to determine if there is a starting search query, then executes query
 * Added isSelected property to FieldFacetController
 * Moved getFacets, getFacetCounts methods from SolrSearchService into SolrQuery
 * Document search results include state and exist dates.
 * Document and location search results include a thumbnail image.
 * Added AutoComplete filter as an alternate to the Bootstrap Typeahead.

0.5.5

 * Query parameters are now named so that they can be individually managed by different controllers
 * Split map query from document query in location based search view
 * Fixed formatting of document search results in map view
 * MapController listens for updates on the SelectionSetService and puts focus on selected item
 * One map info window should be open at a time
 * Created SelectionSetService

0.5.4

 * Entity titles include the exist dates
 * Modified SolrSearchService to allow multiple query parts
 * Filter results by date ranges using DateFacetController
 * Partial unit tests for SolrFacet, SolrQuery, SolrSearchService
 * SolrSearchService broadcasts updates for individual named queries
 * Entity map marker and document record includes exist dates

0.5.3

 * Removed Angular partials
 * Initial implementation of DateRangeController, displays min/max years in the whole data set
 * Removed RangeFacetController
 * Updated FacetSelectionController to display and remove facets from a named query in the SolrSearchService
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

 * On page load, SolrSearchService parses the window location to determine if
   there is a starting search query. It parses the query and sets the starting
   query with the discovered values. It is not currently able to reassociate
   query parameters and facets with the various controllers. As such, the
   starting query will not properly set the controller states.

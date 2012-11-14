EAC-AJAX: Faceted Search Interface to Solr EAC Data Index
---------------------------------------------------------

EAC-AJAX is a single page, Javascript web application for searching EAC data in 
Apache Solr. It is incredibly easy to customize, requires little to no 
configuration after uploading it to your web server.

EAC-Web is a collection of tools for managing and publishing EAC metadata on 
the web. It comprises three packages:

* EAC-Solr - an Apache Solr/Lucene configuration for indexing EAC-CPF data
* EAC-Crawler - a web crawler for EAC harvesting, profiling, indexing EAC data 
  on the web, with Apache Solr/Lucene
* EAC-AJAX - an AJAX interface for faceted search of EAC collections in Solr

See the LICENSE.txt file for copyright and license information. Source code 
and detailed documentation are available at:

  http://www.github.com/esrc/eac-ajax/ 


Setup
-----

1. Download the ESRC EAC package from the source repository. The package will 
   include two subpackages:

  - Solr configuration files for EAC indexing (Solr EAC)
  - Solr Feeder script (Solr Feeder)
  - Solr AJAX web search interface (Solr AJAX)

2. Install and configure a web server and Apache Solr search engine for your
   content.
3. Copy the Solr EAC configuration files in to your Solr site.
4. Use the Index your data and use the Solr administration interface to 
   verify that data has been indexed.
5. Copy the Solr-AJAX package to the web server where your web interface will 
   reside.
6. Edit the assets/js/eac-search/app.js file. Replace the SOLRBASE value with 
   the URL to your Solr search engine interface.  Here are some examples:
   
     http://www.mycompany.org/solrcorename/


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

  Davis Marques <davis.marques@unimelb.edu.au>
  Marco La Rosa <marco@larosa.org.au>
  
Thanks:

  Angular.js - www.angularjs.org
  Bootstrap - twitter.github.com/bootstrap
  JQuery - www.jquery.com
  

Version History
---------------

0.6.0
x Map output for location entities
x Add a "did you mean" result list on the "no results found" view

0.5.0
x Query parameter to override the Solr core being queried
x Organize code into proper namespaces
x Document each controller and add information about what the controller 
  expects and how it should be wired up in the environment.
x Write up initial user documentation for how to implement the interface.

0.4.1
x Collection dashboard controller to provide a visual overview of the whole set
x Collector controller to grab particular items and keep them in a temporary 
  working list
x Preview controller to provide a quick display of particular items
x Placeholder for visual search aids

0.4.0
x On page load, parse the fragment portion of the location URL to determine
   if there is a starting search query.  Execute that query.
x Controller unit tests
x Add date field into the title output
x Update EAC to Solr transform: Added keywords field to support autocomplete 
  search
x Facet list is not currently updating the search in all cases
x When a facet constraint is added, it should impact the typeahead filter
x Location facet controller

x Consider adding "??? results found for term, facet, facet" at top of result listing
x Consider replacing link based facet lists with checkboxes
x How to create a "related searches: a, b, c" list of queries
x Consider a facet or tabbed interface to filter results by media type: text, image, video, etc.
x Query term highlighting in search results
x Autocomplete should show phrases that include the current search term, rather than just showing literal matches
x Move code into esrc namespace? @see https://github.com/openjsan/openjsan/wiki/Global-Namespaces

0.3.3
x Updates toward integration into the SAUL and FACP projects
? Stuck on updating fragment to reflect the current facet query -- facet query clears hash
x Make all the various free floating methods members of the function prototype for each controller

Current:

0.3.2
x Update the location URL when another page is selected
x Faceted search on date ranges
x Fix the search history controller so that listings point to pages, not query data
- Created date range facet controller
- Set minimum facet count threshold for facet list
- Fixed missing facet counts

0.3.1
- Update the location fragment to reflect the current query
- Hide pagination index when there are no results
- Parse URL fragment to get starting query parameters
- Prepended && to facet URLs to aid parsing

0.3.0 
- Documentation in JsDoc format throughout
- Faceted search on fields
- Facet parameters added into search query url
- Facet list is part of the query object, to ensure it becomes part of the 
  search history
- Facet controller for basic text field search
- Defined an init method for each controller to take care of all startup 
  actions
- Added SOLR_CORE as an application constant
- Created Selection controller to display and manage the set of facets, 
  constraints
- Query history panel displays the last N queries
- Autocomplete search hints in keyword search box

0.2.1
- Paged search results
- Paginated search index
- Basic AJAX keyword search through text field entry
- Removed AJAX-Solr and replaced with Angular.js

0.2.0
- First pass implementation using AJAX-Solr
- Added Bootstrap library

0.1.0
- Static mockup of interface


Known Issues
------------

- Clicking on a facet constraint causes the hash portion of the URL string to
  disappear and the browser to throw a maximum recursions error on the $digest()
  function. Removing the facet constraint causes the URL to be updated and 
  displayed correctly. A temporary patch as described here has been applied to
  the affected controllers:
  @see https://github.com/angular/angular.js/issues/1179

- Autocomplete does not provide the correct (full) string to the search query.
  Only the portion of the string entered up to the point at which a search 
  hint is recorded, is then passed on to the query function.

- When the window resizes into a single column, there is a margin left on the
  right and left sides of the menu bar and content section that needs to be 
  changed.  The margin needs to be adjusted to improve the appearance.
  Otherwise, the background should be changed so that it hides this problem.

- The date picker fields are too wide and do not adapt their sizes.

- The metadata/graphics panel stays right aligned when in a single column
  layout.


Reference
---------

- http://www.craftyfella.com/2010/01/faceting-and-multifaceting-syntax-in.html

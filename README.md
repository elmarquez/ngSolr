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

0.5.0
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

0.3.2
x Updates toward integration into the SAUL and FACP projects
x Faceted search on date ranges
x Date/date range facet controller

Current:

0.3.1
? Stuck on updating fragment to reflect the current facet query -- facet query clears hash
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

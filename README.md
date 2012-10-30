Solr EAC - A Toolset for Supporting EAC on the Web
--------------------------------------------------

Solr EAC is a collection of tools for managing and publishing EAC metadata on 
the web. It comprises three packages:

* EAC Solr - an Apache Solr/Lucene configuration for indexing EAC
* EAC Crawler - a web crawler for EAC harvesting and insertion into Solr
* EAC AJAX - an AJAX interface for faceted search of EAC collections in Solr

See the LICENSE.txt file for copyright and license information. Source code 
and detailed documentation are available at:

  http://www.github.com/esrc/solr-eac/ 

Credits
-------

Solr-EAC is a project of the eScholarship Research Center at the University of 
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

0.5.0
x Document each controller and add information about what the controller 
  expects and how it should be wired up in the environment.

0.4.0
x Collection dashboard controller to provide a visual overview of the whole set
x Collector controller to grab particular items and keep them in a temporary 
  working list
x Preview controller to provide a quick display of particular items
x Date/date range facet controller
x Location facet controller
x Create an implementation pattern for facet controllers
x Placeholder for visual search aids

Current:

0.3.0 - Faceted search
x Facet controller for basic text field search
x Selection controller to display and manage the set of facets, constraints
x Updated EAC to Solr transform: Added keywords field to support autocomplete search

>> Stuck on scoping issues around searchCtrl vs searchBoxCtrl 

- Autocomplete search hints in keyword search box

0.2.1
- Paged search results with paginated search index
- Removed AJAX-Solr and replaced with Angular.js
- Basic keyword search through text field entry

0.2.0
- First pass implementation using AJAX-Solr
- Added Bootstrap library

0.1.0
- Static mockup of interface


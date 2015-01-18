ngSolr: Easy Faceted Search for Apache Solr/Lucene
==================================================

ngSolr is a family of JavaScript components that makes it easy to construct
document, image and location based search interfaces on top of an Apache
Solr/Lucene index.

Clone the repo and look at the dist/examples folder for working search examples
that you can customize. A demo is available online at
http://www.davismarques.com/projects/ngsolr.


Dependencies
------------

The ngSolr library depends only on Angular.js. Other dependencies identified in
the dist/examples and bower.json file are optional. nodejs, Grunt and Bower are
required to build the application library and examples from source.

ngSolr expects to communicate directly with an Apache Solr index. In most
cases, this means that you will have your web server forward search queries
from the Internet to your Apache Solr server. Configure Apache or Nginx to
forward only GET requests that match a Solr search request. Please consult a
qualified network administrator when implementing this.


Install or Build from Source
----------------------------

Use Bower to install ngSolr as a dependency for your project folder:

    bower install ngsolr

To build the library and examples from source, clone the project repository to
your local system. Install all project compile and run-time dependencies:

    npm install
    bower install

Build the library and examples in the /dist folder:

    grunt compile

Start a local web server at http://localhost:8080/ and serve the contents of
dist/examples:

    grunt serve

Display a list of available build commands:

    grunt


Customizing Your Search Interface
---------------------------------

Clone the repository, then build the library and examples as described. An
examples folder will be present in the dist output folder, and includes
sample interfaces for document, image and location based search.

Each of the sample HTML search pages (documents.html, images.html,
location.html) runs a single-page Javascript application that is responsible
for executing search actions and displaying results. The application uses
configuration values specified in the HTML to determine where to send its
queries. In particular, the "data-source" attribute tells the application what
the URL for your Solr core is. Set the "data-source" attribute to the URL of
your Solr core.

    ex. data-source="http://example.com:8080/path/to/my/solr/core"

The URL to your Solr core must be resolveable and accessible by the browser. If
you are running the application as a public service, then the URL to your Solr
core must be publicly accessible.

Load the HTML search page in your browser and attempt to execute searches
against your Solr index. If you experience any problems, open your browser
console. You should see log entries for each search query that is executed, and
information about any errors that may have occurred.


License
-------
See the LICENSE file for copyright and license information.

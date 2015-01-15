ngSolr: Easy Faceted Search for Apache Solr/Lucene
==================================================

ngSolr is a single page Javascript web application for searching and
presenting document, image and location data from an Apache Solr/Lucene search
index. The application can be installed and running with almost no setup. It
includes interfaces and display components for:

 * Document search
 * Image search
 * Map search

Examples
--------

Clone the repository, then compile a distribution as described below. An
examples folder will be present in the dist output folder, and includes
document, image and location based search samples.


Dependencies
------------

ngSolr depends on AngularJs. Other dependencies identified in the bower.json
file and examples are optional.


Install
-------

Use Bower to install the ngSolr library in your project folder.

    bower install -S ngsolr


Build and Test
--------------

Install all compile and run-time dependencies:

    npm install
    bower install

Display the list of build commands:

    grunt

Build the library in the /dist folder:

    grunt compile


Creating a Faceted Search Interface
-----------------------------------

This application requires a functioning web server and Apache Solr/Lucene
search index.

1. Download and unzip the ngSolr package. The unzipped archive will contain
   a number of subdirectories. Copy the contents of the app subdirectory to
   your web server.

2. Each of the sample HTML search pages (documents.html, images.html,
   location.html) runs a single-page Javascript application that is
   responsible for executing search actions and displaying results. The
   application will use configuration values specified in the HTML to determine
   where to send its queries. In particular, the "data-source" attribute tells
   the application what the URL for you Solr core is. Set the "data-source"
   attribute to the URL to your Solr core.

     ex. data-source="http://example.com:8080/path/to/my/solr/core"

   The URL to your Solr core must be resolveable and accessible by the browser.
   If you are running the application as a public service, then the URL to your
   Solr core must be publicly accessible.

3. Load the HTML search page in your browser and attempt to execute searches
   against your Solr index. If you experience any problems, open your browser
   console. You should see log entries for each search query that is executed,
   and information about any errors that may have occurred.


License
-------
See the LICENSE.txt file for copyright and license information.


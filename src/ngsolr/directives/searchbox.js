/**
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
/* jshint camelcase:false */
'use strict';

/**
 * Search box provides an input for user queries, provides search hints related
 * to the user's current query entry, and constructs a query URL. By default,
 * the search box will update the current location when executing a query.
 * It can optionally be configured to redirect the user agent to another URL
 * for rendering of results.
 */
angular
    .module('ngSolr')
    .directive('searchbox',
        ['$location','$log','$routeParams','$timeout','$window','SolrSearchService','Utils',
        function ($location, $log, $routeParams, $timeout, $window, SolrSearchService, Utils) {
            return {
                link: function (scope, element, attrs) {

                    var KEY_ENTER = '13';
                    var KEY_ESCAPE = '27';
                    var KEY_ARROW_UP = '38';
                    var KEY_ARROW_DOWN = '40';

                    // flag for when the search box has focus and the search hints
                    // list should be displayed to the user
                    scope.showHints = false;

                    // the complete list of search hints
                    scope.hints = [];

                    // the maximum number of hints to display at any moment
                    scope.maxHints = 10;

                    // instructional message to aid the user in constructing a query
                    scope.messages = [
                        'Enter one or more search terms. Press Enter to search.',
                        'Key up or down to navigate hints. Press Enter to search.',
                        'Press Enter to search.'
                    ];
                    scope.message = scope.messages[0];

                    // the minimum number characters that the user should enter before the list
                    // of search hints is displayed
                    scope.minSearchLength = 3;

                    // find near matches to the user query
                    scope.nearMatch = false;

                    // input field place holder value
                    scope.placeHolder = 'Keyword or place name';

                    // once the user has provided the minimum number of characters to start
                    // the query process, we start a clock
                    scope.queryBuffer = [];

                    // when the user submits the query, redirect to the specified URL, with the
                    // query appended, to render the results
                    scope.redirect = undefined;

                    // If true, when a user enters a new query string, the target query will be
                    // replaced with a new query and the user query property will be set, If
                    // false, only the user query and start properties will be changed and the
                    // query results will be reloaded.
                    scope.resetOnChange = false;

                    // the field name where search hints are taken from
                    scope.searchHintsField = 'hints';

                    // the name of the query that returns the list of search hints
                    scope.searchHintsQuery = 'hintsQuery';

                    // index of the selected hint
                    scope.selectedHint = -1;

                    // flag to control display of instructional message
                    scope.showMessage = true;

                    // url to solr core
                    scope.source = undefined;

                    // timeout to track
                    scope.timeout = undefined;

                    // the query string provided by the user
                    scope.userQuery = '';

                    ///////////////////////////////////////////////////////////////////////////

                    /**
                     * Clear the current hint selection.
                     */
                    scope.clearHintSelection = function () {
                        if (scope.selectedHint !== -1) {
                            var hint = scope.hints[scope.selectedHint];
                            hint.selected = false;
                        }
                    };

                    /**
                     * Handle route change event.
                     */
                    scope.handleRouteChange = function () {
                        var hash = ($routeParams.query || '');
                        if (hash !== '') {
                            var query = SolrSearchService.getQueryFromHash(hash, scope.source);
                            scope.userQuery = query.getUserQuery();
                        } else {
                            scope.userQuery = hash;
                        }
                    };

                    /**
                     * Handle submit click event. Construct a valid Solr query URL from the
                     * user input data, then execute a GET call with that URL.
                     */
                    scope.handleSubmit = function () {
                        // clean up the user query
                        var trimmed = Utils.trim(scope.userQuery);
                        if (trimmed === '') {
                            scope.userQuery = '*:*';
                        }
                        // build the query string
                        var query = SolrSearchService.getQuery(scope.queryName);
                        if (query === undefined) {
                            query = SolrSearchService.createQuery(scope.source);
                        }
                        query.setNearMatch(scope.nearMatch);
                        query.setUserQuery(scope.userQuery);
                        // update the window location
                        var hash = query.getHash();
                        if (scope.redirect) {
                            $window.location.href = scope.redirect + '#' + hash;
                        } else {
                            $location.path(hash);
                        }
                    };

                    /**
                     * Update the controller state.
                     */
                    scope.handleUpdate = function () {
                        scope.message = scope.messages[1];
                        var query = SolrSearchService.getQuery(scope.searchHintsQuery);
                        var results = query.getFacetCounts();
                        if (results && results.hasOwnProperty('facet_fields')) {
                            scope.hints = [];
                            var result = results.facet_fields[scope.searchHintsField];
                            if (result) {
                                for (var i = 0; i < result.length; i += 2) {
                                    var hint = {
                                        title: result[i],
                                        selected: false
                                    };
                                    scope.hints.push(hint);
                                }
                            }
                        }
                    };

                    /**
                     * Highlight the selected index.
                     * @param index
                     */
                    scope.highlightHint = function (index) {
                        var hint = scope.hints[index];
                        hint.selected = true;
                        scope.$apply();
                    };

                    /**
                     * Clear the hint selection then reset the hint list and
                     * selection index.
                     */
                    scope.resetHintSelection = function() {
                        scope.clearHintSelection();
                        scope.selectedHint = -1;
                        scope.hints = [];
                        scope.message = scope.messages[0];
                    };

                    /**
                     * Initialize the controller.
                     */
                    scope.init = function () {
                        // apply configured attributes
                        for (var key in attrs) {
                            if (scope.hasOwnProperty(key)) {
                                if (key === 'documentsPerPage' || key === 'pagesPerSet') {
                                    scope[key] = parseInt(attrs[key]);
                                } else if (attrs[key] === 'true' || attrs[key] === 'false') {
                                    scope[key] = attrs[key] === 'true';
                                } else {
                                    scope[key] = attrs[key];
                                }
                            }
                        }
                        // get the search box DOM elements
                        var children = element.children();
                        scope.form_div = children[0];
                        scope.query_input = scope.form_div.querySelector('#query');
                        scope.hints_div = scope.form_div.querySelector('#hints');
                        scope.hints_list = scope.form_div.querySelector('#list');
                        scope.hints_message = scope.form_div.querySelector('#message');
                        // attach event listeners to the query input
                        scope.query_input.onfocus = scope.onfocus;
                        scope.query_input.onblur = scope.onblur;
                        scope.query_input.onkeyup = scope.onkeyup;
                        // handle location change event, update query value
                        scope.$on('$routeChangeSuccess', function() { scope.handleRouteChange(); });
                        // handle update events on the hints query
                        scope.$on(scope.searchHintsQuery, scope.handleUpdate);
                    };

                    /**
                     * Handle search box input blur event. Deselect any selected
                     * hints then update the user interface.
                     */
                    scope.onblur = function () {
                        scope.showHints = false;
                        scope.resetHintSelection();
                        scope.$apply();
                    };

                    /**
                     * Handle search box input focus event. When the search
                     * box has focus then size and display the search hints
                     * DIV.
                     */
                    scope.onfocus = function () {
                        // set the width of the div to be equal to the input box
                        // subtract the width of the #hints border
                        var width = scope.query_input.offsetWidth - 2;
                        scope.hints_div.setAttribute('style', 'width:' + width + 'px');
                        scope.showHints = true;
                        scope.$apply();
                    };

                    /**
                     * Handle user data entry on input field.
                     * @param event
                     */
                    scope.onkeyup = function (event) {
                        scope.showHints = true;
                        if (event.keyCode === KEY_ENTER) {
                            if (scope.selectedHint !== -1) {
                                scope.selectHint(scope.selectedHint);
                            }
                            scope.handleSubmit();
                            scope.onblur();
                        }
                        else if (event.keyCode === KEY_ESCAPE) {
                            scope.showHints = false;
                            scope.resetHintSelection();
                            scope.$apply();
                        }
                        else if (event.keyCode === KEY_ARROW_UP) {
                            scope.clearHintSelection();
                            if (scope.selectedHint < 1) {
                                scope.selectedHint = scope.hints.length - 1;
                            } else {
                                scope.selectedHint -= 1;
                            }
                            scope.highlightHint(scope.selectedHint);
                        }
                        else if (event.keyCode === KEY_ARROW_DOWN) {
                            scope.clearHintSelection();
                            if (scope.selectedHint < scope.hints.length - 1) {
                                scope.selectedHint += 1;
                            } else {
                                scope.selectedHint = 0;
                            }
                            scope.highlightHint(scope.selectedHint);
                        }
                        // if the current query meets the minimum requirements,
                        // get the list of search hints
                        else if (scope.userQuery.length >= scope.minSearchLength) {
                            if (scope.timeout) {
                                $timeout.cancel(scope.timeout);
                            }
                            scope.timeout = $timeout(function () {
                                var query = SolrSearchService.createQuery(scope.source);
                                query.setOption('rows', '0');
                                query.setOption('facet', 'true');
                                query.setOption('facet.limit', scope.maxHints);
                                query.setOption('facet.field', scope.searchHintsField);
                                query.setNearMatch(scope.nearMatch);
                                query.setUserQuery(scope.userQuery);
                                SolrSearchService.setQuery(scope.searchHintsQuery, query);
                                SolrSearchService.updateQuery(scope.searchHintsQuery);
                            }, 350);
                        }
                    };

                    /**
                     * Select the specified hint by its index in the hints array.
                     * @param index
                     */
                    scope.selectHint = function (index) {
                        var hint = scope.hints[index];
                        scope.userQuery = hint.title;
                    };

                    // initialize the controller
                    scope.init();

                },
                replace: false,
                restrict: 'E',
                scope: {
                    showHints: '&',
                    nearMatch: '@',
                    placeHolder: '@',
                    queryName: '@',
                    searchHintsField: '@',
                    source: '@'
                },
                template: '<form><div id="inputs" class="input-group"><input id="query" type="text" placeholder="{{placeHolder}}" ng-model="userQuery" autocomplete="off" /><div class="input-group-btn"><button id="submit" type="button" class="btn btn-default" ng-click="handleSubmit()">Search</button></div></div><div id="hints" ng-show="showHints"><ul id="list"><li ng-repeat="hint in hints" ng-mousedown="selectHint($index,true);handleSubmit()" ng-class="{\'selected\':hint.selected}">{{hint.title}}</li></ul><div id="message" ng-show="showMessage">{{message}}</div></div></form>',
                transclude: true
            };
        }]
);

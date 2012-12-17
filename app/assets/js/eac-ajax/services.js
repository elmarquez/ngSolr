/*
 * This file is subject to the terms and conditions defined in the
 * 'LICENSE.txt' file, which is part of this source code package.
 */
 'use strict';


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('eac-ajax-app.services', []).
  value('version', '0.1');

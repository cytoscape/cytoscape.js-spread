'use strict';

// registers the extension on a cytoscape lib ref
var getLayout = require('./layout');

var register = function( cytoscape, weaver ){
  var layout = getLayout( cytoscape, weaver || require('weaverjs') );

  cytoscape('layout', 'spread', layout);
};

if( typeof cytoscape !== 'undefined' && ( typeof weaver !== 'undefined' || typeof cytoscape.Thread !== 'undefined' ) ){ // expose to global cytoscape (i.e. window.cytoscape)
  register( cytoscape, weaver || cytoscape );
}

module.exports = register;

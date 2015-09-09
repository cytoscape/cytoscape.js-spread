'use strict';

(function(){

  // registers the extension on a cytoscape lib ref
  var getLayout = require('./layout');
  var register = function( cytoscape ){
    var layout = getLayout( cytoscape );

    cytoscape('layout', 'spread', layout);
  };

  if( typeof module !== 'undefined' && module.exports ){ // expose as a commonjs module
    module.exports = register;
  }

  if( typeof define !== 'undefined' && define.amd ){ // expose as an amd/requirejs module
    define('cytoscape-spread', function(){
      return register;
    });
  }

  if( typeof cytoscape !== 'undefined' ){ // expose to global cytoscape (i.e. window.cytoscape)
    register( cytoscape );
  }

})();

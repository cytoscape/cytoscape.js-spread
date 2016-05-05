cytoscape-spread
================================================================================


## Description

The Spread physics simulation layout for Cytoscape.js

The spread layout uses a force-directed physics simulation with several external libraries.  The layout tries to keep elements spread out evenly, making good use of constrained space.

The layout makes use of [foograph.js](https://code.google.com/p/foograph/) and [rhill-voronoi-core.js](https://github.com/gorhill/Javascript-Voronoi).  They are bundled for you.


## Dependencies

 * Cytoscape.js ^2.5.0


## Usage instructions

Download the library:
 * via npm: `npm install cytoscape-spread`,
 * via bower: `bower install cytoscape-spread`, or
 * via direct download in the repository (probably from a tag).

`require()` the library as appropriate for your project:

CommonJS:
```js
var cytoscape = require('cytoscape');
var spread = require('cytoscape-spread');

spread( cytoscape ); // register extension
```

AMD:
```js
require(['cytoscape', 'cytoscape-spread'], function( cytoscape, spread ){
  spread( cytoscape ); // register extension
});
```

Plain HTML/JS has the extension registered for you automatically, because no `require()` is needed.


## API

Call the layout, e.g. `cy.layout({ name: 'spread', ... })`, with options:

```js
var defaults = {
  animate: true, // whether to show the layout as it's running
  ready: undefined, // Callback on layoutready
  stop: undefined, // Callback on layoutstop
  fit: true, // Reset viewport to fit default simulationBounds
  minDist: 20, // Minimum distance between nodes
  padding: 20, // Padding
  expandingFactor: -1.0, // If the network does not satisfy the minDist
  // criterium then it expands the network of this amount
  // If it is set to -1.0 the amount of expansion is automatically
  // calculated based on the minDist, the aspect ratio and the
  // number of nodes
  maxFruchtermanReingoldIterations: 50, // Maximum number of initial force-directed iterations
  maxExpandIterations: 4, // Maximum number of expanding iterations
  boundingBox: undefined, // Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
  randomize: false // uses random initial node positions on true
};
```


## Publishing instructions

This project is set up to automatically be published to npm and bower.  To publish:

1. Set the version number environment variable: `export VERSION=1.2.3`
1. Publish: `gulp publish`
1. If publishing to bower for the first time, you'll need to run `bower register cytoscape-spread https://github.com/cytoscape/cytoscape.js-spread.git`

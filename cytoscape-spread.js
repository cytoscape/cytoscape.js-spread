(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var foograph = {
  /**
   * Insert a vertex into this graph.
   *
   * @param vertex A valid Vertex instance
   */
  insertVertex: function(vertex) {
      this.vertices.push(vertex);
      this.vertexCount++;
    },

  /**
   * Insert an edge vertex1 --> vertex2.
   *
   * @param label Label for this edge
   * @param weight Weight of this edge
   * @param vertex1 Starting Vertex instance
   * @param vertex2 Ending Vertex instance
   * @return Newly created Edge instance
   */
  insertEdge: function(label, weight, vertex1, vertex2, style) {
      var e1 = new foograph.Edge(label, weight, vertex2, style);
      var e2 = new foograph.Edge(null, weight, vertex1, null);

      vertex1.edges.push(e1);
      vertex2.reverseEdges.push(e2);

      return e1;
    },

  /**
   * Delete edge.
   *
   * @param vertex Starting vertex
   * @param edge Edge to remove
   */
  removeEdge: function(vertex1, vertex2) {
      for (var i = vertex1.edges.length - 1; i >= 0; i--) {
        if (vertex1.edges[i].endVertex == vertex2) {
          vertex1.edges.splice(i,1);
          break;
        }
      }

      for (var i = vertex2.reverseEdges.length - 1; i >= 0; i--) {
        if (vertex2.reverseEdges[i].endVertex == vertex1) {
          vertex2.reverseEdges.splice(i,1);
          break;
        }
      }
    },

  /**
   * Delete vertex.
   *
   * @param vertex Vertex to remove from the graph
   */
  removeVertex: function(vertex) {
      for (var i = vertex.edges.length - 1; i >= 0; i-- ) {
        this.removeEdge(vertex, vertex.edges[i].endVertex);
      }

      for (var i = vertex.reverseEdges.length - 1; i >= 0; i-- ) {
        this.removeEdge(vertex.reverseEdges[i].endVertex, vertex);
      }

      for (var i = this.vertices.length - 1; i >= 0; i-- ) {
        if (this.vertices[i] == vertex) {
          this.vertices.splice(i,1);
          break;
        }
      }

      this.vertexCount--;
    },

  /**
   * Plots this graph to a canvas.
   *
   * @param canvas A proper canvas instance
   */
  plot: function(canvas) {
      var i = 0;
      /* Draw edges first */
      for (i = 0; i < this.vertices.length; i++) {
        var v = this.vertices[i];
        if (!v.hidden) {
          for (var j = 0; j < v.edges.length; j++) {
            var e = v.edges[j];
            /* Draw edge (if not hidden) */
            if (!e.hidden)
              e.draw(canvas, v);
          }
        }
      }

      /* Draw the vertices. */
      for (i = 0; i < this.vertices.length; i++) {
        v = this.vertices[i];

        /* Draw vertex (if not hidden) */
        if (!v.hidden)
          v.draw(canvas);
      }
    },

  /**
   * Graph object constructor.
   *
   * @param label Label of this graph
   * @param directed true or false
   */
  Graph: function (label, directed) {
      /* Fields. */
      this.label = label;
      this.vertices = new Array();
      this.directed = directed;
      this.vertexCount = 0;

      /* Graph methods. */
      this.insertVertex = foograph.insertVertex;
      this.removeVertex = foograph.removeVertex;
      this.insertEdge = foograph.insertEdge;
      this.removeEdge = foograph.removeEdge;
      this.plot = foograph.plot;
    },

  /**
   * Vertex object constructor.
   *
   * @param label Label of this vertex
   * @param next Reference to the next vertex of this graph
   * @param firstEdge First edge of a linked list of edges
   */
  Vertex: function(label, x, y, style) {
      this.label = label;
      this.edges = new Array();
      this.reverseEdges = new Array();
      this.x = x;
      this.y = y;
      this.dx = 0;
      this.dy = 0;
      this.level = -1;
      this.numberOfParents = 0;
      this.hidden = false;
      this.fixed = false;     // Fixed vertices are static (unmovable)

      if(style != null) {
          this.style = style;
      }
      else { // Default
          this.style = new foograph.VertexStyle('ellipse', 80, 40, '#ffffff', '#000000', true);
      }
    },


   /**
   * VertexStyle object type for defining vertex style options.
   *
   * @param shape Shape of the vertex ('ellipse' or 'rect')
   * @param width Width in px
   * @param height Height in px
   * @param fillColor The color with which the vertex is drawn (RGB HEX string)
   * @param borderColor The color with which the border of the vertex is drawn (RGB HEX string)
   * @param showLabel Show the vertex label or not
   */
  VertexStyle: function(shape, width, height, fillColor, borderColor, showLabel) {
      this.shape = shape;
      this.width = width;
      this.height = height;
      this.fillColor = fillColor;
      this.borderColor = borderColor;
      this.showLabel = showLabel;
    },

  /**
   * Edge object constructor.
   *
   * @param label Label of this edge
   * @param next Next edge reference
   * @param weight Edge weight
   * @param endVertex Destination Vertex instance
   */
  Edge: function (label, weight, endVertex, style) {
      this.label = label;
      this.weight = weight;
      this.endVertex = endVertex;
      this.style = null;
      this.hidden = false;

      // Curving information
      this.curved = false;
      this.controlX = -1;   // Control coordinates for Bezier curve drawing
      this.controlY = -1;
      this.original = null; // If this is a temporary edge it holds the original edge

      if(style != null) {
        this.style = style;
      }
      else {  // Set to default
        this.style = new foograph.EdgeStyle(2, '#000000', true, false);
      }
    },



  /**
   * EdgeStyle object type for defining vertex style options.
   *
   * @param width Edge line width
   * @param color The color with which the edge is drawn
   * @param showArrow Draw the edge arrow (only if directed)
   * @param showLabel Show the edge label or not
   */
  EdgeStyle: function(width, color, showArrow, showLabel) {
      this.width = width;
      this.color = color;
      this.showArrow = showArrow;
      this.showLabel = showLabel;
    },

  /**
   * This file is part of foograph Javascript graph library.
   *
   * Description: Random vertex layout manager
   */

  /**
   * Class constructor.
   *
   * @param width Layout width
   * @param height Layout height
   */
  RandomVertexLayout: function (width, height) {
      this.width = width;
      this.height = height;
    },


  /**
   * This file is part of foograph Javascript graph library.
   *
   * Description: Fruchterman-Reingold force-directed vertex
   *              layout manager
   */

  /**
   * Class constructor.
   *
   * @param width Layout width
   * @param height Layout height
   * @param iterations Number of iterations -
   * with more iterations it is more likely the layout has converged into a static equilibrium.
   */
  ForceDirectedVertexLayout: function (width, height, iterations, randomize, eps) {
      this.width = width;
      this.height = height;
      this.iterations = iterations;
      this.randomize = randomize;
      this.eps = eps;
      this.callback = function() {};
    },

  A: 1.5, // Fine tune attraction

  R: 0.5  // Fine tune repulsion
};

/**
 * toString overload for easier debugging
 */
foograph.Vertex.prototype.toString = function() {
  return "[v:" + this.label + "] ";
};

/**
 * toString overload for easier debugging
 */
foograph.Edge.prototype.toString = function() {
  return "[e:" + this.endVertex.label + "] ";
};

/**
 * Draw vertex method.
 *
 * @param canvas jsGraphics instance
 */
foograph.Vertex.prototype.draw = function(canvas) {
  var x = this.x;
  var y = this.y;
  var width = this.style.width;
  var height = this.style.height;
  var shape = this.style.shape;

  canvas.setStroke(2);
  canvas.setColor(this.style.fillColor);

  if(shape == 'rect') {
    canvas.fillRect(x, y, width, height);
    canvas.setColor(this.style.borderColor);
    canvas.drawRect(x, y, width, height);
  }
  else { // Default to ellipse
    canvas.fillEllipse(x, y, width, height);
    canvas.setColor(this.style.borderColor);
    canvas.drawEllipse(x, y, width, height);
  }

  if(this.style.showLabel) {
    canvas.drawStringRect(this.label, x, y + height/2 - 7, width, 'center');
  }
};

/**
 * Fits the graph into the bounding box
 *
 * @param width
 * @param height
 * @param preserveAspect
 */
foograph.Graph.prototype.normalize = function(width, height, preserveAspect) {
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.oldX = v.x;
    v.oldY = v.y;
  }
  var mnx = width  * 0.1;
  var mxx = width  * 0.9;
  var mny = height * 0.1;
  var mxy = height * 0.9;
  if (preserveAspect == null)
    preserveAspect = true;

  var minx = Number.MAX_VALUE;
  var miny = Number.MAX_VALUE;
  var maxx = Number.MIN_VALUE;
  var maxy = Number.MIN_VALUE;

  for (var i7 in this.vertices) {
    var v = this.vertices[i7];
    if (v.x < minx) minx = v.x;
    if (v.y < miny) miny = v.y;
    if (v.x > maxx) maxx = v.x;
    if (v.y > maxy) maxy = v.y;
  }
  var kx = (mxx-mnx) / (maxx - minx);
  var ky = (mxy-mny) / (maxy - miny);

  if (preserveAspect) {
    kx = Math.min(kx, ky);
    ky = Math.min(kx, ky);
  }

  var newMaxx = Number.MIN_VALUE;
  var newMaxy = Number.MIN_VALUE;
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.x = (v.x - minx) * kx;
    v.y = (v.y - miny) * ky;
    if (v.x > newMaxx) newMaxx = v.x;
    if (v.y > newMaxy) newMaxy = v.y;
  }

  var dx = ( width  - newMaxx ) / 2.0;
  var dy = ( height - newMaxy ) / 2.0;
  for (var i8 in this.vertices) {
    var v = this.vertices[i8];
    v.x += dx;
    v.y += dy;
  }
};

/**
 * Draw edge method. Draws edge "v" --> "this".
 *
 * @param canvas jsGraphics instance
 * @param v Start vertex
 */
foograph.Edge.prototype.draw = function(canvas, v) {
  var x1 = Math.round(v.x + v.style.width/2);
  var y1 = Math.round(v.y + v.style.height/2);
  var x2 = Math.round(this.endVertex.x + this.endVertex.style.width/2);
  var y2 = Math.round(this.endVertex.y + this.endVertex.style.height/2);

  // Control point (needed only for curved edges)
  var x3 = this.controlX;
  var y3 = this.controlY;

  // Arrow tip and angle
  var X_TIP, Y_TIP, ANGLE;

  /* Quadric Bezier curve definition. */
  function Bx(t) { return (1-t)*(1-t)*x1 + 2*(1-t)*t*x3 + t*t*x2; }
  function By(t) { return (1-t)*(1-t)*y1 + 2*(1-t)*t*y3 + t*t*y2; }

  canvas.setStroke(this.style.width);
  canvas.setColor(this.style.color);

  if(this.curved) { // Draw a quadric Bezier curve
    this.curved = false; // Reset
    var t = 0, dt = 1/10;
    var xs = x1, ys = y1, xn, yn;

    while (t < 1-dt) {
      t += dt;
      xn = Bx(t);
      yn = By(t);
      canvas.drawLine(xs, ys, xn, yn);
      xs = xn;
      ys = yn;
    }

    // Set the arrow tip coordinates
    X_TIP = xs;
    Y_TIP = ys;

    // Move the tip to (0,0) and calculate the angle
    // of the arrow head
    ANGLE = angularCoord(Bx(1-2*dt) - X_TIP, By(1-2*dt) - Y_TIP);

  } else {
    canvas.drawLine(x1, y1, x2, y2);

    // Set the arrow tip coordinates
    X_TIP = x2;
    Y_TIP = y2;

    // Move the tip to (0,0) and calculate the angle
    // of the arrow head
    ANGLE = angularCoord(x1 - X_TIP, y1 - Y_TIP);
  }

  if(this.style.showArrow) {
    drawArrow(ANGLE, X_TIP, Y_TIP);
  }

  // TODO
  if(this.style.showLabel) {
  }

  /**
   * Draws an edge arrow.
   * @param phi The angle (in radians) of the arrow in polar coordinates.
   * @param x X coordinate of the arrow tip.
   * @param y Y coordinate of the arrow tip.
   */
  function drawArrow(phi, x, y)
  {
    // Arrow bounding box (in px)
    var H = 50;
    var W = 10;

    // Set cartesian coordinates of the arrow
    var p11 = 0, p12 = 0;
    var p21 = H, p22 = W/2;
    var p31 = H, p32 = -W/2;

    // Convert to polar coordinates
    var r2 = radialCoord(p21, p22);
    var r3 = radialCoord(p31, p32);
    var phi2 = angularCoord(p21, p22);
    var phi3 = angularCoord(p31, p32);

    // Rotate the arrow
    phi2 += phi;
    phi3 += phi;

    // Update cartesian coordinates
    p21 = r2 * Math.cos(phi2);
    p22 = r2 * Math.sin(phi2);
    p31 = r3 * Math.cos(phi3);
    p32 = r3 * Math.sin(phi3);

    // Translate
    p11 += x;
    p12 += y;
    p21 += x;
    p22 += y;
    p31 += x;
    p32 += y;

    // Draw
    canvas.fillPolygon(new Array(p11, p21, p31), new Array(p12, p22, p32));
  }

  /**
   * Get the angular coordinate.
   * @param x X coordinate
   * @param y Y coordinate
   */
   function angularCoord(x, y)
   {
     var phi = 0.0;

     if (x > 0 && y >= 0) {
      phi = Math.atan(y/x);
     }
     if (x > 0 && y < 0) {
       phi = Math.atan(y/x) + 2*Math.PI;
     }
     if (x < 0) {
       phi = Math.atan(y/x) + Math.PI;
     }
     if (x = 0 && y > 0) {
       phi = Math.PI/2;
     }
     if (x = 0 && y < 0) {
       phi = 3*Math.PI/2;
     }

     return phi;
   }

   /**
    * Get the radian coordiante.
    * @param x1
    * @param y1
    * @param x2
    * @param y2
    */
   function radialCoord(x, y)
   {
     return Math.sqrt(x*x + y*y);
   }
};

/**
 * Calculates the coordinates based on pure chance.
 *
 * @param graph A valid graph instance
 */
foograph.RandomVertexLayout.prototype.layout = function(graph) {
  for (var i = 0; i<graph.vertices.length; i++) {
    var v = graph.vertices[i];
    v.x = Math.round(Math.random() * this.width);
    v.y = Math.round(Math.random() * this.height);
  }
};

/**
 * Identifies connected components of a graph and creates "central"
 * vertices for each component. If there is more than one component,
 * all central vertices of individual components are connected to
 * each other to prevent component drift.
 *
 * @param graph A valid graph instance
 * @return A list of component center vertices or null when there
 *         is only one component.
 */
foograph.ForceDirectedVertexLayout.prototype.__identifyComponents = function(graph) {
  var componentCenters = new Array();
  var components = new Array();

  // Depth first search
  function dfs(vertex)
  {
    var stack = new Array();
    var component = new Array();
    var centerVertex = new foograph.Vertex("component_center", -1, -1);
    centerVertex.hidden = true;
    componentCenters.push(centerVertex);
    components.push(component);

    function visitVertex(v)
    {
      component.push(v);
      v.__dfsVisited = true;

      for (var i in v.edges) {
        var e = v.edges[i];
        if (!e.hidden)
          stack.push(e.endVertex);
      }

      for (var i in v.reverseEdges) {
        if (!v.reverseEdges[i].hidden)
          stack.push(v.reverseEdges[i].endVertex);
      }
    }

    visitVertex(vertex);
    while (stack.length > 0) {
      var u = stack.pop();

      if (!u.__dfsVisited && !u.hidden) {
        visitVertex(u);
      }
    }
  }

  // Clear DFS visited flag
  for (var i in graph.vertices) {
    var v = graph.vertices[i];
    v.__dfsVisited = false;
  }

  // Iterate through all vertices starting DFS from each vertex
  // that hasn't been visited yet.
  for (var k in graph.vertices) {
    var v = graph.vertices[k];
    if (!v.__dfsVisited && !v.hidden)
      dfs(v);
  }

  // Interconnect all center vertices
  if (componentCenters.length > 1) {
    for (var i in componentCenters) {
      graph.insertVertex(componentCenters[i]);
    }
    for (var i in components) {
      for (var j in components[i]) {
        // Connect visited vertex to "central" component vertex
        edge = graph.insertEdge("", 1, components[i][j], componentCenters[i]);
        edge.hidden = true;
      }
    }

    for (var i in componentCenters) {
      for (var j in componentCenters) {
        if (i != j) {
          e = graph.insertEdge("", 3, componentCenters[i], componentCenters[j]);
          e.hidden = true;
        }
      }
    }

    return componentCenters;
  }

  return null;
};

/**
 * Calculates the coordinates based on force-directed placement
 * algorithm.
 *
 * @param graph A valid graph instance
 */
foograph.ForceDirectedVertexLayout.prototype.layout = function(graph) {
  this.graph = graph;
  var area = this.width * this.height;
  var k = Math.sqrt(area / graph.vertexCount);

  var t = this.width / 10; // Temperature.
  var dt = t / (this.iterations + 1);

  var eps = this.eps; // Minimum distance between the vertices

  // Attractive and repulsive forces
  function Fa(z) { return foograph.A*z*z/k; }
  function Fr(z) { return foograph.R*k*k/z; }
  function Fw(z) { return 1/z*z; }  // Force emited by the walls

  // Initiate component identification and virtual vertex creation
  // to prevent disconnected graph components from drifting too far apart
  centers = this.__identifyComponents(graph);

  // Assign initial random positions
  if(this.randomize) {
    randomLayout = new foograph.RandomVertexLayout(this.width, this.height);
    randomLayout.layout(graph);
  }

  // Run through some iterations
  for (var q = 0; q < this.iterations; q++) {

    /* Calculate repulsive forces. */
    for (var i1 in graph.vertices) {
      var v = graph.vertices[i1];

      v.dx = 0;
      v.dy = 0;
      // Do not move fixed vertices
      if(!v.fixed) {
        for (var i2 in graph.vertices) {
          var u = graph.vertices[i2];
          if (v != u && !u.fixed) {
            /* Difference vector between the two vertices. */
            var difx = v.x - u.x;
            var dify = v.y - u.y;

            /* Length of the dif vector. */
            var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
            var force = Fr(d);
            v.dx = v.dx + (difx/d) * force;
            v.dy = v.dy + (dify/d) * force;
          }
        }
        /* Treat the walls as static objects emiting force Fw. */
        // Calculate the sum of "wall" forces in (v.x, v.y)
        /*
        var x = Math.max(eps, v.x);
        var y = Math.max(eps, v.y);
        var wx = Math.max(eps, this.width - v.x);
        var wy = Math.max(eps, this.height - v.y);   // Gotta love all those NaN's :)
        var Rx = Fw(x) - Fw(wx);
        var Ry = Fw(y) - Fw(wy);

        v.dx = v.dx + Rx;
        v.dy = v.dy + Ry;
        */
      }
    }

    /* Calculate attractive forces. */
    for (var i3 in graph.vertices) {
      var v = graph.vertices[i3];

      // Do not move fixed vertices
      if(!v.fixed) {
        for (var i4 in v.edges) {
          var e = v.edges[i4];
          var u = e.endVertex;
          var difx = v.x - u.x;
          var dify = v.y - u.y;
          var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
          var force = Fa(d);

          /* Length of the dif vector. */
          var d = Math.max(eps, Math.sqrt(difx*difx + dify*dify));
          v.dx = v.dx - (difx/d) * force;
          v.dy = v.dy - (dify/d) * force;

          u.dx = u.dx + (difx/d) * force;
          u.dy = u.dy + (dify/d) * force;
        }
      }
    }

    /* Limit the maximum displacement to the temperature t
        and prevent from being displaced outside frame.     */
    for (var i5 in graph.vertices) {
      var v = graph.vertices[i5];
      if(!v.fixed) {
        /* Length of the displacement vector. */
        var d = Math.max(eps, Math.sqrt(v.dx*v.dx + v.dy*v.dy));

        /* Limit to the temperature t. */
        v.x = v.x + (v.dx/d) * Math.min(d, t);
        v.y = v.y + (v.dy/d) * Math.min(d, t);

        /* Stay inside the frame. */
        /*
        borderWidth = this.width / 50;
        if (v.x < borderWidth) {
          v.x = borderWidth;
        } else if (v.x > this.width - borderWidth) {
          v.x = this.width - borderWidth;
        }

        if (v.y < borderWidth) {
          v.y = borderWidth;
        } else if (v.y > this.height - borderWidth) {
          v.y = this.height - borderWidth;
        }
        */
        v.x = Math.round(v.x);
        v.y = Math.round(v.y);
      }
    }

    /* Cool. */
    t -= dt;

    if (q % 10 == 0) {
      this.callback();
    }
  }

  // Remove virtual center vertices
  if (centers) {
    for (var i in centers) {
      graph.removeVertex(centers[i]);
    }
  }

  graph.normalize(this.width, this.height, true);
};

module.exports = foograph;

},{}],2:[function(_dereq_,module,exports){
'use strict';

(function(){

  // registers the extension on a cytoscape lib ref
  var getLayout = _dereq_('./layout');
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

},{"./layout":3}],3:[function(_dereq_,module,exports){
var Thread;

var foograph = _dereq_('./foograph');
var Voronoi = _dereq_('./rhill-voronoi-core');

/*
 * This layout combines several algorithms:
 *
 * - It generates an initial position of the nodes by using the
 *   Fruchterman-Reingold algorithm (doi:10.1002/spe.4380211102)
 *
 * - Finally it eliminates overlaps by using the method described by
 *   Gansner and North (doi:10.1007/3-540-37623-2_28)
 */

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

function SpreadLayout( options ) {
  var opts = this.options = {};
  for( var i in defaults ){ opts[i] = defaults[i]; }
  for( var i in options ){ opts[i] = options[i]; }
}

function cellCentroid( cell ) {
  var hes = cell.halfedges;
  var area = 0,
    x = 0,
    y = 0;
  var p1, p2, f;

  for( var i = 0; i < hes.length; ++i ) {
    p1 = hes[ i ].getEndpoint();
    p2 = hes[ i ].getStartpoint();

    area += p1.x * p2.y;
    area -= p1.y * p2.x;

    f = p1.x * p2.y - p2.x * p1.y;
    x += ( p1.x + p2.x ) * f;
    y += ( p1.y + p2.y ) * f;
  }

  area /= 2;
  f = area * 6;
  return {
    x: x / f,
    y: y / f
  };
}

function sitesDistance( ls, rs ) {
  var dx = ls.x - rs.x;
  var dy = ls.y - rs.y;
  return Math.sqrt( dx * dx + dy * dy );
}

SpreadLayout.prototype.run = function() {

  var layout = this;
  var options = this.options;
  var cy = options.cy;

  var bb = options.boundingBox || { x1: 0, y1: 0, w: cy.width(), h: cy.height() };
  if( bb.x2 === undefined ){ bb.x2 = bb.x1 + bb.w; }
  if( bb.w === undefined ){ bb.w = bb.x2 - bb.x1; }
  if( bb.y2 === undefined ){ bb.y2 = bb.y1 + bb.h; }
  if( bb.h === undefined ){ bb.h = bb.y2 - bb.y1; }

  var nodes = cy.nodes();
  var edges = cy.edges();
  var cWidth = cy.width();
  var cHeight = cy.height();
  var simulationBounds = bb;
  var padding = options.padding;
  var simBBFactor = Math.max( 1, Math.log(nodes.length) * 0.8 );

  if( nodes.length < 100 ){
    simBBFactor /= 2;
  }

  layout.trigger( {
    type: 'layoutstart',
    layout: layout
  } );

  var simBB = {
    x1: 0,
    y1: 0,
    x2: cWidth * simBBFactor,
    y2: cHeight * simBBFactor
  };

  if( simulationBounds ) {
    simBB.x1 = simulationBounds.x1;
    simBB.y1 = simulationBounds.y1;
    simBB.x2 = simulationBounds.x2;
    simBB.y2 = simulationBounds.y2;
  }

  simBB.x1 += padding;
  simBB.y1 += padding;
  simBB.x2 -= padding;
  simBB.y2 -= padding;

  var width = simBB.x2 - simBB.x1;
  var height = simBB.y2 - simBB.y1;

  // Get start time
  var startTime = Date.now();

  // layout doesn't work with just 1 node
  if( nodes.size() <= 1 ) {
    nodes.positions( {
      x: Math.round( ( simBB.x1 + simBB.x2 ) / 2 ),
      y: Math.round( ( simBB.y1 + simBB.y2 ) / 2 )
    } );

    if( options.fit ) {
      cy.fit( options.padding );
    }

    // Get end time
    var endTime = Date.now();
    console.info( "Layout on " + nodes.size() + " nodes took " + ( endTime - startTime ) + " ms" );

    layout.one( "layoutready", options.ready );
    layout.trigger( "layoutready" );

    layout.one( "layoutstop", options.stop );
    layout.trigger( "layoutstop" );

    return;
  }

  // First I need to create the data structure to pass to the worker
  var pData = {
    'width': width,
    'height': height,
    'minDist': options.minDist,
    'expFact': options.expandingFactor,
    'expIt': 0,
    'maxExpIt': options.maxExpandIterations,
    'vertices': [],
    'edges': [],
    'startTime': startTime,
    'maxFruchtermanReingoldIterations': options.maxFruchtermanReingoldIterations
  };

  nodes.each(
    function( i, node ) {
      var nodeId = node.id();
      var pos = node.position();

      if( options.randomize ){
        pos = {
          x: Math.round( simBB.x1 + (simBB.x2 - simBB.x1) * Math.random() ),
          y: Math.round( simBB.y1 + (simBB.y2 - simBB.y1) * Math.random() )
        };
      }

      pData[ 'vertices' ].push( {
        id: nodeId,
        x: pos.x,
        y: pos.y
      } );
    } );

  edges.each(
    function() {
      var srcNodeId = this.source().id();
      var tgtNodeId = this.target().id();
      pData[ 'edges' ].push( {
        src: srcNodeId,
        tgt: tgtNodeId
      } );
    } );

  //Decleration
  var t1 = layout.thread;

  // reuse old thread if possible
  if( !t1 || t1.stopped() ){
    t1 = layout.thread = Thread();

    // And to add the required scripts
    //EXTERNAL 1
    t1.require( foograph, 'foograph' );
    //EXTERNAL 2
    t1.require( Voronoi );

    //Local function
    t1.require( sitesDistance );
    t1.require( cellCentroid );
  }

  function setPositions( pData ){ //console.log('set posns')
    // First we retrieve the important data
    // var expandIteration = pData[ 'expIt' ];
    var dataVertices = pData[ 'vertices' ];
    var vertices = [];
    for( var i = 0; i < dataVertices.length; ++i ) {
      var dv = dataVertices[ i ];
      vertices[ dv.id ] = {
        x: dv.x,
        y: dv.y
      };
    }
    /*
     * FINALLY:
     *
     * We position the nodes based on the calculation
     */
    nodes.positions(
      function( i, node ) {
        var id = node.id()
        var vertex = vertices[ id ];

        return {
          x: Math.round( simBB.x1 + vertex.x ),
          y: Math.round( simBB.y1 + vertex.y )
        };
      } );

    if( options.fit ) {
      cy.fit( options.padding );
    }

    cy.nodes().rtrigger( "position" );
  }

  var didLayoutReady = false;
  t1.on('message', function(e){
    var pData = e.message; //console.log('message', e)

    if( !options.animate ){
      return;
    }

    setPositions( pData );

    if( !didLayoutReady ){
      layout.trigger( "layoutready" );

      didLayoutReady = true;
    }
  });

  layout.one( "layoutready", options.ready );

  t1.pass( pData ).run( function( pData ) {

    foograph = eval('foograph');
    Voronoi = eval('Voronoi');

    // I need to retrieve the important data
    var lWidth = pData[ 'width' ];
    var lHeight = pData[ 'height' ];
    var lMinDist = pData[ 'minDist' ];
    var lExpFact = pData[ 'expFact' ];
    var lMaxExpIt = pData[ 'maxExpIt' ];
    var lMaxFruchtermanReingoldIterations = pData[ 'maxFruchtermanReingoldIterations' ];

    // Prepare the data to output
    var savePositions = function(){
      pData[ 'width' ] = lWidth;
      pData[ 'height' ] = lHeight;
      pData[ 'expIt' ] = expandIteration;
      pData[ 'expFact' ] = lExpFact;

      pData[ 'vertices' ] = [];
      for( var i = 0; i < fv.length; ++i ) {
        pData[ 'vertices' ].push( {
          id: fv[ i ].label,
          x: fv[ i ].x,
          y: fv[ i ].y
        } );
      }
    };

    var messagePositions = function(){
      broadcast( pData );
    };

    /*
     * FIRST STEP: Application of the Fruchterman-Reingold algorithm
     *
     * We use the version implemented by the foograph library
     *
     * Ref.: https://code.google.com/p/foograph/
     */

    // We need to create an instance of a graph compatible with the library
    var frg = new foograph.Graph( "FRgraph", false );

    var frgNodes = {};

    // Then we have to add the vertices
    var dataVertices = pData[ 'vertices' ];
    for( var ni = 0; ni < dataVertices.length; ++ni ) {
      var id = dataVertices[ ni ][ 'id' ];
      var v = new foograph.Vertex( id, Math.round( Math.random() * lHeight ), Math.round( Math.random() * lHeight ) );
      frgNodes[ id ] = v;
      frg.insertVertex( v );
    }

    var dataEdges = pData[ 'edges' ];
    for( var ei = 0; ei < dataEdges.length; ++ei ) {
      var srcNodeId = dataEdges[ ei ][ 'src' ];
      var tgtNodeId = dataEdges[ ei ][ 'tgt' ];
      frg.insertEdge( "", 1, frgNodes[ srcNodeId ], frgNodes[ tgtNodeId ] );
    }

    var fv = frg.vertices;

    // Then we apply the layout
    var iterations = lMaxFruchtermanReingoldIterations;
    var frLayoutManager = new foograph.ForceDirectedVertexLayout( lWidth, lHeight, iterations, false, lMinDist );

    frLayoutManager.callback = function(){
      savePositions();
      messagePositions();
    };

    frLayoutManager.layout( frg );

    savePositions();
    messagePositions();

    /*
     * SECOND STEP: Tiding up of the graph.
     *
     * We use the method described by Gansner and North, based on Voronoi
     * diagrams.
     *
     * Ref: doi:10.1007/3-540-37623-2_28
     */

    // We calculate the Voronoi diagram dor the position of the nodes
    var voronoi = new Voronoi();
    var bbox = {
      xl: 0,
      xr: lWidth,
      yt: 0,
      yb: lHeight
    };
    var vSites = [];
    for( var i = 0; i < fv.length; ++i ) {
      vSites[ fv[ i ].label ] = fv[ i ];
    }

    function checkMinDist( ee ) {
      var infractions = 0;
      // Then we check if the minimum distance is satisfied
      for( var eei = 0; eei < ee.length; ++eei ) {
        var e = ee[ eei ];
        if( ( e.lSite != null ) && ( e.rSite != null ) && sitesDistance( e.lSite, e.rSite ) < lMinDist ) {
          ++infractions;
        }
      }
      return infractions;
    }

    var diagram = voronoi.compute( fv, bbox );

    // Then we reposition the nodes at the centroid of their Voronoi cells
    var cells = diagram.cells;
    for( var i = 0; i < cells.length; ++i ) {
      var cell = cells[ i ];
      var site = cell.site;
      var centroid = cellCentroid( cell );
      var currv = vSites[ site.label ];
      currv.x = centroid.x;
      currv.y = centroid.y;
    }

    if( lExpFact < 0.0 ) {
      // Calculates the expanding factor
      lExpFact = Math.max( 0.05, Math.min( 0.10, lMinDist / Math.sqrt( ( lWidth * lHeight ) / fv.length ) * 0.5 ) );
      //console.info("Expanding factor is " + (options.expandingFactor * 100.0) + "%");
    }

    var prevInfractions = checkMinDist( diagram.edges );
    //console.info("Initial infractions " + prevInfractions);

    var bStop = ( prevInfractions <= 0 );

    var voronoiIteration = 0;
    var expandIteration = 0;

    // var initWidth = lWidth;

    while( !bStop ) {
      ++voronoiIteration;
      for( var it = 0; it <= 4; ++it ) {
        voronoi.recycle( diagram );
        diagram = voronoi.compute( fv, bbox );

        // Then we reposition the nodes at the centroid of their Voronoi cells
        cells = diagram.cells;
        for( var i = 0; i < cells.length; ++i ) {
          var cell = cells[ i ];
          var site = cell.site;
          var centroid = cellCentroid( cell );
          var currv = vSites[ site.label ];
          currv.x = centroid.x;
          currv.y = centroid.y;
        }
      }

      var currInfractions = checkMinDist( diagram.edges );
      //console.info("Current infractions " + currInfractions);

      if( currInfractions <= 0 ) {
        bStop = true;
      } else {
        if( currInfractions >= prevInfractions || voronoiIteration >= 4 ) {
          if( expandIteration >= lMaxExpIt ) {
            bStop = true;
          } else {
            lWidth += lWidth * lExpFact;
            lHeight += lHeight * lExpFact;
            bbox = {
              xl: 0,
              xr: lWidth,
              yt: 0,
              yb: lHeight
            };
            ++expandIteration;
            voronoiIteration = 0;
            //console.info("Expanded to ("+width+","+height+")");
          }
        }
      }
      prevInfractions = currInfractions;

      savePositions();
      messagePositions();
    }

    savePositions();
    return pData;

  } ).then( function( pData ) {
    // var expandIteration = pData[ 'expIt' ];
    var dataVertices = pData[ 'vertices' ];

    setPositions( pData );

    // Get end time
    var startTime = pData[ 'startTime' ];
    var endTime = new Date();
    console.info( "Layout on " + dataVertices.length + " nodes took " + ( endTime - startTime ) + " ms" );

    layout.one( "layoutstop", options.stop );

    if( !options.animate ){
      layout.trigger( "layoutready" );
    }

    layout.trigger( "layoutstop" );

    t1.stop();
  } );


  return this;
}; // run

SpreadLayout.prototype.stop = function(){
  if( this.thread ){
    this.thread.stop();
  }

  this.trigger('layoutstop');
};

SpreadLayout.prototype.destroy = function(){
  if( this.thread ){
    this.thread.stop();
  }
};

module.exports = function get( cytoscape ){
  Thread = cytoscape.Thread;

  return SpreadLayout;
};

},{"./foograph":1,"./rhill-voronoi-core":4}],4:[function(_dereq_,module,exports){
/*!
Copyright (C) 2010-2013 Raymond Hill: https://github.com/gorhill/Javascript-Voronoi
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
*/
/*
Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
File: rhill-voronoi-core.js
Version: 0.98
Date: January 21, 2013
Description: This is my personal Javascript implementation of
Steven Fortune's algorithm to compute Voronoi diagrams.

License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md

## Usage:

  var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
  // xl, xr means x left, x right
  // yt, yb means y top, y bottom
  var bbox = {xl:0, xr:800, yt:0, yb:600};
  var voronoi = new Voronoi();
  // pass an object which exhibits xl, xr, yt, yb properties. The bounding
  // box will be used to connect unbound edges, and to close open cells
  result = voronoi.compute(sites, bbox);
  // render, further analyze, etc.

Return value:
  An object with the following properties:

  result.vertices = an array of unordered, unique Voronoi.Vertex objects making
    up the Voronoi diagram.
  result.edges = an array of unordered, unique Voronoi.Edge objects making up
    the Voronoi diagram.
  result.cells = an array of Voronoi.Cell object making up the Voronoi diagram.
    A Cell object might have an empty array of halfedges, meaning no Voronoi
    cell could be computed for a particular cell.
  result.execTime = the time it took to compute the Voronoi diagram, in
    milliseconds.

Voronoi.Vertex object:
  x: The x position of the vertex.
  y: The y position of the vertex.

Voronoi.Edge object:
  lSite: the Voronoi site object at the left of this Voronoi.Edge object.
  rSite: the Voronoi site object at the right of this Voronoi.Edge object (can
    be null).
  va: an object with an 'x' and a 'y' property defining the start point
    (relative to the Voronoi site on the left) of this Voronoi.Edge object.
  vb: an object with an 'x' and a 'y' property defining the end point
    (relative to Voronoi site on the left) of this Voronoi.Edge object.

  For edges which are used to close open cells (using the supplied bounding
  box), the rSite property will be null.

Voronoi.Cell object:
  site: the Voronoi site object associated with the Voronoi cell.
  halfedges: an array of Voronoi.Halfedge objects, ordered counterclockwise,
    defining the polygon for this Voronoi cell.

Voronoi.Halfedge object:
  site: the Voronoi site object owning this Voronoi.Halfedge object.
  edge: a reference to the unique Voronoi.Edge object underlying this
    Voronoi.Halfedge object.
  getStartpoint(): a method returning an object with an 'x' and a 'y' property
    for the start point of this halfedge. Keep in mind halfedges are always
    countercockwise.
  getEndpoint(): a method returning an object with an 'x' and a 'y' property
    for the end point of this halfedge. Keep in mind halfedges are always
    countercockwise.

TODO: Identify opportunities for performance improvement.

TODO: Let the user close the Voronoi cells, do not do it automatically. Not only let
      him close the cells, but also allow him to close more than once using a different
      bounding box for the same Voronoi diagram.
*/

/*global Math */

// ---------------------------------------------------------------------------

function Voronoi() {
    this.vertices = null;
    this.edges = null;
    this.cells = null;
    this.toRecycle = null;
    this.beachsectionJunkyard = [];
    this.circleEventJunkyard = [];
    this.vertexJunkyard = [];
    this.edgeJunkyard = [];
    this.cellJunkyard = [];
    }

// ---------------------------------------------------------------------------

Voronoi.prototype.reset = function() {
    if (!this.beachline) {
        this.beachline = new this.RBTree();
        }
    // Move leftover beachsections to the beachsection junkyard.
    if (this.beachline.root) {
        var beachsection = this.beachline.getFirst(this.beachline.root);
        while (beachsection) {
            this.beachsectionJunkyard.push(beachsection); // mark for reuse
            beachsection = beachsection.rbNext;
            }
        }
    this.beachline.root = null;
    if (!this.circleEvents) {
        this.circleEvents = new this.RBTree();
        }
    this.circleEvents.root = this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = [];
    };

Voronoi.prototype.sqrt = function(n){ return Math.sqrt(n); };
Voronoi.prototype.abs = function(n){ return Math.abs(n); };
Voronoi.prototype.ε = Voronoi.ε = 1e-9;
Voronoi.prototype.invε = Voronoi.invε = 1.0 / Voronoi.ε;
Voronoi.prototype.equalWithEpsilon = function(a,b){return this.abs(a-b)<1e-9;};
Voronoi.prototype.greaterThanWithEpsilon = function(a,b){return a-b>1e-9;};
Voronoi.prototype.greaterThanOrEqualWithEpsilon = function(a,b){return b-a<1e-9;};
Voronoi.prototype.lessThanWithEpsilon = function(a,b){return b-a>1e-9;};
Voronoi.prototype.lessThanOrEqualWithEpsilon = function(a,b){return a-b<1e-9;};

// ---------------------------------------------------------------------------
// Red-Black tree code (based on C version of "rbtree" by Franck Bui-Huu
// https://github.com/fbuihuu/libtree/blob/master/rb.c

Voronoi.prototype.RBTree = function() {
    this.root = null;
    };

Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function(node, successor) {
    var parent;
    if (node) {
        // >>> rhill 2011-05-27: Performance: cache previous/next nodes
        successor.rbPrevious = node;
        successor.rbNext = node.rbNext;
        if (node.rbNext) {
            node.rbNext.rbPrevious = successor;
            }
        node.rbNext = successor;
        // <<<
        if (node.rbRight) {
            // in-place expansion of node.rbRight.getFirst();
            node = node.rbRight;
            while (node.rbLeft) {node = node.rbLeft;}
            node.rbLeft = successor;
            }
        else {
            node.rbRight = successor;
            }
        parent = node;
        }
    // rhill 2011-06-07: if node is null, successor must be inserted
    // to the left-most part of the tree
    else if (this.root) {
        node = this.getFirst(this.root);
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = null;
        successor.rbNext = node;
        node.rbPrevious = successor;
        // <<<
        node.rbLeft = successor;
        parent = node;
        }
    else {
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = successor.rbNext = null;
        // <<<
        this.root = successor;
        parent = null;
        }
    successor.rbLeft = successor.rbRight = null;
    successor.rbParent = parent;
    successor.rbRed = true;
    // Fixup the modified tree by recoloring nodes and performing
    // rotations (2 at most) hence the red-black tree properties are
    // preserved.
    var grandpa, uncle;
    node = successor;
    while (parent && parent.rbRed) {
        grandpa = parent.rbParent;
        if (parent === grandpa.rbLeft) {
            uncle = grandpa.rbRight;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
                }
            else {
                if (node === parent.rbRight) {
                    this.rbRotateLeft(parent);
                    node = parent;
                    parent = node.rbParent;
                    }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateRight(grandpa);
                }
            }
        else {
            uncle = grandpa.rbLeft;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
                }
            else {
                if (node === parent.rbLeft) {
                    this.rbRotateRight(parent);
                    node = parent;
                    parent = node.rbParent;
                    }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateLeft(grandpa);
                }
            }
        parent = node.rbParent;
        }
    this.root.rbRed = false;
    };

Voronoi.prototype.RBTree.prototype.rbRemoveNode = function(node) {
    // >>> rhill 2011-05-27: Performance: cache previous/next nodes
    if (node.rbNext) {
        node.rbNext.rbPrevious = node.rbPrevious;
        }
    if (node.rbPrevious) {
        node.rbPrevious.rbNext = node.rbNext;
        }
    node.rbNext = node.rbPrevious = null;
    // <<<
    var parent = node.rbParent,
        left = node.rbLeft,
        right = node.rbRight,
        next;
    if (!left) {
        next = right;
        }
    else if (!right) {
        next = left;
        }
    else {
        next = this.getFirst(right);
        }
    if (parent) {
        if (parent.rbLeft === node) {
            parent.rbLeft = next;
            }
        else {
            parent.rbRight = next;
            }
        }
    else {
        this.root = next;
        }
    // enforce red-black rules
    var isRed;
    if (left && right) {
        isRed = next.rbRed;
        next.rbRed = node.rbRed;
        next.rbLeft = left;
        left.rbParent = next;
        if (next !== right) {
            parent = next.rbParent;
            next.rbParent = node.rbParent;
            node = next.rbRight;
            parent.rbLeft = node;
            next.rbRight = right;
            right.rbParent = next;
            }
        else {
            next.rbParent = parent;
            parent = next;
            node = next.rbRight;
            }
        }
    else {
        isRed = node.rbRed;
        node = next;
        }
    // 'node' is now the sole successor's child and 'parent' its
    // new parent (since the successor can have been moved)
    if (node) {
        node.rbParent = parent;
        }
    // the 'easy' cases
    if (isRed) {return;}
    if (node && node.rbRed) {
        node.rbRed = false;
        return;
        }
    // the other cases
    var sibling;
    do {
        if (node === this.root) {
            break;
            }
        if (node === parent.rbLeft) {
            sibling = parent.rbRight;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateLeft(parent);
                sibling = parent.rbRight;
                }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbRight || !sibling.rbRight.rbRed) {
                    sibling.rbLeft.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateRight(sibling);
                    sibling = parent.rbRight;
                    }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbRight.rbRed = false;
                this.rbRotateLeft(parent);
                node = this.root;
                break;
                }
            }
        else {
            sibling = parent.rbLeft;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateRight(parent);
                sibling = parent.rbLeft;
                }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
                    sibling.rbRight.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateLeft(sibling);
                    sibling = parent.rbLeft;
                    }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbLeft.rbRed = false;
                this.rbRotateRight(parent);
                node = this.root;
                break;
                }
            }
        sibling.rbRed = true;
        node = parent;
        parent = parent.rbParent;
    } while (!node.rbRed);
    if (node) {node.rbRed = false;}
    };

Voronoi.prototype.RBTree.prototype.rbRotateLeft = function(node) {
    var p = node,
        q = node.rbRight, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
            }
        else {
            parent.rbRight = q;
            }
        }
    else {
        this.root = q;
        }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbRight = q.rbLeft;
    if (p.rbRight) {
        p.rbRight.rbParent = p;
        }
    q.rbLeft = p;
    };

Voronoi.prototype.RBTree.prototype.rbRotateRight = function(node) {
    var p = node,
        q = node.rbLeft, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
            }
        else {
            parent.rbRight = q;
            }
        }
    else {
        this.root = q;
        }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbLeft = q.rbRight;
    if (p.rbLeft) {
        p.rbLeft.rbParent = p;
        }
    q.rbRight = p;
    };

Voronoi.prototype.RBTree.prototype.getFirst = function(node) {
    while (node.rbLeft) {
        node = node.rbLeft;
        }
    return node;
    };

Voronoi.prototype.RBTree.prototype.getLast = function(node) {
    while (node.rbRight) {
        node = node.rbRight;
        }
    return node;
    };

// ---------------------------------------------------------------------------
// Diagram methods

Voronoi.prototype.Diagram = function(site) {
    this.site = site;
    };

// ---------------------------------------------------------------------------
// Cell methods

Voronoi.prototype.Cell = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    };

Voronoi.prototype.Cell.prototype.init = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    return this;
    };

Voronoi.prototype.createCell = function(site) {
    var cell = this.cellJunkyard.pop();
    if ( cell ) {
        return cell.init(site);
        }
    return new this.Cell(site);
    };

Voronoi.prototype.Cell.prototype.prepareHalfedges = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        edge;
    // get rid of unused halfedges
    // rhill 2011-05-27: Keep it simple, no point here in trying
    // to be fancy: dangling edges are a typically a minority.
    while (iHalfedge--) {
        edge = halfedges[iHalfedge].edge;
        if (!edge.vb || !edge.va) {
            halfedges.splice(iHalfedge,1);
            }
        }

    // rhill 2011-05-26: I tried to use a binary search at insertion
    // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
    // There was no real benefits in doing so, performance on
    // Firefox 3.6 was improved marginally, while performance on
    // Opera 11 was penalized marginally.
    halfedges.sort(function(a,b){return b.angle-a.angle;});
    return halfedges.length;
    };

// Return a list of the neighbor Ids
Voronoi.prototype.Cell.prototype.getNeighborIds = function() {
    var neighbors = [],
        iHalfedge = this.halfedges.length,
        edge;
    while (iHalfedge--){
        edge = this.halfedges[iHalfedge].edge;
        if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
            neighbors.push(edge.lSite.voronoiId);
            }
        else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId){
            neighbors.push(edge.rSite.voronoiId);
            }
        }
    return neighbors;
    };

// Compute bounding box
//
Voronoi.prototype.Cell.prototype.getBbox = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity,
        v, vx, vy;
    while (iHalfedge--) {
        v = halfedges[iHalfedge].getStartpoint();
        vx = v.x;
        vy = v.y;
        if (vx < xmin) {xmin = vx;}
        if (vy < ymin) {ymin = vy;}
        if (vx > xmax) {xmax = vx;}
        if (vy > ymax) {ymax = vy;}
        // we dont need to take into account end point,
        // since each end point matches a start point
        }
    return {
        x: xmin,
        y: ymin,
        width: xmax-xmin,
        height: ymax-ymin
        };
    };

// Return whether a point is inside, on, or outside the cell:
//   -1: point is outside the perimeter of the cell
//    0: point is on the perimeter of the cell
//    1: point is inside the perimeter of the cell
//
Voronoi.prototype.Cell.prototype.pointIntersection = function(x, y) {
    // Check if point in polygon. Since all polygons of a Voronoi
    // diagram are convex, then:
    // http://paulbourke.net/geometry/polygonmesh/
    // Solution 3 (2D):
    //   "If the polygon is convex then one can consider the polygon
    //   "as a 'path' from the first vertex. A point is on the interior
    //   "of this polygons if it is always on the same side of all the
    //   "line segments making up the path. ...
    //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
    //   "if it is less than 0 then P is to the right of the line segment,
    //   "if greater than 0 it is to the left, if equal to 0 then it lies
    //   "on the line segment"
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        p0, p1, r;
    while (iHalfedge--) {
        halfedge = halfedges[iHalfedge];
        p0 = halfedge.getStartpoint();
        p1 = halfedge.getEndpoint();
        r = (y-p0.y)*(p1.x-p0.x)-(x-p0.x)*(p1.y-p0.y);
        if (!r) {
            return 0;
            }
        if (r > 0) {
            return -1;
            }
        }
    return 1;
    };

// ---------------------------------------------------------------------------
// Edge methods
//

Voronoi.prototype.Vertex = function(x, y) {
    this.x = x;
    this.y = y;
    };

Voronoi.prototype.Edge = function(lSite, rSite) {
    this.lSite = lSite;
    this.rSite = rSite;
    this.va = this.vb = null;
    };

Voronoi.prototype.Halfedge = function(edge, lSite, rSite) {
    this.site = lSite;
    this.edge = edge;
    // 'angle' is a value to be used for properly sorting the
    // halfsegments counterclockwise. By convention, we will
    // use the angle of the line defined by the 'site to the left'
    // to the 'site to the right'.
    // However, border edges have no 'site to the right': thus we
    // use the angle of line perpendicular to the halfsegment (the
    // edge should have both end points defined in such case.)
    if (rSite) {
        this.angle = Math.atan2(rSite.y-lSite.y, rSite.x-lSite.x);
        }
    else {
        var va = edge.va,
            vb = edge.vb;
        // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
        // but for performance purpose, these are expanded in place here.
        this.angle = edge.lSite === lSite ?
            Math.atan2(vb.x-va.x, va.y-vb.y) :
            Math.atan2(va.x-vb.x, vb.y-va.y);
        }
    };

Voronoi.prototype.createHalfedge = function(edge, lSite, rSite) {
    return new this.Halfedge(edge, lSite, rSite);
    };

Voronoi.prototype.Halfedge.prototype.getStartpoint = function() {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
    };

Voronoi.prototype.Halfedge.prototype.getEndpoint = function() {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
    };



// this create and add a vertex to the internal collection

Voronoi.prototype.createVertex = function(x, y) {
    var v = this.vertexJunkyard.pop();
    if ( !v ) {
        v = new this.Vertex(x, y);
        }
    else {
        v.x = x;
        v.y = y;
        }
    this.vertices.push(v);
    return v;
    };

// this create and add an edge to internal collection, and also create
// two halfedges which are added to each site's counterclockwise array
// of halfedges.

Voronoi.prototype.createEdge = function(lSite, rSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if ( !edge ) {
        edge = new this.Edge(lSite, rSite);
        }
    else {
        edge.lSite = lSite;
        edge.rSite = rSite;
        edge.va = edge.vb = null;
        }

    this.edges.push(edge);
    if (va) {
        this.setEdgeStartpoint(edge, lSite, rSite, va);
        }
    if (vb) {
        this.setEdgeEndpoint(edge, lSite, rSite, vb);
        }
    this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
    this.cells[rSite.voronoiId].halfedges.push(this.createHalfedge(edge, rSite, lSite));
    return edge;
    };

Voronoi.prototype.createBorderEdge = function(lSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if ( !edge ) {
        edge = new this.Edge(lSite, null);
        }
    else {
        edge.lSite = lSite;
        edge.rSite = null;
        }
    edge.va = va;
    edge.vb = vb;
    this.edges.push(edge);
    return edge;
    };

Voronoi.prototype.setEdgeStartpoint = function(edge, lSite, rSite, vertex) {
    if (!edge.va && !edge.vb) {
        edge.va = vertex;
        edge.lSite = lSite;
        edge.rSite = rSite;
        }
    else if (edge.lSite === rSite) {
        edge.vb = vertex;
        }
    else {
        edge.va = vertex;
        }
    };

Voronoi.prototype.setEdgeEndpoint = function(edge, lSite, rSite, vertex) {
    this.setEdgeStartpoint(edge, rSite, lSite, vertex);
    };

// ---------------------------------------------------------------------------
// Beachline methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.Beachsection = function() {
    };

// rhill 2011-06-02: A lot of Beachsection instanciations
// occur during the computation of the Voronoi diagram,
// somewhere between the number of sites and twice the
// number of sites, while the number of Beachsections on the
// beachline at any given time is comparatively low. For this
// reason, we reuse already created Beachsections, in order
// to avoid new memory allocation. This resulted in a measurable
// performance gain.

Voronoi.prototype.createBeachsection = function(site) {
    var beachsection = this.beachsectionJunkyard.pop();
    if (!beachsection) {
        beachsection = new this.Beachsection();
        }
    beachsection.site = site;
    return beachsection;
    };

// calculate the left break point of a particular beach section,
// given a particular sweep line
Voronoi.prototype.leftBreakPoint = function(arc, directrix) {
    // http://en.wikipedia.org/wiki/Parabola
    // http://en.wikipedia.org/wiki/Quadratic_equation
    // h1 = x1,
    // k1 = (y1+directrix)/2,
    // h2 = x2,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = -h1/(2*p1),
    // c1 = h1*h1/(4*p1)+k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
    // When x1 become the x-origin:
    // h1 = 0,
    // k1 = (y1+directrix)/2,
    // h2 = x2-x1,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = 0,
    // c1 = k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1

    // change code below at your own risk: care has been taken to
    // reduce errors due to computers' finite arithmetic precision.
    // Maybe can still be improved, will see if any more of this
    // kind of errors pop up again.
    var site = arc.site,
        rfocx = site.x,
        rfocy = site.y,
        pby2 = rfocy-directrix;
    // parabola in degenerate case where focus is on directrix
    if (!pby2) {
        return rfocx;
        }
    var lArc = arc.rbPrevious;
    if (!lArc) {
        return -Infinity;
        }
    site = lArc.site;
    var lfocx = site.x,
        lfocy = site.y,
        plby2 = lfocy-directrix;
    // parabola in degenerate case where focus is on directrix
    if (!plby2) {
        return lfocx;
        }
    var hl = lfocx-rfocx,
        aby2 = 1/pby2-1/plby2,
        b = hl/plby2;
    if (aby2) {
        return (-b+this.sqrt(b*b-2*aby2*(hl*hl/(-2*plby2)-lfocy+plby2/2+rfocy-pby2/2)))/aby2+rfocx;
        }
    // both parabolas have same distance to directrix, thus break point is midway
    return (rfocx+lfocx)/2;
    };

// calculate the right break point of a particular beach section,
// given a particular directrix
Voronoi.prototype.rightBreakPoint = function(arc, directrix) {
    var rArc = arc.rbNext;
    if (rArc) {
        return this.leftBreakPoint(rArc, directrix);
        }
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
    };

Voronoi.prototype.detachBeachsection = function(beachsection) {
    this.detachCircleEvent(beachsection); // detach potentially attached circle event
    this.beachline.rbRemoveNode(beachsection); // remove from RB-tree
    this.beachsectionJunkyard.push(beachsection); // mark for reuse
    };

Voronoi.prototype.removeBeachsection = function(beachsection) {
    var circle = beachsection.circleEvent,
        x = circle.x,
        y = circle.ycenter,
        vertex = this.createVertex(x, y),
        previous = beachsection.rbPrevious,
        next = beachsection.rbNext,
        disappearingTransitions = [beachsection],
        abs_fn = Math.abs;

    // remove collapsed beachsection from beachline
    this.detachBeachsection(beachsection);

    // there could be more than one empty arc at the deletion point, this
    // happens when more than two edges are linked by the same vertex,
    // so we will collect all those edges by looking up both sides of
    // the deletion point.
    // by the way, there is *always* a predecessor/successor to any collapsed
    // beach section, it's just impossible to have a collapsing first/last
    // beach sections on the beachline, since they obviously are unconstrained
    // on their left/right side.

    // look left
    var lArc = previous;
    while (lArc.circleEvent && abs_fn(x-lArc.circleEvent.x)<1e-9 && abs_fn(y-lArc.circleEvent.ycenter)<1e-9) {
        previous = lArc.rbPrevious;
        disappearingTransitions.unshift(lArc);
        this.detachBeachsection(lArc); // mark for reuse
        lArc = previous;
        }
    // even though it is not disappearing, I will also add the beach section
    // immediately to the left of the left-most collapsed beach section, for
    // convenience, since we need to refer to it later as this beach section
    // is the 'left' site of an edge for which a start point is set.
    disappearingTransitions.unshift(lArc);
    this.detachCircleEvent(lArc);

    // look right
    var rArc = next;
    while (rArc.circleEvent && abs_fn(x-rArc.circleEvent.x)<1e-9 && abs_fn(y-rArc.circleEvent.ycenter)<1e-9) {
        next = rArc.rbNext;
        disappearingTransitions.push(rArc);
        this.detachBeachsection(rArc); // mark for reuse
        rArc = next;
        }
    // we also have to add the beach section immediately to the right of the
    // right-most collapsed beach section, since there is also a disappearing
    // transition representing an edge's start point on its left.
    disappearingTransitions.push(rArc);
    this.detachCircleEvent(rArc);

    // walk through all the disappearing transitions between beach sections and
    // set the start point of their (implied) edge.
    var nArcs = disappearingTransitions.length,
        iArc;
    for (iArc=1; iArc<nArcs; iArc++) {
        rArc = disappearingTransitions[iArc];
        lArc = disappearingTransitions[iArc-1];
        this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
        }

    // create a new edge as we have now a new transition between
    // two beach sections which were previously not adjacent.
    // since this edge appears as a new vertex is defined, the vertex
    // actually define an end point of the edge (relative to the site
    // on the left)
    lArc = disappearingTransitions[0];
    rArc = disappearingTransitions[nArcs-1];
    rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

    // create circle events if any for beach sections left in the beachline
    // adjacent to collapsed sections
    this.attachCircleEvent(lArc);
    this.attachCircleEvent(rArc);
    };

Voronoi.prototype.addBeachsection = function(site) {
    var x = site.x,
        directrix = site.y;

    // find the left and right beach sections which will surround the newly
    // created beach section.
    // rhill 2011-06-01: This loop is one of the most often executed,
    // hence we expand in-place the comparison-against-epsilon calls.
    var lArc, rArc,
        dxl, dxr,
        node = this.beachline.root;

    while (node) {
        dxl = this.leftBreakPoint(node,directrix)-x;
        // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection
        if (dxl > 1e-9) {
            // this case should never happen
            // if (!node.rbLeft) {
            //    rArc = node.rbLeft;
            //    break;
            //    }
            node = node.rbLeft;
            }
        else {
            dxr = x-this.rightBreakPoint(node,directrix);
            // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection
            if (dxr > 1e-9) {
                if (!node.rbRight) {
                    lArc = node;
                    break;
                    }
                node = node.rbRight;
                }
            else {
                // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
                if (dxl > -1e-9) {
                    lArc = node.rbPrevious;
                    rArc = node;
                    }
                // x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
                else if (dxr > -1e-9) {
                    lArc = node;
                    rArc = node.rbNext;
                    }
                // falls exactly somewhere in the middle of the beachsection
                else {
                    lArc = rArc = node;
                    }
                break;
                }
            }
        }
    // at this point, keep in mind that lArc and/or rArc could be
    // undefined or null.

    // create a new beach section object for the site and add it to RB-tree
    var newArc = this.createBeachsection(site);
    this.beachline.rbInsertSuccessor(lArc, newArc);

    // cases:
    //

    // [null,null]
    // least likely case: new beach section is the first beach section on the
    // beachline.
    // This case means:
    //   no new transition appears
    //   no collapsing beach section
    //   new beachsection become root of the RB-tree
    if (!lArc && !rArc) {
        return;
        }

    // [lArc,rArc] where lArc == rArc
    // most likely case: new beach section split an existing beach
    // section.
    // This case means:
    //   one new transition appears
    //   the left and right beach section might be collapsing as a result
    //   two new nodes added to the RB-tree
    if (lArc === rArc) {
        // invalidate circle event of split beach section
        this.detachCircleEvent(lArc);

        // split the beach section into two separate beach sections
        rArc = this.createBeachsection(lArc.site);
        this.beachline.rbInsertSuccessor(newArc, rArc);

        // since we have a new transition between two beach sections,
        // a new edge is born
        newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to be notified when the point of
        // collapse is reached.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
        }

    // [lArc,null]
    // even less likely case: new beach section is the *last* beach section
    // on the beachline -- this can happen *only* if *all* the previous beach
    // sections currently on the beachline share the same y value as
    // the new beach section.
    // This case means:
    //   one new transition appears
    //   no collapsing beach section as a result
    //   new beach section become right-most node of the RB-tree
    if (lArc && !rArc) {
        newArc.edge = this.createEdge(lArc.site,newArc.site);
        return;
        }

    // [null,rArc]
    // impossible case: because sites are strictly processed from top to bottom,
    // and left to right, which guarantees that there will always be a beach section
    // on the left -- except of course when there are no beach section at all on
    // the beach line, which case was handled above.
    // rhill 2011-06-02: No point testing in non-debug version
    //if (!lArc && rArc) {
    //    throw "Voronoi.addBeachsection(): What is this I don't even";
    //    }

    // [lArc,rArc] where lArc != rArc
    // somewhat less likely case: new beach section falls *exactly* in between two
    // existing beach sections
    // This case means:
    //   one transition disappears
    //   two new transitions appear
    //   the left and right beach section might be collapsing as a result
    //   only one new node added to the RB-tree
    if (lArc !== rArc) {
        // invalidate circle events of left and right sites
        this.detachCircleEvent(lArc);
        this.detachCircleEvent(rArc);

        // an existing transition disappears, meaning a vertex is defined at
        // the disappearance point.
        // since the disappearance is caused by the new beachsection, the
        // vertex is at the center of the circumscribed circle of the left,
        // new and right beachsections.
        // http://mathforum.org/library/drmath/view/55002.html
        // Except that I bring the origin at A to simplify
        // calculation
        var lSite = lArc.site,
            ax = lSite.x,
            ay = lSite.y,
            bx=site.x-ax,
            by=site.y-ay,
            rSite = rArc.site,
            cx=rSite.x-ax,
            cy=rSite.y-ay,
            d=2*(bx*cy-by*cx),
            hb=bx*bx+by*by,
            hc=cx*cx+cy*cy,
            vertex = this.createVertex((cy*hb-by*hc)/d+ax, (bx*hc-cx*hb)/d+ay);

        // one transition disappear
        this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);

        // two new transitions appear at the new vertex location
        newArc.edge = this.createEdge(lSite, site, undefined, vertex);
        rArc.edge = this.createEdge(site, rSite, undefined, vertex);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to handle the point of collapse.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
        }
    };

// ---------------------------------------------------------------------------
// Circle event methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.CircleEvent = function() {
    // rhill 2013-10-12: it helps to state exactly what we are at ctor time.
    this.arc = null;
    this.rbLeft = null;
    this.rbNext = null;
    this.rbParent = null;
    this.rbPrevious = null;
    this.rbRed = false;
    this.rbRight = null;
    this.site = null;
    this.x = this.y = this.ycenter = 0;
    };

Voronoi.prototype.attachCircleEvent = function(arc) {
    var lArc = arc.rbPrevious,
        rArc = arc.rbNext;
    if (!lArc || !rArc) {return;} // does that ever happen?
    var lSite = lArc.site,
        cSite = arc.site,
        rSite = rArc.site;

    // If site of left beachsection is same as site of
    // right beachsection, there can't be convergence
    if (lSite===rSite) {return;}

    // Find the circumscribed circle for the three sites associated
    // with the beachsection triplet.
    // rhill 2011-05-26: It is more efficient to calculate in-place
    // rather than getting the resulting circumscribed circle from an
    // object returned by calling Voronoi.circumcircle()
    // http://mathforum.org/library/drmath/view/55002.html
    // Except that I bring the origin at cSite to simplify calculations.
    // The bottom-most part of the circumcircle is our Fortune 'circle
    // event', and its center is a vertex potentially part of the final
    // Voronoi diagram.
    var bx = cSite.x,
        by = cSite.y,
        ax = lSite.x-bx,
        ay = lSite.y-by,
        cx = rSite.x-bx,
        cy = rSite.y-by;

    // If points l->c->r are clockwise, then center beach section does not
    // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
    // sign is reverse of the orientation, hence we reverse the test.
    // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
    // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
    // return infinites: 1e-12 seems to fix the problem.
    var d = 2*(ax*cy-ay*cx);
    if (d >= -2e-12){return;}

    var ha = ax*ax+ay*ay,
        hc = cx*cx+cy*cy,
        x = (cy*ha-ay*hc)/d,
        y = (ax*hc-cx*ha)/d,
        ycenter = y+by;

    // Important: ybottom should always be under or at sweep, so no need
    // to waste CPU cycles by checking

    // recycle circle event object if possible
    var circleEvent = this.circleEventJunkyard.pop();
    if (!circleEvent) {
        circleEvent = new this.CircleEvent();
        }
    circleEvent.arc = arc;
    circleEvent.site = cSite;
    circleEvent.x = x+bx;
    circleEvent.y = ycenter+this.sqrt(x*x+y*y); // y bottom
    circleEvent.ycenter = ycenter;
    arc.circleEvent = circleEvent;

    // find insertion point in RB-tree: circle events are ordered from
    // smallest to largest
    var predecessor = null,
        node = this.circleEvents.root;
    while (node) {
        if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
            if (node.rbLeft) {
                node = node.rbLeft;
                }
            else {
                predecessor = node.rbPrevious;
                break;
                }
            }
        else {
            if (node.rbRight) {
                node = node.rbRight;
                }
            else {
                predecessor = node;
                break;
                }
            }
        }
    this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);
    if (!predecessor) {
        this.firstCircleEvent = circleEvent;
        }
    };

Voronoi.prototype.detachCircleEvent = function(arc) {
    var circleEvent = arc.circleEvent;
    if (circleEvent) {
        if (!circleEvent.rbPrevious) {
            this.firstCircleEvent = circleEvent.rbNext;
            }
        this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree
        this.circleEventJunkyard.push(circleEvent);
        arc.circleEvent = null;
        }
    };

// ---------------------------------------------------------------------------
// Diagram completion methods

// connect dangling edges (not if a cursory test tells us
// it is not going to be visible.
// return value:
//   false: the dangling endpoint couldn't be connected
//   true: the dangling endpoint could be connected
Voronoi.prototype.connectEdge = function(edge, bbox) {
    // skip if end point already connected
    var vb = edge.vb;
    if (!!vb) {return true;}

    // make local copy for performance purpose
    var va = edge.va,
        xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        lSite = edge.lSite,
        rSite = edge.rSite,
        lx = lSite.x,
        ly = lSite.y,
        rx = rSite.x,
        ry = rSite.y,
        fx = (lx+rx)/2,
        fy = (ly+ry)/2,
        fm, fb;

    // if we reach here, this means cells which use this edge will need
    // to be closed, whether because the edge was removed, or because it
    // was connected to the bounding box.
    this.cells[lSite.voronoiId].closeMe = true;
    this.cells[rSite.voronoiId].closeMe = true;

    // get the line equation of the bisector if line is not vertical
    if (ry !== ly) {
        fm = (lx-rx)/(ry-ly);
        fb = fy-fm*fx;
        }

    // remember, direction of line (relative to left site):
    // upward: left.x < right.x
    // downward: left.x > right.x
    // horizontal: left.x == right.x
    // upward: left.x < right.x
    // rightward: left.y < right.y
    // leftward: left.y > right.y
    // vertical: left.y == right.y

    // depending on the direction, find the best side of the
    // bounding box to use to determine a reasonable start point

    // rhill 2013-12-02:
    // While at it, since we have the values which define the line,
    // clip the end of va if it is outside the bbox.
    // https://github.com/gorhill/Javascript-Voronoi/issues/15
    // TODO: Do all the clipping here rather than rely on Liang-Barsky
    // which does not do well sometimes due to loss of arithmetic
    // precision. The code here doesn't degrade if one of the vertex is
    // at a huge distance.

    // special case: vertical line
    if (fm === undefined) {
        // doesn't intersect with viewport
        if (fx < xl || fx >= xr) {return false;}
        // downward
        if (lx > rx) {
            if (!va || va.y < yt) {
                va = this.createVertex(fx, yt);
                }
            else if (va.y >= yb) {
                return false;
                }
            vb = this.createVertex(fx, yb);
            }
        // upward
        else {
            if (!va || va.y > yb) {
                va = this.createVertex(fx, yb);
                }
            else if (va.y < yt) {
                return false;
                }
            vb = this.createVertex(fx, yt);
            }
        }
    // closer to vertical than horizontal, connect start point to the
    // top or bottom side of the bounding box
    else if (fm < -1 || fm > 1) {
        // downward
        if (lx > rx) {
            if (!va || va.y < yt) {
                va = this.createVertex((yt-fb)/fm, yt);
                }
            else if (va.y >= yb) {
                return false;
                }
            vb = this.createVertex((yb-fb)/fm, yb);
            }
        // upward
        else {
            if (!va || va.y > yb) {
                va = this.createVertex((yb-fb)/fm, yb);
                }
            else if (va.y < yt) {
                return false;
                }
            vb = this.createVertex((yt-fb)/fm, yt);
            }
        }
    // closer to horizontal than vertical, connect start point to the
    // left or right side of the bounding box
    else {
        // rightward
        if (ly < ry) {
            if (!va || va.x < xl) {
                va = this.createVertex(xl, fm*xl+fb);
                }
            else if (va.x >= xr) {
                return false;
                }
            vb = this.createVertex(xr, fm*xr+fb);
            }
        // leftward
        else {
            if (!va || va.x > xr) {
                va = this.createVertex(xr, fm*xr+fb);
                }
            else if (va.x < xl) {
                return false;
                }
            vb = this.createVertex(xl, fm*xl+fb);
            }
        }
    edge.va = va;
    edge.vb = vb;

    return true;
    };

// line-clipping code taken from:
//   Liang-Barsky function by Daniel White
//   http://www.skytopia.com/project/articles/compsci/clipping.html
// Thanks!
// A bit modified to minimize code paths
Voronoi.prototype.clipEdge = function(edge, bbox) {
    var ax = edge.va.x,
        ay = edge.va.y,
        bx = edge.vb.x,
        by = edge.vb.y,
        t0 = 0,
        t1 = 1,
        dx = bx-ax,
        dy = by-ay;
    // left
    var q = ax-bbox.xl;
    if (dx===0 && q<0) {return false;}
    var r = -q/dx;
    if (dx<0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    else if (dx>0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    // right
    q = bbox.xr-ax;
    if (dx===0 && q<0) {return false;}
    r = q/dx;
    if (dx<0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    else if (dx>0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    // top
    q = ay-bbox.yt;
    if (dy===0 && q<0) {return false;}
    r = -q/dy;
    if (dy<0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }
    else if (dy>0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    // bottom
    q = bbox.yb-ay;
    if (dy===0 && q<0) {return false;}
    r = q/dy;
    if (dy<0) {
        if (r>t1) {return false;}
        if (r>t0) {t0=r;}
        }
    else if (dy>0) {
        if (r<t0) {return false;}
        if (r<t1) {t1=r;}
        }

    // if we reach this point, Voronoi edge is within bbox

    // if t0 > 0, va needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t0 > 0) {
        edge.va = this.createVertex(ax+t0*dx, ay+t0*dy);
        }

    // if t1 < 1, vb needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t1 < 1) {
        edge.vb = this.createVertex(ax+t1*dx, ay+t1*dy);
        }

    // va and/or vb were clipped, thus we will need to close
    // cells which use this edge.
    if ( t0 > 0 || t1 < 1 ) {
        this.cells[edge.lSite.voronoiId].closeMe = true;
        this.cells[edge.rSite.voronoiId].closeMe = true;
    }

    return true;
    };

// Connect/cut edges at bounding box
Voronoi.prototype.clipEdges = function(bbox) {
    // connect all dangling edges to bounding box
    // or get rid of them if it can't be done
    var edges = this.edges,
        iEdge = edges.length,
        edge,
        abs_fn = Math.abs;

    // iterate backward so we can splice safely
    while (iEdge--) {
        edge = edges[iEdge];
        // edge is removed if:
        //   it is wholly outside the bounding box
        //   it is looking more like a point than a line
        if (!this.connectEdge(edge, bbox) ||
            !this.clipEdge(edge, bbox) ||
            (abs_fn(edge.va.x-edge.vb.x)<1e-9 && abs_fn(edge.va.y-edge.vb.y)<1e-9)) {
            edge.va = edge.vb = null;
            edges.splice(iEdge,1);
            }
        }
    };

// Close the cells.
// The cells are bound by the supplied bounding box.
// Each cell refers to its associated site, and a list
// of halfedges ordered counterclockwise.
Voronoi.prototype.closeCells = function(bbox) {
    var xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        cells = this.cells,
        iCell = cells.length,
        cell,
        iLeft,
        halfedges, nHalfedges,
        edge,
        va, vb, vz,
        lastBorderSegment,
        abs_fn = Math.abs;

    while (iCell--) {
        cell = cells[iCell];
        // prune, order halfedges counterclockwise, then add missing ones
        // required to close cells
        if (!cell.prepareHalfedges()) {
            continue;
            }
        if (!cell.closeMe) {
            continue;
            }
        // find first 'unclosed' point.
        // an 'unclosed' point will be the end point of a halfedge which
        // does not match the start point of the following halfedge
        halfedges = cell.halfedges;
        nHalfedges = halfedges.length;
        // special case: only one site, in which case, the viewport is the cell
        // ...

        // all other cases
        iLeft = 0;
        while (iLeft < nHalfedges) {
            va = halfedges[iLeft].getEndpoint();
            vz = halfedges[(iLeft+1) % nHalfedges].getStartpoint();
            // if end point is not equal to start point, we need to add the missing
            // halfedge(s) up to vz
            if (abs_fn(va.x-vz.x)>=1e-9 || abs_fn(va.y-vz.y)>=1e-9) {

                // rhill 2013-12-02:
                // "Holes" in the halfedges are not necessarily always adjacent.
                // https://github.com/gorhill/Javascript-Voronoi/issues/16

                // find entry point:
                switch (true) {

                    // walk downward along left side
                    case this.equalWithEpsilon(va.x,xl) && this.lessThanWithEpsilon(va.y,yb):
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xl);
                        vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk rightward along bottom side
                    case this.equalWithEpsilon(va.y,yb) && this.lessThanWithEpsilon(va.x,xr):
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yb);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk upward along right side
                    case this.equalWithEpsilon(va.x,xr) && this.greaterThanWithEpsilon(va.y,yt):
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xr);
                        vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                    // walk leftward along top side
                    case this.equalWithEpsilon(va.y,yt) && this.greaterThanWithEpsilon(va.x,xl):
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yt);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk downward along left side
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xl);
                        vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk rightward along bottom side
                        lastBorderSegment = this.equalWithEpsilon(vz.y,yb);
                        vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        va = vb;
                        // fall through

                        // walk upward along right side
                        lastBorderSegment = this.equalWithEpsilon(vz.x,xr);
                        vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                        edge = this.createBorderEdge(cell.site, va, vb);
                        iLeft++;
                        halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                        nHalfedges++;
                        if ( lastBorderSegment ) { break; }
                        // fall through

                    default:
                        throw "Voronoi.closeCells() > this makes no sense!";
                    }
                }
            iLeft++;
            }
        cell.closeMe = false;
        }
    };

// ---------------------------------------------------------------------------
// Debugging helper
/*
Voronoi.prototype.dumpBeachline = function(y) {
    console.log('Voronoi.dumpBeachline(%f) > Beachsections, from left to right:', y);
    if ( !this.beachline ) {
        console.log('  None');
        }
    else {
        var bs = this.beachline.getFirst(this.beachline.root);
        while ( bs ) {
            console.log('  site %d: xl: %f, xr: %f', bs.site.voronoiId, this.leftBreakPoint(bs, y), this.rightBreakPoint(bs, y));
            bs = bs.rbNext;
            }
        }
    };
*/

// ---------------------------------------------------------------------------
// Helper: Quantize sites

// rhill 2013-10-12:
// This is to solve https://github.com/gorhill/Javascript-Voronoi/issues/15
// Since not all users will end up using the kind of coord values which would
// cause the issue to arise, I chose to let the user decide whether or not
// he should sanitize his coord values through this helper. This way, for
// those users who uses coord values which are known to be fine, no overhead is
// added.

Voronoi.prototype.quantizeSites = function(sites) {
    var ε = this.ε,
        n = sites.length,
        site;
    while ( n-- ) {
        site = sites[n];
        site.x = Math.floor(site.x / ε) * ε;
        site.y = Math.floor(site.y / ε) * ε;
        }
    };

// ---------------------------------------------------------------------------
// Helper: Recycle diagram: all vertex, edge and cell objects are
// "surrendered" to the Voronoi object for reuse.
// TODO: rhill-voronoi-core v2: more performance to be gained
// when I change the semantic of what is returned.

Voronoi.prototype.recycle = function(diagram) {
    if ( diagram ) {
        if ( diagram instanceof this.Diagram ) {
            this.toRecycle = diagram;
            }
        else {
            throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
            }
        }
    };

// ---------------------------------------------------------------------------
// Top-level Fortune loop

// rhill 2011-05-19:
//   Voronoi sites are kept client-side now, to allow
//   user to freely modify content. At compute time,
//   *references* to sites are copied locally.

Voronoi.prototype.compute = function(sites, bbox) {
    // to measure execution time
    var startTime = new Date();

    // init internal state
    this.reset();

    // any diagram data available for recycling?
    // I do that here so that this is included in execution time
    if ( this.toRecycle ) {
        this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
        this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
        this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
        this.toRecycle = null;
        }

    // Initialize site event queue
    var siteEvents = sites.slice(0);
    siteEvents.sort(function(a,b){
        var r = b.y - a.y;
        if (r) {return r;}
        return b.x - a.x;
        });

    // process queue
    var site = siteEvents.pop(),
        siteid = 0,
        xsitex, // to avoid duplicate sites
        xsitey,
        cells = this.cells,
        circle;

    // main loop
    for (;;) {
        // we need to figure whether we handle a site or circle event
        // for this we find out if there is a site event and it is
        // 'earlier' than the circle event
        circle = this.firstCircleEvent;

        // add beach section
        if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
            // only if site is not a duplicate
            if (site.x !== xsitex || site.y !== xsitey) {
                // first create cell for new site
                cells[siteid] = this.createCell(site);
                site.voronoiId = siteid++;
                // then create a beachsection for that site
                this.addBeachsection(site);
                // remember last site coords to detect duplicate
                xsitey = site.y;
                xsitex = site.x;
                }
            site = siteEvents.pop();
            }

        // remove beach section
        else if (circle) {
            this.removeBeachsection(circle.arc);
            }

        // all done, quit
        else {
            break;
            }
        }

    // wrapping-up:
    //   connect dangling edges to bounding box
    //   cut edges as per bounding box
    //   discard edges completely outside bounding box
    //   discard edges which are point-like
    this.clipEdges(bbox);

    //   add missing edges in order to close opened cells
    this.closeCells(bbox);

    // to measure execution time
    var stopTime = new Date();

    // prepare return values
    var diagram = new this.Diagram();
    diagram.cells = this.cells;
    diagram.edges = this.edges;
    diagram.vertices = this.vertices;
    diagram.execTime = stopTime.getTime()-startTime.getTime();

    // clean up
    this.reset();

    return diagram;
    };

module.exports = Voronoi;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZm9vZ3JhcGguanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbGF5b3V0LmpzIiwic3JjL3JoaWxsLXZvcm9ub2ktY29yZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzV3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZm9vZ3JhcGggPSB7XG4gIC8qKlxuICAgKiBJbnNlcnQgYSB2ZXJ0ZXggaW50byB0aGlzIGdyYXBoLlxuICAgKlxuICAgKiBAcGFyYW0gdmVydGV4IEEgdmFsaWQgVmVydGV4IGluc3RhbmNlXG4gICAqL1xuICBpbnNlcnRWZXJ0ZXg6IGZ1bmN0aW9uKHZlcnRleCkge1xuICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKHZlcnRleCk7XG4gICAgICB0aGlzLnZlcnRleENvdW50Kys7XG4gICAgfSxcblxuICAvKipcbiAgICogSW5zZXJ0IGFuIGVkZ2UgdmVydGV4MSAtLT4gdmVydGV4Mi5cbiAgICpcbiAgICogQHBhcmFtIGxhYmVsIExhYmVsIGZvciB0aGlzIGVkZ2VcbiAgICogQHBhcmFtIHdlaWdodCBXZWlnaHQgb2YgdGhpcyBlZGdlXG4gICAqIEBwYXJhbSB2ZXJ0ZXgxIFN0YXJ0aW5nIFZlcnRleCBpbnN0YW5jZVxuICAgKiBAcGFyYW0gdmVydGV4MiBFbmRpbmcgVmVydGV4IGluc3RhbmNlXG4gICAqIEByZXR1cm4gTmV3bHkgY3JlYXRlZCBFZGdlIGluc3RhbmNlXG4gICAqL1xuICBpbnNlcnRFZGdlOiBmdW5jdGlvbihsYWJlbCwgd2VpZ2h0LCB2ZXJ0ZXgxLCB2ZXJ0ZXgyLCBzdHlsZSkge1xuICAgICAgdmFyIGUxID0gbmV3IGZvb2dyYXBoLkVkZ2UobGFiZWwsIHdlaWdodCwgdmVydGV4Miwgc3R5bGUpO1xuICAgICAgdmFyIGUyID0gbmV3IGZvb2dyYXBoLkVkZ2UobnVsbCwgd2VpZ2h0LCB2ZXJ0ZXgxLCBudWxsKTtcblxuICAgICAgdmVydGV4MS5lZGdlcy5wdXNoKGUxKTtcbiAgICAgIHZlcnRleDIucmV2ZXJzZUVkZ2VzLnB1c2goZTIpO1xuXG4gICAgICByZXR1cm4gZTE7XG4gICAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIGVkZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJ0ZXggU3RhcnRpbmcgdmVydGV4XG4gICAqIEBwYXJhbSBlZGdlIEVkZ2UgdG8gcmVtb3ZlXG4gICAqL1xuICByZW1vdmVFZGdlOiBmdW5jdGlvbih2ZXJ0ZXgxLCB2ZXJ0ZXgyKSB7XG4gICAgICBmb3IgKHZhciBpID0gdmVydGV4MS5lZGdlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodmVydGV4MS5lZGdlc1tpXS5lbmRWZXJ0ZXggPT0gdmVydGV4Mikge1xuICAgICAgICAgIHZlcnRleDEuZWRnZXMuc3BsaWNlKGksMSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IHZlcnRleDIucmV2ZXJzZUVkZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmICh2ZXJ0ZXgyLnJldmVyc2VFZGdlc1tpXS5lbmRWZXJ0ZXggPT0gdmVydGV4MSkge1xuICAgICAgICAgIHZlcnRleDIucmV2ZXJzZUVkZ2VzLnNwbGljZShpLDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAvKipcbiAgICogRGVsZXRlIHZlcnRleC5cbiAgICpcbiAgICogQHBhcmFtIHZlcnRleCBWZXJ0ZXggdG8gcmVtb3ZlIGZyb20gdGhlIGdyYXBoXG4gICAqL1xuICByZW1vdmVWZXJ0ZXg6IGZ1bmN0aW9uKHZlcnRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IHZlcnRleC5lZGdlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSApIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFZGdlKHZlcnRleCwgdmVydGV4LmVkZ2VzW2ldLmVuZFZlcnRleCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSB2ZXJ0ZXgucmV2ZXJzZUVkZ2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xuICAgICAgICB0aGlzLnJlbW92ZUVkZ2UodmVydGV4LnJldmVyc2VFZGdlc1tpXS5lbmRWZXJ0ZXgsIHZlcnRleCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tICkge1xuICAgICAgICBpZiAodGhpcy52ZXJ0aWNlc1tpXSA9PSB2ZXJ0ZXgpIHtcbiAgICAgICAgICB0aGlzLnZlcnRpY2VzLnNwbGljZShpLDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMudmVydGV4Q291bnQtLTtcbiAgICB9LFxuXG4gIC8qKlxuICAgKiBQbG90cyB0aGlzIGdyYXBoIHRvIGEgY2FudmFzLlxuICAgKlxuICAgKiBAcGFyYW0gY2FudmFzIEEgcHJvcGVyIGNhbnZhcyBpbnN0YW5jZVxuICAgKi9cbiAgcGxvdDogZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICAvKiBEcmF3IGVkZ2VzIGZpcnN0ICovXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdiA9IHRoaXMudmVydGljZXNbaV07XG4gICAgICAgIGlmICghdi5oaWRkZW4pIHtcbiAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHYuZWRnZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBlID0gdi5lZGdlc1tqXTtcbiAgICAgICAgICAgIC8qIERyYXcgZWRnZSAoaWYgbm90IGhpZGRlbikgKi9cbiAgICAgICAgICAgIGlmICghZS5oaWRkZW4pXG4gICAgICAgICAgICAgIGUuZHJhdyhjYW52YXMsIHYpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBEcmF3IHRoZSB2ZXJ0aWNlcy4gKi9cbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLnZlcnRpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHYgPSB0aGlzLnZlcnRpY2VzW2ldO1xuXG4gICAgICAgIC8qIERyYXcgdmVydGV4IChpZiBub3QgaGlkZGVuKSAqL1xuICAgICAgICBpZiAoIXYuaGlkZGVuKVxuICAgICAgICAgIHYuZHJhdyhjYW52YXMpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgLyoqXG4gICAqIEdyYXBoIG9iamVjdCBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGxhYmVsIExhYmVsIG9mIHRoaXMgZ3JhcGhcbiAgICogQHBhcmFtIGRpcmVjdGVkIHRydWUgb3IgZmFsc2VcbiAgICovXG4gIEdyYXBoOiBmdW5jdGlvbiAobGFiZWwsIGRpcmVjdGVkKSB7XG4gICAgICAvKiBGaWVsZHMuICovXG4gICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KCk7XG4gICAgICB0aGlzLmRpcmVjdGVkID0gZGlyZWN0ZWQ7XG4gICAgICB0aGlzLnZlcnRleENvdW50ID0gMDtcblxuICAgICAgLyogR3JhcGggbWV0aG9kcy4gKi9cbiAgICAgIHRoaXMuaW5zZXJ0VmVydGV4ID0gZm9vZ3JhcGguaW5zZXJ0VmVydGV4O1xuICAgICAgdGhpcy5yZW1vdmVWZXJ0ZXggPSBmb29ncmFwaC5yZW1vdmVWZXJ0ZXg7XG4gICAgICB0aGlzLmluc2VydEVkZ2UgPSBmb29ncmFwaC5pbnNlcnRFZGdlO1xuICAgICAgdGhpcy5yZW1vdmVFZGdlID0gZm9vZ3JhcGgucmVtb3ZlRWRnZTtcbiAgICAgIHRoaXMucGxvdCA9IGZvb2dyYXBoLnBsb3Q7XG4gICAgfSxcblxuICAvKipcbiAgICogVmVydGV4IG9iamVjdCBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGxhYmVsIExhYmVsIG9mIHRoaXMgdmVydGV4XG4gICAqIEBwYXJhbSBuZXh0IFJlZmVyZW5jZSB0byB0aGUgbmV4dCB2ZXJ0ZXggb2YgdGhpcyBncmFwaFxuICAgKiBAcGFyYW0gZmlyc3RFZGdlIEZpcnN0IGVkZ2Ugb2YgYSBsaW5rZWQgbGlzdCBvZiBlZGdlc1xuICAgKi9cbiAgVmVydGV4OiBmdW5jdGlvbihsYWJlbCwgeCwgeSwgc3R5bGUpIHtcbiAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgIHRoaXMuZWRnZXMgPSBuZXcgQXJyYXkoKTtcbiAgICAgIHRoaXMucmV2ZXJzZUVkZ2VzID0gbmV3IEFycmF5KCk7XG4gICAgICB0aGlzLnggPSB4O1xuICAgICAgdGhpcy55ID0geTtcbiAgICAgIHRoaXMuZHggPSAwO1xuICAgICAgdGhpcy5keSA9IDA7XG4gICAgICB0aGlzLmxldmVsID0gLTE7XG4gICAgICB0aGlzLm51bWJlck9mUGFyZW50cyA9IDA7XG4gICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgdGhpcy5maXhlZCA9IGZhbHNlOyAgICAgLy8gRml4ZWQgdmVydGljZXMgYXJlIHN0YXRpYyAodW5tb3ZhYmxlKVxuXG4gICAgICBpZihzdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhpcy5zdHlsZSA9IHN0eWxlO1xuICAgICAgfVxuICAgICAgZWxzZSB7IC8vIERlZmF1bHRcbiAgICAgICAgICB0aGlzLnN0eWxlID0gbmV3IGZvb2dyYXBoLlZlcnRleFN0eWxlKCdlbGxpcHNlJywgODAsIDQwLCAnI2ZmZmZmZicsICcjMDAwMDAwJywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAvKipcbiAgICogVmVydGV4U3R5bGUgb2JqZWN0IHR5cGUgZm9yIGRlZmluaW5nIHZlcnRleCBzdHlsZSBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gc2hhcGUgU2hhcGUgb2YgdGhlIHZlcnRleCAoJ2VsbGlwc2UnIG9yICdyZWN0JylcbiAgICogQHBhcmFtIHdpZHRoIFdpZHRoIGluIHB4XG4gICAqIEBwYXJhbSBoZWlnaHQgSGVpZ2h0IGluIHB4XG4gICAqIEBwYXJhbSBmaWxsQ29sb3IgVGhlIGNvbG9yIHdpdGggd2hpY2ggdGhlIHZlcnRleCBpcyBkcmF3biAoUkdCIEhFWCBzdHJpbmcpXG4gICAqIEBwYXJhbSBib3JkZXJDb2xvciBUaGUgY29sb3Igd2l0aCB3aGljaCB0aGUgYm9yZGVyIG9mIHRoZSB2ZXJ0ZXggaXMgZHJhd24gKFJHQiBIRVggc3RyaW5nKVxuICAgKiBAcGFyYW0gc2hvd0xhYmVsIFNob3cgdGhlIHZlcnRleCBsYWJlbCBvciBub3RcbiAgICovXG4gIFZlcnRleFN0eWxlOiBmdW5jdGlvbihzaGFwZSwgd2lkdGgsIGhlaWdodCwgZmlsbENvbG9yLCBib3JkZXJDb2xvciwgc2hvd0xhYmVsKSB7XG4gICAgICB0aGlzLnNoYXBlID0gc2hhcGU7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgIHRoaXMuZmlsbENvbG9yID0gZmlsbENvbG9yO1xuICAgICAgdGhpcy5ib3JkZXJDb2xvciA9IGJvcmRlckNvbG9yO1xuICAgICAgdGhpcy5zaG93TGFiZWwgPSBzaG93TGFiZWw7XG4gICAgfSxcblxuICAvKipcbiAgICogRWRnZSBvYmplY3QgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsYWJlbCBMYWJlbCBvZiB0aGlzIGVkZ2VcbiAgICogQHBhcmFtIG5leHQgTmV4dCBlZGdlIHJlZmVyZW5jZVxuICAgKiBAcGFyYW0gd2VpZ2h0IEVkZ2Ugd2VpZ2h0XG4gICAqIEBwYXJhbSBlbmRWZXJ0ZXggRGVzdGluYXRpb24gVmVydGV4IGluc3RhbmNlXG4gICAqL1xuICBFZGdlOiBmdW5jdGlvbiAobGFiZWwsIHdlaWdodCwgZW5kVmVydGV4LCBzdHlsZSkge1xuICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgdGhpcy53ZWlnaHQgPSB3ZWlnaHQ7XG4gICAgICB0aGlzLmVuZFZlcnRleCA9IGVuZFZlcnRleDtcbiAgICAgIHRoaXMuc3R5bGUgPSBudWxsO1xuICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZTtcblxuICAgICAgLy8gQ3VydmluZyBpbmZvcm1hdGlvblxuICAgICAgdGhpcy5jdXJ2ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuY29udHJvbFggPSAtMTsgICAvLyBDb250cm9sIGNvb3JkaW5hdGVzIGZvciBCZXppZXIgY3VydmUgZHJhd2luZ1xuICAgICAgdGhpcy5jb250cm9sWSA9IC0xO1xuICAgICAgdGhpcy5vcmlnaW5hbCA9IG51bGw7IC8vIElmIHRoaXMgaXMgYSB0ZW1wb3JhcnkgZWRnZSBpdCBob2xkcyB0aGUgb3JpZ2luYWwgZWRnZVxuXG4gICAgICBpZihzdHlsZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuc3R5bGUgPSBzdHlsZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgeyAgLy8gU2V0IHRvIGRlZmF1bHRcbiAgICAgICAgdGhpcy5zdHlsZSA9IG5ldyBmb29ncmFwaC5FZGdlU3R5bGUoMiwgJyMwMDAwMDAnLCB0cnVlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSxcblxuXG5cbiAgLyoqXG4gICAqIEVkZ2VTdHlsZSBvYmplY3QgdHlwZSBmb3IgZGVmaW5pbmcgdmVydGV4IHN0eWxlIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSB3aWR0aCBFZGdlIGxpbmUgd2lkdGhcbiAgICogQHBhcmFtIGNvbG9yIFRoZSBjb2xvciB3aXRoIHdoaWNoIHRoZSBlZGdlIGlzIGRyYXduXG4gICAqIEBwYXJhbSBzaG93QXJyb3cgRHJhdyB0aGUgZWRnZSBhcnJvdyAob25seSBpZiBkaXJlY3RlZClcbiAgICogQHBhcmFtIHNob3dMYWJlbCBTaG93IHRoZSBlZGdlIGxhYmVsIG9yIG5vdFxuICAgKi9cbiAgRWRnZVN0eWxlOiBmdW5jdGlvbih3aWR0aCwgY29sb3IsIHNob3dBcnJvdywgc2hvd0xhYmVsKSB7XG4gICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICB0aGlzLmNvbG9yID0gY29sb3I7XG4gICAgICB0aGlzLnNob3dBcnJvdyA9IHNob3dBcnJvdztcbiAgICAgIHRoaXMuc2hvd0xhYmVsID0gc2hvd0xhYmVsO1xuICAgIH0sXG5cbiAgLyoqXG4gICAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIGZvb2dyYXBoIEphdmFzY3JpcHQgZ3JhcGggbGlicmFyeS5cbiAgICpcbiAgICogRGVzY3JpcHRpb246IFJhbmRvbSB2ZXJ0ZXggbGF5b3V0IG1hbmFnZXJcbiAgICovXG5cbiAgLyoqXG4gICAqIENsYXNzIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gd2lkdGggTGF5b3V0IHdpZHRoXG4gICAqIEBwYXJhbSBoZWlnaHQgTGF5b3V0IGhlaWdodFxuICAgKi9cbiAgUmFuZG9tVmVydGV4TGF5b3V0OiBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSxcblxuXG4gIC8qKlxuICAgKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBmb29ncmFwaCBKYXZhc2NyaXB0IGdyYXBoIGxpYnJhcnkuXG4gICAqXG4gICAqIERlc2NyaXB0aW9uOiBGcnVjaHRlcm1hbi1SZWluZ29sZCBmb3JjZS1kaXJlY3RlZCB2ZXJ0ZXhcbiAgICogICAgICAgICAgICAgIGxheW91dCBtYW5hZ2VyXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDbGFzcyBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHdpZHRoIExheW91dCB3aWR0aFxuICAgKiBAcGFyYW0gaGVpZ2h0IExheW91dCBoZWlnaHRcbiAgICogQHBhcmFtIGl0ZXJhdGlvbnMgTnVtYmVyIG9mIGl0ZXJhdGlvbnMgLVxuICAgKiB3aXRoIG1vcmUgaXRlcmF0aW9ucyBpdCBpcyBtb3JlIGxpa2VseSB0aGUgbGF5b3V0IGhhcyBjb252ZXJnZWQgaW50byBhIHN0YXRpYyBlcXVpbGlicml1bS5cbiAgICovXG4gIEZvcmNlRGlyZWN0ZWRWZXJ0ZXhMYXlvdXQ6IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0LCBpdGVyYXRpb25zLCByYW5kb21pemUsIGVwcykge1xuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICB0aGlzLml0ZXJhdGlvbnMgPSBpdGVyYXRpb25zO1xuICAgICAgdGhpcy5yYW5kb21pemUgPSByYW5kb21pemU7XG4gICAgICB0aGlzLmVwcyA9IGVwcztcbiAgICAgIHRoaXMuY2FsbGJhY2sgPSBmdW5jdGlvbigpIHt9O1xuICAgIH0sXG5cbiAgQTogMS41LCAvLyBGaW5lIHR1bmUgYXR0cmFjdGlvblxuXG4gIFI6IDAuNSAgLy8gRmluZSB0dW5lIHJlcHVsc2lvblxufTtcblxuLyoqXG4gKiB0b1N0cmluZyBvdmVybG9hZCBmb3IgZWFzaWVyIGRlYnVnZ2luZ1xuICovXG5mb29ncmFwaC5WZXJ0ZXgucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBcIlt2OlwiICsgdGhpcy5sYWJlbCArIFwiXSBcIjtcbn07XG5cbi8qKlxuICogdG9TdHJpbmcgb3ZlcmxvYWQgZm9yIGVhc2llciBkZWJ1Z2dpbmdcbiAqL1xuZm9vZ3JhcGguRWRnZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFwiW2U6XCIgKyB0aGlzLmVuZFZlcnRleC5sYWJlbCArIFwiXSBcIjtcbn07XG5cbi8qKlxuICogRHJhdyB2ZXJ0ZXggbWV0aG9kLlxuICpcbiAqIEBwYXJhbSBjYW52YXMganNHcmFwaGljcyBpbnN0YW5jZVxuICovXG5mb29ncmFwaC5WZXJ0ZXgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMpIHtcbiAgdmFyIHggPSB0aGlzLng7XG4gIHZhciB5ID0gdGhpcy55O1xuICB2YXIgd2lkdGggPSB0aGlzLnN0eWxlLndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gdGhpcy5zdHlsZS5oZWlnaHQ7XG4gIHZhciBzaGFwZSA9IHRoaXMuc3R5bGUuc2hhcGU7XG5cbiAgY2FudmFzLnNldFN0cm9rZSgyKTtcbiAgY2FudmFzLnNldENvbG9yKHRoaXMuc3R5bGUuZmlsbENvbG9yKTtcblxuICBpZihzaGFwZSA9PSAncmVjdCcpIHtcbiAgICBjYW52YXMuZmlsbFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgY2FudmFzLnNldENvbG9yKHRoaXMuc3R5bGUuYm9yZGVyQ29sb3IpO1xuICAgIGNhbnZhcy5kcmF3UmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgfVxuICBlbHNlIHsgLy8gRGVmYXVsdCB0byBlbGxpcHNlXG4gICAgY2FudmFzLmZpbGxFbGxpcHNlKHgsIHksIHdpZHRoLCBoZWlnaHQpO1xuICAgIGNhbnZhcy5zZXRDb2xvcih0aGlzLnN0eWxlLmJvcmRlckNvbG9yKTtcbiAgICBjYW52YXMuZHJhd0VsbGlwc2UoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gIH1cblxuICBpZih0aGlzLnN0eWxlLnNob3dMYWJlbCkge1xuICAgIGNhbnZhcy5kcmF3U3RyaW5nUmVjdCh0aGlzLmxhYmVsLCB4LCB5ICsgaGVpZ2h0LzIgLSA3LCB3aWR0aCwgJ2NlbnRlcicpO1xuICB9XG59O1xuXG4vKipcbiAqIEZpdHMgdGhlIGdyYXBoIGludG8gdGhlIGJvdW5kaW5nIGJveFxuICpcbiAqIEBwYXJhbSB3aWR0aFxuICogQHBhcmFtIGhlaWdodFxuICogQHBhcmFtIHByZXNlcnZlQXNwZWN0XG4gKi9cbmZvb2dyYXBoLkdyYXBoLnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBwcmVzZXJ2ZUFzcGVjdCkge1xuICBmb3IgKHZhciBpOCBpbiB0aGlzLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2k4XTtcbiAgICB2Lm9sZFggPSB2Lng7XG4gICAgdi5vbGRZID0gdi55O1xuICB9XG4gIHZhciBtbnggPSB3aWR0aCAgKiAwLjE7XG4gIHZhciBteHggPSB3aWR0aCAgKiAwLjk7XG4gIHZhciBtbnkgPSBoZWlnaHQgKiAwLjE7XG4gIHZhciBteHkgPSBoZWlnaHQgKiAwLjk7XG4gIGlmIChwcmVzZXJ2ZUFzcGVjdCA9PSBudWxsKVxuICAgIHByZXNlcnZlQXNwZWN0ID0gdHJ1ZTtcblxuICB2YXIgbWlueCA9IE51bWJlci5NQVhfVkFMVUU7XG4gIHZhciBtaW55ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgdmFyIG1heHggPSBOdW1iZXIuTUlOX1ZBTFVFO1xuICB2YXIgbWF4eSA9IE51bWJlci5NSU5fVkFMVUU7XG5cbiAgZm9yICh2YXIgaTcgaW4gdGhpcy52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gdGhpcy52ZXJ0aWNlc1tpN107XG4gICAgaWYgKHYueCA8IG1pbngpIG1pbnggPSB2Lng7XG4gICAgaWYgKHYueSA8IG1pbnkpIG1pbnkgPSB2Lnk7XG4gICAgaWYgKHYueCA+IG1heHgpIG1heHggPSB2Lng7XG4gICAgaWYgKHYueSA+IG1heHkpIG1heHkgPSB2Lnk7XG4gIH1cbiAgdmFyIGt4ID0gKG14eC1tbngpIC8gKG1heHggLSBtaW54KTtcbiAgdmFyIGt5ID0gKG14eS1tbnkpIC8gKG1heHkgLSBtaW55KTtcblxuICBpZiAocHJlc2VydmVBc3BlY3QpIHtcbiAgICBreCA9IE1hdGgubWluKGt4LCBreSk7XG4gICAga3kgPSBNYXRoLm1pbihreCwga3kpO1xuICB9XG5cbiAgdmFyIG5ld01heHggPSBOdW1iZXIuTUlOX1ZBTFVFO1xuICB2YXIgbmV3TWF4eSA9IE51bWJlci5NSU5fVkFMVUU7XG4gIGZvciAodmFyIGk4IGluIHRoaXMudmVydGljZXMpIHtcbiAgICB2YXIgdiA9IHRoaXMudmVydGljZXNbaThdO1xuICAgIHYueCA9ICh2LnggLSBtaW54KSAqIGt4O1xuICAgIHYueSA9ICh2LnkgLSBtaW55KSAqIGt5O1xuICAgIGlmICh2LnggPiBuZXdNYXh4KSBuZXdNYXh4ID0gdi54O1xuICAgIGlmICh2LnkgPiBuZXdNYXh5KSBuZXdNYXh5ID0gdi55O1xuICB9XG5cbiAgdmFyIGR4ID0gKCB3aWR0aCAgLSBuZXdNYXh4ICkgLyAyLjA7XG4gIHZhciBkeSA9ICggaGVpZ2h0IC0gbmV3TWF4eSApIC8gMi4wO1xuICBmb3IgKHZhciBpOCBpbiB0aGlzLnZlcnRpY2VzKSB7XG4gICAgdmFyIHYgPSB0aGlzLnZlcnRpY2VzW2k4XTtcbiAgICB2LnggKz0gZHg7XG4gICAgdi55ICs9IGR5O1xuICB9XG59O1xuXG4vKipcbiAqIERyYXcgZWRnZSBtZXRob2QuIERyYXdzIGVkZ2UgXCJ2XCIgLS0+IFwidGhpc1wiLlxuICpcbiAqIEBwYXJhbSBjYW52YXMganNHcmFwaGljcyBpbnN0YW5jZVxuICogQHBhcmFtIHYgU3RhcnQgdmVydGV4XG4gKi9cbmZvb2dyYXBoLkVkZ2UucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbihjYW52YXMsIHYpIHtcbiAgdmFyIHgxID0gTWF0aC5yb3VuZCh2LnggKyB2LnN0eWxlLndpZHRoLzIpO1xuICB2YXIgeTEgPSBNYXRoLnJvdW5kKHYueSArIHYuc3R5bGUuaGVpZ2h0LzIpO1xuICB2YXIgeDIgPSBNYXRoLnJvdW5kKHRoaXMuZW5kVmVydGV4LnggKyB0aGlzLmVuZFZlcnRleC5zdHlsZS53aWR0aC8yKTtcbiAgdmFyIHkyID0gTWF0aC5yb3VuZCh0aGlzLmVuZFZlcnRleC55ICsgdGhpcy5lbmRWZXJ0ZXguc3R5bGUuaGVpZ2h0LzIpO1xuXG4gIC8vIENvbnRyb2wgcG9pbnQgKG5lZWRlZCBvbmx5IGZvciBjdXJ2ZWQgZWRnZXMpXG4gIHZhciB4MyA9IHRoaXMuY29udHJvbFg7XG4gIHZhciB5MyA9IHRoaXMuY29udHJvbFk7XG5cbiAgLy8gQXJyb3cgdGlwIGFuZCBhbmdsZVxuICB2YXIgWF9USVAsIFlfVElQLCBBTkdMRTtcblxuICAvKiBRdWFkcmljIEJlemllciBjdXJ2ZSBkZWZpbml0aW9uLiAqL1xuICBmdW5jdGlvbiBCeCh0KSB7IHJldHVybiAoMS10KSooMS10KSp4MSArIDIqKDEtdCkqdCp4MyArIHQqdCp4MjsgfVxuICBmdW5jdGlvbiBCeSh0KSB7IHJldHVybiAoMS10KSooMS10KSp5MSArIDIqKDEtdCkqdCp5MyArIHQqdCp5MjsgfVxuXG4gIGNhbnZhcy5zZXRTdHJva2UodGhpcy5zdHlsZS53aWR0aCk7XG4gIGNhbnZhcy5zZXRDb2xvcih0aGlzLnN0eWxlLmNvbG9yKTtcblxuICBpZih0aGlzLmN1cnZlZCkgeyAvLyBEcmF3IGEgcXVhZHJpYyBCZXppZXIgY3VydmVcbiAgICB0aGlzLmN1cnZlZCA9IGZhbHNlOyAvLyBSZXNldFxuICAgIHZhciB0ID0gMCwgZHQgPSAxLzEwO1xuICAgIHZhciB4cyA9IHgxLCB5cyA9IHkxLCB4biwgeW47XG5cbiAgICB3aGlsZSAodCA8IDEtZHQpIHtcbiAgICAgIHQgKz0gZHQ7XG4gICAgICB4biA9IEJ4KHQpO1xuICAgICAgeW4gPSBCeSh0KTtcbiAgICAgIGNhbnZhcy5kcmF3TGluZSh4cywgeXMsIHhuLCB5bik7XG4gICAgICB4cyA9IHhuO1xuICAgICAgeXMgPSB5bjtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGFycm93IHRpcCBjb29yZGluYXRlc1xuICAgIFhfVElQID0geHM7XG4gICAgWV9USVAgPSB5cztcblxuICAgIC8vIE1vdmUgdGhlIHRpcCB0byAoMCwwKSBhbmQgY2FsY3VsYXRlIHRoZSBhbmdsZVxuICAgIC8vIG9mIHRoZSBhcnJvdyBoZWFkXG4gICAgQU5HTEUgPSBhbmd1bGFyQ29vcmQoQngoMS0yKmR0KSAtIFhfVElQLCBCeSgxLTIqZHQpIC0gWV9USVApO1xuXG4gIH0gZWxzZSB7XG4gICAgY2FudmFzLmRyYXdMaW5lKHgxLCB5MSwgeDIsIHkyKTtcblxuICAgIC8vIFNldCB0aGUgYXJyb3cgdGlwIGNvb3JkaW5hdGVzXG4gICAgWF9USVAgPSB4MjtcbiAgICBZX1RJUCA9IHkyO1xuXG4gICAgLy8gTW92ZSB0aGUgdGlwIHRvICgwLDApIGFuZCBjYWxjdWxhdGUgdGhlIGFuZ2xlXG4gICAgLy8gb2YgdGhlIGFycm93IGhlYWRcbiAgICBBTkdMRSA9IGFuZ3VsYXJDb29yZCh4MSAtIFhfVElQLCB5MSAtIFlfVElQKTtcbiAgfVxuXG4gIGlmKHRoaXMuc3R5bGUuc2hvd0Fycm93KSB7XG4gICAgZHJhd0Fycm93KEFOR0xFLCBYX1RJUCwgWV9USVApO1xuICB9XG5cbiAgLy8gVE9ET1xuICBpZih0aGlzLnN0eWxlLnNob3dMYWJlbCkge1xuICB9XG5cbiAgLyoqXG4gICAqIERyYXdzIGFuIGVkZ2UgYXJyb3cuXG4gICAqIEBwYXJhbSBwaGkgVGhlIGFuZ2xlIChpbiByYWRpYW5zKSBvZiB0aGUgYXJyb3cgaW4gcG9sYXIgY29vcmRpbmF0ZXMuXG4gICAqIEBwYXJhbSB4IFggY29vcmRpbmF0ZSBvZiB0aGUgYXJyb3cgdGlwLlxuICAgKiBAcGFyYW0geSBZIGNvb3JkaW5hdGUgb2YgdGhlIGFycm93IHRpcC5cbiAgICovXG4gIGZ1bmN0aW9uIGRyYXdBcnJvdyhwaGksIHgsIHkpXG4gIHtcbiAgICAvLyBBcnJvdyBib3VuZGluZyBib3ggKGluIHB4KVxuICAgIHZhciBIID0gNTA7XG4gICAgdmFyIFcgPSAxMDtcblxuICAgIC8vIFNldCBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgb2YgdGhlIGFycm93XG4gICAgdmFyIHAxMSA9IDAsIHAxMiA9IDA7XG4gICAgdmFyIHAyMSA9IEgsIHAyMiA9IFcvMjtcbiAgICB2YXIgcDMxID0gSCwgcDMyID0gLVcvMjtcblxuICAgIC8vIENvbnZlcnQgdG8gcG9sYXIgY29vcmRpbmF0ZXNcbiAgICB2YXIgcjIgPSByYWRpYWxDb29yZChwMjEsIHAyMik7XG4gICAgdmFyIHIzID0gcmFkaWFsQ29vcmQocDMxLCBwMzIpO1xuICAgIHZhciBwaGkyID0gYW5ndWxhckNvb3JkKHAyMSwgcDIyKTtcbiAgICB2YXIgcGhpMyA9IGFuZ3VsYXJDb29yZChwMzEsIHAzMik7XG5cbiAgICAvLyBSb3RhdGUgdGhlIGFycm93XG4gICAgcGhpMiArPSBwaGk7XG4gICAgcGhpMyArPSBwaGk7XG5cbiAgICAvLyBVcGRhdGUgY2FydGVzaWFuIGNvb3JkaW5hdGVzXG4gICAgcDIxID0gcjIgKiBNYXRoLmNvcyhwaGkyKTtcbiAgICBwMjIgPSByMiAqIE1hdGguc2luKHBoaTIpO1xuICAgIHAzMSA9IHIzICogTWF0aC5jb3MocGhpMyk7XG4gICAgcDMyID0gcjMgKiBNYXRoLnNpbihwaGkzKTtcblxuICAgIC8vIFRyYW5zbGF0ZVxuICAgIHAxMSArPSB4O1xuICAgIHAxMiArPSB5O1xuICAgIHAyMSArPSB4O1xuICAgIHAyMiArPSB5O1xuICAgIHAzMSArPSB4O1xuICAgIHAzMiArPSB5O1xuXG4gICAgLy8gRHJhd1xuICAgIGNhbnZhcy5maWxsUG9seWdvbihuZXcgQXJyYXkocDExLCBwMjEsIHAzMSksIG5ldyBBcnJheShwMTIsIHAyMiwgcDMyKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBhbmd1bGFyIGNvb3JkaW5hdGUuXG4gICAqIEBwYXJhbSB4IFggY29vcmRpbmF0ZVxuICAgKiBAcGFyYW0geSBZIGNvb3JkaW5hdGVcbiAgICovXG4gICBmdW5jdGlvbiBhbmd1bGFyQ29vcmQoeCwgeSlcbiAgIHtcbiAgICAgdmFyIHBoaSA9IDAuMDtcblxuICAgICBpZiAoeCA+IDAgJiYgeSA+PSAwKSB7XG4gICAgICBwaGkgPSBNYXRoLmF0YW4oeS94KTtcbiAgICAgfVxuICAgICBpZiAoeCA+IDAgJiYgeSA8IDApIHtcbiAgICAgICBwaGkgPSBNYXRoLmF0YW4oeS94KSArIDIqTWF0aC5QSTtcbiAgICAgfVxuICAgICBpZiAoeCA8IDApIHtcbiAgICAgICBwaGkgPSBNYXRoLmF0YW4oeS94KSArIE1hdGguUEk7XG4gICAgIH1cbiAgICAgaWYgKHggPSAwICYmIHkgPiAwKSB7XG4gICAgICAgcGhpID0gTWF0aC5QSS8yO1xuICAgICB9XG4gICAgIGlmICh4ID0gMCAmJiB5IDwgMCkge1xuICAgICAgIHBoaSA9IDMqTWF0aC5QSS8yO1xuICAgICB9XG5cbiAgICAgcmV0dXJuIHBoaTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBHZXQgdGhlIHJhZGlhbiBjb29yZGlhbnRlLlxuICAgICogQHBhcmFtIHgxXG4gICAgKiBAcGFyYW0geTFcbiAgICAqIEBwYXJhbSB4MlxuICAgICogQHBhcmFtIHkyXG4gICAgKi9cbiAgIGZ1bmN0aW9uIHJhZGlhbENvb3JkKHgsIHkpXG4gICB7XG4gICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbiAgIH1cbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgY29vcmRpbmF0ZXMgYmFzZWQgb24gcHVyZSBjaGFuY2UuXG4gKlxuICogQHBhcmFtIGdyYXBoIEEgdmFsaWQgZ3JhcGggaW5zdGFuY2VcbiAqL1xuZm9vZ3JhcGguUmFuZG9tVmVydGV4TGF5b3V0LnByb3RvdHlwZS5sYXlvdXQgPSBmdW5jdGlvbihncmFwaCkge1xuICBmb3IgKHZhciBpID0gMDsgaTxncmFwaC52ZXJ0aWNlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNbaV07XG4gICAgdi54ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy53aWR0aCk7XG4gICAgdi55ID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogdGhpcy5oZWlnaHQpO1xuICB9XG59O1xuXG4vKipcbiAqIElkZW50aWZpZXMgY29ubmVjdGVkIGNvbXBvbmVudHMgb2YgYSBncmFwaCBhbmQgY3JlYXRlcyBcImNlbnRyYWxcIlxuICogdmVydGljZXMgZm9yIGVhY2ggY29tcG9uZW50LiBJZiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIGNvbXBvbmVudCxcbiAqIGFsbCBjZW50cmFsIHZlcnRpY2VzIG9mIGluZGl2aWR1YWwgY29tcG9uZW50cyBhcmUgY29ubmVjdGVkIHRvXG4gKiBlYWNoIG90aGVyIHRvIHByZXZlbnQgY29tcG9uZW50IGRyaWZ0LlxuICpcbiAqIEBwYXJhbSBncmFwaCBBIHZhbGlkIGdyYXBoIGluc3RhbmNlXG4gKiBAcmV0dXJuIEEgbGlzdCBvZiBjb21wb25lbnQgY2VudGVyIHZlcnRpY2VzIG9yIG51bGwgd2hlbiB0aGVyZVxuICogICAgICAgICBpcyBvbmx5IG9uZSBjb21wb25lbnQuXG4gKi9cbmZvb2dyYXBoLkZvcmNlRGlyZWN0ZWRWZXJ0ZXhMYXlvdXQucHJvdG90eXBlLl9faWRlbnRpZnlDb21wb25lbnRzID0gZnVuY3Rpb24oZ3JhcGgpIHtcbiAgdmFyIGNvbXBvbmVudENlbnRlcnMgPSBuZXcgQXJyYXkoKTtcbiAgdmFyIGNvbXBvbmVudHMgPSBuZXcgQXJyYXkoKTtcblxuICAvLyBEZXB0aCBmaXJzdCBzZWFyY2hcbiAgZnVuY3Rpb24gZGZzKHZlcnRleClcbiAge1xuICAgIHZhciBzdGFjayA9IG5ldyBBcnJheSgpO1xuICAgIHZhciBjb21wb25lbnQgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgY2VudGVyVmVydGV4ID0gbmV3IGZvb2dyYXBoLlZlcnRleChcImNvbXBvbmVudF9jZW50ZXJcIiwgLTEsIC0xKTtcbiAgICBjZW50ZXJWZXJ0ZXguaGlkZGVuID0gdHJ1ZTtcbiAgICBjb21wb25lbnRDZW50ZXJzLnB1c2goY2VudGVyVmVydGV4KTtcbiAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcblxuICAgIGZ1bmN0aW9uIHZpc2l0VmVydGV4KHYpXG4gICAge1xuICAgICAgY29tcG9uZW50LnB1c2godik7XG4gICAgICB2Ll9fZGZzVmlzaXRlZCA9IHRydWU7XG5cbiAgICAgIGZvciAodmFyIGkgaW4gdi5lZGdlcykge1xuICAgICAgICB2YXIgZSA9IHYuZWRnZXNbaV07XG4gICAgICAgIGlmICghZS5oaWRkZW4pXG4gICAgICAgICAgc3RhY2sucHVzaChlLmVuZFZlcnRleCk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgaW4gdi5yZXZlcnNlRWRnZXMpIHtcbiAgICAgICAgaWYgKCF2LnJldmVyc2VFZGdlc1tpXS5oaWRkZW4pXG4gICAgICAgICAgc3RhY2sucHVzaCh2LnJldmVyc2VFZGdlc1tpXS5lbmRWZXJ0ZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZpc2l0VmVydGV4KHZlcnRleCk7XG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciB1ID0gc3RhY2sucG9wKCk7XG5cbiAgICAgIGlmICghdS5fX2Rmc1Zpc2l0ZWQgJiYgIXUuaGlkZGVuKSB7XG4gICAgICAgIHZpc2l0VmVydGV4KHUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIENsZWFyIERGUyB2aXNpdGVkIGZsYWdcbiAgZm9yICh2YXIgaSBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNbaV07XG4gICAgdi5fX2Rmc1Zpc2l0ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgdmVydGljZXMgc3RhcnRpbmcgREZTIGZyb20gZWFjaCB2ZXJ0ZXhcbiAgLy8gdGhhdCBoYXNuJ3QgYmVlbiB2aXNpdGVkIHlldC5cbiAgZm9yICh2YXIgayBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgIHZhciB2ID0gZ3JhcGgudmVydGljZXNba107XG4gICAgaWYgKCF2Ll9fZGZzVmlzaXRlZCAmJiAhdi5oaWRkZW4pXG4gICAgICBkZnModik7XG4gIH1cblxuICAvLyBJbnRlcmNvbm5lY3QgYWxsIGNlbnRlciB2ZXJ0aWNlc1xuICBpZiAoY29tcG9uZW50Q2VudGVycy5sZW5ndGggPiAxKSB7XG4gICAgZm9yICh2YXIgaSBpbiBjb21wb25lbnRDZW50ZXJzKSB7XG4gICAgICBncmFwaC5pbnNlcnRWZXJ0ZXgoY29tcG9uZW50Q2VudGVyc1tpXSk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgaW4gY29tcG9uZW50cykge1xuICAgICAgZm9yICh2YXIgaiBpbiBjb21wb25lbnRzW2ldKSB7XG4gICAgICAgIC8vIENvbm5lY3QgdmlzaXRlZCB2ZXJ0ZXggdG8gXCJjZW50cmFsXCIgY29tcG9uZW50IHZlcnRleFxuICAgICAgICBlZGdlID0gZ3JhcGguaW5zZXJ0RWRnZShcIlwiLCAxLCBjb21wb25lbnRzW2ldW2pdLCBjb21wb25lbnRDZW50ZXJzW2ldKTtcbiAgICAgICAgZWRnZS5oaWRkZW4gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gY29tcG9uZW50Q2VudGVycykge1xuICAgICAgZm9yICh2YXIgaiBpbiBjb21wb25lbnRDZW50ZXJzKSB7XG4gICAgICAgIGlmIChpICE9IGopIHtcbiAgICAgICAgICBlID0gZ3JhcGguaW5zZXJ0RWRnZShcIlwiLCAzLCBjb21wb25lbnRDZW50ZXJzW2ldLCBjb21wb25lbnRDZW50ZXJzW2pdKTtcbiAgICAgICAgICBlLmhpZGRlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29tcG9uZW50Q2VudGVycztcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBjb29yZGluYXRlcyBiYXNlZCBvbiBmb3JjZS1kaXJlY3RlZCBwbGFjZW1lbnRcbiAqIGFsZ29yaXRobS5cbiAqXG4gKiBAcGFyYW0gZ3JhcGggQSB2YWxpZCBncmFwaCBpbnN0YW5jZVxuICovXG5mb29ncmFwaC5Gb3JjZURpcmVjdGVkVmVydGV4TGF5b3V0LnByb3RvdHlwZS5sYXlvdXQgPSBmdW5jdGlvbihncmFwaCkge1xuICB0aGlzLmdyYXBoID0gZ3JhcGg7XG4gIHZhciBhcmVhID0gdGhpcy53aWR0aCAqIHRoaXMuaGVpZ2h0O1xuICB2YXIgayA9IE1hdGguc3FydChhcmVhIC8gZ3JhcGgudmVydGV4Q291bnQpO1xuXG4gIHZhciB0ID0gdGhpcy53aWR0aCAvIDEwOyAvLyBUZW1wZXJhdHVyZS5cbiAgdmFyIGR0ID0gdCAvICh0aGlzLml0ZXJhdGlvbnMgKyAxKTtcblxuICB2YXIgZXBzID0gdGhpcy5lcHM7IC8vIE1pbmltdW0gZGlzdGFuY2UgYmV0d2VlbiB0aGUgdmVydGljZXNcblxuICAvLyBBdHRyYWN0aXZlIGFuZCByZXB1bHNpdmUgZm9yY2VzXG4gIGZ1bmN0aW9uIEZhKHopIHsgcmV0dXJuIGZvb2dyYXBoLkEqeip6L2s7IH1cbiAgZnVuY3Rpb24gRnIoeikgeyByZXR1cm4gZm9vZ3JhcGguUiprKmsvejsgfVxuICBmdW5jdGlvbiBGdyh6KSB7IHJldHVybiAxL3oqejsgfSAgLy8gRm9yY2UgZW1pdGVkIGJ5IHRoZSB3YWxsc1xuXG4gIC8vIEluaXRpYXRlIGNvbXBvbmVudCBpZGVudGlmaWNhdGlvbiBhbmQgdmlydHVhbCB2ZXJ0ZXggY3JlYXRpb25cbiAgLy8gdG8gcHJldmVudCBkaXNjb25uZWN0ZWQgZ3JhcGggY29tcG9uZW50cyBmcm9tIGRyaWZ0aW5nIHRvbyBmYXIgYXBhcnRcbiAgY2VudGVycyA9IHRoaXMuX19pZGVudGlmeUNvbXBvbmVudHMoZ3JhcGgpO1xuXG4gIC8vIEFzc2lnbiBpbml0aWFsIHJhbmRvbSBwb3NpdGlvbnNcbiAgaWYodGhpcy5yYW5kb21pemUpIHtcbiAgICByYW5kb21MYXlvdXQgPSBuZXcgZm9vZ3JhcGguUmFuZG9tVmVydGV4TGF5b3V0KHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICByYW5kb21MYXlvdXQubGF5b3V0KGdyYXBoKTtcbiAgfVxuXG4gIC8vIFJ1biB0aHJvdWdoIHNvbWUgaXRlcmF0aW9uc1xuICBmb3IgKHZhciBxID0gMDsgcSA8IHRoaXMuaXRlcmF0aW9uczsgcSsrKSB7XG5cbiAgICAvKiBDYWxjdWxhdGUgcmVwdWxzaXZlIGZvcmNlcy4gKi9cbiAgICBmb3IgKHZhciBpMSBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1tpMV07XG5cbiAgICAgIHYuZHggPSAwO1xuICAgICAgdi5keSA9IDA7XG4gICAgICAvLyBEbyBub3QgbW92ZSBmaXhlZCB2ZXJ0aWNlc1xuICAgICAgaWYoIXYuZml4ZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaTIgaW4gZ3JhcGgudmVydGljZXMpIHtcbiAgICAgICAgICB2YXIgdSA9IGdyYXBoLnZlcnRpY2VzW2kyXTtcbiAgICAgICAgICBpZiAodiAhPSB1ICYmICF1LmZpeGVkKSB7XG4gICAgICAgICAgICAvKiBEaWZmZXJlbmNlIHZlY3RvciBiZXR3ZWVuIHRoZSB0d28gdmVydGljZXMuICovXG4gICAgICAgICAgICB2YXIgZGlmeCA9IHYueCAtIHUueDtcbiAgICAgICAgICAgIHZhciBkaWZ5ID0gdi55IC0gdS55O1xuXG4gICAgICAgICAgICAvKiBMZW5ndGggb2YgdGhlIGRpZiB2ZWN0b3IuICovXG4gICAgICAgICAgICB2YXIgZCA9IE1hdGgubWF4KGVwcywgTWF0aC5zcXJ0KGRpZngqZGlmeCArIGRpZnkqZGlmeSkpO1xuICAgICAgICAgICAgdmFyIGZvcmNlID0gRnIoZCk7XG4gICAgICAgICAgICB2LmR4ID0gdi5keCArIChkaWZ4L2QpICogZm9yY2U7XG4gICAgICAgICAgICB2LmR5ID0gdi5keSArIChkaWZ5L2QpICogZm9yY2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qIFRyZWF0IHRoZSB3YWxscyBhcyBzdGF0aWMgb2JqZWN0cyBlbWl0aW5nIGZvcmNlIEZ3LiAqL1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIHN1bSBvZiBcIndhbGxcIiBmb3JjZXMgaW4gKHYueCwgdi55KVxuICAgICAgICAvKlxuICAgICAgICB2YXIgeCA9IE1hdGgubWF4KGVwcywgdi54KTtcbiAgICAgICAgdmFyIHkgPSBNYXRoLm1heChlcHMsIHYueSk7XG4gICAgICAgIHZhciB3eCA9IE1hdGgubWF4KGVwcywgdGhpcy53aWR0aCAtIHYueCk7XG4gICAgICAgIHZhciB3eSA9IE1hdGgubWF4KGVwcywgdGhpcy5oZWlnaHQgLSB2LnkpOyAgIC8vIEdvdHRhIGxvdmUgYWxsIHRob3NlIE5hTidzIDopXG4gICAgICAgIHZhciBSeCA9IEZ3KHgpIC0gRncod3gpO1xuICAgICAgICB2YXIgUnkgPSBGdyh5KSAtIEZ3KHd5KTtcblxuICAgICAgICB2LmR4ID0gdi5keCArIFJ4O1xuICAgICAgICB2LmR5ID0gdi5keSArIFJ5O1xuICAgICAgICAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qIENhbGN1bGF0ZSBhdHRyYWN0aXZlIGZvcmNlcy4gKi9cbiAgICBmb3IgKHZhciBpMyBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1tpM107XG5cbiAgICAgIC8vIERvIG5vdCBtb3ZlIGZpeGVkIHZlcnRpY2VzXG4gICAgICBpZighdi5maXhlZCkge1xuICAgICAgICBmb3IgKHZhciBpNCBpbiB2LmVkZ2VzKSB7XG4gICAgICAgICAgdmFyIGUgPSB2LmVkZ2VzW2k0XTtcbiAgICAgICAgICB2YXIgdSA9IGUuZW5kVmVydGV4O1xuICAgICAgICAgIHZhciBkaWZ4ID0gdi54IC0gdS54O1xuICAgICAgICAgIHZhciBkaWZ5ID0gdi55IC0gdS55O1xuICAgICAgICAgIHZhciBkID0gTWF0aC5tYXgoZXBzLCBNYXRoLnNxcnQoZGlmeCpkaWZ4ICsgZGlmeSpkaWZ5KSk7XG4gICAgICAgICAgdmFyIGZvcmNlID0gRmEoZCk7XG5cbiAgICAgICAgICAvKiBMZW5ndGggb2YgdGhlIGRpZiB2ZWN0b3IuICovXG4gICAgICAgICAgdmFyIGQgPSBNYXRoLm1heChlcHMsIE1hdGguc3FydChkaWZ4KmRpZnggKyBkaWZ5KmRpZnkpKTtcbiAgICAgICAgICB2LmR4ID0gdi5keCAtIChkaWZ4L2QpICogZm9yY2U7XG4gICAgICAgICAgdi5keSA9IHYuZHkgLSAoZGlmeS9kKSAqIGZvcmNlO1xuXG4gICAgICAgICAgdS5keCA9IHUuZHggKyAoZGlmeC9kKSAqIGZvcmNlO1xuICAgICAgICAgIHUuZHkgPSB1LmR5ICsgKGRpZnkvZCkgKiBmb3JjZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8qIExpbWl0IHRoZSBtYXhpbXVtIGRpc3BsYWNlbWVudCB0byB0aGUgdGVtcGVyYXR1cmUgdFxuICAgICAgICBhbmQgcHJldmVudCBmcm9tIGJlaW5nIGRpc3BsYWNlZCBvdXRzaWRlIGZyYW1lLiAgICAgKi9cbiAgICBmb3IgKHZhciBpNSBpbiBncmFwaC52ZXJ0aWNlcykge1xuICAgICAgdmFyIHYgPSBncmFwaC52ZXJ0aWNlc1tpNV07XG4gICAgICBpZighdi5maXhlZCkge1xuICAgICAgICAvKiBMZW5ndGggb2YgdGhlIGRpc3BsYWNlbWVudCB2ZWN0b3IuICovXG4gICAgICAgIHZhciBkID0gTWF0aC5tYXgoZXBzLCBNYXRoLnNxcnQodi5keCp2LmR4ICsgdi5keSp2LmR5KSk7XG5cbiAgICAgICAgLyogTGltaXQgdG8gdGhlIHRlbXBlcmF0dXJlIHQuICovXG4gICAgICAgIHYueCA9IHYueCArICh2LmR4L2QpICogTWF0aC5taW4oZCwgdCk7XG4gICAgICAgIHYueSA9IHYueSArICh2LmR5L2QpICogTWF0aC5taW4oZCwgdCk7XG5cbiAgICAgICAgLyogU3RheSBpbnNpZGUgdGhlIGZyYW1lLiAqL1xuICAgICAgICAvKlxuICAgICAgICBib3JkZXJXaWR0aCA9IHRoaXMud2lkdGggLyA1MDtcbiAgICAgICAgaWYgKHYueCA8IGJvcmRlcldpZHRoKSB7XG4gICAgICAgICAgdi54ID0gYm9yZGVyV2lkdGg7XG4gICAgICAgIH0gZWxzZSBpZiAodi54ID4gdGhpcy53aWR0aCAtIGJvcmRlcldpZHRoKSB7XG4gICAgICAgICAgdi54ID0gdGhpcy53aWR0aCAtIGJvcmRlcldpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYueSA8IGJvcmRlcldpZHRoKSB7XG4gICAgICAgICAgdi55ID0gYm9yZGVyV2lkdGg7XG4gICAgICAgIH0gZWxzZSBpZiAodi55ID4gdGhpcy5oZWlnaHQgLSBib3JkZXJXaWR0aCkge1xuICAgICAgICAgIHYueSA9IHRoaXMuaGVpZ2h0IC0gYm9yZGVyV2lkdGg7XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgdi54ID0gTWF0aC5yb3VuZCh2LngpO1xuICAgICAgICB2LnkgPSBNYXRoLnJvdW5kKHYueSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyogQ29vbC4gKi9cbiAgICB0IC09IGR0O1xuXG4gICAgaWYgKHEgJSAxMCA9PSAwKSB7XG4gICAgICB0aGlzLmNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIHZpcnR1YWwgY2VudGVyIHZlcnRpY2VzXG4gIGlmIChjZW50ZXJzKSB7XG4gICAgZm9yICh2YXIgaSBpbiBjZW50ZXJzKSB7XG4gICAgICBncmFwaC5yZW1vdmVWZXJ0ZXgoY2VudGVyc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgZ3JhcGgubm9ybWFsaXplKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0cnVlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZm9vZ3JhcGg7XG4iLCIndXNlIHN0cmljdCc7XG5cbihmdW5jdGlvbigpe1xuXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcbiAgdmFyIGdldExheW91dCA9IHJlcXVpcmUoJy4vbGF5b3V0Jyk7XG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uKCBjeXRvc2NhcGUgKXtcbiAgICB2YXIgbGF5b3V0ID0gZ2V0TGF5b3V0KCBjeXRvc2NhcGUgKTtcblxuICAgIGN5dG9zY2FwZSgnbGF5b3V0JywgJ3NwcmVhZCcsIGxheW91dCk7XG4gIH07XG5cbiAgaWYoIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzICl7IC8vIGV4cG9zZSBhcyBhIGNvbW1vbmpzIG1vZHVsZVxuICAgIG1vZHVsZS5leHBvcnRzID0gcmVnaXN0ZXI7XG4gIH1cblxuICBpZiggdHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCApeyAvLyBleHBvc2UgYXMgYW4gYW1kL3JlcXVpcmVqcyBtb2R1bGVcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS1zcHJlYWQnLCBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIHJlZ2lzdGVyO1xuICAgIH0pO1xuICB9XG5cbiAgaWYoIHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnICl7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXG4gICAgcmVnaXN0ZXIoIGN5dG9zY2FwZSApO1xuICB9XG5cbn0pKCk7XG4iLCJ2YXIgVGhyZWFkO1xuXG52YXIgZm9vZ3JhcGggPSByZXF1aXJlKCcuL2Zvb2dyYXBoJyk7XG52YXIgVm9yb25vaSA9IHJlcXVpcmUoJy4vcmhpbGwtdm9yb25vaS1jb3JlJyk7XG5cbi8qXG4gKiBUaGlzIGxheW91dCBjb21iaW5lcyBzZXZlcmFsIGFsZ29yaXRobXM6XG4gKlxuICogLSBJdCBnZW5lcmF0ZXMgYW4gaW5pdGlhbCBwb3NpdGlvbiBvZiB0aGUgbm9kZXMgYnkgdXNpbmcgdGhlXG4gKiAgIEZydWNodGVybWFuLVJlaW5nb2xkIGFsZ29yaXRobSAoZG9pOjEwLjEwMDIvc3BlLjQzODAyMTExMDIpXG4gKlxuICogLSBGaW5hbGx5IGl0IGVsaW1pbmF0ZXMgb3ZlcmxhcHMgYnkgdXNpbmcgdGhlIG1ldGhvZCBkZXNjcmliZWQgYnlcbiAqICAgR2Fuc25lciBhbmQgTm9ydGggKGRvaToxMC4xMDA3LzMtNTQwLTM3NjIzLTJfMjgpXG4gKi9cblxudmFyIGRlZmF1bHRzID0ge1xuICBhbmltYXRlOiB0cnVlLCAvLyB3aGV0aGVyIHRvIHNob3cgdGhlIGxheW91dCBhcyBpdCdzIHJ1bm5pbmdcbiAgcmVhZHk6IHVuZGVmaW5lZCwgLy8gQ2FsbGJhY2sgb24gbGF5b3V0cmVhZHlcbiAgc3RvcDogdW5kZWZpbmVkLCAvLyBDYWxsYmFjayBvbiBsYXlvdXRzdG9wXG4gIGZpdDogdHJ1ZSwgLy8gUmVzZXQgdmlld3BvcnQgdG8gZml0IGRlZmF1bHQgc2ltdWxhdGlvbkJvdW5kc1xuICBtaW5EaXN0OiAyMCwgLy8gTWluaW11bSBkaXN0YW5jZSBiZXR3ZWVuIG5vZGVzXG4gIHBhZGRpbmc6IDIwLCAvLyBQYWRkaW5nXG4gIGV4cGFuZGluZ0ZhY3RvcjogLTEuMCwgLy8gSWYgdGhlIG5ldHdvcmsgZG9lcyBub3Qgc2F0aXNmeSB0aGUgbWluRGlzdFxuICAvLyBjcml0ZXJpdW0gdGhlbiBpdCBleHBhbmRzIHRoZSBuZXR3b3JrIG9mIHRoaXMgYW1vdW50XG4gIC8vIElmIGl0IGlzIHNldCB0byAtMS4wIHRoZSBhbW91bnQgb2YgZXhwYW5zaW9uIGlzIGF1dG9tYXRpY2FsbHlcbiAgLy8gY2FsY3VsYXRlZCBiYXNlZCBvbiB0aGUgbWluRGlzdCwgdGhlIGFzcGVjdCByYXRpbyBhbmQgdGhlXG4gIC8vIG51bWJlciBvZiBub2Rlc1xuICBtYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9uczogNTAsIC8vIE1heGltdW0gbnVtYmVyIG9mIGluaXRpYWwgZm9yY2UtZGlyZWN0ZWQgaXRlcmF0aW9uc1xuICBtYXhFeHBhbmRJdGVyYXRpb25zOiA0LCAvLyBNYXhpbXVtIG51bWJlciBvZiBleHBhbmRpbmcgaXRlcmF0aW9uc1xuICBib3VuZGluZ0JveDogdW5kZWZpbmVkLCAvLyBDb25zdHJhaW4gbGF5b3V0IGJvdW5kczsgeyB4MSwgeTEsIHgyLCB5MiB9IG9yIHsgeDEsIHkxLCB3LCBoIH1cbiAgcmFuZG9taXplOiBmYWxzZSAvLyB1c2VzIHJhbmRvbSBpbml0aWFsIG5vZGUgcG9zaXRpb25zIG9uIHRydWVcbn07XG5cbmZ1bmN0aW9uIFNwcmVhZExheW91dCggb3B0aW9ucyApIHtcbiAgdmFyIG9wdHMgPSB0aGlzLm9wdGlvbnMgPSB7fTtcbiAgZm9yKCB2YXIgaSBpbiBkZWZhdWx0cyApeyBvcHRzW2ldID0gZGVmYXVsdHNbaV07IH1cbiAgZm9yKCB2YXIgaSBpbiBvcHRpb25zICl7IG9wdHNbaV0gPSBvcHRpb25zW2ldOyB9XG59XG5cbmZ1bmN0aW9uIGNlbGxDZW50cm9pZCggY2VsbCApIHtcbiAgdmFyIGhlcyA9IGNlbGwuaGFsZmVkZ2VzO1xuICB2YXIgYXJlYSA9IDAsXG4gICAgeCA9IDAsXG4gICAgeSA9IDA7XG4gIHZhciBwMSwgcDIsIGY7XG5cbiAgZm9yKCB2YXIgaSA9IDA7IGkgPCBoZXMubGVuZ3RoOyArK2kgKSB7XG4gICAgcDEgPSBoZXNbIGkgXS5nZXRFbmRwb2ludCgpO1xuICAgIHAyID0gaGVzWyBpIF0uZ2V0U3RhcnRwb2ludCgpO1xuXG4gICAgYXJlYSArPSBwMS54ICogcDIueTtcbiAgICBhcmVhIC09IHAxLnkgKiBwMi54O1xuXG4gICAgZiA9IHAxLnggKiBwMi55IC0gcDIueCAqIHAxLnk7XG4gICAgeCArPSAoIHAxLnggKyBwMi54ICkgKiBmO1xuICAgIHkgKz0gKCBwMS55ICsgcDIueSApICogZjtcbiAgfVxuXG4gIGFyZWEgLz0gMjtcbiAgZiA9IGFyZWEgKiA2O1xuICByZXR1cm4ge1xuICAgIHg6IHggLyBmLFxuICAgIHk6IHkgLyBmXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNpdGVzRGlzdGFuY2UoIGxzLCBycyApIHtcbiAgdmFyIGR4ID0gbHMueCAtIHJzLng7XG4gIHZhciBkeSA9IGxzLnkgLSBycy55O1xuICByZXR1cm4gTWF0aC5zcXJ0KCBkeCAqIGR4ICsgZHkgKiBkeSApO1xufVxuXG5TcHJlYWRMYXlvdXQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKCkge1xuXG4gIHZhciBsYXlvdXQgPSB0aGlzO1xuICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgdmFyIGN5ID0gb3B0aW9ucy5jeTtcblxuICB2YXIgYmIgPSBvcHRpb25zLmJvdW5kaW5nQm94IHx8IHsgeDE6IDAsIHkxOiAwLCB3OiBjeS53aWR0aCgpLCBoOiBjeS5oZWlnaHQoKSB9O1xuICBpZiggYmIueDIgPT09IHVuZGVmaW5lZCApeyBiYi54MiA9IGJiLngxICsgYmIudzsgfVxuICBpZiggYmIudyA9PT0gdW5kZWZpbmVkICl7IGJiLncgPSBiYi54MiAtIGJiLngxOyB9XG4gIGlmKCBiYi55MiA9PT0gdW5kZWZpbmVkICl7IGJiLnkyID0gYmIueTEgKyBiYi5oOyB9XG4gIGlmKCBiYi5oID09PSB1bmRlZmluZWQgKXsgYmIuaCA9IGJiLnkyIC0gYmIueTE7IH1cblxuICB2YXIgbm9kZXMgPSBjeS5ub2RlcygpO1xuICB2YXIgZWRnZXMgPSBjeS5lZGdlcygpO1xuICB2YXIgY1dpZHRoID0gY3kud2lkdGgoKTtcbiAgdmFyIGNIZWlnaHQgPSBjeS5oZWlnaHQoKTtcbiAgdmFyIHNpbXVsYXRpb25Cb3VuZHMgPSBiYjtcbiAgdmFyIHBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmc7XG4gIHZhciBzaW1CQkZhY3RvciA9IE1hdGgubWF4KCAxLCBNYXRoLmxvZyhub2Rlcy5sZW5ndGgpICogMC44ICk7XG5cbiAgaWYoIG5vZGVzLmxlbmd0aCA8IDEwMCApe1xuICAgIHNpbUJCRmFjdG9yIC89IDI7XG4gIH1cblxuICBsYXlvdXQudHJpZ2dlcigge1xuICAgIHR5cGU6ICdsYXlvdXRzdGFydCcsXG4gICAgbGF5b3V0OiBsYXlvdXRcbiAgfSApO1xuXG4gIHZhciBzaW1CQiA9IHtcbiAgICB4MTogMCxcbiAgICB5MTogMCxcbiAgICB4MjogY1dpZHRoICogc2ltQkJGYWN0b3IsXG4gICAgeTI6IGNIZWlnaHQgKiBzaW1CQkZhY3RvclxuICB9O1xuXG4gIGlmKCBzaW11bGF0aW9uQm91bmRzICkge1xuICAgIHNpbUJCLngxID0gc2ltdWxhdGlvbkJvdW5kcy54MTtcbiAgICBzaW1CQi55MSA9IHNpbXVsYXRpb25Cb3VuZHMueTE7XG4gICAgc2ltQkIueDIgPSBzaW11bGF0aW9uQm91bmRzLngyO1xuICAgIHNpbUJCLnkyID0gc2ltdWxhdGlvbkJvdW5kcy55MjtcbiAgfVxuXG4gIHNpbUJCLngxICs9IHBhZGRpbmc7XG4gIHNpbUJCLnkxICs9IHBhZGRpbmc7XG4gIHNpbUJCLngyIC09IHBhZGRpbmc7XG4gIHNpbUJCLnkyIC09IHBhZGRpbmc7XG5cbiAgdmFyIHdpZHRoID0gc2ltQkIueDIgLSBzaW1CQi54MTtcbiAgdmFyIGhlaWdodCA9IHNpbUJCLnkyIC0gc2ltQkIueTE7XG5cbiAgLy8gR2V0IHN0YXJ0IHRpbWVcbiAgdmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgLy8gbGF5b3V0IGRvZXNuJ3Qgd29yayB3aXRoIGp1c3QgMSBub2RlXG4gIGlmKCBub2Rlcy5zaXplKCkgPD0gMSApIHtcbiAgICBub2Rlcy5wb3NpdGlvbnMoIHtcbiAgICAgIHg6IE1hdGgucm91bmQoICggc2ltQkIueDEgKyBzaW1CQi54MiApIC8gMiApLFxuICAgICAgeTogTWF0aC5yb3VuZCggKCBzaW1CQi55MSArIHNpbUJCLnkyICkgLyAyIClcbiAgICB9ICk7XG5cbiAgICBpZiggb3B0aW9ucy5maXQgKSB7XG4gICAgICBjeS5maXQoIG9wdGlvbnMucGFkZGluZyApO1xuICAgIH1cblxuICAgIC8vIEdldCBlbmQgdGltZVxuICAgIHZhciBlbmRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBjb25zb2xlLmluZm8oIFwiTGF5b3V0IG9uIFwiICsgbm9kZXMuc2l6ZSgpICsgXCIgbm9kZXMgdG9vayBcIiArICggZW5kVGltZSAtIHN0YXJ0VGltZSApICsgXCIgbXNcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRyZWFkeVwiLCBvcHRpb25zLnJlYWR5ICk7XG4gICAgbGF5b3V0LnRyaWdnZXIoIFwibGF5b3V0cmVhZHlcIiApO1xuXG4gICAgbGF5b3V0Lm9uZSggXCJsYXlvdXRzdG9wXCIsIG9wdGlvbnMuc3RvcCApO1xuICAgIGxheW91dC50cmlnZ2VyKCBcImxheW91dHN0b3BcIiApO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gRmlyc3QgSSBuZWVkIHRvIGNyZWF0ZSB0aGUgZGF0YSBzdHJ1Y3R1cmUgdG8gcGFzcyB0byB0aGUgd29ya2VyXG4gIHZhciBwRGF0YSA9IHtcbiAgICAnd2lkdGgnOiB3aWR0aCxcbiAgICAnaGVpZ2h0JzogaGVpZ2h0LFxuICAgICdtaW5EaXN0Jzogb3B0aW9ucy5taW5EaXN0LFxuICAgICdleHBGYWN0Jzogb3B0aW9ucy5leHBhbmRpbmdGYWN0b3IsXG4gICAgJ2V4cEl0JzogMCxcbiAgICAnbWF4RXhwSXQnOiBvcHRpb25zLm1heEV4cGFuZEl0ZXJhdGlvbnMsXG4gICAgJ3ZlcnRpY2VzJzogW10sXG4gICAgJ2VkZ2VzJzogW10sXG4gICAgJ3N0YXJ0VGltZSc6IHN0YXJ0VGltZSxcbiAgICAnbWF4RnJ1Y2h0ZXJtYW5SZWluZ29sZEl0ZXJhdGlvbnMnOiBvcHRpb25zLm1heEZydWNodGVybWFuUmVpbmdvbGRJdGVyYXRpb25zXG4gIH07XG5cbiAgbm9kZXMuZWFjaChcbiAgICBmdW5jdGlvbiggaSwgbm9kZSApIHtcbiAgICAgIHZhciBub2RlSWQgPSBub2RlLmlkKCk7XG4gICAgICB2YXIgcG9zID0gbm9kZS5wb3NpdGlvbigpO1xuXG4gICAgICBpZiggb3B0aW9ucy5yYW5kb21pemUgKXtcbiAgICAgICAgcG9zID0ge1xuICAgICAgICAgIHg6IE1hdGgucm91bmQoIHNpbUJCLngxICsgKHNpbUJCLngyIC0gc2ltQkIueDEpICogTWF0aC5yYW5kb20oKSApLFxuICAgICAgICAgIHk6IE1hdGgucm91bmQoIHNpbUJCLnkxICsgKHNpbUJCLnkyIC0gc2ltQkIueTEpICogTWF0aC5yYW5kb20oKSApXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHBEYXRhWyAndmVydGljZXMnIF0ucHVzaCgge1xuICAgICAgICBpZDogbm9kZUlkLFxuICAgICAgICB4OiBwb3MueCxcbiAgICAgICAgeTogcG9zLnlcbiAgICAgIH0gKTtcbiAgICB9ICk7XG5cbiAgZWRnZXMuZWFjaChcbiAgICBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzcmNOb2RlSWQgPSB0aGlzLnNvdXJjZSgpLmlkKCk7XG4gICAgICB2YXIgdGd0Tm9kZUlkID0gdGhpcy50YXJnZXQoKS5pZCgpO1xuICAgICAgcERhdGFbICdlZGdlcycgXS5wdXNoKCB7XG4gICAgICAgIHNyYzogc3JjTm9kZUlkLFxuICAgICAgICB0Z3Q6IHRndE5vZGVJZFxuICAgICAgfSApO1xuICAgIH0gKTtcblxuICAvL0RlY2xlcmF0aW9uXG4gIHZhciB0MSA9IGxheW91dC50aHJlYWQ7XG5cbiAgLy8gcmV1c2Ugb2xkIHRocmVhZCBpZiBwb3NzaWJsZVxuICBpZiggIXQxIHx8IHQxLnN0b3BwZWQoKSApe1xuICAgIHQxID0gbGF5b3V0LnRocmVhZCA9IFRocmVhZCgpO1xuXG4gICAgLy8gQW5kIHRvIGFkZCB0aGUgcmVxdWlyZWQgc2NyaXB0c1xuICAgIC8vRVhURVJOQUwgMVxuICAgIHQxLnJlcXVpcmUoIGZvb2dyYXBoLCAnZm9vZ3JhcGgnICk7XG4gICAgLy9FWFRFUk5BTCAyXG4gICAgdDEucmVxdWlyZSggVm9yb25vaSApO1xuXG4gICAgLy9Mb2NhbCBmdW5jdGlvblxuICAgIHQxLnJlcXVpcmUoIHNpdGVzRGlzdGFuY2UgKTtcbiAgICB0MS5yZXF1aXJlKCBjZWxsQ2VudHJvaWQgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFBvc2l0aW9ucyggcERhdGEgKXsgLy9jb25zb2xlLmxvZygnc2V0IHBvc25zJylcbiAgICAvLyBGaXJzdCB3ZSByZXRyaWV2ZSB0aGUgaW1wb3J0YW50IGRhdGFcbiAgICAvLyB2YXIgZXhwYW5kSXRlcmF0aW9uID0gcERhdGFbICdleHBJdCcgXTtcbiAgICB2YXIgZGF0YVZlcnRpY2VzID0gcERhdGFbICd2ZXJ0aWNlcycgXTtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICBmb3IoIHZhciBpID0gMDsgaSA8IGRhdGFWZXJ0aWNlcy5sZW5ndGg7ICsraSApIHtcbiAgICAgIHZhciBkdiA9IGRhdGFWZXJ0aWNlc1sgaSBdO1xuICAgICAgdmVydGljZXNbIGR2LmlkIF0gPSB7XG4gICAgICAgIHg6IGR2LngsXG4gICAgICAgIHk6IGR2LnlcbiAgICAgIH07XG4gICAgfVxuICAgIC8qXG4gICAgICogRklOQUxMWTpcbiAgICAgKlxuICAgICAqIFdlIHBvc2l0aW9uIHRoZSBub2RlcyBiYXNlZCBvbiB0aGUgY2FsY3VsYXRpb25cbiAgICAgKi9cbiAgICBub2Rlcy5wb3NpdGlvbnMoXG4gICAgICBmdW5jdGlvbiggaSwgbm9kZSApIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZS5pZCgpXG4gICAgICAgIHZhciB2ZXJ0ZXggPSB2ZXJ0aWNlc1sgaWQgXTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IE1hdGgucm91bmQoIHNpbUJCLngxICsgdmVydGV4LnggKSxcbiAgICAgICAgICB5OiBNYXRoLnJvdW5kKCBzaW1CQi55MSArIHZlcnRleC55IClcbiAgICAgICAgfTtcbiAgICAgIH0gKTtcblxuICAgIGlmKCBvcHRpb25zLmZpdCApIHtcbiAgICAgIGN5LmZpdCggb3B0aW9ucy5wYWRkaW5nICk7XG4gICAgfVxuXG4gICAgY3kubm9kZXMoKS5ydHJpZ2dlciggXCJwb3NpdGlvblwiICk7XG4gIH1cblxuICB2YXIgZGlkTGF5b3V0UmVhZHkgPSBmYWxzZTtcbiAgdDEub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihlKXtcbiAgICB2YXIgcERhdGEgPSBlLm1lc3NhZ2U7IC8vY29uc29sZS5sb2coJ21lc3NhZ2UnLCBlKVxuXG4gICAgaWYoICFvcHRpb25zLmFuaW1hdGUgKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRQb3NpdGlvbnMoIHBEYXRhICk7XG5cbiAgICBpZiggIWRpZExheW91dFJlYWR5ICl7XG4gICAgICBsYXlvdXQudHJpZ2dlciggXCJsYXlvdXRyZWFkeVwiICk7XG5cbiAgICAgIGRpZExheW91dFJlYWR5ID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIGxheW91dC5vbmUoIFwibGF5b3V0cmVhZHlcIiwgb3B0aW9ucy5yZWFkeSApO1xuXG4gIHQxLnBhc3MoIHBEYXRhICkucnVuKCBmdW5jdGlvbiggcERhdGEgKSB7XG5cbiAgICBmb29ncmFwaCA9IGV2YWwoJ2Zvb2dyYXBoJyk7XG4gICAgVm9yb25vaSA9IGV2YWwoJ1Zvcm9ub2knKTtcblxuICAgIC8vIEkgbmVlZCB0byByZXRyaWV2ZSB0aGUgaW1wb3J0YW50IGRhdGFcbiAgICB2YXIgbFdpZHRoID0gcERhdGFbICd3aWR0aCcgXTtcbiAgICB2YXIgbEhlaWdodCA9IHBEYXRhWyAnaGVpZ2h0JyBdO1xuICAgIHZhciBsTWluRGlzdCA9IHBEYXRhWyAnbWluRGlzdCcgXTtcbiAgICB2YXIgbEV4cEZhY3QgPSBwRGF0YVsgJ2V4cEZhY3QnIF07XG4gICAgdmFyIGxNYXhFeHBJdCA9IHBEYXRhWyAnbWF4RXhwSXQnIF07XG4gICAgdmFyIGxNYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9ucyA9IHBEYXRhWyAnbWF4RnJ1Y2h0ZXJtYW5SZWluZ29sZEl0ZXJhdGlvbnMnIF07XG5cbiAgICAvLyBQcmVwYXJlIHRoZSBkYXRhIHRvIG91dHB1dFxuICAgIHZhciBzYXZlUG9zaXRpb25zID0gZnVuY3Rpb24oKXtcbiAgICAgIHBEYXRhWyAnd2lkdGgnIF0gPSBsV2lkdGg7XG4gICAgICBwRGF0YVsgJ2hlaWdodCcgXSA9IGxIZWlnaHQ7XG4gICAgICBwRGF0YVsgJ2V4cEl0JyBdID0gZXhwYW5kSXRlcmF0aW9uO1xuICAgICAgcERhdGFbICdleHBGYWN0JyBdID0gbEV4cEZhY3Q7XG5cbiAgICAgIHBEYXRhWyAndmVydGljZXMnIF0gPSBbXTtcbiAgICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZnYubGVuZ3RoOyArK2kgKSB7XG4gICAgICAgIHBEYXRhWyAndmVydGljZXMnIF0ucHVzaCgge1xuICAgICAgICAgIGlkOiBmdlsgaSBdLmxhYmVsLFxuICAgICAgICAgIHg6IGZ2WyBpIF0ueCxcbiAgICAgICAgICB5OiBmdlsgaSBdLnlcbiAgICAgICAgfSApO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgbWVzc2FnZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCl7XG4gICAgICBicm9hZGNhc3QoIHBEYXRhICk7XG4gICAgfTtcblxuICAgIC8qXG4gICAgICogRklSU1QgU1RFUDogQXBwbGljYXRpb24gb2YgdGhlIEZydWNodGVybWFuLVJlaW5nb2xkIGFsZ29yaXRobVxuICAgICAqXG4gICAgICogV2UgdXNlIHRoZSB2ZXJzaW9uIGltcGxlbWVudGVkIGJ5IHRoZSBmb29ncmFwaCBsaWJyYXJ5XG4gICAgICpcbiAgICAgKiBSZWYuOiBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Zvb2dyYXBoL1xuICAgICAqL1xuXG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYSBncmFwaCBjb21wYXRpYmxlIHdpdGggdGhlIGxpYnJhcnlcbiAgICB2YXIgZnJnID0gbmV3IGZvb2dyYXBoLkdyYXBoKCBcIkZSZ3JhcGhcIiwgZmFsc2UgKTtcblxuICAgIHZhciBmcmdOb2RlcyA9IHt9O1xuXG4gICAgLy8gVGhlbiB3ZSBoYXZlIHRvIGFkZCB0aGUgdmVydGljZXNcbiAgICB2YXIgZGF0YVZlcnRpY2VzID0gcERhdGFbICd2ZXJ0aWNlcycgXTtcbiAgICBmb3IoIHZhciBuaSA9IDA7IG5pIDwgZGF0YVZlcnRpY2VzLmxlbmd0aDsgKytuaSApIHtcbiAgICAgIHZhciBpZCA9IGRhdGFWZXJ0aWNlc1sgbmkgXVsgJ2lkJyBdO1xuICAgICAgdmFyIHYgPSBuZXcgZm9vZ3JhcGguVmVydGV4KCBpZCwgTWF0aC5yb3VuZCggTWF0aC5yYW5kb20oKSAqIGxIZWlnaHQgKSwgTWF0aC5yb3VuZCggTWF0aC5yYW5kb20oKSAqIGxIZWlnaHQgKSApO1xuICAgICAgZnJnTm9kZXNbIGlkIF0gPSB2O1xuICAgICAgZnJnLmluc2VydFZlcnRleCggdiApO1xuICAgIH1cblxuICAgIHZhciBkYXRhRWRnZXMgPSBwRGF0YVsgJ2VkZ2VzJyBdO1xuICAgIGZvciggdmFyIGVpID0gMDsgZWkgPCBkYXRhRWRnZXMubGVuZ3RoOyArK2VpICkge1xuICAgICAgdmFyIHNyY05vZGVJZCA9IGRhdGFFZGdlc1sgZWkgXVsgJ3NyYycgXTtcbiAgICAgIHZhciB0Z3ROb2RlSWQgPSBkYXRhRWRnZXNbIGVpIF1bICd0Z3QnIF07XG4gICAgICBmcmcuaW5zZXJ0RWRnZSggXCJcIiwgMSwgZnJnTm9kZXNbIHNyY05vZGVJZCBdLCBmcmdOb2Rlc1sgdGd0Tm9kZUlkIF0gKTtcbiAgICB9XG5cbiAgICB2YXIgZnYgPSBmcmcudmVydGljZXM7XG5cbiAgICAvLyBUaGVuIHdlIGFwcGx5IHRoZSBsYXlvdXRcbiAgICB2YXIgaXRlcmF0aW9ucyA9IGxNYXhGcnVjaHRlcm1hblJlaW5nb2xkSXRlcmF0aW9ucztcbiAgICB2YXIgZnJMYXlvdXRNYW5hZ2VyID0gbmV3IGZvb2dyYXBoLkZvcmNlRGlyZWN0ZWRWZXJ0ZXhMYXlvdXQoIGxXaWR0aCwgbEhlaWdodCwgaXRlcmF0aW9ucywgZmFsc2UsIGxNaW5EaXN0ICk7XG5cbiAgICBmckxheW91dE1hbmFnZXIuY2FsbGJhY2sgPSBmdW5jdGlvbigpe1xuICAgICAgc2F2ZVBvc2l0aW9ucygpO1xuICAgICAgbWVzc2FnZVBvc2l0aW9ucygpO1xuICAgIH07XG5cbiAgICBmckxheW91dE1hbmFnZXIubGF5b3V0KCBmcmcgKTtcblxuICAgIHNhdmVQb3NpdGlvbnMoKTtcbiAgICBtZXNzYWdlUG9zaXRpb25zKCk7XG5cbiAgICAvKlxuICAgICAqIFNFQ09ORCBTVEVQOiBUaWRpbmcgdXAgb2YgdGhlIGdyYXBoLlxuICAgICAqXG4gICAgICogV2UgdXNlIHRoZSBtZXRob2QgZGVzY3JpYmVkIGJ5IEdhbnNuZXIgYW5kIE5vcnRoLCBiYXNlZCBvbiBWb3Jvbm9pXG4gICAgICogZGlhZ3JhbXMuXG4gICAgICpcbiAgICAgKiBSZWY6IGRvaToxMC4xMDA3LzMtNTQwLTM3NjIzLTJfMjhcbiAgICAgKi9cblxuICAgIC8vIFdlIGNhbGN1bGF0ZSB0aGUgVm9yb25vaSBkaWFncmFtIGRvciB0aGUgcG9zaXRpb24gb2YgdGhlIG5vZGVzXG4gICAgdmFyIHZvcm9ub2kgPSBuZXcgVm9yb25vaSgpO1xuICAgIHZhciBiYm94ID0ge1xuICAgICAgeGw6IDAsXG4gICAgICB4cjogbFdpZHRoLFxuICAgICAgeXQ6IDAsXG4gICAgICB5YjogbEhlaWdodFxuICAgIH07XG4gICAgdmFyIHZTaXRlcyA9IFtdO1xuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgZnYubGVuZ3RoOyArK2kgKSB7XG4gICAgICB2U2l0ZXNbIGZ2WyBpIF0ubGFiZWwgXSA9IGZ2WyBpIF07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tNaW5EaXN0KCBlZSApIHtcbiAgICAgIHZhciBpbmZyYWN0aW9ucyA9IDA7XG4gICAgICAvLyBUaGVuIHdlIGNoZWNrIGlmIHRoZSBtaW5pbXVtIGRpc3RhbmNlIGlzIHNhdGlzZmllZFxuICAgICAgZm9yKCB2YXIgZWVpID0gMDsgZWVpIDwgZWUubGVuZ3RoOyArK2VlaSApIHtcbiAgICAgICAgdmFyIGUgPSBlZVsgZWVpIF07XG4gICAgICAgIGlmKCAoIGUubFNpdGUgIT0gbnVsbCApICYmICggZS5yU2l0ZSAhPSBudWxsICkgJiYgc2l0ZXNEaXN0YW5jZSggZS5sU2l0ZSwgZS5yU2l0ZSApIDwgbE1pbkRpc3QgKSB7XG4gICAgICAgICAgKytpbmZyYWN0aW9ucztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGluZnJhY3Rpb25zO1xuICAgIH1cblxuICAgIHZhciBkaWFncmFtID0gdm9yb25vaS5jb21wdXRlKCBmdiwgYmJveCApO1xuXG4gICAgLy8gVGhlbiB3ZSByZXBvc2l0aW9uIHRoZSBub2RlcyBhdCB0aGUgY2VudHJvaWQgb2YgdGhlaXIgVm9yb25vaSBjZWxsc1xuICAgIHZhciBjZWxscyA9IGRpYWdyYW0uY2VsbHM7XG4gICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7ICsraSApIHtcbiAgICAgIHZhciBjZWxsID0gY2VsbHNbIGkgXTtcbiAgICAgIHZhciBzaXRlID0gY2VsbC5zaXRlO1xuICAgICAgdmFyIGNlbnRyb2lkID0gY2VsbENlbnRyb2lkKCBjZWxsICk7XG4gICAgICB2YXIgY3VycnYgPSB2U2l0ZXNbIHNpdGUubGFiZWwgXTtcbiAgICAgIGN1cnJ2LnggPSBjZW50cm9pZC54O1xuICAgICAgY3VycnYueSA9IGNlbnRyb2lkLnk7XG4gICAgfVxuXG4gICAgaWYoIGxFeHBGYWN0IDwgMC4wICkge1xuICAgICAgLy8gQ2FsY3VsYXRlcyB0aGUgZXhwYW5kaW5nIGZhY3RvclxuICAgICAgbEV4cEZhY3QgPSBNYXRoLm1heCggMC4wNSwgTWF0aC5taW4oIDAuMTAsIGxNaW5EaXN0IC8gTWF0aC5zcXJ0KCAoIGxXaWR0aCAqIGxIZWlnaHQgKSAvIGZ2Lmxlbmd0aCApICogMC41ICkgKTtcbiAgICAgIC8vY29uc29sZS5pbmZvKFwiRXhwYW5kaW5nIGZhY3RvciBpcyBcIiArIChvcHRpb25zLmV4cGFuZGluZ0ZhY3RvciAqIDEwMC4wKSArIFwiJVwiKTtcbiAgICB9XG5cbiAgICB2YXIgcHJldkluZnJhY3Rpb25zID0gY2hlY2tNaW5EaXN0KCBkaWFncmFtLmVkZ2VzICk7XG4gICAgLy9jb25zb2xlLmluZm8oXCJJbml0aWFsIGluZnJhY3Rpb25zIFwiICsgcHJldkluZnJhY3Rpb25zKTtcblxuICAgIHZhciBiU3RvcCA9ICggcHJldkluZnJhY3Rpb25zIDw9IDAgKTtcblxuICAgIHZhciB2b3Jvbm9pSXRlcmF0aW9uID0gMDtcbiAgICB2YXIgZXhwYW5kSXRlcmF0aW9uID0gMDtcblxuICAgIC8vIHZhciBpbml0V2lkdGggPSBsV2lkdGg7XG5cbiAgICB3aGlsZSggIWJTdG9wICkge1xuICAgICAgKyt2b3Jvbm9pSXRlcmF0aW9uO1xuICAgICAgZm9yKCB2YXIgaXQgPSAwOyBpdCA8PSA0OyArK2l0ICkge1xuICAgICAgICB2b3Jvbm9pLnJlY3ljbGUoIGRpYWdyYW0gKTtcbiAgICAgICAgZGlhZ3JhbSA9IHZvcm9ub2kuY29tcHV0ZSggZnYsIGJib3ggKTtcblxuICAgICAgICAvLyBUaGVuIHdlIHJlcG9zaXRpb24gdGhlIG5vZGVzIGF0IHRoZSBjZW50cm9pZCBvZiB0aGVpciBWb3Jvbm9pIGNlbGxzXG4gICAgICAgIGNlbGxzID0gZGlhZ3JhbS5jZWxscztcbiAgICAgICAgZm9yKCB2YXIgaSA9IDA7IGkgPCBjZWxscy5sZW5ndGg7ICsraSApIHtcbiAgICAgICAgICB2YXIgY2VsbCA9IGNlbGxzWyBpIF07XG4gICAgICAgICAgdmFyIHNpdGUgPSBjZWxsLnNpdGU7XG4gICAgICAgICAgdmFyIGNlbnRyb2lkID0gY2VsbENlbnRyb2lkKCBjZWxsICk7XG4gICAgICAgICAgdmFyIGN1cnJ2ID0gdlNpdGVzWyBzaXRlLmxhYmVsIF07XG4gICAgICAgICAgY3VycnYueCA9IGNlbnRyb2lkLng7XG4gICAgICAgICAgY3VycnYueSA9IGNlbnRyb2lkLnk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGN1cnJJbmZyYWN0aW9ucyA9IGNoZWNrTWluRGlzdCggZGlhZ3JhbS5lZGdlcyApO1xuICAgICAgLy9jb25zb2xlLmluZm8oXCJDdXJyZW50IGluZnJhY3Rpb25zIFwiICsgY3VyckluZnJhY3Rpb25zKTtcblxuICAgICAgaWYoIGN1cnJJbmZyYWN0aW9ucyA8PSAwICkge1xuICAgICAgICBiU3RvcCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiggY3VyckluZnJhY3Rpb25zID49IHByZXZJbmZyYWN0aW9ucyB8fCB2b3Jvbm9pSXRlcmF0aW9uID49IDQgKSB7XG4gICAgICAgICAgaWYoIGV4cGFuZEl0ZXJhdGlvbiA+PSBsTWF4RXhwSXQgKSB7XG4gICAgICAgICAgICBiU3RvcCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxXaWR0aCArPSBsV2lkdGggKiBsRXhwRmFjdDtcbiAgICAgICAgICAgIGxIZWlnaHQgKz0gbEhlaWdodCAqIGxFeHBGYWN0O1xuICAgICAgICAgICAgYmJveCA9IHtcbiAgICAgICAgICAgICAgeGw6IDAsXG4gICAgICAgICAgICAgIHhyOiBsV2lkdGgsXG4gICAgICAgICAgICAgIHl0OiAwLFxuICAgICAgICAgICAgICB5YjogbEhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICsrZXhwYW5kSXRlcmF0aW9uO1xuICAgICAgICAgICAgdm9yb25vaUl0ZXJhdGlvbiA9IDA7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhcIkV4cGFuZGVkIHRvIChcIit3aWR0aCtcIixcIitoZWlnaHQrXCIpXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcHJldkluZnJhY3Rpb25zID0gY3VyckluZnJhY3Rpb25zO1xuXG4gICAgICBzYXZlUG9zaXRpb25zKCk7XG4gICAgICBtZXNzYWdlUG9zaXRpb25zKCk7XG4gICAgfVxuXG4gICAgc2F2ZVBvc2l0aW9ucygpO1xuICAgIHJldHVybiBwRGF0YTtcblxuICB9ICkudGhlbiggZnVuY3Rpb24oIHBEYXRhICkge1xuICAgIC8vIHZhciBleHBhbmRJdGVyYXRpb24gPSBwRGF0YVsgJ2V4cEl0JyBdO1xuICAgIHZhciBkYXRhVmVydGljZXMgPSBwRGF0YVsgJ3ZlcnRpY2VzJyBdO1xuXG4gICAgc2V0UG9zaXRpb25zKCBwRGF0YSApO1xuXG4gICAgLy8gR2V0IGVuZCB0aW1lXG4gICAgdmFyIHN0YXJ0VGltZSA9IHBEYXRhWyAnc3RhcnRUaW1lJyBdO1xuICAgIHZhciBlbmRUaW1lID0gbmV3IERhdGUoKTtcbiAgICBjb25zb2xlLmluZm8oIFwiTGF5b3V0IG9uIFwiICsgZGF0YVZlcnRpY2VzLmxlbmd0aCArIFwiIG5vZGVzIHRvb2sgXCIgKyAoIGVuZFRpbWUgLSBzdGFydFRpbWUgKSArIFwiIG1zXCIgKTtcblxuICAgIGxheW91dC5vbmUoIFwibGF5b3V0c3RvcFwiLCBvcHRpb25zLnN0b3AgKTtcblxuICAgIGlmKCAhb3B0aW9ucy5hbmltYXRlICl7XG4gICAgICBsYXlvdXQudHJpZ2dlciggXCJsYXlvdXRyZWFkeVwiICk7XG4gICAgfVxuXG4gICAgbGF5b3V0LnRyaWdnZXIoIFwibGF5b3V0c3RvcFwiICk7XG5cbiAgICB0MS5zdG9wKCk7XG4gIH0gKTtcblxuXG4gIHJldHVybiB0aGlzO1xufTsgLy8gcnVuXG5cblNwcmVhZExheW91dC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCl7XG4gIGlmKCB0aGlzLnRocmVhZCApe1xuICAgIHRoaXMudGhyZWFkLnN0b3AoKTtcbiAgfVxuXG4gIHRoaXMudHJpZ2dlcignbGF5b3V0c3RvcCcpO1xufTtcblxuU3ByZWFkTGF5b3V0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgaWYoIHRoaXMudGhyZWFkICl7XG4gICAgdGhpcy50aHJlYWQuc3RvcCgpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldCggY3l0b3NjYXBlICl7XG4gIFRocmVhZCA9IGN5dG9zY2FwZS5UaHJlYWQ7XG5cbiAgcmV0dXJuIFNwcmVhZExheW91dDtcbn07XG4iLCIvKiFcbkNvcHlyaWdodCAoQykgMjAxMC0yMDEzIFJheW1vbmQgSGlsbDogaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pXG5NSVQgTGljZW5zZTogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9MSUNFTlNFLm1kXG4qL1xuLypcbkF1dGhvcjogUmF5bW9uZCBIaWxsIChyaGlsbEByYXltb25kaGlsbC5uZXQpXG5Db250cmlidXRvcjogSmVzc2UgTW9yZ2FuIChtb3JnYWplbEBnbWFpbC5jb20pXG5GaWxlOiByaGlsbC12b3Jvbm9pLWNvcmUuanNcblZlcnNpb246IDAuOThcbkRhdGU6IEphbnVhcnkgMjEsIDIwMTNcbkRlc2NyaXB0aW9uOiBUaGlzIGlzIG15IHBlcnNvbmFsIEphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2ZcblN0ZXZlbiBGb3J0dW5lJ3MgYWxnb3JpdGhtIHRvIGNvbXB1dGUgVm9yb25vaSBkaWFncmFtcy5cblxuTGljZW5zZTogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9MSUNFTlNFLm1kXG5DcmVkaXRzOiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2dvcmhpbGwvSmF2YXNjcmlwdC1Wb3Jvbm9pL0NSRURJVFMubWRcbkhpc3Rvcnk6IFNlZSBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvQ0hBTkdFTE9HLm1kXG5cbiMjIFVzYWdlOlxuXG4gIHZhciBzaXRlcyA9IFt7eDozMDAseTozMDB9LCB7eDoxMDAseToxMDB9LCB7eDoyMDAseTo1MDB9LCB7eDoyNTAseTo0NTB9LCB7eDo2MDAseToxNTB9XTtcbiAgLy8geGwsIHhyIG1lYW5zIHggbGVmdCwgeCByaWdodFxuICAvLyB5dCwgeWIgbWVhbnMgeSB0b3AsIHkgYm90dG9tXG4gIHZhciBiYm94ID0ge3hsOjAsIHhyOjgwMCwgeXQ6MCwgeWI6NjAwfTtcbiAgdmFyIHZvcm9ub2kgPSBuZXcgVm9yb25vaSgpO1xuICAvLyBwYXNzIGFuIG9iamVjdCB3aGljaCBleGhpYml0cyB4bCwgeHIsIHl0LCB5YiBwcm9wZXJ0aWVzLiBUaGUgYm91bmRpbmdcbiAgLy8gYm94IHdpbGwgYmUgdXNlZCB0byBjb25uZWN0IHVuYm91bmQgZWRnZXMsIGFuZCB0byBjbG9zZSBvcGVuIGNlbGxzXG4gIHJlc3VsdCA9IHZvcm9ub2kuY29tcHV0ZShzaXRlcywgYmJveCk7XG4gIC8vIHJlbmRlciwgZnVydGhlciBhbmFseXplLCBldGMuXG5cblJldHVybiB2YWx1ZTpcbiAgQW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXG4gIHJlc3VsdC52ZXJ0aWNlcyA9IGFuIGFycmF5IG9mIHVub3JkZXJlZCwgdW5pcXVlIFZvcm9ub2kuVmVydGV4IG9iamVjdHMgbWFraW5nXG4gICAgdXAgdGhlIFZvcm9ub2kgZGlhZ3JhbS5cbiAgcmVzdWx0LmVkZ2VzID0gYW4gYXJyYXkgb2YgdW5vcmRlcmVkLCB1bmlxdWUgVm9yb25vaS5FZGdlIG9iamVjdHMgbWFraW5nIHVwXG4gICAgdGhlIFZvcm9ub2kgZGlhZ3JhbS5cbiAgcmVzdWx0LmNlbGxzID0gYW4gYXJyYXkgb2YgVm9yb25vaS5DZWxsIG9iamVjdCBtYWtpbmcgdXAgdGhlIFZvcm9ub2kgZGlhZ3JhbS5cbiAgICBBIENlbGwgb2JqZWN0IG1pZ2h0IGhhdmUgYW4gZW1wdHkgYXJyYXkgb2YgaGFsZmVkZ2VzLCBtZWFuaW5nIG5vIFZvcm9ub2lcbiAgICBjZWxsIGNvdWxkIGJlIGNvbXB1dGVkIGZvciBhIHBhcnRpY3VsYXIgY2VsbC5cbiAgcmVzdWx0LmV4ZWNUaW1lID0gdGhlIHRpbWUgaXQgdG9vayB0byBjb21wdXRlIHRoZSBWb3Jvbm9pIGRpYWdyYW0sIGluXG4gICAgbWlsbGlzZWNvbmRzLlxuXG5Wb3Jvbm9pLlZlcnRleCBvYmplY3Q6XG4gIHg6IFRoZSB4IHBvc2l0aW9uIG9mIHRoZSB2ZXJ0ZXguXG4gIHk6IFRoZSB5IHBvc2l0aW9uIG9mIHRoZSB2ZXJ0ZXguXG5cblZvcm9ub2kuRWRnZSBvYmplY3Q6XG4gIGxTaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBhdCB0aGUgbGVmdCBvZiB0aGlzIFZvcm9ub2kuRWRnZSBvYmplY3QuXG4gIHJTaXRlOiB0aGUgVm9yb25vaSBzaXRlIG9iamVjdCBhdCB0aGUgcmlnaHQgb2YgdGhpcyBWb3Jvbm9pLkVkZ2Ugb2JqZWN0IChjYW5cbiAgICBiZSBudWxsKS5cbiAgdmE6IGFuIG9iamVjdCB3aXRoIGFuICd4JyBhbmQgYSAneScgcHJvcGVydHkgZGVmaW5pbmcgdGhlIHN0YXJ0IHBvaW50XG4gICAgKHJlbGF0aXZlIHRvIHRoZSBWb3Jvbm9pIHNpdGUgb24gdGhlIGxlZnQpIG9mIHRoaXMgVm9yb25vaS5FZGdlIG9iamVjdC5cbiAgdmI6IGFuIG9iamVjdCB3aXRoIGFuICd4JyBhbmQgYSAneScgcHJvcGVydHkgZGVmaW5pbmcgdGhlIGVuZCBwb2ludFxuICAgIChyZWxhdGl2ZSB0byBWb3Jvbm9pIHNpdGUgb24gdGhlIGxlZnQpIG9mIHRoaXMgVm9yb25vaS5FZGdlIG9iamVjdC5cblxuICBGb3IgZWRnZXMgd2hpY2ggYXJlIHVzZWQgdG8gY2xvc2Ugb3BlbiBjZWxscyAodXNpbmcgdGhlIHN1cHBsaWVkIGJvdW5kaW5nXG4gIGJveCksIHRoZSByU2l0ZSBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG5cblZvcm9ub2kuQ2VsbCBvYmplY3Q6XG4gIHNpdGU6IHRoZSBWb3Jvbm9pIHNpdGUgb2JqZWN0IGFzc29jaWF0ZWQgd2l0aCB0aGUgVm9yb25vaSBjZWxsLlxuICBoYWxmZWRnZXM6IGFuIGFycmF5IG9mIFZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0cywgb3JkZXJlZCBjb3VudGVyY2xvY2t3aXNlLFxuICAgIGRlZmluaW5nIHRoZSBwb2x5Z29uIGZvciB0aGlzIFZvcm9ub2kgY2VsbC5cblxuVm9yb25vaS5IYWxmZWRnZSBvYmplY3Q6XG4gIHNpdGU6IHRoZSBWb3Jvbm9pIHNpdGUgb2JqZWN0IG93bmluZyB0aGlzIFZvcm9ub2kuSGFsZmVkZ2Ugb2JqZWN0LlxuICBlZGdlOiBhIHJlZmVyZW5jZSB0byB0aGUgdW5pcXVlIFZvcm9ub2kuRWRnZSBvYmplY3QgdW5kZXJseWluZyB0aGlzXG4gICAgVm9yb25vaS5IYWxmZWRnZSBvYmplY3QuXG4gIGdldFN0YXJ0cG9pbnQoKTogYSBtZXRob2QgcmV0dXJuaW5nIGFuIG9iamVjdCB3aXRoIGFuICd4JyBhbmQgYSAneScgcHJvcGVydHlcbiAgICBmb3IgdGhlIHN0YXJ0IHBvaW50IG9mIHRoaXMgaGFsZmVkZ2UuIEtlZXAgaW4gbWluZCBoYWxmZWRnZXMgYXJlIGFsd2F5c1xuICAgIGNvdW50ZXJjb2Nrd2lzZS5cbiAgZ2V0RW5kcG9pbnQoKTogYSBtZXRob2QgcmV0dXJuaW5nIGFuIG9iamVjdCB3aXRoIGFuICd4JyBhbmQgYSAneScgcHJvcGVydHlcbiAgICBmb3IgdGhlIGVuZCBwb2ludCBvZiB0aGlzIGhhbGZlZGdlLiBLZWVwIGluIG1pbmQgaGFsZmVkZ2VzIGFyZSBhbHdheXNcbiAgICBjb3VudGVyY29ja3dpc2UuXG5cblRPRE86IElkZW50aWZ5IG9wcG9ydHVuaXRpZXMgZm9yIHBlcmZvcm1hbmNlIGltcHJvdmVtZW50LlxuXG5UT0RPOiBMZXQgdGhlIHVzZXIgY2xvc2UgdGhlIFZvcm9ub2kgY2VsbHMsIGRvIG5vdCBkbyBpdCBhdXRvbWF0aWNhbGx5LiBOb3Qgb25seSBsZXRcbiAgICAgIGhpbSBjbG9zZSB0aGUgY2VsbHMsIGJ1dCBhbHNvIGFsbG93IGhpbSB0byBjbG9zZSBtb3JlIHRoYW4gb25jZSB1c2luZyBhIGRpZmZlcmVudFxuICAgICAgYm91bmRpbmcgYm94IGZvciB0aGUgc2FtZSBWb3Jvbm9pIGRpYWdyYW0uXG4qL1xuXG4vKmdsb2JhbCBNYXRoICovXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBWb3Jvbm9pKCkge1xuICAgIHRoaXMudmVydGljZXMgPSBudWxsO1xuICAgIHRoaXMuZWRnZXMgPSBudWxsO1xuICAgIHRoaXMuY2VsbHMgPSBudWxsO1xuICAgIHRoaXMudG9SZWN5Y2xlID0gbnVsbDtcbiAgICB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkID0gW107XG4gICAgdGhpcy5jaXJjbGVFdmVudEp1bmt5YXJkID0gW107XG4gICAgdGhpcy52ZXJ0ZXhKdW5reWFyZCA9IFtdO1xuICAgIHRoaXMuZWRnZUp1bmt5YXJkID0gW107XG4gICAgdGhpcy5jZWxsSnVua3lhcmQgPSBbXTtcbiAgICB9XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5iZWFjaGxpbmUpIHtcbiAgICAgICAgdGhpcy5iZWFjaGxpbmUgPSBuZXcgdGhpcy5SQlRyZWUoKTtcbiAgICAgICAgfVxuICAgIC8vIE1vdmUgbGVmdG92ZXIgYmVhY2hzZWN0aW9ucyB0byB0aGUgYmVhY2hzZWN0aW9uIGp1bmt5YXJkLlxuICAgIGlmICh0aGlzLmJlYWNobGluZS5yb290KSB7XG4gICAgICAgIHZhciBiZWFjaHNlY3Rpb24gPSB0aGlzLmJlYWNobGluZS5nZXRGaXJzdCh0aGlzLmJlYWNobGluZS5yb290KTtcbiAgICAgICAgd2hpbGUgKGJlYWNoc2VjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5iZWFjaHNlY3Rpb25KdW5reWFyZC5wdXNoKGJlYWNoc2VjdGlvbik7IC8vIG1hcmsgZm9yIHJldXNlXG4gICAgICAgICAgICBiZWFjaHNlY3Rpb24gPSBiZWFjaHNlY3Rpb24ucmJOZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgdGhpcy5iZWFjaGxpbmUucm9vdCA9IG51bGw7XG4gICAgaWYgKCF0aGlzLmNpcmNsZUV2ZW50cykge1xuICAgICAgICB0aGlzLmNpcmNsZUV2ZW50cyA9IG5ldyB0aGlzLlJCVHJlZSgpO1xuICAgICAgICB9XG4gICAgdGhpcy5jaXJjbGVFdmVudHMucm9vdCA9IHRoaXMuZmlyc3RDaXJjbGVFdmVudCA9IG51bGw7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IFtdO1xuICAgIHRoaXMuZWRnZXMgPSBbXTtcbiAgICB0aGlzLmNlbGxzID0gW107XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuc3FydCA9IGZ1bmN0aW9uKG4peyByZXR1cm4gTWF0aC5zcXJ0KG4pOyB9O1xuVm9yb25vaS5wcm90b3R5cGUuYWJzID0gZnVuY3Rpb24obil7IHJldHVybiBNYXRoLmFicyhuKTsgfTtcblZvcm9ub2kucHJvdG90eXBlLs61ID0gVm9yb25vaS7OtSA9IDFlLTk7XG5Wb3Jvbm9pLnByb3RvdHlwZS5pbnbOtSA9IFZvcm9ub2kuaW52zrUgPSAxLjAgLyBWb3Jvbm9pLs61O1xuVm9yb25vaS5wcm90b3R5cGUuZXF1YWxXaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIHRoaXMuYWJzKGEtYik8MWUtOTt9O1xuVm9yb25vaS5wcm90b3R5cGUuZ3JlYXRlclRoYW5XaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEtYj4xZS05O307XG5Wb3Jvbm9pLnByb3RvdHlwZS5ncmVhdGVyVGhhbk9yRXF1YWxXaXRoRXBzaWxvbiA9IGZ1bmN0aW9uKGEsYil7cmV0dXJuIGItYTwxZS05O307XG5Wb3Jvbm9pLnByb3RvdHlwZS5sZXNzVGhhbldpdGhFcHNpbG9uID0gZnVuY3Rpb24oYSxiKXtyZXR1cm4gYi1hPjFlLTk7fTtcblZvcm9ub2kucHJvdG90eXBlLmxlc3NUaGFuT3JFcXVhbFdpdGhFcHNpbG9uID0gZnVuY3Rpb24oYSxiKXtyZXR1cm4gYS1iPDFlLTk7fTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSZWQtQmxhY2sgdHJlZSBjb2RlIChiYXNlZCBvbiBDIHZlcnNpb24gb2YgXCJyYnRyZWVcIiBieSBGcmFuY2sgQnVpLUh1dVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2ZidWlodXUvbGlidHJlZS9ibG9iL21hc3Rlci9yYi5jXG5cblZvcm9ub2kucHJvdG90eXBlLlJCVHJlZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucm9vdCA9IG51bGw7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYkluc2VydFN1Y2Nlc3NvciA9IGZ1bmN0aW9uKG5vZGUsIHN1Y2Nlc3Nvcikge1xuICAgIHZhciBwYXJlbnQ7XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgICAgLy8gPj4+IHJoaWxsIDIwMTEtMDUtMjc6IFBlcmZvcm1hbmNlOiBjYWNoZSBwcmV2aW91cy9uZXh0IG5vZGVzXG4gICAgICAgIHN1Y2Nlc3Nvci5yYlByZXZpb3VzID0gbm9kZTtcbiAgICAgICAgc3VjY2Vzc29yLnJiTmV4dCA9IG5vZGUucmJOZXh0O1xuICAgICAgICBpZiAobm9kZS5yYk5leHQpIHtcbiAgICAgICAgICAgIG5vZGUucmJOZXh0LnJiUHJldmlvdXMgPSBzdWNjZXNzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIG5vZGUucmJOZXh0ID0gc3VjY2Vzc29yO1xuICAgICAgICAvLyA8PDxcbiAgICAgICAgaWYgKG5vZGUucmJSaWdodCkge1xuICAgICAgICAgICAgLy8gaW4tcGxhY2UgZXhwYW5zaW9uIG9mIG5vZGUucmJSaWdodC5nZXRGaXJzdCgpO1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgICAgIHdoaWxlIChub2RlLnJiTGVmdCkge25vZGUgPSBub2RlLnJiTGVmdDt9XG4gICAgICAgICAgICBub2RlLnJiTGVmdCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub2RlLnJiUmlnaHQgPSBzdWNjZXNzb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAvLyByaGlsbCAyMDExLTA2LTA3OiBpZiBub2RlIGlzIG51bGwsIHN1Y2Nlc3NvciBtdXN0IGJlIGluc2VydGVkXG4gICAgLy8gdG8gdGhlIGxlZnQtbW9zdCBwYXJ0IG9mIHRoZSB0cmVlXG4gICAgZWxzZSBpZiAodGhpcy5yb290KSB7XG4gICAgICAgIG5vZGUgPSB0aGlzLmdldEZpcnN0KHRoaXMucm9vdCk7XG4gICAgICAgIC8vID4+PiBQZXJmb3JtYW5jZTogY2FjaGUgcHJldmlvdXMvbmV4dCBub2Rlc1xuICAgICAgICBzdWNjZXNzb3IucmJQcmV2aW91cyA9IG51bGw7XG4gICAgICAgIHN1Y2Nlc3Nvci5yYk5leHQgPSBub2RlO1xuICAgICAgICBub2RlLnJiUHJldmlvdXMgPSBzdWNjZXNzb3I7XG4gICAgICAgIC8vIDw8PFxuICAgICAgICBub2RlLnJiTGVmdCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgcGFyZW50ID0gbm9kZTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICAvLyA+Pj4gUGVyZm9ybWFuY2U6IGNhY2hlIHByZXZpb3VzL25leHQgbm9kZXNcbiAgICAgICAgc3VjY2Vzc29yLnJiUHJldmlvdXMgPSBzdWNjZXNzb3IucmJOZXh0ID0gbnVsbDtcbiAgICAgICAgLy8gPDw8XG4gICAgICAgIHRoaXMucm9vdCA9IHN1Y2Nlc3NvcjtcbiAgICAgICAgcGFyZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIHN1Y2Nlc3Nvci5yYkxlZnQgPSBzdWNjZXNzb3IucmJSaWdodCA9IG51bGw7XG4gICAgc3VjY2Vzc29yLnJiUGFyZW50ID0gcGFyZW50O1xuICAgIHN1Y2Nlc3Nvci5yYlJlZCA9IHRydWU7XG4gICAgLy8gRml4dXAgdGhlIG1vZGlmaWVkIHRyZWUgYnkgcmVjb2xvcmluZyBub2RlcyBhbmQgcGVyZm9ybWluZ1xuICAgIC8vIHJvdGF0aW9ucyAoMiBhdCBtb3N0KSBoZW5jZSB0aGUgcmVkLWJsYWNrIHRyZWUgcHJvcGVydGllcyBhcmVcbiAgICAvLyBwcmVzZXJ2ZWQuXG4gICAgdmFyIGdyYW5kcGEsIHVuY2xlO1xuICAgIG5vZGUgPSBzdWNjZXNzb3I7XG4gICAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQucmJSZWQpIHtcbiAgICAgICAgZ3JhbmRwYSA9IHBhcmVudC5yYlBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCA9PT0gZ3JhbmRwYS5yYkxlZnQpIHtcbiAgICAgICAgICAgIHVuY2xlID0gZ3JhbmRwYS5yYlJpZ2h0O1xuICAgICAgICAgICAgaWYgKHVuY2xlICYmIHVuY2xlLnJiUmVkKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50LnJiUmVkID0gdW5jbGUucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBncmFuZHBhLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBub2RlID0gZ3JhbmRwYTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZSA9PT0gcGFyZW50LnJiUmlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50ID0gbm9kZS5yYlBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGdyYW5kcGEucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChncmFuZHBhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdW5jbGUgPSBncmFuZHBhLnJiTGVmdDtcbiAgICAgICAgICAgIGlmICh1bmNsZSAmJiB1bmNsZS5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHVuY2xlLnJiUmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZ3JhbmRwYS5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IGdyYW5kcGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudC5yYkxlZnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZVJpZ2h0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBncmFuZHBhLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnJiUm90YXRlTGVmdChncmFuZHBhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIHBhcmVudCA9IG5vZGUucmJQYXJlbnQ7XG4gICAgICAgIH1cbiAgICB0aGlzLnJvb3QucmJSZWQgPSBmYWxzZTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5SQlRyZWUucHJvdG90eXBlLnJiUmVtb3ZlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAvLyA+Pj4gcmhpbGwgMjAxMS0wNS0yNzogUGVyZm9ybWFuY2U6IGNhY2hlIHByZXZpb3VzL25leHQgbm9kZXNcbiAgICBpZiAobm9kZS5yYk5leHQpIHtcbiAgICAgICAgbm9kZS5yYk5leHQucmJQcmV2aW91cyA9IG5vZGUucmJQcmV2aW91cztcbiAgICAgICAgfVxuICAgIGlmIChub2RlLnJiUHJldmlvdXMpIHtcbiAgICAgICAgbm9kZS5yYlByZXZpb3VzLnJiTmV4dCA9IG5vZGUucmJOZXh0O1xuICAgICAgICB9XG4gICAgbm9kZS5yYk5leHQgPSBub2RlLnJiUHJldmlvdXMgPSBudWxsO1xuICAgIC8vIDw8PFxuICAgIHZhciBwYXJlbnQgPSBub2RlLnJiUGFyZW50LFxuICAgICAgICBsZWZ0ID0gbm9kZS5yYkxlZnQsXG4gICAgICAgIHJpZ2h0ID0gbm9kZS5yYlJpZ2h0LFxuICAgICAgICBuZXh0O1xuICAgIGlmICghbGVmdCkge1xuICAgICAgICBuZXh0ID0gcmlnaHQ7XG4gICAgICAgIH1cbiAgICBlbHNlIGlmICghcmlnaHQpIHtcbiAgICAgICAgbmV4dCA9IGxlZnQ7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbmV4dCA9IHRoaXMuZ2V0Rmlyc3QocmlnaHQpO1xuICAgICAgICB9XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnJiTGVmdCA9PT0gbm9kZSkge1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IG5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJiUmlnaHQgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdCA9IG5leHQ7XG4gICAgICAgIH1cbiAgICAvLyBlbmZvcmNlIHJlZC1ibGFjayBydWxlc1xuICAgIHZhciBpc1JlZDtcbiAgICBpZiAobGVmdCAmJiByaWdodCkge1xuICAgICAgICBpc1JlZCA9IG5leHQucmJSZWQ7XG4gICAgICAgIG5leHQucmJSZWQgPSBub2RlLnJiUmVkO1xuICAgICAgICBuZXh0LnJiTGVmdCA9IGxlZnQ7XG4gICAgICAgIGxlZnQucmJQYXJlbnQgPSBuZXh0O1xuICAgICAgICBpZiAobmV4dCAhPT0gcmlnaHQpIHtcbiAgICAgICAgICAgIHBhcmVudCA9IG5leHQucmJQYXJlbnQ7XG4gICAgICAgICAgICBuZXh0LnJiUGFyZW50ID0gbm9kZS5yYlBhcmVudDtcbiAgICAgICAgICAgIG5vZGUgPSBuZXh0LnJiUmlnaHQ7XG4gICAgICAgICAgICBwYXJlbnQucmJMZWZ0ID0gbm9kZTtcbiAgICAgICAgICAgIG5leHQucmJSaWdodCA9IHJpZ2h0O1xuICAgICAgICAgICAgcmlnaHQucmJQYXJlbnQgPSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5leHQucmJQYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICBwYXJlbnQgPSBuZXh0O1xuICAgICAgICAgICAgbm9kZSA9IG5leHQucmJSaWdodDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpc1JlZCA9IG5vZGUucmJSZWQ7XG4gICAgICAgIG5vZGUgPSBuZXh0O1xuICAgICAgICB9XG4gICAgLy8gJ25vZGUnIGlzIG5vdyB0aGUgc29sZSBzdWNjZXNzb3IncyBjaGlsZCBhbmQgJ3BhcmVudCcgaXRzXG4gICAgLy8gbmV3IHBhcmVudCAoc2luY2UgdGhlIHN1Y2Nlc3NvciBjYW4gaGF2ZSBiZWVuIG1vdmVkKVxuICAgIGlmIChub2RlKSB7XG4gICAgICAgIG5vZGUucmJQYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIH1cbiAgICAvLyB0aGUgJ2Vhc3knIGNhc2VzXG4gICAgaWYgKGlzUmVkKSB7cmV0dXJuO31cbiAgICBpZiAobm9kZSAmJiBub2RlLnJiUmVkKSB7XG4gICAgICAgIG5vZGUucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgLy8gdGhlIG90aGVyIGNhc2VzXG4gICAgdmFyIHNpYmxpbmc7XG4gICAgZG8ge1xuICAgICAgICBpZiAobm9kZSA9PT0gdGhpcy5yb290KSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUgPT09IHBhcmVudC5yYkxlZnQpIHtcbiAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJSaWdodDtcbiAgICAgICAgICAgIGlmIChzaWJsaW5nLnJiUmVkKSB7XG4gICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQocGFyZW50KTtcbiAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiUmlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChzaWJsaW5nLnJiTGVmdCAmJiBzaWJsaW5nLnJiTGVmdC5yYlJlZCkgfHwgKHNpYmxpbmcucmJSaWdodCAmJiBzaWJsaW5nLnJiUmlnaHQucmJSZWQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaWJsaW5nLnJiUmlnaHQgfHwgIXNpYmxpbmcucmJSaWdodC5yYlJlZCkge1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiTGVmdC5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZVJpZ2h0KHNpYmxpbmcpO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50LnJiUmlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gcGFyZW50LnJiUmVkO1xuICAgICAgICAgICAgICAgIHBhcmVudC5yYlJlZCA9IHNpYmxpbmcucmJSaWdodC5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVMZWZ0KHBhcmVudCk7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMucm9vdDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2libGluZyA9IHBhcmVudC5yYkxlZnQ7XG4gICAgICAgICAgICBpZiAoc2libGluZy5yYlJlZCkge1xuICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJMZWZ0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoc2libGluZy5yYkxlZnQgJiYgc2libGluZy5yYkxlZnQucmJSZWQpIHx8IChzaWJsaW5nLnJiUmlnaHQgJiYgc2libGluZy5yYlJpZ2h0LnJiUmVkKSkge1xuICAgICAgICAgICAgICAgIGlmICghc2libGluZy5yYkxlZnQgfHwgIXNpYmxpbmcucmJMZWZ0LnJiUmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmcucmJSaWdodC5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yYlJvdGF0ZUxlZnQoc2libGluZyk7XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmcgPSBwYXJlbnQucmJMZWZ0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2libGluZy5yYlJlZCA9IHBhcmVudC5yYlJlZDtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmJSZWQgPSBzaWJsaW5nLnJiTGVmdC5yYlJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMucmJSb3RhdGVSaWdodChwYXJlbnQpO1xuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBzaWJsaW5nLnJiUmVkID0gdHJ1ZTtcbiAgICAgICAgbm9kZSA9IHBhcmVudDtcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnJiUGFyZW50O1xuICAgIH0gd2hpbGUgKCFub2RlLnJiUmVkKTtcbiAgICBpZiAobm9kZSkge25vZGUucmJSZWQgPSBmYWxzZTt9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5yYlJvdGF0ZUxlZnQgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgdmFyIHAgPSBub2RlLFxuICAgICAgICBxID0gbm9kZS5yYlJpZ2h0LCAvLyBjYW4ndCBiZSBudWxsXG4gICAgICAgIHBhcmVudCA9IHAucmJQYXJlbnQ7XG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50LnJiTGVmdCA9PT0gcCkge1xuICAgICAgICAgICAgcGFyZW50LnJiTGVmdCA9IHE7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJiUmlnaHQgPSBxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucm9vdCA9IHE7XG4gICAgICAgIH1cbiAgICBxLnJiUGFyZW50ID0gcGFyZW50O1xuICAgIHAucmJQYXJlbnQgPSBxO1xuICAgIHAucmJSaWdodCA9IHEucmJMZWZ0O1xuICAgIGlmIChwLnJiUmlnaHQpIHtcbiAgICAgICAgcC5yYlJpZ2h0LnJiUGFyZW50ID0gcDtcbiAgICAgICAgfVxuICAgIHEucmJMZWZ0ID0gcDtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5SQlRyZWUucHJvdG90eXBlLnJiUm90YXRlUmlnaHQgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgdmFyIHAgPSBub2RlLFxuICAgICAgICBxID0gbm9kZS5yYkxlZnQsIC8vIGNhbid0IGJlIG51bGxcbiAgICAgICAgcGFyZW50ID0gcC5yYlBhcmVudDtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGlmIChwYXJlbnQucmJMZWZ0ID09PSBwKSB7XG4gICAgICAgICAgICBwYXJlbnQucmJMZWZ0ID0gcTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQucmJSaWdodCA9IHE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5yb290ID0gcTtcbiAgICAgICAgfVxuICAgIHEucmJQYXJlbnQgPSBwYXJlbnQ7XG4gICAgcC5yYlBhcmVudCA9IHE7XG4gICAgcC5yYkxlZnQgPSBxLnJiUmlnaHQ7XG4gICAgaWYgKHAucmJMZWZ0KSB7XG4gICAgICAgIHAucmJMZWZ0LnJiUGFyZW50ID0gcDtcbiAgICAgICAgfVxuICAgIHEucmJSaWdodCA9IHA7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5nZXRGaXJzdCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICB3aGlsZSAobm9kZS5yYkxlZnQpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUucmJMZWZ0O1xuICAgICAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuUkJUcmVlLnByb3RvdHlwZS5nZXRMYXN0ID0gZnVuY3Rpb24obm9kZSkge1xuICAgIHdoaWxlIChub2RlLnJiUmlnaHQpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgfVxuICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGlhZ3JhbSBtZXRob2RzXG5cblZvcm9ub2kucHJvdG90eXBlLkRpYWdyYW0gPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgdGhpcy5zaXRlID0gc2l0ZTtcbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENlbGwgbWV0aG9kc1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5DZWxsID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IHNpdGU7XG4gICAgdGhpcy5oYWxmZWRnZXMgPSBbXTtcbiAgICB0aGlzLmNsb3NlTWUgPSBmYWxzZTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5DZWxsLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHRoaXMuc2l0ZSA9IHNpdGU7XG4gICAgdGhpcy5oYWxmZWRnZXMgPSBbXTtcbiAgICB0aGlzLmNsb3NlTWUgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVDZWxsID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHZhciBjZWxsID0gdGhpcy5jZWxsSnVua3lhcmQucG9wKCk7XG4gICAgaWYgKCBjZWxsICkge1xuICAgICAgICByZXR1cm4gY2VsbC5pbml0KHNpdGUpO1xuICAgICAgICB9XG4gICAgcmV0dXJuIG5ldyB0aGlzLkNlbGwoc2l0ZSk7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUucHJlcGFyZUhhbGZlZGdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoYWxmZWRnZXMgPSB0aGlzLmhhbGZlZGdlcyxcbiAgICAgICAgaUhhbGZlZGdlID0gaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgZWRnZTtcbiAgICAvLyBnZXQgcmlkIG9mIHVudXNlZCBoYWxmZWRnZXNcbiAgICAvLyByaGlsbCAyMDExLTA1LTI3OiBLZWVwIGl0IHNpbXBsZSwgbm8gcG9pbnQgaGVyZSBpbiB0cnlpbmdcbiAgICAvLyB0byBiZSBmYW5jeTogZGFuZ2xpbmcgZWRnZXMgYXJlIGEgdHlwaWNhbGx5IGEgbWlub3JpdHkuXG4gICAgd2hpbGUgKGlIYWxmZWRnZS0tKSB7XG4gICAgICAgIGVkZ2UgPSBoYWxmZWRnZXNbaUhhbGZlZGdlXS5lZGdlO1xuICAgICAgICBpZiAoIWVkZ2UudmIgfHwgIWVkZ2UudmEpIHtcbiAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUhhbGZlZGdlLDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAvLyByaGlsbCAyMDExLTA1LTI2OiBJIHRyaWVkIHRvIHVzZSBhIGJpbmFyeSBzZWFyY2ggYXQgaW5zZXJ0aW9uXG4gICAgLy8gdGltZSB0byBrZWVwIHRoZSBhcnJheSBzb3J0ZWQgb24tdGhlLWZseSAoaW4gQ2VsbC5hZGRIYWxmZWRnZSgpKS5cbiAgICAvLyBUaGVyZSB3YXMgbm8gcmVhbCBiZW5lZml0cyBpbiBkb2luZyBzbywgcGVyZm9ybWFuY2Ugb25cbiAgICAvLyBGaXJlZm94IDMuNiB3YXMgaW1wcm92ZWQgbWFyZ2luYWxseSwgd2hpbGUgcGVyZm9ybWFuY2Ugb25cbiAgICAvLyBPcGVyYSAxMSB3YXMgcGVuYWxpemVkIG1hcmdpbmFsbHkuXG4gICAgaGFsZmVkZ2VzLnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYi5hbmdsZS1hLmFuZ2xlO30pO1xuICAgIHJldHVybiBoYWxmZWRnZXMubGVuZ3RoO1xuICAgIH07XG5cbi8vIFJldHVybiBhIGxpc3Qgb2YgdGhlIG5laWdoYm9yIElkc1xuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUuZ2V0TmVpZ2hib3JJZHMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmVpZ2hib3JzID0gW10sXG4gICAgICAgIGlIYWxmZWRnZSA9IHRoaXMuaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgZWRnZTtcbiAgICB3aGlsZSAoaUhhbGZlZGdlLS0pe1xuICAgICAgICBlZGdlID0gdGhpcy5oYWxmZWRnZXNbaUhhbGZlZGdlXS5lZGdlO1xuICAgICAgICBpZiAoZWRnZS5sU2l0ZSAhPT0gbnVsbCAmJiBlZGdlLmxTaXRlLnZvcm9ub2lJZCAhPSB0aGlzLnNpdGUudm9yb25vaUlkKSB7XG4gICAgICAgICAgICBuZWlnaGJvcnMucHVzaChlZGdlLmxTaXRlLnZvcm9ub2lJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGVkZ2UuclNpdGUgIT09IG51bGwgJiYgZWRnZS5yU2l0ZS52b3Jvbm9pSWQgIT0gdGhpcy5zaXRlLnZvcm9ub2lJZCl7XG4gICAgICAgICAgICBuZWlnaGJvcnMucHVzaChlZGdlLnJTaXRlLnZvcm9ub2lJZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICByZXR1cm4gbmVpZ2hib3JzO1xuICAgIH07XG5cbi8vIENvbXB1dGUgYm91bmRpbmcgYm94XG4vL1xuVm9yb25vaS5wcm90b3R5cGUuQ2VsbC5wcm90b3R5cGUuZ2V0QmJveCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoYWxmZWRnZXMgPSB0aGlzLmhhbGZlZGdlcyxcbiAgICAgICAgaUhhbGZlZGdlID0gaGFsZmVkZ2VzLmxlbmd0aCxcbiAgICAgICAgeG1pbiA9IEluZmluaXR5LFxuICAgICAgICB5bWluID0gSW5maW5pdHksXG4gICAgICAgIHhtYXggPSAtSW5maW5pdHksXG4gICAgICAgIHltYXggPSAtSW5maW5pdHksXG4gICAgICAgIHYsIHZ4LCB2eTtcbiAgICB3aGlsZSAoaUhhbGZlZGdlLS0pIHtcbiAgICAgICAgdiA9IGhhbGZlZGdlc1tpSGFsZmVkZ2VdLmdldFN0YXJ0cG9pbnQoKTtcbiAgICAgICAgdnggPSB2Lng7XG4gICAgICAgIHZ5ID0gdi55O1xuICAgICAgICBpZiAodnggPCB4bWluKSB7eG1pbiA9IHZ4O31cbiAgICAgICAgaWYgKHZ5IDwgeW1pbikge3ltaW4gPSB2eTt9XG4gICAgICAgIGlmICh2eCA+IHhtYXgpIHt4bWF4ID0gdng7fVxuICAgICAgICBpZiAodnkgPiB5bWF4KSB7eW1heCA9IHZ5O31cbiAgICAgICAgLy8gd2UgZG9udCBuZWVkIHRvIHRha2UgaW50byBhY2NvdW50IGVuZCBwb2ludCxcbiAgICAgICAgLy8gc2luY2UgZWFjaCBlbmQgcG9pbnQgbWF0Y2hlcyBhIHN0YXJ0IHBvaW50XG4gICAgICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB4OiB4bWluLFxuICAgICAgICB5OiB5bWluLFxuICAgICAgICB3aWR0aDogeG1heC14bWluLFxuICAgICAgICBoZWlnaHQ6IHltYXgteW1pblxuICAgICAgICB9O1xuICAgIH07XG5cbi8vIFJldHVybiB3aGV0aGVyIGEgcG9pbnQgaXMgaW5zaWRlLCBvbiwgb3Igb3V0c2lkZSB0aGUgY2VsbDpcbi8vICAgLTE6IHBvaW50IGlzIG91dHNpZGUgdGhlIHBlcmltZXRlciBvZiB0aGUgY2VsbFxuLy8gICAgMDogcG9pbnQgaXMgb24gdGhlIHBlcmltZXRlciBvZiB0aGUgY2VsbFxuLy8gICAgMTogcG9pbnQgaXMgaW5zaWRlIHRoZSBwZXJpbWV0ZXIgb2YgdGhlIGNlbGxcbi8vXG5Wb3Jvbm9pLnByb3RvdHlwZS5DZWxsLnByb3RvdHlwZS5wb2ludEludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAvLyBDaGVjayBpZiBwb2ludCBpbiBwb2x5Z29uLiBTaW5jZSBhbGwgcG9seWdvbnMgb2YgYSBWb3Jvbm9pXG4gICAgLy8gZGlhZ3JhbSBhcmUgY29udmV4LCB0aGVuOlxuICAgIC8vIGh0dHA6Ly9wYXVsYm91cmtlLm5ldC9nZW9tZXRyeS9wb2x5Z29ubWVzaC9cbiAgICAvLyBTb2x1dGlvbiAzICgyRCk6XG4gICAgLy8gICBcIklmIHRoZSBwb2x5Z29uIGlzIGNvbnZleCB0aGVuIG9uZSBjYW4gY29uc2lkZXIgdGhlIHBvbHlnb25cbiAgICAvLyAgIFwiYXMgYSAncGF0aCcgZnJvbSB0aGUgZmlyc3QgdmVydGV4LiBBIHBvaW50IGlzIG9uIHRoZSBpbnRlcmlvclxuICAgIC8vICAgXCJvZiB0aGlzIHBvbHlnb25zIGlmIGl0IGlzIGFsd2F5cyBvbiB0aGUgc2FtZSBzaWRlIG9mIGFsbCB0aGVcbiAgICAvLyAgIFwibGluZSBzZWdtZW50cyBtYWtpbmcgdXAgdGhlIHBhdGguIC4uLlxuICAgIC8vICAgXCIoeSAtIHkwKSAoeDEgLSB4MCkgLSAoeCAtIHgwKSAoeTEgLSB5MClcbiAgICAvLyAgIFwiaWYgaXQgaXMgbGVzcyB0aGFuIDAgdGhlbiBQIGlzIHRvIHRoZSByaWdodCBvZiB0aGUgbGluZSBzZWdtZW50LFxuICAgIC8vICAgXCJpZiBncmVhdGVyIHRoYW4gMCBpdCBpcyB0byB0aGUgbGVmdCwgaWYgZXF1YWwgdG8gMCB0aGVuIGl0IGxpZXNcbiAgICAvLyAgIFwib24gdGhlIGxpbmUgc2VnbWVudFwiXG4gICAgdmFyIGhhbGZlZGdlcyA9IHRoaXMuaGFsZmVkZ2VzLFxuICAgICAgICBpSGFsZmVkZ2UgPSBoYWxmZWRnZXMubGVuZ3RoLFxuICAgICAgICBoYWxmZWRnZSxcbiAgICAgICAgcDAsIHAxLCByO1xuICAgIHdoaWxlIChpSGFsZmVkZ2UtLSkge1xuICAgICAgICBoYWxmZWRnZSA9IGhhbGZlZGdlc1tpSGFsZmVkZ2VdO1xuICAgICAgICBwMCA9IGhhbGZlZGdlLmdldFN0YXJ0cG9pbnQoKTtcbiAgICAgICAgcDEgPSBoYWxmZWRnZS5nZXRFbmRwb2ludCgpO1xuICAgICAgICByID0gKHktcDAueSkqKHAxLngtcDAueCktKHgtcDAueCkqKHAxLnktcDAueSk7XG4gICAgICAgIGlmICghcikge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmIChyID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgcmV0dXJuIDE7XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFZGdlIG1ldGhvZHNcbi8vXG5cblZvcm9ub2kucHJvdG90eXBlLlZlcnRleCA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuRWRnZSA9IGZ1bmN0aW9uKGxTaXRlLCByU2l0ZSkge1xuICAgIHRoaXMubFNpdGUgPSBsU2l0ZTtcbiAgICB0aGlzLnJTaXRlID0gclNpdGU7XG4gICAgdGhpcy52YSA9IHRoaXMudmIgPSBudWxsO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkhhbGZlZGdlID0gZnVuY3Rpb24oZWRnZSwgbFNpdGUsIHJTaXRlKSB7XG4gICAgdGhpcy5zaXRlID0gbFNpdGU7XG4gICAgdGhpcy5lZGdlID0gZWRnZTtcbiAgICAvLyAnYW5nbGUnIGlzIGEgdmFsdWUgdG8gYmUgdXNlZCBmb3IgcHJvcGVybHkgc29ydGluZyB0aGVcbiAgICAvLyBoYWxmc2VnbWVudHMgY291bnRlcmNsb2Nrd2lzZS4gQnkgY29udmVudGlvbiwgd2Ugd2lsbFxuICAgIC8vIHVzZSB0aGUgYW5nbGUgb2YgdGhlIGxpbmUgZGVmaW5lZCBieSB0aGUgJ3NpdGUgdG8gdGhlIGxlZnQnXG4gICAgLy8gdG8gdGhlICdzaXRlIHRvIHRoZSByaWdodCcuXG4gICAgLy8gSG93ZXZlciwgYm9yZGVyIGVkZ2VzIGhhdmUgbm8gJ3NpdGUgdG8gdGhlIHJpZ2h0JzogdGh1cyB3ZVxuICAgIC8vIHVzZSB0aGUgYW5nbGUgb2YgbGluZSBwZXJwZW5kaWN1bGFyIHRvIHRoZSBoYWxmc2VnbWVudCAodGhlXG4gICAgLy8gZWRnZSBzaG91bGQgaGF2ZSBib3RoIGVuZCBwb2ludHMgZGVmaW5lZCBpbiBzdWNoIGNhc2UuKVxuICAgIGlmIChyU2l0ZSkge1xuICAgICAgICB0aGlzLmFuZ2xlID0gTWF0aC5hdGFuMihyU2l0ZS55LWxTaXRlLnksIHJTaXRlLngtbFNpdGUueCk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIHZhID0gZWRnZS52YSxcbiAgICAgICAgICAgIHZiID0gZWRnZS52YjtcbiAgICAgICAgLy8gcmhpbGwgMjAxMS0wNS0zMTogdXNlZCB0byBjYWxsIGdldFN0YXJ0cG9pbnQoKS9nZXRFbmRwb2ludCgpLFxuICAgICAgICAvLyBidXQgZm9yIHBlcmZvcm1hbmNlIHB1cnBvc2UsIHRoZXNlIGFyZSBleHBhbmRlZCBpbiBwbGFjZSBoZXJlLlxuICAgICAgICB0aGlzLmFuZ2xlID0gZWRnZS5sU2l0ZSA9PT0gbFNpdGUgP1xuICAgICAgICAgICAgTWF0aC5hdGFuMih2Yi54LXZhLngsIHZhLnktdmIueSkgOlxuICAgICAgICAgICAgTWF0aC5hdGFuMih2YS54LXZiLngsIHZiLnktdmEueSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVIYWxmZWRnZSA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSkge1xuICAgIHJldHVybiBuZXcgdGhpcy5IYWxmZWRnZShlZGdlLCBsU2l0ZSwgclNpdGUpO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkhhbGZlZGdlLnByb3RvdHlwZS5nZXRTdGFydHBvaW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZWRnZS5sU2l0ZSA9PT0gdGhpcy5zaXRlID8gdGhpcy5lZGdlLnZhIDogdGhpcy5lZGdlLnZiO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLkhhbGZlZGdlLnByb3RvdHlwZS5nZXRFbmRwb2ludCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmVkZ2UubFNpdGUgPT09IHRoaXMuc2l0ZSA/IHRoaXMuZWRnZS52YiA6IHRoaXMuZWRnZS52YTtcbiAgICB9O1xuXG5cblxuLy8gdGhpcyBjcmVhdGUgYW5kIGFkZCBhIHZlcnRleCB0byB0aGUgaW50ZXJuYWwgY29sbGVjdGlvblxuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVWZXJ0ZXggPSBmdW5jdGlvbih4LCB5KSB7XG4gICAgdmFyIHYgPSB0aGlzLnZlcnRleEp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICggIXYgKSB7XG4gICAgICAgIHYgPSBuZXcgdGhpcy5WZXJ0ZXgoeCwgeSk7XG4gICAgICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdi54ID0geDtcbiAgICAgICAgdi55ID0geTtcbiAgICAgICAgfVxuICAgIHRoaXMudmVydGljZXMucHVzaCh2KTtcbiAgICByZXR1cm4gdjtcbiAgICB9O1xuXG4vLyB0aGlzIGNyZWF0ZSBhbmQgYWRkIGFuIGVkZ2UgdG8gaW50ZXJuYWwgY29sbGVjdGlvbiwgYW5kIGFsc28gY3JlYXRlXG4vLyB0d28gaGFsZmVkZ2VzIHdoaWNoIGFyZSBhZGRlZCB0byBlYWNoIHNpdGUncyBjb3VudGVyY2xvY2t3aXNlIGFycmF5XG4vLyBvZiBoYWxmZWRnZXMuXG5cblZvcm9ub2kucHJvdG90eXBlLmNyZWF0ZUVkZ2UgPSBmdW5jdGlvbihsU2l0ZSwgclNpdGUsIHZhLCB2Yikge1xuICAgIHZhciBlZGdlID0gdGhpcy5lZGdlSnVua3lhcmQucG9wKCk7XG4gICAgaWYgKCAhZWRnZSApIHtcbiAgICAgICAgZWRnZSA9IG5ldyB0aGlzLkVkZ2UobFNpdGUsIHJTaXRlKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlZGdlLmxTaXRlID0gbFNpdGU7XG4gICAgICAgIGVkZ2UuclNpdGUgPSByU2l0ZTtcbiAgICAgICAgZWRnZS52YSA9IGVkZ2UudmIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICB0aGlzLmVkZ2VzLnB1c2goZWRnZSk7XG4gICAgaWYgKHZhKSB7XG4gICAgICAgIHRoaXMuc2V0RWRnZVN0YXJ0cG9pbnQoZWRnZSwgbFNpdGUsIHJTaXRlLCB2YSk7XG4gICAgICAgIH1cbiAgICBpZiAodmIpIHtcbiAgICAgICAgdGhpcy5zZXRFZGdlRW5kcG9pbnQoZWRnZSwgbFNpdGUsIHJTaXRlLCB2Yik7XG4gICAgICAgIH1cbiAgICB0aGlzLmNlbGxzW2xTaXRlLnZvcm9ub2lJZF0uaGFsZmVkZ2VzLnB1c2godGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBsU2l0ZSwgclNpdGUpKTtcbiAgICB0aGlzLmNlbGxzW3JTaXRlLnZvcm9ub2lJZF0uaGFsZmVkZ2VzLnB1c2godGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCByU2l0ZSwgbFNpdGUpKTtcbiAgICByZXR1cm4gZWRnZTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5jcmVhdGVCb3JkZXJFZGdlID0gZnVuY3Rpb24obFNpdGUsIHZhLCB2Yikge1xuICAgIHZhciBlZGdlID0gdGhpcy5lZGdlSnVua3lhcmQucG9wKCk7XG4gICAgaWYgKCAhZWRnZSApIHtcbiAgICAgICAgZWRnZSA9IG5ldyB0aGlzLkVkZ2UobFNpdGUsIG51bGwpO1xuICAgICAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGVkZ2UubFNpdGUgPSBsU2l0ZTtcbiAgICAgICAgZWRnZS5yU2l0ZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICBlZGdlLnZhID0gdmE7XG4gICAgZWRnZS52YiA9IHZiO1xuICAgIHRoaXMuZWRnZXMucHVzaChlZGdlKTtcbiAgICByZXR1cm4gZWRnZTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5zZXRFZGdlU3RhcnRwb2ludCA9IGZ1bmN0aW9uKGVkZ2UsIGxTaXRlLCByU2l0ZSwgdmVydGV4KSB7XG4gICAgaWYgKCFlZGdlLnZhICYmICFlZGdlLnZiKSB7XG4gICAgICAgIGVkZ2UudmEgPSB2ZXJ0ZXg7XG4gICAgICAgIGVkZ2UubFNpdGUgPSBsU2l0ZTtcbiAgICAgICAgZWRnZS5yU2l0ZSA9IHJTaXRlO1xuICAgICAgICB9XG4gICAgZWxzZSBpZiAoZWRnZS5sU2l0ZSA9PT0gclNpdGUpIHtcbiAgICAgICAgZWRnZS52YiA9IHZlcnRleDtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlZGdlLnZhID0gdmVydGV4O1xuICAgICAgICB9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuc2V0RWRnZUVuZHBvaW50ID0gZnVuY3Rpb24oZWRnZSwgbFNpdGUsIHJTaXRlLCB2ZXJ0ZXgpIHtcbiAgICB0aGlzLnNldEVkZ2VTdGFydHBvaW50KGVkZ2UsIHJTaXRlLCBsU2l0ZSwgdmVydGV4KTtcbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEJlYWNobGluZSBtZXRob2RzXG5cbi8vIHJoaWxsIDIwMTEtMDYtMDc6IEZvciBzb21lIHJlYXNvbnMsIHBlcmZvcm1hbmNlIHN1ZmZlcnMgc2lnbmlmaWNhbnRseVxuLy8gd2hlbiBpbnN0YW5jaWF0aW5nIGEgbGl0ZXJhbCBvYmplY3QgaW5zdGVhZCBvZiBhbiBlbXB0eSBjdG9yXG5Wb3Jvbm9pLnByb3RvdHlwZS5CZWFjaHNlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB9O1xuXG4vLyByaGlsbCAyMDExLTA2LTAyOiBBIGxvdCBvZiBCZWFjaHNlY3Rpb24gaW5zdGFuY2lhdGlvbnNcbi8vIG9jY3VyIGR1cmluZyB0aGUgY29tcHV0YXRpb24gb2YgdGhlIFZvcm9ub2kgZGlhZ3JhbSxcbi8vIHNvbWV3aGVyZSBiZXR3ZWVuIHRoZSBudW1iZXIgb2Ygc2l0ZXMgYW5kIHR3aWNlIHRoZVxuLy8gbnVtYmVyIG9mIHNpdGVzLCB3aGlsZSB0aGUgbnVtYmVyIG9mIEJlYWNoc2VjdGlvbnMgb24gdGhlXG4vLyBiZWFjaGxpbmUgYXQgYW55IGdpdmVuIHRpbWUgaXMgY29tcGFyYXRpdmVseSBsb3cuIEZvciB0aGlzXG4vLyByZWFzb24sIHdlIHJldXNlIGFscmVhZHkgY3JlYXRlZCBCZWFjaHNlY3Rpb25zLCBpbiBvcmRlclxuLy8gdG8gYXZvaWQgbmV3IG1lbW9yeSBhbGxvY2F0aW9uLiBUaGlzIHJlc3VsdGVkIGluIGEgbWVhc3VyYWJsZVxuLy8gcGVyZm9ybWFuY2UgZ2Fpbi5cblxuVm9yb25vaS5wcm90b3R5cGUuY3JlYXRlQmVhY2hzZWN0aW9uID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHZhciBiZWFjaHNlY3Rpb24gPSB0aGlzLmJlYWNoc2VjdGlvbkp1bmt5YXJkLnBvcCgpO1xuICAgIGlmICghYmVhY2hzZWN0aW9uKSB7XG4gICAgICAgIGJlYWNoc2VjdGlvbiA9IG5ldyB0aGlzLkJlYWNoc2VjdGlvbigpO1xuICAgICAgICB9XG4gICAgYmVhY2hzZWN0aW9uLnNpdGUgPSBzaXRlO1xuICAgIHJldHVybiBiZWFjaHNlY3Rpb247XG4gICAgfTtcblxuLy8gY2FsY3VsYXRlIHRoZSBsZWZ0IGJyZWFrIHBvaW50IG9mIGEgcGFydGljdWxhciBiZWFjaCBzZWN0aW9uLFxuLy8gZ2l2ZW4gYSBwYXJ0aWN1bGFyIHN3ZWVwIGxpbmVcblZvcm9ub2kucHJvdG90eXBlLmxlZnRCcmVha1BvaW50ID0gZnVuY3Rpb24oYXJjLCBkaXJlY3RyaXgpIHtcbiAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BhcmFib2xhXG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9RdWFkcmF0aWNfZXF1YXRpb25cbiAgICAvLyBoMSA9IHgxLFxuICAgIC8vIGsxID0gKHkxK2RpcmVjdHJpeCkvMixcbiAgICAvLyBoMiA9IHgyLFxuICAgIC8vIGsyID0gKHkyK2RpcmVjdHJpeCkvMixcbiAgICAvLyBwMSA9IGsxLWRpcmVjdHJpeCxcbiAgICAvLyBhMSA9IDEvKDQqcDEpLFxuICAgIC8vIGIxID0gLWgxLygyKnAxKSxcbiAgICAvLyBjMSA9IGgxKmgxLyg0KnAxKStrMSxcbiAgICAvLyBwMiA9IGsyLWRpcmVjdHJpeCxcbiAgICAvLyBhMiA9IDEvKDQqcDIpLFxuICAgIC8vIGIyID0gLWgyLygyKnAyKSxcbiAgICAvLyBjMiA9IGgyKmgyLyg0KnAyKStrMixcbiAgICAvLyB4ID0gKC0oYjItYjEpICsgTWF0aC5zcXJ0KChiMi1iMSkqKGIyLWIxKSAtIDQqKGEyLWExKSooYzItYzEpKSkgLyAoMiooYTItYTEpKVxuICAgIC8vIFdoZW4geDEgYmVjb21lIHRoZSB4LW9yaWdpbjpcbiAgICAvLyBoMSA9IDAsXG4gICAgLy8gazEgPSAoeTErZGlyZWN0cml4KS8yLFxuICAgIC8vIGgyID0geDIteDEsXG4gICAgLy8gazIgPSAoeTIrZGlyZWN0cml4KS8yLFxuICAgIC8vIHAxID0gazEtZGlyZWN0cml4LFxuICAgIC8vIGExID0gMS8oNCpwMSksXG4gICAgLy8gYjEgPSAwLFxuICAgIC8vIGMxID0gazEsXG4gICAgLy8gcDIgPSBrMi1kaXJlY3RyaXgsXG4gICAgLy8gYTIgPSAxLyg0KnAyKSxcbiAgICAvLyBiMiA9IC1oMi8oMipwMiksXG4gICAgLy8gYzIgPSBoMipoMi8oNCpwMikrazIsXG4gICAgLy8geCA9ICgtYjIgKyBNYXRoLnNxcnQoYjIqYjIgLSA0KihhMi1hMSkqKGMyLWsxKSkpIC8gKDIqKGEyLWExKSkgKyB4MVxuXG4gICAgLy8gY2hhbmdlIGNvZGUgYmVsb3cgYXQgeW91ciBvd24gcmlzazogY2FyZSBoYXMgYmVlbiB0YWtlbiB0b1xuICAgIC8vIHJlZHVjZSBlcnJvcnMgZHVlIHRvIGNvbXB1dGVycycgZmluaXRlIGFyaXRobWV0aWMgcHJlY2lzaW9uLlxuICAgIC8vIE1heWJlIGNhbiBzdGlsbCBiZSBpbXByb3ZlZCwgd2lsbCBzZWUgaWYgYW55IG1vcmUgb2YgdGhpc1xuICAgIC8vIGtpbmQgb2YgZXJyb3JzIHBvcCB1cCBhZ2Fpbi5cbiAgICB2YXIgc2l0ZSA9IGFyYy5zaXRlLFxuICAgICAgICByZm9jeCA9IHNpdGUueCxcbiAgICAgICAgcmZvY3kgPSBzaXRlLnksXG4gICAgICAgIHBieTIgPSByZm9jeS1kaXJlY3RyaXg7XG4gICAgLy8gcGFyYWJvbGEgaW4gZGVnZW5lcmF0ZSBjYXNlIHdoZXJlIGZvY3VzIGlzIG9uIGRpcmVjdHJpeFxuICAgIGlmICghcGJ5Mikge1xuICAgICAgICByZXR1cm4gcmZvY3g7XG4gICAgICAgIH1cbiAgICB2YXIgbEFyYyA9IGFyYy5yYlByZXZpb3VzO1xuICAgIGlmICghbEFyYykge1xuICAgICAgICByZXR1cm4gLUluZmluaXR5O1xuICAgICAgICB9XG4gICAgc2l0ZSA9IGxBcmMuc2l0ZTtcbiAgICB2YXIgbGZvY3ggPSBzaXRlLngsXG4gICAgICAgIGxmb2N5ID0gc2l0ZS55LFxuICAgICAgICBwbGJ5MiA9IGxmb2N5LWRpcmVjdHJpeDtcbiAgICAvLyBwYXJhYm9sYSBpbiBkZWdlbmVyYXRlIGNhc2Ugd2hlcmUgZm9jdXMgaXMgb24gZGlyZWN0cml4XG4gICAgaWYgKCFwbGJ5Mikge1xuICAgICAgICByZXR1cm4gbGZvY3g7XG4gICAgICAgIH1cbiAgICB2YXIgaGwgPSBsZm9jeC1yZm9jeCxcbiAgICAgICAgYWJ5MiA9IDEvcGJ5Mi0xL3BsYnkyLFxuICAgICAgICBiID0gaGwvcGxieTI7XG4gICAgaWYgKGFieTIpIHtcbiAgICAgICAgcmV0dXJuICgtYit0aGlzLnNxcnQoYipiLTIqYWJ5MiooaGwqaGwvKC0yKnBsYnkyKS1sZm9jeStwbGJ5Mi8yK3Jmb2N5LXBieTIvMikpKS9hYnkyK3Jmb2N4O1xuICAgICAgICB9XG4gICAgLy8gYm90aCBwYXJhYm9sYXMgaGF2ZSBzYW1lIGRpc3RhbmNlIHRvIGRpcmVjdHJpeCwgdGh1cyBicmVhayBwb2ludCBpcyBtaWR3YXlcbiAgICByZXR1cm4gKHJmb2N4K2xmb2N4KS8yO1xuICAgIH07XG5cbi8vIGNhbGN1bGF0ZSB0aGUgcmlnaHQgYnJlYWsgcG9pbnQgb2YgYSBwYXJ0aWN1bGFyIGJlYWNoIHNlY3Rpb24sXG4vLyBnaXZlbiBhIHBhcnRpY3VsYXIgZGlyZWN0cml4XG5Wb3Jvbm9pLnByb3RvdHlwZS5yaWdodEJyZWFrUG9pbnQgPSBmdW5jdGlvbihhcmMsIGRpcmVjdHJpeCkge1xuICAgIHZhciByQXJjID0gYXJjLnJiTmV4dDtcbiAgICBpZiAockFyYykge1xuICAgICAgICByZXR1cm4gdGhpcy5sZWZ0QnJlYWtQb2ludChyQXJjLCBkaXJlY3RyaXgpO1xuICAgICAgICB9XG4gICAgdmFyIHNpdGUgPSBhcmMuc2l0ZTtcbiAgICByZXR1cm4gc2l0ZS55ID09PSBkaXJlY3RyaXggPyBzaXRlLnggOiBJbmZpbml0eTtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5kZXRhY2hCZWFjaHNlY3Rpb24gPSBmdW5jdGlvbihiZWFjaHNlY3Rpb24pIHtcbiAgICB0aGlzLmRldGFjaENpcmNsZUV2ZW50KGJlYWNoc2VjdGlvbik7IC8vIGRldGFjaCBwb3RlbnRpYWxseSBhdHRhY2hlZCBjaXJjbGUgZXZlbnRcbiAgICB0aGlzLmJlYWNobGluZS5yYlJlbW92ZU5vZGUoYmVhY2hzZWN0aW9uKTsgLy8gcmVtb3ZlIGZyb20gUkItdHJlZVxuICAgIHRoaXMuYmVhY2hzZWN0aW9uSnVua3lhcmQucHVzaChiZWFjaHNlY3Rpb24pOyAvLyBtYXJrIGZvciByZXVzZVxuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLnJlbW92ZUJlYWNoc2VjdGlvbiA9IGZ1bmN0aW9uKGJlYWNoc2VjdGlvbikge1xuICAgIHZhciBjaXJjbGUgPSBiZWFjaHNlY3Rpb24uY2lyY2xlRXZlbnQsXG4gICAgICAgIHggPSBjaXJjbGUueCxcbiAgICAgICAgeSA9IGNpcmNsZS55Y2VudGVyLFxuICAgICAgICB2ZXJ0ZXggPSB0aGlzLmNyZWF0ZVZlcnRleCh4LCB5KSxcbiAgICAgICAgcHJldmlvdXMgPSBiZWFjaHNlY3Rpb24ucmJQcmV2aW91cyxcbiAgICAgICAgbmV4dCA9IGJlYWNoc2VjdGlvbi5yYk5leHQsXG4gICAgICAgIGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zID0gW2JlYWNoc2VjdGlvbl0sXG4gICAgICAgIGFic19mbiA9IE1hdGguYWJzO1xuXG4gICAgLy8gcmVtb3ZlIGNvbGxhcHNlZCBiZWFjaHNlY3Rpb24gZnJvbSBiZWFjaGxpbmVcbiAgICB0aGlzLmRldGFjaEJlYWNoc2VjdGlvbihiZWFjaHNlY3Rpb24pO1xuXG4gICAgLy8gdGhlcmUgY291bGQgYmUgbW9yZSB0aGFuIG9uZSBlbXB0eSBhcmMgYXQgdGhlIGRlbGV0aW9uIHBvaW50LCB0aGlzXG4gICAgLy8gaGFwcGVucyB3aGVuIG1vcmUgdGhhbiB0d28gZWRnZXMgYXJlIGxpbmtlZCBieSB0aGUgc2FtZSB2ZXJ0ZXgsXG4gICAgLy8gc28gd2Ugd2lsbCBjb2xsZWN0IGFsbCB0aG9zZSBlZGdlcyBieSBsb29raW5nIHVwIGJvdGggc2lkZXMgb2ZcbiAgICAvLyB0aGUgZGVsZXRpb24gcG9pbnQuXG4gICAgLy8gYnkgdGhlIHdheSwgdGhlcmUgaXMgKmFsd2F5cyogYSBwcmVkZWNlc3Nvci9zdWNjZXNzb3IgdG8gYW55IGNvbGxhcHNlZFxuICAgIC8vIGJlYWNoIHNlY3Rpb24sIGl0J3MganVzdCBpbXBvc3NpYmxlIHRvIGhhdmUgYSBjb2xsYXBzaW5nIGZpcnN0L2xhc3RcbiAgICAvLyBiZWFjaCBzZWN0aW9ucyBvbiB0aGUgYmVhY2hsaW5lLCBzaW5jZSB0aGV5IG9idmlvdXNseSBhcmUgdW5jb25zdHJhaW5lZFxuICAgIC8vIG9uIHRoZWlyIGxlZnQvcmlnaHQgc2lkZS5cblxuICAgIC8vIGxvb2sgbGVmdFxuICAgIHZhciBsQXJjID0gcHJldmlvdXM7XG4gICAgd2hpbGUgKGxBcmMuY2lyY2xlRXZlbnQgJiYgYWJzX2ZuKHgtbEFyYy5jaXJjbGVFdmVudC54KTwxZS05ICYmIGFic19mbih5LWxBcmMuY2lyY2xlRXZlbnQueWNlbnRlcik8MWUtOSkge1xuICAgICAgICBwcmV2aW91cyA9IGxBcmMucmJQcmV2aW91cztcbiAgICAgICAgZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMudW5zaGlmdChsQXJjKTtcbiAgICAgICAgdGhpcy5kZXRhY2hCZWFjaHNlY3Rpb24obEFyYyk7IC8vIG1hcmsgZm9yIHJldXNlXG4gICAgICAgIGxBcmMgPSBwcmV2aW91cztcbiAgICAgICAgfVxuICAgIC8vIGV2ZW4gdGhvdWdoIGl0IGlzIG5vdCBkaXNhcHBlYXJpbmcsIEkgd2lsbCBhbHNvIGFkZCB0aGUgYmVhY2ggc2VjdGlvblxuICAgIC8vIGltbWVkaWF0ZWx5IHRvIHRoZSBsZWZ0IG9mIHRoZSBsZWZ0LW1vc3QgY29sbGFwc2VkIGJlYWNoIHNlY3Rpb24sIGZvclxuICAgIC8vIGNvbnZlbmllbmNlLCBzaW5jZSB3ZSBuZWVkIHRvIHJlZmVyIHRvIGl0IGxhdGVyIGFzIHRoaXMgYmVhY2ggc2VjdGlvblxuICAgIC8vIGlzIHRoZSAnbGVmdCcgc2l0ZSBvZiBhbiBlZGdlIGZvciB3aGljaCBhIHN0YXJ0IHBvaW50IGlzIHNldC5cbiAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucy51bnNoaWZ0KGxBcmMpO1xuICAgIHRoaXMuZGV0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG5cbiAgICAvLyBsb29rIHJpZ2h0XG4gICAgdmFyIHJBcmMgPSBuZXh0O1xuICAgIHdoaWxlIChyQXJjLmNpcmNsZUV2ZW50ICYmIGFic19mbih4LXJBcmMuY2lyY2xlRXZlbnQueCk8MWUtOSAmJiBhYnNfZm4oeS1yQXJjLmNpcmNsZUV2ZW50LnljZW50ZXIpPDFlLTkpIHtcbiAgICAgICAgbmV4dCA9IHJBcmMucmJOZXh0O1xuICAgICAgICBkaXNhcHBlYXJpbmdUcmFuc2l0aW9ucy5wdXNoKHJBcmMpO1xuICAgICAgICB0aGlzLmRldGFjaEJlYWNoc2VjdGlvbihyQXJjKTsgLy8gbWFyayBmb3IgcmV1c2VcbiAgICAgICAgckFyYyA9IG5leHQ7XG4gICAgICAgIH1cbiAgICAvLyB3ZSBhbHNvIGhhdmUgdG8gYWRkIHRoZSBiZWFjaCBzZWN0aW9uIGltbWVkaWF0ZWx5IHRvIHRoZSByaWdodCBvZiB0aGVcbiAgICAvLyByaWdodC1tb3N0IGNvbGxhcHNlZCBiZWFjaCBzZWN0aW9uLCBzaW5jZSB0aGVyZSBpcyBhbHNvIGEgZGlzYXBwZWFyaW5nXG4gICAgLy8gdHJhbnNpdGlvbiByZXByZXNlbnRpbmcgYW4gZWRnZSdzIHN0YXJ0IHBvaW50IG9uIGl0cyBsZWZ0LlxuICAgIGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zLnB1c2gockFyYyk7XG4gICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChyQXJjKTtcblxuICAgIC8vIHdhbGsgdGhyb3VnaCBhbGwgdGhlIGRpc2FwcGVhcmluZyB0cmFuc2l0aW9ucyBiZXR3ZWVuIGJlYWNoIHNlY3Rpb25zIGFuZFxuICAgIC8vIHNldCB0aGUgc3RhcnQgcG9pbnQgb2YgdGhlaXIgKGltcGxpZWQpIGVkZ2UuXG4gICAgdmFyIG5BcmNzID0gZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnMubGVuZ3RoLFxuICAgICAgICBpQXJjO1xuICAgIGZvciAoaUFyYz0xOyBpQXJjPG5BcmNzOyBpQXJjKyspIHtcbiAgICAgICAgckFyYyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zW2lBcmNdO1xuICAgICAgICBsQXJjID0gZGlzYXBwZWFyaW5nVHJhbnNpdGlvbnNbaUFyYy0xXTtcbiAgICAgICAgdGhpcy5zZXRFZGdlU3RhcnRwb2ludChyQXJjLmVkZ2UsIGxBcmMuc2l0ZSwgckFyYy5zaXRlLCB2ZXJ0ZXgpO1xuICAgICAgICB9XG5cbiAgICAvLyBjcmVhdGUgYSBuZXcgZWRnZSBhcyB3ZSBoYXZlIG5vdyBhIG5ldyB0cmFuc2l0aW9uIGJldHdlZW5cbiAgICAvLyB0d28gYmVhY2ggc2VjdGlvbnMgd2hpY2ggd2VyZSBwcmV2aW91c2x5IG5vdCBhZGphY2VudC5cbiAgICAvLyBzaW5jZSB0aGlzIGVkZ2UgYXBwZWFycyBhcyBhIG5ldyB2ZXJ0ZXggaXMgZGVmaW5lZCwgdGhlIHZlcnRleFxuICAgIC8vIGFjdHVhbGx5IGRlZmluZSBhbiBlbmQgcG9pbnQgb2YgdGhlIGVkZ2UgKHJlbGF0aXZlIHRvIHRoZSBzaXRlXG4gICAgLy8gb24gdGhlIGxlZnQpXG4gICAgbEFyYyA9IGRpc2FwcGVhcmluZ1RyYW5zaXRpb25zWzBdO1xuICAgIHJBcmMgPSBkaXNhcHBlYXJpbmdUcmFuc2l0aW9uc1tuQXJjcy0xXTtcbiAgICByQXJjLmVkZ2UgPSB0aGlzLmNyZWF0ZUVkZ2UobEFyYy5zaXRlLCByQXJjLnNpdGUsIHVuZGVmaW5lZCwgdmVydGV4KTtcblxuICAgIC8vIGNyZWF0ZSBjaXJjbGUgZXZlbnRzIGlmIGFueSBmb3IgYmVhY2ggc2VjdGlvbnMgbGVmdCBpbiB0aGUgYmVhY2hsaW5lXG4gICAgLy8gYWRqYWNlbnQgdG8gY29sbGFwc2VkIHNlY3Rpb25zXG4gICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChsQXJjKTtcbiAgICB0aGlzLmF0dGFjaENpcmNsZUV2ZW50KHJBcmMpO1xuICAgIH07XG5cblZvcm9ub2kucHJvdG90eXBlLmFkZEJlYWNoc2VjdGlvbiA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgeCA9IHNpdGUueCxcbiAgICAgICAgZGlyZWN0cml4ID0gc2l0ZS55O1xuXG4gICAgLy8gZmluZCB0aGUgbGVmdCBhbmQgcmlnaHQgYmVhY2ggc2VjdGlvbnMgd2hpY2ggd2lsbCBzdXJyb3VuZCB0aGUgbmV3bHlcbiAgICAvLyBjcmVhdGVkIGJlYWNoIHNlY3Rpb24uXG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wMTogVGhpcyBsb29wIGlzIG9uZSBvZiB0aGUgbW9zdCBvZnRlbiBleGVjdXRlZCxcbiAgICAvLyBoZW5jZSB3ZSBleHBhbmQgaW4tcGxhY2UgdGhlIGNvbXBhcmlzb24tYWdhaW5zdC1lcHNpbG9uIGNhbGxzLlxuICAgIHZhciBsQXJjLCByQXJjLFxuICAgICAgICBkeGwsIGR4cixcbiAgICAgICAgbm9kZSA9IHRoaXMuYmVhY2hsaW5lLnJvb3Q7XG5cbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBkeGwgPSB0aGlzLmxlZnRCcmVha1BvaW50KG5vZGUsZGlyZWN0cml4KS14O1xuICAgICAgICAvLyB4IGxlc3NUaGFuV2l0aEVwc2lsb24geGwgPT4gZmFsbHMgc29tZXdoZXJlIGJlZm9yZSB0aGUgbGVmdCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgaWYgKGR4bCA+IDFlLTkpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgY2FzZSBzaG91bGQgbmV2ZXIgaGFwcGVuXG4gICAgICAgICAgICAvLyBpZiAoIW5vZGUucmJMZWZ0KSB7XG4gICAgICAgICAgICAvLyAgICByQXJjID0gbm9kZS5yYkxlZnQ7XG4gICAgICAgICAgICAvLyAgICBicmVhaztcbiAgICAgICAgICAgIC8vICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnJiTGVmdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkeHIgPSB4LXRoaXMucmlnaHRCcmVha1BvaW50KG5vZGUsZGlyZWN0cml4KTtcbiAgICAgICAgICAgIC8vIHggZ3JlYXRlclRoYW5XaXRoRXBzaWxvbiB4ciA9PiBmYWxscyBzb21ld2hlcmUgYWZ0ZXIgdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIGJlYWNoc2VjdGlvblxuICAgICAgICAgICAgaWYgKGR4ciA+IDFlLTkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUucmJSaWdodCkge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5yYlJpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHggZXF1YWxXaXRoRXBzaWxvbiB4bCA9PiBmYWxscyBleGFjdGx5IG9uIHRoZSBsZWZ0IGVkZ2Ugb2YgdGhlIGJlYWNoc2VjdGlvblxuICAgICAgICAgICAgICAgIGlmIChkeGwgPiAtMWUtOSkge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gbm9kZS5yYlByZXZpb3VzO1xuICAgICAgICAgICAgICAgICAgICByQXJjID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHggZXF1YWxXaXRoRXBzaWxvbiB4ciA9PiBmYWxscyBleGFjdGx5IG9uIHRoZSByaWdodCBlZGdlIG9mIHRoZSBiZWFjaHNlY3Rpb25cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkeHIgPiAtMWUtOSkge1xuICAgICAgICAgICAgICAgICAgICBsQXJjID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgckFyYyA9IG5vZGUucmJOZXh0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gZmFsbHMgZXhhY3RseSBzb21ld2hlcmUgaW4gdGhlIG1pZGRsZSBvZiB0aGUgYmVhY2hzZWN0aW9uXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxBcmMgPSByQXJjID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIC8vIGF0IHRoaXMgcG9pbnQsIGtlZXAgaW4gbWluZCB0aGF0IGxBcmMgYW5kL29yIHJBcmMgY291bGQgYmVcbiAgICAvLyB1bmRlZmluZWQgb3IgbnVsbC5cblxuICAgIC8vIGNyZWF0ZSBhIG5ldyBiZWFjaCBzZWN0aW9uIG9iamVjdCBmb3IgdGhlIHNpdGUgYW5kIGFkZCBpdCB0byBSQi10cmVlXG4gICAgdmFyIG5ld0FyYyA9IHRoaXMuY3JlYXRlQmVhY2hzZWN0aW9uKHNpdGUpO1xuICAgIHRoaXMuYmVhY2hsaW5lLnJiSW5zZXJ0U3VjY2Vzc29yKGxBcmMsIG5ld0FyYyk7XG5cbiAgICAvLyBjYXNlczpcbiAgICAvL1xuXG4gICAgLy8gW251bGwsbnVsbF1cbiAgICAvLyBsZWFzdCBsaWtlbHkgY2FzZTogbmV3IGJlYWNoIHNlY3Rpb24gaXMgdGhlIGZpcnN0IGJlYWNoIHNlY3Rpb24gb24gdGhlXG4gICAgLy8gYmVhY2hsaW5lLlxuICAgIC8vIFRoaXMgY2FzZSBtZWFuczpcbiAgICAvLyAgIG5vIG5ldyB0cmFuc2l0aW9uIGFwcGVhcnNcbiAgICAvLyAgIG5vIGNvbGxhcHNpbmcgYmVhY2ggc2VjdGlvblxuICAgIC8vICAgbmV3IGJlYWNoc2VjdGlvbiBiZWNvbWUgcm9vdCBvZiB0aGUgUkItdHJlZVxuICAgIGlmICghbEFyYyAmJiAhckFyYykge1xuICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIC8vIFtsQXJjLHJBcmNdIHdoZXJlIGxBcmMgPT0gckFyY1xuICAgIC8vIG1vc3QgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIHNwbGl0IGFuIGV4aXN0aW5nIGJlYWNoXG4gICAgLy8gc2VjdGlvbi5cbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBvbmUgbmV3IHRyYW5zaXRpb24gYXBwZWFyc1xuICAgIC8vICAgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb24gbWlnaHQgYmUgY29sbGFwc2luZyBhcyBhIHJlc3VsdFxuICAgIC8vICAgdHdvIG5ldyBub2RlcyBhZGRlZCB0byB0aGUgUkItdHJlZVxuICAgIGlmIChsQXJjID09PSByQXJjKSB7XG4gICAgICAgIC8vIGludmFsaWRhdGUgY2lyY2xlIGV2ZW50IG9mIHNwbGl0IGJlYWNoIHNlY3Rpb25cbiAgICAgICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChsQXJjKTtcblxuICAgICAgICAvLyBzcGxpdCB0aGUgYmVhY2ggc2VjdGlvbiBpbnRvIHR3byBzZXBhcmF0ZSBiZWFjaCBzZWN0aW9uc1xuICAgICAgICByQXJjID0gdGhpcy5jcmVhdGVCZWFjaHNlY3Rpb24obEFyYy5zaXRlKTtcbiAgICAgICAgdGhpcy5iZWFjaGxpbmUucmJJbnNlcnRTdWNjZXNzb3IobmV3QXJjLCByQXJjKTtcblxuICAgICAgICAvLyBzaW5jZSB3ZSBoYXZlIGEgbmV3IHRyYW5zaXRpb24gYmV0d2VlbiB0d28gYmVhY2ggc2VjdGlvbnMsXG4gICAgICAgIC8vIGEgbmV3IGVkZ2UgaXMgYm9yblxuICAgICAgICBuZXdBcmMuZWRnZSA9IHJBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShsQXJjLnNpdGUsIG5ld0FyYy5zaXRlKTtcblxuICAgICAgICAvLyBjaGVjayB3aGV0aGVyIHRoZSBsZWZ0IGFuZCByaWdodCBiZWFjaCBzZWN0aW9ucyBhcmUgY29sbGFwc2luZ1xuICAgICAgICAvLyBhbmQgaWYgc28gY3JlYXRlIGNpcmNsZSBldmVudHMsIHRvIGJlIG5vdGlmaWVkIHdoZW4gdGhlIHBvaW50IG9mXG4gICAgICAgIC8vIGNvbGxhcHNlIGlzIHJlYWNoZWQuXG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQobEFyYyk7XG4gICAgICAgIHRoaXMuYXR0YWNoQ2lyY2xlRXZlbnQockFyYyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgLy8gW2xBcmMsbnVsbF1cbiAgICAvLyBldmVuIGxlc3MgbGlrZWx5IGNhc2U6IG5ldyBiZWFjaCBzZWN0aW9uIGlzIHRoZSAqbGFzdCogYmVhY2ggc2VjdGlvblxuICAgIC8vIG9uIHRoZSBiZWFjaGxpbmUgLS0gdGhpcyBjYW4gaGFwcGVuICpvbmx5KiBpZiAqYWxsKiB0aGUgcHJldmlvdXMgYmVhY2hcbiAgICAvLyBzZWN0aW9ucyBjdXJyZW50bHkgb24gdGhlIGJlYWNobGluZSBzaGFyZSB0aGUgc2FtZSB5IHZhbHVlIGFzXG4gICAgLy8gdGhlIG5ldyBiZWFjaCBzZWN0aW9uLlxuICAgIC8vIFRoaXMgY2FzZSBtZWFuczpcbiAgICAvLyAgIG9uZSBuZXcgdHJhbnNpdGlvbiBhcHBlYXJzXG4gICAgLy8gICBubyBjb2xsYXBzaW5nIGJlYWNoIHNlY3Rpb24gYXMgYSByZXN1bHRcbiAgICAvLyAgIG5ldyBiZWFjaCBzZWN0aW9uIGJlY29tZSByaWdodC1tb3N0IG5vZGUgb2YgdGhlIFJCLXRyZWVcbiAgICBpZiAobEFyYyAmJiAhckFyYykge1xuICAgICAgICBuZXdBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShsQXJjLnNpdGUsbmV3QXJjLnNpdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgIC8vIFtudWxsLHJBcmNdXG4gICAgLy8gaW1wb3NzaWJsZSBjYXNlOiBiZWNhdXNlIHNpdGVzIGFyZSBzdHJpY3RseSBwcm9jZXNzZWQgZnJvbSB0b3AgdG8gYm90dG9tLFxuICAgIC8vIGFuZCBsZWZ0IHRvIHJpZ2h0LCB3aGljaCBndWFyYW50ZWVzIHRoYXQgdGhlcmUgd2lsbCBhbHdheXMgYmUgYSBiZWFjaCBzZWN0aW9uXG4gICAgLy8gb24gdGhlIGxlZnQgLS0gZXhjZXB0IG9mIGNvdXJzZSB3aGVuIHRoZXJlIGFyZSBubyBiZWFjaCBzZWN0aW9uIGF0IGFsbCBvblxuICAgIC8vIHRoZSBiZWFjaCBsaW5lLCB3aGljaCBjYXNlIHdhcyBoYW5kbGVkIGFib3ZlLlxuICAgIC8vIHJoaWxsIDIwMTEtMDYtMDI6IE5vIHBvaW50IHRlc3RpbmcgaW4gbm9uLWRlYnVnIHZlcnNpb25cbiAgICAvL2lmICghbEFyYyAmJiByQXJjKSB7XG4gICAgLy8gICAgdGhyb3cgXCJWb3Jvbm9pLmFkZEJlYWNoc2VjdGlvbigpOiBXaGF0IGlzIHRoaXMgSSBkb24ndCBldmVuXCI7XG4gICAgLy8gICAgfVxuXG4gICAgLy8gW2xBcmMsckFyY10gd2hlcmUgbEFyYyAhPSByQXJjXG4gICAgLy8gc29tZXdoYXQgbGVzcyBsaWtlbHkgY2FzZTogbmV3IGJlYWNoIHNlY3Rpb24gZmFsbHMgKmV4YWN0bHkqIGluIGJldHdlZW4gdHdvXG4gICAgLy8gZXhpc3RpbmcgYmVhY2ggc2VjdGlvbnNcbiAgICAvLyBUaGlzIGNhc2UgbWVhbnM6XG4gICAgLy8gICBvbmUgdHJhbnNpdGlvbiBkaXNhcHBlYXJzXG4gICAgLy8gICB0d28gbmV3IHRyYW5zaXRpb25zIGFwcGVhclxuICAgIC8vICAgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb24gbWlnaHQgYmUgY29sbGFwc2luZyBhcyBhIHJlc3VsdFxuICAgIC8vICAgb25seSBvbmUgbmV3IG5vZGUgYWRkZWQgdG8gdGhlIFJCLXRyZWVcbiAgICBpZiAobEFyYyAhPT0gckFyYykge1xuICAgICAgICAvLyBpbnZhbGlkYXRlIGNpcmNsZSBldmVudHMgb2YgbGVmdCBhbmQgcmlnaHQgc2l0ZXNcbiAgICAgICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChsQXJjKTtcbiAgICAgICAgdGhpcy5kZXRhY2hDaXJjbGVFdmVudChyQXJjKTtcblxuICAgICAgICAvLyBhbiBleGlzdGluZyB0cmFuc2l0aW9uIGRpc2FwcGVhcnMsIG1lYW5pbmcgYSB2ZXJ0ZXggaXMgZGVmaW5lZCBhdFxuICAgICAgICAvLyB0aGUgZGlzYXBwZWFyYW5jZSBwb2ludC5cbiAgICAgICAgLy8gc2luY2UgdGhlIGRpc2FwcGVhcmFuY2UgaXMgY2F1c2VkIGJ5IHRoZSBuZXcgYmVhY2hzZWN0aW9uLCB0aGVcbiAgICAgICAgLy8gdmVydGV4IGlzIGF0IHRoZSBjZW50ZXIgb2YgdGhlIGNpcmN1bXNjcmliZWQgY2lyY2xlIG9mIHRoZSBsZWZ0LFxuICAgICAgICAvLyBuZXcgYW5kIHJpZ2h0IGJlYWNoc2VjdGlvbnMuXG4gICAgICAgIC8vIGh0dHA6Ly9tYXRoZm9ydW0ub3JnL2xpYnJhcnkvZHJtYXRoL3ZpZXcvNTUwMDIuaHRtbFxuICAgICAgICAvLyBFeGNlcHQgdGhhdCBJIGJyaW5nIHRoZSBvcmlnaW4gYXQgQSB0byBzaW1wbGlmeVxuICAgICAgICAvLyBjYWxjdWxhdGlvblxuICAgICAgICB2YXIgbFNpdGUgPSBsQXJjLnNpdGUsXG4gICAgICAgICAgICBheCA9IGxTaXRlLngsXG4gICAgICAgICAgICBheSA9IGxTaXRlLnksXG4gICAgICAgICAgICBieD1zaXRlLngtYXgsXG4gICAgICAgICAgICBieT1zaXRlLnktYXksXG4gICAgICAgICAgICByU2l0ZSA9IHJBcmMuc2l0ZSxcbiAgICAgICAgICAgIGN4PXJTaXRlLngtYXgsXG4gICAgICAgICAgICBjeT1yU2l0ZS55LWF5LFxuICAgICAgICAgICAgZD0yKihieCpjeS1ieSpjeCksXG4gICAgICAgICAgICBoYj1ieCpieCtieSpieSxcbiAgICAgICAgICAgIGhjPWN4KmN4K2N5KmN5LFxuICAgICAgICAgICAgdmVydGV4ID0gdGhpcy5jcmVhdGVWZXJ0ZXgoKGN5KmhiLWJ5KmhjKS9kK2F4LCAoYngqaGMtY3gqaGIpL2QrYXkpO1xuXG4gICAgICAgIC8vIG9uZSB0cmFuc2l0aW9uIGRpc2FwcGVhclxuICAgICAgICB0aGlzLnNldEVkZ2VTdGFydHBvaW50KHJBcmMuZWRnZSwgbFNpdGUsIHJTaXRlLCB2ZXJ0ZXgpO1xuXG4gICAgICAgIC8vIHR3byBuZXcgdHJhbnNpdGlvbnMgYXBwZWFyIGF0IHRoZSBuZXcgdmVydGV4IGxvY2F0aW9uXG4gICAgICAgIG5ld0FyYy5lZGdlID0gdGhpcy5jcmVhdGVFZGdlKGxTaXRlLCBzaXRlLCB1bmRlZmluZWQsIHZlcnRleCk7XG4gICAgICAgIHJBcmMuZWRnZSA9IHRoaXMuY3JlYXRlRWRnZShzaXRlLCByU2l0ZSwgdW5kZWZpbmVkLCB2ZXJ0ZXgpO1xuXG4gICAgICAgIC8vIGNoZWNrIHdoZXRoZXIgdGhlIGxlZnQgYW5kIHJpZ2h0IGJlYWNoIHNlY3Rpb25zIGFyZSBjb2xsYXBzaW5nXG4gICAgICAgIC8vIGFuZCBpZiBzbyBjcmVhdGUgY2lyY2xlIGV2ZW50cywgdG8gaGFuZGxlIHRoZSBwb2ludCBvZiBjb2xsYXBzZS5cbiAgICAgICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChsQXJjKTtcbiAgICAgICAgdGhpcy5hdHRhY2hDaXJjbGVFdmVudChyQXJjKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDaXJjbGUgZXZlbnQgbWV0aG9kc1xuXG4vLyByaGlsbCAyMDExLTA2LTA3OiBGb3Igc29tZSByZWFzb25zLCBwZXJmb3JtYW5jZSBzdWZmZXJzIHNpZ25pZmljYW50bHlcbi8vIHdoZW4gaW5zdGFuY2lhdGluZyBhIGxpdGVyYWwgb2JqZWN0IGluc3RlYWQgb2YgYW4gZW1wdHkgY3RvclxuVm9yb25vaS5wcm90b3R5cGUuQ2lyY2xlRXZlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyByaGlsbCAyMDEzLTEwLTEyOiBpdCBoZWxwcyB0byBzdGF0ZSBleGFjdGx5IHdoYXQgd2UgYXJlIGF0IGN0b3IgdGltZS5cbiAgICB0aGlzLmFyYyA9IG51bGw7XG4gICAgdGhpcy5yYkxlZnQgPSBudWxsO1xuICAgIHRoaXMucmJOZXh0ID0gbnVsbDtcbiAgICB0aGlzLnJiUGFyZW50ID0gbnVsbDtcbiAgICB0aGlzLnJiUHJldmlvdXMgPSBudWxsO1xuICAgIHRoaXMucmJSZWQgPSBmYWxzZTtcbiAgICB0aGlzLnJiUmlnaHQgPSBudWxsO1xuICAgIHRoaXMuc2l0ZSA9IG51bGw7XG4gICAgdGhpcy54ID0gdGhpcy55ID0gdGhpcy55Y2VudGVyID0gMDtcbiAgICB9O1xuXG5Wb3Jvbm9pLnByb3RvdHlwZS5hdHRhY2hDaXJjbGVFdmVudCA9IGZ1bmN0aW9uKGFyYykge1xuICAgIHZhciBsQXJjID0gYXJjLnJiUHJldmlvdXMsXG4gICAgICAgIHJBcmMgPSBhcmMucmJOZXh0O1xuICAgIGlmICghbEFyYyB8fCAhckFyYykge3JldHVybjt9IC8vIGRvZXMgdGhhdCBldmVyIGhhcHBlbj9cbiAgICB2YXIgbFNpdGUgPSBsQXJjLnNpdGUsXG4gICAgICAgIGNTaXRlID0gYXJjLnNpdGUsXG4gICAgICAgIHJTaXRlID0gckFyYy5zaXRlO1xuXG4gICAgLy8gSWYgc2l0ZSBvZiBsZWZ0IGJlYWNoc2VjdGlvbiBpcyBzYW1lIGFzIHNpdGUgb2ZcbiAgICAvLyByaWdodCBiZWFjaHNlY3Rpb24sIHRoZXJlIGNhbid0IGJlIGNvbnZlcmdlbmNlXG4gICAgaWYgKGxTaXRlPT09clNpdGUpIHtyZXR1cm47fVxuXG4gICAgLy8gRmluZCB0aGUgY2lyY3Vtc2NyaWJlZCBjaXJjbGUgZm9yIHRoZSB0aHJlZSBzaXRlcyBhc3NvY2lhdGVkXG4gICAgLy8gd2l0aCB0aGUgYmVhY2hzZWN0aW9uIHRyaXBsZXQuXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yNjogSXQgaXMgbW9yZSBlZmZpY2llbnQgdG8gY2FsY3VsYXRlIGluLXBsYWNlXG4gICAgLy8gcmF0aGVyIHRoYW4gZ2V0dGluZyB0aGUgcmVzdWx0aW5nIGNpcmN1bXNjcmliZWQgY2lyY2xlIGZyb20gYW5cbiAgICAvLyBvYmplY3QgcmV0dXJuZWQgYnkgY2FsbGluZyBWb3Jvbm9pLmNpcmN1bWNpcmNsZSgpXG4gICAgLy8gaHR0cDovL21hdGhmb3J1bS5vcmcvbGlicmFyeS9kcm1hdGgvdmlldy81NTAwMi5odG1sXG4gICAgLy8gRXhjZXB0IHRoYXQgSSBicmluZyB0aGUgb3JpZ2luIGF0IGNTaXRlIHRvIHNpbXBsaWZ5IGNhbGN1bGF0aW9ucy5cbiAgICAvLyBUaGUgYm90dG9tLW1vc3QgcGFydCBvZiB0aGUgY2lyY3VtY2lyY2xlIGlzIG91ciBGb3J0dW5lICdjaXJjbGVcbiAgICAvLyBldmVudCcsIGFuZCBpdHMgY2VudGVyIGlzIGEgdmVydGV4IHBvdGVudGlhbGx5IHBhcnQgb2YgdGhlIGZpbmFsXG4gICAgLy8gVm9yb25vaSBkaWFncmFtLlxuICAgIHZhciBieCA9IGNTaXRlLngsXG4gICAgICAgIGJ5ID0gY1NpdGUueSxcbiAgICAgICAgYXggPSBsU2l0ZS54LWJ4LFxuICAgICAgICBheSA9IGxTaXRlLnktYnksXG4gICAgICAgIGN4ID0gclNpdGUueC1ieCxcbiAgICAgICAgY3kgPSByU2l0ZS55LWJ5O1xuXG4gICAgLy8gSWYgcG9pbnRzIGwtPmMtPnIgYXJlIGNsb2Nrd2lzZSwgdGhlbiBjZW50ZXIgYmVhY2ggc2VjdGlvbiBkb2VzIG5vdFxuICAgIC8vIGNvbGxhcHNlLCBoZW5jZSBpdCBjYW4ndCBlbmQgdXAgYXMgYSB2ZXJ0ZXggKHdlIHJldXNlICdkJyBoZXJlLCB3aGljaFxuICAgIC8vIHNpZ24gaXMgcmV2ZXJzZSBvZiB0aGUgb3JpZW50YXRpb24sIGhlbmNlIHdlIHJldmVyc2UgdGhlIHRlc3QuXG4gICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DdXJ2ZV9vcmllbnRhdGlvbiNPcmllbnRhdGlvbl9vZl9hX3NpbXBsZV9wb2x5Z29uXG4gICAgLy8gcmhpbGwgMjAxMS0wNS0yMTogTmFzdHkgZmluaXRlIHByZWNpc2lvbiBlcnJvciB3aGljaCBjYXVzZWQgY2lyY3VtY2lyY2xlKCkgdG9cbiAgICAvLyByZXR1cm4gaW5maW5pdGVzOiAxZS0xMiBzZWVtcyB0byBmaXggdGhlIHByb2JsZW0uXG4gICAgdmFyIGQgPSAyKihheCpjeS1heSpjeCk7XG4gICAgaWYgKGQgPj0gLTJlLTEyKXtyZXR1cm47fVxuXG4gICAgdmFyIGhhID0gYXgqYXgrYXkqYXksXG4gICAgICAgIGhjID0gY3gqY3grY3kqY3ksXG4gICAgICAgIHggPSAoY3kqaGEtYXkqaGMpL2QsXG4gICAgICAgIHkgPSAoYXgqaGMtY3gqaGEpL2QsXG4gICAgICAgIHljZW50ZXIgPSB5K2J5O1xuXG4gICAgLy8gSW1wb3J0YW50OiB5Ym90dG9tIHNob3VsZCBhbHdheXMgYmUgdW5kZXIgb3IgYXQgc3dlZXAsIHNvIG5vIG5lZWRcbiAgICAvLyB0byB3YXN0ZSBDUFUgY3ljbGVzIGJ5IGNoZWNraW5nXG5cbiAgICAvLyByZWN5Y2xlIGNpcmNsZSBldmVudCBvYmplY3QgaWYgcG9zc2libGVcbiAgICB2YXIgY2lyY2xlRXZlbnQgPSB0aGlzLmNpcmNsZUV2ZW50SnVua3lhcmQucG9wKCk7XG4gICAgaWYgKCFjaXJjbGVFdmVudCkge1xuICAgICAgICBjaXJjbGVFdmVudCA9IG5ldyB0aGlzLkNpcmNsZUV2ZW50KCk7XG4gICAgICAgIH1cbiAgICBjaXJjbGVFdmVudC5hcmMgPSBhcmM7XG4gICAgY2lyY2xlRXZlbnQuc2l0ZSA9IGNTaXRlO1xuICAgIGNpcmNsZUV2ZW50LnggPSB4K2J4O1xuICAgIGNpcmNsZUV2ZW50LnkgPSB5Y2VudGVyK3RoaXMuc3FydCh4KngreSp5KTsgLy8geSBib3R0b21cbiAgICBjaXJjbGVFdmVudC55Y2VudGVyID0geWNlbnRlcjtcbiAgICBhcmMuY2lyY2xlRXZlbnQgPSBjaXJjbGVFdmVudDtcblxuICAgIC8vIGZpbmQgaW5zZXJ0aW9uIHBvaW50IGluIFJCLXRyZWU6IGNpcmNsZSBldmVudHMgYXJlIG9yZGVyZWQgZnJvbVxuICAgIC8vIHNtYWxsZXN0IHRvIGxhcmdlc3RcbiAgICB2YXIgcHJlZGVjZXNzb3IgPSBudWxsLFxuICAgICAgICBub2RlID0gdGhpcy5jaXJjbGVFdmVudHMucm9vdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoY2lyY2xlRXZlbnQueSA8IG5vZGUueSB8fCAoY2lyY2xlRXZlbnQueSA9PT0gbm9kZS55ICYmIGNpcmNsZUV2ZW50LnggPD0gbm9kZS54KSkge1xuICAgICAgICAgICAgaWYgKG5vZGUucmJMZWZ0KSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJMZWZ0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZWRlY2Vzc29yID0gbm9kZS5yYlByZXZpb3VzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAobm9kZS5yYlJpZ2h0KSB7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucmJSaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVkZWNlc3NvciA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgdGhpcy5jaXJjbGVFdmVudHMucmJJbnNlcnRTdWNjZXNzb3IocHJlZGVjZXNzb3IsIGNpcmNsZUV2ZW50KTtcbiAgICBpZiAoIXByZWRlY2Vzc29yKSB7XG4gICAgICAgIHRoaXMuZmlyc3RDaXJjbGVFdmVudCA9IGNpcmNsZUV2ZW50O1xuICAgICAgICB9XG4gICAgfTtcblxuVm9yb25vaS5wcm90b3R5cGUuZGV0YWNoQ2lyY2xlRXZlbnQgPSBmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgY2lyY2xlRXZlbnQgPSBhcmMuY2lyY2xlRXZlbnQ7XG4gICAgaWYgKGNpcmNsZUV2ZW50KSB7XG4gICAgICAgIGlmICghY2lyY2xlRXZlbnQucmJQcmV2aW91cykge1xuICAgICAgICAgICAgdGhpcy5maXJzdENpcmNsZUV2ZW50ID0gY2lyY2xlRXZlbnQucmJOZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB0aGlzLmNpcmNsZUV2ZW50cy5yYlJlbW92ZU5vZGUoY2lyY2xlRXZlbnQpOyAvLyByZW1vdmUgZnJvbSBSQi10cmVlXG4gICAgICAgIHRoaXMuY2lyY2xlRXZlbnRKdW5reWFyZC5wdXNoKGNpcmNsZUV2ZW50KTtcbiAgICAgICAgYXJjLmNpcmNsZUV2ZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGlhZ3JhbSBjb21wbGV0aW9uIG1ldGhvZHNcblxuLy8gY29ubmVjdCBkYW5nbGluZyBlZGdlcyAobm90IGlmIGEgY3Vyc29yeSB0ZXN0IHRlbGxzIHVzXG4vLyBpdCBpcyBub3QgZ29pbmcgdG8gYmUgdmlzaWJsZS5cbi8vIHJldHVybiB2YWx1ZTpcbi8vICAgZmFsc2U6IHRoZSBkYW5nbGluZyBlbmRwb2ludCBjb3VsZG4ndCBiZSBjb25uZWN0ZWRcbi8vICAgdHJ1ZTogdGhlIGRhbmdsaW5nIGVuZHBvaW50IGNvdWxkIGJlIGNvbm5lY3RlZFxuVm9yb25vaS5wcm90b3R5cGUuY29ubmVjdEVkZ2UgPSBmdW5jdGlvbihlZGdlLCBiYm94KSB7XG4gICAgLy8gc2tpcCBpZiBlbmQgcG9pbnQgYWxyZWFkeSBjb25uZWN0ZWRcbiAgICB2YXIgdmIgPSBlZGdlLnZiO1xuICAgIGlmICghIXZiKSB7cmV0dXJuIHRydWU7fVxuXG4gICAgLy8gbWFrZSBsb2NhbCBjb3B5IGZvciBwZXJmb3JtYW5jZSBwdXJwb3NlXG4gICAgdmFyIHZhID0gZWRnZS52YSxcbiAgICAgICAgeGwgPSBiYm94LnhsLFxuICAgICAgICB4ciA9IGJib3gueHIsXG4gICAgICAgIHl0ID0gYmJveC55dCxcbiAgICAgICAgeWIgPSBiYm94LnliLFxuICAgICAgICBsU2l0ZSA9IGVkZ2UubFNpdGUsXG4gICAgICAgIHJTaXRlID0gZWRnZS5yU2l0ZSxcbiAgICAgICAgbHggPSBsU2l0ZS54LFxuICAgICAgICBseSA9IGxTaXRlLnksXG4gICAgICAgIHJ4ID0gclNpdGUueCxcbiAgICAgICAgcnkgPSByU2l0ZS55LFxuICAgICAgICBmeCA9IChseCtyeCkvMixcbiAgICAgICAgZnkgPSAobHkrcnkpLzIsXG4gICAgICAgIGZtLCBmYjtcblxuICAgIC8vIGlmIHdlIHJlYWNoIGhlcmUsIHRoaXMgbWVhbnMgY2VsbHMgd2hpY2ggdXNlIHRoaXMgZWRnZSB3aWxsIG5lZWRcbiAgICAvLyB0byBiZSBjbG9zZWQsIHdoZXRoZXIgYmVjYXVzZSB0aGUgZWRnZSB3YXMgcmVtb3ZlZCwgb3IgYmVjYXVzZSBpdFxuICAgIC8vIHdhcyBjb25uZWN0ZWQgdG8gdGhlIGJvdW5kaW5nIGJveC5cbiAgICB0aGlzLmNlbGxzW2xTaXRlLnZvcm9ub2lJZF0uY2xvc2VNZSA9IHRydWU7XG4gICAgdGhpcy5jZWxsc1tyU2l0ZS52b3Jvbm9pSWRdLmNsb3NlTWUgPSB0cnVlO1xuXG4gICAgLy8gZ2V0IHRoZSBsaW5lIGVxdWF0aW9uIG9mIHRoZSBiaXNlY3RvciBpZiBsaW5lIGlzIG5vdCB2ZXJ0aWNhbFxuICAgIGlmIChyeSAhPT0gbHkpIHtcbiAgICAgICAgZm0gPSAobHgtcngpLyhyeS1seSk7XG4gICAgICAgIGZiID0gZnktZm0qZng7XG4gICAgICAgIH1cblxuICAgIC8vIHJlbWVtYmVyLCBkaXJlY3Rpb24gb2YgbGluZSAocmVsYXRpdmUgdG8gbGVmdCBzaXRlKTpcbiAgICAvLyB1cHdhcmQ6IGxlZnQueCA8IHJpZ2h0LnhcbiAgICAvLyBkb3dud2FyZDogbGVmdC54ID4gcmlnaHQueFxuICAgIC8vIGhvcml6b250YWw6IGxlZnQueCA9PSByaWdodC54XG4gICAgLy8gdXB3YXJkOiBsZWZ0LnggPCByaWdodC54XG4gICAgLy8gcmlnaHR3YXJkOiBsZWZ0LnkgPCByaWdodC55XG4gICAgLy8gbGVmdHdhcmQ6IGxlZnQueSA+IHJpZ2h0LnlcbiAgICAvLyB2ZXJ0aWNhbDogbGVmdC55ID09IHJpZ2h0LnlcblxuICAgIC8vIGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aW9uLCBmaW5kIHRoZSBiZXN0IHNpZGUgb2YgdGhlXG4gICAgLy8gYm91bmRpbmcgYm94IHRvIHVzZSB0byBkZXRlcm1pbmUgYSByZWFzb25hYmxlIHN0YXJ0IHBvaW50XG5cbiAgICAvLyByaGlsbCAyMDEzLTEyLTAyOlxuICAgIC8vIFdoaWxlIGF0IGl0LCBzaW5jZSB3ZSBoYXZlIHRoZSB2YWx1ZXMgd2hpY2ggZGVmaW5lIHRoZSBsaW5lLFxuICAgIC8vIGNsaXAgdGhlIGVuZCBvZiB2YSBpZiBpdCBpcyBvdXRzaWRlIHRoZSBiYm94LlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9pc3N1ZXMvMTVcbiAgICAvLyBUT0RPOiBEbyBhbGwgdGhlIGNsaXBwaW5nIGhlcmUgcmF0aGVyIHRoYW4gcmVseSBvbiBMaWFuZy1CYXJza3lcbiAgICAvLyB3aGljaCBkb2VzIG5vdCBkbyB3ZWxsIHNvbWV0aW1lcyBkdWUgdG8gbG9zcyBvZiBhcml0aG1ldGljXG4gICAgLy8gcHJlY2lzaW9uLiBUaGUgY29kZSBoZXJlIGRvZXNuJ3QgZGVncmFkZSBpZiBvbmUgb2YgdGhlIHZlcnRleCBpc1xuICAgIC8vIGF0IGEgaHVnZSBkaXN0YW5jZS5cblxuICAgIC8vIHNwZWNpYWwgY2FzZTogdmVydGljYWwgbGluZVxuICAgIGlmIChmbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGRvZXNuJ3QgaW50ZXJzZWN0IHdpdGggdmlld3BvcnRcbiAgICAgICAgaWYgKGZ4IDwgeGwgfHwgZnggPj0geHIpIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICAvLyBkb3dud2FyZFxuICAgICAgICBpZiAobHggPiByeCkge1xuICAgICAgICAgICAgaWYgKCF2YSB8fCB2YS55IDwgeXQpIHtcbiAgICAgICAgICAgICAgICB2YSA9IHRoaXMuY3JlYXRlVmVydGV4KGZ4LCB5dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueSA+PSB5Yikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGZ4LCB5Yik7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIHVwd2FyZFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA+IHliKSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleChmeCwgeWIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHZhLnkgPCB5dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGZ4LCB5dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAvLyBjbG9zZXIgdG8gdmVydGljYWwgdGhhbiBob3Jpem9udGFsLCBjb25uZWN0IHN0YXJ0IHBvaW50IHRvIHRoZVxuICAgIC8vIHRvcCBvciBib3R0b20gc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94XG4gICAgZWxzZSBpZiAoZm0gPCAtMSB8fCBmbSA+IDEpIHtcbiAgICAgICAgLy8gZG93bndhcmRcbiAgICAgICAgaWYgKGx4ID4gcngpIHtcbiAgICAgICAgICAgIGlmICghdmEgfHwgdmEueSA8IHl0KSB7XG4gICAgICAgICAgICAgICAgdmEgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeXQtZmIpL2ZtLCB5dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueSA+PSB5Yikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KCh5Yi1mYikvZm0sIHliKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgLy8gdXB3YXJkXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF2YSB8fCB2YS55ID4geWIpIHtcbiAgICAgICAgICAgICAgICB2YSA9IHRoaXMuY3JlYXRlVmVydGV4KCh5Yi1mYikvZm0sIHliKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2YS55IDwgeXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCgoeXQtZmIpL2ZtLCB5dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAvLyBjbG9zZXIgdG8gaG9yaXpvbnRhbCB0aGFuIHZlcnRpY2FsLCBjb25uZWN0IHN0YXJ0IHBvaW50IHRvIHRoZVxuICAgIC8vIGxlZnQgb3IgcmlnaHQgc2lkZSBvZiB0aGUgYm91bmRpbmcgYm94XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIHJpZ2h0d2FyZFxuICAgICAgICBpZiAobHkgPCByeSkge1xuICAgICAgICAgICAgaWYgKCF2YSB8fCB2YS54IDwgeGwpIHtcbiAgICAgICAgICAgICAgICB2YSA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBmbSp4bCtmYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueCA+PSB4cikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhyLCBmbSp4citmYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIC8vIGxlZnR3YXJkXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF2YSB8fCB2YS54ID4geHIpIHtcbiAgICAgICAgICAgICAgICB2YSA9IHRoaXMuY3JlYXRlVmVydGV4KHhyLCBmbSp4citmYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmEueCA8IHhsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgoeGwsIGZtKnhsK2ZiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGVkZ2UudmEgPSB2YTtcbiAgICBlZGdlLnZiID0gdmI7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4vLyBsaW5lLWNsaXBwaW5nIGNvZGUgdGFrZW4gZnJvbTpcbi8vICAgTGlhbmctQmFyc2t5IGZ1bmN0aW9uIGJ5IERhbmllbCBXaGl0ZVxuLy8gICBodHRwOi8vd3d3LnNreXRvcGlhLmNvbS9wcm9qZWN0L2FydGljbGVzL2NvbXBzY2kvY2xpcHBpbmcuaHRtbFxuLy8gVGhhbmtzIVxuLy8gQSBiaXQgbW9kaWZpZWQgdG8gbWluaW1pemUgY29kZSBwYXRoc1xuVm9yb25vaS5wcm90b3R5cGUuY2xpcEVkZ2UgPSBmdW5jdGlvbihlZGdlLCBiYm94KSB7XG4gICAgdmFyIGF4ID0gZWRnZS52YS54LFxuICAgICAgICBheSA9IGVkZ2UudmEueSxcbiAgICAgICAgYnggPSBlZGdlLnZiLngsXG4gICAgICAgIGJ5ID0gZWRnZS52Yi55LFxuICAgICAgICB0MCA9IDAsXG4gICAgICAgIHQxID0gMSxcbiAgICAgICAgZHggPSBieC1heCxcbiAgICAgICAgZHkgPSBieS1heTtcbiAgICAvLyBsZWZ0XG4gICAgdmFyIHEgPSBheC1iYm94LnhsO1xuICAgIGlmIChkeD09PTAgJiYgcTwwKSB7cmV0dXJuIGZhbHNlO31cbiAgICB2YXIgciA9IC1xL2R4O1xuICAgIGlmIChkeDwwKSB7XG4gICAgICAgIGlmIChyPHQwKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI8dDEpIHt0MT1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR4PjApIHtcbiAgICAgICAgaWYgKHI+dDEpIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocj50MCkge3QwPXI7fVxuICAgICAgICB9XG4gICAgLy8gcmlnaHRcbiAgICBxID0gYmJveC54ci1heDtcbiAgICBpZiAoZHg9PT0wICYmIHE8MCkge3JldHVybiBmYWxzZTt9XG4gICAgciA9IHEvZHg7XG4gICAgaWYgKGR4PDApIHtcbiAgICAgICAgaWYgKHI+dDEpIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocj50MCkge3QwPXI7fVxuICAgICAgICB9XG4gICAgZWxzZSBpZiAoZHg+MCkge1xuICAgICAgICBpZiAocjx0MCkge3JldHVybiBmYWxzZTt9XG4gICAgICAgIGlmIChyPHQxKSB7dDE9cjt9XG4gICAgICAgIH1cbiAgICAvLyB0b3BcbiAgICBxID0gYXktYmJveC55dDtcbiAgICBpZiAoZHk9PT0wICYmIHE8MCkge3JldHVybiBmYWxzZTt9XG4gICAgciA9IC1xL2R5O1xuICAgIGlmIChkeTwwKSB7XG4gICAgICAgIGlmIChyPHQwKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI8dDEpIHt0MT1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR5PjApIHtcbiAgICAgICAgaWYgKHI+dDEpIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocj50MCkge3QwPXI7fVxuICAgICAgICB9XG4gICAgLy8gYm90dG9tXG4gICAgcSA9IGJib3gueWItYXk7XG4gICAgaWYgKGR5PT09MCAmJiBxPDApIHtyZXR1cm4gZmFsc2U7fVxuICAgIHIgPSBxL2R5O1xuICAgIGlmIChkeTwwKSB7XG4gICAgICAgIGlmIChyPnQxKSB7cmV0dXJuIGZhbHNlO31cbiAgICAgICAgaWYgKHI+dDApIHt0MD1yO31cbiAgICAgICAgfVxuICAgIGVsc2UgaWYgKGR5PjApIHtcbiAgICAgICAgaWYgKHI8dDApIHtyZXR1cm4gZmFsc2U7fVxuICAgICAgICBpZiAocjx0MSkge3QxPXI7fVxuICAgICAgICB9XG5cbiAgICAvLyBpZiB3ZSByZWFjaCB0aGlzIHBvaW50LCBWb3Jvbm9pIGVkZ2UgaXMgd2l0aGluIGJib3hcblxuICAgIC8vIGlmIHQwID4gMCwgdmEgbmVlZHMgdG8gY2hhbmdlXG4gICAgLy8gcmhpbGwgMjAxMS0wNi0wMzogd2UgbmVlZCB0byBjcmVhdGUgYSBuZXcgdmVydGV4IHJhdGhlclxuICAgIC8vIHRoYW4gbW9kaWZ5aW5nIHRoZSBleGlzdGluZyBvbmUsIHNpbmNlIHRoZSBleGlzdGluZ1xuICAgIC8vIG9uZSBpcyBsaWtlbHkgc2hhcmVkIHdpdGggYXQgbGVhc3QgYW5vdGhlciBlZGdlXG4gICAgaWYgKHQwID4gMCkge1xuICAgICAgICBlZGdlLnZhID0gdGhpcy5jcmVhdGVWZXJ0ZXgoYXgrdDAqZHgsIGF5K3QwKmR5KTtcbiAgICAgICAgfVxuXG4gICAgLy8gaWYgdDEgPCAxLCB2YiBuZWVkcyB0byBjaGFuZ2VcbiAgICAvLyByaGlsbCAyMDExLTA2LTAzOiB3ZSBuZWVkIHRvIGNyZWF0ZSBhIG5ldyB2ZXJ0ZXggcmF0aGVyXG4gICAgLy8gdGhhbiBtb2RpZnlpbmcgdGhlIGV4aXN0aW5nIG9uZSwgc2luY2UgdGhlIGV4aXN0aW5nXG4gICAgLy8gb25lIGlzIGxpa2VseSBzaGFyZWQgd2l0aCBhdCBsZWFzdCBhbm90aGVyIGVkZ2VcbiAgICBpZiAodDEgPCAxKSB7XG4gICAgICAgIGVkZ2UudmIgPSB0aGlzLmNyZWF0ZVZlcnRleChheCt0MSpkeCwgYXkrdDEqZHkpO1xuICAgICAgICB9XG5cbiAgICAvLyB2YSBhbmQvb3IgdmIgd2VyZSBjbGlwcGVkLCB0aHVzIHdlIHdpbGwgbmVlZCB0byBjbG9zZVxuICAgIC8vIGNlbGxzIHdoaWNoIHVzZSB0aGlzIGVkZ2UuXG4gICAgaWYgKCB0MCA+IDAgfHwgdDEgPCAxICkge1xuICAgICAgICB0aGlzLmNlbGxzW2VkZ2UubFNpdGUudm9yb25vaUlkXS5jbG9zZU1lID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jZWxsc1tlZGdlLnJTaXRlLnZvcm9ub2lJZF0uY2xvc2VNZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuLy8gQ29ubmVjdC9jdXQgZWRnZXMgYXQgYm91bmRpbmcgYm94XG5Wb3Jvbm9pLnByb3RvdHlwZS5jbGlwRWRnZXMgPSBmdW5jdGlvbihiYm94KSB7XG4gICAgLy8gY29ubmVjdCBhbGwgZGFuZ2xpbmcgZWRnZXMgdG8gYm91bmRpbmcgYm94XG4gICAgLy8gb3IgZ2V0IHJpZCBvZiB0aGVtIGlmIGl0IGNhbid0IGJlIGRvbmVcbiAgICB2YXIgZWRnZXMgPSB0aGlzLmVkZ2VzLFxuICAgICAgICBpRWRnZSA9IGVkZ2VzLmxlbmd0aCxcbiAgICAgICAgZWRnZSxcbiAgICAgICAgYWJzX2ZuID0gTWF0aC5hYnM7XG5cbiAgICAvLyBpdGVyYXRlIGJhY2t3YXJkIHNvIHdlIGNhbiBzcGxpY2Ugc2FmZWx5XG4gICAgd2hpbGUgKGlFZGdlLS0pIHtcbiAgICAgICAgZWRnZSA9IGVkZ2VzW2lFZGdlXTtcbiAgICAgICAgLy8gZWRnZSBpcyByZW1vdmVkIGlmOlxuICAgICAgICAvLyAgIGl0IGlzIHdob2xseSBvdXRzaWRlIHRoZSBib3VuZGluZyBib3hcbiAgICAgICAgLy8gICBpdCBpcyBsb29raW5nIG1vcmUgbGlrZSBhIHBvaW50IHRoYW4gYSBsaW5lXG4gICAgICAgIGlmICghdGhpcy5jb25uZWN0RWRnZShlZGdlLCBiYm94KSB8fFxuICAgICAgICAgICAgIXRoaXMuY2xpcEVkZ2UoZWRnZSwgYmJveCkgfHxcbiAgICAgICAgICAgIChhYnNfZm4oZWRnZS52YS54LWVkZ2UudmIueCk8MWUtOSAmJiBhYnNfZm4oZWRnZS52YS55LWVkZ2UudmIueSk8MWUtOSkpIHtcbiAgICAgICAgICAgIGVkZ2UudmEgPSBlZGdlLnZiID0gbnVsbDtcbiAgICAgICAgICAgIGVkZ2VzLnNwbGljZShpRWRnZSwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbi8vIENsb3NlIHRoZSBjZWxscy5cbi8vIFRoZSBjZWxscyBhcmUgYm91bmQgYnkgdGhlIHN1cHBsaWVkIGJvdW5kaW5nIGJveC5cbi8vIEVhY2ggY2VsbCByZWZlcnMgdG8gaXRzIGFzc29jaWF0ZWQgc2l0ZSwgYW5kIGEgbGlzdFxuLy8gb2YgaGFsZmVkZ2VzIG9yZGVyZWQgY291bnRlcmNsb2Nrd2lzZS5cblZvcm9ub2kucHJvdG90eXBlLmNsb3NlQ2VsbHMgPSBmdW5jdGlvbihiYm94KSB7XG4gICAgdmFyIHhsID0gYmJveC54bCxcbiAgICAgICAgeHIgPSBiYm94LnhyLFxuICAgICAgICB5dCA9IGJib3gueXQsXG4gICAgICAgIHliID0gYmJveC55YixcbiAgICAgICAgY2VsbHMgPSB0aGlzLmNlbGxzLFxuICAgICAgICBpQ2VsbCA9IGNlbGxzLmxlbmd0aCxcbiAgICAgICAgY2VsbCxcbiAgICAgICAgaUxlZnQsXG4gICAgICAgIGhhbGZlZGdlcywgbkhhbGZlZGdlcyxcbiAgICAgICAgZWRnZSxcbiAgICAgICAgdmEsIHZiLCB2eixcbiAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQsXG4gICAgICAgIGFic19mbiA9IE1hdGguYWJzO1xuXG4gICAgd2hpbGUgKGlDZWxsLS0pIHtcbiAgICAgICAgY2VsbCA9IGNlbGxzW2lDZWxsXTtcbiAgICAgICAgLy8gcHJ1bmUsIG9yZGVyIGhhbGZlZGdlcyBjb3VudGVyY2xvY2t3aXNlLCB0aGVuIGFkZCBtaXNzaW5nIG9uZXNcbiAgICAgICAgLy8gcmVxdWlyZWQgdG8gY2xvc2UgY2VsbHNcbiAgICAgICAgaWYgKCFjZWxsLnByZXBhcmVIYWxmZWRnZXMoKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIGlmICghY2VsbC5jbG9zZU1lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgLy8gZmluZCBmaXJzdCAndW5jbG9zZWQnIHBvaW50LlxuICAgICAgICAvLyBhbiAndW5jbG9zZWQnIHBvaW50IHdpbGwgYmUgdGhlIGVuZCBwb2ludCBvZiBhIGhhbGZlZGdlIHdoaWNoXG4gICAgICAgIC8vIGRvZXMgbm90IG1hdGNoIHRoZSBzdGFydCBwb2ludCBvZiB0aGUgZm9sbG93aW5nIGhhbGZlZGdlXG4gICAgICAgIGhhbGZlZGdlcyA9IGNlbGwuaGFsZmVkZ2VzO1xuICAgICAgICBuSGFsZmVkZ2VzID0gaGFsZmVkZ2VzLmxlbmd0aDtcbiAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBvbmx5IG9uZSBzaXRlLCBpbiB3aGljaCBjYXNlLCB0aGUgdmlld3BvcnQgaXMgdGhlIGNlbGxcbiAgICAgICAgLy8gLi4uXG5cbiAgICAgICAgLy8gYWxsIG90aGVyIGNhc2VzXG4gICAgICAgIGlMZWZ0ID0gMDtcbiAgICAgICAgd2hpbGUgKGlMZWZ0IDwgbkhhbGZlZGdlcykge1xuICAgICAgICAgICAgdmEgPSBoYWxmZWRnZXNbaUxlZnRdLmdldEVuZHBvaW50KCk7XG4gICAgICAgICAgICB2eiA9IGhhbGZlZGdlc1soaUxlZnQrMSkgJSBuSGFsZmVkZ2VzXS5nZXRTdGFydHBvaW50KCk7XG4gICAgICAgICAgICAvLyBpZiBlbmQgcG9pbnQgaXMgbm90IGVxdWFsIHRvIHN0YXJ0IHBvaW50LCB3ZSBuZWVkIHRvIGFkZCB0aGUgbWlzc2luZ1xuICAgICAgICAgICAgLy8gaGFsZmVkZ2UocykgdXAgdG8gdnpcbiAgICAgICAgICAgIGlmIChhYnNfZm4odmEueC12ei54KT49MWUtOSB8fCBhYnNfZm4odmEueS12ei55KT49MWUtOSkge1xuXG4gICAgICAgICAgICAgICAgLy8gcmhpbGwgMjAxMy0xMi0wMjpcbiAgICAgICAgICAgICAgICAvLyBcIkhvbGVzXCIgaW4gdGhlIGhhbGZlZGdlcyBhcmUgbm90IG5lY2Vzc2FyaWx5IGFsd2F5cyBhZGphY2VudC5cbiAgICAgICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29yaGlsbC9KYXZhc2NyaXB0LVZvcm9ub2kvaXNzdWVzLzE2XG5cbiAgICAgICAgICAgICAgICAvLyBmaW5kIGVudHJ5IHBvaW50OlxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgZG93bndhcmQgYWxvbmcgbGVmdCBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLngseGwpICYmIHRoaXMubGVzc1RoYW5XaXRoRXBzaWxvbih2YS55LHliKTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4bCwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayByaWdodHdhcmQgYWxvbmcgYm90dG9tIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odmEueSx5YikgJiYgdGhpcy5sZXNzVGhhbldpdGhFcHNpbG9uKHZhLngseHIpOlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueSx5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KGxhc3RCb3JkZXJTZWdtZW50ID8gdnoueCA6IHhyLCB5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIHVwd2FyZCBhbG9uZyByaWdodCBzaWRlXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZhLngseHIpICYmIHRoaXMuZ3JlYXRlclRoYW5XaXRoRXBzaWxvbih2YS55LHl0KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gd2FsayBsZWZ0d2FyZCBhbG9uZyB0b3Agc2lkZVxuICAgICAgICAgICAgICAgICAgICBjYXNlIHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2YS55LHl0KSAmJiB0aGlzLmdyZWF0ZXJUaGFuV2l0aEVwc2lsb24odmEueCx4bCk6XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0Qm9yZGVyU2VnbWVudCA9IHRoaXMuZXF1YWxXaXRoRXBzaWxvbih2ei55LHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZiID0gdGhpcy5jcmVhdGVWZXJ0ZXgobGFzdEJvcmRlclNlZ21lbnQgPyB2ei54IDogeGwsIHl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2UgPSB0aGlzLmNyZWF0ZUJvcmRlckVkZ2UoY2VsbC5zaXRlLCB2YSwgdmIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaUxlZnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbGZlZGdlcy5zcGxpY2UoaUxlZnQsIDAsIHRoaXMuY3JlYXRlSGFsZmVkZ2UoZWRnZSwgY2VsbC5zaXRlLCBudWxsKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuSGFsZmVkZ2VzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGxhc3RCb3JkZXJTZWdtZW50ICkgeyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmEgPSB2YjtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZhbGwgdGhyb3VnaFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YWxrIGRvd253YXJkIGFsb25nIGxlZnQgc2lkZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdEJvcmRlclNlZ21lbnQgPSB0aGlzLmVxdWFsV2l0aEVwc2lsb24odnoueCx4bCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YiA9IHRoaXMuY3JlYXRlVmVydGV4KHhsLCBsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnkgOiB5Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlZGdlID0gdGhpcy5jcmVhdGVCb3JkZXJFZGdlKGNlbGwuc2l0ZSwgdmEsIHZiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlMZWZ0Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYWxmZWRnZXMuc3BsaWNlKGlMZWZ0LCAwLCB0aGlzLmNyZWF0ZUhhbGZlZGdlKGVkZ2UsIGNlbGwuc2l0ZSwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbkhhbGZlZGdlcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBsYXN0Qm9yZGVyU2VnbWVudCApIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhID0gdmI7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FsayByaWdodHdhcmQgYWxvbmcgYm90dG9tIHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LnkseWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleChsYXN0Qm9yZGVyU2VnbWVudCA/IHZ6LnggOiB4ciwgeWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YSA9IHZiO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmFsbCB0aHJvdWdoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdhbGsgdXB3YXJkIGFsb25nIHJpZ2h0IHNpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RCb3JkZXJTZWdtZW50ID0gdGhpcy5lcXVhbFdpdGhFcHNpbG9uKHZ6LngseHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmIgPSB0aGlzLmNyZWF0ZVZlcnRleCh4ciwgbGFzdEJvcmRlclNlZ21lbnQgPyB2ei55IDogeXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHRoaXMuY3JlYXRlQm9yZGVyRWRnZShjZWxsLnNpdGUsIHZhLCB2Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFsZmVkZ2VzLnNwbGljZShpTGVmdCwgMCwgdGhpcy5jcmVhdGVIYWxmZWRnZShlZGdlLCBjZWxsLnNpdGUsIG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5IYWxmZWRnZXMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbGFzdEJvcmRlclNlZ21lbnQgKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsIHRocm91Z2hcblxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJWb3Jvbm9pLmNsb3NlQ2VsbHMoKSA+IHRoaXMgbWFrZXMgbm8gc2Vuc2UhXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBpTGVmdCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICBjZWxsLmNsb3NlTWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGVidWdnaW5nIGhlbHBlclxuLypcblZvcm9ub2kucHJvdG90eXBlLmR1bXBCZWFjaGxpbmUgPSBmdW5jdGlvbih5KSB7XG4gICAgY29uc29sZS5sb2coJ1Zvcm9ub2kuZHVtcEJlYWNobGluZSglZikgPiBCZWFjaHNlY3Rpb25zLCBmcm9tIGxlZnQgdG8gcmlnaHQ6JywgeSk7XG4gICAgaWYgKCAhdGhpcy5iZWFjaGxpbmUgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIE5vbmUnKTtcbiAgICAgICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgYnMgPSB0aGlzLmJlYWNobGluZS5nZXRGaXJzdCh0aGlzLmJlYWNobGluZS5yb290KTtcbiAgICAgICAgd2hpbGUgKCBicyApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIHNpdGUgJWQ6IHhsOiAlZiwgeHI6ICVmJywgYnMuc2l0ZS52b3Jvbm9pSWQsIHRoaXMubGVmdEJyZWFrUG9pbnQoYnMsIHkpLCB0aGlzLnJpZ2h0QnJlYWtQb2ludChicywgeSkpO1xuICAgICAgICAgICAgYnMgPSBicy5yYk5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuKi9cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBIZWxwZXI6IFF1YW50aXplIHNpdGVzXG5cbi8vIHJoaWxsIDIwMTMtMTAtMTI6XG4vLyBUaGlzIGlzIHRvIHNvbHZlIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3JoaWxsL0phdmFzY3JpcHQtVm9yb25vaS9pc3N1ZXMvMTVcbi8vIFNpbmNlIG5vdCBhbGwgdXNlcnMgd2lsbCBlbmQgdXAgdXNpbmcgdGhlIGtpbmQgb2YgY29vcmQgdmFsdWVzIHdoaWNoIHdvdWxkXG4vLyBjYXVzZSB0aGUgaXNzdWUgdG8gYXJpc2UsIEkgY2hvc2UgdG8gbGV0IHRoZSB1c2VyIGRlY2lkZSB3aGV0aGVyIG9yIG5vdFxuLy8gaGUgc2hvdWxkIHNhbml0aXplIGhpcyBjb29yZCB2YWx1ZXMgdGhyb3VnaCB0aGlzIGhlbHBlci4gVGhpcyB3YXksIGZvclxuLy8gdGhvc2UgdXNlcnMgd2hvIHVzZXMgY29vcmQgdmFsdWVzIHdoaWNoIGFyZSBrbm93biB0byBiZSBmaW5lLCBubyBvdmVyaGVhZCBpc1xuLy8gYWRkZWQuXG5cblZvcm9ub2kucHJvdG90eXBlLnF1YW50aXplU2l0ZXMgPSBmdW5jdGlvbihzaXRlcykge1xuICAgIHZhciDOtSA9IHRoaXMuzrUsXG4gICAgICAgIG4gPSBzaXRlcy5sZW5ndGgsXG4gICAgICAgIHNpdGU7XG4gICAgd2hpbGUgKCBuLS0gKSB7XG4gICAgICAgIHNpdGUgPSBzaXRlc1tuXTtcbiAgICAgICAgc2l0ZS54ID0gTWF0aC5mbG9vcihzaXRlLnggLyDOtSkgKiDOtTtcbiAgICAgICAgc2l0ZS55ID0gTWF0aC5mbG9vcihzaXRlLnkgLyDOtSkgKiDOtTtcbiAgICAgICAgfVxuICAgIH07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gSGVscGVyOiBSZWN5Y2xlIGRpYWdyYW06IGFsbCB2ZXJ0ZXgsIGVkZ2UgYW5kIGNlbGwgb2JqZWN0cyBhcmVcbi8vIFwic3VycmVuZGVyZWRcIiB0byB0aGUgVm9yb25vaSBvYmplY3QgZm9yIHJldXNlLlxuLy8gVE9ETzogcmhpbGwtdm9yb25vaS1jb3JlIHYyOiBtb3JlIHBlcmZvcm1hbmNlIHRvIGJlIGdhaW5lZFxuLy8gd2hlbiBJIGNoYW5nZSB0aGUgc2VtYW50aWMgb2Ygd2hhdCBpcyByZXR1cm5lZC5cblxuVm9yb25vaS5wcm90b3R5cGUucmVjeWNsZSA9IGZ1bmN0aW9uKGRpYWdyYW0pIHtcbiAgICBpZiAoIGRpYWdyYW0gKSB7XG4gICAgICAgIGlmICggZGlhZ3JhbSBpbnN0YW5jZW9mIHRoaXMuRGlhZ3JhbSApIHtcbiAgICAgICAgICAgIHRoaXMudG9SZWN5Y2xlID0gZGlhZ3JhbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyAnVm9yb25vaS5yZWN5Y2xlRGlhZ3JhbSgpID4gTmVlZCBhIERpYWdyYW0gb2JqZWN0Lic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFRvcC1sZXZlbCBGb3J0dW5lIGxvb3BcblxuLy8gcmhpbGwgMjAxMS0wNS0xOTpcbi8vICAgVm9yb25vaSBzaXRlcyBhcmUga2VwdCBjbGllbnQtc2lkZSBub3csIHRvIGFsbG93XG4vLyAgIHVzZXIgdG8gZnJlZWx5IG1vZGlmeSBjb250ZW50LiBBdCBjb21wdXRlIHRpbWUsXG4vLyAgICpyZWZlcmVuY2VzKiB0byBzaXRlcyBhcmUgY29waWVkIGxvY2FsbHkuXG5cblZvcm9ub2kucHJvdG90eXBlLmNvbXB1dGUgPSBmdW5jdGlvbihzaXRlcywgYmJveCkge1xuICAgIC8vIHRvIG1lYXN1cmUgZXhlY3V0aW9uIHRpbWVcbiAgICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIC8vIGluaXQgaW50ZXJuYWwgc3RhdGVcbiAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAvLyBhbnkgZGlhZ3JhbSBkYXRhIGF2YWlsYWJsZSBmb3IgcmVjeWNsaW5nP1xuICAgIC8vIEkgZG8gdGhhdCBoZXJlIHNvIHRoYXQgdGhpcyBpcyBpbmNsdWRlZCBpbiBleGVjdXRpb24gdGltZVxuICAgIGlmICggdGhpcy50b1JlY3ljbGUgKSB7XG4gICAgICAgIHRoaXMudmVydGV4SnVua3lhcmQgPSB0aGlzLnZlcnRleEp1bmt5YXJkLmNvbmNhdCh0aGlzLnRvUmVjeWNsZS52ZXJ0aWNlcyk7XG4gICAgICAgIHRoaXMuZWRnZUp1bmt5YXJkID0gdGhpcy5lZGdlSnVua3lhcmQuY29uY2F0KHRoaXMudG9SZWN5Y2xlLmVkZ2VzKTtcbiAgICAgICAgdGhpcy5jZWxsSnVua3lhcmQgPSB0aGlzLmNlbGxKdW5reWFyZC5jb25jYXQodGhpcy50b1JlY3ljbGUuY2VsbHMpO1xuICAgICAgICB0aGlzLnRvUmVjeWNsZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgc2l0ZSBldmVudCBxdWV1ZVxuICAgIHZhciBzaXRlRXZlbnRzID0gc2l0ZXMuc2xpY2UoMCk7XG4gICAgc2l0ZUV2ZW50cy5zb3J0KGZ1bmN0aW9uKGEsYil7XG4gICAgICAgIHZhciByID0gYi55IC0gYS55O1xuICAgICAgICBpZiAocikge3JldHVybiByO31cbiAgICAgICAgcmV0dXJuIGIueCAtIGEueDtcbiAgICAgICAgfSk7XG5cbiAgICAvLyBwcm9jZXNzIHF1ZXVlXG4gICAgdmFyIHNpdGUgPSBzaXRlRXZlbnRzLnBvcCgpLFxuICAgICAgICBzaXRlaWQgPSAwLFxuICAgICAgICB4c2l0ZXgsIC8vIHRvIGF2b2lkIGR1cGxpY2F0ZSBzaXRlc1xuICAgICAgICB4c2l0ZXksXG4gICAgICAgIGNlbGxzID0gdGhpcy5jZWxscyxcbiAgICAgICAgY2lyY2xlO1xuXG4gICAgLy8gbWFpbiBsb29wXG4gICAgZm9yICg7Oykge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGZpZ3VyZSB3aGV0aGVyIHdlIGhhbmRsZSBhIHNpdGUgb3IgY2lyY2xlIGV2ZW50XG4gICAgICAgIC8vIGZvciB0aGlzIHdlIGZpbmQgb3V0IGlmIHRoZXJlIGlzIGEgc2l0ZSBldmVudCBhbmQgaXQgaXNcbiAgICAgICAgLy8gJ2VhcmxpZXInIHRoYW4gdGhlIGNpcmNsZSBldmVudFxuICAgICAgICBjaXJjbGUgPSB0aGlzLmZpcnN0Q2lyY2xlRXZlbnQ7XG5cbiAgICAgICAgLy8gYWRkIGJlYWNoIHNlY3Rpb25cbiAgICAgICAgaWYgKHNpdGUgJiYgKCFjaXJjbGUgfHwgc2l0ZS55IDwgY2lyY2xlLnkgfHwgKHNpdGUueSA9PT0gY2lyY2xlLnkgJiYgc2l0ZS54IDwgY2lyY2xlLngpKSkge1xuICAgICAgICAgICAgLy8gb25seSBpZiBzaXRlIGlzIG5vdCBhIGR1cGxpY2F0ZVxuICAgICAgICAgICAgaWYgKHNpdGUueCAhPT0geHNpdGV4IHx8IHNpdGUueSAhPT0geHNpdGV5KSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgY3JlYXRlIGNlbGwgZm9yIG5ldyBzaXRlXG4gICAgICAgICAgICAgICAgY2VsbHNbc2l0ZWlkXSA9IHRoaXMuY3JlYXRlQ2VsbChzaXRlKTtcbiAgICAgICAgICAgICAgICBzaXRlLnZvcm9ub2lJZCA9IHNpdGVpZCsrO1xuICAgICAgICAgICAgICAgIC8vIHRoZW4gY3JlYXRlIGEgYmVhY2hzZWN0aW9uIGZvciB0aGF0IHNpdGVcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEJlYWNoc2VjdGlvbihzaXRlKTtcbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciBsYXN0IHNpdGUgY29vcmRzIHRvIGRldGVjdCBkdXBsaWNhdGVcbiAgICAgICAgICAgICAgICB4c2l0ZXkgPSBzaXRlLnk7XG4gICAgICAgICAgICAgICAgeHNpdGV4ID0gc2l0ZS54O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpdGUgPSBzaXRlRXZlbnRzLnBvcCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlbW92ZSBiZWFjaCBzZWN0aW9uXG4gICAgICAgIGVsc2UgaWYgKGNpcmNsZSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCZWFjaHNlY3Rpb24oY2lyY2xlLmFyYyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgLy8gYWxsIGRvbmUsIHF1aXRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgLy8gd3JhcHBpbmctdXA6XG4gICAgLy8gICBjb25uZWN0IGRhbmdsaW5nIGVkZ2VzIHRvIGJvdW5kaW5nIGJveFxuICAgIC8vICAgY3V0IGVkZ2VzIGFzIHBlciBib3VuZGluZyBib3hcbiAgICAvLyAgIGRpc2NhcmQgZWRnZXMgY29tcGxldGVseSBvdXRzaWRlIGJvdW5kaW5nIGJveFxuICAgIC8vICAgZGlzY2FyZCBlZGdlcyB3aGljaCBhcmUgcG9pbnQtbGlrZVxuICAgIHRoaXMuY2xpcEVkZ2VzKGJib3gpO1xuXG4gICAgLy8gICBhZGQgbWlzc2luZyBlZGdlcyBpbiBvcmRlciB0byBjbG9zZSBvcGVuZWQgY2VsbHNcbiAgICB0aGlzLmNsb3NlQ2VsbHMoYmJveCk7XG5cbiAgICAvLyB0byBtZWFzdXJlIGV4ZWN1dGlvbiB0aW1lXG4gICAgdmFyIHN0b3BUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIC8vIHByZXBhcmUgcmV0dXJuIHZhbHVlc1xuICAgIHZhciBkaWFncmFtID0gbmV3IHRoaXMuRGlhZ3JhbSgpO1xuICAgIGRpYWdyYW0uY2VsbHMgPSB0aGlzLmNlbGxzO1xuICAgIGRpYWdyYW0uZWRnZXMgPSB0aGlzLmVkZ2VzO1xuICAgIGRpYWdyYW0udmVydGljZXMgPSB0aGlzLnZlcnRpY2VzO1xuICAgIGRpYWdyYW0uZXhlY1RpbWUgPSBzdG9wVGltZS5nZXRUaW1lKCktc3RhcnRUaW1lLmdldFRpbWUoKTtcblxuICAgIC8vIGNsZWFuIHVwXG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgcmV0dXJuIGRpYWdyYW07XG4gICAgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBWb3Jvbm9pO1xuIl19

Reveal.addEventListener( 'slidechanged', function( event ) {
  // event.previousSlide, event.currentSlide, event.indexh, event.indexv
  if(event.currentSlide.id === 'd3-chord-diagram') {
    d3_chord_diagram();
  } else if(event.currentSlide.id === 'd3-streamgraph') {
    d3_streamgraph();
  } else if(event.currentSlide.id === 'd3-bar-chart') {
    d3_bar_chart();
  }
});

d3_chord_diagram.initialized = false;
function d3_chord_diagram() {
  if( d3_chord_diagram.initialized ) {
    return true;
  } else {
    d3_chord_diagram.initialized = true;
  }

  // From http://mkweb.bcgsc.ca/circos/guide/tables/
  var matrix = [
    [11975,  5871, 8916, 2868],
    [ 1951, 10048, 2060, 6171],
    [ 8010, 16145, 8090, 8045],
    [ 1013,   990,  940, 6907]
  ];

  var chord = d3.layout.chord()
  .padding(.05)
  .sortSubgroups(d3.descending)
  .matrix(matrix);

  var width = 960,
  height = 500,
  innerRadius = Math.min(width, height) * .41,
  outerRadius = innerRadius * 1.1;

  var fill = d3.scale.ordinal()
  .domain(d3.range(4))
  .range(["#222222", "#FFDD89", "#957244", "#F26223"]);

  var svg = d3.select("#d3-chord-diagram-container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg.append("g").selectAll("path")
  .data(chord.groups)
  .enter().append("path")
  .style("fill", function(d) { return fill(d.index); })
  .style("stroke", function(d) { return fill(d.index); })
  .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
  .on("mouseover", fade(.1))
  .on("mouseout", fade(1));

  var ticks = svg.append("g").selectAll("g")
  .data(chord.groups)
  .enter().append("g").selectAll("g")
  .data(groupTicks)
  .enter().append("g")
  .attr("transform", function(d) {
    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
    + "translate(" + outerRadius + ",0)";
  });

  svg.append("g")
  .attr("class", "chord")
  .selectAll("path")
  .data(chord.chords)
  .enter().append("path")
  .attr("d", d3.svg.chord().radius(innerRadius))
  .style("fill", function(d) { return fill(d.target.index); })
  .style("opacity", 1);

  // Returns an array of tick angles and labels, given a group.
  function groupTicks(d) {
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, 1000).map(function(v, i) {
      return {
        angle: v * k + d.startAngle,
        label: i % 5 ? null : v / 1000 + "k"
      };
    });
  }

  // Returns an event handler for fading a given chord group.
  function fade(opacity) {
    return function(g, i) {
      svg.selectAll(".chord path")
      .filter(function(d) { return d.source.index != i && d.target.index != i; })
      .transition()
      .style("opacity", opacity);
    };
  }
}

d3_streamgraph.initialized = false;
function d3_streamgraph() {
  if( d3_streamgraph.initialized ) {
    return true;
  } else {
    d3_streamgraph.initialized = true;
  }
  var n = 20, // number of layers
  m = 200, // number of samples per layer
  stack = d3.layout.stack().offset("wiggle"),
  layers0 = stack(d3.range(n).map(function() { return bumpLayer(m); })),
  layers1 = stack(d3.range(n).map(function() { return bumpLayer(m); }));

  var width = 960,
  height = 500;

  var x = d3.scale.linear()
  .domain([0, m - 1])
  .range([0, width]);

  var y = d3.scale.linear()
  .domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
  .range([height, 0]);

  var color = d3.scale.linear()
  .range(["#aad", "#556"]);

  var area = d3.svg.area()
  .x(function(d) { return x(d.x); })
  .y0(function(d) { return y(d.y0); })
  .y1(function(d) { return y(d.y0 + d.y); });

  var svg = d3.select("#d3-streamgraph-container").append("svg")
  .attr("width", width)
  .attr("height", height);

  svg.selectAll("path")
  .data(layers0)
  .enter().append("path")
  .attr("d", area)
  .style("fill", function() { return color(Math.random()); });

  function transition() {
    d3.selectAll("path")
    .data(function() {
      var d = layers1;
      layers1 = layers0;
      return layers0 = d;
    })
    .transition()
    .duration(2500)
    .attr("d", area);
  }
  setTimeout(transition, 100);
  setTimeout(transition, 3500);
  setTimeout(transition, 7500);

  // Inspired by Lee Byron's test data generator.
  function bumpLayer(n) {

    function bump(a) {
      var x = 1 / (.1 + Math.random()),
      y = 2 * Math.random() - .5,
      z = 10 / (.1 + Math.random());
      for (var i = 0; i < n; i++) {
        var w = (i / n - y) * z;
        a[i] += x * Math.exp(-w * w);
      }
    }

    var a = [], i;
    for (i = 0; i < n; ++i) a[i] = 0;
    for (i = 0; i < 5; ++i) bump(a);
    return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
  }
}

d3_bar_chart.initialized = false;
function d3_bar_chart() {
  if( d3_bar_chart.initialized ) {
    return true;
  } else {
    d3_bar_chart.initialized = true;
  }
  var margin = {top: 20, right: 20, bottom: 40, left: 80},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
  .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
  .range([height, 0]);

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left")
  .ticks(10, "%");

  var svg = d3.select("#d3-bar-chart-container").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var func = function(error, data) {
    x.domain(data.map(function(d) { return d.letter; }));
    y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Frequency");

    svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.letter); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.frequency); })
    .attr("height", function(d) { return height - y(d.frequency); });

  }
  var array = [
    {letter: 'A', frequency: '.08167'},
    {letter: 'B', frequency: '.220'},
    {letter: 'C', frequency: '.02782'},
    {letter: 'D', frequency: '.04253'},
    {letter: 'E', frequency: '.12702'},
    {letter: 'F', frequency: '.02288'},
    {letter: 'G', frequency: '.02015'},
    {letter: 'H', frequency: '.06094'},
    {letter: 'I', frequency: '.06966'},
    {letter: 'J', frequency: '.00153'},
    {letter: 'K', frequency: '.00772'},
    {letter: 'L', frequency: '.04025'}
  ]
  func(null, array);

  function type(d) {
    d.frequency = +d.frequency;
    return d;
  }

}


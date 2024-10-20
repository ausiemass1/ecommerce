document.addEventListener('DOMContentLoaded', function () {
  const data = ratingsData.map(d => ({ rating: d.rating, count: d.count }));

  const width = 400;
  const height = 400;
  const radius = Math.min(width, height) / 2;

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.rating))
    .range(d3.schemeCategory10);  // Predefined color palette

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie()
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const arcs = svg.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.rating));

  arcs.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .text(d => `Rating ${d.data.rating}`);
});

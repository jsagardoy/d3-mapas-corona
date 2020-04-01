import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { stats, stats23March } from "./stats";

const getMaxAffected = data =>
  data.reduce((max, item) => (item.value > max ? item.value : max), 0);

const colorValue = (comunidad: string, data) => {
  const colorRange = [
    "#e44a46",
    "#dc4340",
    "#d33a3a",
    "#cb3234",
    "#c3292e",
    "#ba1f28",
    "#b21322"
  ];

  const entry = data.find(item => item.name === comunidad);

  const rangeLength: number = colorRange.length;
  const colorElements= colorRange.map((elem, i) => i);
  const colorDomain =  colorElements.map(elem=>elem/rangeLength*getMaxAffected(data));

  const colorScale = d3
    .scaleLinear<string>()
    .domain(colorDomain)
    .range(colorRange);

  return entry ? colorScale(entry.value) : null;
};

const calculateRadiusBasedOnAffectedCases = (d, data) => {
  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, getMaxAffected(data)])
    .range([0, 50]); // 50 pixel max radius, we could calculate it relative to width and height

  const entry = data.find(item => item.name === d.name);

  return entry ? affectedRadiusScale(entry.value) : 0;
};

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

const aProjection = d3Composite
  .geoConicConformalSpain()
  // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // data loaded from json file
  .attr("d", geoPath as any);

svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  .transition()
  .duration(2000)
  .attr("class", "affected-marker")
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d, stats))
  .attr("cx", d => aProjection([d.long, d.lat])[0])
  .attr("cy", d => aProjection([d.long, d.lat])[1])
  .attr("fill", d => colorValue(d.name, stats));

const updateRadius = data => {
  svg
    .selectAll("circle")
    .data(latLongCommunities)
    .attr("class", "affected-marker")
    .transition()
    .duration(1000)
    .attr("r", d => calculateRadiusBasedOnAffectedCases(d, data))
    .attr("cx", d => aProjection([d.long, d.lat])[0])
    .attr("cy", d => aProjection([d.long, d.lat])[1])
    .attr("fill", d => colorValue(d.name, data));
};

// Here with the buttom in HTML "1 March", the map of infected people in that date will be displayed
document
  .getElementById("1March")
  .addEventListener("click", function handleInfected1March() {
    updateRadius(stats);
  });

// Here with the buttom in HTML "23 March", the map of infected people in that date will be displayed
document
  .getElementById("23March")
  .addEventListener("click", function handleInfected23March() {
    updateRadius(stats23March);
  });

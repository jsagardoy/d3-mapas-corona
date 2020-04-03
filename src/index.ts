import * as d3 from "d3";
import * as topojson from "topojson-client";
const spainjson = require("./spain.json");
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { stats, stats23March } from "./stats";

const mapColorRange = [
  "#F8F8FF",
  "#CCCCFF",
  "#6495ED",
  "#779ECB",
  "#007FFF",
  "#5B92E5",
  "#318CE7",
  "#0000FF",
  "#2A52BE",
  "#002FA7",
  "#003399",
  "#00009C",
  "#120A8F",
  "#00008B",
  "#000080",
  "#1560BD",
  "#536878"
];

const numberOfCommunities = stats.length;

const countryColor = d3
  .scaleLinear<string>()
  .domain([1, numberOfCommunities])
  .range(mapColorRange);

const getMaxAffected = data =>
  data.reduce((max, item) => (item.value > max ? item.value : max), 0);

const getMinAffected = data => {
  const maxValue = getMaxAffected(data);
  return data.reduce((min, item) => (item.value < min ? item.value : min), maxValue);
};
const colorValue = (comunidad: string, data) => {
  const colorRange = [
    "#fddeda",
    "#f8beb6",
    "#f09e94",
    "#e67d72",
    "#da5b52",
    "#cb3234",
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
  const colorElements = colorRange.map((elem, i) => i);
  const colorDomain = colorElements.map(
    elem => (elem / rangeLength) * getMaxAffected(data)
  );

  const colorScale = d3
    .scaleLinear<string>()
    .domain(colorDomain)
    .range(colorRange);

  return entry ? colorScale(entry.value) : null;
};

const calculateRadiusBasedOnAffectedCases = (d, data) => {
  const affectedRadiusScale = d3
    .scaleLinear()
    .domain([0, getMinAffected(stats), getMaxAffected(stats23March)])
    .range([0,2, 50]); // 50 pixel max radius, we could calculate it relative to width and height

  const entry = data.find(item => item.name === d.name);

  return entry ? affectedRadiusScale(entry.value) : 0;
};

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FFFFFF");

const aProjection = d3Composite
  .geoConicConformalSpain()
  .scale(3300)
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(spainjson, spainjson.objects.ESP_adm1);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("fill", function(d, i) {
    return countryColor(i);
  })
  .attr("stroke-width", 1)
  .attr("stroke", "black")
  .attr("d", geoPath as any);

svg.selectAll();

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

document
  .getElementById("1March")
  .addEventListener("click", function handleInfected1March() {
    updateRadius(stats);
  });

document
  .getElementById("23March")
  .addEventListener("click", function handleInfected23March() {
    updateRadius(stats23March);
  });

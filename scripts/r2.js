
// const d3 = require("./d3.min.js");

const width = 500,
  height = 500;
const margin = { top: 33, right: 5, bottom: 35, left: 50 },
  innerWidth = width - margin.left - margin.right,
  innerHeight = width - margin.top - margin.bottom;

const n = 10;
// number of groups (limit 12, please)
const groupNumber = 3;
const groups = "abcdefghijkl".split("").slice(0,groupNumber);
const minY = 0, maxY = 40;
const minAllowedGroupMean = 10;
const maxAllowedGroupMean = 30;
let groupMeans = Array(groupNumber).fill(20);
const maxSigma = 5;
let sigma = 2.5;

// set up x-scale now
const x = d3.scaleBand()
  .range([0, innerWidth]);
x.domain(groups);

const data = generateData(x, groups, groupMeans, n, sigma);

const [sse, ssm, sst, r2] = sumSquares(data);

document.querySelector("#sse-value").innerHTML = precisionRound(sse, 2);
document.querySelector("#ssm-value").innerHTML = precisionRound(ssm, 2);
document.querySelector("#sst-value").innerHTML = precisionRound(sst, 2);
document.querySelector("#r2-value").innerHTML = precisionRound(r2, 4);

document.querySelector("#resample")
  .addEventListener("click", resampleHandler);

document.querySelector("#sigma")
  .addEventListener("input", sigmaHandler);

document.querySelector("#sse")
  .addEventListener("click", sseHandler);

document.querySelector("#ssm")
  .addEventListener("click", ssmHandler);

document.querySelector("#sst")
  .addEventListener("click", sstHandler);

document.querySelector("#groupMeans")
  .addEventListener("click", groupMeansHandler);


const svg = d3.select(".chart")
  .append("svg")
  .attr("width", innerWidth + margin.left + margin.right)
  .attr("height", innerHeight + margin.top + margin.bottom);
const svgInside = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`)
  .classed("innersvg", true);


const y = d3.scaleLinear()
  .range([innerHeight, 0]);

const xAxis = d3.axisBottom()
  .scale(x);

const yAxis = d3.axisLeft()
  .scale(y);

const yaxistext = "y";
svgInside.append("text")
  .attr("class", "axistext")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x", 0 - (innerHeight / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text(yaxistext);

const [minMean, maxMean] = d3.extent(groupMeans);
y.domain([minY, maxY]);

svgInside.append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(xAxis);
svgInside.append("g")
  .attr("class", "y axis")
  .call(yAxis);

drawAll(data);
document.querySelector("#sigmavalue")
  .innerHTML = `Sigma: ${sigma}`;
document.querySelector("#sigma").value = sigma.toFixed(2);

// FUNCTIONS .........................................................
function gaussian(a, b) {
  return {
    u: Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b),
    v: Math.sqrt(-2 * Math.log(a)) * Math.sin(2 * Math.PI * b)
  };
}

function gaussianArray(n, mu, sigma) {
  let data = [];
  while (data.length < n) {
    let u1 = Math.random();
    let u2 = Math.random();
    let { u, v } = gaussian(u1, u2);
    let x = mu + sigma * u;
    let y = mu + sigma * v;
    data.push(x);
    if (data.length < n) data.push(y);
  }
  return data;
}

function meanOfAll(data) {
  let allYs = [];
  data.forEach(group => {
    allYs = allYs.concat(group.yvals);
  });
  return d3.mean(allYs);
}

function sumSquares(data) {
  let SSM = 0, SST = 0;
  let allYs = [];
  data.forEach(group => {
    allYs = allYs.concat(group.yvals);
  });
  const ybb = d3.mean(allYs);
  //SST = allYs.reduce((acc, y) => acc + (y - ybb) * (y - ybb));
  for (let i = 0; i < n * data.length; i++) {
    SST += (allYs[i] - ybb) * (allYs[i] - ybb);
  }
  for (let i = 0; i < data.length; i++) {
    let groupMean = d3.mean(data[i].yvals);
    SSM += (n * (groupMean - ybb) * (groupMean - ybb));
  }
  const SSE = SST - SSM;
  const R2 = SSM / SST
  return [SSE, SSM, SST, R2];
}

function precisionRound(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function generateData(x, groups, groupMeans, n, sigma) {
  const spacing = x(groups[1]) - x(groups[0]);
  const padding = spacing / 8;
  let data = [];
  for (let i = 0; i < groups.length; i++) {
    const start = x(groups[i]) + padding;
    const end = x(groups[i]) + spacing - padding;
    data.push({
      group: groups[i],
      groupMean: groupMeans[i],
      start: start,
      end: end,
      xvals: spreadEvenly(n, start, end),
      yvals: gaussianArray(n, groupMeans[i], sigma)
    });
  }
  return data;
}

function updateDataGroup(index) {
  const gm = data[index].groupMean;
  data[index].yvals = gaussianArray(n, gm, sigma);
}

function updateData() {
  for (let i = 0; i < data.length; i++) {
    updateDataGroup(i);
  }
}

function updateOutputs() {
  const [sse, ssm, sst, r2] = sumSquares(data);
  document.querySelector("#sse-value").innerHTML = precisionRound(sse, 2);
  document.querySelector("#ssm-value").innerHTML = precisionRound(ssm, 2);
  document.querySelector("#sst-value").innerHTML = precisionRound(sst, 2);
  document.querySelector("#r2-value").innerHTML = precisionRound(r2, 4);
}

function resampleHandler() {
  clearErrorLines();
  clearTreatmentLines();
  clearTotalLines();
  updateData();
  updateOutputs();
  drawAll(data);
}

function sigmaHandler() {
  clearErrorLines();
  clearTreatmentLines();
  clearTotalLines();
  sigma = parseFloat(this.value);
  document.querySelector("#sigmavalue")
    .innerHTML = `Sigma: ${sigma.toFixed(2)}`;
  updateData();
  updateOutputs();
  drawAll(data);
}

function clearTreatmentLines() {
  svgInside.selectAll(".yb-ybb").remove()
  svgInside.select("#ybbLine").remove()
  svgInside.selectAll(".point")
    .style("opacity", 1);
}

function clearErrorLines() {
  svgInside.selectAll(".point-yb").remove()
}

function clearTotalLines() {
  svgInside.selectAll(".point-ybb").remove()
  svgInside.select("#ybbLine").remove()
}

function groupMeansHandler() {
  clearTreatmentLines();
  clearTotalLines();
  clearErrorLines();
  svgInside.selectAll(".groupYbar")
    .classed("active", true)
    .classed("inactive", false);
  svgInside.selectAll(".groupMean")
    .classed("active", true)
    .classed("inactive", false);
  svgInside.selectAll(".groupMeanUse")
    .classed("active", true)
    .classed("inactive", false);
}

function sseHandler() {
  clearTreatmentLines();
  clearTotalLines();
  svgInside.selectAll(".groupYbar")
    .classed("active", true)
    .classed("inactive", false);
  svgInside.selectAll(".groupMeanUse")
    .classed("inactive", true);
  svgInside.selectAll(".groupMean")
    .classed("inactive", true);
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < n; j++) {
      addErrorLine(i, j);
    }
  }
}

function ssmHandler() {
  clearErrorLines();
  clearTotalLines();
  svgInside.selectAll(".point")
    .style("opacity", 0.3);
  svgInside.selectAll(".groupYbar")
    .classed("active", true)
    .classed("inactive", false);
  svgInside.selectAll(".groupMeanUse")
    .classed("inactive", true);
  svgInside.selectAll(".groupMean")
    .classed("inactive", true);
  const ybb = meanOfAll(data);
  svgInside.append("line")
    .attr("id", "ybbLine")
    .attr("x1", data[0].start)
    .attr("x2", data[data.length - 1].end)
    .attr("y1", y(ybb))
    .attr("y2", y(ybb))
    .attr("stroke", "red")
    .attr("stroke-width", 3)
    ;
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < n; j++) {
      addTreatmentLine(i, j);
    }
  } 
}

function sstHandler() {
  clearErrorLines();
  clearTreatmentLines();
  svgInside.selectAll(".groupYbar")
    .classed("active", false)
    .classed("inactive", true);
  svgInside.selectAll(".groupMeanUse")
    .classed("inactive", true);
  svgInside.selectAll(".groupMean")
    .classed("inactive", true);
  const ybb = meanOfAll(data);
  svgInside.append("line")
    .attr("id", "ybbLine")
    .attr("x1", data[0].start)
    .attr("x2", data[data.length - 1].end)
    .attr("y1", y(ybb))
    .attr("y2", y(ybb))
    .attr("stroke", "red")
    .attr("stroke-width", 3)
    ;
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < n; j++) {
      addTotalLine(i, j);
    }
  } 
}

function addErrorLine(i, j) {
  svgInside.append("line")
    .attr("class", "vertical")
    .classed("point-yb", true)
    .attr("x1", data[i].xvals[j])
    .attr("x2", data[i].xvals[j])
    .attr("y1", y(data[i].yvals[j]))
    .attr("y2", y(d3.mean(data[i].yvals)))
    ;
}

function addTreatmentLine(i, j) {
  svgInside.append("line")
    .attr("class", "vertical")
    .classed("yb-ybb", true)
    .attr("x1", data[i].xvals[j])
    .attr("x2", data[i].xvals[j])
    .attr("y1", y(d3.mean(data[i].yvals)))
    .attr("y2", y(meanOfAll(data)))
    ;
}

function addTotalLine(i, j) {
  svgInside.append("line")
    .attr("class", "vertical")
    .classed("point-ybb", true)
    .attr("x1", data[i].xvals[j])
    .attr("x2", data[i].xvals[j])
    .attr("y1", y(data[i].yvals[j]))
    .attr("y2", y(meanOfAll(data)))
    ;
}

function spreadEvenly(n, a, b) {
  const step = (b - a) / (n + 1);
  let arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(a + (i + 1) * step);
  }
  return arr;
}

function drawGroup(group) {
  const [dataGroup] = data.filter(elem => elem.group == group);
  drawInsideGroup(group);
  svgInside.selectAll(`[data-group=${group}]`).remove();
  const groupMeanLine = svgInside.append("line")
    .attr("class", "groupMeanUse")
    .attr("id", `groupMeanUse-${group}`)
    .attr("data-group", dataGroup.group)
    .attr("x1", dataGroup.start)
    .attr("x2", dataGroup.end)
    .attr("y1", y(dataGroup.groupMean))
    .attr("y2", y(dataGroup.groupMean))
    ;

  drawInsideGroup(group);

  const dragHandler = d3.drag().on("drag", function () {
    const okToMove = y.invert(d3.event.y) >= minAllowedGroupMean &&
      y.invert(d3.event.y) <= maxAllowedGroupMean;

    if (okToMove) {
      newGroupMean = y.invert(d3.event.y);
      const group = this.getAttribute("data-group");
      const index = groups.indexOf(group);
      data[index].groupMean = newGroupMean;
      updateDataGroup(index);

      this.setAttribute("y1", y(dataGroup.groupMean));
      this.setAttribute("y2", y(dataGroup.groupMean));
      d3.select(`#groupMean-${group}`).remove();
      drawInsideGroup(group);
      updateOutputs();
    }
  });

  dragHandler(groupMeanLine);
}

function drawInsideGroup(group) {
  const [dataGroup] = data.filter(elem => elem.group == group);
  const index = groups.indexOf(group);

  const groupMeanLine = svgInside.append("line")
    .attr("class", "groupMean")
    .attr("id", `groupMean-${group}`)
    .attr("data-group", dataGroup.group)
    .attr("x1", dataGroup.start)
    .attr("x2", dataGroup.end)
    .attr("y1", y(dataGroup.groupMean))
    .attr("y2", y(dataGroup.groupMean))
    ;

  svgInside.selectAll(`#groupYbarLine-${group}`)
    .remove()
  svgInside.append("line")
    .attr("class", "groupYbar")
    .attr("id", `groupYbarLine-${group}`)
    .attr("data-group", dataGroup.group)
    .attr("x1", dataGroup.start)
    .attr("x2", dataGroup.end)
    .attr("y1", y(d3.mean(dataGroup.yvals)))
    .attr("y2", y(d3.mean(dataGroup.yvals)))
    ;

  svgInside.selectAll(`.point[data-group=${group}]`)
    .remove()
  for (let j = 0; j < n; j++) {
    svgInside.append("circle")
      .attr("class", "point")
      .attr("data-group", dataGroup.group)
      .attr("r", 2)
      .attr("cx", dataGroup.xvals[j])
      .attr("cy", y(dataGroup.yvals[j]))
      ;
  }

}

function drawAll(data) {
  for (let i = 0; i < groups.length; i++) {
    const group = data[i].group;
    drawGroup(group);
  }
  svgInside.selectAll(".groupMeanUse")
    .classed("active", true);
}

// Slider ............................................

const slider = document.querySelector('#sigma');
rangeSlider.create(slider, {
    polyfill: true,     // 
    rangeClass: 'rangeSlider',
    disabledClass: 'rangeSlider--disabled',
    fillClass: 'rangeSlider__fill',
    bufferClass: 'rangeSlider__buffer',
    handleClass: 'rangeSlider__handle',
    startEvent: ['mousedown', 'touchstart', 'pointerdown'],
    moveEvent: ['mousemove', 'touchmove', 'pointermove'],
    endEvent: ['mouseup', 'touchend', 'pointerup'],
    vertical: false,    // Boolean, 
    min: 0,          // Number , 0
    max: maxSigma,          // Number, 100
    step: 0.1,         // Number, 1
    value: sigma,        // Number, center of slider
    buffer: null,       // Number, in percent, 0 by default
    stick: null,        // [Number stickTo, Number stickRadius] 
    borderRadius: 10,   // Number, 
    onInit: function () {
        console.info('onInit')
    }
  //   ,
  //   onSlideStart: function (position, value) {
  //       console.info('onSlideStart', 'position: ' + position, 'value: ' + value);
  //   },
  //   onSlide: function (position, value) {
  //     console.warn('onSlideEnd', 'position: ' + position, 'value: ' + value);
  // },
  //   onSlideEnd: function (position, value) {
  //       console.warn('onSlideEnd', 'position: ' + position, 'value: ' + value);
  //   }
});

let triggerEvents = true; // or false
slider.rangeSlider.update({
  min : 0, max : 5, step : 0.1, value : 2.5, 
  buffer : null}, triggerEvents);

// function valueOutput(element) {
//     console.log("hello");
//     const value = element.value,
//       output = element.parentNode.getElementsByTagName('output')[0];
//     output.innerHTML = value;
// }

// document.querySelector("[data-rangeSlider]")
//   .addEventListener('input', function (e) {
//     valueOutput(e.target);
//   }, false);


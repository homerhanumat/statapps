
const d3 = require("./d3.min.js");

let sigma = 1, n = 10;
  
  const data = [
    {
      group: "a",
      groupMean: 5,
      yvals: gaussianArray(10, 5, sigma)
    },
    {
      group: "b",
      groupMean: 10,
      yvals: gaussianArray(10, 10, sigma)
    },
    {
      group: "c",
      groupMean: 15,
      yvals: gaussianArray(10, 15, sigma)
    }
  ];

  console.log(sumSquares(data));
  
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
      let x = mu+ sigma * u;
      let y = mu+ sigma * v;
      data.push(x);
      if (data.length < n) data.push(y);
    }
    return data;
  }

  function sumSquares(data) {
    let SSM = 0, SST = 0;
    const N = n * data.length;
    let allYs = [];
    data.forEach(group => {
      allYs = allYs.concat(group.yvals);
    });
    const ybb = d3.mean(allYs);
    SST = allYs.reduce((acc, y) => acc + (y - ybb) * (y - ybb));
    for (let i = 0; i < data.length; i++) {
      let groupMean = d3.mean(data[i].yvals);
      SSM += n * (groupMean - ybb) * (groupMean - ybb);
    }
    const SSE = SST - SSM;
    const R2 = SSM / SST
    return [SSE, SSM, SST, R2];
  }
function gaussian(a, b) {
  return {
      u: Math.sqrt(-2 * Math.log(a)) * Math.cos(2*Math.PI*b),
      v: Math.sqrt(-2 * Math.log(a)) * Math.sin(2*Math.PI*b)
    };
}

function bvn(n = 200, rho = 0.5, mu1 = 0, sigma1 = 1, 
  mu2 = 0, sigma2 = 1) {
    let data = [];
  for (let i = 0; i < n; i++) {
    //generate two independent normals (box-muller)
    let u1 = Math.random();
    let u2 = Math.random();
    let {u, v} = gaussian(u1, u2);
    let x = mu1 + sigma1 * u;
    let sdY = Math.sqrt((1 - Math.pow(rho, 2)) * Math.pow(sigma2, 2));
    let y = mu2 + (sigma2/sigma1) * rho * (u - mu1) + sdY * v;
    data.push({x: x, y: y});
  }
  return data;
}

let data = bvn(n = 20);
console.log(data);



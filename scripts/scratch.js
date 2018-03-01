let factor = 3;

function multiplier(factor) {
  return function(number) {
    console.log(`About to multiply ${number} by ${factor}`);
    return number * factor;
  };
}

const double = multiplier(2);
// -> the binding of factor in the global Environment
// will be masked, so should tell us that
// the new function will multipliy by 2

// check to be sure:
console.log(double(5));
// -> 10

function report() {
  console.log(`factor is ${this(5)}`);
}

console.log(report.call(double));
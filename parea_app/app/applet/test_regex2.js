const fs = require('fs');
let s = "{t(`{event.groupDiscount.percentage}{t(`% ΕΚΠΤΩΣΗ`, `% ΕΚΠΤΩΣΗ`)}`, `...`)}";

while(true) {
  let prev = s;
  s = s.replace(/t\(`([^`]*)`,\s*`([^`]*)`\)/g, '$1');
  if(prev === s) break;
}
console.log(s);

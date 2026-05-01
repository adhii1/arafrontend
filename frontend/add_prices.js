const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

let parts = html.split(/(<!-- SMALL BOX -->|<!-- DHOOP CONES -->|<!-- ORDER -->)/);

parts[0] = parts[0].replace(/<h3>(.*?)<\/h3>/g, '<h3>$1</h3>\n                <p class="price">₹ 250</p>');
parts[2] = parts[2].replace(/<h3>(.*?)<\/h3>/g, '<h3>$1</h3>\n                <p class="price">₹ 189</p>');
parts[4] = parts[4].replace(/<h3>(.*?)<\/h3>/g, '<h3>$1</h3>\n                <p class="price">₹ 189</p>');

fs.writeFileSync('index.html', parts.join(''));

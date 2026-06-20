const fs = require('fs');

const fix = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'cote d'ivoire'/g, "'cote d\\'ivoire'");
  content = content.replace(/'côte d'ivoire'/g, "'côte d\\'ivoire'");
  fs.writeFileSync(file, content);
};

fix('backend/src/routes/users.js');
fix('backend/src/routes/eleves.js');
console.log('Fixed syntax error');

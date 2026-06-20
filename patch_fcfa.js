const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function getComponentBodyIndex(content) {
  // Try to find the start of the main component function body
  const regex = /export default function [A-Za-z0-9_]+\s*\([^)]*\)\s*\{/g;
  const match = regex.exec(content);
  if (match) return match.index + match[0].length;

  const regex2 = /const [A-Za-z0-9_]+\s*=\s*\([^)]*\)\s*=>\s*\{/g;
  const match2 = regex2.exec(content);
  if (match2) return match2.index + match2[0].length;

  return -1;
}

function processDirectory(dirPath, depth = 1) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath, depth + 1);
    } else if (fullPath.endsWith('.jsx')) {
      // Exclude Public pages for now
      if (fullPath.includes('Public')) continue;

      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Only process if FCFA is present
      if (content.includes('FCFA')) {
        changed = true;

        // Ensure useContext and AuthContext are imported
        if (!content.includes('AuthContext')) {
          const authPath = depth === 1 ? '../context/AuthContext' : '../../context/AuthContext';
          content = `import { AuthContext } from '${authPath}';\n` + content;
        }
        if (!content.includes('useContext')) {
          if (content.includes("from 'react'")) {
            content = content.replace(/import React, {/, 'import React, { useContext,');
            if (content === content.replace(/import React, { useContext,/, '')) { // If it didn't replace, meaning it might be import { useState }
               content = content.replace(/import {/, 'import { useContext,');
            }
          } else {
            content = `import { useContext } from 'react';\n` + content;
          }
        }

        // Insert currency extraction in the component
        const bodyIndex = getComponentBodyIndex(content);
        if (bodyIndex !== -1 && !content.includes('const currency =')) {
          const insertStr = `\n  const { user } = useContext(AuthContext);\n  const currency = user?.currency || 'XAF';\n`;
          content = content.slice(0, bodyIndex) + insertStr + content.slice(bodyIndex);
        }

        // Replace FCFA in strings and JSX
        content = content.replace(/FCFA/g, '${currency}'); // This handles template literals
        // But what about JSX text like `1000 FCFA`?
        // We'll fix JSX text explicitly if needed, but in React, we can't just put `${currency}` outside a string or curly brace.
        // Actually, let's do a more robust replace:
        // `} FCFA` -> `} {currency}`
        content = content.replace(/\}\s*\$\{currency\}/g, '} {currency}');
        content = content.replace(/\}\s*\\\$\{currency\}/g, '} {currency}'); // In case of escaping
        
        // Fix some manual cases
        content = content.replace(/Montant \(\$\{currency\}\)/g, 'Montant ({currency})');
        content = content.replace(/Scolarité Globale \(\$\{currency\}\)/g, 'Scolarité Globale ({currency})');
        content = content.replace(/Taux Horaire \(\$\{currency\}\/h\)/g, 'Taux Horaire ({currency}/h)');
        content = content.replace(/Amount \(\$\{currency\}\)/g, 'Amount ({currency})');

        // JSX strings like: >35 000 FCFA< -> >35 000 {currency}<
        content = content.replace(/>([^<]*)\$\{currency\}([^<]*)</g, '>$1{currency}$2<');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched FCFAs in:', fullPath);
      }
    }
  }
}

processDirectory(path.join(srcDir, 'pages'));

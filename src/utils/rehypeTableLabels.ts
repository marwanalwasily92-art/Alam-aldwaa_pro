import { visit } from 'unist-util-visit';

// Custom rehype plugin to add data-label to td elements based on th headers
export const rehypeTableLabels = () => {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'table') {
        let headers: string[] = [];
        
        // Find thead -> tr -> th
        const thead = node.children.find((c: any) => c.tagName === 'thead');
        if (thead) {
          const tr = thead.children.find((c: any) => c.tagName === 'tr');
          if (tr) {
            headers = tr.children
              .filter((c: any) => c.tagName === 'th')
              .map((th: any) => {
                const getText = (n: any): string => {
                  if (n.type === 'text') return n.value;
                  if (n.children) return n.children.map(getText).join('');
                  return '';
                };
                return getText(th).trim();
              });
          }
        }
        
        // Now find tbody -> tr -> td and add data-label
        const tbody = node.children.find((c: any) => c.tagName === 'tbody');
        if (tbody) {
          tbody.children.filter((c: any) => c.tagName === 'tr').forEach((tr: any) => {
            let colIndex = 0;
            tr.children.filter((c: any) => c.tagName === 'td').forEach((td: any) => {
              if (headers[colIndex]) {
                td.properties = td.properties || {};
                td.properties['dataLabel'] = headers[colIndex];
              }
              colIndex++;
            });
          });
        }
      }
    });
  };
};

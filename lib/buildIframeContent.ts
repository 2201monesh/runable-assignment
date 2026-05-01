export function buildIframeContent(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; }
    .ve-hovered { outline: 2px dashed rgba(124, 109, 240, 0.6) !important; outline-offset: 2px; }
    .ve-selected { outline: 2px solid #7c6df0 !important; outline-offset: 2px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    const __comp = typeof GeneratedComponent !== 'undefined' ? GeneratedComponent
      : typeof MyComponent !== 'undefined' ? MyComponent
      : typeof App !== 'undefined' ? App
      : typeof Component !== 'undefined' ? Component
      : null;
    if (__comp) {
      ReactDOM.render(React.createElement(__comp), document.getElementById('root'));
    }
  </script>
  <script>
    setTimeout(function() {
      try {
      function getXPath(el) {
        if (el === document.body) return '/html/body';
        var ix = 0;
        var siblings = el.parentNode ? el.parentNode.childNodes : [];
        for (var i = 0; i < siblings.length; i++) {
          var sib = siblings[i];
          if (sib === el) return getXPath(el.parentNode) + '/' + el.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          if (sib.nodeType === 1 && sib.tagName === el.tagName) ix++;
        }
      }

      function getStyles(el) {
        var cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          padding: cs.paddingTop,
          borderRadius: cs.borderRadius,
          textAlign: cs.textAlign,
          width: el.style.width || 'auto',
          borderWidth: cs.borderTopWidth,
          borderColor: cs.borderTopColor
        };
      }

      var TEXT_TAGS = ['h1','h2','h3','h4','h5','h6','p','span','a','button','label','li'];
      var selectedXPath = null;

      document.querySelectorAll('body *').forEach(function(el) {
        el.style.cursor = 'pointer';

        el.addEventListener('mouseover', function(e) {
          e.stopPropagation();
          if (el.classList.contains('ve-selected')) return;
          document.querySelectorAll('.ve-hovered').forEach(function(h) { h.classList.remove('ve-hovered'); });
          el.classList.add('ve-hovered');
        });

        el.addEventListener('mouseout', function(e) {
          e.stopPropagation();
          el.classList.remove('ve-hovered');
        });

        el.addEventListener('click', function(e) {
          e.stopPropagation();
          e.preventDefault();
          document.querySelectorAll('.ve-selected').forEach(function(s) { s.classList.remove('ve-selected'); });
          el.classList.remove('ve-hovered');
          el.classList.add('ve-selected');
          var xpath = getXPath(el);
          selectedXPath = xpath;
          var tag = el.tagName.toLowerCase();
          var text = '';
          if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
            text = el.textContent.trim();
          }
          window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            tag: tag,
            text: text,
            isTextElement: TEXT_TAGS.includes(tag),
            styles: getStyles(el),
            xpath: xpath
          }, '*');
        });
      });

      function buildTree(el, depth) {
        var result = [];
        if (el.nodeType !== 1) return result;
        var tag = el.tagName.toLowerCase();
        if (['script','style','head'].includes(tag)) return result;
        var text = '';
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
          text = el.textContent.trim().slice(0, 30);
        }
        result.push({ tag: tag, depth: depth, xpath: getXPath(el), text: text });
        Array.from(el.children).forEach(function(child) {
          result = result.concat(buildTree(child, depth + 1));
        });
        return result;
      }

      var root = document.getElementById('root');
      if (root) {
        window.parent.postMessage({ type: 'DOM_TREE', tree: buildTree(root, 0) }, '*');
      }
      } catch(err) {
        window.parent.postMessage({ type: 'RENDER_ERROR', message: err.message }, '*')
      }
    }, 800);

    function getElementByXPath(xpath) {
      try {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } catch(e) { return null; }
    }

    window.addEventListener('message', function(e) {
      if (e.data.type === 'APPLY_STYLE') {
        var el = getElementByXPath(e.data.xpath);
        if (!el) return;
        var styles = e.data.styles || {};
        Object.keys(styles).forEach(function(prop) {
          el.style[prop] = styles[prop];
        });
        if (e.data.text !== undefined) {
          var textNodes = Array.from(el.childNodes).filter(function(n) { return n.nodeType === 3; });
          if (textNodes.length > 0) {
            textNodes[0].textContent = e.data.text;
          } else if (el.children.length === 0) {
            el.textContent = e.data.text;
          }
        }
      }
      if (e.data.type === 'SELECT_BY_XPATH') {
        var el = getElementByXPath(e.data.xpath);
        if (el) el.click();
      }
    });
  </script>
</body>
</html>`
}

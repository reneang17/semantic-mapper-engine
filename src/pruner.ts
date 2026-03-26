import * as cheerio from 'cheerio';

export function pruneHtml(html: string): string {
  const $ = cheerio.load(html);

  // 1. Remove unnecessary tags aggressively
  $('script, style, svg, iframe, noscript, meta, link, video, audio, canvas').remove();

  // 2. Remove hidden elements
  $('*').each((_, el) => {
    const style = $(el).attr('style') || '';
    if (
      style.includes('display: none') || 
      style.includes('display:none') || 
      style.includes('visibility: hidden') || 
      style.includes('visibility:hidden') ||
      $(el).attr('hidden') !== undefined
    ) {
      $(el).remove();
    }
  });

  // 3. Strip attributes to only the allowed ones
  const allowedAttributes = ['id', 'class', 'href', 'name', 'role', 'aria-label', 'placeholder', 'data-testid', 'type', 'value', 'autocomplete', 'maxlength'];
  $('*').each((_, el) => {
    if (el.type === 'tag') {
      const attributes = Object.keys(el.attribs || {});
      for (const attr of attributes) {
        if (!allowedAttributes.includes(attr)) {
          $(el).removeAttr(attr);
        }
      }
    }
  });

  // 4. Prune the DOM tree: Remove any tag that isn't interactive, isn't an immediate parent, isn't a form/nav,
  // AND doesn't have interactive children. This strictly isolates interactives inside their valid context.
  const interactives = 'button, a, input, select, textarea';
  
  let changed = true;
  while(changed) {
    changed = false;
    $('*').each((_, el) => {
      if (el.type === 'tag') {
        const $el = $(el);
        if ($el.is('body, html, head')) return; // keep root structure
        
        const isInteractive = $el.is(interactives);
        const hasInteractiveChild = $el.find(interactives).length > 0;
        const isContext = $el.is('form, nav');
        
        // Ensure immediate parents of interactives are preserved
        let isImmediateParent = false;
        $el.children().each((__, child) => {
            if ($(child).is(interactives)) {
                isImmediateParent = true;
            }
        });

        if (!isInteractive && !hasInteractiveChild && !isContext && !isImmediateParent) {
            $el.remove();
            changed = true;
        }
      }
    });
  }

  // To truly minify, replacing multiple whitespaces/newlines with single ones
  const finalHtml = $('body').html() || $.html();
  return finalHtml.replace(/\s{2,}/g, ' ').replace(/\n/g, '').trim();
}

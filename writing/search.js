// Progressive enhancement: without JavaScript, the complete public list remains readable.
const section = document.querySelector('.search');
const input = document.getElementById('writing-search');
if (section && input) {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
  const posts = Array.from(document.querySelectorAll('[data-post]'), element => ({
    element,
    text: normalize(element.textContent),
  }));
  const status = document.getElementById('search-status');
  const empty = document.getElementById('search-empty');
  function search() {
    const terms = normalize(input.value).split(' ').filter(Boolean);
    let count = 0;
    for (const post of posts) {
      const matches = terms.every(term => post.text.includes(term));
      post.element.hidden = !matches;
      if (matches) count++;
    }
    status.textContent = terms.length
      ? `${count} of ${posts.length} published posts found.`
      : `${posts.length} published ${posts.length === 1 ? 'post' : 'posts'}.`;
    empty.hidden = !terms.length || count > 0 || posts.length === 0;
  }
  input.addEventListener('input', search);
  document.getElementById('clear-search').addEventListener('click', () => {
    input.value = '';
    search();
    input.focus();
  });
  section.hidden = false;
  search();
}
